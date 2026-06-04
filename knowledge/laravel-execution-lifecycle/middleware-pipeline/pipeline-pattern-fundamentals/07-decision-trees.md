# Pipeline Pattern Fundamentals — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Pipeline Pattern Fundamentals
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | When to use the Pipeline pattern vs simpler alternatives | Designing a processing flow for requests, data, or jobs | Architecture; maintainability; performance |
| 2 | Class-string pipe vs closure pipe in `through()` | Writing middleware or pipeline definitions | Performance; cacheability; testability |
| 3 | Single pipeline vs nested pipelines | Processing flow with sub-stages | Complexity; debugging; reusability |
| 4 | Short-circuit vs always delegate downstream | Auth/validation middleware that may reject | Security; correctness; error handling |

---

## Decision 1: When to Use the Pipeline Pattern

### Decision Context
You need to process an input through multiple sequential stages. Choose between Pipeline, a simple function, a loop, an event system, or parallel processing.

### Decision Criteria
- **Number of stages**: 1 stage → function call; 2+ stages → Pipeline
- **Execution model**: Sequential needed → Pipeline; parallel → different pattern
- **Stage variability**: Stages change independently → Pipeline (composable); fixed stages → loop or function
- **Cross-cutting concerns**: Pre/post wrapping needed → Pipeline (onion model); fire-and-forget → events
- **Reusability**: Same pipe set reused across flows → Pipeline; one-off → simple function

### Decision Tree
```
Processing flow needed?
├── Single step (1 stage)
│   └── Use a simple function call or direct method invocation
├── Multiple sequential stages
│   ├── Stages are fixed and never change independently
│   │   └── Use a foreach loop or array of callables
│   ├── Stages are composable/reorderable
│   │   └── Use Pipeline pattern
│   ├── Pre/post wrapping needed (onion model)
│   │   └── Use Pipeline pattern
│   └── Event-driven or asynchronous
│       └── Use Laravel event system or queue
├── Parallel processing
│   └── Use different pattern (e.g., parallel collections, promises)
└── Complex branching logic
    └── Use Strategy or Chain-of-Responsibility pattern
```

### Rationale
The Pipeline pattern shines when you need composable, reorderable stages with pre/post wrapping. For fixed stages, simpler constructs avoid abstraction overhead. Events are better for decoupled, fire-and-forget flows.

### Default
Use Pipeline for any HTTP middleware chain, job middleware, or mail middleware. Use foreach for fixed transformation steps.

### Risks
- Over-engineering: Pipeline for single-step adds unnecessary abstraction
- Misuse for parallel work: Pipeline is strictly sequential
- Closure-based pipelines: Cannot be route-cached

### Related Rules/Skills
- Prefer Class-String Pipes Over Closures in `through()`
- Keep Each Pipe Focused on a Single Concern
- Skill: Implement a Custom Pipeline

---

## Decision 2: Class-String Pipe vs Closure Pipe

### Decision Context
You are populating the `through()` array in a pipeline and must decide how to represent each pipe.

### Decision Criteria
- **Environment**: Production → class string; ad-hoc/testing → closure
- **Need for DI**: Container dependencies needed → class string; no dependencies → either
- **Route caching**: Routes will be cached → class string only
- **Reusability**: Pipe used in multiple places → class string; one-off logic → closure
- **Testability**: Need to unit test pipe → class string; inline test → closure

### Decision Tree
```
Pipe representation?
├── Production code
│   ├── Route will be cached
│   │   └── MUST use class-string pipe (closures cannot be serialized)
│   ├── Pipe needs container dependencies (DI)
│   │   └── Use class-string pipe (resolved from container)
│   ├── Pipe reused in multiple pipelines
│   │   └── Use class-string pipe (reusable class)
│   └── Simple, one-off, no caching needed
│       └── Prefer class-string anyway; closure is acceptable for trivial cases
├── Development/testing
│   ├── Quick experiment or prototype
│   │   └── Closure pipe is acceptable
│   └── Test needs inline behavior
│       └── Closure pipe in test is fine
└── Both work? Always choose class-string
```

### Rationale
Class-string pipes support container resolution (DI), route caching (serialization), and individual testing. Closures are convenient but sacrifice these capabilities. The only reason to choose a closure is temporary/exploratory code.

### Default
Always use class-string pipes for production pipeline definitions.

### Risks
- Closure pipes in cached routes → routes cannot be cached; performance regression
- Class-string with typo → `BindingResolutionException` at runtime

### Related Rules/Skills
- Prefer Class-String Pipes Over Closures in `through()`
- Skill: Implement a Custom Pipeline

---

## Decision 3: Short-Circuit vs Always Delegate

### Decision Context
Your middleware can either return a response immediately (short-circuit) or call `$next($request)` to continue the pipeline.

### Decision Criteria
- **Guard condition**: Auth failure, rate limit hit, maintenance mode → short-circuit
- **Observation only**: Logging, timing, adding headers → always delegate
- **Modification**: Transforming request/response → delegate after modification
- **Error state**: Unrecoverable error → short-circuit with error response
- **Recoverable issue**: Log warning and continue → delegate

### Decision Tree
```
Middleware behavior?
├── Guard/protection middleware
│   ├── Condition met (allowed)
│   │   └── Call $next($request) — continue pipeline
│   └── Condition not met (blocked)
│       └── Return response directly — short-circuit (auth failure, rate limit, CSRF)
├── Observation/logging middleware
│   ├── Inbound observation (log request)
│   │   └── Log, then call $next($request)
│   └── Outbound observation (log response)
│       └── Call $next($request), capture response, log, return response
├── Modification middleware
│   ├── Request modification (add header, trim string)
│   │   └── Modify request, call $next($request)
│   └── Response modification (compress, add header)
│       └── Call $next($request), modify response, return modified response
└── Error/unrecoverable state
    └── Return error response — short-circuit (500, 503)
```

### Rationale
Short-circuit is for stopping the pipeline when further processing is pointless or dangerous. All other middleware should delegate. The distinction is critical: guard middleware that forgets to short-circuit on failure allows unauthorized access; observation middleware that short-circuits prevents the response from reaching the client.

### Default
Always call `$next($request)` and return its result unless there is a specific reason to short-circuit.

### Risks
- Missing short-circuit on auth failure: security bypass
- Short-circuiting observation middleware: prevents response delivery
- Forgetting `return` before `$next($request)`: pipeline silently halts

### Related Rules/Skills
- Always Return `$next($request)` from `handle()`
- Understand the Short-Circuit Impact on Downstream Pipes
- Skill: Implement Pre- and Post-Middleware Code
