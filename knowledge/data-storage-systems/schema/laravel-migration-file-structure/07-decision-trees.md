# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-1 Laravel Migration File Structure
**Generated:** 2026-06-03

---

# Decision Inventory

* Anonymous vs named migration class
* Single vs multi-connection migration
* Conditional vs unconditional execution

---

# Architecture-Level Decision Trees

---

## Migration Class Style

---

## Decision Context

Choosing between anonymous and named migration classes based on Laravel version and team size.

---

## Decision Criteria

* performance: no difference
* architectural: anonymous classes prevent collisions in team environments
* maintainability: named classes require unique naming convention enforcement
* security: no impact

---

## Decision Tree

Creating a new migration?
↓
Is the project on Laravel 9+?
YES → Use anonymous class (`return new class extends Migration`)
    ↓
    Is the team > 1 developer?
    YES → Anonymous class (prevents class name collisions)
    NO → Anonymous class still preferred
NO → Use named class with unique name convention
    → Prefix class name with filename timestamp or developer initials

---

## Rationale

Anonymous classes (Laravel 9+) eliminate the class name collision problem entirely. Two developers creating migrations with the same descriptive name on the same day would cause a PHP fatal error with named classes. Anonymous classes are the default recommendation for all new projects.

---

## Recommended Default

**Default:** Anonymous class syntax for Laravel 9+
**Reason:** Prevents class name collisions in team environments with zero effort.

---

## Risks Of Wrong Choice

* Named class collisions: two developers create same-named classes, causing PHP fatal errors
* Missing $connection: migration runs on wrong database in multi-DB setups
* No down() method: rollback of the batch fails

---

## Related Rules

* Always implement both up() and down()
* Never edit deployed migrations

---

## Related Skills

* Create anonymous migration classes with up/down methods
