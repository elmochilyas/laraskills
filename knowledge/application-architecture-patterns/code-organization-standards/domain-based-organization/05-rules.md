# Rules: COS-06 — Domain-Based Organization

## R01: Never Access Another Domain's Eloquent Models Directly
---
## Category
Architecture
---
## Rule
Do not reference Eloquent models from another domain's directory. Use domain service contracts or events for cross-domain data access.
---
## Reason
Direct Eloquent access across domain boundaries creates tight coupling. If `Billing` domain changes its `Invoice` table, all domains querying `Billing\Invoice` directly break. Contracts and events provide an abstraction layer that insulates domains.
---
## Bad Example
```php
// app/Domains/Catalog/Services/ProductService.php
use App\Domains\Billing\Models\Invoice;
// Catalog domain directly queries Billing's model — tight coupling
$invoices = Invoice::where('product_id', $product->id)->get();
```
---
## Good Example
```php
// Billing domain exposes a contract:
interface BillingServiceInterface {
    public function getInvoicesForProduct(int $productId): Collection;
}
// Catalog domain uses the contract:
class ProductService {
    public function __construct(private BillingServiceInterface $billing) {}
    public function getSalesData(Product $product): array {
        return $this->billing->getInvoicesForProduct($product->id);
    }
}
```
---
## Exceptions
No common exceptions — cross-domain model access defeats domain isolation.
---
## Consequences Of Violation
Domain isolation becomes meaningless. Schema changes in one domain break all dependent domains.
---

## R02: Give Each Domain Its Own Service Provider
---
## Category
Code Organization
---
## Rule
Register each domain's routes, events, and service bindings in a dedicated service provider within that domain's directory.
---
## Reason
A single central provider registering everything from all domains becomes unmanageable. Per-domain providers enable independent domain lifecycle management, improve testability, and scale with team ownership.
---
## Bad Example
```php
// app/Providers/AppServiceProvider.php — 200 lines registering all domains
public function register(): void {
    $this->app->bind(BillingServiceInterface::class, BillingService::class);
    $this->app->bind(CatalogServiceInterface::class, CatalogService::class);
    $this->app->bind(IdentityServiceInterface::class, IdentityService::class);
    // 12 more bindings...
}
```
---
## Good Example
```php
// app/Domains/Billing/Providers/BillingServiceProvider.php
class BillingServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(BillingServiceInterface::class, BillingService::class);
    }
    public function boot(): void {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
    }
}
```
---
## Exceptions
Domains with no routes, events, or bindings may share an application-level provider.
---
## Consequences Of Violation
Central provider becomes a coupling bottleneck. Domain registration changes require editing a shared file, creating merge conflicts.
---

## R03: Use Domain-Scoped Eloquent Models for Each Domain
---
## Category
Architecture
---
## Rule
Each domain owns its own database tables and Eloquent models. Never share a single model across domains.
---
## Reason
Shared models create a single coupling point — all domains depend on the same model, and changing it requires coordinated changes across all domains. Each domain's model represents the domain's view of the data.
---
## Bad Example
```php
// All domains use the same User model:
use App\Models\User; // Single model used by Billing, Catalog, Identity
// Adding a billing-specific field to User requires migration coordination
```
---
## Good Example
```php
// Each domain owns its user concept:
// app/Domains/Identity/Models/User.php (authentication, profile)
// app/Domains/Billing/Models/User.php (payment methods, invoices)
// Shared fields through a base or trait, domain-specific fields per model
```
---
## Exceptions
Shared kernel models (e.g., `Tenant`) that are genuinely cross-cutting and stable.
---
## Consequences Of Violation
Model becomes a bottleneck for 3+ teams. Single model grows to 100+ columns. Combined migrations block independent deployment.
---

## R04: Use Domain Events for Cross-Domain Communication
---
## Category
Architecture
---
## Rule
Communicate across domains via dispatched events, not via method calls on another domain's classes.
---
## Reason
Events decouple domains — the dispatching domain does not know or care which other domains listen. This prevents the creation of dependency graphs where domains must be loaded in a specific order.
---
## Bad Example
```php
// Billing domain calls Identity domain directly:
class BillingService {
    public function chargeCustomer(Customer $customer): void {
        // Direct call to another domain's service
        app(IdentityService::class)->sendNotification($customer, 'payment-received');
    }
}
```
---
## Good Example
```php
// Billing dispatches event:
class PaymentReceived {
    public function __construct(public Customer $customer) {}
}

// Identity listens independently:
class SendPaymentNotification {
    public function handle(PaymentReceived $event): void {
        // Identity handles its own notification logic
    }
}
```
---
## Exceptions
Synchronous cross-domain queries that need immediate return values — use contracts, not events, for request-response patterns.
---
## Consequences Of Violation
Circular domain dependencies. Domains must be loaded in strict order. Domain extraction to microservices becomes impossible.
---

