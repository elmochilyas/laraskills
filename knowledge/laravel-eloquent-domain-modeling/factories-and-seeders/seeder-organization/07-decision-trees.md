# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Seeder Organization
**Generated:** 2026-06-03

---

# Decision Inventory

* Flat vs grouped seeder structure
* Seeder ordering by dependency
* call() vs direct method invocation

---

# Architecture-Level Decision Trees

---

## Flat vs Grouped Seeder Structure

---

## Decision Context

Choosing between a flat list of seeders in `DatabaseSeeder` and domain-grouped seeder classes.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are there more than 5 individual seeder classes?
↓
YES → Group by domain boundary — domain group seeders improve organization
NO → Flat list in `DatabaseSeeder` is sufficient
NO → Do seeders have clear domain ownership boundaries?
    YES → Domain group seeders clarify ownership
    NO → Flat structure is simpler

---

## Recommended Default

**Default:** Flat structure for fewer than 5 seeders; domain groups beyond that
**Reason:** Avoid premature organization. Grouping becomes valuable as the number of seeders grows.

---

## Risks Of Wrong Choice

Flat structure with 30+ seeders makes `DatabaseSeeder` unreadable. Domain grouping for 3 seeders adds unnecessary hierarchy.

---

## Related Rules

* Group Seeders by Domain Boundary

---

## Related Skills

* Structure DatabaseSeeder with Domain-Grouped Seeders

---

## Seeder Ordering by Dependency

---

## Decision Context

Determining the order in which seeders should be called based on foreign key dependencies.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the seeder's model have foreign key dependencies?
↓
YES → Does the depended-upon model have its own seeder?
    YES → Call dependent seeder AFTER the dependency seeder
    NO → No ordering constraint — can run in any order
NO → Independent model seeder — call first (no FK constraints)

---

## Recommended Default

**Default:** Order by FK dependency — independent tables first, dependent tables last
**Reason:** Prevents foreign key constraint violations during seeding.

---

## Risks Of Wrong Choice

Wrong ordering causes foreign key constraint failures when inserting dependent records before their referenced records exist.

---

## Related Rules

* Order Seeders by Foreign Key Dependency

---

## Related Skills

* Structure DatabaseSeeder with Domain-Grouped Seeders

---

## call() vs Direct Method Invocation

---

## Decision Context

Choosing between `$this->call()` / `$this->callSilent()` and directly calling another seeder's `run()` method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are you invoking another seeder from `DatabaseSeeder`?
↓
YES → Use `$this->call()` or `$this->callSilent()` — proper lifecycle management
NO → Are you calling from outside the seeder context?
    YES → Consider if seeding is the right approach; use `Artisan::call('db:seed')` for external triggers
    NO → Always use `call()` — never directly invoke `run()` on another seeder

---

## Recommended Default

**Default:** `$this->call()` or `$this->callSilent()` for invoking other seeders
**Reason:** Proper seeder lifecycle, output logging, and event handling.

---

## Risks Of Wrong Choice

Directly calling `SomeSeeder::run()` bypasses Laravel's seeder lifecycle, missing dependency resolution, output buffering, and error handling.

---

## Related Rules

* Use call() for Demo Data, callSilent() for Reference Data

---

## Related Skills

* Structure DatabaseSeeder with Domain-Grouped Seeders
