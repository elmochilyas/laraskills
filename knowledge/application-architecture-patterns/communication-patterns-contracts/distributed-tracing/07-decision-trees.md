# Decision Trees: Distributed Tracing Across Contexts

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Distributed tracing across contexts
- **Knowledge Unit ID:** CPC-11
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Automatic vs manual correlation ID propagation | Architecture | Trace propagation strategy |
| 2 | Always trace vs sampling strategy | Architecture | Trace storage cost management |
| 3 | Correlation ID only vs correlation + causation IDs | Architecture | Trace data granularity |

---

## Decision 1: Automatic vs manual correlation ID propagation

### Context
When a request starts, a correlation ID is assigned. As the request crosses context boundaries (queued events, HTTP calls, message bus), this ID must be propagated. Automated propagation uses middleware to inject the ID into every outgoing call. Manual propagation requires developers to pass the ID at every boundary.

### Decision Tree

```
How is the correlation ID passed across boundaries?
├── Automatically via middleware/subscribers
│   → Correct approach — no developer effort per boundary
│   HTTP middleware → adds correlation ID to request context
│   Job middleware → extracts ID from job, sets logging context
│   Event subscribers → propagates ID to queued events
│   HTTP client middleware → adds header to outgoing HTTP calls
│   Pros: zero developer effort, no gaps, consistent
│   Cons: initial setup of middleware infrastructure
│   └── Are all boundary types covered?
│       ├── YES → Full trace coverage automatically
│       └── NO → Add middleware for each uncovered boundary type
├── Manually in each boundary crossing
│   → Fragile — relies on developer discipline
│   Developer must remember to:
│   - Pass ID to event constructor
│   - Add ID to job payload
│   - Include header in HTTP calls
│   └── Will developers always remember?
│       ├── NO → Gaps in tracing are guaranteed
│       │   Manual propagation always has gaps
│       └── YES (unlikely) → Still fragile
│           New developer, time pressure, oversight → broken chain
└── Not propagated at all
    → Orphan traces — cannot trace across boundaries
    Correlation ID assigned at HTTP entry but never passed to events
    Event handlers have no correlation context
    Debugging impossible across the boundary
```

### Rationale
Automatic propagation is the only reliable approach. Manual propagation depends on every developer remembering to pass the correlation ID at every boundary — under time pressure or with new team members, gaps are inevitable. Once a gap occurs, the trace is broken and downstream operations become orphan traces. Automatic propagation via middleware requires initial setup effort but provides consistent, gap-free tracing with zero ongoing developer effort.

### Recommended Default
Always use automatic propagation via middleware; never rely on manual passing

### Risks
- Manual propagation: gaps on oversight, broken traces, orphan operations
- No propagation at all: each boundary crossing creates orphan trace
- Automatic with gaps: some boundary types not covered by middleware

### Related Rules
- Automate propagation (CPC-11/05-rules.md)
- Assign a correlation ID at every entry point (CPC-11/05-rules.md)
- Propagate correlation ID on every boundary crossing (CPC-11/05-rules.md)

### Related Skills
- Implement Distributed Tracing Across Bounded Contexts (CPC-11/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)
- Implement Observability (AEG-06/06-skills.md)

---

## Decision 2: Always trace vs sampling strategy

### Decision Tree

```
What is the request volume of the system?
├── Low traffic (< 1,000 requests/second)
│   → Always trace — no sampling needed
│   Storage costs are low enough to trace everything
│   Every request has a complete trace
│   Debugging any request is immediate
│   Cost: trace storage proportional to request count
├── High traffic (1,000-10,000 requests/second)
│   → Sample traces — trace 1 in 100 requests
│   Sampling rate: 1% (trace 1% of requests)
│   Full trace for critical paths always (payment, auth failures)
│   Cost control without losing debugging capability
│   └── Are there critical paths that must always be traced?
│       ├── YES → Always-sample those paths + sample the rest
│       │   Payment, auth failures, security events: always trace
│       │   Other requests: 1% sampling
│       └── NO → Uniform sampling is fine
└── Very high traffic (> 10,000 requests/second)
    → Aggressive sampling — trace 1 in 1,000 or less
    Store traces in cheap/long-term storage
    Use aggregated metrics instead of individual traces for most analysis
    Sample rate based on budget and debugging requirements
```

### Rationale
Tracing every request in a high-traffic system generates massive storage costs — each trace contains spans, timestamps, tags, and metadata. Sampling controls costs while retaining debugging capability. A 1% sample of a high-traffic system provides enough traces for most debugging scenarios. Critical paths (payment, auth failures) can be exempted from sampling and always traced. The key is to identify which paths are too important to miss.

### Recommended Default
Always trace for low traffic; 1% sampling for high traffic with critical-path overrides

### Risks
- Always trace on high traffic: unbounded storage costs
- Sampling on critical paths: missing traces for security/revenue-critical failures
- No sampling at all: storage costs grow with every successful request

### Related Rules
- Apply sampling strategies for high-traffic systems (CPC-11/05-rules.md)
- Assign a correlation ID at every entry point (CPC-11/05-rules.md)
- Include causation ID for building causal chains (CPC-11/05-rules.md)

### Related Skills
- Implement Distributed Tracing Across Bounded Contexts (CPC-11/06-skills.md)
- Implement Observability (AEG-06/06-skills.md)
- Implement Monitoring Dashboards (AEG-08/06-skills.md)

---

## Decision 3: Correlation ID only vs correlation + causation IDs

### Decision Tree

```
What level of trace detail is needed?
├── Full causal chain
│   → Correlation ID (trace) + Causation ID (parent)
│   Correlation ID: identifies the original operation (the request that started everything)
│   Causation ID: identifies the immediate parent (the event that caused this operation)
│   This enables building a tree:
│   └── Request A (correlation: A, causation: null)
│       ├── Event B (correlation: A, causation: A)
│       │   └── Event C (correlation: A, causation: B)
│       └── Event D (correlation: A, causation: A)
│   └── How many causal levels deep?
│       ├── 1-2 levels → Correlation ID alone may suffice
│       │   Simple chaining without fan-in/fan-out
│       └── 3+ levels → Causation ID essential
│           Without it, you see events share a trace but can't tell
│           which event triggered which — crucial for debugging
├── Trace-level only (no parent tracking)
│   → Correlation ID alone is sufficient
│   All events in the same trace share the same correlation ID
│   Can group logs by trace
│   Cannot build causal tree — cannot tell which event caused which
│   Acceptable for systems with simple event chains
└── Neither — no IDs at all
    → Untraceable system
    No way to correlate events or logs across context boundaries
    Each event is an isolated log entry
```

### Rationale
Correlation ID groups all operations in a trace; causation ID builds the causal tree within the trace. With only a correlation ID, you can see all operations from a single request, but you can't tell which event triggered which — in a fan-out scenario where Event A triggers Events B and C, both B and C share the same correlation ID, but you can't tell they were triggered in parallel by A. Causation ID provides the parent reference. For complex event chains, causation ID is essential for debugging.

### Recommended Default
Both correlation ID (trace) and causation ID (causal chain)

### Risks
- Correlation only: can't distinguish triggered from triggering operations
- Neither: no traceability across contexts whatsoever
- Causation without correlation: can see parent but can't group by request

### Related Rules
- Include causation ID for building causal chains (CPC-11/05-rules.md)
- Assign a correlation ID at every entry point (CPC-11/05-rules.md)
- Propagate correlation ID on every boundary crossing (CPC-11/05-rules.md)

### Related Skills
- Implement Distributed Tracing Across Bounded Contexts (CPC-11/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)
- Implement Observability (AEG-06/06-skills.md)
