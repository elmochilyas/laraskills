# Domain Repositories — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Repositories |
| Focus | Anti-patterns in repository design and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Repository for Every Model (Over-Engineering) | Design | High |
| 2 | Transaction Management Inside Repository Methods | Architecture | Critical |
| 3 | SQL-Like Method Names in Repository Interface | Architecture | High |
| 4 | Eloquent-Specific Types in Repository Interface | Architecture | High |
| 5 | Repository Methods Returning Query Builders | Architecture | High |
| 6 | Generic `findBy()` or `matching()` Query Methods | Maintainability | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most common anti-pattern is creating repositories for every model including simple CRUD entities, adding abstraction without benefit
- Repository methods managing their own transactions cause nested transaction bugs when composed in use cases
- SQL-like method names (`findWhere`, `findByAttributes`) leak persistence concerns into the domain interface

---

## 1. Repository for Every Model (Over-Engineering)

### Category
Design

### Description
Creating repository interfaces and implementations for every Eloquent model, including simple CRUD models with no persistence variation. The repository mirrors Eloquent's API exactly, adding indirection without benefit.

### Why It Happens
"Best practices" articles recommend repositories. Teams adopt the pattern without evaluating whether it adds value. Implementing a repository interface is seen as "proper architecture." The overhead is accepted as normal.

### Warning Signs
- `UserRepository`, `RoleRepository`, `PermissionRepository` for simple CRUD models
- Repository interface methods that exactly mirror Eloquent's API: `find()`, `findAll()`, `save()`, `delete()`
- Repository implementation that simply delegates to Eloquent without any additional logic
- Repository interfaces with no alternate implementations (only Eloquent, no in-memory)
- More files in `Repositories/` than in `Models/`
- Developer grumbling about "writing a repository for every model"

### Why Harmful
- Each repository requires an interface and implementation — 2 files per model
- The abstraction adds no value when there's only one persistence implementation
- Repository methods that mirror Eloquent's API are leaky abstractions
- Maintenance burden: changing Eloquent's API requires updating repository implementations
- Developer productivity decreases from the overhead of creating and maintaining repositories

### Consequences
- Codebase bloat: 50 models = 100+ repository files
- Slower development: every new model requires an interface + implementation
- False sense of abstraction: swapping to a different ORM would require changing the interface anyway
- Developer frustration with ceremony without benefit
- Test complexity: repositories need their own tests (more files)

### Preferred Alternative
```php
// Use Eloquent directly for simple CRUD:
$user = User::find($id);
$activeUsers = User::where('active', true)->get();
```

### Refactoring Strategy
1. Identify repositories for simple CRUD models with no persistence variation
2. Replace repository usage in controllers/services with direct Eloquent calls
3. Remove the repository interface and implementation files
4. For aggregate roots with complex persistence needs, keep the repository
5. Document the team's criteria for when to create a repository

### Detection Checklist
- [ ] Count repository interfaces vs models — is there a 1:1 ratio?
- [ ] Check if any repository has an alternate implementation (in-memory, file-based)
- [ ] Compare repository methods to Eloquent's API — are they identical?
- [ ] Review whether the repository adds any logic beyond Eloquent delegation
- [ ] Check repository test files — are they just testing Eloquent?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Prefer Direct Eloquent Usage Over Repositories for Simple CRUD |
| Rule | `05-rules.md` — One Repository per Aggregate Root, Not per Entity |
| Decision Tree | `07-decision-trees.md` — Repository vs Direct Eloquent Usage |

---

## 2. Transaction Management Inside Repository Methods

### Category
Architecture

### Description
Repository methods that begin, commit, and roll back their own database transactions. When multiple repository methods are called within a single use case, nested transactions cause bugs and partial persistence.

### Why It Happens
Developers want each repository method to be "self-contained and safe." Wrapping `save()` in a transaction seems like good practice. The developer may not consider that repositories are composed into larger transaction scopes.

