# Phase 5: Rules — Builder Fundamentals

## Rule 1: Always Terminate Builder Chains with a Terminal Method
---
## Category
Framework Usage
---
## Rule
Always append a terminal method (`get`, `first`, `paginate`, `count`, `cursor`, `chunk`) to every Eloquent or Query Builder chain used for data retrieval.
---
## Reason
A builder chain without a terminal method returns a `Builder` instance instead of results, leading to silent bugs when the value is passed to views or iterated. The builder is only executed when a terminal method is called.
---
## Bad Example
```php
// Returns Builder, not results — no terminal method
$users = User::where('active', true);
return view('users.index', compact('users')); // passes Builder to view
```
---
## Good Example
```php
$users = User::where('active', true)->get();
return view('users.index', compact('users')); // Collection expected
```
---
## Exceptions
No common exceptions. Every retrieval-oriented chain must end with a terminal method.
---
## Consequences Of Violation
Maintenance burden from silent type errors; unexpected behavior when Builder instance is serialized or iterated; debugging time wasted on non-obvious failures.

## Rule 2: Never Reuse Builder Instances Across Separate Queries
---
## Category
Maintainability
---
## Rule
Never store a builder instance in a variable and reuse it for multiple independent queries after adding constraints incrementally.
---
## Reason
Builder state is mutable — each `where()`, `orderBy()`, or other constraint mutates the same instance. Reusing a builder carries over all previously added constraints, producing incorrect SQL for the second query.
---
## Bad Example
```php
$builder = User::where('active', true);
$admins = $builder->where('role', 'admin')->get(); // includes 'active'
$editors = $builder->where('role', 'editor')->get(); // ALSO includes 'active' AND 'admin'
```
---
## Good Example
```php
$activeAdmins = User::where('active', true)->where('role', 'admin')->get();
$activeEditors = User::where('active', true)->where('role', 'editor')->get();
```
---
## Exceptions
When explicitly cloning the builder before adding unique constraints: `$builder2 = clone $builder1; $builder2->where(...)`.
---
## Consequences Of Violation
Incorrect query results that are difficult to debug; regression bugs when constraint order changes; data leaks when reused builders include unexpected filters.

## Rule 3: Use Parameterized Bindings Instead of String Interpolation in Raw Expressions
---
## Category
Security
---
## Rule
Use `?` placeholders and pass values as bindings in `whereRaw`, `havingRaw`, `orderByRaw`, and `DB::raw()` calls. Never concatenate user input into SQL strings.
---
## Reason
String interpolation of user input into SQL strings creates SQL injection vulnerabilities. Parameterized bindings escape values safely and are immune to injection, regardless of the input content.
---
## Bad Example
```php
$users = User::whereRaw("email = '$input'")->get(); // SQL injection
```
---
## Good Example
```php
$users = User::whereRaw('email = ?', [$input])->get();
```
---
## Exceptions
`DB::raw()` expressions that contain no user input and are purely static SQL fragments (e.g., `DB::raw('COUNT(*) as count')`). Even then, prefer native builder methods when available.
---
## Consequences Of Violation
Critical SQL injection vulnerability; data exfiltration or destruction; compliance violations (PCI-DSS, HIPAA, SOC2).

## Rule 4: Use `where` Closure Syntax for Nested OR/AND Logic Instead of Raw Boolean Expressions
---
## Category
Maintainability
---
## Rule
Use `where(fn $q => ...)` closures to group nested OR/AND conditions. Avoid constructing boolean logic with raw `OR`, `AND` strings.
---
## Reason
Closure syntax generates proper SQL parenthesization automatically, produces cleaner code, and prevents mismatched parentheses errors that are common with raw boolean grouping.
---
## Bad Example
```php
$users = User::where('status', 'active')
    ->where('role', 'admin')
    ->orWhere('role', 'super-admin') // wrong: OR applies to entire WHERE
    ->get();
```
---
## Good Example
```php
$users = User::where('status', 'active')
    ->where(function ($q) {
        $q->where('role', 'admin')->orWhere('role', 'super-admin');
    })
    ->get();
```
---
## Exceptions
Simple `OR` between two columns where parenthesization is not required and the intent is obvious.
---
## Consequences Of Violation
Incorrect query results due to operator precedence; debugging time; subtle logic bugs that are hard to catch in code review.

## Rule 5: Use `chunkById` or `cursor` Instead of `get` for Result Sets Exceeding 1000 Rows
---
## Category
Performance
---
## Rule
Use `chunkById($count, $callback)` or `cursor()` for processing result sets larger than 1000 rows. Never use `get()` to load all results into memory for large datasets.
---
## Reason
`get()` loads the entire result set into PHP memory, which causes memory exhaustion crashes on datasets exceeding available memory (typical limit: ~2-4KB per model). `chunkById` processes rows in batches; `cursor()` streams rows one at a time.
---
## Bad Example
```php
User::where('active', true)->get()->each(fn($user) => $user->sendEmail()); // OOM on large sets
```
---
## Good Example
```php
User::where('active', true)->chunkById(100, fn($users) => $users->each->sendEmail());
// or
User::where('active', true)->cursor()->each(fn($user) => $user->sendEmail());
```
---
## Exceptions
APIs or endpoints where the consumer paginates results (results are naturally bounded to < 1000 rows). Admin dashboards with pre-counted small datasets.
---
## Consequences Of Violation
Memory exhaustion crashes on production; PHP process killed by OOM killer; downtime while debugging memory issues; connection timeouts for large exports.

## Rule 6: Prefer `select(['id', 'name'])` to Limit Hydration and Data Transfer
---
## Category
Performance
---
## Rule
Use `select()` to specify only the columns actually needed when querying models, especially in listing endpoints, APIs, and export jobs.
---
## Reason
Hydrating unused columns consumes CPU (2-5µs per extra column) and memory (~2-4KB per model for the full row). Column selection reduces transfer bandwidth from the database, speeds up hydration, and decreases memory footprint.
---
## Bad Example
```php
// Fetches all columns from users table
$users = User::where('active', true)->get(['id', 'name', 'email']);
```
---
## Good Example
```php
$users = User::where('active', true)->get(['id', 'name', 'email']); // Already good, but be explicit
// Even better when only these are needed:
$users = User::where('active', true)->select('id', 'name', 'email')->get();
```
---
## Exceptions
When all model attributes are needed for downstream processing (e.g., serialization to API resources that include every field). When `select()` interferes with eager loading constraints.
---
## Consequences Of Violation
Unnecessary database I/O and memory consumption; slower response times on list endpoints; higher hosting costs from inefficient queries.

## Rule 7: Use `dd()` or `toSql()` During Development to Verify SQL Output
---
## Category
Maintainability
---
## Rule
Use `$query->dd()` or `$query->toSql()` during development to verify that complex builder chains produce the expected SQL. Remove or guard these calls before committing.
---
## Reason
Builder chains with scopes, conditional clauses, and subqueries can produce surprising SQL. Debugging aids catch logical errors early, before they cause data corruption or incorrect results in production.
---
## Bad Example
```php
// Deployed without verifying the SQL
User::whereHas('orders', fn($q) => $q->where('total', '>', 100))
    ->whereDoesntHave('bans')
    ->where('active', true)
    ->get();
```
---
## Good Example
```php
// During development
$sql = User::whereHas('orders', fn($q) => $q->where('total', '>', 100))
    ->whereDoesntHave('bans')
    ->where('active', true)
    ->toSql();
dump($sql);
```
---
## Exceptions
Production monitoring code should never include `dd()` or `dump()`. Use `toSql()` in logging, not tinker commands, if needed for diagnostics.
---
## Consequences Of Violation
Deployment of incorrect queries that return wrong data; expensive debugging of SQL logic that could have been caught in development.

