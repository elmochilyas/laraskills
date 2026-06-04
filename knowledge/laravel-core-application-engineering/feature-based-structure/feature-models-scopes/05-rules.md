## Namespace Tells Ownership

Every feature-specific model must be namespaced under its feature to make ownership unambiguous.

---

## Category

Code Organization

---

## Rule

Place all feature-owned models in `App\Features\{FeatureName}\Models\{ModelName}`. The namespace declares which feature owns the model. Never place feature-specific models in `App\Models\`.

---

## Reason

The namespace is the authoritative declaration of ownership. `App\Features\Billing\Models\Invoice` explicitly states "the Billing feature owns this model." This prevents ambiguity when multiple features need an Invoice concept and makes boundary violations detectable by static analysis.

---

## Bad Example

```php
// Namespace doesn't indicate ownership
namespace App\Models;

class Invoice extends Model {}
```

---

## Good Example

```php
// Namespace declares Billing ownership
namespace App\Features\Billing\Models;

class Invoice extends Model {}
```

---

## Exceptions

Models shared by 3+ features (e.g., `User`, `Setting`, `AuditLog`) belong in `App\Models\` as genuinely shared models.

---

## Consequences Of Violation

Ambiguous model ownership leads to boundary confusion. Multiple features add relationships to the same model. Static analysis cannot enforce cross-feature import rules.

---

## Keep Shared Models Slim

Only put universally applicable attributes and methods on shared models in `App\Models\`.

---

## Category

Maintainability

---

## Rule

Shared models (e.g., `User`) must only contain attributes and methods that are relevant across the entire application. Feature-specific relationships, scopes, and accessors must live in traits or service classes within the owning feature.

---

## Reason

Shared models accumulate feature-specific code over time, becoming unmaintainable "god models" with 2000+ lines, 30+ relationships, and conflicting accessors. Keeping them slim preserves their role as a universal foundation.

---

## Bad Example

```php
class User extends Authenticatable
{
    // 15 feature-specific relationships
    public function billingInvoices() {}
    public function cmsPosts() {}
    public function forumThreads() {}
    public function analyticsEvents() {}
    // ... 12 more feature-specific methods
}
```

---

## Good Example

```php
class User extends Authenticatable
{
    // Only universal attributes and relationships
    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
// Feature-specific relationships added via traits
```

---

## Exceptions

Truly foundational relationships used by 3+ features (e.g., `User::posts()` for a CMS that is used by a blog, forum, and documentation feature) may live on the shared model.

---

## Consequences Of Violation

God model antipattern. 2000+ line model files. Relationship naming conflicts between features. Reduced testability.

---

## Use Traits For Feature Relationships On Shared Models

Add feature-specific relationships to shared models via traits, not by editing the shared model directly.

---

## Category

Code Organization

---

## Rule

Create a trait in the feature's model directory (e.g., `App\Features\Billing\Models\Relations\UserBillingRelations`) that adds the feature's relationships to the shared model. Apply the trait to the shared model class.

---

## Reason

Traits isolate feature-specific relationship code in the feature that owns it. The shared model documents its feature extensions via use statements. Features can be added or removed by adding or removing trait uses without merge conflicts.

---

## Bad Example

```php
// Directly adding relationship to User model
class User extends Authenticatable
{
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
```

---

## Good Example

```php
// Trait in Billing feature
namespace App\Features\Billing\Models\Relations;

trait UserBillingRelations
{
    public function invoices()
    {
        return $this->hasMany(\App\Features\Billing\Models\Invoice::class);
    }
}

// Applied to User
class User extends Authenticatable
{
    use \App\Features\Billing\Models\Relations\UserBillingRelations;
}
```

---

## Exceptions

When a relationship is genuinely universal (belongs to the domain of the shared model itself, not to any feature), it may be defined directly on the shared model.

---

## Consequences Of Violation

Merge conflicts when two features add relationships to the same model. Feature removal requires editing the shared model. Hidden coupling between features through shared model.

---

## Use Service-Level Queries For Complex Aggregations

Do not expose raw models or query builders across feature boundaries. Encapsulate complex queries in service classes or read models.

---

## Category

Architecture

---

## Rule

When another feature needs aggregated data from a feature's models, provide a service method or read model that returns the result. Never expose the Eloquent query builder or allow direct model access.

---

## Reason

Exposing query builders allows consumers to couple to the internal query structure of the feature. Changing a where clause or join breaks every consumer. Service methods abstract the query behind a stable contract.

---

## Bad Example

```php
// Billing exposes query builder
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

---

## Good Example

```php
class InvoiceService
{
    public function getPaidInvoices(): Collection
    {
        return Invoice::where('status', 'paid')->get();
    }
}
```

---

## Exceptions

Internal feature code that is not exposed across feature boundaries may use query builders freely. The restriction applies only to cross-feature access.

---

## Consequences Of Violation

Consumers couple to query internals. Changing a column name or relationship breaks all consumers. Feature extraction requires rewriting all scattered queries.

---

## Prevent Direct Cross-Feature Model Access

Enforce a coding standard or static analysis rule that forbids importing models from other feature namespaces.

---

## Category

Scalability

---

## Rule

Add a static analysis rule (PHPStan level 6+ or Psalm) that detects `use App\Features\[^\]*\\Models\\` imports in files outside that feature. Treat it as a build failure in CI.

---

## Reason

Manual code review cannot catch every cross-feature model import. An automated rule is the only reliable way to maintain feature encapsulation as the codebase grows and team members change.

---

## Bad Example

```php
// In app/Features/Reporting/Services/ReportService.php
use App\Features\Billing\Models\Invoice;
// No static analysis to catch this violation
```

---

## Good Example

```php
// PHPStan rule in phpstan.neon
parameters:
    excludePaths:
        - 'app/Kernel/*'
    rules:
        - vendor/.../DisallowCrossFeatureModelImport

// CI fails on violation
```

---

## Exceptions

The feature's own files may obviously import its own models. Shared kernel files and the `AppServiceProvider` may reference feature models for binding registration.

---

## Consequences Of Violation

Silent accumulation of cross-feature dependencies. Feature encapsulation erodes over time. Extraction requires untangling hidden model references.

---

## Define Clear Policy For Model Placement

Document whether each model goes in `app/Models/` or `Features/{Feature}/Models/`.

---

## Category

Maintainability

---

## Rule

Establish and document a clear policy: models owned by a single feature go in that feature's `Models/` directory. Models consumed by 3+ features go in `App\Models\`. Models consumed by exactly 2 features go in the shared kernel or the feature with a service interface.

---

## Reason

Without a documented policy, different developers make inconsistent decisions. A model may start in `App\Models\` when it belongs to a feature, or a universally needed model may be buried in a feature directory.

---

## Bad Example

No policy exists. `App\Models\Discount` is created for a Billing-specific concern. Six months later, the CMS feature relies on it. Ownership becomes ambiguous.

---

## Good Example

```
## Model Placement Policy

- Business-domain models: Features/{Feature}/Models/
- Cross-cutting models (3+ consumers): App\Models\
- Two-feature models: Shared kernel DTO + service interface
- Migration ownership follows model placement
```

---

## Exceptions

No exceptions. Every model must have a documented placement rationale.

---

## Consequences Of Violation

Inconsistent model placement. Boundary ambiguity. Difficulty determining ownership when refactoring or extracting features.

---

## Register Feature Model Migrations

Ensure feature model migrations are loaded from the feature's migration directory via the service provider.

---

## Category

Framework Usage

---

## Rule

Place all migrations for feature models in `Features/{Feature}/Database/Migrations/`. Register them in the feature's service provider using `$this->loadMigrationsFrom(__DIR__.'/../Database/Migrations')`.

---

## Reason

Migrations co-located with their feature make the feature self-contained. Disabling a feature means its migrations are no longer loaded. Feature extraction includes all migration files in the feature directory.

---

## Bad Example

```php
// Migration in global database/migrations/
// No connection to the Billing feature
database/migrations/2024_01_01_create_invoices_table.php
```

---

## Good Example

```php
// Migration in feature directory
app/Features/Billing/Database/Migrations/2024_01_01_create_invoices_table.php

// Registered in service provider
public function boot(): void
{
    $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
}
```

---

## Exceptions

Shared models in `App\Models\` should use the global `database/migrations/` directory. Feature-specific migrations that create tables for shared model extensions (e.g., pivot tables) stay in the feature.

---

## Consequences Of Violation

Feature extraction requires hunting down migration files outside the feature directory. Disabling a feature does not stop its migrations from running.

---

## Co-locate Factories With Feature Models

Place Eloquent factories in the feature's database directory with correct model references.

---

## Category

Maintainability

---

## Rule

Store model factories in `Features/{Feature}/Database/Factories/`. Ensure the factory's `$model` property references the fully qualified class name of the feature model.

---

## Reason

Co-located factories keep the feature self-contained. Correct `$model` references ensure factory resolution works with namespaced models. Without explicit `$model` references, Laravel's factory resolution may fail for non-standard namespaces.

---

## Bad Example

```php
// Factory in global directory with default model reference
database/factories/InvoiceFactory.php

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class; // Wrong namespace — resolves to App\Models\Invoice
}
```

---

## Good Example

```php
// Factory in feature directory
namespace Database\Factories\Features\Billing\Models;

class InvoiceFactory extends Factory
{
    protected $model = \App\Features\Billing\Models\Invoice::class;

