## Backed Enum vs Unit Enum for Database Storage

Choosing between backed enums (with explicit values) and unit enums (name-based) for database columns.

---

## Decision Context

When using PHP enums with Eloquent casts, you must decide whether to use backed enums (string/int values) or unit enums for database column mapping.

---

## Decision Criteria

* whether enum case names may change during refactoring
* readability of stored values in the database
* whether the enum needs to map to legacy integer/string codes
* whether the stored value has meaning outside PHP

---

## Decision Tree

Using PHP enums with a database column?

↓

Could the enum case names change in the future (refactoring, renaming)?

YES → Use backed enum with explicit string/int values

    Example: `case Active = 'active'` not `case Active`

NO → Are the values meaningful to non-PHP consumers (API, reporting)?

    YES → Use backed enum with explicit values (stable under refactoring)

    NO → Unit enum is acceptable (stores `name` as string)

---

## Rationale

Backed enums store explicit values that survive case renaming. Unit enums store the case `name`, which changes when the case is renamed, breaking existing database rows. For any persistent storage, backed enums are the safe choice.

---

## Recommended Default

**Default:** Always use backed enums (string or int) for database columns
**Reason:** Stable under refactoring, meaningful stored values, no breaking changes on rename

---

## Risks Of Wrong Choice

Database corruption when unit enum cases are renamed; difficult data migrations to fix stored names.

---

## Related Rules

- Enum backing value conventions (from enum-casts standardized knowledge)

---

## Related Skills

- Enum cast definition (attributes-and-casting/06-skills.md)

---

## Enum Value Safety (Valid vs Invalid Database Values)

Choosing how to handle invalid enum values already stored in the database.

---

## Decision Context

When enum casts encounter database values that don't match any case, you must decide how to handle the inevitable null.

---

## Decision Criteria

* whether invalid values can exist in the database (legacy data)
* tolerance for null returns vs error tolerance
* migration timeline for fixing invalid data

---

## Decision Tree

Enum cast on a column with potentially invalid values?

↓

Can the database contain values not in the enum?

YES → Handle null returns in application code

    `$invoice->status?->value` (nullsafe access)

    Run a data migration to fix invalid values

NO → Standard use; null indicates no value set

---

## Rationale

Laravel catches `\ValueError` from `from()` and returns null for invalid values. Applications must handle this gracefully with nullsafe operators. A scheduled data migration should eventually clean up invalid rows.

---

## Recommended Default

**Default:** Handle null returns with nullsafe operator; migrate invalid data
**Reason:** Graceful degradation prevents crashes; migration fixes root cause

---

## Risks Of Wrong Choice

Unhandled null causes type errors when calling methods on null enum; crashes from uncaught `\ValueError`.

---

## Related Rules

- Enum null handling (from enum-casts standardized knowledge)

---

## Related Skills

- Enum cast definition and null handling (attributes-and-casting/06-skills.md)
