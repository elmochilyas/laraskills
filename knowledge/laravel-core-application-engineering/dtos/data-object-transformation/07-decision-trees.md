# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Data Object Transformation
**Generated:** 2026-06-03

---

# Decision Inventory

* Single `toArray()` vs Multiple Output Shapes (Transformer)
* Bidirectional vs Input-Only vs Output-Only DTO
* Explicit Key Mapping vs Dynamic Serialization

---

# Architecture-Level Decision Trees

---

## Decision 1: Single `toArray()` vs Multiple Output Shapes (Transformer)

---

## Decision Context

Whether to use a single `toArray()` method on the DTO or create a separate Transformer class/DTOs for multiple output shapes.

---

## Decision Criteria

* Number of distinct output shapes needed
* Whether output shapes differ structurally (different keys, nesting)
* Whether conditional logic would be needed in `toArray()`
* Whether output consumers are API, CSV, email, or other formats

---

## Decision Tree

How many distinct output shapes does this DTO need?
↓
1 → Single `toArray()` on the DTO — simplest and most direct
2-3 → Do output shapes differ structurally (add/remove entire keys)?
    YES → Conditional `toArray()`? Output contract becomes unpredictable
        YES → Dedicated Transformer class with one method per shape
        NO → Minor formatting differences only (date format, locale, null handling)?
            YES → Acceptable in single `toArray()` with small conditionals
            NO → Transformer class
    NO → Same keys, different formats → Single `toArray()` with formatting parameters
3+ → Transformer class required — keep `toArray()` as the canonical output, add Transformer for specialized shapes
NO → Is the output for HTTP responses?
    YES → Use API Resources instead of either approach — built-in conditionals and pagination

---

## Rationale

A single `toArray()` with conditional branches depending on context produces an unpredictable output contract. Dedicated transformers make each output shape explicit, testable, and independently maintainable. API Resources should be used for HTTP responses — they provide built-in conditional loading and pagination that DTOs lack.

---

## Recommended Default

**Default:** Single `toArray()` for 1 shape; Transformer class for 3+ structurally different shapes; API Resources for HTTP responses
**Reason:** Each approach matches the complexity of the output requirement. Over-engineering with a Transformer for a single shape is unnecessary.

---

## Risks Of Wrong Choice

* Conditional `toArray()` for multiple shapes: Unpredictable contract, consumers cannot rely on shape
* Transformer for single shape: Unnecessary abstraction — `toArray()` is sufficient
* DTO for HTTP output: Missing built-in conditionals and pagination that API Resources provide

---

## Related Rules

* Use `toArray()` as the Canonical Output Method (05-rules.md)
* Never Include Business Logic in `toArray()` (05-rules.md)
* Separate Output Shapes with Dedicated Transformers or Output DTOs (05-rules.md)

---

## Related Skills

* Skill: Implement and Test DTO Output Methods
* Skill: Build a Dedicated DTO Transformer for Multiple Output Shapes

---

## Decision 2: Bidirectional vs Input-Only vs Output-Only DTO

---

## Decision Context

Whether a DTO serves both input (constructed from source data) and output (serialized for consumers) or is dedicated to a single direction.

---

## Decision Criteria

* Whether input and output shapes share >50% of fields
* Whether the DTO is used for both construction and serialization
* Whether round-trip consistency is required
* Whether the DTO crosses cache/queue boundaries where round-trip matters

---

## Decision Tree

Does the DTO serve both input and output roles?
↓
YES → Do input and output shapes share >50% of fields?
    YES → Bidirectional DTO acceptable — ensure `fromArray()` can consume `toArray()` output
    NO → Separate input-only and output-only DTOs — each has exactly the fields needed
