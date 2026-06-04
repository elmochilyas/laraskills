# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Primitive Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Primitive cast vs custom cast
* Array cast vs object cast for JSON
* Cast vs accessor/mutator for simple coercion

---

# Architecture-Level Decision Trees

---

## Primitive Cast vs Custom Cast

---

## Decision Context

Choosing between Laravel's built-in primitive casts (`int`, `bool`, `float`, `string`, `array`, `object`, `collection`, `decimal`) and implementing a custom cast class.

---

## Decision Criteria

* performance
* maintainability
* architectural

---

## Decision Tree

Is simple type coercion sufficient for the attribute?
↓
YES → Does the stored value need no transformation logic?
    YES → Use primitive cast (e.g., `'is_active' => 'boolean'`)
    NO → Use custom cast class
NO → Does the value require validation, computation, or domain logic?
    YES → Use custom cast or value object cast
    NO → Use primitive cast

---

## Rationale

Primitive casts are zero-configuration, extremely fast, and sufficient for 80% of type coercion needs. Custom casts add indirection and should only be used when the attribute needs transformation beyond simple type conversion.

---

## Recommended Default

**Default:** Primitive cast
**Reason:** Minimal overhead, built into Laravel, sufficient for most type-coercion scenarios.

---

## Risks Of Wrong Choice

Using custom casts for simple type coercion adds unnecessary complexity and file count. Using primitive casts for domain-valued attributes (e.g., Email, Money) loses type safety and validation.

---

## Related Rules

* Use decimal:N for monetary values, never float
* Use bool cast for boolean columns
* Prefer array cast over serialization for JSON

---

## Related Skills

* Configure Primitive Casts for Type Safety

---

## Array Cast vs Object Cast for JSON

---

## Decision Context

Choosing whether a JSON column should hydrate as a PHP array or a stdClass object on read.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

How is the JSON data accessed after hydration?
↓
Array-style access (`$data['key']`)?
YES → Use `array` cast — also enables `collect()` conversion
NO → Object-style access (`$data->key`)?
    YES → Use `object` cast (stdClass)
    NO → Prefer `array` cast — more versatile and explicit

---

## Rationale

Arrays are more idiomatic in Laravel (compatible with `collect()`, `Arr::*` helpers, `array_*` functions). stdClass should only be used when object-style syntax is a hard requirement or when interfacing with code that expects objects.

---

## Recommended Default

**Default:** `array` cast
**Reason:** More versatile, compatible with Laravel collections and array helpers, and explicit about the data structure.

---

## Risks Of Wrong Choice

Using `object` cast when arrays are expected forces callers to use `(array)` casts. Using `array` cast when object syntax is expected forces `(object)` casts. Either causes friction and potential `null`-on-undefined-key errors.

---

## Related Rules

* Prefer array cast over serialization for JSON

---

## Related Skills

* Configure Primitive Casts for Type Safety

---

## Cast vs Accessor/Mutator for Simple Coercion

---

## Decision Context

Choosing between declaring a cast in `$casts` vs writing an accessor/mutator method for simple type transformation.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the transformation happen on both read AND write?
↓
YES → Is it a standard type conversion (int, bool, float, string, etc.)?
    YES → Use primitive cast in `$casts` — declarative, two-way
    NO → Use custom cast class or accessor+mutator pair
NO → Is it read-only formatting (e.g., date format)?
    YES → Accessor with `Attribute::make(get: ...)` — read-only is simpler
    NO → Mutator-only? Use `Attribute::make(set: ...)` — but consider if cast is better

---

## Rationale

Casts are declarative, two-way, and require minimal code. Accessors/mutators are imperative and require explicit definition of both directions. For standard type conversions, casts are always the better choice.

---

## Recommended Default

**Default:** Primitive cast in `$casts`
**Reason:** Declarative, two-way, minimal code, and consistent across the model.

---

## Risks Of Wrong Choice

Writing accessors/mutators for simple type coercion duplicates work and is harder to maintain. Using casts for operations that should only run on read (e.g., formatting) adds unnecessary write-side processing.

---

## Related Rules

* Use correct primitive type strings in $casts
* Combine primitive casts with accessors

---

## Related Skills

* Configure Primitive Casts for Type Safety
