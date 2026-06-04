## Add Interfaces Only At Variation Points
---
## Architecture
---
## Rule
Add interfaces for services only at variation points — places where multiple implementations are needed or planned. Do not create interfaces for every service.
---
## Reason
Interface-per-class without need adds ceremony (extra files, bindings, indirection) without value. YAGNI — add when the second implementation is needed.
---
## Bad Example
```php
// Interface for every service, even single-implementation
interface UserServiceInterface
{
    public function register(array $data): User;
    public function updateProfile(User $user, array $data): void;
}

class UserService implements UserServiceInterface
{
    public function register(array $data): User { /* ... */ }
    public function updateProfile(User $user, array $data): void { /* ... */ }
}
// Only one implementation — interface adds zero value
```
---
## Good Example
```php
// No interface for single-implementation service
class UserService
{
    public function register(array $data): User { /* ... */ }
    public function updateProfile(User $user, array $data): void { /* ... */ }
}

// Interface at true variation point
interface PaymentGateway
{
    public function charge(PaymentInput $input): PaymentResult;
}

class StripePaymentGateway implements PaymentGateway { /* ... */ }
class PayPalPaymentGateway implements PaymentGateway { /* ... */ }
```
---
## Exceptions
Clean Architecture projects where interface contracts are required at every layer boundary by architectural convention.
---
## Consequences Of Violation
Unnecessary ceremony, increased file count, binding overhead, YAGNI violation, reduced developer productivity.

## Avoid Interfaces That Mirror Implementation Exactly
---
## Architecture
---
## Rule
Do not create interfaces that mirror the implementation class exactly with the same methods and signatures. An interface should represent a different level of abstraction.
---
## Reason
An interface that mirrors the implementation provides no abstraction. It adds ceremony without benefit and creates the illusion of loose coupling without actually decoupling anything.
---
## Bad Example
```php
// Interface mirrors implementation exactly — no abstraction
interface UserServiceInterface
{
    public function create(array $data): User;
    public function update(int $id, array $data): User;
    public function delete(int $id): bool;
    public function find(int $id): ?User;
}

class UserService implements UserServiceInterface
{
    public function create(array $data): User { return User::create($data); }
    public function update(int $id, array $data): User { /* ... */ }
    public function delete(int $id): bool { /* ... */ }
    public function find(int $id): ?User { return User::find($id); }
}
// Interface adds zero abstraction — same methods, same signatures, same behavior
```
---
## Good Example
```php
// Interface at a meaningful abstraction level
interface PaymentGateway
{
    public function charge(Money $amount, PaymentSource $source): PaymentResult;
    public function refund(TransactionId $transactionId): RefundResult;
}

class StripeGateway implements PaymentGateway
{
    public function charge(Money $amount, PaymentSource $source): PaymentResult
    {
        // Stripe-specific implementation
        $stripeCharge = \Stripe\Charge::create([...]);
        return new PaymentResult(...);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fake decoupling, ceremony without benefit, false sense of architectural flexibility, wasted maintenance overhead.

## Be Consistent As A Team
---
## Maintainability
---
## Rule
Be consistent as a team about interface usage. Either consistently use interfaces for all services in the same category, or consistently skip them.
---
## Reason
Inconsistency is worse than either choice. Some services with interfaces, others without — developers can't predict which pattern to follow for a new service.
---
## Bad Example
```php
// Inconsistent — some services have interfaces, some don't
interface UserServiceInterface { /* ... */ }
class UserService implements UserServiceInterface { /* ... */ }

class OrderService { /* No interface — but why not? */ }

interface PaymentGatewayInterface { /* ... */ }
class StripeGateway implements PaymentGatewayInterface { /* ... */ }

class InventoryService { /* No interface — inconsistent */ }
```
---
## Good Example
```php
// Consistent rule: interfaces for infrastructure services only
// Infrastructure services (payment, notification, storage) — have interfaces
interface PaymentGateway { /* ... */ }
interface NotificationChannel { /* ... */ }
interface FileStorage { /* ... */ }

// Business services (UserService, OrderService) — no interfaces
class UserService { /* ... */ }
class OrderService { /* ... */ }

// Pattern is predictable and consistent
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unpredictable codebase, developers unsure whether to create interfaces, inconsistent architecture.

## Watch For Interface Pollution
---
## Maintainability
---
## Rule
Keep interfaces focused and small. An interface with 20+ methods covering every possible use case violates the Interface Segregation Principle.
---
## Reason
A bloated interface forces all implementors to define methods they don't need, couples clients to methods they don't use, and becomes a god object.
---
## Bad Example
```php
interface UserService
{
    public function create(array $data): User;
    public function update(int $id, array $data): User;
    public function delete(int $id): bool;
    public function find(int $id): ?User;
    public function search(array $criteria): Collection;
    public function activate(int $id): void;
    public function suspend(int $id): void;
    public function approve(int $id): void;
    public function reject(int $id): void;
    public function exportCsv(array $ids): string;
    public function importCsv(string $path): int;
    public function sendNewsletter(int $id): void;
    // 20+ methods — interface pollution
}
```
---
## Good Example
```php
// Segregated interfaces — each client gets what it needs
interface UserRepository
{
    public function find(int $id): ?User;
    public function search(array $criteria): Collection;
}

interface UserAdminService
{
    public function activate(int $id): void;
    public function suspend(int $id): void;
}

interface UserImportExport
{
    public function exportCsv(array $ids): string;
    public function importCsv(string $path): int;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Implementors forced to define unused methods, clients coupled to methods they don't need, god interface anti-pattern.

## Avoid Interface-Per-Class Syndrome
---
## Maintainability
---
## Rule
Do not create an interface for every class in the codebase. Use interfaces only at architectural boundaries or variation points.
---
## Reason
Interface-per-class syndrome is a common anti-pattern where every class has a corresponding interface, adding massive overhead without benefit. It multiplies files, requires bindings, and provides no abstraction.
---
## Bad Example
```php
// Interface-per-class syndrome — every class gets an interface
// app/Interfaces/
interface UserServiceInterface {}
interface OrderServiceInterface {}
interface PaymentServiceInterface {}
interface InvoiceServiceInterface {}
interface ReportServiceInterface {}
interface CacheServiceInterface {}
interface LoggerInterface {}
interface MailerInterface {}
interface ConfigInterface {}
// 50 interfaces for 50 classes — zero abstraction value
```
---
## Good Example
```php
// Interfaces only at architectural boundaries:
// - Infrastructure adapters (payment, storage, notification)
// - Repository contracts (data access abstraction)
// - Port interfaces (Clean Architecture boundaries)

// Business services have no interfaces:
// UserService, OrderService, PaymentService — concrete only
```
---
## Exceptions
Clean Architecture projects where every dependency in the Application layer depends on interfaces from the Domain layer.
---
## Consequences Of Violation
Massive file overhead, binding ceremony for every class, false sense of decoupling, reduced productivity.

## Bind Interface To Implementation In Service Provider
---
## Architecture
---
## Rule
Register interface-to-implementation bindings in a Service Provider. Do not use `app()->bind()` inline in controllers or other classes.
---
## Reason
Centralized binding in a Service Provider makes dependencies discoverable and maintainable. Inline binding scatters configuration across the codebase.
---
## Bad Example
```php
// Scattered bindings
class UserController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        app()->bind(PaymentGateway::class, StripeGateway::class); // Binding in controller
        $gateway = app(PaymentGateway::class);
        // ...
    }
}
```
---
## Good Example
```php
// AppServiceProvider.php — centralized binding
public function register(): void
{
    $this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
    $this->app->bind(NotificationChannel::class, EmailChannel::class);
    $this->app->bind(FileStorage::class, S3Storage::class);
}

// Controllers just consume
class UserController extends Controller
{
    public function __construct(private PaymentGateway $gateway) {}
}
```
---
## Exceptions
Contextual binding where different consumers need different implementations (use `when` method in Service Provider).
---
## Consequences Of Violation
Scattered binding configuration, difficult to find which implementation is used, inconsistent binding strategy.
