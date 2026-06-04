## Accessor vs Cast vs Presenter

Choosing between accessors, attribute casting, and presenter/view-layer formatting for value transformation.

---

## Decision Context

When a stored value needs transformation for display, you must decide whether to use an accessor, a cast, or present it in the view layer.

---

## Decision Criteria

* whether the transformation is pure computation vs type coercion
* whether the output is for API serialization or view display
* whether the transformation has side effects
* reusability across different output formats

---

## Decision Tree

Need to transform a raw stored value?

↓

Is the transformation pure type coercion (string→Carbon, int→boolean, string→enum)?

YES → Use a Cast (`$casts` property on model)

NO → Is the transformation a computed value derived from attribute(s)?

    YES → Use an Accessor (`Attribute::make(get: ...)`)

        Is the computation expensive and accessed multiple times?

        YES → Use `shouldCache: true` on the attribute

    NO → Is this purely for view formatting (currency symbol, date format)?

        YES → Use a Presenter/View component (separates display concerns)

---

## Rationale

Casts handle type conversion at the storage boundary. Accessors handle computed/transformed values at the application boundary. View-level formatting belongs in presenters or Blade components to keep models framework-agnostic and testable without a rendering pipeline.

---

## Recommended Default

**Default:** Use casts for type coercion, accessors for computed values, presenters for formatting
**Reason:** Each layer has a distinct responsibility; overloading accessors with presentation logic couples models to display concerns

---

## Risks Of Wrong Choice

Business logic in accessors (runs on every read), performance degradation from uncached expensive accessors, coupling models to view-layer formatting.

---

## Related Rules

- Accessor purity and caching (from accessor-patterns standardized knowledge)

---

## Related Skills

- Accessor definition with Attribute::make (attributes-and-casting/06-skills.md)

---

## Legacy vs Modern Accessor Syntax

Choosing between the legacy `get{Attribute}Attribute()` convention and the modern `Attribute::make()` API.

---

## Decision Context

When defining an accessor, you must decide whether to use the legacy naming convention or the modern closure-based API.

---

## Decision Criteria

* whether caching is needed (legacy does not support caching)
* codebase consistency with existing patterns
* whether the accessor is new code or a migration from legacy

---

## Decision Tree

Defining a new accessor?

↓

Is the accessor expensive and accessed multiple times per model instance?

YES → Use `Attribute::make(get: fn($v) => ..., shouldCache: true)` — legacy has no caching

NO → Use `Attribute::make(get: fn($v) => ...)` for all new code

    Is there legacy `get{Attr}Attribute()` in the codebase?

    YES → Migrate to `Attribute::make()` when touched; use consistent style for new code

---

## Rationale

`Attribute::make()` supports caching (`shouldCache`), is composable, and is the recommended API for Laravel 11+. Legacy methods cannot be cached and are deprecated. All new accessors should use the modern syntax.

---

## Recommended Default

**Default:** `Attribute::make(get: fn($v) => ...)` for all new accessors
**Reason:** Supports caching, composable, non-deprecated API

---

## Risks Of Wrong Choice

Using deprecated API, no caching support, inconsistent codebase patterns.
