# Decision Trees for 4-10 Function Wraps Where Clause

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-10 |
| Title | Function Wraps Where Clause |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Functional index vs query rewrite for LOWER/UPPER
- D2: CAST sargability fix approach
- D3: orderByRaw function handling

## Architecture-Level Decision Trees

### D1: Functional index vs query rewrite for LOWER/UPPER

**Decision Context**: `WHERE LOWER(email) = ?` cannot use index on `email`.

**Criteria**:
- Database support for functional indexes
- Query frequency
- Case sensitivity requirements

**Tree**:
```
Which database?
├── PostgreSQL (supports functional indexes)
│   └── CREATE INDEX ON users (LOWER(email))
│       Query: WHERE LOWER(email) = ?
└── MySQL (functional indexes in 8.0+)
    ├── MySQL 8.0+ → CREATE INDEX ON users ((LOWER(email)))
    └── MySQL < 8.0
        └── Use generated column + index
            ALTER TABLE users ADD email_lower VARCHAR(255) AS (LOWER(email));
            CREATE INDEX ON users (email_lower);
```

**Rationale**: Functional indexes directly index the expression. Generated columns are the fallback for databases without functional index support.

**Default**: Functional index when supported; generated column otherwise.

**Risks**: Query must use exact same expression as index definition.

**Related Rules/Skills**: 3-12 (functional/expression indexes)

---

### D2: CAST sargability fix approach

**Decision Context**: `CAST(id AS CHAR) = '123'` wraps the column in CAST, breaking the index.

**Criteria**:
- Column type vs value type
- Framework/PHP type handling
- Query generation

**Tree**:
```
Is the cast on the column or the input?
├── Column (CAST(col AS type) = value) → Wrong
│   └── Fix: Cast the input instead
│       WHERE id = CAST('123' AS UNSIGNED)
└── Input only → No issue
```

**Rationale**: Casting the input preserves index access. The database converts the input to the column's type for comparison.

**Default**: Always ensure PHP binds values with types matching the column definition.

**Risks**: Laravel's query builder may implicitly generate type-mismatched queries when model `$casts` doesn't match column type.

**Related Rules/Skills**: 3-29 (implicit type conversion), 4-12 (type mismatch implicit casts)

---

### D3: orderByRaw function handling

**Decision Context**: `orderByRaw('LOWER(name)')` sorts by function result, causing filesort.

**Criteria**:
- Result set size
- Need for case-insensitive sorting
- Database collation configuration

**Tree**:
```
Is the sort result set small (< 100 rows)?
├── Yes → Acceptable filesort
└── No
    └── Use case-insensitive collation instead
        ├── MySQL: ALTER TABLE users MODIFY name VARCHAR(255) COLLATE utf8mb4_unicode_ci
        └── PostgreSQL: CREATE INDEX ON users (name COLLATE "en_US.utf8")
```

**Rationale**: Case-insensitive collation on the column itself enables index-based sorting in any direction, eliminating the filesort from function-wrapped ORDER BY.

**Default**: Use case-insensitive collation at column definition for sortable text columns.

**Risks**: Changing collation affects all query comparisons on that column.

**Related Rules/Skills**: 3-28 (sargability rule)

---
