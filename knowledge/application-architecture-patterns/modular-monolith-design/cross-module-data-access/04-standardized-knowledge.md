# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Cross-module data access: query patterns without JOINs
Knowledge Unit ID: MMD-10
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

In a modular monolith, cross-module data access via SQL JOINs is forbidden. Module A cannot directly query Module B's database tables. Instead, Module A obtains Module B's data through Module B's service interface (synchronous) or by subscribing to Module B's events (asynchronous, cached data). This constraint is fundamental to module isolation — direct database access across modules creates tighter coupling than code imports.

---

# Core Concepts

- **Forbidden**: `Order::join('inventory_products', ...)` — querying another module's tables directly.
- **Allowed patterns**:
  - Service call: `$this->inventory->checkStock($productIds)` — Inventory service returns stock data.
  - Event subscription: Module B caches data from Module A's events for local querying.
  - Data duplication: Module B maintains its own copy of Module A's relevant data (projection).

---

# When To Use

Service calls: data must be current (real-time). Consumer waits for provider to respond.
Cached event data: stale data acceptable (eventual consistency). Reads from cache updated by events.
Local projection: module needs frequent access to another module's data.

---

# When NOT To Use

- Direct SQL JOINs across modules (never).
- Eloquent relationships referencing other module's models (never).
- Shared database user with full table access (defeats enforcement).

---

# Best Practices

- **Never JOIN across module boundaries.** WHY: A JOIN between module tables creates the strongest form of coupling — couples table structure, index strategy, and schema evolution.
- **Use service calls for real-time data.** WHY: When the consumer must have current data, a contract call guarantees freshness.
- **Use event projections for frequent reads.** WHY: Local copy avoids repeated contract calls while preserving module isolation.
- **Monitor projection freshness.** WHY: Stale projections cause data inconsistency bugs that are hard to diagnose.

---

# Architecture Guidelines

- CQRS as cross-module pattern: Module A owns writes, Module B maintains read-optimized copy via events.
- Cross-module queries go through a domain service that coordinates calls to multiple module contracts.
- Result is assembled in application code, not in SQL.
- Enforce with PHPStan rules that flag JOINs referencing tables owned by other modules.

---

# Performance Considerations

- Application-level assembly (calling multiple services and combining results) is slower than a single SQL JOIN — typically 5-50ms per operation.
- For read-heavy UIs needing real-time cross-module data, use local projections updated via events.
- Cross-module N+1: Service A calling Service B for each item in a list. Mitigate with batch endpoints or local projections.

---

# Security Considerations

- No security isolation — authorization still at application level. Shared database user with all-table access invalidates enforcement.

---

# Common Mistakes

1. **Direct JOINs:** A single `->join('other_module_tables', ...)` defeats module isolation. Cause: SQL habit. Consequence: couples schema evolution. Better: use service call or projection.

2. **Shared database user:** All modules connect with the same user having access to all tables. Cause: convenience. Consequence: nothing prevents cross-module queries. Better: database-level permissions per module.

3. **Eloquent relationships across modules:** Defining `belongsTo` referencing another module's table. Cause: Eloquent conventions. Consequence: implicit cross-module data access. Better: use service calls to resolve relations.

---

# Anti-Patterns

- **Inconsistent projections**: Module B's local data stale because events weren't processed.
- **Cross-module N+1**: Loop over 100 items, calling a service for each.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-06 Sync inter-module comm | MMD-07 Async inter-module comm | DBC-07 Cross-context queries |
| MMD-08 Shared kernel | CPC-08 CQRS pattern | DBC-12 Eventual consistency |

---

# AI Agent Notes

- Never generate cross-module JOINs or Eloquent relationships.
- Generate service contract methods for cross-module data needs.
- Prefer event projections for read-heavy cross-module access.

---

# Verification

- [ ] No cross-module SQL JOINs exist
- [ ] No Eloquent relationships reference other module tables
- [ ] Cross-module data access uses contracts or events
- [ ] Database-level permissions restrict per-module table access
- [ ] Projection freshness is monitored
