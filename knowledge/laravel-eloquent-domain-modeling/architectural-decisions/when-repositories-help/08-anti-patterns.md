# Anti-Patterns: When Repositories Help

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When Repositories Help |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Leaky Abstraction (Repository Mirrors Eloquent API) | Architecture | High |
| 2 | Repository Per Entity Proliferation | Design | High |
| 3 | N+1 via Repository (Missing Eager Loading) | Performance | Critical |
| 4 | Transaction Antipattern (Repository Manages Transactions) | Reliability | High |
| 5 | Repository as Default Layer for Every Model | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Repository Interface Exposes Eloquent-Specific Types | when-repositories-help, ports-and-adapters | High |
| Repository Accumulates 20+ Finder Methods | when-repositories-help, query-object-alternative | High |
| Repository Returns Eloquent Models Instead of Domain Models | when-repositories-help, eloquent-as-adapter | Critical |
| Testing With Mocked Repositories Instead of Real Database | when-repositories-help, when-repositories-hurt | Medium |
| Repository for Lookup Tables With No Storage Variation | when-repositories-help | Medium |

---

## Anti-Pattern 1: Leaky Abstraction

### Category
Architecture — Abstraction Without Hiding

### Description
The repository interface mirrors Eloquent's API exactly: `find(int $id)`, `save(Model $model)`, `create(array $data)`, `findWhere(array $criteria)`. The interface provides no abstraction over storage — it's a thin, ceremony-heavy wrapper that adds files without adding value.

### Why It Happens
Developers create repository interfaces by copying Eloquent's method signatures. They don't redesign the interface around domain concepts because it requires thinking about what the domain actually needs.

### Warning Signs
- Interface methods named `find`, `findOrFail`, `save`, `create`, `update`, `delete`
- Interface accepts `array $data` for mass-assignment
- Interface methods match Eloquent model methods 1:1
- Interface has a generic `findWhere(array $criteria, array $orderBy)` method
- Callers cannot tell what query runs by looking at the method name

### Why Harmful
A leaky abstraction provides no hiding over direct Eloquent usage. Callers using the repository get no benefit — they still think in SQL terms and the abstraction can't be swapped because the interface assumes SQL concepts. The repository adds 3 files (interface, implementation, binding) with zero abstraction value.

### Real-World Consequences
A `UserRepository` with `find(int $id)`, `save(User $user)`, and `create(array $data)` is used across 20 controllers. When the team wants to cache user lookups, they must still add caching to every controller or create a decorator. The repository abstraction didn't help. Switching from MySQL to MongoDB would require changing all 20 callers because the interface is designed around SQL concepts.

### Preferred Alternative
Design repository interface methods using domain language: `findActive()`, `findByEmail(string $email)`, `findAllOverdueSince(DateTimeImmutable $since)`. Each method documents the specific domain query.

### Refactoring Strategy
1. Audit the repository interface — identify all Eloquent-mirroring methods
2. Replace generic methods with domain-specific names
3. Remove `create(array $data)` — use explicit `store(DomainModel $model)`
4. Remove `findWhere(array)` — replace with named query methods
5. If the interface has only generic methods after removal, delete the repository entirely

### Detection Checklist
- [ ] Repository interface has `find`, `save`, `create`, `update`, `delete` methods
- [ ] Interface accepts `array $data` or `array $criteria`
- [ ] Interface has no domain-specific method names
- [ ] Interface is a near 1:1 copy of Eloquent's public API

### Related Rules/Skills/Decision Trees
- **Rule 1**: Design repository interfaces around domain concepts (`05-rules.md`)
- **Rule 6**: Never expose Eloquent-specific types in interfaces (`05-rules.md`)
- **Decision 1**: Repository Layer vs Direct Eloquent Usage (`07-decision-trees.md`)

---

## Anti-Pattern 2: Repository Per Entity Proliferation

### Category
Design — Interface Explosion

### Description
A repository interface exists for every database table, including child entities, lookup tables, and join tables. Fifty repositories exist for fifty tables, each with one Eloquent implementation and no storage variation.

### Why It Happens
Developers apply the "one repository per model" pattern from other frameworks without understanding aggregate roots. Scaffolding tools generate a repository for every model by default.

