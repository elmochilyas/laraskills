# Anti-Patterns: SQL Injection Prevention (Parameterized Bindings)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | SQL Injection Prevention |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-SI-01 | String Interpolation in Raw Queries | Critical | Medium | Medium |
| AP-SI-02 | Unvalidated Column Names in orderBy | High | High | Low |
| AP-SI-03 | Using DB::statement With Concatenated SQL | Critical | Low | Medium |
| AP-SI-04 | Unescaped LIKE Wildcards | Medium | Medium | Low |
| AP-SI-05 | Logging Raw SQL in Production | Medium | High | Low |

---

## Repository-Wide Anti-Patterns

- **Raw SQL Everywhere**: `whereRaw`, `selectRaw`, `orderByRaw` used instead of query builder
- **No Column Whitelist Policy**: User-controlled column names passed without validation
- **Production Query Logging**: `DB::enableQueryLog()` or `DB::listen()` active in production

---

## 1. String Interpolation in Raw Queries

### Category
Security · Critical

### Description
Concatenating user input directly into SQL strings in raw queries (`whereRaw`, `selectRaw`, `DB::select`, `DB::statement`) instead of using parameterized bindings.

### Why It Happens
PHP's string interpolation (`"WHERE email = '$email'"`) is natural and readable. Developers use it without thinking about injection. Raw methods are often used when the query builder can't easily express the query.

### Warning Signs
- `whereRaw("column = '$value'")` — quotes around interpolated variable
- `DB::select("SELECT * FROM users WHERE id = {$id}")` — variable in SQL string
- `"WHERE status = '{$status}'"` — string interpolation in raw methods
- No `?` placeholders in raw SQL

### Why Harmful
SQL injection is complete database compromise. An attacker can read any table, modify any data, execute administrative commands, and in some configurations execute OS commands.

### Real-World Consequences
- Attacker inputs `' OR '1'='1` — bypasses authentication
- Attacker inputs `'; DROP TABLE users; --` — data loss
- Data exfiltration via UNION injection
- Complete database compromise

### Preferred Alternative
Always use `?` placeholders or named bindings (`:name`) in raw queries.

### Refactoring Strategy
1. Identify all raw SQL methods with string interpolation
2. Replace with `?` placeholders and pass values as array
3. Example: `whereRaw('email = ?', [$request->email])`

### Detection Checklist
- [ ] Are there raw SQL methods with string interpolation?
- [ ] Do all `whereRaw`, `selectRaw`, `DB::select` use `?` bindings?
- [ ] Are there SQL injection scanning tools in CI?
- [ ] Are raw SQL usages documented and justified?
- [ ] Is there a policy against string interpolation in SQL?

### Related Rules/Skills/Trees
- Use Eloquent ORM or Query Builder for All Database Queries (05-rules.md)
- Use Named or Positional Bindings in Raw SQL (05-rules.md)
- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)
- Eloquent/Query Builder vs Raw SQL decision tree (07-decision-trees.md)

---

## 2. Unvalidated Column Names in orderBy

### Category
Security · High

### Description
Passing user input directly to `orderBy()`, `groupBy()`, or `whereColumn()` without whitelisting allowed column names.

### Why It Happens
`User::orderBy($request->input('sort'))` is common in API controllers. Developers assume column names are safe because they're not values. But column names cannot be parameterized — they're part of the SQL structure.

### Warning Signs
- `$request->sort` passed directly to `orderBy()`
- `$request->filter` passed to `where('column', ...)` where column is user-controlled
- No validation or whitelist for sort/filter columns
- User can manipulate `?sort=created_at` and `?sort=password` both work

### Why Harmful
Column names cannot be parameterized. An attacker can manipulate column references to access unintended data, cause errors that reveal schema information, or exploit database-specific column behaviors.

### Real-World Consequences
- Attacker passes `sort=password` — sorts by password column (data exposure risk)
- Attacker passes `sort=id;DROP TABLE users` — though SQL injection is blocked, the error may leak schema
- Data exposure through sort by sensitive columns

### Preferred Alternative
Whitelist allowed column names. Validate user input against the whitelist.

### Refactoring Strategy
1. Define `$allowedSorts = ['name', 'created_at']`
2. Validate: `$sort = in_array($request->sort, $allowedSorts) ? $request->sort : 'created_at'`
3. Use the validated value in `orderBy()`

### Detection Checklist
- [ ] Are user-controlled sort/filter column names whitelisted?
- [ ] Can user manipulate `?sort=` to use any column?
- [ ] Is there a whitelist for each sortable model?
- [ ] Are sensitive columns (password, email) sortable?

### Related Rules/Skills/Trees
- Validate and Cast IDs and Integers Before Querying (05-rules.md)
- Use Validation Rules to Reject Suspicious Input Patterns (05-rules.md)
- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)
- Dynamic Column Name Handling decision tree (07-decision-trees.md)

---

## 3. Using DB::statement With Concatenated SQL