    public function definition(): array
    {
        return [
            'amount' => 10000,
            'status' => 'pending',
        ];
    }
}
```

---

## Exceptions

Factories for shared models in `App\Models\` should remain in the global `database/factories/` directory.

---

## Consequences Of Violation

Factory resolution resolves to the wrong model class. Tests fail because factories generate incorrect model instances. Feature extraction must relocate and rewire factories.

---

## Use Custom Table Names For Feature Models

Explicitly define table names on feature models to prevent naming collisions.

---

## Category

Framework Usage

---

## Rule

Set an explicit `$table` property on feature models that includes a feature-specific prefix or uses a qualified table name. Do not rely on Laravel's default snake_case plural table naming.

---

## Reason

Two features might have a `Invoice` model. Without explicit table names, both would resolve to `invoices`, causing a migration conflict. Explicit table names (e.g., `billing_invoices`, `cms_invoices`) guarantee uniqueness.

---

## Bad Example

```php
namespace App\Features\Billing\Models;

class Invoice extends Model
{
    // Table auto-resolves to 'invoices'
    // Conflicts if another feature also has an Invoice model
}
```

---

## Good Example

```php
namespace App\Features\Billing\Models;

class Invoice extends Model
{
    protected $table = 'billing_invoices';
}
```

---

## Exceptions

Features that are guaranteed unique model names (e.g., `Billing\Invoice` where no other feature has an `Invoice` model) may use default naming. Document the reasoning.

---

## Consequences Of Violation

Table naming collisions between features. Migration conflicts. Data corruption risk if two features write to the same table.

---

## Use Polymorphic Relationships For Multi-Feature Ownership

When multiple features need to relate to a single model type, use polymorphic relationships.

---

## Category

Architecture

---

## Rule

When a model (e.g., `Comment`, `Attachment`, `Like`) can belong to models in multiple features, implement it as a polymorphic relationship rather than duplicating the model or adding nullable foreign keys.

---

## Reason

Polymorphic relationships allow a single model class to serve multiple features without coupling. Adding a new feature that needs comments requires no schema change — just a new morphable type.

---

## Bad Example

```php
// Comments table has nullable foreign keys for each feature
Schema::create('comments', function (Blueprint $table) {
    $table->foreignId('invoice_id')->nullable();
    $table->foreignId('post_id')->nullable();
    $table->foreignId('ticket_id')->nullable();
});
```

---

## Good Example

```php
Schema::create('comments', function (Blueprint $table) {
    $table->morphs('commentable');
});

// Usage
class Invoice extends Model
{
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

---

## Exceptions

When the relationship is truly owned by a single feature, use a standard foreign key. Polymorphism adds complexity and should be reserved for genuinely multi-feature scenarios.

---

## Consequences Of Violation

Schema cluttered with nullable foreign keys. Adding new consumers requires migration changes. Query complexity increases with OR conditions.