### Warning Signs
- `DB::beginTransaction()` inside repository `save()` or `delete()` methods
- Repository methods that commit transactions internally
- Nested transaction errors in use cases calling multiple repositories
- `DB::transaction()` wrapping repository calls from the use case, and again inside the repository
- Transaction savepoints appearing in logs
- Partial persistence when a use case modifies two aggregates and one fails

### Why Harmful
- Nested transactions cause the inner commit to be ignored — the outer transaction controls the outcome
- Transaction boundaries are scattered across repositories instead of centralized in the use case
- A repository method committing internally may leave other changes uncommitted if called in a use case
- Testing transaction behavior requires understanding both the use case and repository transaction logic
- Violates the principle that transaction boundaries are application-layer concerns

### Consequences
- Silent data loss: inner commits are ignored by outer transactions
- Confusing error messages: "Transaction already started" exceptions
- Inconsistent state: one aggregate saved, another not, despite being in the same logical operation
- Hard-to-debug transaction behavior: understanding control flow requires reading multiple layers
- Tests that pass in isolation but fail when composed

### Preferred Alternative
```php
class EloquentOrderRepository implements OrderRepository
{
    public function save(Order $order): void
    {
        $order->push(); // No transaction management — caller handles it
    }
}

// Use case manages the transaction:
DB::transaction(function () use ($orderRepo, $invoiceRepo) {
    $orderRepo->save($order);
    $invoiceRepo->save($invoice);
});
```

### Refactoring Strategy
1. Identify repository methods that manage their own transactions
2. Remove `DB::beginTransaction()`, `DB::commit()`, `DB::rollBack()` from repository methods
3. Ensure the caller (use case, action, controller) wraps composite operations in its own transaction
4. Update tests to manage transactions at the use case level
5. Verify that nested transaction issues are resolved

### Detection Checklist
- [ ] Search for `DB::beginTransaction`, `DB::commit`, `DB::rollBack` in repository implementations
- [ ] Check use case code for its own transaction management around repository calls
- [ ] Test use cases that call multiple repositories — do they handle transactions correctly?
- [ ] Review transaction logs for savepoints or nested transaction markers
- [ ] Verify that partial failures roll back all changes, not just one repository's

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Manage Transactions Inside Repositories |
| Skill | `06-skills.md` — Create a Repository Interface for an Aggregate Root |
| Knowledge | `04-standardized-knowledge.md` — Repositories should not manage transactions |

---

## 3. SQL-Like Method Names in Repository Interface

### Category
Architecture

### Description
Naming repository methods with SQL-like terms (`findWhere`, `findByAttributes`, `getWhere`, `findOneBy`) instead of domain-specific names (`findPendingOrders`, `findActiveSubscriptions`). The interface leaks persistence concepts into the domain.

### Why It Happens
SQL-like naming is a familiar pattern. Generic method names reduce the number of methods on the interface. Developers may not recognize that these names couple the domain to persistence terminology.

### Warning Signs
- `findWhere(array $criteria)` — generic criteria-based method
- `findByAttributes(array $data)` — SQL-like attribute search
- `getWhereStatus(string $status)` — "where" clause in method name
- `findOneBy(string $field, mixed $value)` — generic field lookup
- Callers constructing arrays of criteria that mirror SQL WHERE clauses
- Repository interface that requires reading the implementation to understand available queries

### Why Harmful
- The interface speaks SQL instead of the domain's ubiquitous language
- Callers must construct SQL-like criteria arrays instead of calling named methods
- The repository's query capabilities are not discoverable from the interface alone
- Changing query logic requires finding all callers that pass specific criteria arrays
- Generic methods defeat the repository's purpose of abstracting persistence

### Consequences
- Domain code contains SQL-like array constructions: `$repo->findWhere(['status' => 'pending', 'created_at' => '>2024-01-01'])`
- Repository capabilities are opaque — developers must read the implementation
- Refactoring queries is risky: criteria array keys are fragile strings
- No IDE autocompletion for query methods
- The repository pattern provides no abstraction benefit over raw Eloquent

### Preferred Alternative
```php
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function findPendingOrders(): Collection;
    public function findOrdersByCustomer(int $customerId): Collection;
    public function findOverdueOrders(): Collection;
}
```

