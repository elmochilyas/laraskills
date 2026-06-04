# Feature Models and Scopes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Models and Scopes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

In feature-based structure, models live inside their feature directory. Each feature owns the models that are specific to its domain. Shared models (User, Setting) live in the top-level `app/Models/` directory. Feature-specific scopes, relationships, and accessors are defined on the model within the feature.

The engineering value is clear ownership: `App\Features\Billing\Models\Invoice` is owned by the Billing feature. No other feature modifies it without going through Billing's service layer. This prevents the "god model" problem where dozens of relationships and scopes accumulate on a single model over years of development.

---

## Core Concepts

### Feature-Specific Models

```php
namespace App\Features\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['user_id', 'amount', 'status', 'due_date'];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'pending')
            ->where('due_date', '<', now());
    }

    public function scopeForUser(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->id);
    }
}
```

### Shared Models

```php
// app/Models/User.php — shared across features
namespace App\Models;

class User extends Authenticatable
{
    // Shared attributes and methods
}
```

### Feature-Specific Relationships on Shared Models

Use dedicated relationship classes or trait-based extensions instead of adding every relationship to the shared model:

```php
// App\Features\Billing\Models\Relations\UserBillingRelations
trait UserBillingRelations
{
    public function invoices()
    {
        return $this->hasMany(App\Features\Billing\Models\Invoice::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(App\Features\Billing\Models\Subscription::class);
    }
}

// Applied in App\Models\User
class User extends Authenticatable
{
    use UserBillingRelations;
}
```

Or use dedicated query builders:

```php
// App\Features\Billing\Builders\UserBillingQuery
class UserBillingQuery
{
    public static function outstandingBalance(User $user): float
    {
        return Invoice::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');
    }
}
```

---

## Mental Models

### The Model as Feature Boundary

A model's namespace tells you which feature owns it. `Billing\Models\Invoice` → Billing feature. `Users\Models\Profile` → Users feature. The namespace is the ownership declaration.

### The Slim Shared Model

The `App\Models\User` stays slim — only universal attributes (name, email, password) and auth-related methods. Feature-specific concerns live in the feature. This prevents User from accumulating 20+ relationships across every feature in the app.

---

## Internal Mechanics

### Table Naming

Feature models use standard Eloquent table naming conventions:

```php
// App\Features\Billing\Models\Invoice → 'invoices' table
// App\Features\Billing\Models\Subscription → 'subscriptions' table
```

Custom table names are explicitly defined:

```php
class Invoice extends Model
{
    protected $table = 'billing_invoices';
}
```

### Migration Location

Migrations for feature-specific models can be loaded from the feature's `Database/Migrations/` directory via the service provider, or kept in `database/migrations/` with feature prefixes:

```
database/migrations/
  2024_01_01_000001_create_billing_invoices_table.php
  2024_01_01_000002_create_billing_subscriptions_table.php
```

### Factory Location

Factories can be co-located in the feature:

```php
// app/Features/Billing/Database/Factories/InvoiceFactory.php
namespace App\Features\Billing\Database\Factories;

class InvoiceFactory extends Factory
{
    protected $model = App\Features\Billing\Models\Invoice::class;
}
```

---

## Patterns

### Feature-Specific Global Scopes

```php
// App\Features\Billing\Models\Scopes\TeamBillingScope
class TeamBillingScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('team_id', auth()->user()?->team_id);
    }
}

// Applied in Invoice model
class Invoice extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TeamBillingScope);
    }
}
```

### View Models / Read Models

For complex queries that span multiple feature models:

```php
// App\Features\Billing\Models\InvoiceSummary
class InvoiceSummary
{
    public function __construct(
        public readonly float $totalOutstanding,
        public readonly float $totalPaid,
        public readonly int $pendingCount,
    ) {}

    public static function forUser(User $user): self
    {
        return new self(
            totalOutstanding: Invoice::forUser($user)->pending()->sum('amount'),
            totalPaid: Invoice::forUser($user)->paid()->sum('amount'),
            pendingCount: Invoice::forUser($user)->pending()->count(),
        );
    }
}
```

### Polymorphic Relationships Across Features

```php
// App\Features\Billing\Models\Invoice
class Invoice extends Model
{
    public function billable(): MorphTo
    {
        return $this->morphTo();
    }
}

// Usage: any feature can attach invoices to its models
$team->invoices()->save(new Invoice([...]));
```

---

## Architectural Decisions

### Feature Model vs Shared Model Placement

