# Skill: Implement Tenant-Aware Event Sourcing

## Purpose

Ensure event streams and projections are isolated per tenant in an event-sourced multi-tenant system, supporting tenant-scoped replay and query.

## When To Use

- Event-sourced applications with multi-tenancy
- Per-tenant event stream isolation required
- Projections must be scoped to single tenant for rebuild

## When NOT To Use

- Non-event-sourced applications
- Single-tenant event sourcing
- All events stored in a single unpartitioned stream

## Prerequisites

- Event store implementation
- Projection system
- Tenant isolation model (shared-table, schema, or DB)

## Inputs

- Event stream definition
- Tenant ID for stream partitioning
- Projection rebuild scope

## Workflow (numbered steps)

1. Choose event store isolation:
   - Shared event store with `tenant_id` column (most practical)
   - Per-tenant event store schema/database (strongest isolation)
2. For shared store: add `tenant_id` to `stored_events` table, index it, always filter by it
3. Create tenant-scoped stream: `$eventStore->streamName('orders', $tenantId)`
4. Implement tenant-scoped projection rebuild: `$projection->rebuild(tenantId: $tenantId)`
5. Ensure projection queries filter by tenant_id
6. Test tenant isolation: Tenant A's events invisible to Tenant B's projections

## Validation Checklist

- [ ] Events tagged with tenant_id in shared store
- [ ] Projections filter by tenant_id
- [ ] Rebuild scoped to single tenant
- [ ] Cross-tenant event access blocked

## Common Failures

- Projection rebuild replays all tenants' events (slow and data leak)
- Event stream name doesn't include tenant ID — collision
- Projection state stored per-tenant but populated from cross-tenant events

## Decision Points

- Shared event store vs per-tenant event store
- Tenant ID in stream name vs event metadata

## Performance Considerations

- Shared store: queries filter by tenant_id (index on tenant_id)
- Per-tenant store: tenant switch connection overhead
- Projection rebuild time proportional to tenant's event count

## Security Considerations

- Events may contain sensitive data — ensure proper access controls
- Projection rebuild must verify tenant access
- Event stream must not be queryable cross-tenant

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Cross-Tenant Data Isolation
- Implement Eloquent Global Scopes
- Implement Tenant-Aware Commands

## Success Criteria

- Events properly isolated per tenant
- Projection rebuild scoped to single tenant completes correctly
- Zero cross-tenant event access possible

---

# Skill: Build Tenant-Scoped Projection Rebuild Command

## Purpose

Create an Artisan command that rebuilds projections for a specific tenant, replaying only that tenant's events without affecting other tenants.

## When To Use

- Projection needs rebuilding for a specific tenant
- Data corruption in a single tenant's projection
- Migrating projection schema for a subset of tenants

## When NOT To Use

- Full system-wide projection rebuild
- Projections that aggregate cross-tenant data

## Prerequisites

- Event store with tenant_id scoping
- Projection system
- Tenant-aware command structure

## Inputs

- Tenant ID
- Projection name(s) to rebuild
- Rebuild options (from scratch or from specific event)

## Workflow (numbered steps)

1. Accept `--tenant` option with tenant ID
2. Accept `--projection` option for specific projection or all
3. Load events for the tenant only (filter by tenant_id)
4. Reset projection state for that tenant
5. Replay events in order through projection handlers
6. Report events processed, projection state, and duration

## Validation Checklist

- [ ] Command rebuilds projection for specified tenant only
- [ ] Other tenants' projections unaffected
- [ ] Events processed in correct order
- [ ] Projection state matches expected output

## Common Failures

- Command replays all events (tenant filter missing) — slow and affects other tenants
- Projection reset deletes cross-tenant aggregated data
- Event order wrong — projection state inconsistent

## Decision Points

- Rebuild synchronously vs queue for large tenants
- From-scratch rebuild vs incremental catch-up

## Performance Considerations

- Large tenants: queue rebuild, show progress
- Small tenants: synchronous, fast
- Monitor replay time and optimize slow projections

## Security Considerations

- Tenant must own the projection data being rebuilt
- Command must validate tenant exists and user has access

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Tenant-Aware Commands
- Implement Event Sourcing Multi-Tenant
- Implement Tenant-Scoped Event Replay

## Success Criteria

- Projection rebuild for single tenant completes correctly
- Other tenants unaffected by rebuild
- Command provides clear progress and completion status
