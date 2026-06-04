## Keep Business Logic In Domain Entities, Not Use Cases
---
## Architecture
---
## Rule
Keep business logic in domain entities or domain services, not in use case classes. Use cases orchestrate; domain objects enforce rules.
---
## Reason
Use cases are part of the Application layer in Clean Architecture — they coordinate the workflow. Domain rules (discount calculations, state transitions, validation) belong in the Domain layer where they are reusable across use cases.
---
## Bad Example
```php
class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $user = User::create([
            'name' => $input->name,
            'email' => $input->email,
            'password' => Hash::make($input->password),
        ]);

        // Business logic in use case
        if (!str_contains($input->email, '@company.com')) {
            $user->assignRole('external');
        } else {
            $user->assignRole('internal');
        }

        return new RegisterUserOutput($user);
    }
}
```
---
## Good Example
```php
class User extends Model
{
    public function assignRoleBasedOnEmail(): void
    {
        $role = str_contains($this->email, '@company.com') ? 'internal' : 'external';
        $this->assignRole($role);
    }
}

class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $user = $this->users->create($input);
        $user->assignRoleBasedOnEmail(); // Domain logic in entity
        return new RegisterUserOutput($user);
    }
}
```
---
## Exceptions
Trivial business logic that is a single line and not reused across use cases.
---
## Consequences Of Violation
Scattered domain rules, logic not reusable across use cases, domain layer anemic, violates Clean Architecture layering.

## Use Case Must Not Call Other Use Cases
---
## Architecture
---
## Rule
A use case must not call another use case. If two use cases share logic, extract that logic to a domain service or shared action.
---
## Reason
Use case calling use case couples business intents together. Each use case should be independently executable, testable, and understandable without understanding other use cases' internals.
---
## Bad Example
```php
class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $user = $this->userRepo->create($input);
        $this->createWorkspaceUseCase->execute(new CreateWorkspaceInput( // Use case calling use case
            ownerId: $user->id,
            name: "{$user->name}'s Workspace",
        ));
        return new RegisterUserOutput($user);
    }
}
```
---
## Good Example
```php
class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $user = $this->userRepo->create($input);
        $this->workspaceService->createForUser($user, $input->workspaceName); // Shared service
        return new RegisterUserOutput($user);
    }
}
```
---
## Exceptions
Saga/eventual consistency patterns where a use case dispatches an event that triggers another use case asynchronously.
---
## Consequences Of Violation
Coupled business intents, difficulty testing use cases independently, cascading changes when one use case changes.

## Use Cases Manage Transaction Boundaries
---
## Architecture
---
## Rule
Use cases must manage their own transaction boundaries. The `execute()` method should wrap operations in `DB::transaction()` when spanning multiple writes.
---
## Reason
The use case defines the unit of work. All operations within a use case either succeed or fail together. Transaction management at the use case level ensures atomic business operations.
---
## Bad Example
```php
class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        // No transaction — if user is created but subscription setup fails, data is inconsistent
        $user = $this->userRepo->create($input);
        $this->subscriptionRepo->create($user, $input->plan);
        $this->mailer->sendWelcome($user);
        return new RegisterUserOutput($user);
    }
}
```
---
## Good Example
```php
use Illuminate\Support\Facades\DB;

class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        return DB::transaction(function () use ($input) {
            $user = $this->userRepo->create($input);
            $subscription = $this->subscriptionRepo->create($user, $input->plan);
            return new RegisterUserOutput($user, $subscription);
        });
    }
}
```
---
## Exceptions
Read-only use cases. Single-write operations where the database handles atomicity at the statement level.
---
## Consequences Of Violation
Inconsistent data on partial failure, partial commits, difficult debugging of data integrity issues.

## Log Use Case Execution With Timing
---
## Observability
---
## Rule
Log every use case execution with its name, input summary, duration, and result. Use this for business-level observability.
---
## Reason
Use cases represent business intents. Logging at the use case level provides actionable business insights — which operations are running, how long they take, and what fails.
---
## Bad Example
```php
class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $user = $this->userRepo->create($input);
        $this->subscriptionRepo->create($user, $input->plan);
        return new RegisterUserOutput($user);
    }
}
// No logging — no visibility into use case execution
```
---
## Good Example
```php
class RegisterUserUseCase
{
    public function __construct(
        private LoggerInterface $logger,
        private UserRepository $users,
        private SubscriptionRepository $subscriptions,
    ) {}

    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $start = microtime(true);

        try {
            $user = $this->users->create($input);
            $subscription = $this->subscriptions->create($user, $input->plan);

            $duration = (microtime(true) - $start) * 1000;
            $this->logger->info('UseCase succeeded', [
                'use_case' => 'RegisterUser',
                'email' => $input->email,
                'duration_ms' => round($duration, 2),
            ]);

            return new RegisterUserOutput($user, $subscription);
        } catch (\Throwable $e) {
            $duration = (microtime(true) - $start) * 1000;
            $this->logger->error('UseCase failed', [
                'use_case' => 'RegisterUser',
                'email' => $input->email,
                'duration_ms' => round($duration, 2),
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
```
---
## Exceptions
Extremely high-throughput use cases where logging overhead is unacceptable. In such cases, use structured sampling or async logging.
---
## Consequences Of Violation
No business-level observability, difficult incident response, no performance tracking per business operation.

