# Decision Trees: Events Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Events Caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-EC-01 | Closure vs Class Listener Registration | Architecture | Medium | Per listener creation |
| DT-EC-02 | event:cache in Deployment Sequence | Reliability | Low | Per deployment |
| DT-EC-03 | Static $listen Array vs Dynamic Auto-Discovery | Performance | Medium | Per service provider setup |

---

## DT-EC-01: Closure vs Class Listener Registration

### Decision Context
- **When to decide:** When defining a new event listener
- **Stakeholders:** Backend Developers
- **Trigger:** Adding event handling logic to the application
- **Constraint:** Closure listeners cannot be cached by event:cache

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Cacheability | High | Closures silently omitted from event cache |
| Listener complexity | Medium | Simple closures may be suitable for trivial logic |
| Testability | Medium | Class listeners are independently testable |
| Runtime conditions | Medium | Dynamic registration requires closures in boot() |

### Decision Tree

```
Does the listener need runtime conditions to determine registration?
├── Yes — listener should only register under specific conditions
│   └── Register via Closure in boot() — explicitly uncached
│       ├── Event::listen(OrderShipped::class, function ($event) { ... })
│       └── Document that this listener is not cached
│
├── No — listener always handles the event
│   ├── Is the listener logic trivial (1-2 lines)?
│   │   ├── Yes — could use Closure, but class listener is preferred
│   │   └── No — always use a class listener
│   │
│   └── Use class listener in $listen array
│       ├── protected $listen = [Event::class => [Listener::class]]
│       ├── Cacheable by event:cache
│       ├── Independently testable
│       └── Can be queued, throttled, or rate-limited
│
└── (class listeners are the default choice)
```

### Rationale
Class listeners in the `$listen` array are cacheable, testable, and follow Laravel conventions. Closure listeners serve a narrow purpose: runtime-dependent registration that cannot be determined at cache-build time. For any listener that always handles an event, a class listener should be the default.

### Default Path
Define all listeners as classes in `EventServiceProvider::$listen`. Use closures only for runtime-conditioned registration, and document them as uncached.

### Risks
- Closure listeners are silently omitted from event cache — the application runs without those listeners in production
- Mixing cached and uncached listeners creates confusion about which listeners are active
- Closure listeners in $listen cause config caching errors if improperly placed

### Related Rules/Skills
- Define event listeners in `$listen` array as classes
- Document wildcard listeners as uncached
- Skill: Cache Event Listeners for Production

---

## DT-EC-02: event:cache in Deployment Sequence

### Decision Context
- **When to decide:** When writing deployment scripts
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Including cache commands in deployment pipeline
- **Constraint:** event:cache is NOT part of php artisan optimize in most Laravel versions

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| optimize coverage | High | Most versions exclude event:cache from optimize |
| Listener change frequency | Medium | Deployments with listener changes need explicit cache |
| Deployment script completeness | High | Missing event:cache = uncached listener discovery |

### Decision Tree

```
Was event:cache included in the composite optimize command in this Laravel version?
├── Yes — verify with php artisan help optimize
│   └── optimize handles event caching internally
│       └── But verify: php artisan help optimize shows --events flag?
│
├── No — most versions (default assumption)
│   └── Must run event:cache explicitly after optimize
│       ├── php artisan optimize
│       ├── php artisan event:clear
│       ├── php artisan event:cache
│       └── php artisan event:list (verify)
│
└── Unknown — always include event:cache explicitly
    └── Safe default: explicit command is harmless even if duplicate
```

### Rationale
`event:cache` is not included in `php artisan optimize` in most Laravel versions. Relying on `optimize` alone leaves event listeners uncached, causing 10-30ms of discovery overhead on every request. The explicit command is low cost and ensures listeners are always cached.

### Default Path
Always run `php artisan event:cache` as a separate step after `php artisan optimize` in deployment scripts.

### Risks
- Missing event:cache causes auto-discovery on every request (10-30ms overhead)
- Running event:cache without event:clear first may leave stale listener references
- Running event:cache before config:cache may generate incomplete listener maps

### Related Rules/Skills
- Run `event:cache` explicitly after `php artisan optimize`
- Clear event cache before regenerating
- Verify listener registration after caching

---

## DT-EC-03: Static $listen Array vs Dynamic Auto-Discovery

### Decision Context
- **When to decide:** When implementing EventServiceProvider
- **Stakeholders:** Backend Developers
- **Trigger:** Organizing event listener registration for a new feature
- **Constraint:** Auto-discovery uses Reflection, adding overhead that event:cache eliminates

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Performance requirement | High | Auto-discovery adds Reflection overhead per request uncached |
| Code organization | Medium | $listen provides centralized, explicit mappings |
| Listener count | Medium | 50+ pairs benefit significantly from caching |
| Third-party packages | Low | Package providers may use auto-discovery |

### Decision Tree

```
How many event-listener pairs exist in the application?
├── Few (<10)
│   └── Either approach is acceptable
│       ├── $listen array: explicit, cacheable, testable
│       └── Auto-discovery: convenient but uncached by default
│           └── Performance difference is negligible at this scale
│
├── Moderate (10-50)
│   └── Use $listen array for all project listeners
│       ├── Package listeners may use auto-discovery (acceptable)
│       ├── Cache once with event:cache
│       └── Verify with event:list
│
└── Many (50+)
    └── Always use $listen array — explicit, cacheable, and testable
        ├── Partition listeners by domain in multiple provider classes
        ├── Always run event:cache in deployment
        └── Verify complete coverage with event:list
```

### Rationale
Explicit `$listen` arrays are always preferred for performance because they enable `event:cache` to generate a complete manifest. Auto-discovery adds Reflection overhead that grows with listener count. For applications with 50+ event-listener pairs, cached explicit registration saves 10-30ms per request.

### Default Path
Use `$listen` array for all application listeners. Accept auto-discovery from packages.

### Risks
- $listen array may grow unmanageably large without proper organization
- Package auto-discovery adds uncached overhead that is invisible to developers
- Migrating from auto-discovery to $listen requires moving all Event::listen() calls to the array

### Related Rules/Skills
- Prefer explicit `$listen` over auto-discovery
- Define event listeners in `$listen` array as classes
