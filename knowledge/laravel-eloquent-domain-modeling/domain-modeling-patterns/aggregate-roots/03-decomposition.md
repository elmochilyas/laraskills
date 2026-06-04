# Aggregate Roots — Decomposition

## Prime Directive
Design aggregate roots in Eloquent that enforce consistency boundaries, guard access to child entities, and provide clear transactional guarantees.

## 1. Problem Space Decomposition

### 1.1 Root Identity
- **Concern:** Which entity serves as the aggregate root.
- **Sub-concerns:**
  1. Does the entity have global identity?
  2. Is the entity ever referenced without its parent?
  3. Does the entity have independent lifecycle management?

### 1.2 Child Management
- **Concern:** How children within the aggregate are managed.
- **Sub-concerns:**
  1. Adding children (factory method on root)
  2. Removing children (soft vs hard delete)
  3. Updating children (replace vs modify in place)
  4. Ordering and sequence of children

### 1.3 Invariant Enforcement
- **Concern:** Ensuring the aggregate is always in a valid state.
- **Sub-concerns:**
  1. Invariants that involve root + children (e.g., sum totals)
  2. Invariants across children (e.g., no duplicate line items)
  3. Invariants at the root level only (e.g., status constraints)

### 1.4 Concurrency Control
- **Concern:** Preventing lost updates when the aggregate is modified concurrently.
- **Sub-concerns:**
  1. Optimistic locking via version column
  2. Pessimistic locking via database row locks
  3. Conflict detection and resolution strategy

## 2. Solution Space Decomposition

### 2.1 Root Class Design
- **Decision:** How the root Eloquent model is structured.
- **Implementation slices:**
  1. Root is the primary Eloquent model with `HasMany` children
  2. Root extends a custom `AggregateRoot` base class
  3. Root uses `AggregateRoot` trait for domain event recording

### 2.2 Child Access Pattern
- **Decision:** How children are exposed to external code.
- **Implementation slices:**
  1. Protected relationship, exposed via root methods
  2. Public relationship but documented as "use through root methods"
  3. Lazy-load proxy that checks root authorization

### 2.3 Transaction Strategy
- **Decision:** How atomicity is enforced.
- **Implementation slices:**
  1. `DB::transaction()` wrapping root mutation + `push()`
  2. Root + children saved separately but in same transaction
  3. Unit of work tracked changes, flushed at end of request

### 2.4 Version Management
- **Decision:** How concurrent modifications are handled.
- **Implementation slices:**
  1. `lock_version` column incremented on every root save
  2. `$model->refresh()` at transaction start
  3. `sharedLock()` or `lockForUpdate()` for pessimistic locking

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Aggregate Root | Entry point for aggregate operations; owns children |
| Child Entity | Accessed only through root; has local identity |
| Repository | Loads and persists aggregate as a unit (optional) |
| Domain Service | Coordinates across aggregates when necessary |
| Factory | Creates aggregate with initial children and valid state |
| Event Listener | Handles domain events produced by aggregate methods |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization