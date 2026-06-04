---
## Rule Name
Optimize Queries and Cache Before Adding Read Replicas

## Category
Performance

## Rule
Always optimize slow queries and add application-level caching before deploying read replicas. A read replica should be a last resort, not a first response.

## Reason
A single missing index can cause 80% of database load. Adding a replica costs $50-500/month. Fixing the query costs $0. Replicas mask the symptom, not the cause.

## Bad Example
Database CPU at 80% from a single unindexed query. Team adds a read replica ($200/month) instead of identifying and indexing the query. CPU stays high on primary.

## Good Example
Database CPU at 80%. Team identifies the slow query via Performance Insights, adds a composite index, CPU drops to 25%. No replica needed. Saved $200/month.

## Exceptions
When the database CPU is from genuinely high read volume (not inefficiency) and caching has been exhausted.

## Consequences Of Violation
Paying $50-500/month per replica to mask query inefficiency. Adding replicas increases complexity without addressing root causes.

---
## Rule Name
Use Aurora Readers Over RDS Replicas for Read Scaling

## Category
Architecture

## Rule
For read scaling, prefer Aurora reader instances over RDS read replicas. Aurora readers share storage and can use smaller instance types.

## Reason
RDS replicas cost 100% of the primary (compute + storage). Aurora readers have no storage cost and can be smaller instances, reducing replica cost by 30-50%.

## Bad Example
Adding an RDS MySQL read replica of the same instance class. Cost doubles: $500/month primary + $500/month replica = $1000/month.

## Good Example
Using Aurora with a smaller reader instance (r7g.large vs r7g.xlarge writer). Cost: $500/month writer + $250/month reader = $750/month.

## Exceptions
When your application requires features not available in Aurora (e.g., certain MySQL plugins) and must use RDS.

## Consequences Of Violation
Paying 2x for read capacity when Aurora readers would cost 1.3-1.5x. Over multiple replicas, this compounds to thousands per year.

---
## Rule Name
Implement Read/Write Splitting in Laravel

## Category
Architecture

## Rule
Configure separate `read` and `write` connections in `config/database.php` when using read replicas. Use Laravel's native read/write splitting.

## Reason
Without read/write splitting, all queries go to the primary. The replica runs idle while the primary bears all load. Laravel's built-in splitting requires zero application changes.

## Bad Example
Read replica deployed. `config/database.php` unchanged. All SELECT queries still hit the primary. Replica costs $200/month doing nothing.

## Good Example
```php
'mysql' => [
    'read' => ['host' => env('DB_READ_HOST', 'replica.cluster...')],
    'write' => ['host' => env('DB_WRITE_HOST', 'primary.cluster...')],
    'sticky' => true,
    // ...
],
```
SELECTs go to replica, INSERTs/UPDATEs go to primary.

## Exceptions
When using Aurora with an Aurora reader endpoint (Aurora handles read/write distribution at the cluster level).

## Consequences Of Violation
Read replica runs idle while the primary remains overloaded. The replica cost is completely wasted.

---
## Rule Name
Monitor Replication Lag With CloudWatch Alarm

## Category
Reliability

## Rule
Create a CloudWatch alarm on `ReplicaLag` at 5 seconds for RDS replicas and 2 seconds for Aurora readers. Alert the on-call engineer when breached.

## Reason
Excessive replication lag means the replica serves stale data. Without monitoring, lag can silently grow to minutes, serving incorrect data to users.

## Bad Example
Replica lag at 30 seconds. Users see stale order statuses. Nobody notices because there is no ReplicaLag alarm.

## Good Example
CloudWatch alarm on ReplicaLag > 5s. When a large transaction causes lag to spike, on-call is notified. Investigation reveals the need to increase replica instance size.

## Exceptions
Deliberately asynchronous read replicas used for reporting where 5+ minutes of lag is acceptable.

## Consequences Of Violation
Users are served stale data without the engineering team's knowledge. Application-level consistency bugs emerge.

---
## Rule Name
Scale Down Replica Instance Size for Aurora Readers

## Category
Cost Management

## Rule
Provision Aurora reader instances at 50-70% of the writer instance size. Only scale up readers if monitoring shows CPU or connection pressure.

## Reason
Aurora's shared storage enables readers to have smaller compute. A reader handling only SELECT queries typically needs less CPU and memory than the writer.

## Bad Example
Writer and all 3 readers provisioned as r7g.xlarge. Each reader costs $400/month. Readers average 20% CPU while writer runs at 60%.

## Good Example
Writer: r7g.xlarge ($400/month). 3 Readers: r7g.large ($250/month each). Total: $1150/month vs $1600/month. 28% savings with no performance impact.

## Exceptions
When readers serve heavy analytical queries or reporting workloads that need as much memory as the writer.

## Consequences Of Violation
Paying 30-50% more for reader compute than necessary. For 3 readers, this is $450+/month in unnecessary spend.

---
## Rule Name
Use Cross-Region Replicas for Disaster Recovery Only

## Category
Reliability

## Rule
Provision cross-region read replicas exclusively for disaster recovery and compliance. Do not route production read traffic to cross-region replicas.

## Reason
Cross-region replicas incur data transfer costs ($0.02/GB) and have higher replication lag (1-5 seconds). Using them for active read traffic adds cost and complexity.

## Bad Example
Routing 20% of read traffic to a cross-region replica in eu-west-1. Monthly data transfer: $200. Replication lag: 2 seconds. Occasional stale data served.

## Good Example
Cross-region replica in eu-west-1 for DR only. All production reads served by same-region replicas. No data transfer cost. Lag monitored but traffic never reads from it.

## Exceptions
When application requires low-latency reads for users distributed globally and same-region read replicas have been deployed in each region.

## Consequences Of Violation
Unnecessary cross-region data transfer costs. Higher latency for reads. Risk of serving stale data during normal operation.
