# Factory Definition — Decomposition

## Implementation Tasks

### 1. Create factory class extending `Factory`
- Generate factory via `php artisan make:factory ModelFactory` or create manually
- Set `$model` property to the FQCN of the target model
- Import `Illuminate\Database\Eloquent\Factories\Factory`

### 2. Implement `definition()` method
- Return associative array of column => generated value
- Use `fake()` (Laravel helper) or `Faker\Generator` instance
- Match all required (non-nullable, no-default) columns in the migration
- Cover optional columns with `null` or sensible defaults

### 3. Add `HasFactory` trait to model
- Add `use HasFactory;` inside the model class
- Verify `Model::factory()` resolves correctly

### 4. Configure model-to-factory resolution
- Decide convention vs. explicit `$model` property
- If using namespace-prefixed factories, set `$model` explicitly

### 5. Write tests using `make()`, `create()`, `raw()`
- Test `factory()->make()` returns a model instance (not persisted)
- Test `factory()->create()` returns a persisted model
- Test `factory()->raw()` returns an array
- Assert the generated attributes match expected structure

### 6. Add Faker data generators for all columns
- Map each column to an appropriate Faker formatter (`name()`, `email()`, `text()`, `randomNumber()`, etc.)
- Use `fake()->unique()` for columns with uniqueness constraints
- Use `fake()->optional()` for nullable columns

### 7. Ensure `definition()` returns only fillable-like keys
- Verify returned keys correspond to actual migration columns
- Remove keys that are auto-generated (timestamps, primary keys)

### 8. Set up test database configuration
- Configure `DB_DATABASE` in `phpunit.xml` or `.env.testing`
- Run `migrate:fresh --env=testing` before factory tests

### 9. Test edge cases
- Test factory with zero attributes (empty `definition()`)
- Test factory with nullable columns omitted
- Test factory generates unique emails across multiple creates

## Validation Criteria
- [ ] `Model::factory()->make()` returns an unpersisted model instance
- [ ] `Model::factory()->create()` inserts a row in the database
- [ ] `Model::factory()->raw()` returns an associative array
- [ ] All required migration columns are covered in `definition()`
- [ ] `HasFactory` trait is present on the model
- [ ] Factory class names resolve to correct model (convention or explicit)
- [ ] Generated fake data passes model validation rules
- [ ] `fake()->unique()` fields produce no duplicates across 50+ creates
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization