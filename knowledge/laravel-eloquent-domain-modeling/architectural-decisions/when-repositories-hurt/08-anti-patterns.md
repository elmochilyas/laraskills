# Anti-Patterns: When Repositories Hurt

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When Repositories Hurt |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Repository Proliferation (50+ Unnecessary Repos) | Design | High |
| 2 | Mock Testing False Security | Testing | Critical |
| 3 | Query Performance Hiding Behind Interfaces | Performance | High |
| 4 | Transactional Atrophy (Nested Transactions) | Reliability | High |
| 5 | Repository for Read-Only Lookup Tables | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Repository Interface Mirrors Eloquent API 1:1 | when-repositories-hurt, when-repositories-help | High |
| Testing With Repository Mocks Instead of Real Database | when-repositories-hurt | Critical |
| Repository Bloat (20+ Finder Methods Mixed With Writes) | when-repositories-hurt, query-object-alternative | High |
| Single-Implementation Repository Interfaces | when-repositories-hurt, ports-and-adapters | Medium |
| Repository Called "Testing" Justification | when-repositories-hurt | Medium |

---

## Anti-Pattern 1: Repository Proliferation (50+ Unnecessary Repos)

### Category
Design — Accidental Complexity

### Description
The codebase has 50+ repository interfaces and implementations for a straightforward Laravel application with a single MySQL database. Most repositories have one implementation, mirror Eloquent's API, and provide no storage abstraction value. The repository layer is a default architectural choice rather than a tactical one.

### Why It Happens
Enterprise architecture dogma applied without critical thinking. The team assumes "repositories are best practice for Laravel." Scaffolding tools generate repos for every model. Legacy projects started with repositories and never questioned them.

### Warning Signs
- 50+ repository interfaces for 50 database tables
- Most repositories have exactly one Eloquent implementation
- No repository's interface differs meaningfully from Eloquent's API
- Lookup tables (countries, statuses) have repositories
- Child entities have independent repositories with write methods
- Developers complain about the number of files
- Removing a repository would not require any architectural change

### Why Harmful
The repository layer adds 100-150 extra files (interface + implementation + test/binding) without providing any capability that direct Eloquent usage doesn't. Each repository adds cognitive load — developers must navigate the interface, find the binding, and read the implementation to understand what query runs. The indirection slows development without benefit.

### Real-World Consequences
A team of 6 manages 55 repository interfaces and implementations. A simple change (add a `where('active', true)` filter to a user list query) requires: find the repository interface, find the binding, open the implementation, modify the query, update the interface if needed, update tests. The same change with direct Eloquent: open the controller/action, modify the query. The repository adds 3 extra file navigations per change.

### Preferred Alternative
Use direct Eloquent in actions and controllers. Add repositories only when storage actually varies or persistence logic is genuinely complex.

### Refactoring Strategy
1. Audit all repository interfaces — identify candidates for deletion
2. Delete interfaces and implementations for lookup tables, child entities, and CRUD-only models
3. Replace repository injections with direct Eloquent or Query Objects
4. Delete service provider bindings for removed repositories
5. Keep repositories only for aggregate roots with actual storage variation needs

### Detection Checklist
- [ ] Repository count > 20 for a simple CRUD application
- [ ] Repositories exist for lookup tables (countries, statuses, categories)
- [ ] Most repositories have 2-3 methods wrapping simple Eloquent calls
- [ ] No storage backend variation exists or is planned

### Related Rules/Skills/Decision Trees
- **Rule 1**: Do not create a repository when only one storage backend exists (`05-rules.md`)
- **Rule 4**: Delete unused repository interfaces (`05-rules.md`)
- **Decision 1**: Repository Layer vs Direct Eloquent Usage (`07-decision-trees.md`)
- **Skill 1**: Remove an Unnecessary Repository Abstraction (`06-skills.md`)

---

## Anti-Pattern 2: Mock Testing False Security

### Category
Testing — Incomplete Verification

### Description
Unit tests mock repository interfaces and assert method call patterns, but never test against a real database. The tests pass with mocks, but the Eloquent implementation contains SQL errors — wrong column names, missing casts, constraint violations. Tests provide false confidence.

### Why It Happens
Teams trained in "pure unit testing" create mocks for all database dependencies. They don't realize that mocking a repository only verifies call patterns, not the actual SQL behavior.

