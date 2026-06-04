# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Runtime Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Runtime cast vs global model cast
* Query-level vs instance-level override
* Runtime casting vs API resources

---

# Architecture-Level Decision Trees

---

## Runtime Cast vs Global Model Cast

---

## Decision Context

Determining whether a cast override should be applied at runtime to a specific query/instance or added to the model's global cast definition.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the cast change needed for all queries using this model?
↓
YES → Update the model's `$casts` property or `casts()` method
NO → Is it a one-off or rare use case?
    YES → Use runtime casting (`withCasts()` / `mergeCasts()`)
    NO → Is the same override needed in multiple places?
        YES → Update the model's global casts — runtime casting is not a design pattern
        NO → Use runtime casting for the limited case

---

## Rationale

Model-level casts are the source of truth. Runtime casting is an escape hatch for exceptional cases. If the same override appears in multiple places, it should be promoted to the model definition to avoid scattered, inconsistent overrides.

---

## Recommended Default

**Default:** Global model cast definition
**Reason:** Centralized, predictable, and maintainable. Runtime casting should only be used for truly one-off scenarios.

---

## Risks Of Wrong Choice

Using runtime casting repeatedly for the same override scatters configuration across the codebase, making it hard to discover and maintain. Conversely, modifying global casts for a single query need pollutes the model definition with one-off concerns.

---

## Related Rules

* Do not use runtime casting as global configuration substitute
* Use withCasts for query-level cast changes

---

## Related Skills

* Override a Cast at Runtime With withCasts

---

## Query-Level vs Instance-Level Override

---

## Decision Context

Choosing between `withCasts()` on a query builder and `mergeCasts()` on an already-loaded model instance.

---

## Decision Criteria

* performance
* framework usage

---

## Decision Tree

Do you need the cast override before or after the model is retrieved?
↓
Before retrieval (query builder stage)?
YES → Use `withCasts()` on the query builder — applies to all results
NO → After retrieval (model already loaded)?
    YES → Use `mergeCasts()` on the instance
    NO → You don't need runtime casting

---

## Rationale

`withCasts()` on a query builder applies the override to all results from that query, making it efficient for batch operations. `mergeCasts()` is for cases where the model is already in memory and a one-off cast change is needed.

---

## Recommended Default

**Default:** `withCasts()` on query builders
**Reason:** Scopes the override to a single query chain, applies to all results, and leaves the model class unchanged.

---

## Risks Of Wrong Choice

Using `mergeCasts()` post-retrieval requires iterating over results and calling it on each instance, which is less efficient. Using `withCasts()` isn't possible after the model is already loaded.

---

## Related Rules

* Use withCasts for query-level cast changes
* Use mergeCasts for instance-level cast changes

---

## Related Skills

* Override a Cast at Runtime With withCasts

---

## Runtime Casting vs API Resources

---

## Decision Context

Choosing between runtime casting and Laravel API Resources for controlling how attributes appear in API responses.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the serialization format vary per API endpoint or user context?
↓
YES → Use API Resources — they handle context-dependent serialization
NO → Is the same serialization format needed everywhere (model-level)?
    YES → Is the PHP representation different from the API representation?
        YES → Implement `SerializesCastableAttributes` on a custom cast
        NO → Primitive or custom cast (model-level) with no runtime override needed
    NO → Use runtime casting for the specific endpoint

---

## Rationale

API Resources are the designed mechanism for context-dependent serialization (different fields per user role, per endpoint). Runtime casting is for one-off technical needs (legacy data handling, temporary format changes). Custom cast `serialize()` methods handle consistent cross-model formats.

---

## Recommended Default

**Default:** API Resources for endpoint-specific serialization
**Reason:** They provide explicit control, are testable, and compose well for different API versions and contexts.

---

## Risks Of Wrong Choice

Using runtime casting for API serialization scatters format logic across controllers, bypasses the Resource layer, and makes API output inconsistent and hard to maintain.

---

## Related Rules

* Document runtime cast usage clearly
* Keep serialize focused on format conversion

---

## Related Skills

* Override a Cast at Runtime With withCasts
