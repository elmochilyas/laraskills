# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-15 Migration Canary Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Multi-Tenant Canary vs Replica Canary
* Fixed Percentage vs Specific Tenant Selection
* Canary Duration: Short vs Extended Observation Window

---

# Architecture-Level Decision Trees

---

## Multi-Tenant Canary vs Replica Canary

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a canary rollout must choose between a multi-tenant canary (stagger tenants) and a replica canary (run on read replica first).

---

## Decision Criteria

* performance considerations: canary infrastructure setup
* architectural considerations: multi-tenant vs single-database architecture
* security considerations: blast radius containment
* maintainability considerations: monitoring complexity

---

## Decision Tree

Is your application multi-tenant with per-tenant databases?
↓
YES → Use multi-tenant canary (apply to internal → low-usage → high-usage tenants)
NO → Use replica canary (apply to read replica, verify, then apply to primary)

---

## Rationale

Multi-tenant canary is the natural fit for DB-per-tenant architectures: you can apply changes to a small percentage of independent tenant databases. For single-database applications, a replica canary runs the migration on a read replica first, verifying the operation succeeds without impacting production traffic. If the replica canary passes, the migration is safe to run on the primary.

---

## Recommended Default

**Default:** Multi-tenant canary for DB-per-tenant, replica canary for single-DB
**Reason:** Match the canary approach to your architecture. Multi-tenant canaries provide natural isolation between tenants. Replica canaries provide similar safety for single-DB deployments.

---

## Risks Of Wrong Choice

Replica canary on a multi-tenant application doesn't test tenant-specific migration behavior. Multi-tenant canary on a single-DB app is impossible without tenant-separated databases.

---

## Related Rules

Always canary high-risk migrations. Monitor error rates and latency during canary.

---

## Related Skills

Execute Canary Rollouts for Production Schema Changes

---

## Fixed Percentage vs Specific Tenant Selection

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer setting up a multi-tenant canary must choose between a random percentage of tenants and specific pre-selected tenants.

---

## Decision Criteria

* performance considerations: sampling representativeness
* architectural considerations: tenant segmentation, risk groups
* security considerations: data sensitivity of canary tenants
* maintainability considerations: configuration management

---

## Decision Tree

Are low-risk tenants (internal, test accounts) available for canary testing?
↓
YES → Use specific tenant selection (target known low-risk groups first)
NO → Use fixed percentage random selection (samples across all tenant types)

---

## Rationale

Specific tenant selection lets you start with internal/test tenants that have the lowest business impact. This is the safest approach because if the migration has issues, it affects internal users who understand the risk. Random percentage selection is the fallback — it provides representative coverage across all tenant types but may select high-value tenants in the initial canary group.

---

## Recommended Default

**Default:** Specific tenants for initial canary (internal → low-usage), then percentage for expansion
**Reason:** Starting with known low-risk tenants is always safer than random selection. Use random percentage for the expansion phases after the initial canary passes.

---

## Risks Of Wrong Choice

Random selection picking a high-value tenant for the initial 1% canary causes customer-facing impact. Specific selection of only internal tenants may miss edge cases that exist in customer data patterns.

---

## Related Rules

Always canary high-risk migrations. Monitor error rates and latency during canary.

---

## Related Skills

Execute Canary Rollouts for Production Schema Changes

---

## Canary Duration: Short vs Extended Observation Window

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer must choose the observation window between canary phases — how long to wait before expanding to the next percentage.

---

## Decision Criteria

* performance considerations: total rollout time
* architectural considerations: traffic patterns, cron job cycles
* security considerations: detection sensitivity
* maintainability considerations: deployment pipeline, monitoring

---

## Decision Tree

Does the migration affect data processing that runs on a daily/hourly cycle?
↓
YES → Extend canary window to cover at least one full cycle (e.g., 24h)
NO → Use short window (15-30 minutes per phase)

---

## Rationale

Short windows (15-30 min) are sufficient for error-rate detection on real-time traffic — if the migration breaks queries, you'll see errors immediately. Extended windows are needed when the migration affects batch jobs, cron tasks, or reporting queries that run on a schedule. If a daily report runs at 2 AM and the canary was at 3 PM, you need to wait until after 2 AM to see if the migration broke the report.

---

## Recommended Default

**Default:** 15-30 minutes per phase for real-time traffic detection
**Reason:** Most schema issues (missing columns, type mismatches, constraint violations) manifest immediately on any query. Only extend the window when you know the migration affects scheduled processes that don't run continuously.

---

## Risks Of Wrong Choice

Short window on a migration affecting hourly cron jobs catches errors hours late. Extended window on a simple column addition delays rollout unnecessarily.

---

## Related Rules

Always canary high-risk migrations. Automate rollback on threshold breach.

---

## Related Skills

Execute Canary Rollouts for Production Schema Changes
