# Controller-DTO-Service Flow — Rules

## Rule 1: Keep Service Public Methods to 6-8 Maximum
---
## Category
Maintainability
---
## Rule
Never let a service class exceed 8 public methods; extract non-cohesive methods into separate services when this limit is approached.
---
## Reason
A service with 9+ public methods has absorbed too many responsibilities. It becomes a dumping ground where developers add any method loosely related to the entity.
---
## Bad Example
```php
class UserService
{
    public function register(RegisterUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function suspend(int $id): void { /* ... */ }
    public function activate(int $id): void { /* ... */ }
    public function delete(int $id): void { /* ... */ }
    public function changePassword(ChangePasswordDto $dto): void { /* ... */ }
    public function updateProfile(UpdateProfileDto $dto): void { /* ... */ }
    public function uploadAvatar(UploadAvatarDto $dto): void { /* ... */ }
    public function exportData(User $user): array { /* ... */ } // Too many methods
    public function generateReport(ReportDto $dto): array { /* ... */ }
}
```
---
## Good Example
```php
class UserService
{
    public function register(RegisterUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function suspend(int $id): void { /* ... */ }
    public function activate(int $id): void { /* ... */ }
    public function delete(int $id): void { /* ... */ }
    public function changePassword(ChangePasswordDto $dto): void { /* ... */ }
}

class UserProfileService
{
    public function updateProfile(UpdateProfileDto $dto): void { /* ... */ }
    public function uploadAvatar(UploadAvatarDto $dto): void { /* ... */ }
}
```
---
## Exceptions
No common exceptions. 8 methods is a hard ceiling enforced during code review.
---
## Consequences Of Violation
Fat service antipattern, excessive constructor dependencies, testing requires mocking unrelated dependencies, unclear class responsibility.
</rule>

## Rule 2: Limit Constructor Dependencies to 5
---
## Category
Maintainability
---
## Rule
Never let a service constructor exceed 5 dependencies; split the service or extract actions when this limit is reached.
---
## Reason
Each dependency represents a distinct concern. 6+ dependencies means the service handles at least 6 different responsibilities, making it impossible to reason about, test, or maintain.
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
        private AuditLogger $logger,
        private CacheRepository $cache, // ❌ 6th dependency — too many
        private NotificationService $notifications, // ❌ 7th — split needed
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
        private UserRepository $users,
        private AvatarService $avatars,
        private CacheRepository $cache,
    ) {}
}
```
---
## Exceptions
Infrastructure services (file systems, external API wrappers) may exceed 5 if they wrap multiple related clients, but must not contain business logic.
---
## Consequences Of Violation
Constructor explosion, mocking 6+ dependencies in every test, hidden coupling between unrelated concerns.
</rule>

## Rule 3: Never Inject Request or Response into Services
---
## Category
Layer Isolation
---
## Rule
Never type-hint `Illuminate\Http\Request`, `Response`, or any HTTP class in a service constructor or method.
---
## Reason
HTTP imports couple the service to the request-response cycle, making it untestable without HTTP scaffolding and unusable from CLI/queue. All HTTP-specific data must arrive via DTOs.
---
## Bad Example
```php
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
        // All data comes through the DTO or method parameters
    }
}
```
---
## Exceptions
No common exceptions. Services must remain transport-agnostic.
---
## Consequences Of Violation
Untestable outside HTTP context, broken queue jobs, hidden coupling between service and HTTP lifecycle.
</rule>

## Rule 4: Keep Services Stateless
---
## Category
Reliability
---
## Rule
Never store per-request data in mutable service properties; all state must arrive through method parameters.
---
## Reason
Stateful services are unsafe for singleton resolution (Octane, queue workers) because one request's state can leak to the next. Stateless services are trivially testable and thread-safe.
---
## Bad Example
```php
class UserService
{
    private ?User $currentUser = null; // ❌ Mutable state

    public function setCurrentUser(User $user): void
    {
        $this->currentUser = $user; // Cross-request leak under Octane
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
        // State arrives via method parameters
    }
}
```
---
## Exceptions
No common exceptions. Statelessness is a hard requirement for service classes.
---
## Consequences Of Violation
Cross-request data leaks under Octane, flaky tests from shared state, impossible to use as singletons.
</rule>

## Rule 5: Construct DTOs Before Calling Service
---
## Category
Architecture
---
## Rule
Always construct the DTO in the controller and pass it to the service method; never pass loose parameters or request data.
---
## Reason
The DTO is the typed contract between HTTP and business logic. Passing loose parameters bypasses type safety, makes signatures brittle, and loses self-documenting method contracts.
---
## Bad Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    return $this->userService->register( // ❌ Loose parameters
        $request->validated('name'),
        $request->validated('email'),
        $request->validated('password'),
    );
}
```
---
## Good Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = CreateUserDto::fromRequest($request);
    $user = $this->userService->register($dto);
    return response()->json($user, 201);
}
```
---
## Exceptions
Simple operations with 1-2 scalar parameters (find by ID, toggle boolean) may skip the DTO, but the service method must still use typed parameters.
---
## Consequences Of Violation
Brittle method signatures, compiler cannot catch parameter order mistakes, undocumented method contracts.
</rule>

## Rule 6: Test Services Directly Without HTTP
---
## Category
Testing
---
## Rule
Always test service methods by constructing DTOs directly and calling the service; never test services through HTTP controller tests.
---
## Reason
Direct service tests execute without framework bootstrapping, run in milliseconds, and isolate the business logic from HTTP concerns. HTTP tests belong in controller-specific test suites.
---
## Bad Example
```php
public function test_user_registration(): void
{
    $response = $this->postJson('/api/users', ['name' => 'John']); // ❌ Tests HTTP + service
    $response->assertStatus(201);
}
```
---
## Good Example
```php
public function test_user_registration(): void
{
    $dto = new RegisterUserDto(name: 'John', email: 'john@test.com');
    $user = $this->userService->register($dto);
    $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
}
```
---
## Exceptions
Integration tests for critical user-facing flows may combine HTTP + service tests, but must not replace direct service unit tests.
---
## Consequences Of Violation
Slow test suites, tests coupled to HTTP structure, no ability to test edge cases without full HTTP stack.
</rule>
