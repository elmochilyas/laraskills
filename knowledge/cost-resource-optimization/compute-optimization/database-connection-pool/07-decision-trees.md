# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Database Connection Pool
**Generated:** 2026-06-03

---

# Decision Inventory

1. Connection Pooler Selection (RDS Proxy vs PgBouncer)
2. Connection Pool Size Configuration
3. Pool Utilization Monitoring Strategy

---

# Architecture-Level Decision Trees

---

## Decision Name: Connection Pooler Selection (RDS Proxy vs PgBouncer)

---

## Decision Context

Choose pooler based on database engine and operational capacity.

---

## Decision Criteria

cost, performance, maintenance

---

## Decision Tree

Database engine?

MySQL/Aurora -> RDS Proxy (-30/month, managed, IAM auth)
PostgreSQL -> PgBouncer (free, t4g.nano ~/month)

Operational capacity?
Fully managed -> RDS Proxy (zero maintenance)
Cost-sensitive -> PgBouncer ( vs -30/month)

IAM authentication needed?
YES -> RDS Proxy (native IAM, 15-min credentials)
NO -> Either works

Connection count?
< 100 -> Pooler may not be needed if max_connections sufficient
> 100 -> Pooler definitely required

---

## Rationale

RDS Proxy is fully managed (-30/month) but MySQL/Aurora-only. PgBouncer is free but needs a t4g.nano instance (/month) and is PostgreSQL-only.

---

## Recommended Default

**Default:** RDS Proxy for Aurora/MySQL; PgBouncer for PostgreSQL

---

## Risks Of Wrong Choice

No pooler with >100 PHP-FPM workers causes 'too many connections' errors during traffic spikes.

---

## Related Rules

Rule: Follow standardized Database Connection Pool practices

---

## Related Skills

Analyze and Optimize Database Connection Pool

---

---

## Decision Name: Connection Pool Size Configuration

---

## Decision Context

Set optimal pool size based on database vCPUs and workload.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Database vCPU count?

2 vCPU -> Pool size = 4-6 (2-3x vCPUs)
4 vCPU -> Pool size = 8-12
8 vCPU -> Pool size = 16-24

Pool mode (PgBouncer)?
App uses SET/temp tables -> Session pooling
No session state -> Transaction pooling (efficient)

Read/write splitting?
YES -> Writer pool = 2-3x vCPUs, Reader pool = 4-6x vCPUs
NO -> Single pool size = 2-3x vCPUs

Monitoring?
Alarm at 80% pool capacity
Investigate sustained 90%+ utilization

---

## Rationale

Database processes connections with ~2x vCPU overhead. More connections than this causes DB context switching. Fewer wastes slots.

---

## Recommended Default

**Default:** Pool size = 2-3x DB vCPUs; transaction pooling for PostgreSQL; alarm at 80%

---

## Risks Of Wrong Choice

Pool too large overwhelms DB. Pool too small causes request queuing at the pooler.

---

## Related Rules

Rule: Follow standardized Database Connection Pool practices

---

## Related Skills

Analyze and Optimize Database Connection Pool

---

---

## Decision Name: Pool Utilization Monitoring Strategy

---

## Decision Context

Set up monitoring thresholds for connection pool health.

---

## Decision Criteria

reliability, performance

---

## Decision Tree

Pool utilization metric available?

YES -> Set alarm at 80% capacity
NO -> Enable CloudWatch or PgBouncer metrics first

Alert triggered (80%)?
Consistently near 80% -> Right-size pool
Sporadic spikes -> Evaluate pool sizing

Critical threshold (95%+)?
Scale out database or increase pool capacity
Check for connection leak in application

Recovery documented?
Pool flush procedure for emergencies
Application retry logic for connection failures

---

## Rationale

Connection pool exhaustion happens silently. Monitoring reveals sizing issues early before traffic spikes exhaust capacity.

---

## Recommended Default

**Default:** CloudWatch alarm at 80% pool utilization with 5-minute evaluation period

---

## Risks Of Wrong Choice

No monitoring = silent request queuing, growing latency, timeout errors with no warning.

---

## Related Rules

Rule: Follow standardized Database Connection Pool practices

---

## Related Skills

Analyze and Optimize Database Connection Pool

---

