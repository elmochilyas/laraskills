# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Primitive Casts
**Generated:** 2026-06-03

---

# Decision Inventory

* Monetary value storage type
* Boolean column casting strategy
* JSON column hydration approach

---

# Architecture-Level Decision Trees

---

## Monetary Value Storage Type

---

## Decision Context

Choosing the correct cast type for monetary/price columns to avoid precision errors.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the column represent a monetary amount?
↓
YES → Use `decimal:N` cast (e.g., `decimal:2`)
NO → Is precision-critical financial data?
    YES → Use `decimal:N` cast
    NO → Is the value a whole number (e.g., cents)?
        YES → Use `integer` cast — store as cents
        NO → Use `float` — acceptable for non-financial approximate values

---

## Rationale

`decimal:N` stores values as precise strings with exact decimal places. Float introduces IEEE 754 rounding errors that cause accounting discrepancies. Integer (cents) works for whole-number currencies but loses fractional precision.

---

## Recommended Default

**Default:** `decimal:2` cast for all monetary columns
**Reason:** Eliminates float precision errors, maintains exact decimal representation, and is the Laravel-recommended approach for financial data.

---

## Risks Of Wrong Choice

Using `float` for monetary values causes accounting reconciliation failures, billing errors, and hard-to-debug rounding issues. Using `integer` (cents) requires application-wide conversion and breaks with fractional currencies.

---

## Related Rules

* Use decimal:N for monetary values, never float

---

## Related Skills

* Configure Primitive Casts for Type Consistency

---

## Boolean Column Casting Strategy

---

## Decision Context

Determining whether a boolean/tinyint database column should use the `bool` cast.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the column store boolean data (0/1, true/false)?
↓
YES → Use `boolean` cast in `$casts`
NO → Does the column use custom boolean representation (Y/N, T/F)?
    YES → Use custom cast or mutator for mapping
    NO → No cast needed — leave as raw DB type

---

## Rationale

Without `boolean` cast, tinyint(1) columns return `0` or `1` as integers. Integer truthiness in Blade conditionals (`@if(0)` works but `@if('0')` doesn't) and strict PHP comparisons cause subtle bugs.

---

## Recommended Default

**Default:** Always cast boolean columns with `'boolean'` in `$casts`
**Reason:** Prevents truthiness bugs in conditionals, ensures strict type consistency, and is a one-line declaration.

---

## Risks Of Wrong Choice

Blade template bugs where `@if($user->is_active)` evaluates truthy for string `'0'`, strict equality failures in comparisons, and inconsistent type expectations across the codebase.

---

## Related Rules

* Use bool cast for boolean database columns

---

## Related Skills

* Configure Primitive Casts for Type Consistency

---

## JSON Column Hydration Approach

---

## Decision Context

Choosing how JSON database columns should be hydrated when accessed as model attributes.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Do you need to query the JSON column via database JSON functions?
↓
YES → Use `array` cast — JSON is queryable and interoperable
NO → Is the data consumed by non-PHP systems (JavaScript frontend, API consumers)?
    YES → Use `array` cast — JSON is the standard interchange format
    NO → Is PHP serialization required (closures, resources)?
        YES → Use `object` cast (serialized) — document the decision
        NO → Use `array` cast — most versatile

---

## Rationale

JSON columns with `array` cast are queryable via MySQL/SQLite/PostgreSQL JSON functions and readable by non-PHP systems. PHP serialization is opaque to the database, cannot be queried, and breaks when the serialization format changes.

---

## Recommended Default

**Default:** `array` cast for JSON columns
**Reason:** Queryable, interoperable, compatible with Laravel collections, and the most commonly expected format.

---

## Risks Of Wrong Choice

Using `object` cast prevents JSON path queries, locks data to PHP ecosystem, and causes migration difficulties if switching away from PHP. Using serialization makes database exports opaque and unqueryable.

---

## Related Rules

* Prefer array cast over serialization for JSON storage

---

## Related Skills

* Configure Primitive Casts for Type Consistency
