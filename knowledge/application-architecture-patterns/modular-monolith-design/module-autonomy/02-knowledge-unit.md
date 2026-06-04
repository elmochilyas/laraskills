# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module autonomy: routes, migrations, config, tests per module
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Module autonomy means each module owns its routes, migrations, config, and tests. A module's routes are defined in the module's route directory, not in the central `routes/web.php`. Its migrations are in the module's `database/migrations/` directory, not the central `database/migrations/`. This colocation ensures the module is self-contained and extraction-ready: moving the module to a separate service requires no route or migration splitting.

---

# Core Concepts

**Route autonomy:** Module routes are defined in the module directory and loaded by the module's service provider:
```php
// ModuleServiceProvider::boot()
Route::prefix('api/billing')
    ->middleware('api')
    ->group(__DIR__.'/../routes/api.php');
```

**Migration autonomy:** Module migrations are run from the module's migration directory:
```php
// ModuleServiceProvider::boot()
$this->loadMigrationsFrom(__DIR__.'/../database/migrations');
```

**Config autonomy:** Module configuration is published or merged from the module:
```php
// ModuleServiceProvider::boot()
$this->mergeConfigFrom(__DIR__.'/../config/billing.php', 'billing');
```

**Test autonomy:** Module tests live in the module directory and can be run independently.

---

# Mental Models

**The "Self-Contained Unit" model:** A module should be a complete unit that can be "unplugged" from the main application. All its configuration travels with it.

**The "Extraction-Ready" model:** If you ever need to extract this module to a microservice, you should be able to copy the module directory, add a `composer.json`, and deploy it. No code splitting required.

**The "Namespace as Application" model:** The module behaves like a mini-application within the main application. It has its own bootstrap (provider), routes, data (migrations), and tests.

---

# Internal Mechanics

Module service provider loads module-specific resources:
```php
class BillingServiceProvider extends ServiceProvider {
    public function boot(): void {
        // Routes
        $this->loadRoutesFrom(__DIR__.'/../routes/api.php');

        // Migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Translations
        $this->loadTranslationsFrom(__DIR__.'/../lang', 'billing');

        // Views
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'billing');

        // Config
        $this->mergeConfigFrom(__DIR__.'/../config/billing.php', 'billing');

        // Publishing for customization
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/billing.php' => config_path('billing.php'),
            ], 'billing-config');
        }
    }
}
```

---

# Patterns

**Migration prefixing:** Module migrations can use a prefix to avoid collision:
```
2024_01_01_000001_create_billing_invoices_table.php
```
This makes migrations identifiable by module even when consolidated.

**Config namespacing:** Module config is namespaced to avoid collision:
```php
// Access: config('billing.invoice_prefix')
return [
    'invoice_prefix' => 'INV-',
    'payment_methods' => ['stripe', 'paypal'],
];
```

**Independent test suites:** Module tests can run independently:
```bash
php artisan modules:test Billing
# or
./vendor/bin/phpunit modules/Billing/tests
```

---

# Architectural Decisions

**Always load routes from module—never from central routes file:** Central routes file should only contain application-wide routes or be empty. Module routes belong in the module.

**Always load migrations from module—never from central migrations directory:** Central migrations directory is for application-level schema. Module migrations stay with the module.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Module is self-contained and extractable | Migration ordering across modules | Module A migrates before B requires dependency-aware runner |
| Routes are colocated with business logic | Route prefix coordination across modules | Route `/api/billing` and `/api/catalog` must not conflict |
| Config is packaged with module | Config namespace collision risk | Two modules using `config('prefix')` without module prefix |

---

# Performance Considerations

Loading migrations from multiple directories is slightly slower than from one directory. Laravel scans each migration directory. With 10+ modules, this adds ~10-20ms to the `migrate` command. Route loading from multiple files is negligible.

---

# Production Considerations

Module autonomy requires that migrations run correctly across modules. Define a migration order strategy: alphabetical, dependency-based, or priority-based. Most teams use alphabetical (date-prefixed) with explicit dependencies in `module.json`.

---

# Common Mistakes

**Routes in central file:** Adding module routes to `routes/api.php` instead of the module's route file. This breaks extraction readiness.

**Shared migrations directory:** Creating all migrations in `database/migrations/` even for module-specific tables. When extracted, the migration doesn't move with the module.

**Config in central config directory:** Module config lives in `config/billing.php` at application level. This is acceptable for published config but the source should be in the module.

---

# Failure Modes

**Duplicate migration names:** Two modules create migrations with the same date prefix (e.g., both create `2024_01_01_000001_create_settings_table.php`). Laravel uses migration batch IDs—duplicate names can cause confusion but not failure.

**Orphan migrations:** A module is disabled but its migrations remain in the database. Disable module's service provider, but migrations are already applied.

---

# Ecosystem Usage

The `nwidart/laravel-modules` package provides `loadMigrationsFrom()`, `loadRoutesFrom()`, and `mergeConfigFrom()` as standard. Modulate follows the same pattern.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-03 Module internal structure | MMD-04 Module registration | MMD-13 Database schema ownership |
| MMD-01 Module vs microservice | MMD-08 Shared kernel | MMD-16 Testing strategies |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
