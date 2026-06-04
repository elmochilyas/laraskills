# Rules for Service Providers for Interface Binding

## Bind in register(), Not boot()
---
## Category
Architecture | Service Container
---
## Rule
Register ALL container bindings in the `register()` method of Service Providers; NEVER bind in `boot()`.
---
## Reason
The `register()` method is called immediately when the provider is registered. The `boot()` method is called after all providers are registered and may execute too late for consumers that need the binding during provider booting. Binding in `boot()` can cause unexpected resolution failures.
---
## Bad Example
```php
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {
        $this->app->bind(Interface::class, Implementation::class);
    }
}
```
---
## Good Example
```php
class InfrastructureServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(Interface::class, Implementation::class);
    }
}
```
---
## Exceptions
No exceptions. Container bindings always belong in `register()`.
---
## Consequences Of Violation
Binding may not be available to all consumers; resolution failures depending on provider execution order.

## Dedicated InfrastructureServiceProvider
---
## Category
Architecture | Code Organization
---
## Rule
Create a dedicated `InfrastructureServiceProvider` class for all interface-to-implementation bindings; do not mix bindings with other provider responsibilities.
---
## Reason
A single, focused provider for Port-Adapter bindings makes dependency configuration auditable. Mixing bindings with event registration, route loading, or middleware configuration creates a god provider that is hard to maintain.
---
## Bad Example
```php
class AppServiceProvider extends ServiceProvider {
    public function register(): void {
        // Mixing concerns
    }
    public function boot(): void {
        Route::group(...); // Routes with bindings
    }
}
```
---
## Good Example
```php
class InfrastructureServiceProvider extends ServiceProvider {
    public function register(): void {
        // All interface-to-implementation bindings
    }
}
```
---
## Exceptions
Small applications (<10 bindings) may use AppServiceProvider until the provider justifies extraction.
---
## Consequences Of Violation
Hard-to-maintain providers; difficulty finding all bindings; mixed concerns.

## Interface Type Hints in Constructors
---
## Category
Architecture | Dependency Injection
---
## Rule
Application classes MUST type-hint interfaces (ports) in their constructors, not concrete implementations; the container resolves through the binding.
---
## Reason
Constructor injection with interface type hints keeps classes decoupled from implementations. The binding configuration is centralized in the Service Provider, not scattered across classes.
---
## Bad Example
```php
class InvoiceController {
    public function __construct(
        private EloquentInvoiceRepository $repository, // Concrete class
    ) {}
}
```
---
## Good Example
```php
class InvoiceController {
    public function __construct(
        private InvoiceRepositoryInterface $repository, // Interface
    ) {}
}
```
---
## Exceptions
Value Objects, DTOs, and other non-service classes that are never resolved from the container may use concrete classes.
---
## Consequences Of Violation
Classes coupled to implementations; adapter swapping requires changing class constructors; testability reduced.

## No Business Logic in Providers
---
## Category
Architecture | Service Container
---
## Rule
Service Provider `register()` methods MUST contain only binding declarations; NO business logic, configuration reading, logging, or IO operations.
---
## Reason
Providers run during application bootstrap, before middleware, error handling, and logging are fully initialized. Business logic in providers introduces side effects during bootstrap, makes testing difficult, and violates the single responsibility of providers.
---
## Bad Example
```php
public function register(): void {
    $config = Config::get('services.stripe');
    Log::info('Stripe key loaded', ['prefix' => substr($config['key'], 0, 4)]);
    $this->app->bind(PaymentGateway::class, fn() => new StripeGateway($config));
}
```
---
## Good Example
```php
public function register(): void {
    $this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
    // Configuration is handled by the gateway constructor, not the provider
}
```
---
## Exceptions
No common exceptions. Business logic does not belong in provider `register()`.
---
## Consequences Of Violation
Side effects during bootstrap; testing complexity; configuration coupled to provider execution.

## Use Contextual Binding for Specific Classes
---
## Category
Architecture | Dependency Injection
---
## Rule
Use contextual binding when a specific class needs a different implementation than the default binding; do not create separate interfaces for class-specific implementations.
---
## Reason
Contextual binding allows a single interface to have different implementations for different consumers. Creating separate interfaces for each consumer leads to interface explosion.
---
## Bad Example
```php
// Two interfaces for the same concept because of different implementations
interface PdfReportGeneratorInterface {}
interface CsvReportGeneratorInterface {}
```
---
## Good Example
```php
// Single interface with contextual binding
interface ReportGeneratorInterface {}
// In Service Provider:
$this->app->when(InvoiceController::class)
    ->needs(ReportGeneratorInterface::class)
    ->give(PdfReportGenerator::class);
$this->app->when(ReportCommand::class)
    ->needs(ReportGeneratorInterface::class)
    ->give(CsvReportGenerator::class);
```
---
## Exceptions
When the implementations are architecturally distinct and may diverge independently, separate interfaces may be justified.
---
## Consequences Of Violation
Interface explosion; unnecessary abstraction layers; harder to understand dependency graph.

## Automatic Binding for Common Patterns
---
## Category
Architecture | Development Workflow
---
## Rule
Use automatic binding (convention-based resolution) for implementation classes that follow a consistent naming pattern; reserve explicit bindings for interfaces with multiple implementations or special configuration.
---
## Reason
Automatic binding reduces boilerplate for the common case where each interface has exactly one implementation. Explicit bindings are reserved for cases requiring configuration, conditional logic, or multiple implementations.
---
## Bad Example
```php
// Explicit bindings for every interface, even when there's only one implementation
$this->app->bind(UserServiceInterface::class, UserService::class);
$this->app->bind(InvoiceServiceInterface::class, InvoiceService::class);
$this->app->bind(ProductServiceInterface::class, ProductService::class);
```
---
## Good Example
```php
// Laravel auto-resolves UserService from UserServiceInterface
// Explicit bindings only where needed:
$this->app->singleton(PaymentGateway::class, StripePaymentGateway::class);
$this->app->singleton(InvoiceRepository::class, EloquentInvoiceRepository::class);
```
---
## Exceptions
Projects with strict Port-Adapter separation may prefer explicit bindings for all interfaces to ensure auditability.
---
## Consequences Of Violation
Unnecessary boilerplate; explicit bindings for trivial cases obscure the important bindings that have special configuration.
