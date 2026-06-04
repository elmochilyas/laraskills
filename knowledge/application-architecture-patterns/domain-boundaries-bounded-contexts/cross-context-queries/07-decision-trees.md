# Decision Trees: Cross-Context Queries Without Database JOINs

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Cross-context queries without database JOINs
- **Knowledge Unit ID:** DBC-07
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Application-level aggregation vs local projection vs CQRS read model | Architecture | Cross-context query pattern |
| 2 | Batch endpoint vs N+1 loop | Architecture | List query design |
| 3 | Synchronous contract call vs direct table read | Architecture | Cross-context data access |

---

## Decision 1: Application-level aggregation vs local projection vs CQRS read model

### Context
When querying data across bounded contexts, three patterns are available: application-level aggregation (call each context's service, combine in code), local projection (event-synchronized local copy), and CQRS read model (denormalized table optimized for combined queries). Each trades consistency for performance. Direct JOINs across contexts are forbidden.

### Decision Tree

```
How frequently is the cross-context query executed?
├── Rarely (admin reports, background jobs, one-off views)
│   → Application-level aggregation
│   Call each context's service, combine in application code
│   Simple, maintains consistency, no stale data risk
│   Acceptable latency if query volume is low
├── Frequently (every page load, dashboard, listing)
│   → Is eventual consistency acceptable?
│   ├── YES → Local projection (event-synchronized)
│   │   Maintain local copy of needed fields via event listeners
│   │   Fast reads (local query), but data may be seconds/minutes stale
│   │   Requires: event listeners for create/update/delete on source
│   └── NO (real-time accuracy required)
│       → Application-level aggregation (even for frequent queries)
│       May need caching layer to handle performance
│       Or consider CQRS read model if aggregation is too slow
└── Complex combined query (filtering/sorting across context fields)
    → CQRS read model
    Build dedicated denormalized table maintained by event listeners
    Optimized for the specific query pattern
    Highest complexity but best performance for complex queries
```

### Rationale
Direct JOINs across context boundaries create schema coupling — changing one context's table breaks queries in another context. Application-level aggregation is the default because it's simple and maintains full context independence. Local projections trade eventual consistency for performance. CQRS read models are for complex queries where application-level aggregation is too slow. Each pattern has its place; JOINs do not.

### Recommended Default
Application-level aggregation for simple, infrequent queries; local projections for frequent reads

### Risks
- Direct JOIN: couples schema evolution across contexts
- Stale local projection: returning outdated data silently
- N+1 across contexts: service call per item in loop

### Related Rules
- Never JOIN across bounded context boundaries (DBC-07/05-rules.md)
- Use application-level aggregation as default for cross-context reads (DBC-07/05-rules.md)
- Use local projections for frequent cross-context queries (DBC-07/05-rules.md)

### Related Skills
- Handle Cross-Context Queries Without Database JOINs (DBC-07/06-skills.md)
- Enforce Model Ownership Per Context (DBC-05/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

---

## Decision 2: Batch endpoint vs N+1 loop

### Decision Tree

```
Are you about to call a cross-context service inside a loop?
├── YES → This creates N+1 across contexts — do NOT do this
│   `foreach ($orders as $order) { $identity->getUser($order->userId); }`
│   Can the upstream context provide a batch endpoint?
│   ├── YES → Use batch endpoint
│   │   `$identity->getUsersByIds([1, 2, 3, ...])`
│   │   One call for all IDs, returns map of id → user data
│   └── NO (upstream only provides single-entity endpoint)
│       → Add batch endpoint to the upstream context's contract
│       Single-entity endpoints inside loops are a design smell
│       Document the batch endpoint requirement with the owning team
└── NO (single cross-context call)
    → N+1 is not a concern — proceed with single call
    Is the single call returning more data than needed?
    ├── YES → Request only the specific fields/data needed
    └── NO → Single call is fine
```

### Rationale
N+1 across contexts is the cross-context equivalent of the Eloquent N+1 problem. Each loop iteration adds a separate network or service call, multiplying latency. Batch endpoints that accept multiple IDs and return a map of results reduce N calls to 1. The upstream context should provide batch endpoints as part of its contract. If a batch endpoint doesn't exist, it's a missing contract method — not a reason to tolerate N+1.

### Recommended Default
Always use batch endpoints for cross-context list queries; never call per-item in a loop

### Risks
- N+1 across contexts: N service calls instead of 1, latency multiplies
- Missing batch endpoint: single-entity endpoints as the only option
- Batch endpoint with too many IDs: payload limits, request timeouts

### Related Rules
- Use batch endpoints to avoid N+1 across contexts (DBC-07/05-rules.md)
- Prefer synchronous contract calls over shared database reads (DBC-07/05-rules.md)
- Do not use eager loading across contexts (DBC-07/05-rules.md)

### Related Skills
- Handle Cross-Context Queries Without Database JOINs (DBC-07/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Use Application-Level Aggregation (DBC-07/06-skills.md)

---

## Decision 3: Synchronous contract call vs direct table read

### Decision Tree

```
Does the consuming context need data from another context's table?
├── YES → Do NOT read the table directly
│   Direct table reads bypass the owning context's business logic and authorization
│   Instead, use the owning context's service contract
│   Does a service contract exist for this data?
│   ├── YES → Use synchronous contract call
│   │   `$identityService->getUser($id)` — proper access path
│   └── NO → Request the owning team to add a contract method
│       Direct table access is NOT the solution to a missing contract
└── NO → Local query only — no cross-context access needed
    → No cross-context concern — proceed normally
```

### Rationale
Direct table reads across contexts bypass the owning context's business logic. If Identity context has authorization rules (only active users visible, user must consent), a direct table read in Billing bypasses those rules. Reading through the service contract ensures business logic, authorization, and caching are all applied. Direct table access is a security and integrity violation, not a performance optimization.

### Recommended Default
Always use synchronous contract calls for cross-context reads; never direct table access

### Risks
- Direct table read: bypasses authorization, business logic, caching
- Missing contract: using direct table read as shortcut instead of adding contract
- Performance concern: contract call adds latency vs direct query — use local projections instead

### Related Rules
- Prefer synchronous contract calls over shared database reads (DBC-07/05-rules.md)
- Use application-level aggregation as default for cross-context reads (DBC-07/05-rules.md)
- Never JOIN across bounded context boundaries (DBC-07/05-rules.md)

### Related Skills
- Handle Cross-Context Queries Without Database JOINs (DBC-07/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
