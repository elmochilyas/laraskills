# Decision Trees: Config Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Config Caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-CC-01 | Config Cache Enablement in Production | Performance | Low | Per deployment strategy setup |
| DT-CC-02 | env() in Config vs Application Code | Architecture | Medium | Per code change |
| DT-CC-03 | Closure Handling in Config Files | Maintainability | Low | Per config file creation |
| DT-CC-04 | Config Cache Ordering Relative to Other Caches | Reliability | Low | Per deployment script |

---

## DT-CC-01: Config Cache Enablement in Production

### Decision Context
- **When to decide:** During production deployment configuration
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Setting up production environment for Laravel application
- **Constraint:** Config files must be pure and serializable

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Performance requirement | High | Uncached config adds 30-80ms to bootstrap |
| Environment type | High | Production vs ephemeral vs development |
| Config purity | High | Closures or side effects in config block caching |

### Decision Tree

```
What environment is this?
├── Production
│   ├── Are all config files pure (no Closures, no side effects)?
│   │   ├── Yes — always enable config cache
│   │   │   └── php artisan config:cache in deployment script
│   │   │
│   │   └── No — config files contain Closures or unserializable values
│   │       └── Must refactor before config caching
│   │           ├── Move Closures to service providers
│   │           ├── Replace resources with resolvable class references
│   │           └── Then enable config cache
│   │
│   └── (config cache is a baseline optimization)
│
├── Staging
│   └── Enable config cache for realistic performance testing
│       └── php artisan config:cache in deploy script
│
├── Development / Local
│   └── Do NOT use config cache
│       └── Config changes frequently; cache prevents hot-reload
│
└── Ephemeral / Single-request containers
    └── Config cache is optional
        └── Benefit (30-80ms savings) may not justify complexity
```

### Rationale
Config caching is the highest-impact single optimization in Laravel — reducing bootstrap from 30-80ms to <1ms. It should always be enabled in production provided config files are pure. The only reasons to skip config caching in production are: (1) config files contain Closures, or (2) the environment is ephemeral with trivial bootstrap cost.

### Default Path
Always enable config caching in production.

### Risks
- Closures in config cause fatal error during cache generation, breaking deployments
- env() calls in application code return null after caching if not migrated to config()
- Cache built with wrong .env values freezes incorrect configuration

### Related Rules/Skills
- Run `config:cache` in every production deployment
- Keep config files pure and serializable
- Skill: Run Config Caching in Production Deployments

---

## DT-CC-02: env() in Config vs Application Code

