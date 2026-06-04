# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: SQL injection via parameterized bindings
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

SQL injection prevention is built into Laravel's ORM (Eloquent) and query builder through PDO parameterized prepared statements. All queries built with Eloquent's `where()`, the query builder's `whereRaw()` with bindings, and raw expressions with proper bindings are automatically parameterized — the SQL structure and data are sent separately to the database, making it impossible for input to alter the query structure. The risk surface is limited to `raw` methods (`whereRaw`, `selectRaw`, `orderByRaw`) without bindings, dynamic column/table names, and `DB::statement()` with concatenated strings.

---

# Core Concepts

- **Parameterized Binding**: Placeholder (`?` or named `:name`) in SQL. PDO sends the query structure and parameter values separately. Database distinguishes SQL code from data.
- **Eloquent Safety**: All Eloquent queries (`where`, `find`, `first`, `create`, `update`) use parameterized bindings. They are inherently SQL-injection-safe.
- **Query Builder Safety**: Same as Eloquent — parameterized by default when using the fluent API.
- **Raw Methods**: `whereRaw($sql, $bindings)`, `selectRaw($sql, $bindings)`, `havingRaw($sql, $bindings)`, `orderByRaw($sql)`. The $sql string is treated as raw SQL — only the $bindings array values are parameterized. If you concatenate values into the $sql string, you bypass parameterization.
- **Column/Table Names**: Cannot be parameterized. PDO only parameterizes values, not identifiers. Dynamic column or table names must be whitelisted against an allowed set.

---

# Mental Models

- **SQL and Data are Separate Channels**: Think of prepared statements as two channels: one for the SQL template (the query shape), one for the user data. The attacker controls the data channel; they never reach the SQL channel.
- **Raw Methods as Manual Transmission**: Most Laravel query methods are automatic transmission — safe by default. `whereRaw()`, `selectRaw()` are manual transmission — correct only if you use the bindings array properly.

---

# Internal Mechanics

- `Illuminate\Database\Query\Builder` collects `wheres` as an array of [type, column, value, boolean]. On execution, it builds the SQL string with `?` placeholders and passes the values to PDO's `prepare()` and `execute()`.
- `whereRaw($sql, $bindings)` appends `$sql` directly to the query with `?` placeholders replaced manually by PDO. The `$bindings` array is merged into the binding list.
- `DB::select($sql)` without bindings is directly executed — no parameterization unless you use `DB::select($sql, $bindings)`.
- Eloquent's `Model::where()` uses the query builder internally — same protection.

---

# Patterns

## Binding-Only Raw Queries Pattern
- **Purpose**: Use raw SQL features (window functions, complex joins) without injection risk.
- **Implementation**: Always pass the bindings array as the second argument to raw methods.
- **Benefits**: Full SQL feature access with parameterization safety.

## Column Name Whitelist Pattern
- **Purpose**: Dynamic column names in ORDER BY or GROUP BY clauses.
- **Implementation**: Validate against an allow list: `$allowed = ['name', 'date', 'status']; if (!in_array($input, $allowed)) { throw new Exception; }`.
- **Benefits**: Dynamic sorting/grouping without SQL injection.
- **Tradeoffs**: Requires maintaining the allow list; new columns must be added explicitly.

## DB::raw and Binding in Selects
- **Purpose**: Complex SQL expressions in select clauses.
- **Implementation**: `DB::raw('ST_Distance_Sphere(location, ?) as distance', [$point])`.
- **Benefits**: Raw geometry or JSON functions with safe bindings.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Eloquent ORM vs raw SQL | SQL injection risk vs performance | Default to Eloquent for 95% of queries. Reserve raw SQL for complex expressions |
| `whereRaw()` vs multiple `where()` | Readability vs safety | Prefer fluent `where()` chain. Use `whereRaw()` only for expressions that `where()` cannot represent (JSON path, geospatial) |
| Whitelist vs regex for column names | Dynamic identifier handling | Whitelist is safer — regex can have edge cases that pass dangerous identifiers |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| 99% of queries are automatically injection-safe | The remaining 1% (raw methods, dynamic identifiers) require manual care | Developer education is needed for the raw method boundary |
| Parameterized bindings prevent injection even if attacker controls values | Database query planner cannot optimize queries with parameterized values as well (minor) | No meaningful performance difference in practice |

---

# Performance Considerations

- Parameterized queries have a one-time `prepare` cost per query type. The prepared statement can be reused with different parameters, potentially improving performance.
- Raw SQL with bindings has the same performance as parameterized Eloquent queries.
- No performance benefit to concatenating values into SQL — it's slower (breaks PDO prepared statement caching) and dangerous.

---

# Production Considerations

- **Use `$request->validated()` instead of `$request->all()` in queries**: Validated data ensures the query receives expected types, preventing unexpected SQL errors.
- **Monitor N+1 queries**: Eloquent's lazy loading is not a SQL injection risk but a performance risk. Use `with()` or `load()`.
- **Database Permissions**: Even with parameterized queries, the database user should have minimum required privileges (no DROP, no TRUNCATE for app user).

---

# Common Mistakes

- **Concatenating into whereRaw**: `whereRaw("name = '$input'")` — classic SQL injection. Use `whereRaw('name = ?', [$input])`.
- **Concatenating into DB::statement**: `DB::statement("INSERT INTO users (name) VALUES ('$name')")` — injection. Use `DB::insert('INSERT INTO users (name) VALUES (?)', [$name])`.
- **Dynamic ORDER BY without whitelist**: `->orderBy($request->input('sort'))` — the column name becomes raw SQL. Whitelist it.
- **Using `$request->all()` in Eloquent create**: `User::create($request->all())` — mass assignment risk (separate from SQL injection). Use validated data and `$fillable`.
- **Assuming JSON columns are safe**: `whereRaw('JSON_EXTRACT(details, "$.key") = ?', [$value])` — the JSON path is safe in bindings. But `whereRaw("JSON_EXTRACT(details, '$.$key') = ?", [$value])` where `$key` is user input — the JSON path is in the $sql string, so it's injectable if `$key` contains SQL.

---

# Failure Modes

- **Silent Query Failure on Binding Mismatch**: Number of bindings doesn't match placeholders → PDOException. Forgetting a binding throws an error; having extra bindings throws an error. Both are caught during development but must be tested.
- **Like Clause Injection**: `where('name', 'like', "%$input%")` — the `%` wildcards in the binding are safe from SQL injection but can be used for search manipulation (no security implication).
- **JSON Key Injection**: Dynamic JSON keys in `JSON_EXTRACT` or `->` operator cannot use bindings. Must whitelist.

---

# Related Knowledge Units

- Prerequisites: Eloquent ORM basics, Query Builder fluency
- Related: Mass assignment ($fillable/$guarded), Form Request validation rules
- Advanced Follow-up: SQL injection via JSON path expressions, Prepared statement caching at database level, ORM-level security auditing (detecting raw SQL usage)

## Ecosystem Usage
- **Laravel Framework**: Provides default security middleware (EncryptCookies, AddQueuedCookiesToResponse, StartSession, ShareErrorsFromSession, VerifyCsrfToken). Blade's {{ }} syntax auto-escapes HTML output, preventing XSS.
- **Laravel CSP Nonce**: Illuminate\Http\Middleware\SetCacheHeaders and community packages like spatie/laravel-csp provide Content-Security-Policy header management with nonce-based inline script/style allowlisting.
- **CORS configuration**: Laravel's config/cors.php manages cross-origin requests via ruitcake/laravel-cors; configuration includes allowed origins, methods, headers, and preflight response caching.
- **CSRF protection**: Laravel's VerifyCsrfToken middleware excludes specified routes via $except array; the csrf_token() helper and @csrf Blade directive generate the token for forms and AJAX requests.
- **Session configuration**: Laravel's session drivers (file, cookie, database, Redis, Memcached, DynamoDB) are configured in config/session.php; HttpOnly, Secure, SameSite attributes configured at the session driver level.
- **SQL injection prevention**: Eloquent ORM uses parameterized queries (PDO prepared statements) by default, preventing SQL injection. Raw queries via DB::select() should always use parameter binding.
- **Blade XSS prevention**: Blade's {{ }} uses htmlspecialchars() with ENT_QUOTES | ENT_SUBSTITUTE encoding. Raw output via {!! !!} should be used only with trusted content.
- **Security headers middleware**: Community packages like spatie/laravel-http-headers or custom middleware set HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers.

## Research Notes
- Content-Security-Policy nonce generation changed in Laravel 11 — the nonce is now generated per-request using a cryptographically secure random generator, ensuring uniqueness per page load.
- CSRF token rotation frequency increased with Laravel 12 — tokens are rotated on every session re-authentication (login/register), reducing the window for CSRF token theft exploitation.
- Session configuration hardening (HttpOnly, Secure, SameSite) is applied at the cookie middleware level, not at the individual controller/middleware level — misconfiguration is common when custom session drivers override default cookie settings.
- Laravel's SQL injection prevention via Eloquent is robust, but raw DB::select('SELECT * FROM users WHERE id = ?', []) requires manual parameter binding — the ? placeholder binding is positional, not named.
- Blade XSS prevention via {{ }} escapes five HTML special characters: &, <, >, ", ' — this covers the OWASP XSS Prevention Cheat Sheet Rule #1 for HTML entity encoding.
- HSTS header configuration via middleware must use includeSubDomains and preload directives carefully — preload submits the domain to browser preload lists, and once set, HTTPS enforcement is permanent for the specified max-age period.
- The Origin header verification in CSRF protection (VerifyCsrfToken middleware) checks against the APP_URL configuration — this is bypassable if APP_URL is incorrectly configured or misaligned with the actual application domain.
- Package-based security hardening (spatie/laravel-csp, spatie/laravel-http-headers) must be configured before deployment to production — default configurations may not meet specific security requirements.

## Internal Mechanics
- **CSRF Token Verification Flow**: VerifyCsrfToken middleware (in web middleware group) reads the token from _token POST parameter or X-CSRF-TOKEN header → decodes via Encrypter → compares against session token using hash_equals() to prevent timing attacks. Token mismatch results in TokenMismatchException → HTTP 419 error.
- **Blade Escaping Flow**: {{  }} compiles to <?php echo e(); ?> where e() is htmlspecialchars(, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'). {!!  !!} compiles to <?php echo ; ?> with zero escaping.
- **Eloquent SQL Injection Prevention**: Eloquent's where('column', ) uses PDO prepared statements — the column name is concatenated into SQL (and must be safe), while the value is parameterized via ? binding. Raw whereRaw() and DB::select() with manual ? parameterization shift responsibility to the developer.
- **Session Security Configuration Flow**: config/session.php settings are read by StartSession middleware → session cookie attributes (HttpOnly, Secure, SameSite) are applied in CookieSessionHandler → cookie is added to response via AddQueuedCookiesToResponse middleware.
- **Security Headers Middleware Flow**: Custom middleware or community packages modify the response's $response->headers->set() or $response->headers->add() in the middleware's handle() method → response is sent to client with modified headers. The middleware must run after content generation but before response delivery.
- **HSTS and CSP Implementation**: HSTS (Strict-Transport-Security) is set as a response header via middleware — the browser enforces HTTPS on subsequent requests. CSP (Content-Security-Policy) defines allowed content sources and is enforced by the browser, blocking unauthorized script/style execution.
