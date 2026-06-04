# Rules for Clean Architecture layers: Domain, Application, Infrastructure, Presentation

## Domain Layer Must Be Pure PHP
---
## Category
Architecture | Framework Usage
---
## Rule
The Domain layer MUST contain zero imports from `Illuminate\*` or any framework; use only PHP primitives and domain-defined types.
---
## Reason
The entire value of Clean Architecture is framework independence. A single Laravel import in Domain couples business rules to the framework, defeating the purpose of the architecture.
---
## Bad Example
```php
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model { // Domain coupled to Laravel ORM
    public function markAsPaid(): void { /* ... */ }
}
```
---
## Good Example
```php
class Invoice {
    public function __construct(private InvoiceId $id, private InvoiceStatus $status) {}
    public function markAsPaid(): void {
        if ($this->status !== InvoiceStatus::PENDING) throw new \DomainException();
        $this->status = InvoiceStatus::PAID;
    }
}
```
---
## Exceptions
Laravel DDD (partial independence) where Eloquent coupling is a conscious, documented tradeoff — but this is not Clean Architecture.
---
## Consequences Of Violation
Domain coupled to Laravel; framework migration impossible; value of Clean Architecture lost.

## Apply Port-Adapter Pattern at Boundaries
---
## Category
Architecture | Design
---
## Rule
Application layer MUST define interfaces (ports) for infrastructure concerns; Infrastructure layer MUST implement them (adapters).
---
## Reason
Port-Adapter is the core mechanism that enables dependency inversion. Inner layers define what they need; outer layers provide implementations. This keeps inner layers free of infrastructure coupling.
---
## Bad Example
```php
class RegisterUserUseCase {
    public function execute(RegisterUserDto $dto): void {
        DB::table('users')->insert($dto->toArray()); // Direct infrastructure dependency
    }
}
```
---
## Good Example
```php
class RegisterUserUseCase {
    public function __construct(private UserRepository $users) {} // Port interface
    public function execute(RegisterUserDto $dto): void {
        $this->users->save(User::fromDto($dto));
    }
}
```
---
## Exceptions
Laravel utilities (Str, Arr, Collection, Carbon) may be used in Application layer as they are not infrastructure concerns — they are utility helpers.
---
## Consequences Of Violation
Application layer depends on concrete infrastructure; swapping implementations requires code changes; testing requires real infrastructure.

## Bind Ports to Adapters in Service Providers
---
## Category
Architecture | Framework Usage
---
## Rule
ALWAYS bind port interfaces to adapter implementations in Service Providers; do not resolve concrete classes directly in use cases.
---
## Reason
Service providers are the composition root where dependency wiring happens. Direct instantiation of adapters in use cases couples the Application layer to Infrastructure implementations.
---
## Bad Example
```php
class RegisterUserUseCase {
    public function execute(RegisterUserDto $dto): void {
        $repo = new EloquentUserRepository(); // Direct infrastructure dependency
        $repo->save(User::fromDto($dto));
    }
}
```
---
## Good Example
```php
// ServiceProvider
public function register(): void {
    $this->app->bind(UserRepository::class, EloquentUserRepository::class);
}
// UseCase
class RegisterUserUseCase {
    public function __construct(private UserRepository $users) {}
}
```
---
## Exceptions
Feature flag or conditional bindings that require runtime decision logic may use factory closures in the service provider.
---
## Consequences Of Violation
Application imports Infrastructure; dependency inversion broken; swapping implementations requires modifying use case code.

## Use Mappers for Domain-to-Eloquent Conversion
---
## Category
Architecture | Code Organization
---
## Rule
Use explicit mapper classes to convert between Domain entities and Eloquent models; do not use Eloquent models as domain entities.
---
## Reason
Domain entities are pure PHP objects with business behavior. Eloquent models are ActiveRecord infrastructure with persistence concerns. Using them interchangeably couples Domain to the ORM.
---
## Bad Example
```php
// Domain entity extends Eloquent Model — framework coupling
class Invoice extends Model {
    public function markAsPaid(): void { /* ... */ }
}
```
---
## Good Example
```php
// Infrastructure mapper converts between the two
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice { /* ... */ }
    public function toEloquent(Invoice $invoice): array { /* ... */ }
}
```
---
## Exceptions
When domain entity and database schema are nearly identical, consider partial independence (Laravel DDD) instead of Clean Architecture — avoid mapping overhead without benefit.
---
## Consequences Of Violation
Domain coupled to Eloquent; framework migration blocked; mapper tests skipped; roundtrip failures cause data corruption.

