# Aggregate Boundaries — Decomposition

## Prime Directive
Define aggregate boundaries that align with transactional consistency requirements while keeping aggregates small enough to avoid performance and contention problems.

## 1. Problem Space Decomposition

### 1.1 Consistency Requirements
- **Concern:** Which domain objects must be updated atomically?
- **Sub-concerns:**
  1. Invariants that span multiple models (e.g., Order.total must equal sum of OrderItem totals)
  2. Business rules that involve two or more related entities
  3. Consequence of inconsistency (financial loss vs cosmetic glitch)

### 1.2 Reference vs Ownership
- **Concern:** Distinguishing aggregates that reference each other from aggregates that contain.
- **Sub-concerns:**
  1. Does the child have independent identity and lifecycle?
  2. Is the child ever queried or modified without the parent?
  3. Do concurrent operations on parent and child conflict?

### 1.3 Performance Boundaries
- **Concern:** Aggregate size vs transaction performance.
- **Sub-concerns:**
  1. Lock contention from concurrent aggregate modifications
  2. Time to load and persist the full aggregate graph
  3. Database connection occupancy during long transactions

## 2. Solution Space Decomposition

### 2.1 Boundary Identification
- **Decision:** Which models form each aggregate.
- **Implementation slices:**
  1. Root entity identity (has global ID)
  2. Owned entities (have local IDs, accessed through root)
  3. Value objects (no identity, embedded in root or owned entity)

### 2.2 Transaction Strategy
- **Decision:** How atomicity is enforced.
- **Implementation slices:**
  1. `DB::transaction()` wrapping aggregate mutation
  2. Explicit `save()` or `push()` calls for related models
  3. `refresh()` after commit to reload version vectors

### 2.3 Cross-Aggregate Reference
- **Decision:** How aggregates reference each other.
- **Implementation slices:**
  1. Foreign key ID stored as a plain column (not a relation)
  2. Separate read models for cross-aggregate queries
  3. Domain events carrying aggregate IDs for coordination

### 2.4 Loading Strategy
- **Decision:** What part of the aggregate to load for each operation.
- **Implementation slices:**
  1. Eager-load all aggregate children for mutation
  2. Lazy-load selectively within domain methods
  3. Dedicated query scopes for different operations

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Aggregate Root | Entry point for all aggregate operations |
| Repository | Loads and persists the entire aggregate as a unit |
| Domain Service | Coordinates operations across aggregates |
| Event System | Dispatches events when aggregate is modified |
| Queue Worker | Processes jobs triggered by cross-aggregate events |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization