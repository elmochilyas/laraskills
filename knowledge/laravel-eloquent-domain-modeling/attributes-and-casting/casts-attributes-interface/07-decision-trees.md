# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** CastsAttributes Interface
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Custom Cast vs Built-in Cast vs Accessor/Mutator
* Decision 2: Bidirectional Cast vs Inbound-Only vs Read-Only Transformation
* Decision 3: Null Handling — Explicit Passthrough vs Auto-Coercion to Default

---

# Architecture-Level Decision Trees

---

## Decision 1: Custom Cast vs Built-in Cast vs Accessor/Mutator

---

## Decision Context

Choose the mechanism for transforming attribute values between database and PHP representations.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does a built-in cast cover the use case (int, bool, array, object, collection)?
↓
YES → Built-in Cast (simplest, no custom code)
NO → Is bidirectional transformation needed (get + set)?
    YES → Is the transformation complex enough to need a dedicated class?
        YES → `CastsAttributes` custom cast
        NO → Accessor + Mutator on the model (simpler for model-specific logic)
    NO → Is only read transformation needed?
        YES → Accessor (`Attribute::make(get: ...)`)
        NO → Is only write transformation needed?
            YES → `CastsInboundAttributes` or Mutator
            NO → Custom Cast

---

## Rationale

Built-in casts handle the most common transformations with zero code. Custom casts are needed when transformations are complex or reusable across models. Accessors and mutators are simpler for model-specific transformations but cannot be reused.

---

## Recommended Default

**Default:** Built-in cast first. Accessor/mutator for model-specific logic. Custom cast for reusable or complex transformations.
**Reason:** Simpler tools are faster to write and maintain. Escalate to custom casts only when simpler options are insufficient.

---

## Risks Of Wrong Choice

* Custom cast when built-in suffices: unnecessary code, maintenance burden, testing overhead
* Accessor when custom cast needed: code duplication across models, inconsistency

---

## Related Rules

* Implement both `get` and `set` for bidirectional casts (`05-rules.md`)
* Keep cast methods fast — no DB queries or external calls (`05-rules.md`)

---

## Related Skills

* Implement a Bidirectional Custom Cast (`06-skills.md` Skill 1)

---

## Decision 2: Bidirectional Cast vs Inbound-Only vs Read-Only Transformation

---

## Decision Context

Choose between `CastsAttributes` (bidirectional), `CastsInboundAttributes` (write-only), or an accessor (read-only) for attribute transformation.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is transformation needed in both directions (database → PHP and PHP → database)?
↓
YES → `CastsAttributes` (implement both `get` and `set`)
NO → Is transformation needed only when reading from database?
    YES → Accessor (`Attribute::make(get: ...)`)
    NO → Is transformation needed only when writing to database?
        YES → `CastsInboundAttributes` (implement only `set`)
        NO → No transformation needed — skip

---

## Rationale

Using the right interface for the direction needed prevents implementing unused methods and signals intent clearly. `CastsAttributes` is for bidirectional transformation. Leaving one method throwing `NotImplemented` violates the contract.

---

## Recommended Default

**Default:** `CastsAttributes` for bidirectional. Accessor for read-only. `CastsInboundAttributes` for write-only.
**Reason:** Each interface or pattern has a clear purpose. Using the wrong one creates unused code, confusing contracts, or runtime errors.

---

## Risks Of Wrong Choice

* `CastsAttributes` with unimplemented `set`: runtime error on save/update
* Accessor for write-only: extra step needed for mutation
* Custom cast for one direction: unnecessary complexity

---

## Related Rules

* Implement both `get` and `set` for bidirectional casts (`05-rules.md`)

---

## Related Skills

* Implement a Bidirectional Custom Cast (`06-skills.md` Skill 1)

---

## Decision 3: Null Handling — Explicit Passthrough vs Auto-Coercion to Default

---

## Decision Context

Choose how the cast handles null values — passing them through explicitly or coercing them to a default value.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the database column nullable?
↓
YES → Is null a meaningful domain value (nullable field, optional data)?
    YES → Explicit null passthrough: return `null` from `get`, `[$key => null]` from `set`
    NO → Explicit null passthrough (defensive — column might become nullable later)
NO → Does the domain guarantee the value is always present?
    YES → Auto-coercion to default is acceptable (document the assumption)
    NO → Explicit null passthrough (defensive)

---

## Rationale

Explicit null handling preserves null semantics and prevents subtle bugs when nullable columns are introduced after deployment. Auto-coercion silently converts null to a default value, hiding data problems. The exception is when the column is `NOT NULL` and the domain guarantees the value is always present.

---

## Recommended Default

**Default:** Always handle null explicitly in both `get` and `set`. Return `null` from `get` when the database value is null. Return `[$key => null]` from `set` when null is assigned.
**Reason:** Null is a distinct domain concept. Auto-coercion hides data integrity issues and causes subtle bugs when schemas evolve.

---

## Risks Of Wrong Choice

* Auto-coercion: silent data loss, hidden null issues, bugs when nullable columns are introduced later
* Explicit null for NOT NULL columns: unnecessary null checks, more verbose code

---

## Related Rules

* Handle null explicitly in `get` and `set` (`05-rules.md`)
* Return full key-value array from `set` (`05-rules.md`)

---

## Related Skills

* Implement a Bidirectional Custom Cast (`06-skills.md` Skill 1)