### Category
Security · Critical

### Description
Using `DB::statement()` with string interpolation for UPDATE or DELETE operations, allowing SQL injection in write queries.

### Why It Happens
When the query builder can't express a specific UPDATE or DELETE pattern, developers fall back to `DB::statement()`. The string concatenation pattern is the same as with `DB::select()`.

### Warning Signs
- `DB::statement("DELETE FROM ... WHERE id = {$id}")` with string interpolation
- `DB::statement("UPDATE ... SET ... = '{$value}'")`
- Raw SQL statements without `?` bindings
- Write operations using `DB::statement` with concatenated values

### Why Harmful
Unlike read-based injection (data theft), write-based injection can destroy or corrupt data. An attacker can delete all records, modify data, or escalate privileges.

### Real-World Consequences
- `DELETE FROM users WHERE id = {$id}` — attacker sets `id` to `1 OR 1=1` — deletes all users
- `UPDATE users SET role = '{$role}'` — attacker sets role to `admin` — privilege escalation
- Data loss, unauthorized modifications

### Preferred Alternative
Use query builder write methods or parameterized `DB::statement()` with bindings.

### Refactoring Strategy
1. Replace `DB::statement()` with `DB::table()->where()->update()` or `->delete()`
2. If `DB::statement()` is necessary, use `?` bindings

### Detection Checklist
- [ ] Are there `DB::statement()` calls with string interpolation?
- [ ] Are write operations using query builder or parameterized statements?
- [ ] Can an attacker inject into DELETE or UPDATE queries?
- [ ] Are there raw SQL operations on sensitive tables?

### Related Rules/Skills/Trees
- Use prepared Statements for Raw DB::update / DB::delete (05-rules.md)
- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)

---

## 4. Unescaped LIKE Wildcards

### Category
Security · Medium

### Description
Using user input in LIKE queries without escaping `%` and `_` characters, allowing attackers to manipulate search patterns and potentially expose data through search-based enumeration.

### Why It Happens
Parameterized `LIKE` queries still pass the value: `User::where('name', 'LIKE', "%{$search}%")`. The `%` and `_` characters have special meaning in LIKE — they match any sequence or single character respectively.

### Warning Signs
- `LIKE "%{$search}%"` without escaping `%` and `_`
- Search input containing `%` returns unexpected results
- Attacker can search with `%` to match all records
- Attacker can enumerate data by observing search return differences

### Why Harmful
While not SQL injection (parameterized binding prevents that), unescaped wildcards allow attackers to change search behavior. An attacker can match all records with `%`, or use `_` for character-by-character data enumeration.

### Real-World Consequences
- Attacker searches `%` — returns all records (potential data exposure)
- Attacker uses `password%` to enumerate user search results
- Data enumeration through Boolean-based LIKE observation

### Preferred Alternative
Escape `%` and `_` in user input before using in LIKE queries.

### Refactoring Strategy
1. Escape search input: `str_replace(['%', '_'], ['\%', '\_'], $search)`
2. Then use in LIKE query: `User::where('name', 'LIKE', "%{$escapedSearch}%")`

### Detection Checklist
- [ ] Are LIKE queries using user input?
- [ ] Are `%` and `_` escaped in search input?
- [ ] Can search be manipulated to return unexpected results?
- [ ] Is there a search character whitelist?

### Related Rules/Skills/Trees
- Use Validation Rules to Reject Suspicious Input Patterns (05-rules.md)
- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)

---

## 5. Logging Raw SQL in Production

### Category
Security · Medium

### Description
Enabling SQL query logging (`DB::enableQueryLog()`, `DB::listen()`) in production environments.

### Why It Happens
Developers enable query logging for debugging and forget to disable it in production. The query log captures all SQL strings with bound values.

### Warning Signs
- `DB::enableQueryLog()` called without environment check
- `DB::listen()` writes queries to production logs
- Log files contain SQL statements with user data
- Production `storage/logs/` growing rapidly due to query logging
- `enableQueryLog` in a service provider without `env('APP_DEBUG')` guard

### Why Harmful
SQL queries often contain user input (email, name, search terms) and sometimes sensitive data. Production logs are not designed as secure storage for this data.

### Real-World Consequences
- Log file contains user email addresses and search terms
- Compliance violation: PII in log files
- Log file exposed — user data leaked

### Preferred Alternative
Only enable query logging in local/development environments.

### Refactoring Strategy
1. Wrap `DB::enableQueryLog()` and `DB::listen()` in `app()->environment('local')` check
2. Remove or disable query logging from production configuration

### Detection Checklist
- [ ] Is query logging enabled in production?
- [ ] Are `DB::listen()` or `DB::enableQueryLog()` active in production?
- [ ] Do production logs contain SQL queries?
- [ ] Is there an environment guard on query logging?

### Related Rules/Skills/Trees
- Never Log or Display Raw SQL Queries in Production (05-rules.md)
- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)
