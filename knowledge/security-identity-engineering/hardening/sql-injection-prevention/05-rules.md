# Rules: SQL Injection Prevention

## Use Eloquent ORM or Query Builder for All Database Queries
---
## Category
Security
---
## Rule
Use Eloquent models, query builder, or raw parameter binding for all database queries. Never concatenate user input into SQL strings.
---
## Reason
Eloquent and the query builder use PDO prepared statements, which separate SQL structure from data. Concatenated SQL strings mix structure and data, allowing an attacker to inject SQL commands through user input.
---
## Bad Example
```php
$users = DB::select("SELECT * FROM users WHERE email = '$email'"); // SQL injection
```
---
## Good Example
```php
$users = DB::table('users')->where('email', $email)->get(); // Parameter binding
```
---
## Exceptions
No common exceptions — parameterization is mandatory for all queries.
---
## Consequences Of Violation
SQL injection, data exfiltration, data destruction.
---

## Use Named or Positional Bindings in Raw SQL
---
## Category
Security
---
## Rule
When raw SQL is necessary, use named bindings (`:name`) or positional (`?`) parameters. Never interpolate variables into the SQL string.
---
## Reason
Named/positional bindings use PDO parameterization — the database driver separates the SQL structure from the values. Interpolated variables are concatenated into the SQL string, breaking the structure/value separation and enabling injection.
---
## Bad Example
```php
DB::select("SELECT * FROM users WHERE id = {$id}"); // Interpolation — SQL injection
```
---
## Good Example
```php
DB::select("SELECT * FROM users WHERE id = :id", ['id' => $id]); // Named binding
```
---
## Exceptions
No common exceptions — parameter binding is required in all raw SQL.
---
## Consequences Of Violation
SQL injection through raw queries.
---

## Validate and Cast IDs and Integers Before Querying
---
## Category
Security
---
## Rule
Cast route/model IDs to integers or validate them as numeric before using in queries. Use `(int)`, `intval()`, or `Route::whereNumber()`.
---
## Reason
Even with parameter binding, non-numeric IDs passed to the database may cause unexpected behavior or type-based attacks. Route model binding does this automatically for route keys, but explicit casting in custom queries is safer.
---
## Bad Example
```php
$post = DB::table('posts')->where('id', $request->input('id'))->first(); // No type cast
```
---
## Good Example
```php
$post = DB::table('posts')->where('id', (int) $request->input('id'))->first(); // Cast to int
```
```php
Route::get('/posts/{post}', ...)->whereNumber('post'); // Route-level integer validation
```
---
## Exceptions
No common exceptions — ID casting is a simple, effective defense.
---
## Consequences Of Violation
Unexpected query behavior, potential type confusion.
---

## Use Validation Rules to Reject Suspicious Input Patterns
---
## Category
Security
---
## Rule
Use Laravel validation rules (`string`, `max`, `regex` patterns) to restrict input that will be used in database queries, especially for `LIKE` clauses and full-text search.
---
## Reason
While parameterization prevents SQL injection, some query patterns (`LIKE`, `MATCH AGAINST`) may still be vulnerable to special characters that affect query logic. Validation rules restrict acceptable input and reduce the attack surface.
---
## Bad Example
```php
$results = DB::table('posts')->where('title', 'LIKE', "%{$request->search}%");
// No length limit — attacker could send 10MB string
```
---
## Good Example
```php
$request->validate(['search' => 'string|max:200|regex:/^[a-zA-Z0-9\s]+$/']);
$results = DB::table('posts')->where('title', 'LIKE', "%{$request->search}%");
```
---
## Exceptions
No common exceptions — validate all search and query inputs.
---
## Consequences Of Violation
DoS through oversized queries, special character exploitation.
---

## Use Model::find() and Route Model Binding to Avoid Manual ID Queries
---
## Category
Architecture
---
## Rule
Use `Model::find($id)` or route model binding for resource lookups. Avoid manual `DB::table()->where('id', $id)->first()` patterns.
---
## Reason
`Model::find()` leverages Eloquent's parameterization and includes automatic type casting. Route model binding handles lookup and 404 automatically. Manual query builder calls are more error-prone and bypass Eloquent's built-in protections and features.
---
## Bad Example
```php
$post = DB::table('posts')->where('id', $request->id)->first(); // Manual — more error-prone
```
---
## Good Example
```php
$post = Post::findOrFail($request->id); // Eloquent — parameterized, typed
```
```php
// Route: /posts/{post} — automatic lookup and 404
public function show(Post $post) { return $post; }
```
---
## Exceptions
Complex joins or aggregate queries that Eloquent handles poorly.
---
## Consequences Of Violation
More code, more error surface, fewer built-in protections.
---

## Use prepared Statements for Raw DB::update / DB::delete
---
## Category
Security
---
## Rule
Use parameterized `DB::update()` and `DB::delete()` with bindings. Never use `DB::statement()` with concatenated SQL for these operations.
---
## Reason
`DB::update()` and `DB::delete()` accept bindings in the same way as `DB::select()`. They generate prepared statements for safe execution. `DB::statement()` with concatenated values is equally dangerous as inline SQL.
---
## Bad Example
```php
DB::statement("DELETE FROM posts WHERE id = {$id}"); // SQL injection
```
---
## Good Example
```php
DB::table('posts')->where('id', $id)->delete(); // Safe — parameterized
```
---
## Exceptions
No common exceptions — all queries must be parameterized.
---
## Consequences Of Violation
SQL injection through UPDATE and DELETE queries.
---

## Never Log or Display Raw SQL Queries in Production
---
## Category
Security
---
## Rule
Disable SQL query logging and `DB::enableQueryLog()` in production. Never dump or log raw SQL query strings.
---
## Reason
Raw SQL queries may contain user input values, including sensitive data. Logging queries in production exposes this data in log files. Query logging also consumes significant memory and I/O in production.
---
## Bad Example
```php
DB::listen(fn($query) => Log::info($query->sql, $query->bindings)); // Logs queries in production
```
---
## Good Example
```php
// Only enable query logging in local/development
if (app()->environment('local')) {
    DB::enableQueryLog();
}
```
---
## Exceptions
Debugging production issues with temporary logging — ensure no sensitive data in queries.
---
## Consequences Of Violation
Sensitive data leakage via production logs, memory exhaustion.
