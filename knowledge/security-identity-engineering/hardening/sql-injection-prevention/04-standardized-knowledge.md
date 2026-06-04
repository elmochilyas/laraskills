# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | SQL Injection Prevention (Parameterized Bindings) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel prevents SQL injection primarily through Eloquent ORM and the query builder — both use PDO parameterized binding for all values. User-provided values passed to `where()`, `insert()`, `update()`, etc. are automatically bound as parameters, never interpolated into the SQL string. The risk exists with raw SQL methods (`whereRaw`, `selectRaw`, `orderByRaw`, `havingRaw`) — these must use parameter binding for user input. Column name references (in `orderBy`, `groupBy`) cannot be parameterized and must be whitelisted.

---

## Core Concepts

- **Parameterized Binding**: Values are sent to the database separately from the SQL structure. The database server applies the values, preventing interpretation as SQL.
- **Eloquent ORM**: All query builder methods use parameterized binding by default. `User::where('email', $input)->first()` is safe.
- **Raw Methods**: `whereRaw('status = ?', [$status])` safely uses bindings. `whereRaw("status = '$status'")` is vulnerable to injection.
- **Column Name Injection**: `User::orderBy($request->input('sort'))` is vulnerable — column names cannot be parameterized. Must be whitelisted.
- **LIKE Injection**: `LIKE '%' . $search . '%'` — the `%` wildcard and `_` character must be escaped even in parameterized LIKE queries.

---

## When To Use

- Eloquent and query builder for all database operations — safe by default
- Parameterized raw queries when raw SQL is necessary (complex queries, database-specific features)
- Column name whitelisting when user input determines sort/group/filter columns

## When NOT To Use

- String interpolation in raw queries: `"WHERE status = '{$status}'"` — always use parameter binding
- User input directly in column names: always whitelist
- User input in JSON path expressions without validation

---

## Best Practices

- **Use Eloquent/Query Builder for 95%+ of Queries**: Safe by default. Only use raw methods when absolutely necessary.
- **Always Parameterize Raw Queries**: Use `?` placeholders in `whereRaw`, `selectRaw`, `havingRaw`, `orderByRaw`: `whereRaw('json_extract(data, "$.status") = ?', ['active'])`.
- **Whitelist Column Names**: When user input determines sort columns, validate against an allow list: `$allowedSorts = ['name', 'date', 'status']`.
- **Escaped LIKE Queries**: Even with parameterized binding, `%` and `_` have meaning in LIKE. Escape them: `str_replace(['%', '_'], ['\%', '\_'], $search)`.

---

## Architecture Guidelines

- Eloquent ORM for model queries: safe by default
- Query builder for complex joins/reports: safe by default with where()/having()
- Raw methods for database-specific features: always use parameterized bindings
- Column name whitelist: define in model or controller for sortable/filterable columns
- LIKE queries: parameterized binding plus escape of LIKE wildcards

---

## Performance Considerations

- Parameterized binding has no performance cost vs string interpolation
- Prepared statements (which PDO uses) may be slightly slower for single queries but faster for repeated queries
- Column whitelisting adds negligible overhead (in_array check)

---

## Security Considerations

- **Parameterized Binding is Essential**: String interpolation in SQL is always an injection risk. No amount of validation/escaping is as safe as parameterized queries.
- **Second-Order Injection**: Data stored in the database that is later used in raw queries without binding. Sanitize output appropriately.
- **Column Name Injection**: Users can manipulate sort/filter columns if not whitelisted. `orderBy($request->input('sort'))` can lead to unauthorized data exposure.
- **JSON Column Injection**: JSON path expressions in MySQL/MariaDB may accept user input. Validate before use.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| String interpolation in raw queries | Convenience | SQL injection vulnerability | Use parameterized binding with `?` placeholders |
| User-controlled column names | `orderBy($request->sort)` | Column injection | Whitelist allowed column names |
| LIKE queries without escaping | `LIKE '%?%'` doesn't work | LIKE wildcards not matched | Use parameterized binding + escape `%` and `_` |
| Assuming all Eloquent methods are safe | Using `whereRaw` without bindings | SQL injection in raw portions | Don't mix user data into raw strings |

---

## Anti-Patterns

- **`DB::statement("DELETE FROM users WHERE id = {$id}")`**: Always use parameterized binding
- **Escaping user input instead of using bindings**: `addslashes()` or `mysqli_real_escape_string()` are unreliable — use bindings
- **Building SQL strings via concatenation**: Impossible to audit and always injection-prone

---

## Examples

**Safe (parameterized):**
```php
// Eloquent — safe by default
User::where('email', $request->email)->first();

// Query builder — safe by default
DB::table('users')->where('email', $request->email)->first();

// Raw with bindings — safe
User::whereRaw('email = ? AND status = ?', [$request->email, 'active'])->first();
```

**Unsafe (string interpolation):**
```php
// VULNERABLE — never do this
User::whereRaw("email = '{$request->email}'")->first();
DB::select("SELECT * FROM users WHERE email = '{$request->email}'");
```

**Column name whitelisting:**
```php
public function index(Request $request)
{
    $allowedSorts = ['name', 'email', 'created_at', 'updated_at'];
    $sort = in_array($request->sort, $allowedSorts) ? $request->sort : 'created_at';
    
    return User::orderBy($sort)->paginate();
}
```

**Safe LIKE query:**
```php
$search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
User::where('name', 'LIKE', "%{$search}%")->get();
```

---

## Related Topics

- Mass assignment protection
- Input validation security
- Blade XSS prevention
- Eloquent ORM fundamentals

---

## AI Agent Notes

- Eloquent and query builder are safe by default. The risk is with raw SQL methods — check every `whereRaw`, `selectRaw`, `orderByRaw`, `havingRaw` for proper parameterization.
- Column name injection via `orderBy`/`groupBy` is a common oversight — always whitelist.
- If the project has many raw queries, refactor to use Eloquent or parameterized bindings.

---

## Verification

- [ ] All SQL queries use Eloquent/query builder or parameterized raw methods
- [ ] No string interpolation in SQL queries
- [ ] Raw SQL methods (`whereRaw`, `selectRaw`, etc.) use `?` placeholders with value array
- [ ] User-controlled column names whitelisted
- [ ] LIKE queries escape `%` and `_` characters
- [ ] No `DB::statement()`, `DB::select()`, etc. with string interpolation
- [ ] Code review for SQL injection patterns as part of CI
