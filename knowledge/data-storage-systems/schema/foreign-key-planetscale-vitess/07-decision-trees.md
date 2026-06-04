# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-29 Foreign Key in PlanetScale/Vitess
**Generated:** 2026-06-03

---

# Decision Inventory

* Database-level FK vs application-level enforcement in Vitess
* Cross-shard FK handling strategy
* PlanetScale branch-based schema management

---

# Architecture-Level Decision Trees

---

## FK Strategy in Vitess/PlanetScale

---

## Decision Context

Choosing between native FK constraints (limited in Vitess) and application-level referential integrity enforcement.

---

## Decision Criteria

* performance: Vitess FK checks add proxy-level latency
* architectural: cross-shard FKs are not supported in Vitess
* maintainability: application-level FKs require explicit cleanup code
* security: application-level enforcement can miss race conditions

---

## Decision Tree

Deploying Laravel on PlanetScale/Vitess?
↓
Are parent and child tables guaranteed to be on the same shard?
YES → Database-level FK is possible
    → Use constrained() in migrations
    → Ensure tables share the same shard key
NO → Use application-level FK enforcement
    ↓
    Omit ->constrained() from migrations
    Handle cascading deletes in application code (model events)
    Delete related records explicitly (not via DB cascade)
    Use manual delete handling in Eloquent events
    ↓
    Is this a cross-shard environment?
    YES → Application-level enforcement is MANDATORY
        → Vitess does not guarantee cross-shard FK enforcement
        → Cascades do NOT propagate across shards
    NO → Application-level enforcement is RECOMMENDED

---

## Rationale

Vitess does not reliably support cross-shard foreign keys. On PlanetScale, FK constraints can prevent schema changes and deploy request operations. Application-level enforcement using Eloquent relationships and model events is the recommended approach for Vitess-based deployments.

---

## Recommended Default

**Default:** Application-level FK enforcement for all Vitess/PlanetScale deployments
**Reason:** Vitess FK support is limited to co-located tables and doesn't work cross-shard. Application enforcement provides consistent behavior regardless of shard layout.

---

## Risks Of Wrong Choice

* Relying on FK cascade in Vitess: CASCADE doesn't propagate across shards, leaving orphaned records
* Missing application cleanup: orphaned records accumulate without DB-level enforcement
* Cross-shard FK violation silently ignored: data integrity is compromised without notification
* PlanetScale deploy request revert orphans: dropping FK constraint leaves invalid data

---

## Related Rules

* Omit ->constrained() from migrations for Vitess deployments
* Handle cascading deletes in application code using Eloquent events

---

## Related Skills

* Implement application-level FK enforcement for Vitess/PlanetScale