## Use Cases Must Have No Framework Imports
---
## Architecture
---
## Rule
Use cases must not import framework-specific classes (`Illuminate\Http\Request`, `Facades\DB`, `Facades\Auth`). Depend only on interfaces and DTOs.
---
## Reason
Framework imports couple the use case to a specific delivery mechanism, preventing reuse from CLI commands, queue jobs, and tests without booting the framework.
---
## Bad Example
```php
use Illuminate\Support\Facades\DB; // Framework import
use Illuminate\Support\Facades\Auth; // Framework import

class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        return DB::transaction(function () use ($input) { // Coupled to facade
            $user = User::create([...]); // Coupled to Eloquent
            Auth::login($user); // Coupled to auth system
            return new RegisterUserOutput($user);
        });
    }
}
```
---
## Good Example
```php
// No framework imports — only interfaces and DTOs
class RegisterUserUseCase
{
    public function __construct(
        private UserRepository $users,
        private TransactionManager $transactions,
        private Authenticator $auth,
    ) {}

    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        return $this->transactions->execute(function () use ($input) {
            $user = $this->users->create($input);
            $this->auth->login($user);
            return new RegisterUserOutput($user);
        });
    }
}
```
---
## Exceptions
No common exceptions. Framework independence is the defining characteristic of use cases.
---
## Consequences Of Violation
Use case cannot be used from CLI/queue, requires HTTP context for testing, violates Clean Architecture dependency rule.

## Each Use Case Has Single Business Intent
---
## Architecture
---
## Rule
Each use case must represent exactly one business intent or user goal. If a use case does multiple things, split it.
---
## Reason
A use case with multiple intents violates the single-responsibility principle, is harder to test, harder to understand, and leads to parameter bloat.
---
## Bad Example
```php
class UserManagementUseCase
{
    public function execute(UserManagementInput $input): UserManagementOutput
    {
        // Does everything — registration, billing, notifications, reporting
        switch ($input->action) {
            case 'register': /* ... */
            case 'update_billing': /* ... */
            case 'send_report': /* ... */
        }
    }
}
```
---
## Good Example
```php
class RegisterUserUseCase { /* single intent: register user */ }
class UpdateBillingUseCase { /* single intent: update billing */ }
class SendReportUseCase { /* single intent: send report */ }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Giant use cases, unclear business intent, parameter bloat, difficult testing, violation of single responsibility.

## Use Case Depends On Domain Repository Interfaces
---
## Architecture
---
## Rule
Use cases must depend on domain repository interfaces, not on concrete implementations or Eloquent models directly.
---
## Reason
Depending on interfaces inverts the dependency: use cases (Application layer) define what they need, and infrastructure provides it. This is the Dependency Inversion Principle.
---
## Bad Example
```php
class RegisterUserUseCase
{
    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        // Depends directly on Eloquent model
        $user = User::create([
            'name' => $input->name,
            'email' => $input->email,
        ]);
        return new RegisterUserOutput($user);
    }
}
```
---
## Good Example
```php
class RegisterUserUseCase
{
    public function __construct(
        private UserRepository $users, // Interface defined in Domain
    ) {}

    public function execute(RegisterUserInput $input): RegisterUserOutput
    {
        $user = $this->users->create($input);
        return new RegisterUserOutput($user);
    }
}

// Interface in Domain layer
interface UserRepository
{
    public function create(RegisterUserInput $input): User;
    public function findByEmail(string $email): ?User;
}

// Implementation in Infrastructure layer
class EloquentUserRepository implements UserRepository
{
    public function create(RegisterUserInput $input): User { /* ... */ }
}
```
---
## Exceptions
No common exceptions. Depending on interfaces is the defining architectural characteristic of the use case pattern.
---
## Consequences Of Violation
Use cases coupled to infrastructure, violates Clean Architecture dependency rule, cannot swap implementations, difficult testing.

> **ECC Context Note:** The rule to depend on repository interfaces from use cases applies strictly within a formal Clean Architecture context. For standard Laravel applications following the ECC default, use direct Eloquent inside Actions unless Repository Justification Criteria are met (see `docs/architecture-decisions/repository-vs-direct-eloquent.md`). Evaluate whether your module genuinely needs persistence-agnostic use cases or whether direct Eloquent is sufficient.
