# Base Model Class — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Base Model Class |
| Focus | Anti-patterns in base model extension, mass assignment, and serialization |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `$guarded = []` Leaving Mass Assignment Wide Open | Security | Critical |
| 2 | Missing `$hidden` for Sensitive Attributes | Security | Critical |
| 3 | No Project-Specific Base Model (Duplicated Config) | Code Organization | Medium |
| 4 | Eloquent Model Used as DTO | Architecture | High |
| 5 | Missing `$table` Override for Non-Conventional Names | Reliability | High |
| 6 | Using `$casts` Property Instead of `casts()` Method | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- The most critical security anti-pattern is leaving `$guarded = []` which disables mass-assignment protection entirely, allowing any request parameter to set any database column
- Failing to place sensitive attributes in `$hidden` leaks credentials, tokens, and PII through API serialization
- Using Eloquent models as DTOs for transient data risks accidental persistence and carries unnecessary overhead

---

## 1. `$guarded = []` Leaving Mass Assignment Wide Open

### Category
Security

### Description
Setting `protected $guarded = []` on an Eloquent model, which disables mass-assignment protection and allows all attributes to be set via `create()` or `fill()` from user input.

### Why It Happens
`$guarded = []` is a quick way to avoid mass-assignment errors during development. Developers intend to "fix it later" but it reaches production, or they don't understand the security implications.

### Warning Signs
- `protected $guarded = []` on any model
- No `$fillable` property defined
- Models exposed to user input without attribute whitelisting
- New columns added to the database are immediately mass-assignable

### Why Harmful
- Any HTTP request parameter can set any database column, including `is_admin`, `role_id`, `balance`
- A single forgotten `$guarded = []` in a model creates a privilege escalation vulnerability
- Security audits flag this as a critical finding
- Compliance requirements (SOC2, PCI-DSS) are violated

### Preferred Alternative
```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
}
```

### Detection Checklist
- [ ] Search all models for `$guarded = []`
- [ ] Replace each with explicit `$fillable` whitelist
- [ ] Verify no model is missing both `$fillable` and `$guarded`
- [ ] Check that `$guarded = ['*']` (Laravel 11 default) is the only acceptable guarded value

### Related
| Rule | `05-rules.md` — Always Define `$fillable` on Every Model |
| Decision Tree | `07-decision-trees.md` — Mass Assignment Strategy (fillable vs guarded) |

---

## 2. Missing `$hidden` for Sensitive Attributes

### Category
Security

### Description
Not listing sensitive attributes (passwords, tokens, API secrets, internal notes) in the `$hidden` property, causing them to be included in JSON and array serialization output.

### Why It Happens
Developers focus on `$fillable` for input protection but forget about serialization output protection. The `$hidden` property is overlooked because the leak only manifests when the model is serialized (API responses, job payloads, logs).

### Warning Signs
- `password` or `remember_token` columns not in `$hidden`
- API responses include `password` or `api_token` fields
- Queue job payloads contain credentials when serializing the model
- Log files show sensitive fields in dumped model output

### Preferred Alternative
```php
class User extends Model
{
    protected $hidden = ['password', 'remember_token', 'api_token'];
}
```

### Detection Checklist
- [ ] Review all models for sensitive columns that should be hidden
- [ ] Verify `password`, `remember_token`, `api_token`, `secret` are in `$hidden`
- [ ] Check API responses for leaked credential fields
- [ ] Review queued job payloads for sensitive model data

### Related
| Rule | `05-rules.md` — Place Sensitive Attributes in `$hidden` |
| Skill | `06-skills.md` — Set Up a Project-Specific BaseModel |

---

## 3. No Project-Specific Base Model (Duplicated Config)

### Category
Code Organization

### Description
Not creating a `BaseModel` class and instead duplicating the same configuration (date format, serialization overrides, global traits) on every individual model.

### Why It Happens
Small projects start without a base model. As the project grows, no one takes the time to refactor the duplicated configuration into a shared base class.

### Warning Signs
- Same `$dateFormat` defined on 3+ models
- Same `serializeDate()` method overridden in multiple models
- Same traits (e.g., `SoftDeletes`) used on every model but no base model exists
- Changing a global default requires editing every model file

