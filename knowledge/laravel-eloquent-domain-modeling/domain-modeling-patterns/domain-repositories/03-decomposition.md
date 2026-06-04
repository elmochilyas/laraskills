# Domain Repositories — Decomposition

## Prime Directive
Implement repositories that provide persistence abstraction for aggregates where the benefit of decoupling outweighs the cost of the additional layer.

## 1. Problem Space Decomposition

### 1.1 Abstraction Necessity
- **Concern:** Whether a repository is needed for a given aggregate.
- **Sub-concerns:**
  1. Is the aggregate complex enough to benefit from abstraction?
  2. Does testing require swapping persistence implementations?
  3. Are there multiple storage backends (primary + cache + search)?

### 1.2 Interface Design
- **Concern:** What methods the repository exposes.
- **Sub-concerns:**
  1. CRUD methods vs domain-specific query methods
  2. Return types: aggregate root vs DTO vs array
  3. Pagination, filtering, sorting support

### 1.3 Aggregate Loading
- **Concern:** How much of the aggregate graph to load.
- **Sub-concerns:**
  1. Eager-loading strategy (always eager vs configurable)
  2. Partial loading for read-only operations
  3. Lazy loading for large or infrequently accessed children

### 1.4 Transaction Management
- **Concern:** Where transaction boundaries are set.
- **Sub-concerns:**
  1. Repository as transaction owner vs caller-managed
  2. Multiple repository operations in one transaction
  3. Save strategies (`save()` vs `push()` vs manual)

## 2. Solution Space Decomposition

### 2.1 Repository Scope
- **Decision:** Which aggregates get a repository.
- **Implementation slices:**
  1. All aggregates get a repository (uniform but more work)
  2. Only complex aggregates get a repository (targeted)
  3. No repositories; direct Eloquent usage everywhere

### 2.2 Interface Contract
- **Decision:** Repository method signatures.
- **Implementation slices:**
  1. `find($id): AggregateRoot`
  2. `findOneBy(array $criteria): ?AggregateRoot`
  3. `findBy(Specification $spec): Collection`
  4. `add(AggregateRoot $root): void`
  5. `remove(AggregateRoot $root): void`

### 2.3 Implementation Strategy
- **Decision:** How the repository uses Eloquent.
- **Implementation slices:**
  1. Direct Eloquent queries wrapping in repository methods
  2. Builder delegation: repository delegates to Eloquent Builder
  3. Query object injection: repository receives pre-built queries

### 2.4 Testing Support
- **Decision:** How repositories are tested.
- **Implementation slices:**
  1. In-memory repository implementation for unit tests
  2. SQLite in-memory with actual Eloquent repository
  3. Mocked repository interface for service tests

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Aggregate Root | Returned by and passed into repository methods |
| Repository Interface | Defined in domain layer |
| Eloquent Repository | Concrete implementation in infrastructure layer |
| Application Service | Uses repository for persistence operations |
| Controller | Optionally uses repository (or delegates to service) |
| Test Suite | Uses in-memory or mock repository for isolation |
| Cache Layer | Decorator wrapping repository for caching |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization