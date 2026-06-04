# Initialize Trait Convention — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Initialize Trait Convention |
| Focus | Anti-patterns in initialize{TraitName} naming, performance, instance defaults, and misuse |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `boot{TraitName}()` for Instance Defaults Instead of `initialize{TraitName}()` | Design | High |
| 2 | Not Checking `isset()` Before Modifying Casts in `initialize{TraitName}()` | Maintainability | Medium |
| 3 | Database Queries in `initialize{TraitName}()` Methods | Performance | Critical |
| 4 | Accessing Relationships in `initialize{TraitName}()` | Design | High |
| 5 | Mismatching `initialize{TraitName}()` Name to Trait Name (Silent Skip) | Framework Usage | Critical |
| 6 | Declaring `initialize{TraitName}()` as `protected` Instead of `public` | Framework Usage | Low |
| 7 | Throwing Exceptions in `initialize{TraitName}()` for Configuration Errors | Reliability | Critical |
| 8 | Using `initialize{TraitName}()` for Computed Values That Change After Construction | Design | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is mismatching the initialize method name — the method silently never runs with no error
- Database queries in initialize methods cause N+1-style explosion when creating models in batches (factories, seeders)
- Throwing exceptions in initialize methods breaks model instantiation entirely, affecting factories, tests, and seeders

---

## 1. Using `boot{TraitName}()` for Instance Defaults Instead of `initialize{TraitName}()

### Category
Design

### Description
Setting per-instance default values via event listeners in `boot{TraitName}()` instead of using `initialize{TraitName}()`, which runs during construction before any event listeners.

### Warning Signs
- `static::creating(fn ($model) => $model->uuid = Str::uuid())` in boot
- Default attribute values set via event listeners
- Comments like "set default on create"
- Model state not initialized until first save

### Preferred Alternative
```php
public function initializeHasUuid(): void
{
    $this->casts['uuid'] = 'string';
    if (! $this->uuid) {
        $this->uuid = (string) Str::uuid();
    }
}
```

### Detection Checklist
- [ ] Search for `static::creating()` that set default values
- [ ] Move to `initialize{TraitName}()` where possible
- [ ] Keep listeners only for defaults needing persistence-time data

### Related
| Rule | `05-rules.md` — Use `initialize{TraitName}()` for Per-Instance Defaults — Not `boot{TraitName}()` |

---

## 2. Not Checking `isset()` Before Modifying Casts in `initialize{TraitName}()

### Category
Maintainability

### Description
Overwriting `$this->casts` entries unconditionally in `initialize{TraitName}()` without checking `isset()`, potentially overriding more specific cast definitions set on the model class.

### Warning Signs
- `$this->casts['column'] = 'string'` without `isset()` check
- Model-defined cast types being silently overridden
- Comments like "trait cast overwrites model cast"
- Type coercion bugs that vary by model

### Preferred Alternative
```php
public function initializeHasUuid(): void
{
    if (! isset($this->casts['uuid'])) {
        $this->casts['uuid'] = 'string'; // Only if model hasn't defined it
    }
}
```

### Detection Checklist
- [ ] Search for `$this->casts` assignments in initialize methods
- [ ] Add `isset()` guards before overwriting
- [ ] Verify model-defined casts take precedence

### Related
| Rule | `05-rules.md` — Check `isset()` Before Modifying Casts in `initialize{TraitName}()` |

---

## 3. Database Queries in `initialize{TraitName}()` Methods

### Category
Performance

### Description
Performing database queries, API calls, or file I/O inside `initialize{TraitName}()`, which executes on every new model instance construction — multiplied across factories, seeders, and batch operations.

### Warning Signs
- `Model::first()`, `Model::all()`, or queries in initialize methods
- Batch model creation slowing down dramatically
- API calls during model construction
- Comments like "slow factory"

### Preferred Alternative
```php
public function initializeHasDefaultTeam(): void
{
    $this->team_id ??= config('app.default_team_id'); // Config access — fast
}
```

### Detection Checklist
- [ ] Review each `initialize{TraitName}()` for I/O operations
- [ ] Replace with configuration values or deferred initialization
- [ ] Verify initialize methods execute in under 1ms

### Related
| Rule | `05-rules.md` — Keep `initialize{TraitName}()` Methods Fast — No Database Queries |

---

## 4. Accessing Relationships in `initialize{TraitName}()

### Category
Design

### Description
Calling relationship methods or accessing related models inside `initialize{TraitName}()`, when the model has not been persisted and has no ID.

