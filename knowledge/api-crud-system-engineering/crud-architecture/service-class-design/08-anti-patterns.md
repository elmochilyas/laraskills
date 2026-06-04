# Anti-Patterns — Service Class Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Service Class Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| God Service | Critical | High | Code review: 20+ methods across unrelated domains |
| Constructor Explosion | High | Medium | Code review: service constructor has 8+ parameters |
| Hidden State Leaks | High | Medium | Code review: service has mutable properties, used as singleton |
| Service Under Http/ | Medium | Medium | Code review: service placed in `app/Http/Services/` |
| Empty Forwarding Service | Medium | High | Code review: service just forwards to Model:: calls |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Service-Action Confusion | Class named `XxxService` but has one public method (should be an action) | Misleading naming, developers look for grouped operations and find single ones |
| No Cohesion Check | Service methods don't share 50% of their dependencies | Developers can't determine the service's purpose — it's a grab bag of methods |
| Singleton Stateful Service | Stateless promise not kept; service registered as singleton but has mutable state | Cross-request data leaks under Octane, unpredictable behavior |

---

## Anti-Pattern Details

### AP-SCD-01: God Service

**Description**: A service class that accumulates 20+ methods across multiple unrelated domains. `UserService` contains authentication, profile management, billing, notifications, team management, file uploads, and reporting — anything remotely related to "users." The service has 12+ constructor dependencies and no coherent purpose.

**Root Cause**: The entity-oriented naming convention (`UserService`) creates the illusion that every user-related operation belongs there. Without a cohesion check, the service grows without bound.

**Impact**:
- Testing any method requires mocking 12+ dependencies, most unrelated
- New developers cannot understand the service's purpose (it has none — it's everything)
- Adding a new method requires knowledge of the entire service to avoid breaking existing methods
- Constructor explosion (12+ dependencies) makes instantiation complex and slow

**Detection**:
- Metrics: service has 10+ public methods or 8+ constructor dependencies
- Code review: service methods span authentication, billing, profile, and team management
- Test inspection: test setup mocks 10+ dependencies even for a single-method test

**Solution**:
- Split by capability: `AuthenticationService`, `ProfileService`, `BillingService`, `TeamService`
- Use the "50% dependency sharing" rule: if two methods don't share 50% of their dependencies, extract them
- Extract methods one at a time — tackle the most unrelated methods first
- Each extracted service should have a clear, single responsibility

**Example**:
```php
// BEFORE: God service
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
        private PdfGenerator $pdf,
        private SmsGateway $sms,
        private ReportBuilder $reports,
        private CacheRepository $cache,
    ) {}

    public function register(RegisterDto $dto): User { /* ... */ }
    public function login(LoginDto $dto): User { /* ... */ }
    public function processPayment(PaymentDto $dto): Receipt { /* ... */ }
    public function generateInvoice(int $userId): Pdf { /* ... */ }
    public function createTeam(TeamDto $dto): Team { /* ... */ }
    public function uploadAvatar(int $userId, UploadedFile $file): string { /* ... */ }
    public function sendSmsNotification(int $userId, string $message): void { /* ... */ }
    public function runMonthlyReport(): Pdf { /* ... */ }
    // ... 15 more methods
}

// AFTER: Split by capability
class AuthenticationService { /* register, login */ }
class BillingService { /* processPayment, generateInvoice */ }
class TeamService { /* createTeam */ }
class ProfileService { /* uploadAvatar */ }
class NotificationService { /* sendEmail, sendSms */ }
class ReportService { /* runMonthlyReport */ }
```

---

### AP-SCD-02: Constructor Explosion

**Description**: A service constructor with 8+ injected dependencies. The class has absorbed too many responsibilities — each dependency represents a distinct concern the service depends on. New team members cannot understand the service's purpose because it depends on too many different things. A change to any dependency risks breaking unrelated service functionality.

**Root Cause**: Gradual accretion of responsibilities. Each sprint adds "one more" dependency to the service because the method needs it. No single addition justifies refactoring, but the cumulative result is a constructor with 10+ parameters.

**Impact**:
- Understanding the service requires understanding 10+ dependency contracts
- Testing requires mocking 10+ dependencies, even for single-method tests
- Constructor calls in tests are 15+ lines long
- The service cannot be instantiated without complex setup

**Detection**:
- Code review: constructor has 8+ typed parameters
- Metrics: number of constructor parameters exceeds 5
- Test inspection: test setup has 10+ mocked dependencies

**Solution**:
- Extract method groups that don't share 50% of dependencies to separate services
- Use actions for discrete operations that need only 1-2 dependencies
- The constructor should be "wide" (many parameters) only when all methods genuinely need all dependencies
- If some methods use only 2 of 10 dependencies, those methods belong elsewhere

**Example**:
```php
// BEFORE: Constructor explosion
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
    // Methods: register uses users+hasher+mailer+audit
    //          processPayment uses payments+audit
    //          createTeam uses teams+mailer+notifications
    //          uploadAvatar uses users+storage
}

// AFTER: Split by shared dependencies
class RegistrationService { /* users, hasher, mailer, audit */ }
class PaymentService { /* payments, audit */ }
class TeamManagementService { /* teams, mailer, notifications */ }
class AvatarService { /* users, storage */ }
```

---

### AP-SCD-03: Hidden State Leaks

**Description**: A service stores per-request mutable data in instance properties (e.g., `private $currentUser`) and is registered as a singleton in the container. Under Laravel Octane or queue workers, one request sets the state, and the next request (or job) reads the previous request's state — leaking data across unrelated operations.

**Root Cause**: The developer treats the service as a request-scoped object (which in traditional PHP-FPM it effectively is). The statelessness requirement is overlooked. When Octane is introduced, the stateful pattern silently produces intermittent bugs.

**Impact**:
- Intermittent, hard-to-reproduce bugs (data from request A appears in request B)
- Security violations: user A sees user B's data
- Debugging: state leaks are nearly impossible to reproduce in development
- The service is unsafe for any shared execution context (Octane, queues, Swoole)

**Detection**:
- Code review: service has non-constant properties (`private $property;`)
- Code review: methods set properties that other methods read later
- Bug reports: "I see another user's data" in production only (not in local dev)
- Octane deployment: bugs emerge after switching to Octane

**Solution**:
- Keep services stateless: all data arrives through method parameters, never stored on properties
- Use DTOs to pass data between service methods
- Mark services as `readonly` (PHP 8.2+) to prevent stateful properties
- If caching is needed, use Laravel's Cache facade, not service properties

**Example**:
```php
// BEFORE: Stateful service
class UserService
{
    private ?User $currentUser = null;

    public function setCurrentUser(User $user): void
    {
        $this->currentUser = $user;  // ❌ mutable state
    }

    public function getProfile(): array
    {
        // Under Octane, $this->currentUser may be from a different request
        return $this->profileService->getForUser($this->currentUser);
    }
}

// AFTER: Stateless service
readonly class UserService
{
    public function getProfile(User $user, ProfileService $profile): array
    {
        return $profile->getForUser($user); // ✅ all data via parameters
    }
}
```
