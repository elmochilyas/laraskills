# 7-19 Rds Proxy Aurora - Decision Trees

## Connection Multiplexing Strategy

---

## Decision Context

Choosing between RDS Proxy (connection multiplexing, IAM auth, transparent failover) and direct Aurora connections for managing database connections in AWS.

---

## Decision Criteria

* performance: RDS Proxy adds 1-5ms per connection (not per query); reduces Aurora CPU by 30-50% under high connection counts
* architectural: RDS Proxy is a managed AWS service; direct connections are simpler but don't multiplex
* maintainability: RDS Proxy eliminates connection storms and provides transparent failover

---

## Decision Tree

Application uses AWS Lambda or other serverless compute?

YES → Use RDS Proxy

    ↓
    Lambda cold starts create many connections
    RDS Proxy multiplexes → Aurora sees few connections
    
    ↓
    Benefits:
    - Prevents connection storms during traffic spikes
    - Eliminates Lambda cold start connection latency (<20ms)
    - Reduces Aurora CPU by 30-50%
    
    ↓
    Cost: ~$15-20/month per RDS Proxy instance
    Worth it for any serverless database workload

NO → Application runs on persistent servers (EC2, ECS, EKS)?

    ↓
    High concurrent connections (>200)?
    
    YES → Use RDS Proxy
        
        ↓
        Many web workers create many short-lived connections
        RDS Proxy multiplexes to a smaller Aurora pool
        Connection count stays well below max_connections

NO → Low-to-moderate concurrent connections (<100)?

    ↓
    Need transparent failover?
    
    YES → Use RDS Proxy
        
        ↓
        RDS Proxy detects primary failover
        Reconnects app to new primary transparently
        Zero application-side failover code

NO → Simple deployment, low connections, acceptable failover impact?

    → Direct Aurora connections sufficient
    RDS Proxy cost may not be justified
    Monitor: if connections exceed 100, add RDS Proxy later

---

## Recommended Default

**Default:** Use RDS Proxy when connections > 100 or serverless compute is used; direct connections for small deployments
**Reason:** RDS Proxy provides connection multiplexing, IAM auth, and transparent failover. Its $15-20/month cost is justified for all but the smallest deployments.

---

## Pool Sizing and Authentication

---

## Decision Context

Choosing between IAM authentication (no database passwords in config) and Secrets Manager (compatible with non-IAM apps) for RDS Proxy authentication, and determining optimal pool sizing.

---

## Decision Criteria

* performance: IAM auth adds no latency vs password auth
* architectural: IAM auth eliminates password management; Secrets Manager supports password rotation
* maintainability: IAM auth is simpler (no rotation needed); Secrets Manager requires secret management

---

## Decision Tree

Authentication method:

↓

Can application use IAM database authentication?

YES → Use IAM authentication

    ↓
    Pro: No database passwords in application config
    Pro: No password rotation needed
    Pro: Uses IAM roles (Lambda, EC2 instance profiles)
    
    ↓
    Configure: RDS Proxy IAM auth role + DB user with rds_iam

NO → Application requires traditional password auth?

    → Use Secrets Manager
    Store DB credentials in AWS Secrets Manager
    RDS Proxy retrieves credentials automatically
    Secrets Manager rotates passwords on schedule

Pool sizing:

↓

Expected concurrent application connections?

↓

≤1000 → pool max = 80% of Aurora max_connections

    ↓
    Start with max_connections * 0.8
    idle_timeout = 10 minutes
    
    ↓
    Prevents RDS Proxy from exhausting Aurora connections
    Monitors: queued requests — if > 0, increase pool

>1000 → pool max = 50% of Aurora max_connections

    ↓
    Higher connection count needs more aggressive multiplexing
    idle_timeout = 5 minutes (faster release)
    Monitor: queue depth, connection wait time

---

## Recommended Default

**Default:** IAM authentication for serverless/workloads; Secrets Manager for traditional apps. Pool sizing at 80% of Aurora max_connections.
**Reason:** IAM auth eliminates password management complexity. Pool sizing at 80% leaves headroom for administrative connections.

---

## Related Rules

* Rule 7-19-1: Always Use RDS Proxy with Lambda Database Connections
* Rule 7-19-2: Prefer IAM Authentication Over Database Passwords
* Rule 7-19-3: Always Set Minimum Replicas > 0 for Auto Scaling

---

## Related Skills

* Configure RDS Proxy for Aurora Connection Management
* Configure Aurora Auto Scaling with RDS Proxy
