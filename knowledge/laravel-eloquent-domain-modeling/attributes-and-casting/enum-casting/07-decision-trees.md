# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Enum Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Backed Enum vs Unit Enum for Model Attributes
* Decision 2: Enum Cast vs String Constants for Fixed Value Sets
* Decision 3: Enum Cast vs Database Lookup Table

---

# Architecture-Level Decision Trees

---

## Decision 1: Backed Enum vs Unit Enum for Model Attributes

---

## Decision Context

Choose between a backed enum (with string/int backing) and a unit enum (no backing value) for casting model attributes.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the database column store a scalar value (string or int)?
↓
YES → Backed Enum (string or int backing type matching the column)
NO → Is the enum used only in-memory for business logic without DB persistence?
    YES → Unit Enum is acceptable
    NO → Backed Enum — database columns require backing values for serialization

---

## Rationale

Only backed enums can be stored in and retrieved from database columns. Unit enums have no scalar backing value and cannot be serialized to/from a database column. Using a unit enum in `$casts` causes runtime errors.

---

## Recommended Default

**Default:** Always use backed enums for model attribute casting. Never use unit enums in `$casts`.
**Reason:** Database columns store scalar values. Backed enums provide the bidirectional mapping needed for persistence.

---

## Risks Of Wrong Choice

* Unit enum in `$casts`: cast error at runtime, broken saves and reads
* Backed enum for in-memory only: unnecessary coupling to backing values, extra boilerplate

---

## Related Rules

* Cast to backed enums for string/int columns (`05-rules.md`)
* Do not register unit enums in `$casts` (`05-rules.md`)

---

## Related Skills

* Cast an Attribute to a PHP Enum (`06-skills.md` Skill 1)

---

## Decision 2: Enum Cast vs String Constants for Fixed Value Sets

---

## Decision Context

Choose between casting an attribute to a PHP enum class or using class constants with magic strings for a fixed set of allowed values.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the set of allowed values stable and known at compile time?
↓
YES → Do you need to eliminate magic string comparisons?
    YES → Enum Cast (type safety, IDE autocompletion, no magic strings)
    NO → Enum Cast (still beneficial for type safety and validation)
NO → Do the values change frequently (admin-managed)?
    YES → String Constants or Database Lookup Table (runtime-extensible)
    NO → Enum Cast

---

## Rationale

PHP enums provide compile-time type safety, IDE autocompletion, and eliminate magic string comparisons. They are ideal for stable value sets like status, type, or category. For frequently changing values, database lookup tables or string constants are more flexible.

---

## Recommended Default

**Default:** Enum cast for any attribute with a fixed, known set of allowed values. String constants only when values must be runtime-extensible.
**Reason:** Enums provide type safety and self-documenting code at zero runtime cost for value validation.

---

## Risks Of Wrong Choice

* Enum for frequently changing values: deployment needed for every new value, no admin UI support
* String constants for stable values: magic strings, no type safety, comparison errors, no IDE support

---

## Related Rules

* Type-hint domain methods with enum classes (`05-rules.md`)
* Compare using enum instances, not strings (`05-rules.md`)

---

## Related Skills

* Cast an Attribute to a PHP Enum (`06-skills.md` Skill 1)

---

## Decision 3: Enum Cast vs Database Lookup Table

---

## Decision Context

Choose between a PHP enum for fixed values and a database lookup/relationship table for runtime-extensible value sets.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Can the list of allowed values change without a deployment?
↓
YES → Database Lookup Table (runtime-extensible via admin UI)
NO → Is the value list stable (status, type, category flags)?
    YES → Enum Cast (compile-time safety, no DB query for validation)
    NO → Does the set need multi-language support or additional metadata?
        YES → Database Lookup Table
        NO → Enum Cast

---

## Rationale

Database lookup tables provide runtime flexibility and support additional metadata (labels, ordering, timestamps). PHP enums provide compile-time safety, zero database overhead for validation, and IDE support. Choose based on whether the value set needs to change without deploying code.

---

## Recommended Default

**Default:** Enum cast for stable, compile-time-known value sets. Database lookup table for runtime-extensible or metadata-rich value sets.
**Reason:** Enums are simpler and faster but require deployments for changes. Lookup tables are more flexible but require queries, caching, and relationship management.

---

## Risks Of Wrong Choice

* Enum for extensible sets: blocked by deployment cycle, no admin UI
* Lookup table for stable sets: unnecessary queries, cache invalidation, extra migrations

---

## Related Rules

* Match database column type to enum backing value (`05-rules.md`)

---

## Related Skills

* Cast an Attribute to a PHP Enum (`06-skills.md` Skill 1)
