# Anti-Patterns — Controller-Service-Repository Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Controller-Service-Repository Flow |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Ceremony Without Benefit | Medium | High | Code review: every entity gets full stack including join tables |
| Repository Leakage | High | Medium | Code review: repos return QueryBuilder or services call Eloquent directly |
| Anemic Service with Complete Repository | Medium | Medium | Code review: service just forwards repository calls with no business logic |
| Leaking Eloquent Through Repository | High | Medium | Code review: repo methods accept/return Eloquent-specific types |
| Repository Without Interface | Medium | Medium | Code review: concrete repository used directly, preventing decoration |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Full Stack for Every Entity | Every database table gets an interface, repository class, service, and binding | Massive file count, team resents the ceremony, velocity drops |
| Service Using Eloquent in Repository Architecture | Some data access goes through repositories, some uses Eloquent directly in services | Inconsistent, defeats purpose of the architecture |
| No Interface Binding Registration | Repositories are injected as concrete classes, not through interfaces | Can't decorate with caching, can't swap implementations, harder to mock |

---

## Anti-Pattern Details

### AP-CSR-01: Ceremony Without Benefit

**Description**: Every entity in the application — including lookup tables, join tables, and simple settings models — gets the full Controller-Service-Repository treatment: an interface, a repository implementation, a service provider binding, and a service class. For entities that are never queried with complex logic, never cached, and never swapped, the ceremony creates a massive file count with no architectural return.

**Root Cause**: Dogmatic adherence to the pattern. A team mandate of "always use repositories" is applied without judgment. Junior developers create the full stack for every migration without evaluating whether the entity needs it.

**Impact**:
- 4× file count per entity (interface, repository, service, binding) for entities that need 1 file
- Developer resentment: "I have to create 4 files to add a settings table?"
- Genuine repository benefits (caching, scoping) are diluted among hundreds of trivial implementations
- Code navigation is harder (4 files to find instead of 1)

**Detection**:
- Metrics: 80% of repositories have the same 5 methods (`find`, `create`, `update`, `delete`, `paginate`) with zero additional logic
- Code review: repository for a 3-field lookup table (statuses, categories, types)
- Developer feedback: complaints about boilerplate for simple entities

**Solution**:
- Only create repositories for entities with complex query logic, caching needs, or multi-tenancy scoping
- Use direct Eloquent for simple entities and lookup tables
- Adopt the hybrid approach: full stack for core domains, direct Eloquent for simple entities
- Document which entities use each approach

**Example**:
```php
// BEFORE: Ceremony for a simple lookup table
interface StatusRepositoryInterface { /* CRUD methods */ }
class EloquentStatusRepository implements StatusRepositoryInterface { /* CRUD mirroring Eloquent */ }
// Service provider binding
class StatusService { /* wraps repository */ }

// AFTER: Direct Eloquent for simple entities
// No interface, no repository, no binding, no service
$status = Status::find($id); // Just this
```

---

### AP-CSR-02: Repository Leakage

**Description**: The abstraction provided by the repository pattern has collapsed because the repository returns QueryBuilders, and services call `->where()` and `->orderBy()` on the result. Alternatively, services bypass the repository entirely and call Eloquent directly. In either case, the repository no longer mediates data access — it is a pass-through with no control over what queries execute.

**Root Cause**: Convenience. Returning a QueryBuilder gives the caller maximum flexibility, and developers prioritize convenience over architecture. The repository exists but everyone treats it as optional.

**Impact**:
- Multi-tenant scoping in the repository is bypassed by callers adding querys
- Repository-level caching is meaningless if callers can add conditions after retrieval
- Architecture is effectively flat — the repository provides no isolation
- Changing data access logic requires finding all QueryBuilder call sites, not just the repository

**Detection**:
- Code review: repository method returns `Builder` type hint
- Code review: service code calls `$this->users->query()->where(...)` or `$this->users->find($id)->where(...)`
- Static analysis: service imports `Builder` or calls Eloquent methods on repository results

**Solution**:
- Repository methods must return models, DTOs, or collections — never QueryBuilders
- Add specific query methods to the repository for every data access pattern the service needs
- Use criteria/query objects instead of ad-hoc query building
- Remove `query()` methods from repositories