### Warning Signs
- Tests create repository mocks with `createMock()` or `getMockBuilder()`
- Tests assert that `$repository->findById()` was called
- Tests don't use `RefreshDatabase` or model factories
- SQL errors in the Eloquent implementation pass CI
- Test suite runs in milliseconds (no database interaction)

### Why Harmful
False confidence is worse than no tests. Developers deploy code that "passed all tests" but fails in production with SQL errors. Trust in the test suite erodes. Debugging requires manual database testing.

### Real-World Consequences
A `UserRepository` has an Eloquent implementation with a typo: `->where('emial', $email)` instead of `->where('email', $email)`. The mock-based test suite passes because the mock returns a fake user when `findByEmail()` is called. The production login screen breaks for all users. The bug is caught by customer support, not tests.

### Preferred Alternative
Use `RefreshDatabase` with model factories and test against a real database (SQLite in-memory). Assert actual data state, not method call patterns.

### Refactoring Strategy
1. Identify all tests that mock repositories
2. Replace mocks with real model creation using factories
3. Add `use RefreshDatabase` to test classes
4. Replace mock assertions (`$repo->expects($this->once())->method('save')`) with state assertions (`$this->assertDatabaseHas(...)`)
5. Verify the tests actually catch SQL errors by introducing a deliberate mistake

### Detection Checklist
- [ ] Tests mock repository interfaces
- [ ] Tests assert method call patterns instead of data state
- [ ] Tests don't use `RefreshDatabase`
- [ ] SQL errors in repository implementations pass CI

### Related Rules/Skills/Decision Trees
- **Rule 3**: Test with real databases and model factories (`05-rules.md`)
- **Rule 6**: If the only reason for a repository is "testing," remove it (`05-rules.md`)
- **Decision 3**: Repository Mock vs Real Database Test (`07-decision-trees.md`)
- **Skill 2**: Refactor a Repository Test to Use Real Database (`06-skills.md`)

---

## Anti-Pattern 3: Query Performance Hiding Behind Interfaces

### Category
Performance — Opaque Queries

### Description
Repository methods hide the actual SQL query behind an interface. Developers reading an action cannot tell what query executes without opening the repository implementation. Performance issues (missing indexes, N+1 queries, full table scans) are invisible at the call site.

### Why It Happens
The repository pattern intentionally hides storage details. But in a single-backend Laravel application, this hiding makes queries invisible and performance debugging harder.

### Warning Signs
- Actions inject repositories and call methods like `findOverdue()` — the query is invisible
- Developers must open the repository implementation to see the query
- Debugbar queries are attributed to repository methods, not callers
- Performance reviews require navigating interface → binding → implementation
- Query tuning requires modifying the repository, not the action

### Why Harmful
Hiding queries behind interfaces prevents developers from immediately seeing the query cost when reading code. N+1 patterns, missing eager loads, and expensive queries go unnoticed until performance monitoring catches them in production.

### Real-World Consequences
An `OrderController::index()` calls `$this->repo->findAllRecent(30)` which internally runs: `Order::with('items', 'payments')->where('created_at', '>', now()->subDays(30))->get()`. The developer thinks `findAllRecent(30)` is a simple query. Without opening the repository, they don't know it loads 50,000 orders and their relations. The endpoint consumes 500MB of memory.

### Preferred Alternative
Write queries directly in actions (visible and explicit). Extract to Query Objects only when queries are complex or reused.

### Refactoring Strategy
1. Identify action methods that call repositories for read queries
2. Replace repository finder calls with direct Eloquent queries in the action
3. If the query is complex or reused, extract to a named Query Object (not a repository)
4. Keep repository only for write operations (store, delete) if storage varies

### Detection Checklist
- [ ] Actions call repository methods and the query is not visible
- [ ] Debugbar queries are attributed to repository classes
- [ ] Performance reviews require navigating to repository implementations
- [ ] Repository has 10+ finder methods with different queries

### Related Rules/Skills/Decision Trees
- **Rule 5**: Prefer direct Eloquent usage in actions (`05-rules.md`)
- **Rule 7**: Extract to a Query Object when queries become complex (`05-rules.md`)
- **Decision 4**: Repository Finder Method vs Query Object (`07-decision-trees.md`)
- **Skill 3**: Migrate Repository Finder Methods to Query Objects (`06-skills.md`)