## Architecture Tests Enforce Dependency Rule
---
## Category
Testing | Architecture
---
## Rule
Write architecture tests that forbid Domain and Application layers from importing outer-layer or framework namespaces; enforce in CI as a blocking check.
---
## Reason
Without automated enforcement, the Dependency Rule degrades within weeks. Developers under time pressure will import `DB` or `Request` in inner layers. Architecture tests catch this at merge time.
---
## Bad Example
No architecture tests. Application layer imports `Illuminate\Http\Request`. Months later, every use case uses `Request` directly — framework coupling spreads silently.
---
## Good Example
```php
arch('domain')->expect('App\Domain')->toOnlyUse([]);
arch('application')->expect('App\Application')->toOnlyUse(['App\Domain']);
```
---
## Exceptions
Prototypes or proof-of-concept projects where architectural enforcement is premature.
---
## Consequences Of Violation
Dependency Rule degrades; framework coupling spreads; architecture becomes cosmetic.

## Use Case Has Single Public Method
---
## Category
Architecture | Design
---
## Rule
Each use case class MUST have exactly one public method named `execute()` or `handle()` receiving a DTO and returning a result.
---
## Reason
A use case represents a single user goal. Multiple public methods mean the class handles multiple goals, violating Single Responsibility and making testing and reasoning harder.
---
## Bad Example
```php
class InvoiceUseCase {
    public function create(CreateInvoiceDto $dto): InvoiceDto { /* ... */ }
    public function cancel(CancelInvoiceDto $dto): void { /* ... */ }
    public function send(SendInvoiceDto $dto): void { /* ... */ }
}
```
---
## Good Example
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto { /* ... */ }
}
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto): void { /* ... */ }
}
```
---
## Exceptions
Query use cases (read models) may use `get()` or `find()` instead of `execute()` for semantic clarity.
---
## Consequences Of Violation
God use case classes; unclear boundaries; difficult testing; merge conflicts from multiple developers editing the same class.

## Application Depends Only on Domain
---
## Category
Architecture
---
## Rule
Application layer MUST depend only on Domain layer; MUST NOT import classes from Infrastructure or Presentation layers.
---
## Reason
Application is the orchestration layer. Dependencies on Infrastructure or Presentation break the Dependency Rule, coupling business orchestration to delivery mechanisms or persistence technology.
---
## Bad Example
```php
use App\Infrastructure\Persistence\EloquentUserRepository;
use Illuminate\Http\Request;

class RegisterUserUseCase {
    public function execute(Request $request): void {
        (new EloquentUserRepository())->save(/* ... */);
    }
}
```
---
## Good Example
```php
use App\Domain\Repositories\UserRepository; // Port interface in Domain

class RegisterUserUseCase {
    public function __construct(private UserRepository $users) {}
    // ...
}
```
---
## Exceptions
Laravel utility classes (Carbon, Collection, Str) are acceptable in Application as they are not architectural layers — they are general-purpose utilities.
---
## Consequences Of Violation
Dependency Rule broken; Application coupled to framework or persistence; testing requires infrastructure bootstrapping.

## No Eloquent Models in Domain or Application
---
## Category
Architecture | Code Organization
---
## Rule
ALWAYS place Eloquent models in the Infrastructure layer; NEVER place them in Domain or Application directories.
---
## Reason
Eloquent models extend `Illuminate\Database\Eloquent\Model` — this is an infrastructure concern. Placing them in Domain couples business logic to Laravel's ORM.
---
## Bad Example
```php
// app/Domain/Entities/Invoice.php
namespace App\Domain\Entities;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model { /* Domain contaminated */ }
```
---
## Good Example
```php
// app/Infrastructure/Persistence/InvoiceModel.php
namespace App\Infrastructure\Persistence;
use Illuminate\Database\Eloquent\Model;

class InvoiceModel extends Model { /* Infrastructure only */ }
```
---
## Exceptions
Laravel DDD (partial independence) where domain entities are Eloquent models — this is a documented architectural choice, not Clean Architecture.
---
## Consequences Of Violation
Domain coupled to Laravel ORM; architecture inconsistency; repository abstraction invalidated.

## No Framework Helpers in Application
---
## Category
Architecture | Framework Usage
---
## Rule
NEVER use Laravel helper functions (`validator()`, `response()`, `redirect()`, `dispatch()`, `event()`) or Facades in the Application layer.
---
## Reason
Helpers and Facades are implicit dependencies on Laravel's global state. Using them in Application creates hidden coupling that isn't visible in constructor signatures and cannot be mocked easily.
---
## Bad Example
```php
class RegisterUserUseCase {
    public function execute(RegisterUserDto $dto): void {
        validator($dto->toArray(), ['email' => 'required|email'])->validate();
        event(new UserRegistered($dto->email));
    }
}
```
---
## Good Example
```php
class RegisterUserUseCase {
    public function __construct(
        private UserRepository $users,
        private EventBus $events,
    ) {}
    public function execute(RegisterUserDto $dto): void {
        $this->events->dispatch(new UserRegistered($dto->email));
    }
}
```
---
## Exceptions
Laravel utilities (`Str::slug()`, `Arr::get()`, `Carbon::parse()`) are acceptable as they are general-purpose and do not represent architectural coupling.
---
## Consequences Of Violation
Hidden framework coupling; Application layer cannot be tested without Laravel bootstrap; Dependency Rule violated implicitly.
