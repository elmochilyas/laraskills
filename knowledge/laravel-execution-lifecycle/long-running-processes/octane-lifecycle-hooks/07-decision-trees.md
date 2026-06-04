# Decision Trees: Octane Lifecycle Hooks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Octane Lifecycle Hooks
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-OH-01 | Tick Registration Strategy | Reliability | Medium | Per provider setup |
| DT-OH-02 | RequestTerminated Cleanup Strategy | Performance | Medium | Per leak remediation |
| DT-OH-03 | RequestReceived Early Denial | Security | Low | Per security setup |

---

## DT-OH-01: Tick Registration Strategy

### Decision Context
- **When to decide:** When registering periodic callbacks via Octane::tick()
- **Stakeholders:** Backend Developers
- **Trigger:** Setting up health metrics, connection pool maintenance, or periodic cleanup
- **Constraint:** Ticks block the worker from accepting requests during execution

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Execution duration | High | Must not block worker for more than a few ms |
| Crash safety | High | Must never silently kill the worker |
| Duplicate prevention | High | Provider re-calls must not register duplicate ticks |
| Request context | High | Ticks run in master container — no request/session/auth |

### Decision Tree

```
What should the tick do?
├── Collect and report metrics (memory, request count, GC roots)
│   ├── Wrap in try-catch — Metrics facade may throw
│   ├── Guard against duplicate registration
│   ├── Keep under 5ms execution
│   └── Interval: 60s for memory metrics, 300s for GC stats
│
├── Connection pool maintenance (prune idle DB connections, rotate credentials)
│   ├── Wrap in try-catch — connection methods may throw
│   ├── Guard against duplicate registration
│   ├── Keep under 50ms (heavier than metrics)
│   └── Interval: 300-600s (5-10 minutes)
│
└── Never use ticks for:
    ├── Heavy periodic work (report generation, data exports)
    │   └── Use queued jobs instead
    ├── Request-scoped business logic
    │   └── No request/auth/session context available
    └── Operations exceeding 1 second
        └── Blocks worker from accepting requests
```

### Rationale
Ticks run in the master container outside any request context. They execute inline between requests, blocking the worker from accepting new requests during execution. Heavy ticks reduce throughput. Uncaught exceptions in ticks silently kill the worker. Duplicate registrations cause multiple executions per interval.

### Default Path
Guard registration with a flag, wrap in try-catch, keep under 5ms. Use 60-second interval for metrics.

### Risks
- Uncaught exception in tick — entire worker dies silently
- Duplicate registrations from provider re-boot — N callbacks execute per interval
- Resolving request-scoped services (request(), auth(), session()) in tick — stale/null values from previous request
- Heavy tick blocking worker for 500ms+ — visible throughput reduction

### Related Rules/Skills
- Wrap `Octane::tick()` callbacks in try-catch
- Guard `Octane::tick()` registration against duplicates
- Never resolve request-scoped services inside tick callbacks
- Skill: Register Octane Lifecycle Hooks for State Cleanup and Monitoring

---

## DT-OH-02: RequestTerminated Cleanup Strategy

### Decision Context
- **When to decide:** When implementing per-request state cleanup
- **Stakeholders:** Backend Developers
- **Trigger:** Identifying static accumulators that need per-request reset
- **Constraint:** Listeners run synchronously between requests — must be fast

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Execution speed | High | Must complete under 5ms total |
| Accumulator coverage | High | Must reset all known leaky static registries |
| Runtime compatibility | Medium | FrankenPHP may not fire per-request |
| Maintenance | Medium | Adding/removing accumulators over time |

### Decision Tree

```
What needs to be cleaned up between requests?
├── Known static accumulators (Str::resetCache(), Collection::clearMacros())
│   ├── Single dedicated listener, multiple cleanup calls
│   ├── Keep under 5ms total
│   ├── Test: verify static array empties after listener runs
│   └── Document each accumulator with rationale
│
├── Package-specific cleanup (PermissionRegistrar::forgetCachedPermissions())
│   ├── Add to same listener or separate package-specific listener
│   ├── Guard with class_exists() for optional packages
│   └── Version-check: cleanup method changed between package versions
│
├── Custom app registries (event collectors, metric accumulators)
│   ├── Register cleanup in the same provider that creates the registry
│   └── Follow same pattern: fast, synchronous, tested
│
└── Never put in RequestTerminated:
    ├── Queued job dispatches (delays next request)
    ├── HTTP calls (blocks worker)
    └── Heavy I/O operations (>5ms)
        └── Use queue for async cleanup tasks
```

### Rationale
`RequestTerminated` listeners are the canonical place to reset per-request static state. They run synchronously between requests — the worker is blocked from accepting the next request during cleanup. Keeping total execution under 5ms ensures cleanup doesn't visibly reduce throughput.

### Default Path
Single dedicated listener with all cleanup calls. Keep under 5ms. Document every accumulator.

### Risks
- Heavy listener blocking worker — directly reduces throughput
- Listener itself accumulating data in static arrays — becomes new leak source
- FrankenPHP sandbox reuse may not fire RequestTerminated per-request — test runtime behavior
- Removing a listener for a class that no longer exists — ClassNotFoundException

### Related Rules/Skills
- Keep `RequestTerminated` listeners fast and synchronous
- Skill: Register Octane Lifecycle Hooks for State Cleanup and Monitoring

---

## DT-OH-03: RequestReceived Early Denial

### Decision Context
- **When to decide:** When implementing IP blocking or rate limiting at worker level
- **Stakeholders:** Backend Developers, Security
- **Trigger:** Need to reject requests before full bootstrap
- **Constraint:** Early returns must not leave mutated singleton state

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| State mutation | High | Must not mutate any state before returning early |
| Performance | Low | Runs before sandbox — minimal overhead |
| Reliability | Medium | Must not break sandbox initialization for subsequent requests |

### Decision Tree

```
Can the denial logic run without accessing any Laravel services?
├── Yes — IP check, header inspection, basic URL match
│   └── Safe to implement in RequestReceived
│       ├── Set $event->response = response('Forbidden', 403)
│       ├── Do NOT mutate: config(), app(), session, auth
│       ├── Do NOT access: database, cache, external services
│       └── Return early with minimal state footprint
│
├── No — needs database lookup, config access, or auth resolution
│   └── Use middleware instead of RequestReceived
│       ├── RequestReceived runs before sandbox initialization
│       ├── Middleware runs within the fully initialized sandbox
│       └── Can safely access all Laravel services
│
└── (RequestReceived is for simple, stateless denial only)
```

### Rationale
`RequestReceived` fires before the sandbox is fully initialized. Early returns that set `$event->response` bypass normal request processing but must leave zero state mutations behind. Any mutation to singleton state (config, container bindings) will persist across requests.

### Default Path
Use middleware for denial logic that needs Laravel services. Use `RequestReceived` only for simple stateless checks (IP block, header inspection).

### Risks
- Mutating singletons in early return — leaked state affects subsequent requests
- Accessing database or cache before sandbox ready — inconsistent state
- $event->response set without proper state cleanup — sandbox initialization may leave artifacts

### Related Rules/Skills
- Always handle early returns in `RequestReceived` listeners
- Skill: Register Octane Lifecycle Hooks for State Cleanup and Monitoring
