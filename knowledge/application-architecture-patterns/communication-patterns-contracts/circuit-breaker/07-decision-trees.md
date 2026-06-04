# Decision Trees: Circuit Breaker Pattern

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Circuit breaker pattern
- **Knowledge Unit ID:** CPC-06
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Circuit breaker vs no circuit breaker | Architecture | Cross-context call protection |
| 2 | Three-state implementation vs two-state (open/closed only) | Architecture | Circuit breaker design |
| 3 | Fail-fast with fallback vs fail-hard with error | Architecture | Failure response strategy |

---

## Decision 1: Circuit breaker vs no circuit breaker

### Context
Synchronous cross-context calls are vulnerable to cascading failures. Without a circuit breaker, when Context B goes down, every request to Context A that calls Context B waits for the full timeout. Under load, connections pile up, threads exhaust, and Context A also becomes unavailable. The circuit breaker fails fast — it detects the failure pattern and immediately rejects calls without attempting the actual request.

### Decision Tree

```
Is this a synchronous call to another bounded context?
├── YES → Circuit breaker strongly recommended
│   Is this call in the critical path (user waits for it)?
│   ├── YES → Circuit breaker REQUIRED
│   │   Without it, downstream failure takes down the upstream
│   │   Cascading failures affect all callers
│   └── NO (background, non-critical)
│       → Circuit breaker still recommended
│       Non-critical paths can also cause cascading issues
│       At minimum, add a timeout
└── NO (async via queue, or within same context)
    → No circuit breaker needed
    Async queues already provide resilience (retries, delays)
    Same-context calls don't cross a network boundary
```

### Rationale
Circuit breakers protect against cascading failures — the most dangerous failure mode in distributed systems. When one service fails, all services that depend on it also fail if they wait for timeouts. The circuit breaker detects the pattern of failures and fails fast, containing the blast radius. Every synchronous cross-context call needs one. The cost is minimal (a state check per call) and the benefit is system-wide resilience.

### Recommended Default
Circuit breaker for every synchronous cross-context call

### Risks
- No circuit breaker: downstream failure cascades upstream
- Circuit breaker on async: unnecessary overhead (queue provides resilience)
- Circuit breaker on internal calls: over-engineering for same-process calls

### Related Rules
- Wrap all synchronous cross-context calls with a circuit breaker (CPC-06/05-rules.md)
- Implement all three circuit states (CPC-06/05-rules.md)
- Tune thresholds per service (CPC-06/05-rules.md)

### Related Skills
- Implement Circuit Breaker for Synchronous Cross-Context Calls (CPC-06/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Enforce Timeout and Retry Strategies (AEG-04/06-skills.md)

---

## Decision 2: Three-state implementation vs two-state (open/closed only)

### Decision Tree

```
Does the circuit need to recover automatically when the downstream service comes back?
├── YES → Implement all three states
│   Closed → Open → Half-Open → Closed (or back to Open)
│   Half-open allows test requests to check recovery
│   Without half-open, the circuit stays open forever
│   Manual repair required for every outage
│   Pros: automatic recovery, no manual intervention
│   Cons: more complex implementation
└── NO (manual recovery is acceptable)
    → Two-state may be acceptable (but rarely)
    Open and Closed only — once open, stays open until manual reset
    When would manual recovery be acceptable?
    ├── Non-critical service with operations team on call
    │   Ops manually resets circuit when they confirm recovery
    └── Critical service — NEVER acceptable
        Critical services must recover automatically
        Implement three states
```

### Rationale
Two-state circuit breakers (open/closed only) create permanent outages without manual intervention. When the circuit opens, it stays open even after the downstream service recovers. Three-state breakers automatically test recovery via half-open — after a timeout, a limited number of requests pass through. If they succeed, the circuit closes. If they fail, it reopens. Automatic recovery is essential for production systems where relying on manual intervention is impractical.

### Recommended Default
Always implement all three states (closed, open, half-open)

### Risks
- Two-state: permanent open on failure, requires manual reset
- Missing half-open timeout: circuit never transitions from open to half-open
- Half-open threshold too high: too many test requests overwhelm recovering service

### Related Rules
- Implement all three circuit states (CPC-06/05-rules.md)
- Always provide fallback responses (CPC-06/05-rules.md)
- Monitor and alert on circuit state changes (CPC-06/05-rules.md)

### Related Skills
- Implement Circuit Breaker for Synchronous Cross-Context Calls (CPC-06/06-skills.md)
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Implement Message Bus (CPC-05/06-skills.md)

---

## Decision 3: Fail-fast with fallback vs fail-hard with error

### Decision Tree

```
When the circuit is open, what should the caller receive?
├── A degraded but functional response
│   → Fail-fast with fallback
│   Return cached data, default values, or approximate results
│   "We can't show live inventory, showing yesterday's numbers"
│   User still gets useful information
│   Types of fallback:
│   ├── Cached response from last successful call
│   ├── Default values (empty list, zero, null)
│   └── Approximate data from a different source
├── An error (user sees failure)
│   → Fail-hard with error
│   Return HTTP 503 or throw exception
│   User sees an error message
│   When is hard failure acceptable?
│   ├── Financial operations where stale data is dangerous
│   │   Showing "payment was processed" when it might not have been
│   └── Mutations where fallback is meaningless
│       "Create invoice" with fallback = impossible
└── Is the operation a read or a write?
    ├── Read → Fallback usually possible (cache, defaults)
    └── Write → Fallback usually impossible
        Hard error may be the only option
```

### Rationale
Fail-fast with fallback provides the best user experience when a downstream service is unavailable. The user gets degraded but functional service instead of an error page. For reads (fetching data), cached or default responses are almost always possible. For writes (creating, updating), fallback is usually impossible — the system must return an error. The key is to distinguish between operations where stale data is acceptable and where it's dangerous.

### Recommended Default
Fail-fast with fallback for reads; fail-hard for writes when fallback is impossible

### Risks
- No fallback: user sees error on every circuit open, even for reads
- Stale fallback data: returning outdated data that could cause wrong decisions
- Fallback for mutations: silently accepting writes that will never be processed

### Related Rules
- Always provide fallback responses (CPC-06/05-rules.md)
- Monitor and alert on circuit state changes (CPC-06/05-rules.md)
- Tune thresholds per service (CPC-06/05-rules.md)

### Related Skills
- Implement Circuit Breaker for Synchronous Cross-Context Calls (CPC-06/06-skills.md)
- Implement Cache-Aside Pattern (CPC-12/06-skills.md)
- Implement Distributed Tracing (CPC-11/06-skills.md)
