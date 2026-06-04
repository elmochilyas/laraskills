# Phase 5: Rules — Model Conventions

## Rule: Rely on Conventions for New Projects
---
## Category
Design
---
## Rule
Use Laravel's naming conventions (snake_case plural table names, `id` primary keys, `{model}_id` foreign keys) for all new projects where you control the database schema.
---
## Reason
Convention-over-configuration is the core productivity promise of Eloquent. Following conventions eliminates boilerplate configuration, reduces the mental model surface, and allows Eloquent's defaults to work without explicit overrides.
---
## Bad Example
```php
// Custom schema with explicit overrides on every model:
class BlogPost extends Model
{
    protected $table = 'wp_blog_posts';
    protected $primaryKey = 'post_identifier';
    public $incrementing = false;
    protected $keyType = 'string';
}
```
---
## Good Example
```php
// Convention-following schema — no configuration needed:
// Table: blog_posts (snake_case plural)
// PK: id (auto-increment integer class BlogPost extends Model { /* no overrides needed */ }
```
---
## Exceptions
Legacy databases, third-party schemas, or organizational naming standards that predate the project must use explicit overrides.
---
## Consequences Of Violation
Unnecessary configuration boilerplate on every model; increased per-model maintenance when renaming conventions change.
---

## Rule: Override `$table` Explicitly When Convention Fails
---
## Category
Reliability
---
## Rule
Always set `$table` explicitly on a model when the table name diverges from the snake_case plural of the class name and never rely on Eloquent's convention alone in that case.
---
## Reason
A silent convention-to-schema mismatch causes reads to return empty or wrong data and writes to create or modify data in the wrong table. The error surfaces only at runtime and is difficult to debug.
---
## Bad Example
```php
class Person extends Model
{
    // Convention gives "people" but the actual table is "persons"
    // All queries silently hit the wrong table or fail
}
```
---
## Good Example
```php
class Person extends Model
{
    protected $table = 'persons'; // Matches actual schema
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent data corruption; operations target the wrong table; debugging misalignment wastes significant development time.
---

## Rule: Specify Foreign Keys Explicitly for Non-Standard Relationships
---
## Category
Reliability
---
## Rule
Always pass the foreign key column name explicitly to relationship methods when the foreign key does not follow the `{model_name}_id` convention.
---
## Reason
Eloquent infers the foreign key from the relationship method name. When the column name diverges, omitting the explicit foreign key silently binds the wrong column, causing relationship queries to return empty sets or wrong records.
---
## Bad Example
```php
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class);
        // Expects 'user_id' — but column is 'author_id'
    }
}
```
---
## Good Example
```php
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
```
---
## Exceptions
Relationship methods that follow the convention exactly may omit the explicit key for brevity.
---
## Consequences Of Violation
Silent wrong-column binding; empty relationship results; data integrity issues when the wrong foreign key is used for constraint operations.
---

## Rule: Use Alphabetical Order for Custom Pivot Tables
---
## Category
Maintainability
---
## Rule
When naming custom pivot tables that do not follow Eloquent's alphabetical convention, use alphabetical singular model names separated by an underscore.
---
## Reason
Alphabetical ordering is Eloquent's default convention. Maintaining this convention for custom pivot tables ensures consistency across the application and prevents confusion about the join order.
---
## Bad Example
```php
// Pivot table named 'role_user' — non-alphabetical order
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }
}
```
---
## Good Example
```php
// Pivot table named 'role_user' — alphabetical order (r before u)
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
        // Convention gives 'role_user' — alphabetical
    }
}
```
---
## Exceptions
Legacy pivot tables with existing non-alphabetical names may be kept; specify the table name explicitly via the second argument.
---
## Consequences Of Violation
Inconsistent pivot naming across the application increases cognitive load; new developers must verify the order in multiple places.
---

## Rule: Test Model-Table Mapping with Schema Assertions
---
## Category
Testing
---
## Rule
Write a schema assertion test for each model that verifies the table exists, the primary key column matches `$primaryKey`, and primary fillable columns are present in the database.
---
## Reason
Schema changes (migration renames, table drops, column removals) silently break model assumptions. A schema assertion test catches the mismatch at test time instead of production runtime.
---
## Bad Example
```php
// No test — a migration renames 'customer_orders' to 'orders'
// Order model still points to 'customer_orders' — queries fail silently
```
---
## Good Example
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
        $this->assertTrue(Schema::hasColumn('customer_orders', 'uuid'));
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Schema-model mismatches go undetected until production; debugging requires correlating a model configuration with migration history, consuming development time under pressure.
---

## Rule: Document Every Convention Override with a Reason
---
## Category
Maintainability
---
## Rule
Add an inline comment to every convention override (`$table`, `$primaryKey`, foreign key in relationships) explaining why the convention does not apply.
---
## Reason
Without context, a future developer cannot distinguish between a deliberate override and a stale configuration that can be cleaned up. The comment preserves the decision's rationale.
---
## Bad Example
```php
class Product extends Model
{
    protected $table = 'catalog_products';
    // No comment — unclear if this is a deliberate override or a leftover
}
```
---
## Good Example
```php
class Product extends Model
{
    // Legacy schema from migrated system — table was named before Laravel convention
    protected $table = 'catalog_products';
}
```
---
## Exceptions
Self-documenting overrides where the column name itself conveys the reason (e.g., `$primaryKey = 'uuid'`) may omit the comment.
---
## Consequences Of Violation
Future developers cannot safely clean up or refactor overrides; stale configuration persists indefinitely because no one knows if it is still needed.
---

## Rule: Prefer Convention Over Configuration at All Times
---
## Category
Design
---
## Rule
Accept Laravel's naming conventions as the default for all new code and override only when the existing database schema forces a divergence.
---
## Reason
Every explicit configuration property is a maintenance point. Conventions eliminate configuration, reduce the number of decisions per model, and make the codebase more predictable for developers familiar with Laravel defaults.
---
## Bad Example
```php
class Post extends Model
{
    protected $table = 'posts';       // Convention gives 'posts' — unnecessary
    protected $primaryKey = 'id';      // Convention gives 'id' — unnecessary
    public $incrementing = true;       // Convention gives true — unnecessary
    protected $keyType = 'int';        // Convention gives 'int' — unnecessary
}
```
---
## Good Example
```php
class Post extends Model
{
    // No configuration needed — table is 'posts', PK is 'id', auto-incrementing int
}
```
---
## Exceptions
A base model may set explicit defaults for documentation purposes, but child models should not repeat them.
---
## Consequences Of Violation
Unnecessary boilerplate on every model creates the illusion of active maintenance while adding zero value; configuration noise obscures meaningful overrides.
