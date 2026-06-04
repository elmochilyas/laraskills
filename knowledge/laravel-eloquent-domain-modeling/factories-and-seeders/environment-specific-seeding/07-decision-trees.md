# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Environment-Specific Seeding
**Generated:** 2026-06-03

---

# Decision Inventory

* Demo vs reference seeder separation
* Environment gate mechanism
* callSilent vs call for seeders

---

# Architecture-Level Decision Trees

---

## Demo vs Reference Seeder Separation

---

## Decision Context

Deciding whether demo data and reference data should be in the same or separate seeder classes.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Is the seeder data required for the application to function (reference data)?
↓
YES → Separate into reference seeder class — always runs, idempotent
NO → Is the data for development/testing/demo purposes only?
    YES → Separate into demo seeder class — gated by environment
    NO → Split into appropriate category

---

## Recommended Default

**Default:** Separate classes for reference and demo seeders
**Reason:** Reference seeders can run unconditionally in production; demo seeders must never run in production.

---

## Risks Of Wrong Choice

Mixed reference and demo data in one seeder class makes it impossible to gate only the demo portion, risking fake data in production.

---

## Related Rules

* Separate Reference Seeders from Demo Seeders into Different Classes
* Gate All Demo Seeders Behind Environment Checks

---

## Related Skills

* Set Up Environment-Gated Demo Seeders

---

## Environment Gate Mechanism

---

## Decision Context

Choosing how to gate demo seeders from running in production.

---

## Decision Criteria

* security
* reliability

---

## Decision Tree

Should the seeder run only in specific environments?
↓
YES → Use `app()->environment('local', 'staging')` — explicit environment check
NO → Is the data safe to run in all environments?
    YES → No gate needed — reference data
    NO → Add environment gate

---

## Recommended Default

**Default:** `app()->environment('local', 'staging')` for all demo seeders
**Reason:** Explicit, readable, and prevents accidental production seeding.

---

## Risks Of Wrong Choice

Missing environment gates on demo seeders can lead to fake/PII-like data in production, truncation of real data, and security compliance violations.

---

## Related Rules

* Gate All Demo Seeders Behind Environment Checks
* Never Truncate Tables in Production Seeders

---

## Related Skills

* Set Up Environment-Gated Demo Seeders

---

## callSilent vs call for Seeders

---

## Decision Context

Choosing between `callSilent()` and `call()` when invoking seeders from `DatabaseSeeder`.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the seeder creating reference data (no side effects needed)?
↓
YES → Use `callSilent()` — skips model events, faster
NO → Is the seeder creating demo data (events useful for development)?
    YES → Use `call()` — fires model events
    NO → Default to `call()` unless performance is critical

---

## Recommended Default

**Default:** `callSilent()` for reference data; `call()` for demo data
**Reason:** Reference data seeding is infrastructure and doesn't need event dispatch. Demo data benefits from event-driven setup.

---

## Risks Of Wrong Choice

Using `call()` for reference seeders triggers model events unnecessarily (cache clears, search indexing) during every seed. Using `callSilent()` for demo data may miss event-dependent setup.

---

## Related Rules

* Use callSilent() for Reference Data Seeders

---

## Related Skills

* Set Up Environment-Gated Demo Seeders
