# Anti-Patterns — Repository Pattern Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Repository Pattern Design |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Ceremony Without Benefit | Medium | High | Code review: interface + repository for every entity including lookups |
| Repository Leakage | High | Medium | Code review: repositories return QueryBuilders or services bypass them |
| Anemic Repository | Medium | Medium | Code review: repository mirrors Eloquent's API with no added logic |
| Repository Performing Business Logic | High | Medium | Code review: repository contains validation, authorization, or event dispatching |
| Repository Method Explosion | Medium | Medium | Code review: repository has 20+ methods for every query variation |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Interface Without Multiple Implementations | Every repository has an interface but only one implementation ever exists | Adds file count without polymorphism benefit; can test-mock concrete classes directly |
| Repository Returning QueryBuilder | Maximum flexibility for callers but zero query encapsulation | Bypasses all repository-level scoping, caching, and decoration |
| No Test Database for Repository Tests | Repository tests mock Eloquent instead of testing against a real database | Tests pass but actual queries may have bugs, relationship issues, or performance problems |

---

## Anti-Pattern Details

### AP-RPD-01: Repository Returning QueryBuilder

**Description**: Repository methods return `Builder` (Eloquent's query builder) instead of executing the query and returning models or collections. Callers then add `->where()`, `->orderBy()`, `->limit()`, and other query methods to the returned builder. The repository has no control over the final query — it's a factory that produces query starting points, not a data access mediator.

**Root Cause**: The developer wants to maximize flexibility for callers. "Why limit what callers can query? Let them build whatever query they need." This abdicates the repository's responsibility of centralizing query logic.

**Impact**:
- Multi-tenant scoping in the repository is bypassed by caller-added conditions
- Repository-level caching cannot work (the final query is unknown at the repository level)
- Service tests must mock both the repository and the QueryBuilder (fragile)
- The abstraction has collapsed — callers are effectively writing raw Eloquent queries

**Detection**:
- Code review: repository method return type is `Builder`, `EloquentBuilder`, or `\Illuminate\Database\Eloquent\Builder`
- Code review: service code calls `$this->repo->query()->where(...)->orderBy(...)->get()`
- Static analysis: repository methods return types from `Illuminate\Database`

**Solution**:
- Repository methods must execute queries and return models, collections, or DTOs
- Add specific query methods for every data access pattern the application needs
- Use criteria/query objects for complex, dynamic queries
- Never expose a `query()` or `builder()` method on the repository

**Example**:
```php
// BEFORE: Repository returns QueryBuilder
interface UserRepositoryInterface
{
    public function query(): Builder; // ❌ exposes builder
    public function find(int $id): ?User;
}
// Service builds ad-hoc queries
class UserService
{
    public function findActiveAdmins(): Collection
    {
        return $this->users->query()
            ->where('role', 'admin')
            ->where('active', true)
            ->with('profile')
            ->get();
    }
}

// AFTER: Specific query methods
interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function findActiveByRole(string $role): Collection;
    public function search(UserSearchCriteria $criteria): LengthAwarePaginator;
}
class EloquentUserRepository implements UserRepositoryInterface
{
    public function findActiveByRole(string $role): Collection
    {
        return User::where('role', $role)->where('active', true)->with('profile')->get();
    }
}
```

---

### AP-RPD-02: Repository Performing Business Logic

**Description**: A repository contains business rules, validation, authorization checks, event dispatching, or cross-entity orchestration logic. The repository becomes a hybrid of data access and business logic, violating the single-responsibility principle. Changes to business rules require modifying the repository, and the repository cannot be reused across different business contexts.

**Root Cause**: The developer puts "everything related to this entity" in the repository because it seems organized. "Email uniqueness checks and authorization are related to users, so they go in the UserRepository."

**Impact**:
- Business logic is coupled to data access — cannot use the same query with different business rules
- Repository tests must set up business logic conditions, not just data access
- Changing business rules requires modifying the data access class (higher risk)
- The repository cannot be used from different bounded contexts

**Detection**:
- Code review: repository calls `Gate::authorize()`, throws domain exceptions, dispatches events
- Code review: repository calls other repositories (coordinating cross-entity logic)
- Code review: repository has validation logic (`if ($this->emailExists(...))`)

**Solution**:
- Keep repositories focused on data access: queries, filtering, sorting, pagination, caching
- Move business rules to services or actions
- Move event dispatching to the service layer after the repository operation completes
- Move authorization to the controller or Gate layer

**Example**:
```php
// BEFORE: Repository with business logic
class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        if (User::where('email', $data['email'])->exists()) {
            throw new DuplicateEmailException($data['email']); // ❌ business rule
        }
        if (!Gate::allows('create', User::class)) {
            throw new AuthorizationException(); // ❌ authorization
        }
        $user = User::create($data);
        event(new UserCreated($user)); // ❌ event dispatching
        return $user;
    }
}

// AFTER: Repository is pure data access
class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        return User::create($data);
    }
}
// Business logic in service
class UserService
{
    public function register(CreateUserDto $dto): User
    {
        if ($this->users->findByEmail($dto->email)) {
            throw new DuplicateEmailException($dto->email);
        }
        $user = $this->users->create($dto->toArray());
        event(new UserCreated($user));
        return $user;
    }
}
```

---

### AP-RPD-03: Anemic Repository

**Description**: A repository that mirrors the Eloquent model's API with no additional query logic, caching, scoping, or decoration. `find($id)`, `create($data)`, `update($id, $data)`, `delete($id)` — identical to calling `Model::find()`, `Model::create()`, etc. directly. The repository adds a file and an interface but does not centralize any query logic or provide any benefit.

**Root Cause**: Dogmatic adherence to the repository pattern. The developer creates a repository for every entity because "the architecture requires it," without evaluating whether the entity's query logic justifies the abstraction.

**Impact**:
- Adds ceremony (interface + implementation + binding) without architectural return
- Developers resent the boilerplate for entities with simple CRUD
- Every "anemic" repository dilutes the signal of repositories that actually add value
- Tests must mock a repository that does nothing, adding test complexity without benefit

**Detection**:
- Code review: repository methods are one-line passthroughs to Eloquent static methods
- Code review: repository has no criteria objects, no caching decorators, no scoping
- Metrics: 80% of repositories have `find`, `create`, `update`, `delete`, `findAll` — nothing else

**Solution**:
- Skip the repository for entities with simple CRUD and no query complexity
- Only create repositories for entities with: complex queries, caching needs, multi-tenancy scoping, or data source switching requirements
- For existing anemic repositories, consider removing the repository and using direct Eloquent
- Document which entities use repositories and why

**Example**:
```php
// BEFORE: Anemic repository
interface TagRepositoryInterface
{
    public function find(int $id): ?Tag;
    public function create(array $data): Tag;
    public function update(int $id, array $data): Tag;
    public function delete(int $id): void;
}
class EloquentTagRepository implements TagRepositoryInterface
{
    public function find(int $id): ?Tag { return Tag::find($id); }
    public function create(array $data): Tag { return Tag::create($data); }
    public function update(int $id, array $data): Tag { $t = Tag::findOrFail($id); $t->update($data); return $t; }
    public function delete(int $id): void { Tag::destroy($id); }
}
// Tag has no complex queries, no caching, no scoping

// AFTER: Direct Eloquent, no repository
// Just use Tag::find(), Tag::create(), etc. directly in the service
```
