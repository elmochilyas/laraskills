# Factory Definition

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel's model factories provide a structured way to generate fake model instances for testing and seeding. Each factory class defines a `definition()` method that returns an array of attribute values, then exposes `make()`, `create()`, and `raw()` builders. The `HasFactory` trait on the model links the model to its factory. Factories are the foundational building block for all test data generation in Laravel.

## Core Concepts
- **Factory class convention:** Factories extend `Illuminate\Database\Eloquent\Factories\Factory` and are stored in `database/factories/`. The factory name resolves to the model class by convention (e.g., `UserFactory` â†’ `User`).
- **HasFactory trait:** Added to models to expose `Model::factory()` â€” returns a `Factory` instance pre-bound to that model.
- **definition() method:** Returns a plain PHP array mapping column names to fake values. Invoked once per generated model instance. The values can be static or use Faker/sequence/state closures.
- **make vs create vs raw:** `make()` instantiates the model in memory (no DB write), `create()` persists to the database, `raw()` returns the attribute array without creating a model instance.
- **Model resolution:** `$model` property on the factory class determines which model class to instantiate. If not set, Laravel guesses based on the factory name.

## Mental Models
- **Factory as a blueprint:** Think of a factory like a set of blueprints for constructing test data. Each call to `definition()` is a fresh blueprint copy. States modify the blueprint before construction.
- **Builder pipeline:** `factory()` returns a builder that chains configuration (states, relations, counts) before terminal methods (`create`, `make`, `raw`). The pipeline assembles attributes, applies states, hooks, then constructs.
- **Three output forms:** `raw` (plain array â€” no model), `make` (in-memory model â€” no persistence), `create` (persisted model). Choose based on whether the test needs database interaction.

## Internal Mechanics

> **Reference:** 
- `definition()` is called inside `make()` after states have been applied. The resulting array is passed to `callAfterMaking()` hooks, then to `newModelInstance([...])->forceFill([...])`.
- `forceFill()` bypasses mass-assignment protection â€” factories are exempt from `$fillable`/`$guarded` checks by design.
- `HasFactory::factory()` resolves the factory class via `Factory::factoryForModel(get_called_class())`, which checks the `$factory` property or convention-based class name lookup.
- `create()` wraps `make()` with `save()` and invokes `callAfterCreating()` hooks. For multiple records, it wraps everything in a database transaction.

## Patterns
### Explicit Factory Declaration
```php
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
        ];
    }
}
```

### Inline Factory for Simple Models
For models with minimal attributes, keep the factory lean. Avoid over-abstracting shared defaults into helper methods.

### Raw for Seeding Logic
```php
$data = User::factory()->raw();
// Manipulate data before manual insertion
```

## Architectural Decisions
### Decision: Convention vs. Explicit `$model` Property
- **Convention:** Laravel resolves `UserFactory` â†’ `User` automatically. Works for 90% of cases. Less boilerplate.
- **Explicit:** Set `$model = User::class` for clarity or when the factory name doesn't match the model name. Required when using namespace-prefixed factories.
- **Tradeoff:** Convention is cleaner but breaks silently if naming differs. Explicit is safer but adds boilerplate.

### Decision: `HasFactory` Trait on Model vs. Custom Factory Resolution
- **Trait approach:** Standard, clean, ties factory to model at the class level. Recommended.
- **Custom resolution:** Implement `newFactory()` on the model. Useful when the factory needs configuration beyond defaults.
- **Tradeoff:** Trait is simpler; custom resolution gives control at the cost of indirection.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| `forceFill` in factories bypasses mass-assignment | Factory data may include guarded attributes that production code cannot set | Test data may pass while real requests fail â€” test with guarded attributes separately |
| Convention-based resolution is zero-config | Wrong model class loaded silently if naming doesn't match | Pin `$model` explicitly in custom-named factories |
| `make()` enables fast tests without DB | State applied in memory may differ from persisted behaviour | Always run a subset of tests with `create()` to verify persistence paths |
| `definition()` is plain PHP â€” no magic | No lazy loading or relationship resolver in definition context | Use `afterCreating` if you need persisted relations |