### Refactoring Strategy
1. Identify SQL-like method names on repository interfaces
2. For each generic method, determine the actual query needs
3. Create named methods for each distinct query
4. Remove the generic `findWhere`/`findBy` methods
5. Update callers to use named methods

### Detection Checklist
- [ ] Search for `findBy`, `findWhere`, `getWhere`, `findOneBy` in repository interfaces
- [ ] Check callers for criteria array construction patterns
- [ ] Review the interface for SQL terms (where, and, or, order, group)
- [ ] Verify that query capabilities are discoverable from method names alone
- [ ] Check if the implementation's Eloquent queries are visible through the interface name

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Design Repository Interfaces Around Domain Concepts |
| Rule | `05-rules.md` — Make Repository Methods Explicit About Their Query Intent |
| Decision Tree | `07-decision-trees.md` — Repository Interface Design |

---

## 4. Eloquent-Specific Types in Repository Interface

### Category
Architecture

### Description
Including Eloquent-specific types (`Model`, `Builder`, `EloquentCollection`, `HasMany`, `BelongsTo`) in repository interface signatures. This couples the domain layer to the ORM and prevents alternate persistence implementations.

### Why It Happens
Developers use the types they know. `Illuminate\Database\Eloquent\Collection` is the default import for collection returns. The interface may be written after the Eloquent implementation, carrying the Eloquent types into the contract.

### Warning Signs
- `use Illuminate\Database\Eloquent\Collection;` in repository interface files
- Return types of `Model`, `Builder`, `EloquentCollection` in interface method signatures
- Parameters typed as `Model` or `Builder` in interface methods
- `BelongsTo` or `HasMany` relationship references in the interface
- The interface cannot be implemented without Eloquent
- In-memory test implementations require Eloquent stubs or fakes

### Why Harmful
- Domain layer depends on the ORM, violating dependency inversion
- Switching persistence strategies requires changing the interface
- The repository cannot be implemented for non-Eloquent storage (event store, API, file system)
- Domain logic now has a compile-time dependency on Laravel's ORM
- The abstraction provides no real decoupling

### Consequences
- Domain package is coupled to Laravel/Eloquent
- Cannot run domain tests without Laravel's ORM booted
- Repository pattern provides no real abstraction — still Eloquent-dependent
- Implementing an in-memory repository requires Eloquent stubs
- Extracting the domain into a separate package is impossible

### Preferred Alternative
```php
use Illuminate\Support\Collection; // Generic Laravel support collection, not ORM-specific

interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function findPendingOrders(): Collection;
    public function save(Order $order): void;
}
```

### Refactoring Strategy
1. Identify Eloquent types in repository interface signatures
2. Replace `EloquentCollection` with `Illuminate\Support\Collection`
3. Replace `Model` with the specific domain model type or scalar
4. Remove any `Builder` type references from the interface
5. Update implementations to return the correct types

### Detection Checklist
- [ ] Check `use` statements in repository interface files for Eloquent types
- [ ] Search for `EloquentCollection`, `Builder`, `Model` in interface signatures
- [ ] Verify the interface can be implemented without Eloquent
- [ ] Check if in-memory test implementations exist and are Eloquent-free
- [ ] Review the domain layer's dependencies — does it require Laravel's ORM?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Repository Interface Free of Eloquent-Specific Types |
| Skill | `06-skills.md` — Create a Repository Interface for an Aggregate Root |

---

## 5. Repository Methods Returning Query Builders

### Category
Architecture

### Description
Repository methods that return Eloquent query builders instead of hydrated domain objects. Callers must build and execute the query themselves, coupling domain code to Eloquent's query builder API.

### Why It Happens
Returning a builder is "flexible" — callers can customize the query. The developer may not want to anticipate all query variations in the interface. The builder pattern is common in Laravel and seems natural.

### Warning Signs
- Return type of `Builder` or `EloquentBuilder` in repository method signatures
- Caller code continuing the query: `$repo->findPending()->where('amount', '>', 100)->get()`
- Repository methods that don't call `->get()`, `->first()`, or `->find()` before returning
- Callers executing different queries from the same repository method (varying columns, conditions)
- The repository is essentially a query factory, not a collection abstraction
- Domain logic appears in callers as query builder chains

