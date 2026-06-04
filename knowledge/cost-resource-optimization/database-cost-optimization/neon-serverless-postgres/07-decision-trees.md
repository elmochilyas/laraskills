# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Neon Serverless PostgreSQL
**Generated:** 2026-06-03

---

# Decision Inventory

1. Neon vs Aurora/RDS Environment Decision
2. Neon Compute and Auto-Pause Configuration

---

# Architecture-Level Decision Trees

---

## Decision Name: Neon vs Aurora/RDS Environment Decision

---

## Decision Context

Determine when to use Neon vs Aurora for different environments.

---

## Decision Criteria

cost, reliability

---

## Decision Tree

Environment?

Production (HA) -> Aurora/RDS (Neon not recommended primary)
Staging -> Neon (scale-to-zero saves 60-70%)
Development -> Neon (free tier + branching)
CI/CD -> Neon (branch create/delete, ~.002/run)

Database size?
< 200GB -> Neon suitable
> 200GB -> Aurora/RDS better cost structure

Cold start tolerance?
Sub-1s OK -> Neon fine
< 100ms -> Aurora always warm

Cost sensitivity?
High -> Neon free tier + scale-to-zero
Low -> Aurora (predictable)

---

## Rationale

Neon's scale-to-zero and branching make it ideal for non-production, saving 60-70% vs always-on RDS. Aurora remains production recommendation.

---

## Recommended Default

**Default:** Neon for dev/staging/CI/CD; Aurora/RDS for production; re-evaluate Neon annually

---

## Risks Of Wrong Choice

Neon for production HA = downtime risk without multi-AZ.

---

## Related Rules

Rule: Follow standardized Neon Serverless PostgreSQL practices

---

## Related Skills

Analyze and Optimize Neon Serverless PostgreSQL

---

---

## Decision Name: Neon Compute and Auto-Pause Configuration

---

## Decision Context

Configure compute units and auto-pause for cost optimization.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Environment?

Development -> 1 CU, 5-min auto-pause
Staging -> 2-4 CU, 15-min auto-pause
CI/CD -> 1-2 CU, delete after run

Compute budget:
Free tier: 100 compute-hours/month
Paid: .106/CU-hour
Set billing alert at 80% of free tier

Auto-pause:
5 min -> Good for individual dev
15 min -> Better for staging
Disable -> Latency-sensitive staging

Weekly cleanup:
Review stale branches
Delete orphans
Document branch owners

---

## Rationale

Neon charges compute only when active. Auto-pause after 5 min reduces costs by 60-70% for databases used 8 hours/day but idle the rest.

---

## Recommended Default

**Default:** Dev: 1 CU, 5-min auto-pause; Staging: 2-4 CU, 15-min auto-pause; monitor monthly credits

---

## Risks Of Wrong Choice

No auto-pause = 3-4x more compute cost than necessary.

---

## Related Rules

Rule: Follow standardized Neon Serverless PostgreSQL practices

---

## Related Skills

Analyze and Optimize Neon Serverless PostgreSQL

---