## R05: Document Domain Boundaries Explicitly
---
## Category
Maintainability
---
## Rule
Maintain a `domain-map.md` in the project root listing each domain, its owner, key models, and dependencies on other domains.
---
## Reason
New developers need to understand which domain owns which concept. Without documentation, domain boundaries become fuzzy — developers add features to the "closest" domain rather than creating a new one or identifying the correct owner.
---
## Bad Example
```php
// No domain documentation
// New developer: "Where does the refund logic go?"
// Team: "Billing? Or maybe Orders? Or should we create a new domain?"
```
---
## Good Example
```markdown
// domain-map.md
// | Domain | Owner | Key Models | Depends On |
// |--------|-------|------------|------------|
// | Identity | Team A | User, Role | — |
// | Billing | Team B | Invoice, Payment, Subscription | Identity |
// | Catalog | Team A | Product, Category | — |
```
---
## Exceptions
Single-domain applications where a domain map is trivial.
---
## Consequences Of Violation
Domain boundary erosion. Features placed in wrong domains. New domains not created when needed.
---

## R06: Enforce Domain Isolation via Automated Checks
---
## Category
Testing
---
## Rule
Write architecture tests that prevent any domain from importing classes from another domain's internal implementation.
---
## Reason
Without enforcement, domain boundaries are aspirational. "Just this once" cross-domain imports become permanent coupling. Automated tests catch violations in CI before they reach production.
---
## Bad Example
```php
// No enforcement — 3 months later:
// Catalog domain: `use App\Domains\Billing\Models\Invoice;`
// Identity domain: `use App\Domains\Catalog\Models\Product;`
```
---
## Good Example
```php
// Pest architecture test per domain
test('billing domain does not import from catalog')
    ->expect('App\Domains\Billing')
    ->not->toUse('App\Domains\Catalog');

test('catalog domain does not import from billing')
    ->expect('App\Domains\Catalog')
    ->not->toUse('App\Domains\Billing');
```
---
## Exceptions
Contracts/interfaces in domain directories that are explicitly designed for cross-domain use.
---
## Consequences Of Violation
Silent dependency creep. Domain extraction becomes prohibitively expensive as coupling grows.
---

## R07: Keep Shared Kernel Outside Any Domain
---
## Category
Code Organization
---
## Rule
Place cross-cutting infrastructure (authentication, base classes, audit logging) in an application-level directory, not inside any domain.
---
## Reason
If shared kernel lives inside a domain, that domain becomes a bottleneck — every other domain depends on it, and changes require coordination. A neutral shared kernel eliminates this coupling.
---
## Bad Example
```php
// Base controller inside Identity domain:
// app/Domains/Identity/BaseController.php
// All other domains extend it — Identity becomes mandatory dependency
```
---
## Good Example
```php
// app/Http/Controllers/BaseController.php — application-level shared
// All domains extend the application-level base, not any domain's base
```
---
## Exceptions
Domains that genuinely own infrastructure (e.g., a "Platform" domain in a PaaS product).
---
## Consequences Of Violation
A single domain becomes a bottleneck. Extracting that domain to a microservice breaks all other domains.
---

## R08: Ensure Domain Boundaries Are Stable Before Implementation
---
## Category
Architecture
---
## Rule
Confirm domain boundaries are reasonably stable before implementing domain-based organization. Do not reorganize into domains if boundaries will change quarterly.
---
## Reason
Moving code between domains is expensive — file moves, namespace updates, import updates, and migration changes. Frequently shifting boundaries negate the benefits of domain isolation.
---
## Bad Example
```php
// Q1: app/Domains/Billing/
// Q2: app/Domains/Payments/ (refactored from Billing)
// Q3: app/Domains/Finance/ (refactored from Payments)
// Constant restructuring — team spends 30% time moving files
```
---
## Good Example
```php
// Wait 6+ months to observe natural boundaries
// Identify 3-4 stable bounded contexts
// Implement domain structure once with documented boundaries
```
---
## Exceptions
Startups or rapidly pivoting products where agility is more important than stable architecture.
---
## Consequences Of Violation
Constant refactoring cost. Team frustration with "architecture of the month." Lost productivity.
