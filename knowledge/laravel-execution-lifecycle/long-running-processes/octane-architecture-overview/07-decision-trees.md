# Decision Trees: Octane Architecture Overview

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Octane Architecture Overview
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-OA-01 | Octane Adoption Decision | Architecture | High | Per project |
| DT-OA-02 | Singleton vs Scoped Binding Classification | Architecture | High | Per service provider |
| DT-OA-03 | Runtime Adapter Selection (Swoole/RoadRunner/FrankenPHP) | Architecture | High | Per infrastructure setup |

---

## DT-OA-01: Octane Adoption Decision

### Decision Context
- **When to decide:** During project architecture evaluation
- **Stakeholders:** Backend Developers, DevOps, Technical Leadership
- **Trigger:** Evaluating whether to migrate from PHP-FPM to Octane
- **Constraint:** Octane requires binding audit, operational complexity, and dependency compatibility checks

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Traffic volume | High | 100+ req/s justifies Octane overhead |
| I/O vs CPU bound | High | I/O-bound apps benefit most from Octane |
| Team readiness | High | Must audit bindings and handle state correctly |
| Runtime compatibility | High | Must verify coroutine compatibility for Swoole |

### Decision Tree

```
Does the application serve 100+ requests/second?
├── Yes — high traffic
│   ├── Is the application I/O-bound or CPU-bound?
│   │   ├── I/O-bound (waiting on DB, APIs, file reads)
│   │   │   └── Octane is a strong fit
│   │   │       ├── 10-50x throughput improvement over PHP-FPM
│   │   │       ├── Must audit all singleton bindings
│   │   │       ├── Must verify package compatibility
│   │   │       └── Must set up memory monitoring
│   │   │
│   │   └── CPU-bound (heavy computation per request)
│   │       └── Octane benefit is limited
│   │           ├── Bootstrap savings still apply (~50-150ms)
│   │           └── CPU contention may negate gains
│   │
│   └── (I/O-bound apps benefit most)
│
├── No — low traffic
│   └── Octane is likely not worth the complexity
│       ├── PHP-FPM with opcache and config caching is sufficient
│       └── Operational complexity outweighs bootstrap savings
│
└── (migrate only if traffic justifies operational cost)
```

### Rationale
Octane provides 10-50x throughput improvements for I/O-bound applications by eliminating per-request bootstrap. However, it introduces significant operational complexity: singleton state audits, package compatibility verification, memory monitoring, worker management. Low-traffic applications rarely justify this overhead.

### Default Path
Use PHP-FPM for low-traffic apps. Migrate to Octane for high-traffic, I/O-bound applications with a team ready to manage the operational complexity.

### Risks
- Deploying without binding audit — silent data leaks between requests
- Swoole coroutines with blocking I/O — entire worker blocks, negating concurrency benefits
- No max_requests configured — workers grow unbounded until OOM

### Related Rules/Skills
- Audit every singleton for mutable state before deploying Octane
- Skill: Audit Service Providers for Octane Singleton Safety

---

## DT-OA-02: Singleton vs Scoped Binding Classification

### Decision Context
- **When to decide:** During service provider audit for Octane
- **Stakeholders:** Backend Developers
- **Trigger:** Pre-Octane deployment audit of container bindings
- **Constraint:** Singletons with mutable per-request state cause cross-request data leaks

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| State mutability | High | Does the service store mutable per-request state? |
| Dependency graph | High | A safe singleton depending on unsafe singleton is itself unsafe |
| Instantiation cost | Medium | Scoped adds ~1ms per request per binding |

### Decision Tree

```
Does the service hold any mutable state that changes per request?
├── No — stateless or immutable (config readers, HTTP clients, loggers)
│   └── Keep as singleton
│       ├── Preserves long-lived connections and caches
│       └── No risk of cross-request contamination
│
├── Yes — holds per-request state (auth guard, session, locale, tenant)
│   └── Convert to scoped()
│       ├── Provides per-request isolation
│       ├── In-request singleton performance
│       └── Sandbox discards instance after request
│
└── Unknown — check dependency graph
    └── Trace all dependencies
        ├── Does any dependency store mutable per-request state?
        │   ├── Yes — the service transitively becomes unsafe
        │   │   └── Convert to scoped()
        │   └── No — safe singleton
        │       └── Keep as singleton
        │
        └── (dependency-contaminated singletons are still unsafe)
```

### Rationale
The risk is not just direct state mutation but transitive contamination — a safe singleton that depends on an unsafe singleton is itself unsafe because it receives stale instances from the unsafe dependency. Scoped bindings are the default safety mechanism: fresh instance per request, discarded after request.

### Default Path
Keep stateless/immutable services as singletons. Convert all per-request stateful services to `scoped()`.

### Risks
- Over-converting: turning connection pools and config readers into scoped adds unnecessary overhead
- Missing transitive contamination: a safe singleton depending on unsafe singleton is still unsafe
- Not auditing vendor providers: package singletons may leak state silently

### Related Rules/Skills
- Audit every singleton for mutable state before deploying Octane
- Use `scoped()` for all per-request stateful services
- Skill: Audit Service Providers for Octane Singleton Safety

---

## DT-OA-03: Runtime Adapter Selection (Swoole/RoadRunner/FrankenPHP)

### Decision Context
- **When to decide:** During Octane infrastructure setup
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Choosing which Octane runtime to deploy
- **Constraint:** Each runtime has distinct concurrency model, coroutine support, and operational requirements

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Concurrency requirement | High | Coroutine support vs process isolation |
| Operational complexity | High | PHP extension (Swoole) vs binary install (RoadRunner, FrankenPHP) |
| Dependency compatibility | High | Swoole requires coroutine-safe dependencies |
| HTTP/2 support | Medium | RoadRunner natively supports HTTP/2 |

### Decision Tree

```
What is the team's experience level and dependency profile?
├── Standard PHP dependencies, moderate team experience
│   └── RoadRunner (process isolation, no coroutine concerns)
│       ├── Each worker is a separate PHP process
│       ├── No coroutine compatibility issues
│       ├── HTTP/2 support
│       └── Binary install (goroutine-backed)
│
├── Heavy I/O, expert team, dependencies are coroutine-safe
│   └── Swoole (maximum performance, coroutine concurrency)
│       ├── Coroutines: zero-overhead context switching for I/O wait
│       ├── Requires coroutine-safe dependencies
│       ├── PHP extension (pecl install swoole)
│       └── Most performant for high-concurrency I/O workloads
│
├── Existing Caddy architecture, minimal configuration
│   └── FrankenPHP (Caddy integration, simplest setup)
│       ├── Built on Caddy web server
│       ├── Go worker pool
│       ├── Static files served by Caddy directly
│       └── Single binary deployment
│
└── (match runtime to team expertise and dependency profile)
```

### Rationale
RoadRunner provides process isolation, making it the safest choice for teams new to Octane — no coroutine compatibility concerns and no PHP extension needed. Swoole offers maximum performance with coroutines but requires the most expertise and dependency auditing. FrankenPHP is the simplest operational setup if Caddy is already in use.

### Default Path
RoadRunner for teams new to Octane. Swoole for expert teams with coroutine-safe dependencies. FrankenPHP for Caddy-based infrastructure.

### Risks
- Swoole with blocking I/O in coroutines — entire worker blocks
- RoadRunner process per core — may not fully utilize hardware for I/O-bound workloads
- FrankenPHP sandbox reuse may not fire RequestTerminated every request

### Related Rules/Skills
- Run each Octane runtime's adapter-specific tests
- Skill: Audit Service Providers for Octane Singleton Safety
