# Model Conventions

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Model Conventions
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Laravel's Eloquent ORM uses convention-over-configuration to derive table names, foreign keys, and pivot table names from model class names. Understanding these conventions is essential for avoiding silent misalignment between your models and your database schema. When conventions don't fit (legacy databases, non-English schemas, team standards), explicit configuration overrides are available.

---

## Core Concepts

1. **Table Naming Convention** — The default table name is the snake_case, pluralised version of the class name (e.g., `User` → `users`, `FlightTicket` → `flight_tickets`). Pluralisation uses Symfony's `Str::plural()`.
2. **Foreign Key Convention** — By default, Eloquent derives foreign key names as the snake_case of the model name suffixed with `_id` (e.g., `User` → `user_id`, `BlogPost` → `blog_post_id`).
3. **Pivot Table Naming Convention** — For many-to-many relationships, the default pivot table name is the singular model names in alphabetical order separated by `_` (e.g., `User` + `Role` → `role_user`, not `user_role`).
4. **Directory Organisation** — Models live in `app/Models` by convention (Laravel 8+), though the `app/` root was used in earlier versions. The namespace must match the directory.
5. **Model File Naming** — Each model class is typically in its own file named after the class (e.g., `User.php`). Laravel does not enforce this, but autoloading (PSR-4) does.
6. **Convention vs. Explicit Configuration** — Every convention can be overridden: `$table`, `$foreignKey` on relationship definitions, pivot table name in `belongsToMany` calls.

---

## Mental Models

### Convention as Default Configuration
Think of Laravel conventions as automatically populated configuration values. If you inspect the base `Model` class internals, you'll see that `getTable()` calls `Str::snake(Str::pluralStudly(class_basename($this)))`. The convention *is* the default implementation — override it when needed.

### The Alphabetical Pivot Rule
Pivot table naming follows alphabetical order. This is a deterministic rule: given any two model names, the pivot table name is always `Str::snake(Str::singular($a)) . '_' . Str::snake(Str::singular($b))` with `$a < $b` lexicographically. Remember `alpha_first_alpha_last`.

---

## Internal Mechanics

### Table Resolution
`Model::getTable()` checks `$this->table` first; if null, it computes:
```php
Str::snake(Str::pluralStudly(class_basename($this)));
```
This is called once and cached on the first query.

### Foreign Key Resolution
`Model::getForeignKey()` returns `Str::snake(class_basename($this)) . '_id'`. Used by `hasMany`, `belongsTo`, `hasOne` when no explicit key is provided.

### Pivot Table Resolution
`BelongsToMany` calls `Model::joiningTable($related, $instance)`, which sorts the two singular table names alphabetically and joins them with `_`.

---

## Patterns

### Explicit Override at Definition
Always define `$table` and relationship foreign keys explicitly in critical models (e.g., financial, legacy) to avoid subtle breaks from class renames:

```php
class Subscription extends Model
{
    protected $table = 'subscriptions';
    
    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }
}
```

### Singular Table Names
For models backed by singular-named tables (common in some domains):
```php
class Sheep extends Model
{
    // Would default to 'sheep' (no pluralisation change), but for explicit clarity:
    protected $table = 'sheep';
}
```

---

## Architectural Decisions

### Decision: Rely on Convention vs. Always Be Explicit
- **Convention-only** is faster to write and works for 80% of standard CRUD apps. Renaming a model class automatically updates the resolved table name.
- **Always explicit** (`$table`, explicit foreign keys) eliminates ambiguity and survives class renames. Recommended for large teams, legacy databases, or projects with strict DBA oversight.
- **Tradeoff:** Conventions are brittle under refactoring; explicit overrides are verbose.

### Decision: `app/Models` vs. Flat `app/` Models
- Laravel 8+ scaffolds controllers, factories, and policies under `app/Models/` by default.
- Keeping models flat under `app/` is viable for tiny projects but leads to namespace clutter as the project grows.
- Laravel's `model:show` command and IDE helpers support both layouts.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Convention = less boilerplate for CRUD | Class rename silently changes table name | Always override `$table` for models that might be renamed |
| Alphabetical pivot rule is deterministic | Non-obvious — developers expect `user_role` not `role_user` | Document pivot conventions in team style guide |
| `app/Models` namespace is standard | Legacy projects may still use `app/` | Configure `composer.json` autoload to support both |

---

## Performance Considerations

- `getTable()` result is cached per-instance after first call. Creating many short-lived model instances incurs repeated pluralisation calls. For bulk operations, store the table name in a class constant or override `$table`.
- Pivot table name resolution happens only when defining the relationship, so the performance impact is negligible.