| Model | Location | Rationale |
|---|---|---|
| User | `app/Models/` | Every feature needs it |
| Team | `app/Models/` | Shared across most features |
| Invoice | `Features/Billing/Models/` | Billing-specific |
| Post | `Features/CMS/Models/` | CMS-specific |
| AuditLog | `Features/Audit/Models/` | Audit-specific |

If two or more features need the same model, it belongs in `app/Models/`.

### Relationships on Shared Models

| Approach | Pros | Cons |
|---|---|---|
| Trait-based extension | Keeps User slim | Multiple traits can conflict |
| Service-level queries | No model pollution | Verbose |
| Custom relation classes | Clean model | Framework-dependent |
| All in User model | Simple | God model risk |

Prefer trait-based extension for simple `hasMany`/`belongsTo` relationships. Use service-level queries for complex aggregations.

---

## Tradeoffs

| Concern | Feature Models | All Models in app/Models/ |
|---|---|---|
| Ownership clarity | Namespace = owner | All models are "global" |
| Model file size | Small, focused | Large, accumulates |
| Cross-feature access | Via service layer | Direct model access |
| Discoverability | Browse by feature | One large directory |
| Refactoring impact | Feature-scoped | App-wide |

---

## Performance Considerations

Feature models have zero performance overhead compared to global models. Eloquent resolves models by fully qualified class name — the namespace depth has no runtime cost. Autoloader classmaps eliminate filesystem overhead in production.

---

## Production Considerations

- Define a clear policy for what goes in `app/Models/` (shared) vs `Features/*/Models/` (owned)
- Build relationships via traits or service classes rather than dumping them on shared models
- Keep feature models focused — avoid adding scopes and accessors for concerns outside the feature
- Use dedicated query scopes within the feature's Models directory for complex query logic
- Prevent direct cross-feature model access through coding standards or static analysis
- Consider read models for complex queries that span multiple feature models

---

## Common Mistakes

### Cross-Feature Model Access

```php
// Bad — Billing directly accesses Users model private scope
use App\Features\Users\Models\Profile;

$profile = Profile::where('user_id', $user->id)->first();

// Good — Billing calls Users service
$profile = app(UserService::class)->getProfile($user->id);
```

### Feature Model with Global Responsibilities

A `Discount` model in the Billing feature starts being used by the CMS feature for promotional pricing. Either move `Discount` to `app/Models/` or make CMS go through Billing's service layer.

### God Trait on Shared Model

```php
// Bad — 2000-line trait with every feature's relationships
class User extends Authenticatable
{
    use AllFeatureRelations;
}

// Good — specific traits per concern
class User extends Authenticatable
{
    use BillableUser;     // Billing relationships
    use ProfileUser;      // Profile relationships
}
```

---

## Failure Modes

### Missing Feature Model Registration

A feature model's migration is in `Features/Billing/Database/Migrations/` but the service provider doesn't load migrations. The table doesn't exist. Run `php artisan migrate` after registering feature migrations in the provider.

### Circular Model Dependencies

`Invoice` belongs to `User`, `User` has many `Subscription`, `Subscription` references `Invoice`. This is fine as long as models stay within their feature boundaries. Circular dependencies across features (Billing's `Invoice` → Users's `User` → Billing's `Subscription`) is a design smell — consider a shared model.

---

## Ecosystem Usage

Laravel's Eloquent ORM works identically regardless of namespace depth, making feature models fully compatible. Artisan's `make:model` command supports nested paths (`Features/Billing/Models/Invoice`). Route model binding resolves feature models via fully qualified class names. Global scopes, local scopes, and accessors all function normally within feature namespaces.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — overall structure
- **Module Organization** (this workspace) — where models fit in the feature directory
- **Cross-Feature Communication** (this workspace) — how features access each other's models
- **Feature vs Layer** (this workspace) — model placement comparison
- **DTOs** (this workspace) — data transfer objects as alternatives to exposing models
- **Actions Pattern** (this workspace) — encapsulating model operations

---

## Research Notes

- Eloquent models work identically regardless of namespace depth
- `php artisan make:model "Features/Billing/Models/Invoice" -m` generates the model in the correct directory
- Factory namespaces must match the model's namespace
- Laravel's default model directory is `app/Models/` since Laravel 8, but any namespace under `App\` works
- Route model binding works with feature models: `Route::model('invoice', App\Features\Billing\Models\Invoice::class)`
- Global scopes on feature models are scoped to that model only — they don't affect other features' models
- Polymorphic relationships are the cleanest way to allow multiple features to relate to a single model