### Preferred Alternative
```php
abstract class BaseModel extends Model
{
    protected $dateFormat = 'Y-m-d H:i:s';

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }
}

class User extends BaseModel { /* ... */ }
class Order extends BaseModel { /* ... */ }
```

### Detection Checklist
- [ ] Check for duplicated `$dateFormat` or `serializeDate()` across models
- [ ] Count models — if 3+ share configuration, create a base model
- [ ] Verify all project models extend the base model

### Related
| Rule | `05-rules.md` — Create a Project-Specific Base Model |
| Decision Tree | `07-decision-trees.md` — Base Model vs Direct Model Extension |

---

## 4. Eloquent Model Used as DTO

### Category
Architecture

### Description
Using an Eloquent model class to represent transient data (form data, API request payloads, read-only projections) when a plain PHP class or readonly DTO would be more appropriate.

### Why It Happens
Eloquent models are convenient — they provide property access, array conversion, and validation. Developers extend them for data-carrying classes without considering the full Active Record surface area they inherit.

### Warning Signs
- Model class with `$timestamps = false`, `$incrementing = false`, no table
- Model used only for `toArray()` conversion, never saved to database
- `$model->save()` accidentally called on a DTO-like model, writing to an unintended table
- Comments like "this model is never persisted — just used for data transfer"

### Preferred Alternative
```php
readonly class OrderData
{
    public function __construct(
        public string $customerName,
        public array $items,
        public int $totalCents,
    ) {}
}
```

### Detection Checklist
- [ ] Search for models with `$table` pointing to non-existent tables
- [ ] Review models that disable timestamps, incrementing, and other persistence features
- [ ] Check for `save()` calls on models that should be read-only
- [ ] Replace with plain DTO classes where models are used only for data transfer

### Related
| Rule | `05-rules.md` — Never Use Eloquent Model as a DTO |
| Skill | `06-skills.md` — Set Up a Project-Specific BaseModel |

---

## 5. Missing `$table` Override for Non-Conventional Names

### Category
Reliability

### Description
Failing to set `protected $table` when the database table name does not follow the snake_case plural convention, causing the model to map to the wrong table.

### Why It Happens
Developers assume Laravel's convention always resolves correctly. Non-standard table names (legacy databases, multi-word naming, single-word irregularities) silently map to the wrong table without errors until data operations fail.

### Warning Signs
- Model queries return empty results or wrong data
- `Model::all()` returns records from the wrong table
- Table name has irregular plural (e.g., `metadata` is already plural, `people` irregular)
- Legacy database with table names that don't follow Laravel conventions

### Preferred Alternative
```php
class Metadata extends Model
{
    protected $table = 'model_meta';
}
```

### Detection Checklist
- [ ] Verify table name convention for every model
- [ ] Set `$table` explicitly for any non-conventional table name
- [ ] Check legacy database models for correct table mapping

### Related
| Rule | `05-rules.md` — Override `$table` When Convention Does Not Match |

---

## 6. Using `$casts` Property Instead of `casts()` Method

### Category
Maintainability

### Description
Defining attribute casts using the `$casts` property on the model instead of the `casts()` method, preventing method-based composition, runtime conditions, and parent inheritance.

### Why It Happens
The `$casts` property has been available since early Laravel versions. Many developers learned this approach first and continue using it out of habit. The `casts()` method is a newer alternative.

### Warning Signs
- `protected $casts = [...]` property on models
- Child models that need to extend parent casts but can't
- Casts that should differ by environment but use static property
- Models extending `BaseModel` that redeclare the full casts array instead of merging

### Preferred Alternative
```php
class Order extends Model
{
    protected function casts(): array
    {
        return [
            'total_cents' => 'integer',
            'paid_at' => 'datetime',
        ];
    }
}
```

### Detection Checklist
- [ ] Search for `$casts` property declarations
- [ ] Replace with `casts()` method in new code
- [ ] Convert existing code when adding or modifying casts

### Related
| Rule | `05-rules.md` — Use `casts()` Method Over `$casts` Property in New Code |
| Skill | `06-skills.md` — Set Up a Project-Specific BaseModel |
