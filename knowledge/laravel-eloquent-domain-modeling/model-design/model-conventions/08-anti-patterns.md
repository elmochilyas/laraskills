# Model Conventions — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Model Conventions |
| Focus | Anti-patterns in table naming, FK conventions, pivot naming, and convention overrides |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Silent Wrong-Table Mapping (Missing `$table` Override) | Reliability | Critical |
| 2 | Missing Foreign Key Override for Non-Standard Columns | Reliability | High |
| 3 | Over-Configuring Convention-Following Properties | Maintainability | Low |
| 4 | Non-Alphabetical Custom Pivot Table Names | Maintainability | Low |
| 5 | Undocumented Convention Overrides | Maintainability | Medium |
| 6 | Missing Schema Assertion Tests | Testing | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is failing to set `$table` when the convention doesn't match, causing all queries to silently target the wrong table
- Missing foreign key overrides in relationship methods silently bind the wrong column, producing empty results from what appear to be correct queries
- Documenting every convention override preserves decision context for future developers who must maintain or refactor the model

---

## 1. Silent Wrong-Table Mapping (Missing `$table` Override)

### Category
Reliability

### Description
Failing to set `protected $table` explicitly when the database table name does not match the snake_case plural of the model class name, causing Eloquent to query the wrong table.

### Why It Happens
Developers assume Laravel's convention always resolves correctly. Irregular plurals (`Person` → `people`, but actual table is `persons`), legacy databases, and non-standard naming create silent mismatches.

### Warning Signs
- Model queries return empty result sets or wrong data
- `Person::all()` returns results from the wrong table
- `Order::count()` returns 0 or incorrect counts
- `ClassNotFoundException` is not the issue — the model loads, but queries go to the wrong table
- Irregular plural words in model names (Person, Metadata, Sheep)

### Why Harmful
- All read operations return incorrect or empty data
- Write operations (create, update, delete) affect the wrong table
- Debugging requires correlating model configuration with migration history — time-consuming under pressure
- Data corruption occurs silently if the wrong table has a similar schema

### Preferred Alternative
```php
class Person extends Model
{
    protected $table = 'persons'; // Matches actual schema
}
```

### Detection Checklist
- [ ] For each model, compute `Str::pluralStudly(class_basename($model))` and compare with actual table name
- [ ] Check for irregular plurals (Person, Metadata, Sheep, Child)
- [ ] Verify `$table` is set for all non-conventional table names

### Related
| Rule | `05-rules.md` — Override `$table` Explicitly When Convention Fails |
| Decision Tree | `07-decision-trees.md` — Convention vs Explicit Configuration |

---

## 2. Missing Foreign Key Override for Non-Standard Columns

### Category
Reliability

### Description
Omitting the explicit foreign key column name in a relationship method when the column does not follow the `{model_name}_id` convention, causing Eloquent to bind the wrong column.

### Why It Happens
Developers call `$this->belongsTo(Model::class)` without the second argument, assuming Eloquent will magically find the right column. The relationship "works" but returns empty sets because it's looking at `user_id` instead of `author_id`.

### Warning Signs
- Relationship methods that return empty collections
- `$post->author` returns `null` even though the database has valid data
- The foreign key column name differs from `{relationship_method_name}_id`
- Comments like "this relationship doesn't work" or "returns null"
- `dd($post->author()->toSql())` shows the wrong foreign key column

### Preferred Alternative
```php
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
```

### Detection Checklist
- [ ] Check each relationship's foreign key column against the `{model_name}_id` convention
- [ ] Add explicit FK column name for any relationship where the column diverges
- [ ] Test relationships by querying the database directly to verify column names

### Related
| Rule | `05-rules.md` — Specify Foreign Keys Explicitly for Non-Standard Relationships |
| Decision Tree | `07-decision-trees.md` — Convention vs Explicit Configuration |

---

## 3. Over-Configuring Convention-Following Properties

### Category
Maintainability

### Description
Setting `$table`, `$primaryKey`, `$incrementing`, `$keyType`, and other properties to their conventional default values, adding noise without changing behavior.

### Why It Happens
Developers add explicit configuration for "clarity" without knowing which values are Laravel's defaults. The declarations accumulate and become maintenance debt.

