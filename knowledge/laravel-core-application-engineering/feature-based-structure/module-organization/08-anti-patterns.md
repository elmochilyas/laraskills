# Anti-Patterns: Bounded Contexts

## 1. Deep Nesting Beyond 3 Levels

Organizing files 4+ levels deep within a feature, such as `Features/Billing/Services/Payment/Processors/StripeProcessor.php`.

Deep nesting makes files hard to find, creates long import paths like `App\Features\Billing\Services\Payment\Processors\StripeProcessor`, and increases cognitive load. It often indicates that a sub-feature should be extracted. Limit directory nesting to 3 levels from the feature root. Flatten or extract sub-features when nesting exceeds 3 levels.

## 2. Every Feature Having Every Subdirectory

Scaffolding `Events/`, `Listeners/`, `Jobs/`, `Notifications/` in every feature regardless of whether they contain files.

Empty directories create noise and imply expectations the feature does not fulfill. They communicate "we expected to have events here" rather than the truth: "this feature has no events." Add `Controllers/`, `Models/`, `Services/`, `Requests/` only when the feature has at least one file of that type. Create directories on demand.

## 3. Inconsistent Subdirectory Casing

Using `Controllers/` in one feature, `controllers/` in another, and `http/` in a third.

Consistent directory structure makes every feature predictable. A developer who knows the Billing feature knows the Users feature. Case-sensitivity issues on Linux cause autoloading failures. All features must use identical subdirectory names with consistent casing. Enforce with CI to prevent drift.

## 4. All Files at Feature Root

Placing 40 files directly in the feature root directory with no subdirectory organization.

Files at the feature root have no categorization. A feature with 40 files at the root is as disorganized as a layer-based structure. Controllers go in `Controllers/`, models in `Models/`, services in `Services/`. The only file allowed at the feature root is `routes.php`. Subdirectories provide predictable file placement and make the feature navigable.

## 5. No Feature Scaffold Command

Creating every new feature manually by creating directories and files by hand, leading to inconsistent structures.

Manual feature creation is error-prone. Developers may forget the service provider, use wrong directory casing, or omit required files. Create an Artisan command (`php artisan make:feature {name}`) that scaffolds a feature with the approved directory structure, a service provider template, and a stub route file. Use it for every new feature.

## 6. Migrations in Global Directory

Storing feature-specific migrations in the global `database/migrations/` directory instead of the feature's `Database/Migrations/`.

Co-located migrations keep the feature self-contained. Disabling a feature (removing its provider) stops its migrations from loading. Feature extraction includes all migration files automatically. Place all migrations that create or modify feature-specific tables in `Features/{Feature}/Database/Migrations/` and load them via `$this->loadMigrationsFrom()`.

## 7. Route Closures in Feature Files

Using `Route::get('/path', function () { ... })` in feature route files, which breaks route caching.

PHP route closures cannot be serialized. When `php artisan route:cache` runs, it skips routes with closures, preventing them from being cached. Always use controller classes or invokable single-action controllers in feature route files. Route closures are forbidden in feature-based projects.
