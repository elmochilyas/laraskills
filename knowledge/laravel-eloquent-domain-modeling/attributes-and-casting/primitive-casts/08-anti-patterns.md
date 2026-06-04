# Primitive Casts — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Primitive Casts |
| Focus | Anti-patterns in primitive cast usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Float Cast for Monetary Values | Reliability | Critical |
| 2 | Missing Boolean Cast on Boolean Columns | Reliability | High |
| 3 | Serialization Instead of JSON/Array Cast | Performance | Medium |
| 4 | Non-JSON Column Type for Array Casts | Reliability | Medium |
| 5 | Missing Integer Cast on Numeric Columns | Reliability | Low |

## Repository-Wide Cross-Cutting Patterns

- Primitive casts are the most commonly used cast type but also the most commonly omitted — developers often rely on PHP's type coercion instead of explicit casts
- `decimal:N` for monetary values is a widely known best practice but frequently violated in legacy code
- JSON column type mismatches (VARCHAR instead of JSON) are a recurring source of silent data loss

---

## 1. Float Cast for Monetary Values

### Category
Reliability

### Description
Using `float` or `double` cast for monetary or price columns instead of `decimal:N`. Float precision errors accumulate over arithmetic operations, causing accounting discrepancies that may only be discovered during reconciliation.

### Why It Happens
Developers may not understand IEEE 754 floating-point precision limitations. The `float` cast seems natural for numbers with decimals. Monetary values stored as `DECIMAL` in the database but cast as `float` in PHP introduce precision loss at the application layer.

### Warning Signs
- `'price' => 'float'` or `'tax' => 'float'` in `$casts`
- Rounding errors in arithmetic: `0.1 + 0.2 !== 0.3`
- Accounting reports that don't balance by a few cents
- `(float)` type casts in monetary calculation code
- Tests that assert floating-point equality with `assertEquals` instead of `assertEqualsWithDelta`

### Why Harmful
- Float precision errors cause accounting reconciliation failures
- A single penny error per transaction scales to thousands of dollars at volume
- Financial audits may fail due to unexplained discrepancies
- Rounding errors compound with each arithmetic operation
- Hard to detect: most float values round-trip correctly, but edge cases fail silently

### Consequences
- Customer billing errors (overcharge or undercharge)
- Accounting reconciliation failures requiring manual correction
- Financial audit non-compliance
- Hard-to-debug rounding issues that manifest only at specific value ranges
- Loss of customer trust from billing discrepancies

### Preferred Alternative
```php
protected $casts = [
    'price' => 'decimal:2',  // Exact precision for monetary values
    'tax' => 'decimal:4',    // Higher precision for intermediate calculations
];
```

### Refactoring Strategy
1. Identify all `float` casts applied to monetary columns via `'float'` or `'double'` search
2. Change to `decimal:N` with N matching the required precision (2 for prices, 4 for tax rates)
3. Update the database column type to `DECIMAL(10, N)` if not already
4. Verify existing data for precision errors — consider a data migration for affected records
5. Run accounting test suite to validate no remaining precision issues

### Detection Checklist
- [ ] Search for `=> 'float'` and `=> 'double'` in model `$casts` arrays
- [ ] Cross-reference cast types with column names suggesting monetary values (price, cost, fee, tax, total, amount)
- [ ] Check for float arithmetic in monetary calculation methods
- [ ] Verify database column type is `DECIMAL` not `FLOAT`
- [ ] Run `0.1 + 0.2 === 0.3` test on all monetary casts

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use decimal:N for Monetary Values, Never float |
| Rule | `05-rules.md` — Use int Cast for Integer Columns |
| Decision Tree | `07-decision-trees.md` — Monetary Value Storage Type |
| Skill | `06-skills.md` — Configure Primitive Casts for Type Consistency |

---

## 2. Missing Boolean Cast on Boolean Columns

### Category
Reliability

### Description
Failing to register a `boolean` cast for database columns that store boolean values (TINYINT, BOOLEAN). Without the cast, Eloquent returns `0` or `1` as integers, leading to PHP truthiness bugs.

### Why It Happens
The database column works without the cast — `$user->is_active` returns `0` or `1`, which PHP treats as falsy/truthy in most contexts. The bug only appears in specific cases like `@if('0')` in Blade, which evaluates to true because the string `'0'` is truthy in PHP.

### Warning Signs
- No `boolean` cast for columns named `is_*`, `has_*`, or `should_*`
- Blade templates using `@if($user->is_active)` that behave unexpectedly
- Strict comparison using `=== true` that fails for integer `1`
- Truthiness bugs reported in views but not in controllers
- Inconsistently cast booleans across models for similarly named columns

### Why Harmful
- `@if('0')` in Blade evaluates to `true` (string `'0'` is truthy in PHP)
- Strict comparisons (`$model->is_active === true`) fail for integer `1`
- JSON serialization outputs `0` and `1` instead of `false` and `true`
- Behavior differs between database drivers (MySQL returns integer `1`, PostgreSQL returns boolean `true`)
- Form checkboxes and API consumers receive unexpected types

### Consequences
- Blade template rendering bugs that are hard to reproduce consistently
- API responses with integer `0`/`1` instead of `false`/`true`
- Strict comparison failures in authorization checks and business logic
- Inconsistent boolean handling across the codebase
- Time wasted debugging truthiness edge cases

### Preferred Alternative
```php
protected $casts = [
    'is_admin' => 'boolean',
    'is_active' => 'boolean',
    'is_verified' => 'boolean',
];
```

### Refactoring Strategy
1. Identify all boolean-like database columns (is_*, has_*, flags)
2. Add `'boolean'` cast for each in the model's `$casts` array
3. Audit all strict boolean comparisons (`===`) that may now pass correctly
4. Verify Blade templates no longer need workarounds like `@if((bool) $user->is_active)`
5. Update API documentation to reflect `true`/`false` in responses

### Detection Checklist
- [ ] Search for `is_` or `has_` column names missing from `$casts`
- [ ] Check for `@if($model->` patterns in Blade templates
- [ ] Inspect JSON API responses for integer `0`/`1` instead of boolean
- [ ] Verify all models with boolean columns have explicit `boolean` casts
- [ ] Test strict equality `$model->is_active === true` without cast

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use bool Cast for Boolean Database Columns |
| Decision Tree | `07-decision-trees.md` — Boolean Column Casting Strategy |
| Skill | `06-skills.md` — Configure Primitive Casts for Type Consistency |

---

## 3. Serialization Instead of JSON/Array Cast

### Category
Performance

### Description
Using PHP serialization (`object` or `serialize`) for JSON database columns instead of `array` cast. Serialized data is opaque to the database, cannot be queried via JSON functions, and breaks when PHP serialization format changes.

### Why It Happens
Legacy code predating Laravel's JSON column support. Copy-pasted patterns from older projects. Developers unfamiliar with MySQL/SQLite JSON path queries defaulting to serialization as the "standard" PHP storage method.

### Warning Signs
- `'metadata' => 'object'` for JSON-like columns
- Database column values starting with `O:`, `a:`, `s:` (PHP serialization prefix)
- Inability to run `JSON_EXTRACT()` queries against the column in MySQL workbench
- Database exports showing PHP-serialized strings instead of readable JSON
- Migration code that manually calls `serialize()`/`unserialize()` for model attributes

### Why Harmful
- SQL queries cannot filter or search serialized data — no WHERE clause on attribute values
- Database reports and BI tools cannot read serialized PHP data
- Switching to a non-PHP system (Go, Python) requires rewriting all serialized data
- PHP serialization format changes between versions can corrupt stored data
- Debugging and manual database inspection is significantly harder

### Consequences
- Reporting queries must load all records into PHP for filtering
- Database migration to non-PHP systems requires full data migration
- PHP version upgrades risk deserialization failures
- BI and analytics tools cannot access the data directly
- Opaque data in database backups and exports

### Preferred Alternative
```php
protected $casts = [
    'metadata' => 'array', // JSON — queryable, interoperable
];
```

### Refactoring Strategy
1. Identify all `object` casts that store JSON-like data (not PHP-specific types)
2. Add a new JSON column alongside the existing one
3. Write a migration to populate the JSON column with `json_decode(unserialize($old_value))`
4. Update the model cast from `'object'` to `'array'`
5. Remove the old serialized column after verification
6. Update any raw SQL queries to use JSON path syntax

### Detection Checklist
- [ ] Search for `=> 'object'` in model `$casts` arrays
- [ ] Sample database column values for PHP serialization markers
- [ ] Check for `serialize(` and `unserialize(` calls in model attribute handling
- [ ] Verify if the data is truly PHP-specific or just structured data
- [ ] Test JSON_* query functions against the column type

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Prefer array Cast Over Serialization for JSON Storage |
| Decision Tree | `07-decision-trees.md` — JSON Column Hydration Approach |
| Skill | `06-skills.md` — Configure Primitive Casts for Type Consistency |

---

## 4. Non-JSON Column Type for Array Casts

### Category
Reliability

### Description
Using `VARCHAR` or `TEXT` column types in migrations for attributes cast as `array`, `object`, or `collection`. VARCHAR truncates long JSON data silently, TEXT lacks JSON validation and query support.

### Why It Happens
Default migration column types (`string()`, `text()`) are more familiar than `json()`. Developers may not know the database engine supports JSON columns. Tables created before JSON columns were added to the schema builder are never updated.

### Warning Signs
- `$table->string('metadata', 255)` for a column cast as `array`
- `$table->text('metadata')` instead of `$table->json('metadata')`
- JSON truncation errors reported as "data lost" with no error message
- Column type in `SHOW CREATE TABLE` shows `varchar(255)` or `text` instead of `json`
- Migration files using `string()` for columns with `array` casts

### Why Harmful
- VARCHAR(255) silently truncates JSON data longer than 255 characters — data loss without errors
- TEXT columns store valid JSON but lack JSON validation and path query support
- JSON functions (`JSON_EXTRACT`, `JSON_CONTAINS`) may not work or may return incorrect results
- Migrating column type later requires a full table rewrite (downtime on large tables)
- The database cannot enforce JSON format validity

### Consequences
- Silent data loss for records with complex JSON structures
- Inability to use database JSON path queries for reporting
- Difficult database migration later when JSON features are needed
- Data integrity issues when truncated JSON is stored and retrieved
- Schema-as-truth mismatch: the cast says "array" but the column says "varchar"

### Preferred Alternative
```php
// Migration
Schema::table('users', function (Blueprint $table) {
    $table->json('metadata')->nullable();
});

// Model cast
protected $casts = [
    'metadata' => 'array',
];
```

### Refactoring Strategy
1. Identify all `array`/`object`/`collection` casts on non-JSON columns
2. Write a migration to change the column type to `JSON`
3. For VARCHAR columns with truncated data, run a data audit first
4. Use `MODIFY COLUMN` with `json` type (may require table lock)
5. Update the model cast if needed (usually stays the same)

### Detection Checklist
- [ ] Cross-reference `$casts` entries with migration column definitions
- [ ] Search for `->string(` and `->text(` in migrations and compare with array-cast columns
- [ ] Inspect column types via `SHOW CREATE TABLE` for JSON-cast columns
- [ ] Test inserting a JSON blob >255 chars into VARCHAR columns
- [ ] Verify JSON path queries work on the column

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use JSON Column Type for array/object/collection Casts |
| Skill | `06-skills.md` — Configure Primitive Casts for Type Consistency |

---

## 5. Missing Integer Cast on Numeric Columns

### Category
Reliability

### Description
Failing to register an `integer` cast for numeric database columns. Without the cast, Eloquent returns integer columns as strings from some database drivers (PostgreSQL, SQLite), causing type-strict comparison failures.

### Why It Happens
MySQL returns integers as PHP integers natively, so the cast is not needed for MySQL development. The issue only appears in PostgreSQL or SQLite environments, often discovered late in deployment. Developers may not test against multiple database drivers.

### Warning Signs
- No `integer` cast for columns storing whole numbers (quantity, count, score)
- Intermittent test failures in CI (where SQLite is used) but not locally (where MySQL is used)
- `===` strict comparison failures between model attributes and integers
- String concatenation instead of addition: `$model->count + 1` producing `"101"` instead of `11`
- `gettype($model->count)` returning `string` in non-MySQL environments

### Why Harmful
- Type-strict comparisons fail silently — `$model->total_cents === 100` returns `false` for string `'100'`
- Arithmetic operations may produce string concatenation instead of addition
- JSON serialization outputs string `"100"` instead of integer `100`
- Behavior varies by database driver — works in MySQL, breaks in PostgreSQL
- Type hints in method signatures (`int $count`) cause runtime type errors with string values

### Consequences
- Intermittent bugs that only appear in certain environments
- API responses returning string types for integer fields
- Strict type declaration failures in PHP 8+ with `declare(strict_types=1)`
- Hard-to-debug environment-specific issues
- Inconsistent type behavior across development, testing, and production

### Preferred Alternative
```php
protected $casts = [
    'total_cents' => 'integer',
    'quantity' => 'integer',
    'sort_order' => 'integer',
];
```

### Refactoring Strategy
1. Identify all numeric columns missing integer casts
2. Add `'integer'` cast for each in the model's `$casts` array
3. Audit all strict comparisons (`===`) involving these attributes
4. Verify JSON serialization outputs integers (not strings)
5. Test with SQLite/PostgreSQL to confirm consistency

### Detection Checklist
- [ ] Search for numeric column names (count, total, quantity, score, rank) missing from `$casts`
- [ ] Check `gettype()` of model attributes in PostgreSQL/SQLite environments
- [ ] Inspect JSON API responses for string-typed integer fields
- [ ] Review strict type declarations that receive model attributes
- [ ] Test `$model->count + 1` for correct arithmetic behavior

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use int Cast for Integer Columns |
| Skill | `06-skills.md` — Configure Primitive Casts for Type Consistency |
