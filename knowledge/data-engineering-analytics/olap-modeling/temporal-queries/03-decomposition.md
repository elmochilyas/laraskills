# Decomposition: Event Sourcing Temporal Queries (Point-in-Time State Reconstruction)

## Topic Overview
Temporal queries — asking "what was the state at a specific point in time" — are the primary value proposition of event sourcing for analytics. Instead of snapshot-based read models that show only the current state, event sourcing enables querying historical state by replaying events up to a specific timestamp. This powers audit trails, time-travel debugging, historical reporting, and trend analysis that are difficult or impossible with mutable-table architectures.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k029-temporal-queries/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Event Sourcing Temporal Queries (Point-in-Time State Reconstruction)
- **Purpose:** Temporal queries — asking "what was the state at a specific point in time" — are the primary value proposition of event sourcing for analytics.
- **Difficulty:** Intermediate
- **Dependencies:** K008 (CQRS Read Models): Read models updated by projectors are the "current state" counterpart of temporal queries, K044 (Data Vault 2.0): Data Vault's PIT tables serve the same purpose — pre-computed temporal snapshots, K030 (SCD Type 1/2): Temporal queries vs Slowly Changing Dimensions — different approaches to tracking history

## Dependency Graph
**Depends on:**
- K008 (CQRS Read Models): Read models updated by projectors are the "current state" counterpart of temporal queries
- K044 (Data Vault 2.0): Data Vault's PIT tables serve the same purpose — pre-computed temporal snapshots
- K030 (SCD Type 1/2): Temporal queries vs Slowly Changing Dimensions — different approaches to tracking history

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- State reconstruction:
- Snapshot:
- Event stream:
- Temporal query:
- Projection versioning:
- Bitemporal storage:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K008 (CQRS Read Models): Read models updated by projectors are the "current state" counterpart of temporal queries, K044 (Data Vault 2.0): Data Vault's PIT tables serve the same purpose — pre-computed temporal snapshots, K030 (SCD Type 1/2): Temporal queries vs Slowly Changing Dimensions — different approaches to tracking history

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization