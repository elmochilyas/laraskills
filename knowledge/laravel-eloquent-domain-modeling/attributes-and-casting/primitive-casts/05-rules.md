## Use decimal:N for Monetary Values, Never float
---
## Category
Reliability
---
## Rule
Use `decimal:N` cast for all monetary and price columns. Never use `float` or `integer` for monetary values.
---
## Reason
`float` introduces precision errors (0.1 + 0.2 !== 0.3) causing accounting discrepancies. `integer` loses fractional values. `decimal:N` stores values as precise strings with exact decimal places, eliminating rounding errors.
---
## Bad Example
```php
protected $casts = [
    'price' => 'float',   // Precision errors on arithmetic
    'tax' => 'float',     // Accounting discrepancies
];
```
---
## Good Example
```php
protected $casts = [
    'price' => 'decimal:2',  // Exact precision for monetary values
    'tax' => 'decimal:4',    // Higher precision for intermediate calculations
];
```
---
## Exceptions
When using value objects (e.g., `brick/money`) with custom casts that handle precision internally, the cast itself manages the storage format.
---
## Consequences Of Violation
Accounting reconciliation failures, customer billing errors, hard-to-debug rounding issues, financial audit non-compliance.

---
## Use bool Cast for Boolean Database Columns
---
## Category
Reliability
---
## Rule
Always register a `bool` or `boolean` cast for columns that represent boolean values. Do not rely on integer truthiness in PHP.
---
## Reason
Without `bool` cast, boolean database columns return `0` or `1` as integers. Integer truthiness causes subtle bugs in Blade conditionals (`@if($user->is_active)` evaluates to true for both 0 and '0') and strict comparisons.
---
## Bad Example
```php
protected $casts = [
    // 'is_admin' not cast — returns 0 or 1 as integer
];
```
---
## Good Example
```php
protected $casts = [
    'is_admin' => 'boolean',
    'is_active' => 'boolean',
    'is_verified' => 'boolean',
];
```
---
## Exceptions
When the database column uses a custom boolean representation (e.g., 'Y'/'N'), use a custom cast or mutator instead.
---
## Consequences Of Violation
Blade template truthiness bugs (`@if(0)` is false but `@if('0')` is true), strict equality failures, unexpected behavior in conditionals, hard-to-find bugs in views.

---
## Prefer array Cast Over Serialization for JSON Storage
---
## Category
Performance
---
## Rule
Use `array` cast for JSON database columns instead of PHP serialization. Ensure the database column type is `JSON`.
---
## Reason
JSON columns with `array` cast are queryable via MySQL/SQLite/PostgreSQL JSON functions and readable by non-PHP systems. PHP serialization is opaque to the database, cannot be queried, and breaks when PHP serialization format changes.
---
## Bad Example
```php
protected $casts = [
    'metadata' => 'object', // Serialized PHP — opaque to database
];
```
---
## Good Example
```php
protected $casts = [
    'metadata' => 'array', // JSON — queryable, interoperable
];
```
---
## Exceptions
When storing PHP-specific data types (e.g., closures, resource handles) that cannot be JSON-encoded, serialization is necessary but should be documented and minimized.
---
## Consequences Of Violation
Inability to use JSON path queries for reporting, data locked to PHP ecosystem, migration difficulties if switching away from PHP, opaque data in database exports.

---
## Use JSON Column Type for array/object/collection Casts
---
## Category
Reliability
---
## Rule
Always define JSON columns with `$table->json('column')` in migrations when using `array`, `object`, or `collection` casts. Never use `string` or `text` without length validation.
---
## Reason
`JSON` column types validate JSON format at the database level, support JSON path queries, and have no practical length limit. `VARCHAR` truncates long JSON, causing silent data loss. `TEXT` works but lacks JSON validation and query support.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('metadata', 255); // Truncates long JSON
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->json('metadata')->nullable(); // Full JSON support
});
```
---
## Exceptions
When the database engine does not support JSON column types (older MySQL, SQLite), use `TEXT` as a fallback.
---
## Consequences Of Violation
Silent JSON truncation in VARCHAR columns, inability to use database JSON functions, migration failures when switching column types later.

---
## Use int Cast for Integer Columns
---
## Category
Reliability
---
## Rule
Register `integer` or `int` cast for all columns that store whole numbers. Do not rely on PHP's automatic type coercion.
---
## Reason
Without `int` cast, Eloquent returns integer columns as strings from some database drivers (PostgreSQL, SQLite). This causes type-strict comparison failures and unexpected behavior in arithmetic operations.
---
## Bad Example
```php
protected $casts = [
    // 'total_cents' returns string from PostgreSQL
];
```
---
## Good Example
```php
protected $casts = [
    'total_cents' => 'integer',
    'quantity' => 'integer',
    'sort_order' => 'integer',
];
```
---
## Exceptions
When the column stores values that exceed PHP's `PHP_INT_MAX` on 32-bit systems, leave it as a string to avoid overflow.
---
## Consequences Of Violation
Type-strict comparison failures (`$model->total_cents === 100` returns false for string '100'), string concatenation instead of addition, database-driver-dependent return types.
