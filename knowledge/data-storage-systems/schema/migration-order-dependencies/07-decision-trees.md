# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-17 Migration Order Dependencies
**Generated:** 2026-06-03

---

# Decision Inventory

* FK in Table Creation vs Separate FK Migration
* Circular Dependency: Deferred FK vs Schema Redesign
* NOT VALID vs Immediate FK Validation

---

# Architecture-Level Decision Trees

---

## FK in Table Creation vs Separate FK Migration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer creating a table with foreign key references must decide whether to define the FK inline during table creation or in a separate migration.

---

## Decision Criteria

* performance considerations: migration ordering simplicity
* architectural considerations: table dependency order, timestamp ordering
* security considerations: referential integrity timing
* maintainability considerations: migration file count, readability

---

## Decision Tree

Is the referenced table created in an earlier migration with an earlier timestamp?
↓
YES → FK inline in table creation is safe (referenced table exists first)
NO → Use separate FK migration after both tables exist

---

## Rationale

Inline FK definition (`$table->foreignId('user_id')->constrained()`) is convenient and readable. It works when the referenced table is guaranteed to exist first due to timestamp ordering. If both tables are created in the same batch and the referenced table has a later timestamp, the FK creation fails because the referenced table doesn't exist yet. In that case, a separate FK migration after both table-creation migrations is required.

---

## Recommended Default

**Default:** FK inline when order is certain, separate migration when uncertain
**Reason:** Inline FK is cleaner but requires strict migration ordering. When in doubt, separate FK migrations are safer and avoid migration order failures.

---

## Risks Of Wrong Choice

Inline FK with wrong timestamp order causes migration failure. Separate FK for every relationship creates many single-purpose migration files.

---

## Related Rules

Create tables before adding FK constraints. Use NOT VALID for zero-lock constraint addition.

---

## Related Skills

Resolve Migration Order Dependencies and Circular References

---

## Circular Dependency: Deferred FK vs Schema Redesign

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer designing a schema with two tables that reference each other must choose between deferred FK addition and a schema redesign.

---

## Decision Criteria

* performance considerations: migration complexity
* architectural considerations: schema normalization, application logic
* security considerations: referential integrity enforcement
* maintainability considerations: long-term schema clarity

---

## Decision Tree

Is a normalized schema redesign feasible without circular references?
↓
YES → Redesign to eliminate circular dependency (cleaner, preferred)
NO → Use deferred FK (create tables without FK, add FKs in subsequent migration)

---

## Rationale

Circular dependencies between tables are often a sign of a modeling issue (e.g., a pivot table is missing). Eliminating the circle through normalization is the cleaner solution. When circular dependencies are genuinely necessary (e.g., two peer entities that reference each other), create both tables without FK constraints, then add both FKs in a separate migration after both tables exist.

---

## Recommended Default

**Default:** Normalize to eliminate circular dependencies
**Reason:** Circular FK dependencies are a code smell. Most can be resolved by introducing an intermediate table or rethinking the relationship. Deferred FK is the fallback when normalization is not practical.

---

## Risks Of Wrong Choice

Circular dependency without proper deferred FK addition causes migration failures. Unnecessary normalization to avoid a legitimate circular reference adds complexity to the data model.

---

## Related Rules

Create tables before adding FK constraints. Resolve circular dependencies with deferred FKs.

---

## Related Skills

Resolve Migration Order Dependencies and Circular References

---

## NOT VALID vs Immediate FK Validation

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer adding an FK constraint to a PostgreSQL table must decide between immediate validation (locks writes) and deferred validation using NOT VALID.

---

## Decision Criteria

* performance considerations: lock duration, table scan time
* architectural considerations: PostgreSQL version (11+ for NOT VALID)
* security considerations: temporary referential integrity gap
* maintainability considerations: separate VALIDATE step scheduling

---

## Decision Tree

Is the table large (> 1M rows) with active production traffic?
↓
YES → Use NOT VALID + later VALIDATE (zero-lock add, deferred scan)
NO → Use immediate validation (simpler, brief lock on small tables)

---

## Rationale

Immediate FK validation scans the entire table to verify existing data, holding a lock that blocks writes. For small tables, this completes quickly. NOT VALID adds the constraint as metadata without scanning — instant and non-blocking. The separate VALIDATE step scans the table but uses a less restrictive lock that allows concurrent writes. This is essential for large production tables.

---

## Recommended Default

**Default:** NOT VALID for production tables, immediate validation for small/dev tables
**Reason:** NOT VALID + VALIDATE provides zero-lock FK addition regardless of table size. The additional step is minimal effort for significant safety. Use immediate validation only when you know the table is small enough that the lock duration is acceptable.

---

## Risks Of Wrong Choice

Immediate validation on a large production table blocks all writes for the scan duration. NOT VALID without subsequent VALIDATE leaves the constraint unenforced for existing rows.

---

## Related Rules

Create tables before adding FK constraints. Use NOT VALID for zero-lock constraint addition.

---

## Related Skills

Resolve Migration Order Dependencies and Circular References
