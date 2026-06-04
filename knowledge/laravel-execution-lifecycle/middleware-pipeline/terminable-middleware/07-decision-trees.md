# Terminable Middleware — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Terminable Middleware
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Post-middleware code vs terminable middleware | Running code after response is ready | Response latency; blocking behavior |
| 2 | Synchronous terminate vs queue dispatch | Handling work in `terminate()` | Throughput; worker blocking |
| 3 | Global/group vs route-level registration | Registering terminable middleware | Correctness — terminate() will/won't run |

---

## Decision 1: Post-Middleware Code vs Terminable Middleware

### Decision Context
You have logic that should run after the response. Decide between post-middleware code (after `$next($request)` in `handle()`) and terminable middleware (`terminate()` method).

### Decision Criteria
- **Modifies response?** Yes → post-middleware; No → either
- **Must block response?** Yes (critical, must complete) → post-middleware; No (can be deferred) → terminable
- **Client wait time**: Must not increase → terminable; Can increase → post-middleware
- **Response content access**: Need response body/headers → post-middleware; Need only request/response meta → terminable

### Decision Tree
```
Post-response logic placement?
├── Modifies the response content or headers
│   └── MUST use post-middleware in handle() — terminate() runs after response is sent
├── Does NOT modify the response
│   ├── Must complete before client gets response (critical logging, auditing)
│   │   └── Use post-middleware — guarantees completion before response sent
│   ├── Can complete after client gets response (analytics, metrics, cleanup)
│   │   └── Use terminable middleware — client doesn't wait
│   └── Heavy processing (>10ms)
│       └── Use terminable middleware + queue — don't block worker
├── Response NOT yet available (need to wait for controller)
│   ├── But must be synchronous
│   │   └── Post-middleware in handle()
│   └── Can be deferred
│       └── Terminable middleware
└── ERROR: Logic that MUST succeed vs best-effort
    ├── Must succeed → post-middleware (can throw, response not sent yet)
    └── Best-effort → terminable (response already sent, wrap in try-catch)
```

### Rationale
Post-middleware code runs before the response is sent — it blocks the response but can modify it. Terminable middleware runs after the response is sent — it doesn't block the client but cannot modify the response and can only fail silently. The choice depends on whether the operation is critical and whether it modifies the response.

### Default
Use post-middleware for response modification. Use terminable middleware for non-critical, post-response cleanup.

### Risks
- Putting response modifications in terminate(): no effect, confusing code
- Putting critical business logic in terminate(): response sent, operation fails silently
- Heavy operations in either: blocks response (post) or worker (terminable)

### Related Rules/Skills
- Keep `terminate()` Lightweight for Minimal Process Blocking
- Always Wrap `terminate()` Logic in a Try-Catch Block
- Skill: Implement Terminable Middleware
- Skill: Implement Pre- and Post-Middleware Code

---

## Decision 2: Synchronous Terminate vs Queue Dispatch

### Decision Context
Logic in `terminate()` needs to perform work. Decide whether to run it synchronously or dispatch a queue job.

### Decision Criteria
- **Duration**: <10ms → synchronous terminate; >10ms → queue
- **Criticality**: Must complete before next request → synchronous; Best-effort → queue
- **Ordering**: Must run after previous terminate but before next → synchronous; Independent → queue
- **Failure handling**: Must retry on failure → queue; Fire-and-forget → either

### Decision Tree
```
Work in terminate() — sync vs queue?
├── Operation is FAST (<10ms)
│   ├── Session write, simple logging, counter increment
│   │   └── Run SYNCHRONOUSLY in terminate()
│   └── Fast but MUST persist (audit trail)
│       └── Run SYNCHRONOUSLY — immediate, no queue delay
├── Operation is MODERATE (10-100ms)
│   ├── Can batch and defer
│   │   └── Dispatch to QUEUE — prevents worker blocking
│   └── Must complete before next request (rare)
│       └── Run SYNCHRONOUSLY — document the throughput impact
├── Operation is HEAVY (>100ms)
│   ├── Email sending, report generation, external API calls
│   │   └── ALWAYS dispatch to QUEUE
│   └── Image processing, file generation
│       └── ALWAYS dispatch to QUEUE
└── Reliability requirements
    ├── Must succeed → queue (retry mechanism)
    ├── Best-effort → synchronous in terminate() is simpler
    └── Ordering matters → queue with single worker
```

### Rationale
The PHP worker is blocked during `terminate()`. Synchronous operations that take milliseconds are fine — the worker is briefly occupied but returns to the pool quickly. Operations that take longer reduce throughput proportionally (a 500ms terminate reduces throughput by 500ms per request). Queue dispatch itself takes <1ms and returns immediately.

### Default
Use synchronous `terminate()` for fast operations (<10ms) like session writes and simple logging. Dispatch to queue for anything heavier.

### Risks
- Heavy synchronous terminate: worker pool exhaustion, increased latency for other requests
- Queue dispatch in every terminate: queue buildup if workers can't keep up
- Try-catch needed in both paths: uncaught exception crashes worker

### Related Rules/Skills
- Keep `terminate()` Lightweight for Minimal Process Blocking
- Use Queues Instead of Heavy `terminate()` for Asynchronous Work
- Skill: Implement Terminable Middleware

---

## Decision 3: Global/Group vs Route-Level Registration

### Decision Context
Registering a middleware that implements `terminate()`. Decide whether to put it in the global stack, a group, or as route-level middleware.

### Decision Criteria
- **terminate() required?** Middleware has `terminate()` → must be global or group; route-level won't trigger terminate
- **Scope needed**: All routes → global; Group of routes → group; Specific route → CANNOT use route-level (terminate won't run)

### Decision Tree
```
Registering terminable middleware?
├── Middleware has terminate() method
│   ├── Must terminate on ALL routes
│   │   └── Register in GLOBAL stack
│   ├── Must terminate on a GROUP of routes
│   │   └── Register in a GROUP (web, api, or custom)
│   └── Must terminate on a single route
│       └── REGISTER IN GLOBAL/GROUP anyway — route-level terminate() never called
│       └── Use `withoutMiddleware()` on routes that should NOT have it
├── Middleware does NOT have terminate()
│   ├── Route-level is fine
│   └── No terminable concern
└── Checking if terminate() will run
    ├── Register in global → YES
    ├── Register in group → YES
    ├── Register at route level `->middleware(...)` → NO
    └── Solution: register in group, use withoutMiddleware on exceptions
```

### Rationale
The kernel's `sendRequestThroughPipeline()` only tracks middleware from global and group sources for termination. Route-level middleware is not tracked, so `terminate()` is never called. This is a framework limitation — middleware that needs termination must be in a global or group stack.

### Default
Register terminable middleware in global or group stacks. If it should only run on specific routes, add it to a group and use `withoutMiddleware()` on routes that should skip it.

### Risks
- Route-level terminable middleware: `terminate()` silently never runs
- Using withoutMiddleware() on global terminable: works correctly
- Group-level terminable with withoutMiddleware(): works correctly

### Related Rules/Skills
- Register Terminable Middleware in Global or Group Stacks — Not Route Only
- Skill: Implement Terminable Middleware
