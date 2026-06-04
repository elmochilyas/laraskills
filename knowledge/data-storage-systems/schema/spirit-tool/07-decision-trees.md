# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-13 Spirit Tool
**Generated:** 2026-06-03

---

# Decision Inventory

* Spirit vs gh-ost vs pt-osc
* MySQL 8.0+ migration tool selection
* Performance schema dependency

---

# Architecture-Level Decision Trees

---

## Online DDL Tool Selection for MySQL 8.0+

---

## Decision Context

Choosing Spirit as a modern binlog-based online migration tool for MySQL 8.0+, evaluating against gh-ost and pt-osc.

---

## Decision Criteria

* performance: Spirit claims up to 2x faster row copy than gh-ost
* architectural: MySQL 8.0+ only; requires performance_schema
* maintainability: similar interface to gh-ost, easy migration
* security: no direct impact

---

## Decision Tree

Choosing an online migration tool for MySQL?
↓
Is the database MySQL 8.0+?
YES → Consider Spirit
    ↓
    Is performance_schema enabled?
    YES → Spirit can use its advanced throttling
    NO → Enable performance_schema or use gh-ost
NO → Use gh-ost (MySQL 5.7 compatible) or pt-osc
↓
Does the table have complex FK constraints?
YES → pt-osc has better FK support
NO → Spirit or gh-ost is appropriate
↓
Are you experiencing trigger-related issues with pt-osc?
YES → Spirit (MySQL 8.0+) or gh-ost (5.7+)
NO → Any tool works

---

## Rationale

Spirit is the most modern choice for MySQL 8.0+, offering performance improvements over gh-ost. However, it requires MySQL 8.0+ and performance_schema. For FK-heavy schemas, pt-osc still offers better native support.

---

## Recommended Default

**Default:** Spirit for MySQL 8.0+, gh-ost for MySQL 5.7
**Reason:** Spirit leverages MySQL 8.0 features for better performance and throttling. gh-ost is the proven alternative for legacy MySQL versions.

---

## Risks Of Wrong Choice

* Using Spirit on MySQL 5.7: not supported, fails immediately
* Disabling performance_schema: Spirit loses primary throttling mechanism
* Disk space exhaustion: row copying doubles storage requirements during migration

---

## Related Rules

* Ensure performance_schema is enabled before using Spirit
* Verify MySQL 8.0+ compatibility before adopting Spirit

---

## Related Skills

* Execute online schema changes with Spirit
