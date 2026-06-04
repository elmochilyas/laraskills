# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Lifecycle & Governance
**Knowledge Unit:** Backward Compatibility Policy
**Generated:** 2026-06-03

---

# Decision Inventory

* Change classification (additive vs breaking vs evolutive)
* New field addition strategy (optional vs required with default)

---

# Architecture-Level Decision Trees

## Change Classification — Additive vs Breaking vs Evolutive

## Decision Context
How should an API change be classified for compatibility? Arises when modifying existing endpoints or schemas.

## Decision Criteria
* consumer impact — does the change break existing callers?
* specification — is it additive, modifying, or removing?
* detection — automated tools vs human review
* versioning — does it require a major version bump?

## Decision Tree
Does the change remove or rename an existing field/endpoint?
↓
YES → Breaking change (MAJOR version bump + deprecation)
NO → Does it modify the behavior of an existing field?
    YES → Breaking change (unless bug fix matching documented behavior)
    NO → Does it add new fields/endpoints?
        YES → Additive (MINOR version bump)
        NO → Internal refactoring (PATCH version)

## Recommended Default
**Default:** Classify as breaking unless purely additive
**Reason:** Consumer safety — over-classifying as breaking is safe; under-classifying breaks consumers silently.

## Risks Of Wrong Choice
Breaking classified as additive: consumers get runtime errors. Additive classified as breaking: unnecessary major version bumps.

## New Field Addition Strategy — Optional vs Required with Default

## Decision Context
Should new fields in request bodies be optional or required with defaults?

## Decision Tree
Existing endpoint receiving new request field?
↓
YES → Make optional (required = breaking for existing consumers)
NO → New endpoint → Required or optional based on business logic

## Recommended Default
**Default:** All new fields on existing endpoints must be optional
**Reason:** Existing consumers don't send the new field — making it required breaks all current integrations.

## Risks Of Wrong Choice
Required new field on existing endpoint: all current consumers get 422 errors immediately.