### Warning Signs
- `$this->teams()->attach(...)` in initialize method
- Lazy-loaded relationship access during construction
- Comments like "this doesn't work because ID is null"
- Orphaned pivot records or silent failures

### Preferred Alternative
```php
protected static function bootHasPrimaryTeam(): void
{
    static::created(function ($model) {
        $model->teams()->attach(config('app.default_team_id')); // After persistence
    });
}
```

### Detection Checklist
- [ ] Search for relationship calls in initialize methods
- [ ] Move relationship logic to event listeners
- [ ] Verify models can be constructed without relationship access

### Related
| Rule | `05-rules.md` — Do Not Access Relationships in `initialize{TraitName}()` |

---

## 5. Mismatching `initialize{TraitName}()` Name to Trait Name (Silent Skip)

### Category
Framework Usage

### Description
Naming the initialize method incorrectly (e.g., `initializeUuid()` for trait `HasUuid`), causing it to silently never execute.

### Warning Signs
- Trait `HasUuid` with `initializeUuid()` instead of `initializeHasUuid()`
- Default values not set after construction
- Casts not registered
- Comments like "initialize method doesn't seem to run"

### Preferred Alternative
```php
trait HasUuid
{
    public function initializeHasUuid(): void {} // Exact trait name match
}
```

### Detection Checklist
- [ ] Verify each trait's initialize method name matches the trait name exactly
- [ ] Check casing — Eloquent matching is case-sensitive
- [ ] Add guards that assert defaults are set after construction

### Related
| Rule | `05-rules.md` — Match `initialize{TraitName}()` Method Name Exactly to the Trait Name |

---

## 6. Declaring `initialize{TraitName}()` as `protected` Instead of `public`

### Category
Framework Usage

### Description
Declaring initialize methods as `protected` or `private` instead of `public`, working via reflection but violating framework convention.

### Warning Signs
- `protected function initializeHasUuid()` declaration
- IDE flags initialize method as "unused private method"
- Comments like "protected works but is unconventional"

### Preferred Alternative
```php
public function initializeHasUuid(): void {} // Explicitly part of the lifecycle
```

### Detection Checklist
- [ ] Search for non-public initialize methods in traits
- [ ] Change to `public`
- [ ] Verify Eloquent still discovers the method

### Related
| Rule | `05-rules.md` — Declare `initialize{TraitName}()` as `public` to Match Eloquent's Convention |

---

## 7. Throwing Exceptions in `initialize{TraitName}()` for Configuration Errors

### Category
Reliability

### Description
Throwing exceptions in `initialize{TraitName}()` for missing configuration or invalid state, preventing the model from being instantiated at all and breaking factories, tests, and seeders.

### Warning Signs
- `throw new \RuntimeException(...)` in initialize method
- Factory crash with "cannot instantiate model"
- Test suite failures due to missing config
- Comments like "model can't be created when config is missing"

### Preferred Alternative
```php
public function initializeHasDefaultTeam(): void
{
    $this->team_id ??= config('app.default_team_id'); // Safe default
}

protected static function bootHasDefaultTeam(): void
{
    static::saving(function ($model) {
        if (! $model->team_id) {
            throw new \RuntimeException('Team ID is required'); // At persistence time
        }
    });
}
```

### Detection Checklist
- [ ] Search for `throw` in initialize methods
- [ ] Defer validation to persistence time
- [ ] Use safe defaults in initialize methods

### Related
| Rule | `05-rules.md` — Do Not Throw Exceptions in `initialize{TraitName}()` for Configuration Errors |

---

## 8. Using `initialize{TraitName}()` for Computed Values That Change After Construction

### Category
Design

### Description
Computing derived values (full name, total) in `initialize{TraitName}()` that depend on other attributes which may change after construction, producing stale data.

### Warning Signs
- `$this->full_name = $this->first_name.' '.$this->last_name` in initialize
- Computed values that become incorrect after attribute updates
- Comments like "value is stale after update"
- Accessor-like logic in initialize method

### Preferred Alternative
```php
// Use an accessor for computed values
public function getFullNameAttribute(): string
{
    return $this->first_name.' '.$this->last_name;
}
```

### Detection Checklist
- [ ] Search for derived/computed values in initialize methods
- [ ] Replace with accessors
- [ ] Keep initialize methods for truly static defaults only

### Related
| Rule | `05-rules.md` — Do Not Use `initialize{TraitName}()` for Logic That Should Run on Every Access |