### Warning Signs
- 50+ repository interfaces for a project with 5-6 aggregate roots
- Repositories for child entities: `OrderLineRepository`, `OrderPaymentRepository`
- Repositories for lookup tables: `CountryRepository`, `StatusRepository`, `CategoryRepository`
- Child entity repositories have write methods (allowing independent persistence)
- Child entities are persisted outside their aggregate root

### Why Harmful
Repository proliferation obscures the system's true aggregate boundaries. Child entity repositories encourage bypassing aggregate invariants. 50 repositories mean 150 files (interface + implementation + test) to maintain. Developers can't navigate the codebase effectively.

### Real-World Consequences
An `OrderLineRepository` allows adding order lines directly without going through the `Order` aggregate. The `Order` invariant "maximum 10 lines per order" is enforced in `Order::addLine()` but the developer uses `OrderLineRepository::create()` to bypass it. Orders accumulate 50+ lines.

### Preferred Alternative
One repository per aggregate root. Child entities are accessed through their root's repository. Lookup tables use direct Eloquent.

### Refactoring Strategy
1. Identify all aggregate roots (transactional consistency boundaries)
2. Delete repository interfaces for non-aggregate-roots
3. Move child entity persistence methods into the aggregate root repository
4. Update callers to access child entities through the aggregate root
5. For lookup tables, replace repository calls with direct Eloquent queries

### Detection Checklist
- [ ] Repository exists for every database table
- [ ] Repository count > 2x the number of aggregate roots
- [ ] Child entities have independent repository write methods
- [ ] Lookup tables have repository interfaces

### Related Rules/Skills/Decision Trees
- **Rule 2**: Create one repository per aggregate root (`05-rules.md`)
- **Decision 1**: Repository Layer vs Direct Eloquent Usage (`07-decision-trees.md`)

---

## Anti-Pattern 3: N+1 via Repository (Missing Eager Loading)

### Category
Performance — Query Explosion

### Description
Repository methods do not eager-load relations, forcing callers to lazy-load after the repository returns. Each relation access triggers a separate query, causing N+1 query patterns. The repository hides the performance problem behind an interface.

### Why It Happens
The repository method fetches only the base model. The developer assumes callers will only access scalar attributes. Callers access relations for display, triggering lazy loads.

### Warning Signs
- Repository `findById()` has no `with()` call
- Callers access `$order->items`, `$order->payments` after repository returns
- Debugbar shows N+1 queries originating from repository consumers
- Repository has no `$with` parameter for caller-specified eager loading
- Repository tests don't assert relation loading

### Why Harmful
The repository abstraction causes the N+1 problem it promises to solve. Debugging is harder because queries are hidden behind the interface. Developers can't easily see that the repository is underfetching.

### Real-World Consequences
A `findAllForDashboard()` repository method returns orders without eager-loading `items` and `payments`. The dashboard loop renders order cards showing item count and payment status — 1 (orders) + N (items) + N (payments) = 201 queries for 100 orders. Page load time is 8 seconds.

### Preferred Alternative
Eager-load all required relations inside the repository method. Accept an optional `$with` parameter for caller-specific loading.

### Refactoring Strategy
1. Identify all relation accesses in callers of the repository
2. Add `with()` calls to the repository method
3. Add an optional `array $with = []` parameter for flexible loading
4. Merge default relations with caller-specified relations
5. Add tests that verify eager loading happens using `QueryLog`

### Detection Checklist
- [ ] Repository methods lack `with()` calls
- [ ] Callers loop and access relations after repository return
- [ ] Debugbar shows repeated queries for relations
- [ ] Repository has no `$with` parameter

### Related Rules/Skills/Decision Trees
- **Rule 5**: Accept `$with` parameters for eager loading (`05-rules.md`)
- **Decision 4**: Repository Finder Method vs Query Object (`07-decision-trees.md`)

---

## Anti-Pattern 4: Transaction Antipattern (Repository Manages Transactions)

### Category
Reliability — Nested Transaction Bugs

### Description
Repository methods wrap their operations in `DB::transaction()`, and the caller also uses `DB::transaction()`. This creates nested transactions (savepoints) where the inner transaction may commit while the outer fails, causing partial writes.

### Why It Happens
Developers add transaction wrapping to repository methods "for safety" without considering whether the caller already manages transactions.