---

## Anti-Pattern 4: Transactional Atrophy (Nested Transactions)

### Category
Reliability — Partial Write Risk

### Description
Repository methods manage their own database transactions, and callers also wrap calls in transactions. The nested transactions create savepoints where the inner transaction can commit independently of the outer, causing partial writes.

### Why It Happens
Developers add `DB::transaction()` to repository methods "for safety." They don't coordinate with the caller about who manages the transaction boundary.

### Warning Signs
- Repository methods contain `DB::transaction()` calls
- Actions/controllers also use `DB::transaction()` around repository calls
- "Nested transaction" messages in Laravel logs
- Partial database updates observed after failures
- Tests show data persisted after rollback expectations

### Why Harmful
Nested transactions in Laravel create savepoints. The inner savepoint can be released (committed) while the outer transaction rolls back. This causes the worst kind of data inconsistency — partial writes that appear to have succeeded.

### Real-World Consequences
A `UserRepository::store()` wraps `$user->save()` in `DB::transaction()`. An action wraps `$repo->store($user)` and `$this->mailer->sendWelcome($user)` in `DB::transaction()`. If the mailer throws, the outer transaction rolls back the user creation — but the repository's inner transaction has already committed the user. The user exists in the database but never received a welcome email.

### Preferred Alternative
Only the outermost (caller) manages transactions. Repository methods must not begin transactions.

### Refactoring Strategy
1. Remove all `DB::transaction()` calls from repository methods
2. Ensure repositories just call `$model->save()` or `Model::create()` directly
3. Add `DB::transaction()` to actions/controllers that coordinate multiple writes
4. Test the rollback behavior at the action/controller level

### Detection Checklist
- [ ] Repository method uses `DB::transaction()`
- [ ] Action also uses `DB::transaction()` around repository calls
- [ ] Nested transaction messages in logs
- [ ] Data persists after expected rollbacks

### Related Rules/Skills/Decision Trees
- **Rule 8**: Never nest transactions (`05-rules.md`)
- **Rule 3**: Keep transaction management out of repositories (`05-rules.md`)

---

## Anti-Pattern 5: Repository for Read-Only Lookup Tables

### Category
Design — Unnecessary Abstraction

### Description
Read-only lookup tables (countries, states, categories, statuses, roles) have repository interfaces and implementations. The repository typically has one method: `findAll()` which calls `Model::all()`. The abstraction provides no value over direct Eloquent usage.

### Why It Happens
Scaffolding generates a repository for every model. The team has a coding standard "every data access goes through a repository."

### Warning Signs
- Repository exists for `Country`, `State`, `Category`, `Status`, `Role`
- Repository has one method: `findAll()` returning `all()` rows
- Repository has no write methods (these are seeded, not user-edited)
- Repository implementation is 5-10 lines total
- Data is seeded and never modified by the application

### Why Harmful
Each lookup table repository adds 3 files (interface + implementation + binding) for a 1-line query. The abstraction provides no storage variation value (lookup data rarely changes storage). Developers navigate 3 files to understand a `Model::all()` call.

### Real-World Consequences
A `CountryRepository` with `findAll(): Collection` (returns `Country::all()`) and `findByCode(string $code): ?Country` (returns `Country::where('code', $code)->first()`) exists across 3 files. The same data could be obtained with `Country::all()` or `Country::where('code', $code)->first()` in a single line.

### Preferred Alternative
Use direct Eloquent for lookup tables. If the data should be cached, add caching at the controller or service level, not behind a repository.

### Refactoring Strategy
1. Identify all lookup table repositories
2. Delete the interface, implementation, and binding for each
3. Replace each repository injection with direct Eloquent usage
4. If the lookup data is accessed from many places, add a cached service (not a repository)

### Detection Checklist
- [ ] Repository exists for a lookup table (seeded, not user-editable data)
- [ ] Repository has only 1-2 read methods and no write methods
- [ ] Repository implementation is under 10 lines
- [ ] Repository provides no benefit over `Model::all()`

### Related Rules/Skills/Decision Trees
- **Rule 1**: No repository when only one backend exists (`05-rules.md`)
- **Rule 4**: Delete unused single-implementation interfaces (`05-rules.md`)
- **Decision 2**: Repository Interface vs No Interface (`07-decision-trees.md`)