### Warning Signs
- `protected $table = 'users'` on a model where the convention already gives `users`
- `public $incrementing = true` on a standard auto-increment model
- `protected $keyType = 'int'` — the default
- `public $timestamps = true` — the default
- Multiple models with the same set of convention-matching declarations

### Preferred Alternative
```php
class Post extends Model
{
    // No configuration needed — table is 'posts', PK is 'id', auto-incrementing int
}
```

### Detection Checklist
- [ ] Cross-reference each declared property against Laravel's defaults
- [ ] Remove declarations that match defaults
- [ ] Verify behavior is unchanged after removal

### Related
| Rule | `05-rules.md` — Prefer Convention Over Configuration at All Times |
| Decision Tree | `07-decision-trees.md` — Convention vs Explicit Configuration |

---

## 4. Non-Alphabetical Custom Pivot Table Names

### Category
Maintainability

### Description
Naming custom pivot tables in non-alphabetical order (e.g., `role_user` is alphabetical, but `user_role` is not) when the pivot does not follow Eloquent's automatic alphabetical convention.

### Why It Happens
Developers naturally write the "primary" model first when naming pivot tables. `User` + `Role` → `user_role` seems logical but breaks the alphabetical convention.

### Warning Signs
- Custom pivot tables named with the primary entity first (e.g., `user_role`, `post_tag`)
- `belongsToMany()` calls with explicit table names that violate alphabetical ordering
- Inconsistent pivot naming across the application
- Comments like "user_role is not alphabetical but that's how we named it"

### Preferred Alternative
```php
// Eloquent convention gives 'role_user' (alphabetical)
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
        // No explicit table name needed — convention is correct
    }
}
```

### Detection Checklist
- [ ] Check custom pivot table names against alphabetical convention
- [ ] Rename or use explicit table name in `belongsToMany()` for legacy pivots
- [ ] Ensure new pivot tables follow alphabetical ordering

### Related
| Rule | `05-rules.md` — Use Alphabetical Order for Custom Pivot Tables |

---

## 5. Undocumented Convention Overrides

### Category
Maintainability

### Description
Setting `$table`, `$primaryKey`, or custom foreign keys without an inline comment explaining why the convention was overridden.

### Why It Happens
The override seems obvious to the developer who wrote it. Six months later, no one remembers whether the override is still needed or can be removed after a schema migration.

### Warning Signs
- `protected $table = 'customer_orders'` with no explanation
- Custom FK column names in relationships with no comment
- Future developers ask in code review: "is this override still needed?"
- Stale overrides that could be removed after schema migrations but persist because no one knows

### Preferred Alternative
```php
// Legacy schema from migrated system — table named before Laravel convention
protected $table = 'catalog_products';
```

### Detection Checklist
- [ ] Review each convention override for an accompanying comment
- [ ] Add comments explaining the reason for each override
- [ ] Review overrides during schema migrations — remove if no longer needed

### Related
| Rule | `05-rules.md` — Document Every Convention Override with a Reason |
| Skill | `06-skills.md` — Verify and Align Model-Table Mapping Conventions |

---

## 6. Missing Schema Assertion Tests

### Category
Testing

### Description
Not writing tests that verify model-table mappings (table exists, primary key column matches, key columns are present), allowing schema-model mismatches to go undetected.

### Why It Happens
Schema changes happen in migrations, and model configuration is updated manually. Without tests, there's no safety net to catch when the two diverge.

### Warning Signs
- No tests that assert `Schema::hasTable()` for model tables
- A migration renames or drops a table, but the model is not updated — queries fail silently
- Debugging sessions where the first step is "check if the table actually exists"
- Manual testing required after every schema migration

### Preferred Alternative
```php
class OrderModelTest extends TestCase
{
    public function test_table_exists(): void
    {
        $this->assertTrue(Schema::hasTable('customer_orders'));
    }

    public function test_primary_key_matches(): void
    {
        $order = new Order();
        $this->assertEquals('uuid', $order->getKeyName());
    }
}
```

### Detection Checklist
- [ ] Check for schema assertion tests in the test suite
- [ ] Write tests for models with convention overrides
- [ ] Add to CI so schema-model mismatches fail the build

### Related
| Rule | `05-rules.md` — Test Model-Table Mapping with Schema Assertions |
| Skill | `06-skills.md` — Verify and Align Model-Table Mapping Conventions |
