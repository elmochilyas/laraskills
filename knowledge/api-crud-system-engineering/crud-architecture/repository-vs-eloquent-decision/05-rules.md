# Repository vs Eloquent Decision — Rules

## Rule 1: Default to Direct Eloquent for New Entities
---
## Category
Architecture
---
## Rule
Always start with direct Eloquent for new entities; only extract to a repository when query complexity, multi-tenancy, or caching needs justify the abstraction.
---
## Reason
Premature repository abstraction triples file count (interface, implementation, binding) for zero benefit. Most entities never need a repository. Start simple, extract when justified.
---
## Bad Example
```php
// Day 1 of a new entity — premature abstraction
interface TagRepositoryInterface { /* ... */ }
class EloquentTagRepository implements TagRepositoryInterface { /* ... */ }
// Repository just wraps: Tag::all(), Tag::create(), Tag::find()
// Zero added value over direct Eloquent
```
---
## Good Example
```php
// Day 1 — direct Eloquent
class TagController
{
    public function index(): JsonResponse
    {
        return response()->json(Tag::all());
    }
}
// Extract to repository later if query complexity grows
```
---
## Exceptions
Entities known from the start to require multi-tenant scoping, centralized caching, or complex search queries may start with a repository.
---
## Consequences Of Violation
Ceremony without benefit, file bloat, developer resentment toward the architecture.
</rule>

## Rule 2: Repository Must Add Value Beyond Eloquent's API
---
## Category
Architecture
---
## Rule
Never create a repository that just mirrors Eloquent's methods; the repository must add centralized query logic, caching, scoping, or decoration.
---
## Reason
A repository that duplicates `Model::find()`, `Model::create()`, and `Model::update()` with no additional logic provides zero value — it's ceremony that slows development.
---
## Bad Example
```php
class EloquentProductRepository implements ProductRepositoryInterface
{
    public function find(int $id): ?Product { return Product::find($id); } // Same as Model::find
    public function create(array $data): Product { return Product::create($data); } // Same as Model::create
    public function update(Product $p, array $d): Product { $p->update($d); return $p; } // Same as ->update
    // Zero added value — just forwards to Eloquent
}
```
---
## Good Example
```php
class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function search(OrderSearchCriteria $criteria): LengthAwarePaginator
    {
        return Order::query()
            ->where('tenant_id', tenant()->id) // Scoping
            ->when($criteria->status, fn($q, $v) => $q->where('status', $v))
            ->with(['items', 'customer']) // Eager loading
            ->paginate($criteria->perPage);
    }

    public function findWithItems(int $id): ?Order
    {
        return Cache::remember("order.{$id}", 3600, fn() => // Caching
            Order::with('items')->find($id)
        );
    }
}
```
---
## Exceptions
No common exceptions. A repository that adds no value should be removed.
---
## Consequences Of Violation
Ceremony without benefit, developers question why repositories exist, slowed iteration for no architectural gain.
</rule>

## Rule 3: Use Hybrid Approach — Repositories Only for Complex Entities
---
## Category
Architecture
---
## Rule
Never apply a dogmatic "repositories always" or "repositories never" rule; use the hybrid approach — repositories for entities with complex queries, direct Eloquent for simple ones.
---
## Reason
Both extremes are wrong. "Repositories always" creates unnecessary ceremony for simple entities. "Repositories never" leaves complex queries scattered across call sites. The hybrid approach applies each pattern where it fits.
---
## Bad Example
```php
// Dogmatic "repositories always" — 30 entities, 30 interfaces, 30 implementations
// 90 files when 80 of them add zero value
```
---
## Good Example
```php
// Direct Eloquent for simple entities
$tags = Tag::where('active', true)->get();
$category = Category::find($id);

// Repository for complex entities
$orders = $this->orders->search(new OrderSearchCriteria(
    status: 'pending',
    dateFrom: now()->subMonth(),
    dateTo: now(),
    customerId: $customerId,
));
```
---
## Exceptions
Teams that mandate repositories for all entities for consistency must acknowledge the ceremony cost.
---
## Consequences Of Violation
Repositories for lookup tables with zero query logic (ceremony), or scattered complex queries (duplication).
</rule>

## Rule 4: Extract Repository Later — Migration Is Low Risk
---
## Category
Maintainability
---
## Rule
Never hesitate to start with direct Eloquent; extracting a repository later is straightforward (~30 minutes per entity) and low risk.
---
## Reason
Fear of "being stuck" with direct Eloquent drives premature abstraction. The migration path — interface, implementation, binding, replace call sites — is simple, mechanical, and testable.
---
## Bad Example
```php
// Abstracted prematurely "just in case"
interface LogRepositoryInterface { /* ... */ }
class EloquentLogRepository implements LogRepositoryInterface { /* ... */ }
// This entity will never need complex queries
```
---
## Good Example
```php
// Start simple
$logs = Log::latest()->take(10)->get();

// Later, when query complexity grows:
// 1. Create LogRepositoryInterface
// 2. Create EloquentLogRepository  
// 3. Bind in service provider
// 4. Replace call sites (~30 min total)
```
---
## Exceptions
No common exceptions. Migration from direct Eloquent to repository is always straightforward.
---
## Consequences Of Violation
Premature abstraction tax on every entity, wasted file creation and maintenance.
</rule>

## Rule 5: Use Direct Eloquent for Simple Lookups and Read Operations
---
## Category
Performance
---
## Rule
Always use direct Eloquent for simple lookup operations (find by ID, find all, simple where clauses) on entities without complex query logic or cross-cutting concerns.
---
## Reason
Adding a repository layer for `Model::find($id)` adds interface resolution, method delegation, and mocking complexity with zero query benefit. The overhead is negligible per call but the maintenance cost accumulates.
---
## Bad Example
```php
// Repository wrapping a simple find
class UserService
{
    public function find(int $id): ?User
    {
        return $this->users->find($id); // Interface → implementation → Eloquent
    }
}
// vs direct: User::find($id) — same result, fewer layers
```
---
## Good Example
```php
// Direct Eloquent for simple reads
class UserService
{
    public function find(int $id): ?User
    {
        return User::find($id); // Simple lookup — no repository needed
    }
}
```
---
## Exceptions
Entities that must always apply tenant scoping should use a repository even for simple lookups to guarantee the scope is applied.
---
## Consequences Of Violation
Unnecessary files, layers of indirection for trivial operations, harder to read simple queries.
</rule>
