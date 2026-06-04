# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Feature Flags |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

In feature-based structure, models live inside their feature directory. Each feature owns the models specific to its domain. Shared models (User, Setting) live in the top-level `app/Models/` directory. The engineering value is clear ownership: `App\Features\Billing\Models\Invoice` is owned by the Billing feature. This prevents the "god model" problem where dozens of relationships and scopes accumulate on a single model.

---

## Core Concepts

- **Feature-specific models**: Namespaced under the feature — `App\Features\Billing\Models\Invoice`
- **Shared models**: Top-level `app/Models/User.php` for models needed across features
- **Trait-based relationship extension**: Feature-specific relationships on shared models via traits
- **Feature-specific global scopes**: Scoped to that model only, don't affect other features
- **View models/read models**: Complex queries spanning multiple feature models encapsulated in dedicated classes

---

## When To Use

- Feature-based structure where models have clear domain ownership
- Applications with distinct bounded contexts that each own specific models
- Preventing the "god model" pattern where User accumulates 20+ relationships

## When NOT To Use

- Models shared by 3+ features (belong in `app/Models/`)
- Simple CRUD apps with <10 models where namespace depth adds unnecessary complexity
- When trait-based extensions cause conflicts between features

---

## Best Practices

- **Namespace tells ownership** — `Billing\Models\Invoice` = Billing feature owns it
- **Keep shared models slim** — `App\Models\User` only has universal attributes (name, email, password)
- **Use traits for feature-specific relationships** on shared models rather than dumping everything on User
- **Use service-level queries** for complex aggregations across features
- **Prevent direct cross-feature model access** through coding standards or static analysis
- **Define clear policy** for what goes in `app/Models/` vs `Features/*/Models/`

---

## Architecture Guidelines

- Feature models use standard Eloquent table naming conventions
- Custom table names defined explicitly: `protected $table = 'billing_invoices'`
- Migrations loaded from `Features/{Feature}/Database/Migrations/` via service provider
- Factories co-located with proper model reference: `protected $model = Invoice::class`
- Route model binding works with feature models via fully qualified class names
- Polymorphic relationships for models that can belong to multiple features

---

## Performance

Feature models have zero performance overhead compared to global models. Eloquent resolves models by fully qualified class name — namespace depth has no runtime cost. Autoloader classmaps eliminate filesystem overhead in production.

---

## Security

Feature models are subject to the same Eloquent security considerations as global models. Mass assignment protection, model-level authorization, and attribute casting all function identically regardless of namespace.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Cross-feature model access | Convenience | Tight coupling, violates boundaries | Go through service layer |
| God trait on shared model | One trait with all feature relationships | 2000-line trait, conflicts | Specific traits per concern |
| Feature model with global responsibilities | Feature model used by other features | Boundary confusion | Move to `app/Models/` or enforce service layer |
| Missing feature model registration | Migration not loaded | Table doesn't exist | Register migrations in provider |
| Circular model dependencies | Models reference across features | Design smell | Consider shared model or restructure |

---

## Anti-Patterns

- **Direct cross-feature model access**: `use App\Features\Users\Models\Profile` from Billing
- **God trait**: `class User { use AllFeatureRelations; }` with every feature's relationships
- **Feature model used globally**: Discount model in Billing used by CMS for promotional pricing
- **Migrations not registered**: Feature model migration exists but provider doesn't load it

---

## Examples

**Feature-specific model:**
```php
namespace App\Features\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['user_id', 'amount', 'status', 'due_date'];

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'pending')->where('due_date', '<', now());
    }
}
```

**Trait-based relationship extension:**
```php
// App\Features\Billing\Models\Relations\UserBillingRelations
trait UserBillingRelations
{
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}

// Applied in App\Models\User
class User extends Authenticatable
{
    use UserBillingRelations;
}
```

**View model for complex queries:**
```php
class InvoiceSummary
{
    public function __construct(
        public readonly float $totalOutstanding,
        public readonly int $pendingCount,
    ) {}

    public static function forUser(User $user): self
    {
        return new self(
            totalOutstanding: Invoice::forUser($user)->pending()->sum('amount'),
            pendingCount: Invoice::forUser($user)->pending()->count(),
        );
    }
}
```

---

## Related Topics

- modular-monolith-basics — Overall structure
- bounded-contexts — Where models fit in the feature directory
- inter-module-communication — How features access each other's models
- technical-vs-domain-grouping — Model placement comparison
- dtos — Data transfer objects as alternatives to exposing models
- action-pattern — Encapsulating model operations

---

## AI Agent Notes

- `php artisan make:model "Features/Billing/Models/Invoice" -m` generates model in correct directory
- Factory namespaces must match the model's namespace
- Laravel's default model directory is `app/Models/` since Laravel 8
- Global scopes on feature models are scoped to that model only
- Polymorphic relationships are the cleanest way for multiple features to relate to a single model

---

## Verification

- [ ] Feature models in correct namespace under feature directory
- [ ] Shared models in `app/Models/`
- [ ] No direct cross-feature model imports (enforced by static analysis)
- [ ] Feature-specific relationships use traits, not dumped on shared models
- [ ] Migrations loaded from feature directories
- [ ] Factory namespaces match model namespaces
- [ ] Route model binding works with feature models
- [ ] No circular model dependencies across features
