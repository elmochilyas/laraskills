# Skill: Dedicate Read Replicas by Workload Type

## Purpose

Provision separate read replicas for different workload classes (reporting, analytics, search indexing) to prevent heavy queries from degrading user-facing read performance.

## When To Use

- Reporting/analytics queries consume significant CPU or IOPS
- User-facing query latency degrades during batch report execution
- Search indexing reads scan large tables
- BI tools (Tableau, Metabase) connect directly to the database

## When NOT To Use

- Application query volume is low
- All queries are light (<100ms, low resource usage)
- Replicas are already oversized for peak load

## Prerequisites

- At least 2 replicas available for workload separation
- Workload profiling: which queries are heavy, which are user-facing
- Database connection configuration supports multiple named connections

## Inputs

- Query profiling data (top N queries by CPU, IOPS, duration)
- Workload classification: user-facing, reporting, analytics, search indexing
- Replica count and capacity

## Workflow (numbered steps)

1. Profile database queries: identify heavy consumers (aggregations, full scans, complex joins)
2. Classify workloads: user-facing (low latency), reporting (batch), analytics (BI tools), search indexing
3. Map each class to a dedicated replica connection in Laravel:
   ```php
   'mysql_reporting' => ['read' => ['host' => 'reporting-replica'], ...]
   'mysql_analytics' => ['read' => ['host' => 'analytics-replica'], ...]
   ```
4. Size each replica according to workload requirements (reporting: high CPU, analytics: high storage, user-facing: balanced)
5. Update application code: use `DB::connection('mysql_reporting')` for reports
6. Configure BI tools to connect to analytics replica connection string
7. Monitor per-replica resource utilization and adjust sizing

## Validation Checklist

- [ ] User-facing query latency is stable during report execution
- [ ] Reporting replica CPU utilization stays below 80% during heavy aggregation
- [ ] Analytics replica has sufficient storage for BI tool queries
- [ ] All application connections use correct named connection for their workload
- [ ] No heavy queries leak into user-facing replicas

## Common Failures

- Heavy queries accidentally run on user-facing replica (code review miss)
- Replica sizing mismatch: reporting needs more CPU than allocated
- Application code uses default connection for everything (no workload separation)
- BI tool connects to user-facing replica, causing latency spikes

## Decision Points

- Number of dedicated replicas: depends on workload diversity and budget
- Replica sizing per workload: reporting (2-4x CPU), analytics (more storage), search (high IOPS)
- Dedicated vs shared: shared replica for low-volume workloads, dedicated for high-volume

## Performance Considerations

- User-facing replica stays responsive: no resource contention with heavy queries
- Reporting replica can run at 100% CPU without impacting users
- Search indexing replica can perform large scans without cache eviction on user-facing replicas

## Security Considerations

- Analytics replica may have more permissive access (BI tools) — restrict with firewall
- Reporting replica should have same access controls as user-facing replicas
- Audit connections to each replica to ensure correct workload mapping

## Related Rules

- 7-15-1: Never Run Heavy Workloads on User-Facing Replicas
- 7-15-2: Always Profile Workloads Before Dedicating Replicas

## Related Skills

- Size Read Replicas by Workload
- Configure Laravel Read/Write Connections
- Monitor Replica Resource Utilization

## Success Criteria

- User-facing query latency: p99 < 100ms during batch report execution
- Reporting queries complete within expected SLA
- No resource contention between workload classes

---

# Skill: Configure Named Database Connections for Workload-Specific Replicas

## Purpose

Create separate Laravel database connections that point to workload-dedicated read replicas, enabling application code to explicitly choose the right replica for each query type.

## When To Use

- Dedicated replicas exist per workload (reporting, analytics, search)
- Application code needs explicit routing to correct replica
- Different workloads have different replica sizing

## When NOT To Use

- Single replica for all workloads
- Automatic read/write splitting is sufficient

## Prerequisites

- Dedicated replicas provisioned per workload
- Replica DNS/hostname available
- Laravel database.php configuration access

## Inputs

- Replica hostnames per workload
- Replica credentials (if different from default)
- Workload-specific connection options (timeout, charset, etc.)

## Workflow (numbered steps)

1. In `config/database.php`, add new connection for each workload replica:
   ```php
   'mysql_reporting' => [
       'driver' => 'mysql',
       'read' => ['host' => ['reporting-replica.cluster-xxx.us-east-1.rds.amazonaws.com']],
       'write' => ['host' => ['primary.cluster-xxx.us-east-1.rds.amazonaws.com']],
       'database' => env('DB_DATABASE'),
       'username' => env('DB_USERNAME'),
       'password' => env('DB_PASSWORD'),
   ],
   ```
2. Name each connection after its workload: `mysql_user_facing`, `mysql_reporting`, `mysql_analytics`
3. Update application code: `DB::connection('mysql_reporting')->select(...)`
4. Use Laravel's `DB::connection()` in service classes that perform heavy queries
5. Configure separate pool sizes per connection for Octane (if applicable)

## Validation Checklist

- [ ] Each workload connection points to its dedicated replica
- [ ] All heavy query calls updated to use correct connection
- [ ] Default connection unchanged for user-facing queries
- [ ] Octane pool config per connection (if applicable)
- [ ] No hardcoded connection names in business logic

## Common Failures

- Typo in connection name → runtime error
- Heavy queries still use default connection (missed during code update)
- Connection credentials differ per replica but config is shared
- Pool size for dedicated connection too small for reporting batch jobs

## Decision Points

- Number of connections: one per distinct workload class
- Replica group: dedicated connection vs hostgroup in ProxySQL
- Naming convention: `mysql_<workload>` for consistency

## Performance Considerations

- Named connections add zero overhead — they're resolved at config load time
- Allows independent pool tuning per workload
- Reporting connection batch queries won't block user-facing pool

## Security Considerations

- Replica credentials must be stored in environment variables, not hardcoded
- Analytics replica may need different user (read-only) for BI tools
- Audit all connections to ensure least privilege per workload

## Related Rules

- 7-15-3: Always Name Connections After Their Workload

## Related Skills

- Dedicate Read Replicas by Workload Type
- Configure Laravel Read/Write Connections

## Success Criteria

- Each named connection routes to its designated replica
- Zero heavy queries on user-facing replicas (verified via monitoring)
- Connection errors: zero from misconfigured names