**Example**:
```php
// BEFORE: Repository leakage
class EloquentUserRepository implements UserRepositoryInterface
{
    public function query(): Builder // ❌ exposing QueryBuilder
    {
        return User::query();
    }
}
// Service adds conditions
class UserService
{
    public function findActiveAdmins(): Collection
    {
        return $this->users->query()
            ->where('role', 'admin')
            ->where('active', true)
            ->get();
    }
}

// AFTER: Encapsulated query methods
interface UserRepositoryInterface
{
    public function findActiveAdmins(): Collection;
}
class EloquentUserRepository implements UserRepositoryInterface
{
    public function findActiveAdmins(): Collection
    {
        return User::where('role', 'admin')->where('active', true)->get();
    }
}
```

---

### AP-CSR-03: Leaking Eloquent Through Repository

**Description**: Repository method signatures accept or return Eloquent-specific types (`Builder`, `EloquentCollection`, `Model`), coupling callers to Laravel's ORM. If the team ever swaps data sources, every caller must change. More practically, the caller cannot be tested without Eloquent's database layer, defeating the test-seam benefit of the repository pattern.

**Root Cause**: The developer doesn't abstract the return type. Returning `User` (an Eloquent model) is the path of least resistance, and abstracting to an interface or DTO feels like unnecessary work.

**Impact**:
- Callers depend on Eloquent-specific features (dynamic properties, relationships)
- Swapping data sources requires rewriting all callers, not just the repository
- Tests require Eloquent's database layer (cannot use simple in-memory mocks)
- Repository interface is not truly a "contract" — it's still coupled to Eloquent

**Detection**:
- Code review: repository interface returns model classes (`User`, `Order`) instead of DTOs or interfaces
- Code review: callers access `$user->posts` (Eloquent relationship) on repository return values
- Static analysis: repository return types extend `Model`

**Solution**:
- Return DTOs or plain objects from repository methods
- Define return types in the interface that are not Eloquent-specific
- If returning models is necessary (for further querying), accept that full decoupling is not achieved
- For strict decoupling, return `array` or typed DTOs from all read methods

**Example**:
```php
// BEFORE: Leaking Eloquent through repository
interface UserRepositoryInterface
{
    public function find(int $id): ?User; // ❌ returns Eloquent model
    public function findByEmail(string $email): ?User;
    public function findAll(): Collection; // ❌ returns Eloquent Collection
}

// AFTER: Abstract return types
interface UserRepositoryInterface
{
    public function find(int $id): ?UserDto;
    public function findByEmail(string $email): ?UserDto;
    public function findAll(): array; // array of UserDto
}
```

---

### AP-CSR-04: Anemic Service with Complete Repository

**Description**: The service layer exists but contains no business logic — each service method simply forwards to the corresponding repository method with no transformations, conditionals, or decisions. The service is a transparent pass-through that adds a file and a method call but provides no architectural value. This is the service-layer equivalent of the anemic action anti-pattern.

**Root Cause**: Dogmatic adherence to the three-layer pattern. The developer creates a service because "the architecture requires a service layer," but the entity has no business rules that justify it.

**Impact**:
- Increases file count without improving testability or clarity
- Tests must mock both a service and a repository (no test simplification)
- Developers learn that the service layer is meaningless ceremony
- Genuine services are harder to distinguish from pass-through ones

**Detection**:
- Code review: every service method body is `return $this->repository->methodName($param)`
- Code review: deleting the service and calling the repository directly would produce identical behavior
- Test inspection: service tests look identical to repository tests

**Solution**:
- Skip the service layer for entities with no business logic
- Call repositories directly from controllers (if repositories exist) or use actions
- Add the service layer only when business rules emerge
- For anticipated growth, document why the service exists preemptively

**Example**:
```php
// BEFORE: Anemic service
class UserService
{
    public function __construct(private UserRepository $users) {}
    public function find(int $id): ?User { return $this->users->find($id); }
    public function create(array $data): User { return $this->users->create($data); }
    public function update(int $id, array $data): User { return $this->users->update($id, $data); }
    public function delete(int $id): void { return $this->users->delete($id); }
}

// AFTER: Remove the service, use repository directly (or action)
class UserController
{
    public function __construct(private UserRepository $users) {}
    public function show(int $id): JsonResponse { return response()->json($this->users->find($id)); }
}
```
