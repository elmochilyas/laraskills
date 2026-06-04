# Rules: COS-07 — Hybrid Approach

## R01: Apply Domain Subdirectories Consistently Across All Technical Layers
---
## Category
Code Organization
---
## Rule
If Controllers use domain subdirectories, Models and Services must use matching domain subdirectories. Never apply domain grouping to only one layer.
---
## Reason
Partial adoption creates confusion about where new files go — is new billing code in `app/Models/Billing/` or flat in `app/Models/`? Consistency removes ambiguity and makes the structure predictable.
---
## Bad Example
```php
// Inconsistent — Controllers have domain grouping, Models don't
app/Http/Controllers/
├── Billing/InvoiceController.php
├── Catalog/ProductController.php
app/Models/
├── Invoice.php      // flat — why not in Models/Billing/?
├── Product.php      // flat — why not in Models/Catalog/?
```
---
## Good Example
```php
// Consistent across all layers
app/Http/Controllers/
├── Billing/InvoiceController.php
├── Catalog/ProductController.php
app/Models/
├── Billing/Invoice.php
├── Catalog/Product.php
app/Services/
├── Billing/InvoiceService.php
├── Catalog/ProductService.php
```
---
## Exceptions
Truly shared cross-domain code (e.g., `app/Models/User.php`) remains flat — documented as "shared, not domain-specific."
---
## Consequences Of Violation
Developers cannot predict where to place files. Some code in subdirectories, some flat — two inconsistent organizational systems.
---

## R02: Establish a Threshold for Creating Domain Subdirectories
---
## Category
Code Organization
---
## Rule
Define a team rule (e.g., "3+ files related to a business concept") that triggers creation of a domain subdirectory.
---
## Reason
Without a threshold, the decision to create a subdirectory is arbitrary — some developers create them for every entity, others never create them. A documented threshold ensures consistent application.
---
## Bad Example
```php
// No threshold — inconsistent:
// Developer A: app/Models/UserSettings.php (flat)
// Developer B: app/Models/Billing/OneTimeInvoice.php (subdirectory for 1 file)
// Developer C: app/Models/Billing/Subscriptions/ (subdirectory for 2 files)
```
---
## Good Example
```php
// Rule: "3+ files sharing a business concept → create subdirectory"
// app/Models/Billing/ (Invoice.php, Payment.php, Refund.php — 3 files)
// app/Models/UserSettings.php (1 file — stays flat until more)
```
---
## Exceptions
Projects so small that flat structure suffices for all models.
---
## Consequences Of Violation
Inconsistent structure — some domain directories with 1-2 files, others with 20+ flat files creating navigability problems.
---

## R03: Keep Truly Shared Code Flat at the Technical Layer Root
---
## Category
Code Organization
---
## Rule
Leave cross-cutting models and services (e.g., `User`, `AuditLog`, `BaseController`) at the root of their technical layer, not inside any domain subdirectory.
---
## Reason
If `User` is placed inside a domain, that domain becomes a dependency for all others. Keeping shared code flat signals "this belongs to the application, not to any single domain."
---
## Bad Example
```php
// app/Models/Billing/User.php — why billing?
// Every domain needs User — now Billing is a mandatory dependency
```
---
## Good Example
```php
// app/Models/User.php — flat, shared across all domains
// app/Models/Billing/Invoice.php — domain-specific, only used by billing
```
---
## Exceptions
Projects where every entity is clearly owned by one domain (e.g., strict DDD with shared kernel contracts).
---
## Consequences Of Violation
A domain subdirectory becomes an accidental bottleneck. Changing or splitting that domain breaks all other domains.
---

## R04: Use `artisan make:` with Subdirectory Paths
---
## Category
Framework Usage
---
## Rule
Prefix generator commands with the domain subdirectory: `php artisan make:model Billing/Invoice`.
---
## Reason
Laravel generators accept subdirectory paths and automatically create the correct namespace. Using them correctly ensures generated files land in the right place without manual moves.
---
## Bad Example
```bash
$ php artisan make:model Invoice
# Creates app/Models/Invoice.php (flat, no domain grouping)
# Developer manually moves to app/Models/Billing/Invoice.php
# Must also update namespace and all imports manually
```
---
## Good Example
```bash
$ php artisan make:model Billing/Invoice -m
# Creates app/Models/Billing/Invoice.php
# Namespace: App\Models\Billing
# Migration: database/migrations/..._create_invoices_table.php
```
---
## Exceptions
No common exceptions — subdirectory paths always work with Laravel generators.
---
## Consequences Of Violation
Generated files land in wrong directories. Manual moves create namespace-import mismatches and developer frustration.
---

