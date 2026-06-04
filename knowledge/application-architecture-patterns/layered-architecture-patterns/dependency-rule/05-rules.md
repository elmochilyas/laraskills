# Rules for The Dependency Rule: inward-pointing dependencies

## Enforce Dependency Rule with Architecture Tests
---
## Category
Architecture | Testing
---
## Rule
ALWAYS enforce the Dependency Rule with automated architecture tests; do not rely on directory structure, code review, or team discipline alone.
---
## Reason
The Dependency Rule cannot be enforced by directory structure — a class in `app/Domain/` can still import `Facades\DB`. Only automated tests that parse `use` statements catch violations at merge time.
---
## Bad Example
No architecture tests. A developer imports `Illuminate\Http\Request` in an Application layer class during a sprint crunch. Code review misses it. Six months later, six Application classes depend on HTTP.
---
## Good Example
```php
arch('domain')->expect('App\Domain')->toOnlyUse([]);
arch('application')->expect('App\Application')->toOnlyUse(['App\Domain']);
arch('infrastructure')->expect('App\Infrastructure')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Database']);
arch('presentation')->expect('App\Http')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Http']);
```
---
## Exceptions
Prototypes or proof-of-concept projects where architectural enforcement is premature.
---
## Consequences Of Violation
Dependency Rule degrades silently; framework coupling spreads; architecture becomes cosmetic; restoration requires significant refactoring effort.

## Use Dependency Inversion at Boundaries
---
## Category
Architecture | Design
---
## Rule
At architectural boundaries, define interfaces in inner layers and implement them in outer layers; use the service container to wire implementations at runtime.
---
## Reason
Dependency Inversion is the mechanism that satisfies the Dependency Rule. Inner layers declare what they need (interfaces); outer layers provide concrete implementations. This keeps inner layers free of outer-layer coupling.
---
## Bad Example
```php
// Application layer directly uses Eloquent
class RegisterUserUseCase {
    public function execute(RegisterUserDto $dto): void {
        EloquentUser::create($dto->toArray());
    }
}
```
---
## Good Example
```php
// Domain defines interface
interface UserRepository {
    public function save(User $user): void;
}
// Application depends on interface
class RegisterUserUseCase {
    public function __construct(private UserRepository $users) {}
    public function execute(RegisterUserDto $dto): void {
        $this->users->save(User::fromDto($dto));
    }
}
// Infrastructure implements interface
class EloquentUserRepository implements UserRepository { /* ... */ }
```
---
## Exceptions
Three-layer architecture where the Business layer deliberately depends on Eloquent — this is a documented tradeoff, not a Dependency Rule violation.
---
## Consequences Of Violation
Inner layers coupled to outer layers; swapping implementations impossible; testing requires real infrastructure.

## Bind Interfaces in Service Providers
---
## Category
Architecture | Framework Usage
---
## Rule
Centralize all interface-to-implementation bindings in Service Providers; do not scatter bindings across multiple providers or resolve concrete classes directly.
---
## Reason
The composition root is the single place where dependency wiring is configured. Scattered bindings make it difficult to understand which implementation satisfies each interface.
---
## Bad Example
```php
// Binding in a controller
public function pay($id) {
    $repo = app()->make(EloquentInvoiceRepository::class); // Direct resolution
}
```
---
## Good Example
```php
class AppServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
        $this->app->bind(EventBus::class, LaravelEventBus::class);
    }
}
```
---
## Exceptions
Contextual bindings (different implementations for different consumers) may require separate provider methods or a dedicated binding provider.
---
## Consequences Of Violation
Unclear dependency graph; duplicate binding logic; difficulty changing implementations globally.

## No Facades or Helpers in Inner Layers
---
## Category
Architecture | Framework Usage
---
## Rule
NEVER use Laravel Facades (`\DB::`, `\Cache::`, `\Event::`) or helper functions (`validator()`, `response()`, `redirect()`) in Domain or Application layers.
---
## Reason
Facades and helpers are implicit dependencies on Laravel's global state. They are not visible in constructor signatures, cannot be mocked in unit tests, and create hidden coupling to the framework.
---
## Bad Example
```php
class InvoiceService {
    public function cancel(int $invoiceId): void {
        \DB::transaction(function () use ($invoiceId) {
            $invoice = \DB::table('invoices')->find($invoiceId);
            \Cache::put("invoice.{$invoiceId}.cancelled", true);
        });
    }
}
```
---
## Good Example
```php
class CancelInvoiceUseCase {
    public function __construct(
        private InvoiceRepository $invoices,
        private CacheService $cache,
    ) {}
    public function execute(CancelInvoiceDto $dto): void {
        $this->invoices->cancel($dto->invoiceId);
        $this->cache->markCancelled($dto->invoiceId);
    }
}
```
---
## Exceptions
Laravel utility facades (`Str::`, `Arr::`) that represent general-purpose utilities (not infrastructure) may be used in Application layer with awareness that it creates mild coupling.
---
## Consequences Of Violation
Hidden framework coupling; inner layers untestable without Laravel bootstrap; Dependency Rule violated implicitly.

