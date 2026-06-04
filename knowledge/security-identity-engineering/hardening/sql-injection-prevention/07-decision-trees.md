# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** SQL Injection Prevention (Parameterized Bindings)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Eloquent/Query Builder vs Raw SQL | Database query approach | security, maintainability |
| 2 | Dynamic Column Name Handling | User-controlled sort/filter/group columns | security, architectural |

---

# Architecture-Level Decision Trees

---

## Eloquent/Query Builder vs Raw SQL

---

## Decision Context

Choosing between Eloquent/query builder (safe by default) and raw SQL (requires parameterized bindings) for database queries.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Can the query be expressed using Eloquent ORM or query builder methods?
↓
YES → Use Eloquent/query builder (parameterized bindings automatic, safe by default)
NO → Is this a complex query requiring database-specific features (JSON extraction, full-text search, recursive CTEs)?
    YES → Raw SQL required — use parameterized bindings (`?` placeholders)
    NO → Can the query be refactored into multiple simpler queries?
        YES → Use Eloquent/query builder for simpler components
        NO → Raw SQL with parameterized bindings

Is this a read-only report or aggregation?
↓
YES → Raw SQL acceptable with parameterized bindings (but prefer query builder)
NO → Eloquent/query builder preferred (active record patterns)

Is team experience with raw SQL a concern?
↓
YES → Prefer Eloquent/query builder (reduces human error risk)
NO → Raw SQL with bindings is fine for necessary cases

---

## Rationale

Eloquent and query builder use PDO parameterized binding internally, making them safe from SQL injection by default. Raw SQL methods (`whereRaw`, `selectRaw`, `DB::select`) require explicit parameter binding and are prone to human error (forgetting bindings, using string interpolation). Use raw SQL only when absolutely necessary.

---

## Recommended Default

**Default:** Eloquent ORM for model queries; query builder for complex joins/aggregates; raw SQL only for database-specific features with parameterized bindings
**Reason:** 95%+ of queries can be expressed in Eloquent or query builder, which are safe by default. Raw SQL should be the exception, not the rule, and must always use parameterized bindings.

---

## Risks Of Wrong Choice

- Raw SQL everywhere: increased injection risk, harder to read, harder to test, no IDE autocomplete
- String interpolation in raw SQL: SQL injection vulnerability
- Eloquent for everything: performance issues with complex queries (N+1, huge joins)
- No parameterization at all: catastrophic SQL injection vulnerability

---

## Related Rules

- Use Eloquent ORM or Query Builder for All Database Queries (05-rules.md)
- Use Named or Positional Bindings in Raw SQL (05-rules.md)
- Validate and Cast IDs and Integers Before Querying (05-rules.md)

---

## Related Skills

- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)

---

## Dynamic Column Name Handling

---

## Decision Context

Handling user-controlled column names in `orderBy`, `groupBy`, `where` column, or raw SQL column references.

---

## Decision Criteria

* security

---

## Decision Tree

Does user input determine a column name in the query?
↓
YES → Is the column name in `orderBy`, `groupBy`, or `where('column', ...)`?
    YES → Column names cannot be parameterized — must whitelist
    NO → Is it in a raw SQL expression?
        YES → Parameterize the value; the column name itself must also be whitelisted
        NO → Regular parameterization is sufficient

Is there a whitelist of allowed column names?
↓
YES → Validate user input against whitelist before using
NO → Create a whitelist immediately (this is a security gap)

Can the column name be replaced with a predefined mapping?
↓
YES → Map user-facing names to actual column names (e.g., `'date' => 'created_at'`)
NO → Strict whitelist with default fallback

---

## Rationale

Column names cannot be parameterized in PDO — they are part of the SQL structure, not data. Any user input used as a column name must be validated against a strict whitelist. Without whitelisting, an attacker can manipulate sort/filter columns to expose unauthorized data or exploit database-specific column behaviors.

---

## Recommended Default

**Default:** Whitelist all user-controlled column names against a predefined allow list with a secure default fallback
**Reason:** Column names cannot be parameterized, making whitelisting the only safe approach. The whitelist should be explicit and auditable. A default fallback prevents empty/invalid input from breaking the query.

---

## Risks Of Wrong Choice

- No whitelist: attacker controls sort/filter columns, potential data exposure
- Passing user input directly to `orderBy()`: column injection
- Incomplete whitelist: some columns allowed that should not be sortable/filterable
- Whitelist defined in wrong place: hard to audit when spread across controllers

---

## Related Rules

- Validate and Cast IDs and Integers Before Querying (05-rules.md)
- Use Validation Rules to Reject Suspicious Input Patterns (05-rules.md)

---

## Related Skills

- Prevent SQL Injection with Parameter Binding and Eloquent (06-skills.md)
