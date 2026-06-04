# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-27 API Resource Classes
**Generated:** 2026-06-03

---

# Decision Inventory

* Resource class vs direct model serialization
* Single resource vs per-endpoint resources
* Conditional attribute inclusion strategies

---

# Architecture-Level Decision Trees

---

## API Response Transformation Strategy

---

## Decision Context

Choosing between raw model serialization, a single resource class, or per-endpoint resource classes for JSON API responses.

---

## Decision Criteria

* performance: lazy-loaded relationships in resources cause N+1
* architectural: resources provide a transformation boundary between models and API
* maintainability: separate resources per endpoint prevent coupling
* security: explicit attribute inclusion prevents data leakage

---

## Decision Tree

Building an API endpoint that returns model data?
↓
Is the response simple (same attributes for all endpoints)?
YES → Use a single resource class
    ↓
    Does the model expose internal/secret columns?
    YES → Explicitly select fields in toArray() — never use ->toArray()
    NO → Simple resource with direct field mapping
NO → Are there distinct list vs detail views?
    YES → Create separate resources: PostListResource + PostDetailResource
        ↓
        Does the detail resource include relationships?
        YES → Use whenLoaded() to conditionally include relationships
        → Preload relationships in the controller with ->load() or ->with()
    NO → Create per-endpoint resources with conditional attributes
        → Use when(), whenHas(), whenNotNull()

---

## Rationale

Resources prevent the "one serialization fits all" anti-pattern. Separate list/detail resources keep list responses sparse and detail responses complete. Conditional relationship loading via whenLoaded() prevents N+1 queries when relationships aren't loaded.

---

## Recommended Default

**Default:** One resource per model, with conditional attributes via when()
**Reason:** Single resource works for most cases. Split into list/detail resources only when the attribute set diverges significantly.

---

## Risks Of Wrong Choice

* Accessor-triggered N+1: accessing $this->relation->count() in a resource lazy-loads the relationship
* Exposing too many fields: default serialization reveals internal columns
* Missing whenLoaded: resource crashes if relationship isn't loaded

---

## Related Rules

* Always preload relationships used in resources
* Be explicit about included fields — never expose all model attributes

---

## Related Skills

* Build API resource classes with conditional attributes
