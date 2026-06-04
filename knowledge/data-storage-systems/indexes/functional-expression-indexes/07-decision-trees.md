# 3-12 Functional Expression Indexes - Decision Trees

## Expression Index vs Generated Column for Function-Based Lookups

---

## Decision Context

Choosing between a functional expression index (index on expression directly) and a generated column with a regular index for queries using functions in WHERE clauses.

---

## Decision Criteria

* performance: both enable index usage for function-wrapped columns
* architectural: MySQL 8.0+ functional index vs pre-8.0 generated column
* maintainability: generated column adds schema complexity
* security: case-insensitive indexes may affect data privacy expectations

---

## Decision Tree

Need to index `WHERE FUNCTION(col) = value`?

↓

Which database?

↓

PostgreSQL?

YES → Use expression index directly

    ↓
    `CREATE INDEX ON users (LOWER(email))`
    
    ↓
    Simpler: no schema change
    Query must match expression exactly: `WHERE LOWER(email) = ?`
    
    ↓
    Also supports: `WHERE EXTRACT(YEAR FROM created_at) = 2024`
    And: `WHERE (data->>'zip_code') = '12345'`

NO → MySQL 8.0+?

    YES → Use expression index
    
        ↓
        `CREATE INDEX idx_lower_email ON users ((LOWER(email)));`
        
        ↓
        Note: parenthesized expression syntax
        
    NO → MySQL 5.7?
    
        YES → Use generated column instead
        
            ↓
            `ALTER TABLE users ADD email_lower VARCHAR(255) GENERATED ALWAYS AS (LOWER(email)) STORED;`
            `CREATE INDEX ON users (email_lower);`
            
            ↓
            More schema complexity, but works on older MySQL

---

## Rationale

Expression indexes are the cleanest solution because they don't require schema changes. The index stores the computed expression value, and the database matches queries by exact expression match. Generated columns add schema complexity but were the only option before MySQL 8.0.

---

## Recommended Default

**Default:** Expression index (PostgreSQL, MySQL 8.0+); generated column (MySQL 5.7)
**Reason:** Expression indexes are simpler and don't alter the table schema.

---

## Risks Of Wrong Choice

Expression mismatch: `LOWER(email)` in index, `LCASE(email)` in query — index not used. Generated column not kept in sync: if not marked as GENERATED ALWAYS, application updates may cause inconsistency.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Apply Functional Expression Indexes

---

## Case-Insensitive Unique Constraint: Expression vs Partial Index

---

## Decision Context

Enforcing unique constraint on a case-insensitive column (e.g., email) — choosing between a unique expression index and a partial unique index with lowercased data.

---

## Decision Criteria

* performance: both similar in cost
* architectural: expression approach is declarative; application lowercasing is manual
* maintainability: expression index enforces at DB level; application approach can have bugs
* security: case-insensitive uniqueness affects privacy

---

## Decision Tree

Need case-insensitive unique email constraint?

↓

What approach?

↓

Option A: Unique expression index

    ↓
    `CREATE UNIQUE INDEX ON users (LOWER(email))`
    
    ↓
    Database enforces uniqueness on lowercased value
    Application inserts email as-is
    Query with `WHERE LOWER(email) = ?`
    
    Downside: query must always use LOWER()

Option B: Application-level lowercasing + unique index

    ↓
    Store email as lowercase in a separate column or as-is
    Use generated column: `email_lower VARCHAR AS (LOWER(email)) STORED`
    Unique index on generated column: `UNIQUE INDEX (email_lower)`
    
    ↓
    Simpler queries: `WHERE email_lower = ?`
    More schema columns
    
Option C: CITEXT extension (PostgreSQL)

    ↓
    `CREATE EXTENSION citext;`
    Use CITEXT column type instead of VARCHAR
    
    ↓
    Transparent: query without LOWER()
    PostgreSQL-only feature

---

## Rationale

The unique expression index is the simplest approach. CITEXT is even smoother for PostgreSQL users (treats comparisons as case-insensitive automatically). Application-level lowercasing is most portable but requires discipline.

---

## Recommended Default

**Default:** PostgreSQL: CITEXT column type; Otherwise: unique expression index
**Reason:** CITEXT handles case-insensitivity transparently without requiring LOWER() in every query.

---

## Risks Of Wrong Choice

Not using an index: case-insensitive queries do full table scan. Using regular unique index: 'User@Example.com' and 'user@example.com' are considered different, violating the business requirement.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Apply Functional Expression Indexes
