# 5-16 Per Tenant Scaling - Decision Trees

## Whale Tenant Isolation Escalation Path

---

## Decision Context

Determining when and how to move a high-usage (whale) tenant from shared infrastructure to dedicated resources.

---

## Decision Criteria

* performance: shared infrastructure degrades when a tenant exceeds 2× median usage
* architectural: escalation path: shared-table → dedicated schema → dedicated DB → dedicated server
* maintainability: automated detection and provisioning reduces manual work
* security: isolation escalation reduces cross-tenant impact surface

---

## Decision Tree

Tenant exceeds resource thresholds — what tier?

↓

Usage 2-3× platform median?

YES → Tier 1: Increase resource allocation on shared infra

    ↓
    Higher rate limits (2× default)
    Larger connection pool allocation
    Priority queue for job processing
    
    ↓
    No infrastructure changes needed
    Monitor for 7 days — if stable, keep at this tier

NO → Usage 3-10× median?

    YES → Tier 2: Move to dedicated schema or database
        
        ↓
        Provision DB-per-tenant (or dedicated schema)
        Migrate data during low-usage window
        Tenant now isolated from neighbor noise
        
        ↓
        Migration steps:
        1. Provision new database
        2. Set up replication from shared to dedicated
        3. Verify data consistency
        4. Switch connection → purge → reconnect
        5. Decommission shared data

NO → Usage > 10× median?

    → Tier 3: Dedicated database server
    Provision standalone DB instance
    No shared CPU, memory, IOPS
    Enterprise SLA with guaranteed resources
    Tenant pays premium for dedicated infrastructure

---

## Recommended Default

**Default:** Tier 1 (rate limit increase) → Tier 2 (dedicated DB) at 3× median → Tier 3 (dedicated server) at 10× median
**Reason:** Graduated escalation aligns cost with resource consumption. Most tenants never exceed Tier 1.

---

## Zero-Downtime Tenant Migration

---

## Decision Context

Migrating a tenant from shared to dedicated infrastructure without downtime — using replication to keep data in sync during the cutover.

---

## Decision Criteria

* performance: replication adds overhead during migration window
* architectural: requires writable replica or logical replication
* maintainability: automated migration pipeline
* security: data must be consistent at cutover point

---

## Decision Tree

Migrating tenant to dedicated resources?

↓

Can the application tolerate a brief read-only period?

YES → Use logical replication (PostgreSQL)

    ↓
    1. Create dedicated database
    2. Set up logical replication from shared to dedicated
    3. Wait for initial sync + catch-up
    4. Verify row counts match
    5. Put app in read-only mode
    6. Stop replication, verify final count
    7. Switch connection config
    8. Take app out of read-only mode

NO → Zero-downtime required?

    YES → Use dual-write strategy
        
        ↓
        1. Create dedicated database
        2. Start writing to both databases (dual-write)
        3. Backfill historical data to dedicated
        4. Verify consistency (checksum comparison)
        5. Stop writing to shared database
        6. Update connection config
        
        ↓
        Risk: dual-write may produce inconsistent data
        Must verify: read your own writes on dedicated DB
        
    NO → Small tenant with low traffic?
    
        → Simple dump + restore
        Accept: brief downtime (seconds to minutes)
        Simple: pg_dump → psql → switch connection

---

## Recommended Default

**Default:** Logical replication with brief read-only period
**Reason:** Logical replication ensures data consistency. Brief read-only (seconds) is acceptable for most SaaS applications.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Per-Tenant Scaling
* Implement Tenant Segmentation
