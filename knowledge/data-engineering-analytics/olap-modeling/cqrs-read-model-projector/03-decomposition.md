# Decomposition: CQRS Read Model / Projector Pattern for Analytics

## Topic Overview
The CQRS read model pattern treats analytics data as a projection derived from domain events — not as the primary source of truth. Instead of querying operational tables for dashboards, you maintain dedicated analytics tables ("read models") that are updated asynchronously by projectors listening to domain events. This decouples the analytics schema (optimized for queries, denormalized, aggregated) from the operational schema (optimized for transactions, normalized).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k008-cqrs-read-model-projector/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CQRS Read Model / Projector Pattern for Analytics
- **Purpose:** The CQRS read model pattern treats analytics data as a projection derived from domain events — not as the primary source of truth.
- **Difficulty:** Intermediate
- **Dependencies:** K002 (Queue Dispatching): Queue-backed projectors depend on reliable queue infrastructure, K019 (Analytic Schema Separation): The analytics.* schema as the read model storage, K029 (Temporal Queries): Point-in-time state reconstruction from event streams, K006 (Star Schema): Read models often implement star schema for query performance

## Dependency Graph
**Depends on:**
- K002 (Queue Dispatching): Queue-backed projectors depend on reliable queue infrastructure
- K019 (Analytic Schema Separation): The analytics.* schema as the read model storage
- K029 (Temporal Queries): Point-in-time state reconstruction from event streams
- K006 (Star Schema): Read models often implement star schema for query performance

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Read model:
- Projector / Projection:
- Domain event:
- Eventual consistency:
- Replaying:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K002 (Queue Dispatching): Queue-backed projectors depend on reliable queue infrastructure, K019 (Analytic Schema Separation): The analytics.* schema as the read model storage, K029 (Temporal Queries): Point-in-time state reconstruction from event streams, K006 (Star Schema): Read models often implement star schema for query performance

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