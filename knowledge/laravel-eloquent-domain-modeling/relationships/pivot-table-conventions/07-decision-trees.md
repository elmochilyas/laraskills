## Pivot Table Key Strategy (Composite PK vs Auto-increment ID)

Choosing between a composite primary key on both FKs and an auto-increment ID for pivot tables.

---

## Decision Context

When designing a pivot table's primary key, you must decide between a composite key on the two foreign keys and an auto-increment ID.

---

## Decision Criteria

* whether the pivot is a simple join or a domain entity
* whether the pivot has its own relationships (referenced by other tables)
* framework convention
* storage efficiency at scale

---

## Decision Tree

Designing pivot table primary key?

↓

Does the pivot need to be referenced by other tables (has its own relationships)?

YES → Use auto-increment ID + unique constraint on both FKs

NO → Use composite primary key on both foreign keys

    Will the pivot have extra columns?

    YES → Add columns alongside the composite PK

    NO → Composite PK alone is sufficient

---

## Rationale

Composite primary keys are the Laravel convention and naturally prevent duplicate FK pairs. Auto-increment IDs are needed only when the pivot table is referenced as a foreign key by other tables. The composite key also serves as a covering index for equality lookups on both columns.

---

## Recommended Default

**Default:** Composite primary key on both foreign key columns
**Reason:** Prevents duplicates by design, follows convention, saves storage, no unnecessary auto-increment

---

## Risks Of Wrong Choice

Duplicate pivot rows without a unique constraint, unnecessary auto-increment overhead, inconsistency with framework expectations.

---

## Related Rules

- Composite-Unique-Pivot (belongs-to-many/05-rules.md)

---

## Related Skills

- Configure a BelongsToMany relationship with pivot table migration (belongs-to-many/06-skills.md)

---

## Pivot Table Naming (Alphabetical Convention)

Ensuring pivot table names follow the singular-alphabetical convention.

---

## Decision Context

When creating a pivot table, the name must follow the alphabetical singular convention to match Eloquent's autodetection.

---

## Decision Criteria

* alphabetical order of model names
* singular vs plural model names
* convention consistency across the project

---

## Decision Tree

Naming a pivot table?

↓

Identify the two model class names in singular form

↓

Sort them alphabetically (case-insensitive)

↓

Join with underscore: `role_user` not `user_role`

↓

Does Eloquent's autodetection match this name?

YES → No explicit table name needed

NO → Pass explicit table name to `belongsToMany()`

---

## Rationale

Eloquent generates pivot table names by sorting singular model names alphabetically. `User` + `Role` becomes `role_user`. Using a different naming convention (like `user_role`) requires passing the table name explicitly. Consistency across the project is more important than the convention itself.

---

## Recommended Default

**Default:** Follow alphabetical singular convention for all pivot tables
**Reason:** Enables Eloquent's name autodetection, consistent across the project

---

## Risks Of Wrong Choice

Mismatched table names require explicit configuration; inconsistent naming causes developer confusion.

---

## Related Rules

- Pivot-Cascade-On-Delete (belongs-to-many/05-rules.md)

---

## Related Skills

- Configure a BelongsToMany relationship with pivot table migration (belongs-to-many/06-skills.md)