NO → Is the DTO used in serialization contexts (cache, queues)?
    YES → Bidirectional with round-trip consistency required — `fromArray(toArray(input))` must produce identical DTO
    NO → Is the DTO used only as input (constructed from request/CLI, never serialized)?
        YES → Input-only — no `toArray()` or `JsonSerializable` needed
    NO → Is the DTO used only as output (serialized for consumer, never constructed from source)?
        YES → Output-only — no `fromArray()` or factory methods needed

---

## Rationale

Bidirectional DTOs must maintain round-trip consistency — `fromArray()` must be able to consume `toArray()` output. When input and output shapes diverge significantly (>50% different fields), separate DTOs eliminate nullable fields and ambiguous contracts. Input-only DTOs skip serialization methods; output-only DTOs skip factory methods.

---

## Recommended Default

**Default:** Bidirectional DTO when input and output shapes overlap >80%; separate input/output DTOs when overlap is <50%
**Reason:** Bidirectional DTOs reduce file count but require round-trip discipline. Separate DTOs eliminate nullable fields and make each contract explicit.

---

## Risks Of Wrong Choice

* Bidirectional with divergent shapes: Nullable fields for one direction, unclear which fields are guaranteed
* Input-only used for output: Missing `toArray()` causes serialization errors
* Output-only used for input: Factory methods don't exist — cannot reconstruct from source

---

## Related Rules

* Ensure Round-Trip Consistency for Bidirectional DTOs (05-rules.md)
* Use Dedicated Output DTOs When Input and Output Shapes Diverge Significantly (05-rules.md)
* Control the Serialization Surface — Never Leak Internal Fields (05-rules.md)

---

## Related Skills

* Skill: Implement and Test DTO Output Methods

---

## Decision 3: Explicit Key Mapping vs Dynamic Serialization

---

## Decision Context

Whether to map output keys explicitly in `toArray()` or use dynamic serialization (`get_object_vars()`, reflection, or automatic property iteration).

---

## Decision Criteria

* Whether sensitive/internal fields must be excluded from output
* Whether output key names differ from property names
* Whether the DTO has computed or transformed properties
* Whether security requirements dictate explicit output control

---

## Decision Tree

Does the DTO contain sensitive or internal-only fields (passwords, internal flags, secret keys)?
↓
YES → Explicit key mapping required — dynamic serialization would leak these fields
NO → Do output key names differ from PHP property names (snake_case vs camelCase)?
    YES → Explicit key mapping required — dynamic serialization exposes PHP naming
NO → Does the DTO have computed or transformed properties (formatted dates, computed totals)?
    YES → Explicit key mapping required — dynamic serialization misses computed values
NO → Is this DTO used for external output (API, export, email)?
    YES → Explicit key mapping preferred — security and consistency
    NO → Internal-only output (debug, logging)?
        YES → Dynamic serialization acceptable for internal use only — document that it's not for external consumption

---

## Rationale

Explicit key mapping in `toArray()` ensures only intended fields reach consumers, decouples internal property names from external contracts, and includes computed/transformed properties. Dynamic serialization (`get_object_vars()`) exposes every property including internal flags and sensitive data. The security risk of accidental leaks outweighs the convenience of dynamic serialization.

---

## Recommended Default

**Default:** Explicit key mapping in every `toArray()` method — never use `get_object_vars()` or reflection-based serialization
**Reason:** Explicit mapping controls the serialization surface, prevents data leaks, and decouples internal naming from external contracts. The verbosity is a security feature.

---

## Risks Of Wrong Choice

* `get_object_vars()`: Leaks internal fields, sensitive data, and computed intermediates
* Dynamic reflection: Exposes PHP property names to external consumers
* Explicit mapping with missed field: Field is silently omitted — but that's safer than exposing it

---

## Related Rules

* Control the Serialization Surface — Never Leak Internal Fields (05-rules.md)
* Use Key Mapping to Decouple Internal Property Names from External Representations (05-rules.md)
* Prevent Circular References in Recursive Serialization (05-rules.md)

---

## Related Skills

* Skill: Implement and Test DTO Output Methods

