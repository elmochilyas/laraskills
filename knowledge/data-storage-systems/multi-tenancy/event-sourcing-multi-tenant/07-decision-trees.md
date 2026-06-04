# 5-26 Event Sourcing Multi Tenant - Decision Trees

## Shared vs Per-Tenant Event Store

---

## Decision Context

Choosing between a shared event store (single `stored_events` table with tenant_id) and per-tenant event stores (separate schema/database per tenant) for event sourcing.

---

## Decision Criteria

* performance: shared store queries must filter by tenant_id; per-tenant stores are pre-isolated
* architectural: shared store is simpler; per-tenant store provides full isolation
* maintainability: projections must be tenant-aware in both models
* security: per-tenant stores prevent cross-tenant event leaks

---

## Decision Tree

How to isolate event streams?

↓

Need per-tenant isolation for compliance?

YES → Per-tenant event store (schema or DB-per-tenant)

    ↓
    Each tenant: separate stored_events table/schema/database
    Events never mixed — no tenant_id filtering needed
    Projection replay scoped to tenant automatically
    
    ↓
    Con: N event stores to manage
    Pro: Full isolation, compliant with strict regulations

NO → Standard isolation needs?

    YES → Shared event store with tenant_id column
        
        ↓
        Single stored_events table
        tenant_id column on every row
        Queries always filter: WHERE tenant_id = ?
        
        ↓
        Requires: tenant_id index on stored_events
        Requires: projections filter by tenant_id during replay
        
    NO → Single-tenant app?
    
        → No isolation needed
        Standard event sourcing without tenant context

---

## Recommended Default

**Default:** Shared event store with tenant_id column and index
**Reason:** Single event store is simpler to manage. Per-tenant stores only justified when compliance requires full isolation.

---

## Tenant-Scoped Projection Replay

---

## Decision Context

Rebuilding projections for a single tenant without affecting other tenants' read models or replaying unrelated events.

---

## Decision Criteria

* performance: scoped replay is faster — fewer events to process
* architectural: projectors must accept a tenant ID filter
* maintainability: tenant-scoped replay enables self-service per-tenant fixes
* security: replayed events must never cross tenant boundaries

---

## Decision Tree

Rebuilding projections — scope to tenant?

↓

Fix data for a single tenant?

YES → Tenant-scoped replay

    ↓
    Projectionist::replay(
        SomeProjector::class,
        tenantId: $tenantId
    );
    
    ↓
    Only re-events for that tenant are processed
    Other tenants' projections unaffected
    Faster than global replay

NO → Global projection rebuild (schema change)?

    YES → Replay for ALL tenants
        
        ↓
        Must replay events for every tenant
        May take hours/days for large event stores
        Schedule during maintenance window
        
    NO → Partial replay (specific event type)?
    
        → Filter by event class + tenant
        Replay specific event types for specific tenant
        Most targeted approach

---

## Recommended Default

**Default:** Tenant-scoped replay for individual tenant fixes; global replay for schema changes
**Reason:** Scoped replay is faster and safer. Only rebuild all tenants when the projection schema fundamentally changes.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Event Sourcing in Multi-Tenant Systems
