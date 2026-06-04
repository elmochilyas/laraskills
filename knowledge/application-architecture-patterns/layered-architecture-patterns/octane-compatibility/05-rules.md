# Rules for Octane compatibility considerations for layered architecture

## Default to Transient Service Binding
---
## Category
Performance | Reliability
---
## Rule
Bind services as transient (`$this->app->bind()`) by default; use singleton binding ONLY after auditing the class for mutable state.
---
## Reason
Under Octane, singleton objects persist across requests. A singleton with mutable state leaks data between requests. Transient binding creates a new instance per request, which is safe. Auditing every class for statelessness before making it singleton prevents cross-request contamination.
---
## Bad Example
```php
// ServiceProvider
public function register(): void {
    $this->app->singleton(InvoiceService::class); // Singleton without audit
}
// Service stores request-scoped state
class InvoiceService {
    private ?User $currentUser = null;
}
```
---
## Good Example
```php
// ServiceProvider
public function register(): void {
    $this->app->bind(InvoiceService::class); // Transient - safe default
}
// Singleton only after audit:
$this->app->singleton(PdfGenerator::class); // Stateless - safe
```
---
## Exceptions
Provably stateless classes (no mutable properties, no request-scoped dependencies) may use singleton for performance - audit must be documented.
---
## Consequences Of Violation
Cross-request state leaks; request A data visible in request B; intermittent hard-to-reproduce bugs.

## Never Store Request Context on Service Instances
---
## Category
Security | Reliability
---
## Rule
NEVER assign request-scoped context (user, tenant, locale) to service instance properties; ALWAYS pass context as method parameters.
---
## Reason
Storing user context on a service instance means request B sees request A user when the service is a singleton under Octane. Passing context as method parameters ensures each request operates with its own context regardless of binding mode.
---
## Bad Example
```php
class InvoiceService {
    private ?User $currentUser = null;
    public function setUser(User $user): void { $this->currentUser = $user; }
    public function createInvoice(array $data): void {
        // Uses $this->currentUser - leaks across requests under Octane
    }
}
```
---
## Good Example
```php
class InvoiceService {
    public function createInvoice(array $data, User $user): void {
        // User passed as method parameter - safe regardless of binding mode
    }
}
```
---
## Exceptions
No common exceptions. Request context must always be passed as method parameters under Octane.
---
## Consequences Of Violation
User data leaks across requests; tenant A data visible to tenant B under Octane; security incidents; intermittent production bugs.

## Use Context Object Pattern
---
## Category
Architecture | Reliability
---
## Rule
Pass request context (user, tenant, locale, request ID) as a single Context value object through the call chain; do not pass individual context values as separate parameters.
---
## Reason
A single context object makes the call chain cleaner, is easy to extend with new context fields, and provides a standard location for request-scoped data that must not be stored on service instances.
---
## Bad Example
```php
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto, User $user, string $tenantId, string $locale): void {
        // Four parameters - fragile, hard to extend
    }
}
```
---
## Good Example
```php
class RequestContext {
    public function __construct(
        public readonly User $user,
        public readonly string $tenantId,
        public readonly string $locale,
    ) {}
}
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto, RequestContext $context): void {
        // Single context object - clean, extensible, safe
    }
}
```
---
## Exceptions
Methods that only need one piece of context (e.g., just the user) may accept that single value directly.
---
## Consequences Of Violation
Messy call chains with many context parameters; hard to add new context fields; inconsistent context handling across use cases.

## Audit All Services for Mutable Properties Before Octane Migration
---
## Category
Reliability | Performance
---
## Rule
Audit every service class for mutable properties before deploying under Octane; remove or redesign any class with mutable state.
---
## Reason
Common stateful patterns - stored user context, cached query results on properties, mutable counters, static properties - all cause cross-request contamination under Octane. Without a full audit, silent corruption occurs in production.
---
## Bad Example
```php
class ReportService {
    private array $cachedResults = []; // Mutable cache on instance - unsafe
    private ?string $currentTenant = null; // Mutable request state - unsafe
}
```
---
## Good Example
```php
class ReportService {
    // No mutable properties - all state passed as method parameters
    public function generate(ReportCriteria $criteria): Report {
        $results = $this->dataSource->fetch($criteria);
        return new Report($results);
    }
}
```
---
## Exceptions
Decorated or wrapped services that are provably re-instantiated per request (transient + no shared dependencies with state) may use limited instance state - but this requires careful analysis.
---
## Consequences Of Violation
Silent data corruption; hard-to-diagnose bugs that manifest only under load; multi-tenant data leaks; production incidents.