---

## Production Considerations

- **Never rename a model without verifying table resolution.** A class rename from `BlogPost` to `Article` changes `getTable()` from `blog_posts` to `articles`. Unless `$table` is explicitly set, this is a silent schema change that causes `Table not found` exceptions.
- In multi-database environments, ensure that `$table` references include the correct database prefix if using cross-database joins: `$table = 'analytics.visits'`.
- When using model traits that assume a table naming convention, ensure the trait's assumptions match the host model's override. For example, `HasRoles` from Spatie assumes a `roles` table.

---

## Common Mistakes

**Mistake: Assuming pivot table is `model1_model2` in non-alphabetical order.**
Why it happens: Developers think the order of `belongsToMany` arguments determines pivot order.
Why it's harmful: Missing table exceptions at runtime because the table is named `role_user`, not `user_role`.
Better approach: Always run `php artisan model:show User` to verify pivot table names, or pass the table name explicitly: `->belongsToMany(Role::class)->using('role_user')`.

**Mistake: Placing models in subdirectories without updating the namespace.**
Why it happens: Moving `User.php` into `app/Models/Auth/` without updating the `namespace` declaration.
Why it's harmful: Autoloading fails silently (localhost shows blank page, production returns 500).
Better approach: Use IDE refactoring tools or `php artisan make:model Auth/User` which sets the correct namespace automatically.

**Mistake: Forgetting that `$table` overrides are not inherited by related models.**
Why it happens: A custom base class sets `$table = 'base_table'`, and subclasses inherit it unintentionally.
Why it's harmful: All child models resolve to the same table.
Better approach: Use `getTable()` override instead of `$table` property, or set `$table` on every child explicitly.

---

## Failure Modes

1. **Silent Table Resolution Change** — Renaming a model class without a `$table` override causes it to query a different table. Mitigation: Set `$table` explicitly on all models in CI-enforced check.
2. **Wrong Foreign Key Resolution** — Adding a relationship without an explicit foreign key may pick up the wrong column if the class name is ambiguous (e.g., `Like` → `like_id` instead of `likable_id` for polymorphic). Mitigation: Always pass explicit foreign keys in polymorphic relationships.
3. **Namespace Mismatch** — Moving files without updating PSR-4 autoloading or namespace declarations leads to class-not-found errors. Mitigation: Use `composer dump-autoload` after moves and verify with `php artisan model:show`.

---

## Ecosystem Usage

- **Laravel Breeze / Jetstream** — Follows `app/Models/User` convention; uses `team_user` as pivot for membership.
- **Spatie Laravel Permission** — Uses `model_has_roles` and `model_has_permissions` as custom pivot tables (not the default alphabetical convention), relying on `belongsToMany` with explicit table names.
- **Laravel Nova** — Resolves resource tables via the model's `getTable()`. If the convention is overridden, Nova resources automatically pick up the correct table.

---

## Related Knowledge Units
### Prerequisites
- **Base Model Class** — Understanding how `Model` resolves table and foreign key defaults

### Related Topics
- **Model Directory Structure** — Organisational patterns for model files in `app/Models`
- **Model Configuration Properties** — `$table` as an explicit override
- **Migration Conventions** — Schema builder conventions for table and column naming

### Advanced Follow-up Topics
- **Multi-Tenant Table Routing** — Dynamic `getTable()` overrides per tenant
- **Legacy Database Integration** — Mapping Eloquent conventions to non-standard schemas

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Model::getTable()` (line ~1610 in Laravel 11) implements the default resolution. The `Str::pluralStudly` call uses the Symfony Inflector, which has known edge cases for irregular plurals (e.g., `series` → `series`, `person` → `people`). The `getForeignKey()` method (line ~1640) is a simple snake-case conversion without pluralisation.

### Key Insight
The alphabetical pivot table rule was chosen to eliminate ambiguity — given two models `A` and `B`, there is exactly one deterministic pivot table name. This prevents the scenario where `$user->roles()` and `$role->users()` disagree on the intermediate table.

### Version-Specific Notes
- Laravel 7 and earlier: Models defaulted to `app/` directory. The `app/Models` convention became default with Laravel 8's `make:model` command.
- Laravel 9+: `model:show` command can display the resolved table name and foreign keys for any model, useful for auditing conventions.
- Laravel 11+: Slimmed skeleton uses `app/Models/` by default; `make:model` creates the directory if it doesn't exist.
