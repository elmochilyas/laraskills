# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** SerializesCastableAttributes
**Generated:** 2026-06-03

---

# Decision Inventory

* Implement serialize() vs rely on get()
* SerializesCastableAttributes vs API Resources
* Inline format conversion vs separate serializer

---

# Architecture-Level Decision Trees

---

## Implement serialize() vs Rely on get()

---

## Decision Context

Deciding whether to implement the `SerializesCastableAttributes` interface or let the `get()` return value be used for serialization.

---

## Decision Criteria

* maintainability
* performance
* architectural

---

## Decision Tree

Is the PHP representation of the value object also the desired API representation?
↓
YES → Do NOT implement `serialize()` — `get()` value is used automatically
NO → Is the API representation consistent across all models using this cast?
    YES → Implement `SerializesCastableAttributes` on the cast class
    NO → Use API Resources — per-model serialization logic

---

## Rationale

`serialize()` adds an extra method call on every serialization. Only implement it when the in-application representation differs intentionally from the API representation. If different models need different serialization of the same type, API Resources are the correct tool.

---

## Recommended Default

**Default:** Do not implement `serialize()` (rely on `get()`)
**Reason:** Less code, fewer moving parts. Only add `serialize()` when you need a distinct API representation.

---

## Risks Of Wrong Choice

Not implementing `serialize()` when needed sends raw PHP value objects to API consumers, which may expose internal implementation details or produce non-serializable output (causing silent `null` values in JSON).

---

## Related Rules

* Return plain arrays or scalars from serialize()
* Do not access model state in serialize()

---

## Related Skills

* Implement SerializesCastableAttributes for Custom JSON Output

---

## SerializesCastableAttributes vs API Resources

---

## Decision Context

Choosing between implementing `SerializesCastableAttributes` on a custom cast vs using Laravel API Resources for controlling attribute serialization.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the serialization format depend on the requesting user, route, or context?
↓
YES → Use API Resources — they receive the full request context
NO → Is the same serialization format needed across ALL models using this attribute type?
    YES → Implement `SerializesCastableAttributes` on the cast class
    NO → Use API Resources — per-model serialization control

---

## Rationale

`SerializesCastableAttributes` provides a model-independent serialization contract tied to the value object type. API Resources provide context-dependent (user, request, endpoint) serialization. They serve different purposes and can be combined.

---

## Recommended Default

**Default:** API Resources for endpoint-specific output; `SerializesCastableAttributes` for type-level output contracts
**Reason:** API Resources are more flexible and testable. `SerializesCastableAttributes` is a convenience for consistent cross-model serialization of value objects.

---

## Risks Of Wrong Choice

Using `SerializesCastableAttributes` for context-dependent serialization introduces implicit behavior (serialize doesn't receive request context). Using API Resources for every attribute type-level format decision duplicates serialization logic across many resources.

---

## Related Rules

* Keep serialize() focused on format conversion
* Do not access model state in serialize()

---

## Related Skills

* Implement SerializesCastableAttributes for Custom JSON Output

---

## Inline Format Conversion vs Separate Serializer

---

## Decision Context

Deciding whether to implement `serialize()` directly on the cast class or create a separate serializer/formatter class for the value object.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Is the serialization logic complex (multiple output formats, conditional fields)?
↓
YES → Extract a separate serializer/formatter class — testable independently
NO → Is the same serialization used in non-Eloquent contexts (e.g., manual `json_encode`)?
    YES → Add a `toArray()` or `jsonSerialize()` method on the value object itself
    NO → Implement `serialize()` directly on the cast class — simplest approach

---

## Rationale

For simple format conversion (e.g., Money → `['amount' => '19.99', 'currency' => 'USD']`), inline `serialize()` on the cast class is sufficient. For complex logic with multiple output variants, a dedicated serializer class keeps concerns separated and testable.

---

## Recommended Default

**Default:** Implement `serialize()` directly on the cast class
**Reason:** Minimal indirection for simple format conversion. Extract only when serialization complexity warrants it.

---

## Risks Of Wrong Choice

Inline complex serialization in the cast class makes it hard to test and reuse. Creating separate serializers for trivial format conversion adds unnecessary abstraction overhead.

---

## Related Rules

* Keep serialize() focused on format conversion
* Return plain arrays or scalars from serialize()

---

## Related Skills

* Implement SerializesCastableAttributes for Custom JSON Output