## Apply Tiered Enforcement per Layer
---
## Category
Architecture
---
## Rule
Apply graduated enforcement strictness: Domain layer allows zero external dependencies; Application layer allows no Laravel HTTP/database imports but may use Laravel utilities; Infrastructure and Presentation have broader allowances.
---
## Reason
Different layers have different coupling tolerance. Domain must be pristine. Application needs some Laravel utilities but not HTTP/database. One-size-fits-all enforcement is either too strict (blocking legitimate usage) or too loose (allowing violations).
---
## Bad Example
Same architecture test for all layers allowing `Illuminate\*` everywhere — Domain imports `Illuminate\Support\Facades\DB` without failing.
---
## Good Example
```php
arch('domain')->expect('App\Domain')->toOnlyUse([]);
arch('application')->expect('App\Application')->toOnlyUse(['App\Domain', 'Illuminate\Support']);
arch('infrastructure')->expect('App\Infrastructure')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\*']);
```
---
## Exceptions
Applications with full framework independence may tighten Application layer to zero framework imports as well.
---
## Consequences Of Violation
Domain contaminated with framework coupling; or Application blocked from using legitimate utilities; inconsistent enforcement.

## No Extending Framework Classes in Inner Layers
---
## Category
Architecture | Framework Usage
---
## Rule
NEVER extend framework classes (`extends Model`, `extends Controller`, `extends Request`) in Domain or Application layers.
---
## Reason
Extending a framework class creates the strongest possible coupling — the class IS a framework artifact. This violates the Dependency Rule because the inner layer now depends on the framework.
---
## Bad Example
```php
namespace App\Domain\Entities;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model { // Domain extends framework class
    public function markAsPaid(): void { /* ... */ }
}
```
---
## Good Example
```php
namespace App\Domain\Entities;

class Invoice {
    public function __construct(private InvoiceId $id, private InvoiceStatus $status) {}
    public function markAsPaid(): void { /* ... */ }
}
```
---
## Exceptions
Laravel DDD where domain entities ARE Eloquent models — this is a documented partial-independence tradeoff, not Clean Architecture.
---
## Consequences Of Violation
Domain coupled to framework; extends creates tight binding to Laravel's ORM internals; migration requires complete rewrite of domain classes.

## Watch Transitive Dependencies
---
## Category
Architecture | Maintainability
---
## Rule
Audit package dependencies for transitive framework coupling; a package used in Application layer that internally depends on Laravel creates indirect Dependency Rule violations.
---
## Reason
Adding a third-party package to Application or Domain that transitively imports Laravel creates hidden framework coupling. The `use` statement may not show it, but the dependency graph includes framework code.
---
## Bad Example
Adding a Laravel-specific payment package (`laravel-stripe`) to the Application layer's `composer.json`. The use case now transitively depends on `Illuminate\Http\Request` even if it never imports it directly.
---
## Good Example
Using a framework-agnostic payment SDK in the Application layer and wrapping Laravel-specific integration in an Infrastructure adapter.
---
## Exceptions
Packages that use Laravel utilities (`illuminate/support`) without creating HTTP or database coupling may be acceptable in Application — evaluate on a case-by-case basis.
---
## Consequences Of Violation
Hidden framework coupling in inner layers; package upgrade may break Dependency Rule; architecture purity erodes indirectly.

## No Infrastructure Imports in Presentation
---
## Category
Architecture | Framework Usage
---
## Rule
Controllers and Presentation layer classes MUST NOT directly import or use Infrastructure layer classes (Eloquent models, repository implementations, external API clients).
---
## Reason
Presentation should delegate to Application layer use cases, not directly access Infrastructure. Direct Infrastructure access in Controllers bypasses Application orchestration, business rules, and transaction boundaries.
---
## Bad Example
```php
class InvoiceController {
    public function show(int $id) {
        $invoice = InvoiceModel::with('items', 'user')->findOrFail($id); // Infrastructure call
        return new InvoiceResource($invoice);
    }
}
```
---
## Good Example
```php
class InvoiceController {
    public function __construct(private GetInvoiceUseCase $useCase) {}
    public function __invoke(int $id): InvoiceResource {
        return new InvoiceResource($this->useCase->execute($id));
    }
}
```
---
## Exceptions
Form Requests that reference Eloquent models for `exists` rules are acceptable — `'user_id' => 'exists:users,id'` in rule strings, not direct model imports.
---
## Consequences Of Violation
Application layer orchestration bypassed; business rules not enforced; transaction boundaries not respected; inconsistent behavior when the same operation is triggered from CLI/queue.