### Warning Signs
- Repository `store()` method uses `DB::transaction()`
- Callers also wrap repository calls in `DB::transaction()`
- Laravel log shows "Nested transaction" messages
- Debugging reveals partial commits after exceptions
- Controller or action uses `DB::transaction()` around a repository call

### Why Harmful
Nested transactions in Laravel create savepoints, not true nested transactions. The inner savepoint can be released (committed) while the outer transaction rolls back, leaving partially committed data. This is a subtle, hard-to-debug data corruption pattern.

### Real-World Consequences
An `OrderRepository::store()` wraps `$order->save()` in `DB::transaction()`. A `PlaceOrderAction` wraps `$order->markAsPaid()`, `$this->invoices->store()`, and `$this->payments->record()` in `DB::transaction()`. If the payment recording fails, the outer transaction rolls back placed orders — but the repository's inner transaction has already committed the order save.

### Preferred Alternative
Repository methods must not manage transactions. The use-case layer (action/controller) manages the transaction boundary.

### Refactoring Strategy
1. Remove all `DB::transaction()` calls from repository methods
2. Ensure repository methods just call `$model->save()` or `Model::create()` directly
3. Verify that callers manage the transaction boundary when needed
4. Add tests that verify rollback behavior at the action/controller level

### Detection Checklist
- [ ] Repository method uses `DB::transaction()`
- [ ] Caller also uses `DB::transaction()` around repository call
- [ ] Nested transaction warnings in log
- [ ] Partial commits observed after failures

### Related Rules/Skills/Decision Trees
- **Rule 3**: Keep transaction management out of repositories (`05-rules.md`)
- **Rule 8**: Never nest transactions (`05-rules.md`)

---

## Anti-Pattern 5: Repository as Default Layer for Every Model

### Category
Design — Accidental Abstraction

### Description
A repository interface is created for every Eloquent model at the start of the project, regardless of actual need. All models have a repository, even simple lookup tables and CRUD-only entities. The repository is created as the default data access pattern, not as a tactical choice.

### Why It Happens
Enterprise architecture templates or "best practices" guides that recommend repositories for all data access without considering YAGNI. Scaffolding that generates a repository with every model.

### Warning Signs
- 100% of models have a corresponding repository interface
- Lookup tables (countries, statuses, categories) have repositories
- Repository `findAll()` on lookup tables just calls `Model::all()`
- No repository provides any storage variation
- Developers cannot explain the specific benefit of any single repository
- Removing a repository would require changes only in one place (no abstraction benefit)

### Why Harmful
50-100 extra files (interfaces + implementations + bindings) with zero benefit. Development velocity slows from the indirection tax. Developers question the architecture. When a repository is truly needed (e.g., adding Redis caching), the existing leaky abstraction needs to be redesigned anyway.

### Real-World Consequences
A project with 40 models has 40 repository interfaces, 40 Eloquent implementations, and 40 service provider bindings. The `CountryRepository` has one method: `findAll()` which returns `Country::all()`. The `CategoryRepository` has one method: `findAll()` which returns `Category::all()`. When the team needs a Redis cache for the `CountryRepository`, the interface is too generic (returns `Collection`, not specific queries) and must be redesigned.

### Preferred Alternative
Start with direct Eloquent usage. Add a repository only when storage actually varies, persistence logic is complex, or a second backend is needed.

### Refactoring Strategy
1. Audit all repository interfaces
2. Delete interfaces for lookup tables and CRUD-only entities
3. Replace repository injections with direct Eloquent usage
4. Delete repository implementations and bindings
5. Keep repositories only for aggregate roots with actual storage variation needs

### Detection Checklist
- [ ] Every model has a corresponding repository
- [ ] Lookup tables have repositories
- [ ] Most repositories have 2-3 methods with simple Eloquent calls
- [ ] No repository provides any measurable benefit over direct Eloquent
- [ ] Removing repositories would not affect functionality

### Related Rules/Skills/Decision Trees
- **Rule 4**: Abstract only when storage actually varies (`05-rules.md`)
- **Decision 1**: Repository Layer vs Direct Eloquent Usage (`07-decision-trees.md`)
- **Skill 1**: Remove an Unnecessary Repository Abstraction (`06-skills.md`)
