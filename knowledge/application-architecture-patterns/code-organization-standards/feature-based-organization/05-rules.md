# Rules: COS-05 — Feature-Based Organization

## R01: Keep Each Feature Fully Self-Contained
---
## Category
Code Organization
---
## Rule
Place all classes needed for a single business capability inside that feature's directory — controllers, models, services, events, and routes together.
---
## Reason
Colocation makes feature boundaries explicit. Developers can understand a feature entirely within one directory tree without cross-referencing multiple layer directories. This is the defining principle of vertical slicing.
---
## Bad Example
```php
// Payment feature spread across layer directories:
// app/Http/Controllers/PaymentController.php
// app/Models/Payment.php
// app/Services/PaymentService.php
// app/Events/PaymentCompleted.php
// routes/web.php (payment route section)
```
---
## Good Example
```php
// app/Features/Payment/
// ├── Controllers/PaymentController.php
// ├── Models/Payment.php
// ├── Services/PaymentService.php
// ├── Events/PaymentCompleted.php
// └── routes.php
```
---
## Exceptions
Truly shared code (base controllers, auth middleware) belongs in `app/Shared/` or a shared kernel.
---
## Consequences Of Violation
Scattered feature code requires opening 5+ files across 4 directories to understand one feature. Feature extraction becomes impossible.
---

## R02: Never Import Directly from Another Feature's Internal Code
---
## Category
Architecture
---
## Rule
Do not import classes from another feature's directory — use events, contracts, or the shared kernel for cross-feature communication.
---
## Reason
Direct imports between features create coupling that defeats the purpose of feature isolation. If Feature A needs Feature B's model, changing Feature B breaks Feature A. Events and contracts decouple this relationship.
---
## Bad Example
```php
// app/Features/Checkout/Services/CheckoutService.php
use App\Features\UserRegistration\Models\User;
// Direct dependency on another feature's internals
```
---
## Good Example
```php
// Cross-feature communication via event
class CheckoutCompleted {
    public function __construct(public Order $order) {}
}
// Feature A dispatches event; Feature B listens independently
```
---
## Exceptions
Shared kernel classes (`app/Shared/`) that are explicitly designed for cross-feature use.
---
## Consequences Of Violation
Brittle feature boundaries. A change to one feature risks breaking unrelated features. Feature ownership becomes meaningless.
---

## R03: Use Feature-Scoped Route Files
---
## Category
Code Organization
---
## Rule
Each feature should define its own route file. Avoid adding feature routes to `routes/web.php`.
---
## Reason
A single `routes/web.php` becomes unmanageable as features multiply — merge conflicts, scrolling fatigue, and unclear route-to-feature mapping. Per-feature route files keep ownership clear.
---
## Bad Example
```php
// routes/web.php — 500+ lines with all feature routes mixed together
// Billing section, then Catalog section, then Auth section
// Two teams editing this file cause daily merge conflicts
```
---
## Good Example
```php
// app/Features/Billing/routes.php
Route::prefix('billing')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
});

// Routes discovered automatically via glob pattern in RouteServiceProvider
```
---
## Exceptions
Small projects (under 5 features) where a single route file is still manageable.
---
## Consequences Of Violation
Merge conflicts on `routes/web.php` as features grow. Unclear ownership of individual routes.
---

## R04: Automate Feature Discovery via Glob Loading
---
## Category
Maintainability
---
## Rule
Load feature routes, migrations, and service providers automatically via glob patterns rather than manual registration.
---
## Reason
Manual registration requires editing a central file every time a feature is added or removed. This creates merge conflicts, forgotten registrations, and friction. Glob-based auto-discovery eliminates these issues.
---
## Bad Example
```php
// providers list must be updated for every new feature
// Developer forgets → feature routes return 404
```
---
## Good Example
```php
// RouteServiceProvider — auto-discover feature routes
foreach (glob(app_path('Features/*/routes.php')) as $file) {
    Route::middleware('web')->group($file);
}
```
---
## Exceptions
Features with specific middleware requirements that cannot be expressed via glob patterns.
---
## Consequences Of Violation
Forgotten registrations causing 404 errors. Merge conflicts on central registration files.
---

## R05: Establish a Shared Kernel for Cross-Cutting Concerns
---
## Category
Architecture
---
## Rule
Place code used by multiple features in an `app/Shared/` or `app/Support/` directory — never duplicate across features and never assume it belongs to any single feature.
---
## Reason
Feature isolation does not mean unrestricted duplication. Shared infrastructure (audit logging, base controllers, utility classes) must live somewhere neutral. Without a shared kernel, teams either duplicate code or create illicit cross-feature imports.
---
## Bad Example
```php
// Same DateHelper logic duplicated in 3 features:
// app/Features/Billing/Helpers/DateHelper.php
// app/Features/Catalog/Helpers/DateHelper.php
// app/Features/Auth/Helpers/DateHelper.php
```
---
## Good Example
```php
// app/Shared/Helpers/DateHelper.php — used by all features
// app/Shared/Models/Tenant.php — shared across features
// app/Shared/Services/AuditService.php — cross-cutting concern
```
---
## Exceptions
No common exceptions — shared code always needs a neutral home.
---
## Consequences Of Violation
Code duplication across features. Inconsistent implementations of the same logic. Maintenance burden.
---

## R06: Limit Feature Size — Extract Sub-Features
---
## Category
Maintainability
---
## Rule
Split a feature when its directory exceeds 30-50 files or encompasses multiple distinct sub-capabilities.
---
## Reason
A feature with 50+ files is no longer a cohesive unit — it is a domain that should be decomposed. Large feature directories lose the discoverability benefit that feature organization provides.
---
## Bad Example
```php
// app/Features/Checkout/ with 60+ files:
// Controllers/, Models/, Services/, Events/, Jobs/, Listeners/,
// Notifications/, Mail/, DTOs/, Enums/, Rules/, Exceptions/...
// Contains both checkout AND subscription management
```
---
## Good Example
```php
// Split into focused features:
// app/Features/Checkout/ (~20 files — purchase flow only)
// app/Features/Subscriptions/ (~15 files — recurring billing)
// app/Features/Refunds/ (~10 files — return/refund flow)
```
---
## Exceptions
Features that are inherently large but truly cohesive (e.g., a reporting dashboard with many sub-components).
---
## Consequences Of Violation
Megafeatures that are as hard to navigate as flat layer directories. Feature ownership becomes unclear.
---

## R07: Match Feature Boundaries to Team Ownership
---
## Category
Scalability
---
## Rule
Align feature directories with team ownership — each feature should be ownable by a single team without requiring cross-team changes.
---
## Reason
Features requiring changes from multiple teams create coordination overhead and defeat the purpose of feature-based organization. If two teams must modify a feature, the boundary is wrong.
---
## Bad Example
```php
// Feature "Checkout" requires changes by:
// Team Alpha (payment integration)
// Team Beta (UI/UX)
// Team Gamma (fraud detection)
// Single feature, three teams — constant merge conflicts
```
---
## Good Example
```php
// Split by team-owned capabilities:
// app/Features/PaymentProcessing/ (Team Alpha)
// app/Features/CheckoutUI/ (Team Beta)
// app/Features/FraudDetection/ (Team Gamma)
```
---
## Exceptions
Small teams (under 5 engineers) where a single team owns multiple features.
---
## Consequences Of Violation
Frequent merge conflicts. Blocked deployments waiting for cross-team coordination.
---

## R08: Enforce Feature Boundaries via Architecture Tests
---
## Category
Testing
---
## Rule
Write architecture tests that prevent direct imports between feature directories.
---
## Reason
Without automated enforcement, feature boundaries are conventions that degrade within months. Architecture tests catch cross-feature imports in CI before they become entrenched coupling.
---
## Bad Example
```php
// No architecture tests — cross-feature imports discovered during code review
// Review fatigue leads to missed violations
// 6 months later: 40% of features have cross-feature imports
```
---
## Good Example
```php
// Pest architecture test
test('features do not import from other features')
    ->expect('App\Features')
    ->not->toUse('App\Features')
    ->ignoring('App\Features\Shared');
```
---
## Exceptions
Small projects (<3 features) where manual review is sufficient.
---
## Consequences Of Violation
Feature isolation degrades silently. Cross-feature coupling grows until extraction becomes impossible.
