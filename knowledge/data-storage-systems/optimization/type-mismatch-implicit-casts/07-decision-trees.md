# Decision Trees for 4-12 Type Mismatch Implicit Casts

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-12 |
| Title | Type Mismatch Implicit Casts |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: String vs integer comparison fix
- D2: FK type matching across relationships
- D3: NULL/value mixing prevention

## Architecture-Level Decision Trees

### D1: String vs integer comparison fix

**Decision Context**: `WHERE varchar_status = 0` casts every row's varchar to int, causing wrong results + full scan.

**Criteria**:
- Value source (request, model, constant)
- Column type definition
- Framework binding behavior

**Tree**:
```
Is the bound value type-mismatched with the column?
├── Yes (string column vs integer value)
│   └── Cast the value in PHP before binding
│       where('status', (string) $value)
└── No → No action needed
```

**Rationale**: PHP string-to-integer coercion on request parameters is the most common cause. Explicit casting in PHP prevents the implicit cast in MySQL.

**Default**: Always match PHP type to column type in where clauses.

**Risks**: UUID columns passed as integers from request convert to 0 in MySQL comparison.

**Related Rules/Skills**: 3-29 (implicit type conversion)

---

### D2: FK type matching across relationships

**Decision Context**: `foreignId()` creates `unsignedBigInteger` but referenced PK is a different type.

**Criteria**:
- Migration generation (foreignId vs foreignUuid)
- Relationship definition
- Database engine

**Tree**:
```
Is FK type matching the referenced column?
├── Yes → No action needed
└── No
    ├── UUID PK: Use foreignUuid('column')->constrained()
    └── Custom type: Use foreign('column')->references('id')->on('table')
```

**Rationale**: Type mismatch in FK relationships causes index bypass on JOINs and constraint failures. `foreignId()` assumes `unsignedBigInteger`.

**Default**: Use `foreignUuid()` for UUID PKs; `foreignId()` for integer PKs.

**Risks**: Migration may succeed but JOIN queries silently degrade.

**Related Rules/Skills**: 1-4 (foreign key definition)

---

### D3: NULL/value mixing prevention

**Decision Context**: Missing request parameter binds NULL to where clause against string column.

**Criteria**:
- Request validation presence
- Nullable column definition
- Default value handling

**Tree**:
```
Is the value potentially NULL/empty from input?
├── Yes
│   └── Validate and provide default
│       $value = $request->validated('status', 'default')
└── No → No action needed
```

**Rationale**: `where('string_col', null)` compares string column to NULL without proper handling. Use `whereNull()` for explicit NULL checks.

**Default**: Always validate request parameters and provide explicit defaults.

**Risks**: NULL comparison always returns false (IS NULL vs = NULL distinction).

**Related Rules/Skills**: 4-8 (whereDate sargability)

---
