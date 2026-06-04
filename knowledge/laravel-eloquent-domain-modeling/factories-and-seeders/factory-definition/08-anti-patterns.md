# Factory Definition — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory Definition |
| Focus | Anti-patterns in factory definition() method and basic factory usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Side Effects in `definition()` | Architecture | Critical |
| 2 | Hard-Coded Static Attribute Values | Testing | High |
| 3 | Missing `fake()->unique()` on Unique Columns | Reliability | High |
| 4 | Missing `HasFactory` Trait | Framework Usage | High |
| 5 | Overriding `$model` Unnecessarily | Code Organization | Low |
| 6 | Using `create()` When `make()` Would Suffice | Performance | Medium |
| 7 | Invalid Defaults Requiring Caller Overrides | Testing | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is putting side effects (model creation, I/O, event dispatching) directly in `definition()`, which causes phantom database writes on `make()` and `raw()` calls
- Using hard-coded static values instead of `fake()` produces identical data for every model, masking validation and uniqueness issues
- Missing `HasFactory` on a model is the most common first-run error when adopting factory patterns

---

## 1. Side Effects in `definition()`

### Category
Architecture

### Description
Including database writes, file operations, API calls, or event dispatching inside the factory's `definition()` method instead of keeping it as a pure associative array and moving side effects to `afterCreating()` callbacks.

### Why It Happens
Developers find it convenient to create related models inline within `definition()`. They may not realize that `definition()` executes during all three factory operations (`make()`, `create()`, `raw()`), not just `create()`.

### Warning Signs
- `definition()` contains `Model::factory()->create()` or `Model::factory()->make()` calls
- `definition()` calls `Storage::put()`, `Http::post()`, or other I/O methods
- `definition()` dispatches events or writes logs
- Calling `Factory::raw()` unexpectedly triggers database writes
- Tests using `make()` produce database records as a side effect

### Why Harmful
- `make()` (intended for in-memory only) writes to the database
- `raw()` (intended for attribute arrays) triggers persistence
- The factory is no longer predictable — callers cannot trust `make()` or `raw()` to be side-effect-free
- Test isolation is violated when non-persisted test setup writes to the database

### Consequences
- `User::factory()->make()` creates phantom Team records via `'team_id' => Team::factory()`
- A test calling `make()` for 50 models creates 50 unwanted database records
- `User::factory()->raw()` triggers media uploads because `definition()` calls `addMedia()`

### Preferred Alternative
```php
public function definition(): array
{
    return ['name' => fake()->name(), 'email' => fake()->safeEmail()];
}

public function configure(): static
{
    return $this->afterCreating(fn (User $user) => $user->teams()->save(Team::factory()->make()));
}
```

### Detection Checklist
- [ ] Search for `::factory()->` inside `definition()` methods
- [ ] Check for `Storage::`, `Http::`, `Mail::`, `Event::` in `definition()`
- [ ] Call `Factory::raw()` — does it trigger any database writes?
- [ ] Call `Factory::make()` — does it create unexpected records?
- [ ] Verify `definition()` returns only a plain attribute array

### Related
| Rule | `05-rules.md` — Return Only an Attribute Array from definition() |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |
| Knowledge | `04-standardized-knowledge.md` — Factory Definition |

---

## 2. Hard-Coded Static Attribute Values

### Category
Testing

### Description
Using fixed, hard-coded values for factory attributes instead of `fake()` (Faker), producing identical data for every model instance.

### Why It Happens
Developers use static values for simplicity, not realizing that identical data masks validation bugs, UI rendering issues, and uniqueness constraint violations that only surface with realistic varied data.

### Warning Signs
- `definition()` uses literal strings like `'John Doe'`, `'john@example.com'` instead of `fake()->name()`
- Multiple models created from the factory have identical attribute values
- Tests never catch validation errors for edge-case inputs (long names, special characters)
- `fake()` is not imported or used anywhere in the factory

### Why Harmful
- Uniqueness constraint violations occur when creating multiple models with the same value
- UI layout bugs with long names, special characters, or boundary values go undetected
- Test data looks artificial and does not reflect real-world variability
- Refactoring validation rules may break with realistic data that was never tested

### Preferred Alternative
```php
public function definition(): array
{
    return [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
        'bio' => fake()->paragraph(),
    ];
}
```

### Detection Checklist
- [ ] Check for literal strings in `definition()` that should use `fake()`
- [ ] Create 10 models — are all values identical?
- [ ] Verify `fake()` is called for name, email, and other variable attributes
- [ ] Check if uniqueness constraints have corresponding `fake()->unique()` calls

### Related
| Rule | `05-rules.md` — Use fake() for All Variable Attribute Values |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |

---

## 3. Missing `fake()->unique()` on Unique Columns

### Category
Reliability

### Description
Failing to apply `fake()->unique()` on factory attributes that have database unique constraints, causing integrity constraint violations during batch creation.

### Why It Happens
Faker generates values randomly. Without `unique()`, two models in the same batch can receive the same email, slug, or other unique value. The probability is low with small batches but increases with batch size.