## R05: Document the Hybrid Convention Explicitly
---
## Category
Maintainability
---
## Rule
Write down the hybrid convention — which directories have domain grouping, what the threshold is, and where shared code goes.
---
## Reason
The hybrid approach is a team convention, not a framework feature. Without documentation, new developers have no way to learn the rules except by breaking them and being corrected in code review.
---
## Bad Example
```php
// No documentation — new hire asks:
// "Should I put this in app/Models/ or app/Models/Billing/?"
// Team response: "It depends..." — no written standard
```
---
## Good Example
```markdown
// CONTRIBUTING.md:
// ## File Placement
// - Controllers, Models, Services use domain subdirectories
// - Threshold: 3+ files → create subdirectory
// - Shared code (User, Tenant, AuditLog) stays flat
```
---
## Exceptions
One-person projects where the developer is the documentation.
---
## Consequences Of Violation
Structural inconsistency. Repeated code review corrections. Team frustration with unpredictable file locations.
---

## R06: Use Route Prefix Grouping Without Restructuring Files
---
## Category
Code Organization
---
## Rule
Group routes by domain using `Route::prefix()` inside the route files, keeping the route file structure aligned with domain grouping.
---
## Reason
Route grouping keeps the URL structure organized around domains while the routes file can be partitioned by domain. This is the routing equivalent of domain subdirectories.
---
## Bad Example
```php
// routes/web.php — all routes flat, no domain grouping
Route::get('/invoices', [InvoiceController::class, 'index']);
Route::get('/invoices/create', [InvoiceController::class, 'create']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
```
---
## Good Example
```php
// routes/web.php — domain groups with prefix
Route::prefix('billing')->group(function () {
    Route::get('/invoices', [Billing\InvoiceController::class, 'index']);
    Route::get('/invoices/create', [Billing\InvoiceController::class, 'create']);
});

Route::prefix('catalog')->group(function () {
    Route::get('/products', [Catalog\ProductController::class, 'index']);
    Route::get('/products/{product}', [Catalog\ProductController::class, 'show']);
});
```
---
## Exceptions
Very small projects (under 10 routes) where flat organization is clear.
---
## Consequences Of Violation
Route files become unreadable as 100+ routes mix billing, catalog, and auth concerns.
---

## R07: Use Code Review to Catch Misplaced Files
---
## Category
Reliability
---
## Rule
Add file placement verification to the code review checklist — every new file must be validated against the hybrid convention.
---
## Reason
Directory structure conventions in the hybrid approach are not enforced by tooling or static analysis. Without human review, files drift into wrong directories, and within months the structure is inconsistent.
---
## Bad Example
```php
// Code review checklist — file placement not checked
// 6 months in: 15% of files are in the wrong directory
// Team doesn't notice until a refactoring sprint reveals the mess
```
---
## Good Example
```php
// Code review checklist item:
// [ ] File is in the correct domain subdirectory per convention
// [ ] Shared code is flat, not inside a domain directory
```
---
## Exceptions
Teams with automated architecture tests that can enforce placement rules.
---
## Consequences Of Violation
Silent structural degradation. Files end up in inconsistent locations. Refactoring to full domain structure becomes impossible.
---

## R08: Use Hybrid as an Intermediate Step, Not a Final State
---
## Category
Architecture
---
## Rule
Treat the hybrid approach as a transitional state between default flat structure and full domain-based organization.
---
## Reason
The hybrid approach adds domain grouping but does not enforce domain isolation (no contract boundaries, no separate providers, no PSR-4 changes). As the application grows to 10+ engineers, full domain isolation becomes necessary. Hybrid should be a stepping stone, not a destination.
---
## Bad Example
```php
// Team has been "hybrid" for 3 years
// 50 engineers, 12 "domains" — but no isolation
// Cross-domain imports everywhere
// "We use hybrid" = "we have no organization system"
```
---
## Good Example
```php
// Month 1-12: Default structure
// Month 12-24: Hybrid (domain subdirectories within layers)
// Month 24+: Full domain structure with contracts, providers, enforcement
```
---
## Exceptions
Small teams (<5 engineers) where the hybrid approach is sufficient indefinitely.
---
## Consequences Of Violation
Stagnant architecture that does not scale. Domain boundaries are cosmetic only — no isolation, no ownership, no enforcement.