## Prefer Action Classes for Octane-Safe Operations
---
## Category
Architecture | Reliability
---
## Rule
Use action classes (stateless classes with all input via `execute()` parameters) as the default pattern for Octane-safe business operations.
---
## Reason
Action classes naturally have no constructor state - they receive all input through method parameters. This makes them inherently stateless and safe for Octane regardless of binding mode.
---
## Bad Example
```php
class InvoiceService {
    public function __construct(
        private InvoiceRepository $invoices,
        private ?User $user = null, // Request-scoped state in constructor
    ) {}
}
```
---
## Good Example
```php
class CreateInvoiceAction {
    public function __construct(
        private InvoiceRepository $invoices, // Infrastructure only - stateless
    ) {}
    public function execute(CreateInvoiceDto $dto, User $user): InvoiceDto {
        // All request-specific input as parameters
    }
}
```
---
## Exceptions
Service classes that orchestrate multiple action classes and hold only stateless dependencies are acceptable - the key is no request-scoped state in the constructor.
---
## Consequences Of Violation
Request-scoped state in constructor parameters; implicit Octane unsafety; intermittent bugs that are hard to reproduce.

## Use Factory Pattern for Request-Scoped Services
---
## Category
Architecture | Reliability
---
## Rule
Use closure factories to create services that need per-request configuration; do not inject request-scoped configuration at service registration time.
---
## Reason
Service registration happens once per worker under Octane. If a service needs per-request configuration, it must be created fresh each request via a factory, not pre-configured at registration time.
---
## Bad Example
```php
// Registered as singleton - configuration captured once
$this->app->singleton(TenantService::class, function ($app) {
    return new TenantService($app->make(TenantContext::class));
});
```
---
## Good Example
```php
// Factory creates fresh instance per request with current context
$this->app->bind(TenantService::class, function ($app) {
    return new TenantService($app->make(TenantContext::class));
});
// Or explicit factory:
$this->app->bind(TenantAwarePolicy::class, function ($app) {
    return new TenantAwarePolicy($app->make('current.tenant'));
});
```
---
## Exceptions
Services that are genuinely stateless and need no per-request configuration can be registered as singletons directly.
---
## Consequences Of Violation
Stale configuration captured at worker boot time; all requests on same worker use same configuration; incorrect behavior for multi-tenant apps.

## Keep Domain Entities Immutable
---
## Category
Architecture | Reliability
---
## Rule
Prefer immutable domain entities (state changed only by creating new instances) for Octane compatibility; avoid entities with mutable setter methods.
---
## Reason
Mutable entities can hold stale state across requests when cached or referenced from long-lived services. Immutable entities with behavior methods that return new instances are inherently thread-safe and Octane-compatible.
---
## Bad Example
```php
class Invoice {
    private string $status = 'draft';
    public function markAsPaid(): void {
        $this->status = 'paid'; // Mutation - state changes on existing instance
    }
}
```
---
## Good Example
```php
class Invoice {
    public function __construct(
        private readonly InvoiceId $id,
        private readonly InvoiceStatus $status,
    ) {}
    public function markAsPaid(): static {
        return new self($this->id, InvoiceStatus::PAID); // Returns new instance
    }
}
```
---
## Exceptions
Performance-critical paths where object allocation overhead is significant may use mutation internally - but the returned type should still be immutable from the consumer's perspective.
---
## Consequences Of Violation
Stale entity state when cached across requests; subtle Octane bugs; hard-to-debug state corruption.
