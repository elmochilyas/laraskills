# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Cross-context queries without database JOINs
Knowledge Unit ID: DBC-07
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Cross-context queries that JOIN tables from different bounded contexts are forbidden. Replacing patterns: application-level aggregation (call service A, service B, combine), event-synchronized local projections (maintain local copy of cross-context data), CQRS read models (third model combining data from multiple contexts). Each pattern trades query simplicity for context independence.

---

# Core Concepts

- **Forbidden**: `SELECT * FROM billing_invoices JOIN catalog_products ON ...`.
- **Allowed patterns**: Application-level aggregation, local projection (event-synchronized), CQRS read model, caching via event subscription.

---

# When To Use

- Application-level aggregation: simple cross-context data needs, low query volume, real-time accuracy required.
- Local projections: frequent cross-context queries, high performance requirements, eventual consistency acceptable.

---

# When NOT To Use

- Direct JOINs across context boundaries — never.
- N+1 patterns across contexts (service call per item in loop). Use batch endpoints.

---

# Best Practices

- **Never JOIN across context boundaries.** WHY: A JOIN between context tables couples schema evolution. The extra code for application-level aggregation is the price of decoupling.
- **Use local projections for frequent queries.** WHY: Maintain a local copy of cross-context data updated via events. Enables fast local queries without cross-context service calls.
- **Use batch endpoints for cross-context loops.** WHY: `foreach ($orders as $order) { $billing->getPayment(...); }` creates N+1 across contexts. Batch endpoints aggregate data in one call.
- **Invalidate projections when source data changes.** WHY: Stale local projections return stale data silently. Use event listeners to invalidate/update.

---

# Architecture Guidelines

- Application-level aggregation: call multiple service contracts, combine results in application code.
- Local projection: event listener updates local table/cache when source context dispatches events.
- CQRS read model: dedicated read model optimized for cross-context queries, maintained by event listeners.

---

# Performance Considerations

| Pattern | Consistency | Performance | Complexity |
|---|---|---|---|
| App-level aggregation | Strong | Slower (N calls) | Low |
| Local projection | Eventual | Fast (local query) | Medium |
| CQRS read model | Eventual | Fastest | High |

---

# Security Considerations

- Cross-context queries through contracts ensure authorization is applied at the context boundary.

---

# Common Mistakes

1. **Direct JOIN anyway:** Single `->join('other_context_tables', ...)` defcats isolation. Cause: SQL habit. Consequence: couples schema evolution. Better: application-level aggregation.

2. **N+1 across contexts:** Service call per item in loop. Cause: naive code. Consequence: N service calls instead of 1. Better: batch endpoints.

3. **Stale local projections:** Cache not invalidated when source changes. Cause: missing event listener. Consequence: silent stale data. Better: subscribe to source events.

---

# Anti-Patterns

- **Cross-context JOINs**: Query joining tables from different contexts.
- **N+1 cross-context queries**: Loop with service call per iteration.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-05 Model ownership | MMD-10 Cross-module data access | DBC-12 Eventual consistency |
| DBC-06 Schema per context | CPC-08 CQRS pattern | DBC-11 Multi-context transactions |

---

# AI Agent Notes

- Never generate cross-context JOINs.
- Prefer local projections for frequent cross-context reads.
- Generate batch endpoints for list cross-context queries.

---

# Verification

- [ ] No cross-context JOINs exist
- [ ] Cross-context data obtained via contracts or events
- [ ] N+1 patterns are addressed with batch endpoints
- [ ] Local projections are invalidated on source changes
- [ ] Application-level aggregation is the default for real-time data
