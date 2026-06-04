# 3-29 Implicit Type Conversion - Decision Trees

## Type-Safe Comparison vs Default Behavior

---

## Decision Context

Choosing between ensuring type-safe comparisons in Eloquent queries versus relying on default behavior which may cause implicit type conversion and index bypass.

---

## Decision Criteria

* performance: type mismatch breaks index usage (full table scan)
* architectural: PHP's loose typing increases mismatch risk
* maintainability: explicit casting is safer but more verbose
* security: type confusion can cause incorrect results

---

## Decision Tree

Query compares a column value to a parameter — are types consistent?

↓

Check: column type vs parameter type

↓

Column is VARCHAR but parameter could be integer?

YES → Cast parameter to string explicitly

    ↓
    `->where('status', (string) $request->status)`
    
    ↓
    Without cast: MySQL converts VARCHAR column to integer
    - 'abc' → 0
    - '123' → 123
    - Index NOT used (column wrapped in implicit CAST function)
    
    ↓
    Also affects: `whereIn('status', array_map('strval', $statuses))`

NO → Column is integer but parameter could be string?

    YES → Cast to integer or ensure PDO binding type
    
        ↓
        Eloquent usually handles this, but raw queries may not:
        `DB::select("SELECT * FROM users WHERE id = ?", [(int) $id])`

NO → UUID column compared with string?

    YES → Always use string — Eloquent UUID/ULID models should have $keyType = 'string'

---

## Rationale

Implicit type conversion breaks sargability because the database applies an implicit CAST function to the column, wrapping it just like `DATE(col) = ?`. The index on the raw column cannot be used. This is especially common in PHP/Laravel due to loose typing and HTTP request parameters being strings.

---

## Recommended Default

**Default:** Explicitly cast query parameters to match the column type
**Reason:** Prevents silent index-breaking type conversions that are hard to spot in code review.

---

## Risks Of Wrong Choice

Integer-string comparison: index bypass, full table scan, and in MySQL, incorrect results (non-numeric strings become 0). Detecting these issues requires profiling queries with EXPLAIN and checking for CAST operations.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries
