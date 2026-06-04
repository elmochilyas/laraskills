# Service Class Design — Rules

## Rule 1: Keep Constructor Dependencies Below 5
---
## Category
Maintainability
---
## Rule
Never let a service constructor have 5 or more dependencies; split the service when this limit is reached.
---
## Reason
Each dependency represents a distinct responsibility. 5+ dependencies means the service handles at least 5 concerns, making testing require 5+ mocks and the class impossible to understand at a glance.
---
## Bad Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private AvatarService $avatars,
        private MailService $mailer,
        private AuditLogger $logger, // 5th — borderline
        private CacheRepository $cache, // ❌ 6th — too many
        private NotificationService $notifications, // ❌ 7th
    ) {}
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private MailService $mailer,
    ) {}
}

class UserProfileService
{
    public function __construct(
        private AvatarService $avatars,
        private CacheRepository $cache,
    ) {}
}
```
---
## Exceptions
Infrastructure services that wrap multiple related clients (e.g., a cloud storage service with 6 client dependencies) may exceed 5, but must not contain business logic.
---
## Consequences Of Violation
Constructor explosion, mocking 6+ dependencies in every test, hidden coupling between unrelated concerns.
</rule>

## Rule 2: Keep Public Methods Below 10
---
## Category
Maintainability
---
## Rule
Never let a service have 10 or more public methods; split by capability when this limit is approached.
---
## Reason
A service with 10+ methods has absorbed too many responsibilities. It becomes a dumping ground — every new feature adds one more method to the "User" service regardless of whether it belongs there.
---
## Bad Example
```php
class UserService // 12 public methods — god service
{
    public function register(CreateUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function delete(int $id): void { /* ... */ }
    public function suspend(int $id): void { /* ... */ }
    public function activate(int $id): void { /* ... */ }
    public function changePassword(ChangePasswordDto $dto): void { /* ... */ }
    public function updateProfile(UpdateProfileDto $dto): void { /* ... */ }
    public function uploadAvatar(UploadAvatarDto $dto): void { /* ... */ }
    public function exportData(User $user): array { /* ... */ }
    public function generateReport(ReportDto $dto): array { /* ... */ }
    public function mergeAccounts(MergeAccountsDto $dto): User { /* ... */ }
    public function sendBulkNotification(NotificationDto $dto): void { /* ... */ }
}
```
---
## Good Example
```php
class UserService
{
    public function register(CreateUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function delete(int $id): void { /* ... */ }
    public function suspend(int $id): void { /* ... */ }
    public function activate(int $id): void { /* ... */ }
    public function changePassword(ChangePasswordDto $dto): void { /* ... */ }
}
// Extracted: UserProfileService, AccountManagementService, ReportingService
```
---
## Exceptions
No common exceptions. 10 methods is a hard ceiling enforced during code review.
---
## Consequences Of Violation
God service, 12+ mock dependencies for unrelated methods, unclear responsibility, onboarding impossible.
</rule>

## Rule 3: Enforce Statelessness — No Mutable Properties
---
## Category
Reliability
---
## Rule
Never store per-request data in mutable service properties; all state must arrive through method parameters.
---
## Reason
Stateful services are unsafe for singleton resolution. Under Octane or queue workers, one request's state leaks to the next request, causing data corruption and security vulnerabilities.
---
## Bad Example
```php
class UserService
{
    private ?User $currentUser = null; // ❌ Mutable state

    public function setCurrentUser(User $user): void
    {
        $this->currentUser = $user; // Leaks across requests under Octane
    }

    public function getCurrentUser(): ?User
    {
        return $this->currentUser;
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(RegisterUserDto $dto, User $actor): User
    {
        // All state arrives as method parameters
    }

    public function suspend(int $userId, User $actor): void
    {
        // Actor passed explicitly — no mutable state
    }
}
```
---
## Exceptions
No common exceptions. Statelessness is a hard requirement for all service classes.
---
## Consequences Of Violation
Cross-request data leaks under Octane, flaky tests from shared state, impossible to use as singletons.
</rule>

## Rule 4: Never Import HTTP Classes in Services
---
## Category
Layer Isolation
---
## Rule
Never type-hint `Illuminate\Http\Request`, `Response`, `RedirectResponse`, or any HTTP class in a service constructor or method.
---
## Reason
HTTP imports couple the service to the web layer, making it untestable without HTTP scaffolding, unreusable from CLI/queue, and dependent on the request lifecycle.
---
## Bad Example
```php
use Illuminate\Http\Request;

class UserService
{
    public function __construct(
        private Request $request, // ❌ HTTP dependency
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        $ip = $this->request->ip(); // HTTP coupling
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(RegisterUserDto $dto): User
    {
        // All data comes through the DTO — no HTTP dependencies
    }
}
```
---
## Exceptions
No common exceptions. Services must remain transport-agnostic.
---
## Consequences Of Violation
Untestable outside HTTP context, broken when called from queue/CLI, hidden coupling between service and HTTP lifecycle.
</rule>

## Rule 5: Use the Cohesion Check — 50% Dependency Sharing
---
## Category
Design
---
## Rule
If two methods in a service share fewer than 50% of their constructor dependencies, they belong in different services.
---
## Reason
Low dependency overlap means the methods do unrelated things. Grouping unrelated methods under one service class creates a dumping ground where every method requires different mocking setups.
---
## Bad Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,       // Used by: create, update, delete
        private PasswordHasher $hasher,      // Used by: create, changePassword
        private MailService $mailer,         // Used by: create
        private AvatarService $avatars,      // Used by: uploadAvatar only
        private ReportingService $reports,   // Used by: generateReport only
        private CacheRepository $cache,      // Used by: generateReport only
    ) {}
    // uploadAvatar and generateReport share 0% of deps with each other
    // generateReport shares 0% with create — different service needed
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private MailService $mailer,
    ) {}
    // create, update, delete, changePassword all use users + hasher
}

class UserAvatarService
{
    public function __construct(
        private UserRepository $users,
        private AvatarService $avatars,
    ) {}
}
```
---
## Exceptions
No common exceptions. Low cohesion is a definitive signal for service splitting.
---
## Consequences Of Violation
Bloated constructor, mocking unrelated dependencies in every test, unclear responsibility boundaries.
</rule>

## Rule 6: Place Services in app/Services/, Not Under app/Http/
---
## Category
Code Organization
---
## Rule
Always place service classes in `app/Services/`, never under `app/Http/Services/` or any HTTP subdirectory.
---
## Reason
Placing services under `app/Http/` implies they are HTTP-coupled. The directory structure communicates architecture intent — services in `app/Services/` are transport-agnostic and reusable.
---
## Bad Example
```
app/
  Http/
    Services/
      UserService.php // ❌ Implies HTTP coupling
```
---
## Good Example
```
app/
  Services/
    UserService.php // ✅ Transport-agnostic — not under HTTP
```
---
## Exceptions
No common exceptions. Service placement is a code organization contract.
---
## Consequences Of Violation
Architecture confusion, new developers assume services are HTTP-coupled, misplacement of transport-agnostic code.
</rule>
