# Anti-Patterns — Repository vs Eloquent Decision

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Repository vs Eloquent Decision |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Java-itis | Medium | Medium | Code review: every entity gets full repository ceremony |
| Scattered Queries Hell | High | Medium | Code review: complex query logic duplicated across call sites |
| Repository as Eloquent Mirror | Medium | High | Code review: repository methods are identical to Model methods |
| Premature Repository Abstraction | Medium | High | Code review: repository created for entity with trivial queries |
| Never Using Repositories When Needed | High | Medium | Code review: complex queries scattered across 10+ services |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Dogmatic "Always" or "Never" Stance | Team mandates either "always use repositories" or "never use repositories" | Forces the wrong pattern for certain entities; ignores context |
| No Decision Framework | Team has no documented criteria for when to use repositories | Each developer makes their own decision, leading to inconsistent architecture |
| Migration Path Ignored | Entities that clearly need repositories never get them because "that's how it was built" | Complex query logic lives in ad-hoc locations with no centralization |

---

## Anti-Pattern Details

### AP-RVE-01: Java-itis

**Description**: Every entity in the application — including lookup tables, pivot tables, and simple settings models — gets the full repository treatment: an interface, an implementation class, a service provider binding, and often a service class. For simple CRUD entities with zero query complexity, this creates 3-4 files per entity where 0 files (use Eloquent directly) would suffice. The architecture mirrors Java/Spring enterprise patterns where repository abstraction is mandatory.

**Root Cause**: A team mandate of "always use repositories" applied without judgment. The reasoning is "consistency" — but the cost is massive file count and developer resentment.

**Impact**:
- 3× to 4× file count per entity compared to direct Eloquent
- Developer frustration: "I need to create 4 files to add a status lookup table?"
- Genuine repository benefits (caching, scoping) are hidden among hundreds of pass-through repositories
- Code navigation is harder (4 files to find instead of looking at the model)
- Refactoring is slower: changing a query requires updating interface + implementation + binding

**Detection**:
- Metrics: application has 100+ repositories for 80+ tables, but 75% have no custom query logic
- Code review: repository for a 2-field lookup table (categories, statuses, types)
- Developer survey: "creating repositories is the most tedious part of adding a new feature"

**Solution**:
- Use direct Eloquent for simple entities with no query complexity
- Only create repositories for entities with: multi-tenancy scoping, caching, complex queries, or data source switching
- Document the entities that use repositories and why
- Remove existing pass-through repositories over time

**Example**:
```php
// BEFORE: Java-itis — full ceremony for a simple entity
interface StatusRepositoryInterface { /* CRUD methods */ }
class EloquentStatusRepository implements StatusRepositoryInterface { /* pass-through */ }
// Service provider: $this->app->bind(StatusRepositoryInterface::class, EloquentStatusRepository::class);
class StatusService { /* pass-through */ }

// AFTER: Direct Eloquent
// Just: Status::find($id), Status::all(), etc.
// No interface, no repository, no binding, no service class
```

---

### AP-RVE-02: Scattered Queries Hell

**Description**: The opposite of Java-itis. The team never uses repositories, and complex query logic — multi-table joins, subqueries, raw SQL, reporting filters — is duplicated across 10+ services, actions, and controllers. A change to the query logic (add a condition, change a join) requires finding and updating every duplication point.

**Root Cause**: A dogmatic "repositories are bad" stance. The team rejects repositories entirely, so all query logic is written inline wherever it's needed. No centralization of any kind.

**Impact**:
- Changing a query requires grep-and-replace across the entire codebase
- Inconsistent query behavior: the same filter may be applied differently in different places
- No centralized caching or multi-tenancy scoping is possible
- Onboarding: new developers don't know where to find the query logic for an entity

**Detection**:
- Code review: 5+ places with the same `->where('status', 'active')->whereNull('deleted_at')` pattern
- Code review: complex `DB::raw()` or `->join()` calls scattered across unrelated classes
- Metrics: grep for a specific `->where()` clause returns 15+ matches

**Solution**:
- Extract complex query logic to repository classes or query scope methods
- Start with the most duplicated query patterns
- Centralize slowly — don't attempt a full migration in one sprint
- Document where query logic lives for each entity

**Example**:
```php
// BEFORE: Scattered queries
class UserService
{
    public function findActive(): Collection
    {
        return User::where('active', true)->whereNull('deleted_at')->get();
    }
}
class UserExportAction
{
    public function execute(): Collection
    {
        return User::where('active', true)->whereNull('deleted_at')->with('orders')->get();
    }
}
class UserReportController
{
    public function __invoke(): JsonResponse
    {
        return response()->json(User::where('active', true)->whereNull('deleted_at')->count());
    }
}

// AFTER: Centralized repository
class EloquentUserRepository
{
    public function findActive(array $with = []): Collection
    {
        return User::where('active', true)->whereNull('deleted_at')->when($with, fn($q, $v) => $q->with($v))->get();
    }
}
```

---

### AP-RVE-03: Repository as Eloquent Mirror

**Description**: A repository whose methods are identical to Eloquent's model API with zero additional logic. `find($id)`, `create($data)`, `update($data)`, `delete($id)` — every method is a one-line pass-through to the equivalent `Model::method()`. The repository adds no query centralization, no caching, no scoping, and no architectural value. It exists purely for "consistency" or "future-proofing."

**Root Cause**: The developer creates a repository because "the architecture requires it" without adding any actual logic. The repository is a ceremonial wrapper.

**Impact**:
- Adds file count without architectural return
- Creates the illusion of a "service layer" where none exists
- Developers must mock a repository that does nothing (test overhead)
- The real cost: genuine repositories are indistinguishable from anemic ones

**Detection**:
- Code review: all repository methods are one-line `Model::method($params)` calls
- Code review: removing the repository and calling Eloquent directly produces identical behavior
- Metrics: repository has `find`, `create`, `update`, `delete`, `all` — none do more than Eloquent

**Solution**:
- Remove the repository and use Eloquent directly
- If the entity needs a repository later (when queries become complex), extract it then
- If the entity has zero query complexity, it doesn't need a repository
- Document: "repositories are for entities with complexity, not for every entity"

**Example**:
```php
// BEFORE: Repository as Eloquent mirror
class EloquentProductRepository implements ProductRepositoryInterface
{
    public function find(int $id): ?Product { return Product::find($id); }
    public function create(array $data): Product { return Product::create($data); }
    public function update(int $id, array $data): ?Product { $p = Product::findOrFail($id); $p->update($data); return $p; }
    public function delete(int $id): void { Product::destroy($id); }
    public function findAll(): Collection { return Product::all(); }
}

// AFTER: Direct Eloquent, no repository
// Product::find(), Product::create(), etc. used directly
```