## Performance Considerations
- `create()` issues one INSERT per model unless wrapped in a transaction. For mass creation, the factory's internal transaction batching mitigates this.
- `make()` has negligible overhead â€” just attribute array generation and model instantiation. Prefer `make()` when the DB is not required.
- Faker calls are the primary CPU cost in `definition()`. Cache expensive generated values with `once()` helper if the same value is referenced across attributes.
- The `unique()` modifier on Faker maintains an internal set of used values. Reset between test methods to avoid unexpected failures.

## Production Considerations
- Factories should never be used in production code paths. Guard against accidental seeding by wrapping seeder calls in `App::environment()` checks.
- Factory definitions should match the production schema. When migrations change, update factories immediately to keep test data relevant.
- Do not put sensitive-looking fake data (real email patterns, real names) in factories that might be mistaken for real user data in development databases.
- Use `config()` or `env()` in factory definitions sparingly â€” factories should be deterministic for a given Faker seed.

## Common Mistakes
**Mistake: Putting business logic inside `definition()`.**
Why it happens: It's convenient to compute derived values inline.
Why it's harmful: Factories become coupled to domain rules, breaking when those rules change.
Better approach: Keep `definition()` to raw attribute stubs. Use states or after-create hooks for computed data.

**Mistake: Returning non-array values from `definition()`.**
Why it happens: Returning a single value like a string or Collection.
Why it's harmful: Factory calls will throw `TypeError` exceptions.
Better approach: Always return an associative array of column => value pairs.

**Mistake: Forgetting `HasFactory` on the model.**
Why it happens: Model created before factories were introduced, or manual class created.
Why it's harmful: `User::factory()` throws a `BadMethodCallException`.
Better approach: Always add the trait during model creation. Use IDE stubs to automate.

## Failure Modes
1. **Wrong model resolved by convention:** If the factory namespace doesn't match Laravel's convention, it silently resolves the wrong model. Symptoms: unexpected attribute errors, wrong table targeted. Mitigation: set `$model` explicitly.
2. **Factory timeout on large datasets:** `create([], 10000)` may exceed execution time or memory. Mitigation: use chunks, disable Faker uniqueness, or batch manually.
3. **Silent attribute discarding:** `definition()` returns keys the model's `$fillable` would block, but `forceFill` bypasses this. The test passes but real requests fail. Mitigation: test `create()` through controllers too.
4. **Faker duplicate exceptions:** `fake()->unique()->safeEmail()` fails on large collections. Mitigation: set a high Faker retry limit, or remove unique constraint for non-critical fields.

## Ecosystem Usage
- **Laravel Jetstream** uses factory definitions for its `TeamFactory`, `MembershipFactory`.
- **Laravel Breeze** ships with a `UserFactory` using `fake()->name()`, `fake()->unique()->safeEmail()`.
- **Spatie Laravel Permission** provides a `RoleFactory` for its `Role` and `Permission` models.
- **Laravel Filament** recommends factories in its testing documentation for creating panel resources.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Eloquent Model Basics
- Mass Assignment
- Faker Library

### Related Topics
- Factory States
- Factory Sequences
- Factory Callbacks

### Advanced Follow-up Topics
- Custom Factory Builders
- Factory Generators
- Test Data Fixtures


## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Factories\Factory` (~500 lines) â€” core class. `Factory::make()` calls `definition()`, applies states, calls `afterMaking`, then `newModelInstance()->forceFill()`. `Factory::create()` wraps make in persistence with transaction support.
- **Key Insight:** The `forceFill` call in factories is intentional â€” it decouples test data from mass-assignment protection, but creates a gap between test and production attribute handling.
- **Version-Specific Notes:** Laravel 8 introduced class-based factories (replacing the older helper-based `factory()` function). Laravel 10+ added `has()` and `for()` as first-class factory relationship methods. Laravel 11 added the `once()` helper for caching computed values within a factory call.
