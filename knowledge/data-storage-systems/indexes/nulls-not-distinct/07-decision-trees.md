# 3-17 NULLS NOT DISTINCT - Decision Trees

## NULLS NOT DISTINCT vs Partial Index for Unique Nullable Columns

---

## Decision Context

Enforcing single-NULL uniqueness in a column that allows NULL values — choosing between NULLS NOT DISTINCT and a partial index.

---

## Decision Criteria

* performance: both similar; NULLS NOT DISTINCT is simpler
* architectural: PostgreSQL 15+ feature
* maintainability: NULLS NOT DISTINCT cleaner; partial index more portable
* security: none

---

## Decision Tree

Need unique constraint on a nullable column?

↓

What behavior for NULL values?

↓

Only one NULL allowed (business rule: at most one row without an email)?

YES → PostgreSQL 15+?

    YES → Use NULLS NOT DISTINCT
    
        ↓
        `CREATE UNIQUE INDEX ON users (email) NULLS NOT DISTINCT`
        
        ↓
        Pros: simple, clean, declarative
        Cons: PostgreSQL 15+ only
    
    NO → PostgreSQL < 15 or MySQL?
    
        YES → Use partial unique index:
            
            ↓
            PostgreSQL: `CREATE UNIQUE INDEX ON users (email) WHERE email IS NOT NULL`
            → This only enforces uniqueness on non-null emails
            
            MySQL: MySQL doesn't support partial indexes
            → Alternative: use a separate non-nullable column for the unique value
            
            ↓
            Workaround: use a generated column with a sentinel value:
            `COALESCE(email, 'UNIQUE_PLACEHOLDER_' || id)`
            — but this is hacky

NO → Multiple NULLs allowed (standard SQL behavior)?

    YES → Default unique index without NULLS NOT DISTINCT
    
        ↓
        `UNIQUE INDEX (email)` — allows multiple NULL emails
        Standard SQL: NULL != NULL, so multiple NULLs don't violate uniqueness

---

## Rationale

NULLS NOT DISTINCT changes PostgreSQL's NULL comparison behavior from treating NULLs as distinct to treating them as equal. This is the cleanest way to enforce "at most one NULL" in a unique column. For earlier versions, a partial unique index on non-NULL values is the standard workaround.

---

## Recommended Default

**Default:** PostgreSQL 15+: NULLS NOT DISTINCT; otherwise: partial unique index WHERE col IS NOT NULL
**Reason:** NULLS NOT DISTINCT is the most declarative and clean solution. Partial index is the well-established alternative for older versions.

---

## Risks Of Wrong Choice

Default unique index allows multiple NULLs — violates business rules silently. Partial index on non-null values doesn't prevent multiple NULLs, which is often the correct behavior but may not be what's needed. Not having either causes application-level race conditions.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply NULLS NOT DISTINCT for Unique Nullable Constraints

---

## NULLS NOT DISTINCT vs Application-Level Validation

---

## Decision Context

Choosing between database-enforced single-NULL uniqueness (NULLS NOT DISTINCT) and application-level validation for nullable unique columns.

---

## Decision Criteria

* performance: DB enforcement is atomic; app-level has race conditions
* architectural: DB enforcement is declarative; app-level requires coordination
* maintainability: DB enforcement always consistent; app-level can have bugs
* security: DB enforcement prevents data corruption regardless of app path

---

## Decision Tree

Need to allow at most one NULL in a unique column?

↓

Can you accept race conditions?

YES → Application-level validation (check before insert/update)

    ↓
    $exists = User::whereNull('email')->exists();
    if ($exists) { throw new Exception('Only one null email allowed'); }
    
    ↓
    Risk: concurrent requests may both pass the check
    → Results in multiple NULL rows
    
    ↓
    Mitigation: use database transaction with lock or SERIALIZABLE isolation
    
    NO → Not reliable for production

NO → Need guaranteed enforcement?

    YES → Database-level constraint
    
        ↓
        PostgreSQL 15+: `UNIQUE INDEX ... NULLS NOT DISTINCT`
        Earlier PG: Partial unique index `WHERE col IS NOT NULL` (only prevents duplicate non-null values)
        MySQL: No good solution — consider separate nullable constraint table

---

## Rationale

Application-level validation has inherent race conditions in concurrent environments. Database-level constraints are the only reliable way to enforce single-NULL uniqueness. NULLS NOT DISTINCT provides a clean, atomic solution for PostgreSQL 15+.

---

## Recommended Default

**Default:** Database-level constraint (NULLS NOT DISTINCT in PG 15+)
**Reason:** Only reliable way to prevent concurrent insertions producing multiple NULL rows.

---

## Risks Of Wrong Choice

Application-level only: concurrent requests bypass the check, producing invalid data. No constraint at all: data integrity relies entirely on application correctness, which fails under concurrency.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply NULLS NOT DISTINCT for Unique Nullable Constraints
