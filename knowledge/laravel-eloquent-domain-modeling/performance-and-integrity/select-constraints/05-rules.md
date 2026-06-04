## Never Save Partial Models
---
## Category
Reliability
---
## Rule
Do not call `save()` on a model instance that was loaded with `select()` — always load the full model before writes.
---
## Reason
A partial model has only the selected columns loaded. Calling `save()` writes all loaded attributes to the database; unloaded columns are set to their default values or `null`, silently overwriting existing data.
---
## Bad Example
```php
$user = User::select('id', 'name')->find($id);
$user->name = 'New Name';
$user->save();
// email, password, role are all set to null/default in the database
```
---
## Good Example
```php
$user = User::find($id); // All columns loaded
$user->name = 'New Name';
$user->save();
// Only changed columns are written (if using ->save with $fillable)
```
---
## Exceptions
Display-only code paths where the model is never persisted. Partial models are safe for read operations.
---
## Consequences Of Violation
Silent data loss — unloaded columns are overwritten with null/default values. This corruption is difficult to detect because it only affects specific update paths and may not be noticed until a user reports missing data.
---
## Always Include the Foreign Key in Constrained Eager Loading
---
## Category
Reliability
---
## Rule
When constraining the SELECT in an eager load, always include the foreign key column that Eloquent uses for relationship matching.
---
## Reason
Eloquent matches eager-loaded relations by hydrating the foreign key on the child model and comparing it to the parent's key. If the foreign key is excluded from `select()`, all child rows fail to match any parent — they load but never attach. The effect is silent: no error, but relationships appear empty.
---
## Bad Example
```php
Post::with(['comments' => fn($q) => $q->select('id', 'body')])->get();
// 'post_id' is missing — comments load but never attach to posts
// Each post's ->comments is an empty collection
```
---
## Good Example
```php
Post::with(['comments' => fn($q) => $q->select('id', 'post_id', 'body')])->get();
// Foreign key included — comments attach correctly to their posts
```
---
## Exceptions
No common exceptions. Always include the foreign key in constrained eager loading selects.
---
## Consequences Of Violation
Empty relationships on all parents. The application shows "no comments" for every post even though comments exist in the database. Debugging this is time-consuming because no error is thrown.
---
## Use $hidden for Serialization, select() for I/O Reduction
---
## Category
Performance
---
## Rule
Use `$hidden` to control API response payload, but use `select()` to prevent loading unnecessary columns from the database.
---
## Reason
`$hidden` only filters serialization output — the data is still loaded from the database, transferred over the network, and occupies memory. `select()` prevents the column from being fetched at all, reducing I/O, network transfer, and memory usage.
---
## Bad Example
```php
class Post extends Model
{
    protected $hidden = ['body'];
}
// body TEXT column (100KB) is still loaded from DB — just hidden in JSON
// 100 posts × 100KB = 10MB transferred from database for nothing
```
---
## Good Example
```php
Post::select('id', 'title', 'excerpt')->get();
// body is never loaded — database I/O is 99% less
// serialization automatically excludes columns not loaded
```
---
## Exceptions
Code paths where the column may be needed conditionally. Use `select()` for the base case and `load()` the column when needed.
---
## Consequences Of Violation
Unnecessary database I/O and memory for columns that are never displayed. For large columns (TEXT, BLOB, JSON), the wasted bandwidth can be the dominant cost of a query.
---
## Use Different Select Sets for List vs. Detail Views
---
## Category
Performance
---
## Rule
Define separate `select()` lists for list/index endpoints (minimal columns) and detail/show endpoints (all needed columns).
---
## Reason
List views typically display only a few fields (id, title, status, date). Detail views show the full record. Using the same `SELECT *` for both loads every column — including large TEXT or JSON columns — on every list query. Differentiating select sets makes list queries lightweight and fast.
---
## Bad Example
```php
// Both endpoints use the same query — no select constraint
class PostController
{
    public function index() {
        return Post::all(); // SELECT * — loads body column for every post
    }
    public function show($id) {
        return Post::findOrFail($id); // SELECT * — needed here
    }
}
```
---
## Good Example
```php
class PostController
{
    public function index() {
        return Post::select('id', 'title', 'excerpt', 'published_at')->paginate(20);
    }
    public function show($id) {
        return Post::select('id', 'title', 'body', 'excerpt', 'published_at')->findOrFail($id);
    }
}
```
---
## Exceptions
Models with only a few columns (< 5) where the differentiation provides negligible benefit.
---
## Consequences Of Violation
List endpoints load large columns unnecessarily, increasing page load time, memory usage, and database I/O. For a table with a 100KB TEXT column, listing 100 rows transfers 10MB of unused data per request.
---
## Never Select Sensitive Columns in Non-Privileged Queries
---
## Category
Security
---
## Rule
Use `select()` to exclude sensitive columns (SSN, password reset tokens, internal notes) from queries — do not rely solely on `$hidden`.
---
## Reason
`$hidden` prevents serialization but the data is still loaded into PHP memory. Sensitive data can be exposed through debugging tools (Debugbar, Telescope), memory dumps, or serialization edge cases. `select()` prevents the data from leaving the database entirely.
---
## Bad Example
```php
class User extends Model
{
    protected $hidden = ['ssn', 'password_reset_token'];
}
// SSN still loaded from DB on every User::all() — visible in Debugbar
```
---
## Good Example
```php
// In controller:
User::select('id', 'name', 'email')->paginate(20);
// SSN never leaves the database — not loaded, not exposed
```
---
## Exceptions
Admin-only endpoints where the caller is explicitly authorized to access sensitive data.
---
## Consequences Of Violation
Data breach risk. Sensitive columns are present in PHP memory, query logs, and debugging tool output. A misconfigured debug toolbar or log file exposes PII to unauthorized viewers.
