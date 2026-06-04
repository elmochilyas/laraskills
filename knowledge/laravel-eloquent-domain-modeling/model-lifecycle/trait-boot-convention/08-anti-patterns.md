# Trait Boot Convention — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Trait Boot Convention |
| Focus | Anti-patterns in boot{TraitName} naming, setup placement, performance, and method visibility |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Putting Trait Setup in Model's `boot()` Instead of `boot{TraitName}()` | Code Organization | High |
| 2 | Mismatching `boot{TraitName}()` Name to Trait Name (Silent Skip) | Framework Usage | Critical |
| 3 | Database Queries in `boot{TraitName}()` Methods | Performance | Critical |
| 4 | Using `boot{TraitName}()` for Instance Defaults (Use `initialize{TraitName}()`) | Design | Medium |
| 5 | Declaring `boot{TraitName}()` as `public` Instead of `protected static` | Framework Usage | Low |
| 6 | Calling `parent::bootTraitName()` Inside `boot{TraitName}()` | Framework Usage | Medium |
| 7 | Using `self::` Instead of `static::` in Boot Methods | Framework Usage | Critical |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is mismatching the boot method name — the method silently never executes with no error
- Database queries in boot methods multiply latency linearly with the number of models using the trait
- Using `self::` instead of `static::` causes runtime errors because `self` resolves to the trait itself, not the model

---

## 1. Putting Trait Setup in Model's `boot()` Instead of `boot{TraitName}()

### Category
Code Organization

### Description
Placing one-time static initialization (event listeners, global scopes) in the model's `boot()` method instead of in a `boot{TraitName}()` method within the trait, requiring every model using the trait to duplicate the setup code.

### Warning Signs
- `static::addGlobalScope()` or `static::created()` in model's `boot()` for functionality that could be a trait
- Multiple models duplicating the same setup code
- Comments like "remember to add this to all models using the trait"
- Trait has no `boot{TraitName}()` method

### Preferred Alternative
```php
trait Filterable
{
    protected static function bootFilterable(): void
    {
        static::addGlobalScope(new FilterScope);
    }
}
```

### Detection Checklist
- [ ] Search for model `boot()` methods that duplicate trait setup
- [ ] Move setup to `boot{TraitName}()` inside the trait
- [ ] Remove duplicated setup from individual models

### Related
| Rule | `05-rules.md` — Always Use `boot{TraitName}()` for Static Lifecycle Setup, Not the Model's `boot()` Method |

---

## 2. Mismatching `boot{TraitName}()` Name to Trait Name (Silent Skip)

### Category
Framework Usage

### Description
Naming the boot method incorrectly relative to the trait name (e.g., `bootUUID()` for trait `HasUuid`), causing the method to be silently skipped with no error message.

### Warning Signs
- Trait `HasUuid` with `bootUUID()` instead of `bootHasUuid()`
- Trait setup never executes (scopes not applied, events not registered)
- Comments like "boot method doesn't seem to run"
- No errors reported despite broken trait behavior

### Preferred Alternative
```php
trait HasUuid
{
    protected static function bootHasUuid(): void {} // Exact trait name match
}
```

### Detection Checklist
- [ ] Verify each trait's boot method name matches the trait name exactly
- [ ] Check casing — Eloquent matching is case-sensitive
- [ ] Add tests that verify boot methods execute

### Related
| Rule | `05-rules.md` — Match `boot{TraitName}()` Method Name Exactly to the Trait Name |

---

## 3. Database Queries in `boot{TraitName}()` Methods

### Category
Performance

### Description
Performing database queries, API calls, or I/O inside `boot{TraitName}()` methods, which execute once per model class per request and multiply request latency by the number of models using the trait.

### Warning Signs
- `::all()`, `::first()`, `::get()` queries inside boot methods
- External API calls in boot methods
- Request latency increasing with the number of models
- Comments like "loading configuration from database"

### Preferred Alternative
```php
protected static function bootHasRoles(): void
{
    static::addGlobalScope('roles', fn ($query) =>
        $query->whereIn('role_id', function ($q) {
            $q->select('id')->from('roles'); // Deferred — runs with the main query
        })
    );
}
```

