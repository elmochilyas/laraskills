# Rules: COS-01 — Default Laravel Directory Structure

## R01: Use Default Structure for Projects Under 5 Engineers
---
## Category
Code Organization
---
## Rule
Prefer Laravel's default directory structure for teams of 3-5 engineers.
---
## Reason
The default structure is self-documenting for any Laravel developer. Custom structures add learning overhead and tooling friction without proportional benefit at small team sizes.
---
## Bad Example
```php
// Creating a full Domain-Driven Design structure on day one for a 2-person startup
// Result: 4 sprints spent restructuring instead of shipping features
```
---
## Good Example
```php
// Starting with the default `app/`, `routes/`, `resources/` directories
// Adding `app/Services/` only when a controller exceeds 200 lines
```
---
## Exceptions
Teams that already have established organizational conventions (e.g., enterprise standards) may override.
---
## Consequences Of Violation
Developers waste time on architectural ceremony instead of delivering features. New hires must learn custom structure before being productive.
---

## R02: Keep `app/` Directory Nesting at 4 Levels Max
---
## Category
Maintainability
---
## Rule
Limit directory nesting under `app/` to a maximum of 4-5 levels.
---
## Reason
Deep nesting slows IDE navigation, creates excessively long fully qualified class names (FQCNs), and reduces visual scanability in file trees.
---
## Bad Example
```php
// File: app/Domains/Billing/Subscriptions/Plans/Http/Controllers/Admin/PlanController.php
// 7 levels deep — FQCN: App\Domains\Billing\Subscriptions\Plans\Http\Controllers\Admin\Plan
```
---
## Good Example
```php
// File: app/Domains/Billing/Http/Controllers/PlanController.php
// 4 levels deep — FQCN: App\Domains\Billing\Http\Controllers\Plan
```
---
## Exceptions
Generated or vendor files that follow their own conventions.
---
## Consequences Of Violation
Reduced developer navigation speed. Potential Windows MAX_PATH issues at 260+ characters.
---

## R03: Align Custom Directories with `artisan make:` Conventions
---
## Category
Framework Usage
---
## Rule
Keep custom additions compatible with Laravel's generator commands.
---
## Reason
`php artisan make:model`, `make:controller`, etc. place files in expected locations. Breaking this convention causes generated files to land in wrong directories, creating confusion and "class not found" errors.
---
## Bad Example
```php
// Creating app/Http/Requests/ but storing Form Requests in app/Validators/
// Now `php artisan make:request` puts files in app/Http/Requests/ while team expects app/Validators/
```
---
## Good Example
```php
// Use app/Http/Requests/ as Laravel expects
// Or override `stubs` paths in ide-helper or custom generators if relocating
```
---
## Exceptions
Projects that override generator stubs and document the new locations explicitly.
---
## Consequences Of Violation
Generated files land in unexpected locations. Developers waste time moving files after generation.
---

## R04: Document All Custom Directory Additions
---
## Category
Maintainability
---
## Rule
Document every non-default directory added to the project in the README or ARCHITECTURE.md.
---
## Reason
The default structure is self-documenting — every Laravel developer recognizes `app/Models/`. Custom extensions like `app/Services/` or `app/Domains/` are not obvious to new team members and cause placement confusion.
---
## Bad Example
```php
// Adding app/Domains/, app/Support/, app/Integrations/ without any documentation
// New developer: "Where do I put the Stripe webhook handler?"
```
---
## Good Example
```php
// ARCHITECTURE.md:
// ## Custom Directories
// - `app/Integrations/` — Third-party API client classes
// - `app/Domains/` — Business domain modules (see DDD convention doc)
```
---
## Exceptions
Directories created by `artisan make:` commands that follow standard conventions.
---
## Consequences Of Violation
New developers place files in wrong directories. Structural drift as no single source of truth exists.
---

