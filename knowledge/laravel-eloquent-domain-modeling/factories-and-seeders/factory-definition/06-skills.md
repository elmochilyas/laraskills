# Skill: Create a Model Factory with HasFactory and definition()

## Purpose

Create an Eloquent model factory that generates valid model instances with realistic default attribute values using the `HasFactory` trait and `definition()` method.

## When To Use

- Generating test data for feature/unit tests
- Seeding development databases with sample data
- Creating model instances with consistent default attributes

## When NOT To Use

- The data is reference/static data that should always exist (use explicit `create()` in seeders)
- Performance-critical bulk inserts with no need for model events (use `DB::table()->insert()`)
- The model has minimal attributes and no relationships (manual creation may be clearer)

## Prerequisites

- Model class exists in `app/Models/`
- Database table exists for the model
- Faker is available (Laravel includes it by default)

## Inputs

- Model class name
- Database column names and types
- Default values for each column

## Workflow

1. Add `use HasFactory` trait to the model class:
   ```
   use Illuminate\Database\Eloquent\Factories\HasFactory
   class User extends Authenticatable { use HasFactory }
   ```
2. Create the factory at `database/factories/ModelFactory.php` extending `Factory`:
   ```
   class UserFactory extends Factory { protected $model = User::class }
   ```
   (Omit `$model` if the convention resolves correctly.)
3. Define the `definition()` method returning a plain array with `fake()` values:
   ```
   public function definition(): array {
       return [
           'name' => fake()->name(),
           'email' => fake()->unique()->safeEmail(),
           'password' => bcrypt('password'),
       ]
   }
   ```
4. Use `fake()->unique()` for columns with unique database constraints
5. Set sensible "happy path" defaults so callers rarely need overrides

## Validation Checklist

- [ ] Model uses `HasFactory` trait
- [ ] Factory has `definition()` method returning a plain array
- [ ] `fake()` provides realistic, variable values
- [ ] `fake()->unique()` applied to unique constraint columns
- [ ] Default values produce a valid model without overrides
- [ ] `$model` property omitted when convention resolves the class
- [ ] `definition()` has no side effects

## Common Failures

- **Missing HasFactory trait**: `Model::factory()` call returns undefined method error. Add `use HasFactory`.
- **Side effects in definition()**: Calling `OtherModel::factory()->create()` inside `definition()` causes phantom records on `make()` or `raw()`. Keep `definition()` pure.
- **Duplicate values**: Faker without `->unique()` on unique columns causes integrity constraint violations in batch creation.
- **Non-standard namespace**: Factory fails to resolve the correct model. Set `$model` explicitly when the model is in a non-standard namespace.

## Decision Points

- **make vs create vs raw**: Use `make()` for in-memory instances (no DB). Use `create()` for persisted records. Use `raw()` for plain arrays in bulk inserts.
- **$model property**: Only set when the model namespace does not follow convention (e.g., `Domain\User\Models\User`).

## Performance Considerations

- `create()` triggers model events and observers — use `make()` when persistence isn't needed
- `raw()` + `DB::table()->insert()` is 5-10x faster for bulk inserts than `create()`
- `Model::factory()->count(N)->create()` batches in a single transaction

## Security Considerations

- Factory defaults should not contain real user data or secrets
- Use `fake()` values that pass validation but don't expose real PII

## Related Rules

- Rule 1: Return Only an Attribute Array from definition()
- Rule 2: Use fake() for All Variable Attribute Values
- Rule 3: Use fake()->unique() for Unique Constraint Columns
- Rule 4: Always Add HasFactory Trait to the Model
- Rule 5: Set Sensible "Happy Path" Defaults in definition()

## Related Skills

- Factory States for Named State Variations
- Factory Callbacks for Post-Creation Logic
- Factory Sequences for Deterministic Data

## Success Criteria

- `Model::factory()->make()` returns a valid model instance without database writes
- `Model::factory()->create()` persists a valid record with all required columns
- Multiple `create()` calls produce unique records (no constraint violations)
- Callers rarely need to override defaults
