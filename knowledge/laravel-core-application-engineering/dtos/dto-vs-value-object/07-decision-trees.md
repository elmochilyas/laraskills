# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO vs Value Object
**Generated:** 2026-06-03

---

# Decision Inventory

* DTO vs Value Object Selection
* VO Inside DTO vs Scalar in DTO + VO in Service
* Value Comparison on DTO vs Reference Comparison

---

# Architecture-Level Decision Trees

---

## Decision 1: DTO vs Value Object Selection

---

## Decision Context

Whether a data class should be a DTO (layer-crossing data carrier) or a Value Object (domain concept with invariants and behavior).

---

## Decision Criteria

* Whether the class needs invariant enforcement (format validation at construction)
* Whether equality semantics matter (two instances equal if properties match)
* Whether the class needs behavior methods (add, multiply, format)
* Whether the class is primarily for data transport across layers

---

## Decision Tree

Does this concept have invariants that must always be enforced (email format, money precision, date range validity)?
↓
YES → Value Object — invariants are the defining characteristic of a VO
NO → Will instances of this class be compared by value (are two instances equal if their properties match)?
    YES → Value Object — implement `equals()` method for value comparison
NO → Does this concept need behavior methods (add, subtract, format, merge)?
    YES → Value Object — behavior is part of the domain concept
NO → Is this class primarily for transporting data across application layers?
    YES → DTO — data carrier, no invariants, no equality, no behavior
NO → Is this a wrapper around a single scalar with no validation?
    YES → Neither — it's a named scalar with ceremony. Either add invariants (make it a VO) or use the scalar directly.

---

## Rationale

DTOs and VOs serve fundamentally different purposes. A DTO is a pipe — it carries data across boundaries. A VO is a concept — it encapsulates domain rules and behavior. Using a DTO where a VO is needed loses domain safety (no invariant enforcement). Using a VO where a DTO is needed adds domain coupling to a transport object that should be simple.

---

## Recommended Default

**Default:** Value Object when invariants or equality matter; DTO when data crosses layers; scalar when neither applies
**Reason:** Each pattern has a specific purpose. The presence of invariants, equality needs, and behavior methods determines the correct choice.

---

## Risks Of Wrong Choice

* VO without invariants: Named scalar with ceremony — no safety gained
* DTO with VO methods: Blurs transport and domain boundaries — harder to test and reuse
* VO used as DTO: Domain behavior scattered in transport layer, unnecessary coupling

---

## Related Rules

* Use Value Objects for Domain Concepts with Invariants; Use DTOs for Layer Crossing (05-rules.md)
* Value Objects Must Enforce Invariants in the Constructor (05-rules.md)
* DTOs Must Not Have Domain Behavior Methods (05-rules.md)

---

## Related Skills

* Skill: Introduce a Value Object with Constructor Invariants

---

## Decision 2: VO Inside DTO vs Scalar in DTO + VO in Service

---

## Decision Context

Whether to use Value Objects as typed properties inside DTOs (e.g., `Email $email` in DTO) or keep scalars in DTOs and construct VOs at the service boundary.

---

## Decision Criteria

* Whether the DTO is purely internal or crosses system boundaries
* Whether VO construction overhead matters (bulk operations)
* Team preference for typing purity vs construction simplicity
* Whether serialization of VOs is handled explicitly

---

## Decision Tree

Is the DTO used in bulk operations (1000+ per request)?
↓
YES → Use scalars in DTOs, construct VOs at service boundary — avoid VO construction overhead in hot path
NO → Does the DTO cross system boundaries (API response, queue payload, cache)?
    YES → Use VOs inside DTOs — type safety at the boundary, VOs serialize explicitly in `toArray()`
    NO → Internal-only DTO (within same process)?
        YES → Does the team prioritize type safety in DTOs?
            YES → VOs inside DTOs — `Email $email` is more expressive than `string $email`
            NO → Scalars in DTOs — simpler factories, VOs created in service when needed
    NO → Are the VOs serialized correctly in `toArray()`?
        YES → VOs inside DTOs — serialize via `$vo->value` or `__toString()`
        NO → Scalars preferred — avoid serialization issues with VOs in `toArray()`

---

## Rationale

VOs inside DTOs provide type safety at the transport layer — the type system documents domain concepts and guarantees validity. Scalars in DTOs with VOs at the service boundary keep DTOs simpler and avoid VO construction overhead in bulk operations. Both approaches are valid; the choice depends on team preference for typing purity vs construction simplicity.

---

## Recommended Default

**Default:** VOs inside DTOs for domain-rich properties (email, money, order ID); scalars for properties with no domain rules (names, descriptions)
**Reason:** VOs communicate domain intent at the type system level and guarantee validity. Scalars avoid unnecessary ceremony for simple values.

---

## Risks Of Wrong Choice

* VOs inside DTOs without serialization: `json_encode` fails or produces unexpected shapes
* Scalars for domain-rich properties: Primitive obsession, type confusion bugs
* VOs inside DTOs in bulk operations: Measurable overhead at scale (1000+ items)

---

## Related Rules

* Use VOs Inside DTOs for Domain-Rich Properties (05-rules.md)
* Serialize VOs Explicitly in DTO Output Methods (05-rules.md)

---

## Related Skills

* Skill: Introduce a Value Object with Constructor Invariants

---

## Decision 3: Value Comparison on DTO vs Reference Comparison

---

## Decision Context

Whether a data class should implement value comparison (`equals()`) or rely on PHP's default reference comparison.

---

## Decision Criteria

* Whether the class is a DTO or VO
* Whether two instances with the same values should be considered "equal"
* Whether the class is used in collections or caching where equality matters

---

## Decision Tree

Is this class a DTO (primarily for data transport)?
↓
YES → Reference comparison is correct. DTOs should NEVER implement `equals()` or value comparison.
    Are two DTOs with the same values considered "equal"?
        NO — they represent different transport events from potentially different sources
NO → Is this class a Value Object (domain concept with invariants)?
    YES → Implement `equals()` for value comparison. Two VOs with the same properties are equal.
NO → Is this a simple data bag used for local computation (not DTO, not VO)?
    YES → Implement `__toString()` or `equals()` only if value comparison is genuinely needed
    NO → Reference comparison is the default — add `equals()` only if value semantics are intentional
NO → Does the class need to be used as an array key or in a Set?
    YES → Implement value comparison — reference comparison would treat identical values as distinct
    NO → Reference comparison is sufficient

---

## Rationale

DTOs transport data across boundaries — two DTOs with the same values but constructed from different sources represent different transport events. Value comparison on DTOs is a design smell that indicates the class should be a Value Object instead. Value Objects should always implement `equals()` because two VOs with the same properties are semantically equal.

---

## Recommended Default

**Default:** No `equals()` on DTOs — reference comparison is correct. Always implement `equals()` on Value Objects.
**Reason:** The distinction between DTO (transport) and VO (concept) determines equality semantics. DTOs are never compared by value; VOs always are.

---

## Risks Of Wrong Choice

* `equals()` on DTO: Blurs DTO/VO boundary, creates false equality between different transport events
* No `equals()` on VO: Two identical values compare as "not equal" — defeats the purpose of a VO
* Reference comparison on VO in collection: Duplicate entries in collections because identical VOs are treated as distinct

---

## Related Rules

* Never Compare DTOs by Value (05-rules.md)
* DTOs Must Not Have Domain Behavior Methods (05-rules.md)

---

## Related Skills

* Skill: Introduce a Value Object with Constructor Invariants

