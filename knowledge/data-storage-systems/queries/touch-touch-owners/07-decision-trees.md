# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-25 Touch / TouchOwners
**Generated:** 2026-06-03

---

# Decision Inventory

* touch vs touchOwners vs $touches property
* Manual touch vs automatic cascade

---

# Architecture-Level Decision Trees

---

## Timestamp Cascade Strategy

---

## Decision Context

Choosing when and how to propagate updated_at changes for cache invalidation and change tracking.

---

## Decision Criteria

* performance: each touch generates an UPDATE query on the parent table
* architectural: automatic touching via $touches is declarative
* maintainability: deep touch chains create hidden write load
* security: no direct security impact

---

## Decision Tree

Need to update a parent's updated_at when a child changes?
↓
Is this a permanent, well-understood relationship?
YES → Use $touches property on the child model (declarative, automatic)
    ↓
    Is the hierarchy more than 2 levels deep?
    YES → Consider manual touch() in specific methods instead of $touches
        ↓
        Is cache invalidation the goal?
        YES → Touch only the cache key parent, not the entire chain
        NO → Accept the cascade cost
    NO → Use $touches
NO → Is this a one-off or conditional update?
    YES → Use touchOwners() manually
    NO → Use touch() on the specific model

---

## Rationale

$touches provides automatic timestamp propagation but generates an extra UPDATE per save. For deep hierarchies, this compounds. Manual touch() gives control over when cascading occurs. touchOwners() is useful for one-time cascade operations without modifying model definitions.

---

## Recommended Default

**Default:** $touches property for single-level parent relationships
**Reason:** Automatic, declarative, no risk of forgetting to cascade. Use manual touch() for conditional or deep cascading.

---

## Risks Of Wrong Choice

* Unnecessary UPDATEs: touch() always hits the database even if the model hasn't changed
* Cascading on deep hierarchies: chain of UPDATE queries on every child save
* Missing touch: stale cache if parent timestamp isn't updated when expected

---

## Related Rules

* Use $touches for automatic parent timestamp updates
* Avoid deep $touches chains (>2 levels)

---

## Related Skills

* Configure automatic parent timestamp updates