### Detection Checklist
- [ ] Review each `boot{TraitName}()` for I/O operations
- [ ] Replace with deferred queries or cached configuration
- [ ] Use config files instead of database lookups in boot

### Related
| Rule | `05-rules.md` — Keep `boot{TraitName}()` Methods Lightweight — No Database Queries |

---

## 4. Using `boot{TraitName}()` for Instance Defaults (Use `initialize{TraitName}()`)

### Category
Design

### Description
Setting per-instance default values (default attributes, casts) inside `boot{TraitName}()` via event listeners instead of using `initialize{TraitName}()` which runs per-instance.

### Warning Signs
- `static::creating(function ($model) { $model->uuid = Str::uuid(); })` in boot method
- Default attribute setup via event listeners
- Instance state managed in a static context
- Comments like "set default on create"

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
- [ ] Search for `static::creating()`, `static::saving()` in boot methods that set defaults
- [ ] Move to `initialize{TraitName}()` where possible
- [ ] Keep event listeners only for defaults that need persistence-time data

### Related
| Rule | `05-rules.md` — Use `initialize{TraitName}()` for Instance-Level Defaults, Not `boot{TraitName}()` |

---

## 5. Declaring `boot{TraitName}()` as `public` Instead of `protected static`

### Category
Framework Usage

### Description
Declaring boot methods as `public` instead of `protected static`, exposing lifecycle hooks as public API methods.

### Warning Signs
- `public static function bootFilterable()` declaration
- Boot methods appearing in IDE autocomplete as callable
- Developers calling boot methods manually
- Comments like "why is this public?"

### Preferred Alternative
```php
protected static function bootFilterable(): void {} // Lifecycle hook — not public API
```

### Detection Checklist
- [ ] Search for `public static function boot` in traits
- [ ] Change to `protected static`
- [ ] Verify Eloquent still discovers the method (it does — visibility doesn't affect `call_user_func`)

### Related
| Rule | `05-rules.md` — Declare `boot{TraitName}()` as `protected static` — Never `public` |

---

## 6. Calling `parent::bootTraitName()` Inside `boot{TraitName}()

### Category
Framework Usage

### Description
Calling `parent::bootTraitName()` inside a trait's boot method, which calls the method on `Model` (not other traits) and either throws an error or duplicates execution.

### Warning Signs
- `parent::bootHasRoles()` inside `bootHasRoles()`
- Fatal error about calling undefined parent method
- Duplicate global scope or event listener registrations
- Comments like "trying to chain boot methods"

### Preferred Alternative
```php
protected static function bootHasRoles(): void
{
    static::addGlobalScope(new RolesScope); // No parent call needed
}
```

### Detection Checklist
- [ ] Search for `parent::boot` inside trait boot methods
- [ ] Remove parent calls — Eloquent handles all trait boot ordering
- [ ] Verify no duplicate registrations

### Related
| Rule | `05-rules.md` — Do Not Call `parent::bootTraitName()` Inside `boot{TraitName}()` |

---

## 7. Using `self::` Instead of `static::` in Boot Methods

### Category
Framework Usage

### Description
Using `self::` (instead of `static::`) when registering event listeners or global scopes inside `boot{TraitName}()`, causing runtime errors because `self` resolves to the trait's context rather than the model class.

### Warning Signs
- `self::addGlobalScope()` in boot method
- Runtime errors about calling static method on non-class
- Trait setup not working despite correct naming
- Comments like "self:: resolves to wrong class"

### Preferred Alternative
```php
protected static function bootFilterable(): void
{
    static::addGlobalScope(new FilterScope); // static:: resolves to the model class
}
```

### Detection Checklist
- [ ] Search for `self::` in trait boot methods
- [ ] Replace with `static::`
- [ ] Verify global scopes and event listeners register on the model class

### Related
| Rule | `05-rules.md` — Register Event Listeners Inside `boot{TraitName}()` Using the `static::` Context |