## Rule 8: Prefer Eloquent Builder API Over `DB::raw()` for Standard SQL Clauses
---
## Category
Maintainability
---
## Rule
Use Eloquent's native constraint methods (`where`, `orderBy`, `groupBy`, `having`) instead of `DB::raw()` for all standard SQL clauses that the builder supports natively.
---
## Reason
Native methods provide type safety, automatic binding management, database-agnostic SQL generation, and IDE autocompletion. `DB::raw()` bypasses all these benefits and makes the code harder to maintain and port across database drivers.
---
## Bad Example
```php
User::where(DB::raw('DATE(created_at)'), '>=', $date)->get();
```
---
## Good Example
```php
User::where('created_at', '>=', $date)->get();
```
---
## Exceptions
Database-specific features not supported by the builder (JSON operators, CTEs, full-text indexes, window functions). Complex reporting queries where `DB::raw()` is used inside `select()` for aggregation.
---
## Consequences Of Violation
Reduced portability across database drivers; manual binding management errors; harder-to-read code that mixes abstraction levels.

## Rule 9: Never Reuse Builder After Terminal Method Execution
---
## Category
Reliability
---
## Rule
Do not reuse an Eloquent or Query Builder instance to build a new query after a terminal method has been called on it.
---
## Reason
Builder state after execution is undefined — internal flags like `$scopesApplied` are set, and certain constraints may have been processed. Reusing the builder produces unpredictable SQL.
---
## Bad Example
```php
$builder = User::where('active', true);
$count = $builder->count();
$users = $builder->get(); // undefined behavior after count()
```
---
## Good Example
```php
$count = User::where('active', true)->count();
$users = User::where('active', true)->get();
```
---
## Exceptions
No common exceptions. Always create a fresh builder instance for separate queries.
---
## Consequences Of Violation
Intermittent query failures; unpredictable SQL output that varies by execution order; debugging nightmares in concurrent or async contexts.

## Rule 10: Extract Builder Chains Longer Than 20 Methods to Scopes or Query Objects
---
## Category
Maintainability
---
## Rule
Extract any Eloquent builder chain exceeding 20 methods into named local scopes, custom builder methods, or dedicated query objects.
---
## Reason
Long chains are unreadable, untestable, and impossible to reuse. Each constraint becomes harder to reason about, and extracting into named methods documents intent while enabling reuse and unit testing.
---
## Bad Example
```php
$users = User::where(...)->where(...)->whereHas(...)->with(...)->orderBy(...)->where(...)
    ->whereHas(...)->withCount(...)->having(...)->orderBy(...)->where(...)->whereNotNull(...)
    ->orWhere(...)->where(...)->limit(...)->offset(...)->get(); // 20+ methods
```
---
## Good Example
```php
User::query()
    ->active()
    ->withRecentOrders()
    ->eligibleForPromotion()
    ->paginate();
```
---
## Exceptions
Generated or scaffolded query code. Migration seeders where readability is secondary. One-time data migration scripts.
---
## Consequences Of Violation
Low code reusability; difficult debugging; high cognitive load when reading query logic; duplication when the same chain appears in multiple places.

## Rule 11: Use `where($column, $operator, $value)` Three-Argument Form for Non-Equality Comparisons
---
## Category
Framework Usage
---
## Rule
Always pass three arguments to `where()` when using comparison operators other than `=`: `where('age', '>', 18)`. Never pass the operator as the second argument without distinguishing it from equality.
---
## Reason
The two-argument form `where('age', 18)` is equality. The three-argument form `where('age', '>', 18)` is a range comparison. Mixing these up silently produces incorrect SQL.
---
## Bad Example
```php
$users = User::where('age', '>', 18)->get(); // correct
$users = User::where('age', 18)->get(); // equality — different meaning
```
---
## Good Example
```php
$users = User::where('age', '>', 18)->get();
$users = User::where('age', 18)->get();
```
---
## Exceptions
No common exceptions. Always be explicit about operator intent.
---
## Consequences Of Violation
Incorrect query results returning wrong data; subtle bugs that evade code review because the second argument is mistaken for a value.