### Warning Signs
- `Integrity constraint violation` exceptions during `factory()->count(N)->create()`
- Flaky tests that fail intermittently with duplicate key errors
- `fake()->safeEmail()` or `fake()->slug()` without `->unique()`
- Factory attributes matching unique database columns lack the unique modifier

### Preferred Alternative
```php
public function definition(): array
{
    return [
        'email' => fake()->unique()->safeEmail(),
        'slug' => fake()->unique()->slug(),
    ];
}
```

### Detection Checklist
- [ ] Cross-reference database unique indexes with factory attributes
- [ ] Check if `fake()->unique()` is applied to email, slug, username, and other unique columns
- [ ] Run `factory()->count(50)->create()` — does it produce any duplicates?

### Related
| Rule | `05-rules.md` — Use fake()->unique() for Unique Constraint Columns |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |

---

## 4. Missing `HasFactory` Trait

### Category
Framework Usage

### Description
Not adding `use HasFactory` to an Eloquent model, causing `Call to undefined method Model::factory()` at runtime.

### Why It Happens
Developers create the model and the factory separately but forget the trait. The error only surfaces at runtime when `Model::factory()` is first called, which may be late in the development cycle.

### Warning Signs
- `Call to undefined method Model::factory()` error when using the factory
- Model class does not `use HasFactory`
- The factory file exists but the model cannot reference it
- New models added without the trait pattern established in existing models

### Preferred Alternative
```php
class User extends Authenticatable
{
    use HasFactory;
}
```

### Detection Checklist
- [ ] Every model with a factory has `use HasFactory` trait
- [ ] No model is missing the trait when `Model::factory()` is called
- [ ] New models added to the codebase include the trait by convention

### Related
| Rule | `05-rules.md` — Always Add HasFactory Trait to the Model |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |

---

## 5. Overriding `$model` Unnecessarily

### Category
Code Organization

### Description
Explicitly setting the `$model` property on a factory when Laravel's convention-based resolution would correctly resolve the model class.

### Why It Happens
Early Laravel versions required `$model`. Developers carry forward the habit, or they add it "just to be safe" without checking whether convention works.

### Warning Signs
- `protected $model = User::class` in a factory where the model follows convention
- Model is at `App\Models\User` and factory is at `database/factories\UserFactory`
- Multiple `$model` declarations that duplicate the convention

### Preferred Alternative
```php
class UserFactory extends Factory
{
    // No $model needed — convention resolves App\Models\User
}
```

### Detection Checklist
- [ ] Check if `$model` is set when the model follows naming convention
- [ ] Verify that removing `$model` still resolves the correct model
- [ ] Document exceptions where `$model` is genuinely needed

### Related
| Rule | `05-rules.md` — Override $model Only When Convention Fails |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |

---

## 6. Using `create()` When `make()` Would Suffice

### Category
Performance

### Description
Calling `factory()->create()` (which persists to the database, fires events, and runs observers) when the test only needs to inspect in-memory attributes that don't require database persistence.

### Why It Happens
`create()` is the more commonly demonstrated factory method. Developers default to it without considering whether the test actually needs a persisted record.

### Warning Signs
- Tests that only inspect attribute values or call methods that don't query the database
- Tests that repeatedly create models just to check validation rules
- Slow test suites where most tests use `create()` unnecessarily
- `factory()->create()` followed by assertions on attributes that don't depend on persistence

### Preferred Alternative
```php
public function test_user_has_default_role(): void
{
    $user = User::factory()->make();
    $this->assertEquals('subscriber', $user->role);
}
```

### Detection Checklist
- [ ] Review tests that use `create()` — do they need a persisted record?
- [ ] Replace `create()` with `make()` and check if tests still pass
- [ ] Check for tests that only assert on attribute values, not database state

### Related
| Rule | `05-rules.md` — Use make() When Persistence Is Not Required |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |

---

## 7. Invalid Defaults Requiring Caller Overrides

### Category
Testing

### Description
Setting factory defaults that produce an invalid model, forcing every test and seeder to override attributes just to get a valid instance.

### Why It Happens
Developers leave placeholder or empty defaults, intending callers to fill in the "real" values. They don't realize this spreads knowledge of valid state across every test file.

### Warning Signs
- `'email' => ''` or `'status' => null` in `definition()`
- Every test file overrides the same attributes
- The factory cannot produce a valid model without call-site overrides
- Comments in tests like "must set status to active or model fails validation"

### Preferred Alternative
```php
public function definition(): array
{
    return [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
        'status' => 'active',
    ];
}
```

### Detection Checklist
- [ ] Call `factory()->make()` — does it produce a model that passes validation?
- [ ] Count how many callers override the same default attributes
- [ ] Check for empty strings, null, or placeholder values in `definition()`

### Related
| Rule | `05-rules.md` — Set Sensible "Happy Path" Defaults in definition() |
| Skill | `06-skills.md` — Create a Model Factory with HasFactory and definition() |