### Decision Context
- **When to decide:** When writing new code or reviewing existing code
- **Stakeholders:** Backend Developers
- **Trigger:** Need to read an environment variable in application code
- **Constraint:** After config:cache, env() in non-config code returns null

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Config cache status | High | Active = env() returns null outside config files |
| Code location | High | config/*.php vs controller/middleware/view/job |
| Migration cost | Medium | Refactoring existing env() calls to config() |

### Decision Tree

```
Where is env() being called?
├── In a config file (config/*.php)
│   ├── Acceptable — this is the designated location
│   │   └── Pattern: 'key' => env('ENV_VAR', 'default')
│   │
│   └── Is the value dynamic and cache-appropriate?
│       └── Yes — env() in config is correct; cache will freeze it
│
├── In application code (controllers, middleware, jobs, views)
│   ├── Can the value be read from config instead?
│   │   ├── Yes — refactor to config('file.key')
│   │   │   └── Example: config('app.debug') instead of env('APP_DEBUG')
│   │   │
│   │   └── No — the value must be read at runtime from $_ENV
│   │       └── Document clearly: "This value is read after config:cache and will not be cached"
│   │           └── Acceptable only for values that truly change per-request
│   │
│   └── (config() is always preferred)
│
└── In a service provider
    └── Acceptable only during boot() before config is fully loaded
        ├── Document the explicit exception
        └── Otherwise, use config()
```

### Rationale
`env()` is designed for config files — caching resolves and freezes the values. In application code, `config()` provides the correct value regardless of cache state. Using `env()` after caching returns null silently, causing subtle, hard-to-debug production issues.

### Default Path
Use `config('file.key')` in all application code. Restrict `env()` to `config/*.php` files.

### Risks
- Silent null returns from env() in production can expose sensitive data or disable security features
- Migration from env() to config() requires audit of all env() calls across the codebase
- env() in queued jobs may work in development but fail silently in production

### Related Rules/Skills
- Use `config()` instead of `env()` in application code
- Wrap all `env()` calls inside config files only

---

## DT-CC-03: Closure Handling in Config Files

### Decision Context
- **When to decide:** When defining config values that require computation
- **Stakeholders:** Backend Developers
- **Trigger:** Need to compute a config value dynamically
- **Constraint:** config:cache uses var_export() which cannot serialize Closures

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Serialization requirement | High | var_export() must process all config values |
| Value computation timing | High | Build-time vs runtime computation |
| Alternative patterns | Medium | Service providers, container bindings, class references |

### Decision Tree

```
Does the config value need runtime computation?
├── Yes — value depends on request context or runtime state
│   └── Do NOT put the computation in config
│       ├── Move logic to a service provider's boot() or register() method
│       └── Bind the computed value to the container
│           └── $this->app->singleton(Service::class, fn() => new Service(compute()))
│
├── No — value can be computed once at build time
│   ├── Is the value computation a Closure or function?
│   │   ├── Yes — replace with the direct value or class reference
│   │   │   └── Don't return fn() => new Client(); return Client::class
│   │   │
│   │   └── No — the value is already a static expression
│   │       └── Safe for config caching
│   │
│   └── (config must remain serializable)
│
└── Partially — value should be computed once per deployment
    ├── Compute in a service provider's register() method
    ├── Store result in the container
    └── Access via app(Service::class) or dependency injection
```

### Rationale
Config files must return pure arrays of serializable values. Closures, anonymous functions, resources, and objects prevent `var_export()` from serializing the config array, causing fatal errors during `config:cache`. Any runtime computation should be moved to service providers or container bindings.

### Default Path
Never use Closures in config files. Use class references instead of factory functions.

### Risks
- Fatal error during config:cache breaks the entire deployment pipeline
- Fixing requires rolling back to uncached state, then refactoring, then redeploying
- Config files with side effects (API calls, file reads) cause unpredictable behavior at cache-build time

### Related Rules/Skills
- Keep config files pure and serializable

---

## DT-CC-04: Config Cache Ordering Relative to Other Caches

### Decision Context
- **When to decide:** When writing deployment scripts
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Including cache commands in deployment sequence
- **Constraint:** Route caching depends on resolved config values

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Dependency chain | High | Route/event caching may read config values |
| Deployment reliability | High | Wrong order causes cache generation errors |
| Redis/Optimize order | Low | optimize includes config:cache automatically |

### Decision Tree

```
Are you running individual cache commands or php artisan optimize?
├── php artisan optimize (composite command)
│   └── Order is handled internally by the command
│       ├── Runs config:cache internally
│       └── Then route:cache
│
├── Individual commands
│   ├── Is route caching needed?
│   │   ├── Yes — run config:cache BEFORE route:cache
│   │   │   ├── php artisan config:cache
│   │   │   ├── php artisan route:cache
│   │   │   └── php artisan event:cache
│   │   │
│   │   └── No — config:cache alone is sufficient
│   │       └── php artisan config:cache
│   │
│   └── (config is the foundation for other caches)
│
└── Is event caching needed?
    └── Run config:cache before event:cache
        └── Events service provider may depend on resolved config
```

### Rationale
Config is a dependency for route and event caching — routes are compiled using resolved configuration values, and the `EventServiceProvider` may read config during registration. Running `config:cache` first ensures all downstream cache commands operate on the correct, resolved config.

### Default Path
Always run `config:cache` before `route:cache` and `event:cache`.

### Risks
- route:cache running before config:cache may generate routes with unresolved env() values
- event:cache may produce different listener maps depending on config state
- optimize command handles ordering but doesn't include event:cache in most versions

### Related Rules/Skills
- Cache config before routes and events
- Run `config:cache` in every production deployment