### Why Harmful
- Domain code is coupled to Eloquent's query builder API
- The repository doesn't abstract persistence — it's an Eloquent factory
- Query logic that should be in the repository is scattered across callers
- Swapping persistence (e.g., to an in-memory store) requires changing all callers that build queries
- The repository interface doesn't express what queries are possible

### Consequences
- Domain logic and query building are mixed in caller code
- No single place to optimize queries (eager loading, pagination)
- Repository pattern provides no testability benefit (query still goes to database)
- Callers must know Eloquent query builder API to use the repository
- Refactoring queries requires finding and updating all builder chains in callers

### Preferred Alternative
```php
interface OrderRepository
{
    public function findPendingOrders(): Collection; // Returns domain objects, not builders
}
```

### Refactoring Strategy
1. Identify repository methods returning query builders
2. For each caller's builder chain, determine the actual query result needed
3. Add explicit repository methods that return the result directly
4. Remove the builder-returning method
5. Update callers to use the new explicit methods

### Detection Checklist
- [ ] Search for `: Builder`, `: EloquentBuilder` in repository interface files
- [ ] Check caller code for `->where()`, `->orderBy()`, `->with()` chained after repository calls
- [ ] Review whether the repository actually abstracts persistence or just creates queries
- [ ] Verify that repository methods return hydrated domain objects
- [ ] Test if swapping to an in-memory repository would require changing caller code

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Domain Objects or Collections, Never Query Builders |
| Skill | `06-skills.md` — Create a Repository Interface for an Aggregate Root |

---

## 6. Generic `findBy()` or `matching()` Query Methods

### Category
Maintainability

### Description
Repository interfaces with generic `findBy()` or `matching(Criteria $criteria)` methods that hide the repository's query capabilities. Callers cannot discover available queries without reading the implementation.

### Why It Happens
Generic methods seem "flexible" — they handle any query without adding new methods. The Specification pattern is a DDD concept that some repositories adopt. The developer may anticipate many query variations.

### Warning Signs
- `public function findBy(string $field, mixed $value): Collection` — generic field/value lookup
- `public function matching(Specification $spec): Collection` — specification-based filtering
- Callers constructing criteria objects or arrays with string field names
- No named methods for specific business queries
- Repository interface that's empty except for generic methods
- New queries added by creating new criteria objects instead of new methods

### Why Harmful
- The repository's query capabilities are undocumented — developers must read the implementation
- String-based field references are fragile and cannot be refactored
- Criteria objects that must be kept in sync with the domain model
- Generic methods don't communicate in the ubiquitous language
- Adding a new query doesn't require changing the interface, but callers must know the criteria format

### Consequences
- Duplicated criteria construction across callers
- Field name strings scattered through the codebase
- No discoverability: "what queries can I run against this repository?"
- Refactoring field names requires finding all criteria strings
- The repository doesn't contribute to the ubiquitous language

### Preferred Alternative
```php
interface OrderRepository
{
    public function findPendingOrders(): Collection;
    public function findOrdersByCustomer(int $customerId): Collection;
    public function findOverdueOrders(): Collection;
    // Each method is self-documenting and speaks the domain language
}
```

### Refactoring Strategy
1. Identify generic `findBy()` or `matching()` methods on repository interfaces
2. Determine all actual query patterns used by callers
3. Create explicit named methods for each query
4. Remove generic methods
5. Update callers to use named methods

### Detection Checklist
- [ ] Search for `function findBy(`, `function matching(`, `function search(` in repository interfaces
- [ ] Check callers for criteria/specification object construction
- [ ] Review whether string field names are passed as parameters
- [ ] Verify that the interface communicates query capabilities through method names
- [ ] Check if the Specification pattern adds value or just complexity

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Make Repository Methods Explicit About Their Query Intent |
| Decision Tree | `07-decision-trees.md` — Repository Interface Design |
