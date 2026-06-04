# Decomposition: Pivot Events

## Boundary Analysis
This KU covers the lifecycle events fired by `BelongsToMany` relationship methods: `attach`/`attached`, `detach`/`detached`, `update`/`updated` on pivot rows. It covers the relationship-level event API, event class structure, listener registration, and interaction with custom pivot models. It explicitly excludes standard Eloquent model events (covered in model-lifecycle subdomain), pivot attribute reading/writing (covered in pivot-attributes), and the `sync()` algorithm details. The boundary is specifically the event dispatch system around pivot operations.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Pivot events form a single, bounded topic — the event types, payloads, dispatch timing, and listener patterns are all interdependent. The distinction between pre-events (`attaching`) and post-events (`attached`) would be confusing if split across KUs.

## Dependency Graph
- **Depends on:** pivot-table-conventions (must understand `attach`/`detach`/`sync` operations)
- **Depends on:** Eloquent Event System (must understand `EventServiceProvider`, listeners, event classes)
- **Depends on:** pivot-attributes (understanding what pivot data triggers update events)
- **Referenced by:** custom-pivot-models (custom pivots interact with the event system)
- **Referenced by:** sync operation patterns (sync behavior affects event dispatch granularity)

## Follow-up Opportunities
- Queueing pivot event side effects (dispatching jobs from listeners)
- Custom pivot event classes for domain-specific pivot operations
- Pivot event testing patterns (Event::fake with pivot events)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization