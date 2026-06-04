# Anti-Patterns — Controller-DTO-Service Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Controller-DTO-Service Flow |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Service as Dumping Ground | High | High | Code review: service has unrelated methods across domains |
| Service Circular Dependencies | High | Low | Static analysis: Service A depends on Service B, Service B depends on Service A |
| Stateful Service | High | Medium | Code review: service stores mutable per-request data in properties |
| Empty CRUD Service | Medium | High | Code review: service just forwards to `Model::create()` with no logic |
| Service with HTTP Dependencies | High | Medium | Static analysis: service imports `Request` or `Response` |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Premature Service Abstra tion | Creating services for entities with 1-2 operations that don't share dependencies | Adds ceremony without value, makes the codebase harder to navigate |
| Fat Entity Service | 15+ public methods and 10+ constructor dependencies on a single entity service | Impossible to understand, test, or maintain; a change to any method risks breaking others |
| Mixed Service Granularity | Some services are entity-oriented, others are capability-oriented, with no consistent rationale | Developers can't predict where to find logic for a given operation |

---

## Anti-Pattern Details

### AP-CDS-01: Service as Dumping Ground

**Description**: A service class (typically `UserService` or `OrderService`) that accumulates methods across unrelated domains over time. Authentication, profile management, billing, notifications, and team management all end up in the same `UserService` because they all "relate to users." The service grows to 20+ methods with 12+ constructor dependencies, losing all cohesion.

**Root Cause**: The entity-oriented naming convention (`UserService`) creates the illusion that any user-related operation belongs there. Without conscious effort to split by capability, the service becomes the default location for everything user-adjacent.

**Impact**:
- Testing one method requires mocking dependencies for all methods
- New developers can't understand the service's purpose (it has none — it's everything)
- Method count grows without bound; no natural refactoring signal
- Constructor dependency count exceeds 10, making instantiation complex

**Detection**:
- Code review: service has methods across authentication, billing, notifications, and settings
- Metrics: service has 10+ public methods or 8+ constructor dependencies
- Test inspection: test setup mocks 10+ dependencies even though the test exercises one method

**Solution**:
- Split by capability: `AuthenticationService`, `ProfileService`, `BillingService`, `NotificationService`
- Use the "50% dependency sharing" rule: if two methods don't share 50% of their dependencies, extract them
- Extract methods one at a time — don't attempt the full refactoring in one sprint
- Each extracted service should have a clear, single capability

**Example**:
```php
// BEFORE: Service as dumping ground
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private Mailer $mailer,
        private PaymentGateway $payments,
        private TeamRepository $teams,
        private AuditLogger $audit,
        private NotificationService $notifications,
        private FileStorage $storage,
    ) {}

    public function register(RegisterDto $dto): User { /* ... */ }
    public function login(LoginDto $dto): User { /* ... */ }
    public function updateProfile(ProfileDto $dto): User { /* ... */ }
    public function changePassword(PasswordDto $dto): void { /* ... */ }
    public function processPayment(PaymentDto $dto): Receipt { /* ... */ }
    public function getBillingHistory(int $userId): Collection { /* ... */ }
    public function createTeam(TeamDto $dto): Team { /* ... */ }
    public function uploadAvatar(int $userId, UploadedFile $file): string { /* ... */ }
    // ... 10 more methods
}

// AFTER: Split by capability
class AuthenticationService { /* register, login, changePassword */ }
class ProfileService { /* updateProfile, uploadAvatar */ }
class BillingService { /* processPayment, getBillingHistory */ }
class TeamService { /* createTeam, addMember, removeMember */ }
```

---

### AP-CDS-02: Service Circular Dependencies

**Description**: Two or more services that depend on each other, creating a circular resolution chain. `OrderService` depends on `InventoryService`, which depends on `OrderService` — the container cannot resolve either. When developers work around this by using the `Container::make()` or `app()` helper, the circular dependency is hidden but not resolved.

**Root Cause**: Poor domain boundary identification. When two services are tightly coupled enough to create a cycle, their shared logic should be extracted to a lower layer (a repository, a shared service, or a new domain service).

**Impact**:
- Container resolution throws a `CircularDependencyException` at runtime
- Workarounds (`app()->make()`) hide the cycle and make testing impossible
- Changes to one service unpredictably affect the other
- Domain boundaries are meaningless if services freely depend on each other

**Detection**:
- Static analysis: Service A constructor has Service B, Service B constructor has Service A
- Runtime error: `Laravel\SerializableClosure\Exceptions\PhpMethodNotImplementedException` or memory exhaustion during resolution
- Code review: services use `app()` or `resolve()` to instantiate dependencies

**Solution**:
- Extract the shared logic to a third service that both depend on
- Extract the shared logic to a repository or action class
- Refactor to an event-driven pattern (Service A emits event, Service B listens)
- Never use `app()` or `resolve()` as a workaround — the cycle will manifest elsewhere

**Example**:
```php
// BEFORE: Circular dependency
class OrderService
{
    public function __construct(private InventoryService $inventory) {}
    public function place(OrderDto $dto): Order { /* uses $this->inventory */ }
}
class InventoryService
{
    public function __construct(private OrderService $orders) {} // ❌ cycle
    public function reserve(array $items): void { /* uses $this->orders */ }
}

// AFTER: Extract shared logic to a repository
class OrderService
{
    public function __construct(private InventoryRepository $inventory) {}
}
class InventoryService
{
    public function __construct(private InventoryRepository $inventory) {}
}
class InventoryRepository { /* shared data access logic */ }
```

---

### AP-CDS-03: Stateful Service

**Description**: A service class that stores per-request mutable data in instance properties. A method sets a value on `$this->currentUser` or `$this->pendingData` that another method reads later. This makes the service unsafe for singleton resolution (the default for services without explicit binding) and causes cross-request data leaks under Laravel Octane.

**Root Cause**: The developer treats the service as a request-scoped object that lives for one request only. They don't consider that Laravel's container may reuse the same service instance across requests, especially under Octane or in queue workers.

**Impact**:
- Under Octane: request A's data leaks to request B, causing data corruption and security violations
- Under queue: job A's data leaks to job B on the same worker
- Tests must reconstruct the service for each test case (cannot share instances)
- Debugging state leaks is extremely difficult — they appear random

**Detection**:
- Code review: service has mutable properties (`private $currentUser`, `private $pending`)
- Code review: methods set properties that other methods read later
- Bug reports: intermittent data corruption that varies by Octane worker

**Solution**:
- Keep services stateless — all data arrives through method parameters
- Move per-request state to DTOs passed as method parameters
- If caching is needed within a method, use local variables, not properties
- Mark services as `readonly` (PHP 8.2+) to prevent stateful properties entirely

**Example**:
```php
// BEFORE: Stateful service
class UserService
{
    private ?User $cachedUser = null;

    public function find(int $id): User
    {
        if ($this->cachedUser === null) {
            $this->cachedUser = User::findOrFail($id);
        }
        return $this->cachedUser;
    }
}

// AFTER: Stateless service
class UserService
{
    public function find(int $id): User
    {
        return User::findOrFail($id);
    }
}
```
