# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-6 Migration Ordering & Naming
**Generated:** 2026-06-03

---

# Decision Inventory

* Timestamp gap strategy vs no gaps
* Verb prefix naming conventions
* Manual timestamp adjustment

---

# Architecture-Level Decision Trees

---

## Migration Naming and Ordering Strategy

---

## Decision Context

Choosing a naming convention and timestamp strategy that ensures deterministic execution order across the team.

---

## Decision Criteria

* performance: no direct impact
* architectural: filename determines execution order lexicographically
* maintainability: consistent naming improves team collaboration
* security: no impact

---

## Decision Tree

Naming a new migration file?
↓
Will this migration reference another table via FK?
YES → Ensure the referenced table's migration has an EARLIER timestamp
    → If make:migration produces a later timestamp, manually adjust it
    → Convention: _create_parent_table before _create_child_table
NO → Use standard make:migration convention
↓
Does the team use verb prefix naming?
YES → Use: create_, add_, change_, drop_, rename_ prefixes
    → Facilitates sorting and grep filtering
NO → Use descriptive names (default Laravel convention)
↓
Anticipating future migrations between existing ones?
YES → Use timestamp gap strategy (add 1-5 minute gaps)
    → E.g., generate at 12:00:00, leave room for 12:01:00, 12:02:00
NO → Default timestamps are fine

---

## Rationale

Laravel sorts migration files by full filename. The timestamp prefix is the only ordering mechanism. Foreign key ordering must be explicit — a migration creating `authors` must sort before one creating `books` with an FK to `authors`. Verb prefixes improve grep-ability in large projects.

---

## Recommended Default

**Default:** Default Laravel make:migration naming without manual timestamp gaps
**Reason:** For most projects, the default timestamp generation produces correct ordering. Manual adjustment is only needed for FK dependency ordering or hotfixes.

---

## Risks Of Wrong Choice

* Same-second timestamp collision: two developers create migrations simultaneously; ordering is non-deterministic
* FK constraint failure: referenced table migration runs after the FK migration
* Rollback failure from naming collision: duplicate class names in same namespace

---

## Related Rules

* Ensure FK-referenced table migrations run before dependent migrations
* Use anonymous classes (Laravel 9+) to prevent class name collisions

---

## Related Skills

* Name and order migrations for deterministic execution