## R05: Never Expose `vendor/` or `storage/` via Web Server
---
## Category
Security
---
## Rule
Never configure the web server to serve files from `vendor/` or `storage/` directories.
---
## Reason
`vendor/` contains third-party packages with potential vulnerability exposure. `storage/` contains logs, compiled templates, and session files — direct access leaks sensitive information.
---
## Bad Example
```nginx
# nginx misconfiguration serving storage/ directly
location /storage/ {
    root /var/www/project/storage/app/public;
}
```
---
## Good Example
```nginx
# Only public/ is the document root
root /var/www/project/public;

# Storage files served via Laravel's public disk symlink
location /storage {
    alias /var/www/project/storage/app/public;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Sensitive data exposure. Application compromise via vendor package file access.
---

## R06: Use Subdirectories Within Default Directories
---
## Category
Code Organization
---
## Rule
Use subdirectories within default Laravel directories (e.g., `app/Http/Controllers/Api/`) to prevent flat-file dumping grounds.
---
## Reason
Without subdirectory grouping, directories like `app/Http/Controllers/` accumulate 50+ files, making navigation slow and illogical. Subdirectories preserve discoverability.
---
## Bad Example
```php
// app/Http/Controllers/ with 40 flat controller files:
// UserController.php, ProductController.php, InvoiceController.php,
// ApiUserController.php, ApiProductController.php, AdminUserController.php
```
---
## Good Example
```php
// app/Http/Controllers/
// ├── Api/UserController.php
// ├── Api/ProductController.php
// ├── Web/UserController.php
// ├── Web/ProductController.php
// └── Admin/UserController.php
```
---
## Exceptions
Very small projects (<10 controllers) may keep flat structure temporarily.
---
## Consequences Of Violation
Unmaintainable flat-file directories. Developers waste time scanning alphabetical file lists for the right class.
---

## R07: Run `composer dump-autoload -o` in Production Deployments
---
## Category
Performance
---
## Rule
Always use `composer dump-autoload -o` (optimized) in production deployments.
---
## Reason
Development-mode PSR-4 autoloading scans the filesystem on every class load. Optimized class maps provide O(1) lookup — the class map is a static array mapping FQCN → file path.
---
## Bad Example
```yaml
# deployment.yaml — missing optimized autoload
deploy:
  script:
    - composer install
    - php artisan optimize
```
---
## Good Example
```yaml
deploy:
  script:
    - composer install --optimize-autoloader
    # or: composer dump-autoload -o
    - php artisan optimize
```
---
## Exceptions
Local development environments where files change frequently and class map caching slows iteration.
---
## Consequences Of Violation
10-50ms additional autoloading overhead per request. Slower response times under load.
---

## R08: Start With Defaults, Evolve With Demonstrated Pain
---
## Category
Architecture
---
## Rule
Always start with Laravel's default directory structure. Only deviate when concrete, measurable friction emerges.
---
## Reason
Preemptive architecture (building elaborate structures for "future needs") wastes effort on abstractions that may never be needed. Defaults are designed for productivity — they work well for most projects.
---
## Bad Example
```php
// Day 1 project: app/Domains/Billing/Contracts/, app/Domains/Billing/Repositories/
// 6 months later: app/Domains/Billing/ contains 1 controller and 1 model
// 80% of the structure was never used
```
---
## Good Example
```php
// Start: app/Http/Controllers/, app/Models/
// Month 9: app/Services/ added when controllers hit 200+ lines
// Month 18: app/Domains/ extracted when 3+ clear business contexts emerged
```
---
## Exceptions
Projects that are explicitly architected as modular monoliths or domain-driven from inception, with team consensus.
---
## Consequences Of Violation
Wasted development time on unused directory structures. Team cynicism toward architectural decisions.
---

## R09: Preserve `routes/` → `Controllers` Entry Point Pattern
---
## Category
Architecture
---
## Rule
Keep the `routes/` → `Controllers` entry point flow even when adopting custom directory structures.
---
## Reason
Laravel's request lifecycle expects routes to dispatch to controller methods. Bypassing this pattern (e.g., calling services directly from routes) breaks middleware, authorization, and framework conventions.
---
## Bad Example
```php
// routes/web.php — routes calling services directly
Route::get('/invoices', fn() => app(InvoiceService::class)->listAll());
// No middleware, no authorization, no request validation applied
```
---
## Good Example
```php
// routes/web.php — routes dispatch to controllers
Route::get('/invoices', [InvoiceController::class, 'index'])->middleware('auth');

// Controller handles HTTP concerns, delegates to service
class InvoiceController {
    public function index(InvoiceService $service) { ... }
}
```
---
## Exceptions
Route-less applications (e.g., queue workers, console-only commands).
---
## Consequences Of Violation
Bypassed middleware and authorization checks. Inconsistent request handling patterns.
