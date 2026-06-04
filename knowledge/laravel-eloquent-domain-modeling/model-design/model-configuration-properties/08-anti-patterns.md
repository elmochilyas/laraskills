# Model Configuration Properties — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Model Configuration Properties |
| Focus | Anti-patterns in $table, $primaryKey, $casts, $with, $appends, $connection usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Setting Properties to Default Values (Noise) | Maintainability | Low |
| 2 | Using `$with` for Universal Eager Loading | Performance | High |
| 3 | Expensive Accessors in `$appends` | Performance | High |
| 4 | Incomplete Primary Key Override Group | Reliability | High |
| 5 | Hard-Coded `$connection` String | Scalability | Medium |
| 6 | Using `$casts` Property Instead of `casts()` Method | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- The most impactful performance anti-pattern is using `$with` for eager loading on every query, which adds unnecessary joins to count, exists, and list operations
- Incomplete primary key overrides (setting `$primaryKey` without `$keyType` and `$incrementing`) cause SQL type errors on relationship joins
- Including expensive accessors (especially those with DB queries) in `$appends` degrades every serialization of the model

---

## 1. Setting Properties to Default Values (Noise)

### Category
Maintainability

### Description
Explicitly declaring model configuration properties with values that match Laravel's defaults (e.g., `$table = 'users'` when convention already gives `users`), adding noise without changing behavior.

### Why It Happens
Developers are taught to "configure models explicitly" and over-apply the principle. They set every property "just to be safe" without knowing which values are defaults.

### Warning Signs
- `protected $table = 'users'` on a model with conventional table naming
- `public $incrementing = true` on a model with standard auto-increment ID
- `public $timestamps = true` — the default behavior
- Multiple properties set to their conventional defaults, obscuring meaningful overrides

### Why Harmful
- Meaningful overrides (non-standard table, non-incrementing PK) are buried in a sea of default declarations
- Properties may drift from actual schema without detection (the declaration says 'users' but the actual table is 'users_legacy')
- More code to read and maintain

### Preferred Alternative
```php
class Order extends Model
{
    // Only override properties that differ from conventions
    protected $table = 'customer_orders';
    protected $primaryKey = 'uuid';
    public $incrementing = false;
}
```

### Detection Checklist
- [ ] Check each model property against Laravel's defaults
- [ ] Remove declarations that match defaults
- [ ] Verify behavior is unchanged after removal

### Related
| Rule | `05-rules.md` — Set Only Properties That Differ from Defaults |
| Decision Tree | `07-decision-trees.md` — Explicit Property vs Convention-Based Default |

---

## 2. Using `$with` for Universal Eager Loading

### Category
Performance

### Description
Setting `$with` on a model to eagerly load relationships on every query, including unintended contexts like counts, existence checks, and list endpoints where the relationship is not needed.

### Why It Happens
Developers add `$with` as a convenience to avoid writing `->with()` on every query. They don't realize `$with` applies to ALL queries, not just the specific ones needing the relationship.

### Warning Signs
- `protected $with = ['items', 'payments']` on a model
- `Order::count()` or `Order::exists()` triggers joins to `items` and `payments`
- Index or listing endpoints that never use the eager-loaded relationships
- N+1 problems in unexpected places like background jobs or console commands

### Why Harmful
- Every `Order::find()`, `Order::where()->get()`, `Order::count()` pays the cost of loading extra relationships
- List endpoints that return 100 items load 201+ queries instead of 1
- Memory usage increases for every query, even when relationships aren't accessed

### Preferred Alternative
```php
class Order extends Model
{
    // No $with — relationships loaded explicitly where needed
}

// In controller:
$order = Order::with('items', 'payments')->find($id);
$count = Order::count(); // No unnecessary joins
```

### Detection Checklist
- [ ] Search for `$with` property on all models
- [ ] Verify each `$with` relationship is truly needed on every query
- [ ] Remove `$with` and add explicit `with()` calls where relationships are needed

### Related
| Rule | `05-rules.md` — Avoid `$with` for Bulk Eager Loading |
| Decision Tree | `07-decision-trees.md` — $with Usage Decision |

---

## 3. Expensive Accessors in `$appends`

### Category
Performance

### Description
Including accessors in `$appends` that perform database queries or expensive computations, causing them to execute on every serialization of the model.

### Why It Happens
Developers add accessors to `$appends` for convenience without evaluating the performance impact. An accessor that runs a query on each invocation becomes an N+1 problem when serializing a collection of models.

### Warning Signs
- `$appends` contains accessors that call `$this->relation()->sum()`, `$this->relation()->count()`, or other query methods
- API responses slow down as the number of returned models increases
- Serialization of a single model is fast, but serialization of 100 models is 100x slower
- Accessors in `$appends` that don't use cached or pre-loaded data

### Preferred Alternative
```php
protected $appends = ['formatted_created_at'];

public function getFormattedCreatedAtAttribute(): string
{
    return $this->created_at->format('Y-m-d'); // Cheap — no DB query
}
```

### Detection Checklist
- [ ] Review each accessor in `$appends` for database queries
- [ ] Check if the accessor could use an eager-loaded relationship instead of a fresh query
- [ ] Consider removing from `$appends` and calling explicitly when needed

### Related
| Rule | `05-rules.md` — Keep `$appends` Lightweight |
| Skill | `06-skills.md` — Configure Non-Conventional Model Properties |

---

## 4. Incomplete Primary Key Override Group

### Category
Reliability

### Description
Setting `$primaryKey` without also setting the interdependent `$incrementing` and `$keyType` properties, leaving Eloquent in a mismatched state.

### Why It Happens
Developers set the column name (`$primaryKey`) but forget the related properties. They may not know that `$incrementing` defaults to `true` and `$keyType` defaults to `'int'`, which are wrong for UUID or string keys.

### Warning Signs
- `$primaryKey = 'uuid'` but `$incrementing` is still `true` (default)
- `$primaryKey = 'uuid'` but `$keyType` is still `'int'` (default)
- SQL type mismatch errors on relationship joins involving the primary key
- Inconsistent primary key casting in comparisons and JSON output

### Preferred Alternative
```php
class Order extends Model
{
    protected $primaryKey = 'uuid';
    public $incrementing = false;
    protected $keyType = 'string';
}
```

### Detection Checklist
- [ ] Search for models with `$primaryKey` set
- [ ] Verify all three properties (`$primaryKey`, `$incrementing`, `$keyType`) are set together
- [ ] Check for SQL type errors on joins involving these models

### Related
| Rule | `05-rules.md` — Use `$primaryKey`, `$incrementing`, and `$keyType` Together |
| Skill | `06-skills.md` — Configure Non-Conventional Model Properties |

---

## 5. Hard-Coded `$connection` String

### Category
Scalability

### Description
Hard-coding a database connection name as a string literal in the `$connection` property, preventing environment-specific routing without modifying model code.

### Why It Happens
The simplest approach is to write `protected $connection = 'mysql_billing'`. Developers don't consider that connection names may differ between development, staging, and production environments.

### Warning Signs
- `protected $connection = 'mysql_billing'` hard-coded as a string literal
- Environment-specific database routing requires editing model files
- Multiple models with the same hard-coded connection string that must all change together
- Comments like "change this for production"

### Preferred Alternative
```php
class Order extends Model
{
    protected $connection = 'billing';
}

// In config/database.php:
// 'connections' => [
//     'billing' => env('BILLING_DB_CONNECTION', 'mysql'),
// ],
```

### Detection Checklist
- [ ] Search for `$connection = '` in model files
- [ ] Ensure connection names resolve through config/environment, not hard-coded literals
- [ ] Verify environment-specific connection switching works without model changes

### Related
| Rule | `05-rules.md` — Set `$connection` via Runtime Resolution |
| Skill | `06-skills.md` — Configure Non-Conventional Model Properties |

---

## 6. Using `$casts` Property Instead of `casts()` Method

### Category
Maintainability

### Description
Defining attribute casts using the `$casts` property instead of the `casts()` method, preventing runtime conditions, inheritance, and method-based composition.

### Why It Happens
The `$casts` property has been available since early Laravel versions. Developers continue using it out of habit, not realizing the `casts()` method provides more flexibility.

### Warning Signs
- `protected $casts = [...]` on models in Laravel 11+ projects
- Child models that override `$casts` must redeclare the entire array
- Casts that could be conditional but can't be because the property is static

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
- [ ] Convert existing declarations when modifying casts

### Related
| Rule | `05-rules.md` — Prefer `casts()` Method Over `$casts` Property |
| Decision Tree | `07-decision-trees.md` — $casts Property vs casts() Method |
