# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Connection Limits Pricing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Connection Limit Mitigation: Pooler vs Upgrade
2. max_connections Calculation

---

# Architecture-Level Decision Trees

---

## Decision Name: Connection Limit Mitigation: Pooler vs Upgrade

---

## Decision Context

Choose between pooler and instance upgrade when approaching connection limits.

---

## Decision Criteria

cost

---

## Decision Tree

Connection count vs max_connections?

< 50% -> No action
50-80% -> Monitor; plan pooler
> 80% -> Action required

Solution comparison:
RDS Proxy: -30/month (managed)
PgBouncer: ~/month (open source)
Instance upgrade: -200+/month

Cost-optimal:
Add pooler first (-30/month)
Upgrade only if more compute also needed

Implementation:
RDS Proxy -> Point Laravel to proxy endpoint
PgBouncer -> Deploy on t4g.nano, pool size = 2-3x DB vCPUs

---

## Rationale

RDS Proxy costs -30 vs instance upgrade -200+/month. Always pooler first, upgrade only if compute also needed.

---

## Recommended Default

**Default:** Add RDS Proxy before upgrading instance; pooler saves -170+/month vs resizing

---

## Risks Of Wrong Choice

Upgrading for connections alone = paying for CPU/memory not needed.

---

## Related Rules

Rule: Follow standardized Connection Limits Pricing practices

---

## Related Skills

Analyze and Optimize Connection Limits Pricing

---

---

## Decision Name: max_connections Calculation

---

## Decision Context

Calculate and configure max_connections based on instance memory.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

Database engine?

MySQL: max = LEAST(RAM_bytes/12582880, 5000)
PostgreSQL: based on shared_buffers

App connection budget?
Workers + queue + admin reserve + background
Reserve 10-20% for admin

Budget within max_connections?
YES -> Configure in parameter group
NO -> Add pooler or upgrade

Connection timeout?
Laravel: PDO::ATTR_TIMEOUT => 5 (5 seconds)

---

## Rationale

max_connections directly tied to RAM. Each connection uses ~2-10MB. Overriding too high risks OOM.

---

## Recommended Default

**Default:** Calculate from RAM formula; reserve 20% for admin; set 5s timeout

---

## Risks Of Wrong Choice

Setting too high on small instance causes OOM. Too low causes connection exhaustion.

---

## Related Rules

Rule: Follow standardized Connection Limits Pricing practices

---

## Related Skills

Analyze and Optimize Connection Limits Pricing

---

