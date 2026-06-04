# Anti-Patterns: Feature Flags

## 1. Direct Cross-Feature Model Access

Importing `use App\Features\Billing\Models\Invoice` from another feature instead of going through a service interface.

Direct model access creates tight coupling that prevents independent refactoring of features. Feature B cannot change its model structure without breaking Feature A. All cross-feature data access must go through a service interface or event. Enforce this with static analysis rules that detect and reject cross-feature model imports.

## 2. The God Model on Shared Models

Adding all feature-specific relationships directly to `App\Models\User`, creating a 2000-line model with 30+ relationships and conflicting accessors.

Shared models accumulate feature-specific code over time, becoming unmaintainable "god models." Use traits for feature-specific relationships on shared models rather than dumping everything on the shared model. Create a trait in the feature's model directory (e.g., `App\Features\Billing\Models\Relations\UserBillingRelations`) that adds the feature's relationships. Apply the trait to the shared model with a simple `use` statement.

## 3. No Custom Table Names on Feature Models

Relying on Laravel's default snake_case plural table naming for feature models, risking naming collisions.

Two features might have an `Invoice` model. Without explicit table names, both would resolve to `invoices`, causing a migration conflict. Set an explicit `$table` property on feature models that includes a feature-specific prefix (e.g., `billing_invoices`, `cms_invoices`) to guarantee uniqueness.

## 4. Migrations Not Registered in Feature Provider

Creating feature model migrations in the feature's `Database/Migrations/` directory but forgetting to load them via `$this->loadMigrationsFrom()` in the service provider.

The migration exists but is never executed — the feature's table doesn't exist in the database. Always register feature migrations in the service provider's `boot()` method. Verify with `php artisan migrate:status` that feature migrations are detected and applied.

## 5. Exposing Query Builders Across Features

Returning `Invoice::query()` from a service method, allowing consumers to couple to the internal query structure.

```php
class InvoiceService
{
    public function query(): Builder
    {
        return Invoice::query();
    }
}
// Consumer couples to query structure
$paidInvoices = $billing->query()->where('status', 'paid')->get();
```

Consumers couple to query internals. Changing a where clause or join breaks every consumer. Always return concrete results (collections, DTOs, scalars) from cross-feature service methods, not query builders.

## 6. No Model Placement Policy

No documented policy for whether a model goes in `app/Models/` or `Features/{Feature}/Models/`, leading to inconsistent placement.

Without a documented policy, different developers make inconsistent decisions. A model may start in `App\Models\` when it belongs to a feature, or a universally needed model may be buried in a feature directory. Establish and document a clear policy: models owned by a single feature go in that feature's directory. Models consumed by 3+ features go in `App\Models\`.

## 7. Factory $model Points to Wrong Namespace

Factory `$model` property references `App\Models\Invoice` instead of `App\Features\Billing\Models\Invoice`, causing factory resolution to create instances of the wrong class.

Factory resolution uses the `$model` property to determine which class to instantiate. If it references the wrong namespace, tests generate incorrect model instances. Always set the factory's `$model` property to the fully qualified class name of the feature model.
