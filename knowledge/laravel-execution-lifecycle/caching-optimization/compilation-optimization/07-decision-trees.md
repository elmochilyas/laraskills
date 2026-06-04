# Decision Trees: Compilation Optimization (ku-06)

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** ku-06-compilation-optimization
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-K06-01 | Full Optimize vs Targeted Cache Commands | Strategy | Medium | Per deployment |
| DT-K06-02 | Cache Order Dependency | Reliability | Low | Per deployment script |
| DT-K06-03 | Clear-Before-Build Decision | Reliability | Low | Per deployment |

---

## DT-K06-01: Full Optimize vs Targeted Cache Commands

### Decision Context
- **When to decide:** During each deployment, based on scope of changes
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Deciding which cache commands to include in deployment
- **Constraint:** Targeted commands are faster but may miss interdependent caches

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Scope of changes | High | Comprehensive changes need full optimize |
| Deployment time budget | Medium | Full optimize = 2-5s; targeted = 1-2s per command |
| Safety | High | Full optimize eliminates stale/interdependent cache risk |

### Decision Tree

```
What categories of code changed in this deployment?
├── Routes + Config + Events + Providers all changed
│   └── Full optimize pipeline (safest)
│       ├── php artisan optimize:clear
│       ├── php artisan optimize (config + route + services)
│       ├── php artisan event:cache
│       └── php artisan view:cache
│
├── Config only changed
│   └── Targeted: php artisan config:cache
│
├── Routes only changed
│   ├── php artisan route:cache
│   └── Verify: php artisan route:list --format=json
│
├── Event listeners only changed
│   ├── php artisan event:clear
│   ├── php artisan event:cache
│   └── Verify: php artisan event:list
│
├── Views only changed
│   ├── php artisan view:clear
│   ├── php artisan view:cache (Laravel 9+)
│   └── (automatic compilation on access)
│
├── Provider or composer dependency changed
│   ├── php artisan optimize:clear
│   └── php artisan optimize
│
└── Unknown / unspecific
    └── Full optimize: safe default
```

### Rationale
Full `optimize` is the safest default because it regenerates all caches and captures interdependencies. Targeted commands are appropriate only when the developer has verified that only one cache category is affected and no interdependencies exist. Route caching depends on config, and event caching may depend on resolved config values.

### Default Path
Use full `optimize:clear` + `optimize` + `event:cache` + `view:cache` for general deployments.

### Risks
- Targeted approach may leave stale config cache when routes depend on new config values
- Not running event:cache (not in optimize in most versions) leaves listeners uncached
- Provider changes require full optimize because the services manifest is regenerated

### Related Rules/Skills
- Always run optimize in production deployments
- Use targeted cache commands for focused changes
- Skill: Run Full Optimization Pipeline

---

## DT-K06-02: Cache Order Dependency

### Decision Context
- **When to decide:** When writing deployment scripts with individual cache commands
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Writing deployment script that uses targeted cache commands
- **Constraint:** Config → Routes → Events — each depends on the previous

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Dependency chain | High | Routes depend on resolved config; events may depend on resolved config |
| Deployment correctness | High | Wrong order produces inconsistent caches |
| Command type | High | optimize handles ordering internally; individual commands do not |

### Decision Tree

```
Are you using php artisan optimize or individual commands?
├── php artisan optimize (composite)
│   └── Order is handled internally
│       └── No action needed — follows documented order
│
├── Individual cache commands
│   └── Follow dependency order:
│       1. php artisan config:cache (prerequisite)
│       2. php artisan route:cache (reads config values)
│       3. php artisan event:cache (may read config)
│       4. php artisan view:cache (independent; no dependency)
│
└── (config must always come first)
```

### Rationale
Config caching resolves `env()` calls and freezes configuration values. Route caching reads URL defaults, middleware parameters, and group settings from the resolved config. Event service providers may read configuration to conditionally register listeners. Building caches in the wrong order produces artifacts with unresolved or incorrect config values.

### Default Path
Always run `config:cache` before `route:cache` and `event:cache`.

### Risks
- route:cache before config:cache = routes compiled with unresolved env() values
- event:cache before config:cache = listeners registered with wrong config state
- optimize handles ordering but doesn't include event:cache in most versions

### Related Rules/Skills
- Cache in the correct dependency order
- Skill: Run Full Optimization Pipeline

---

## DT-K06-03: Clear-Before-Build Decision

### Decision Context
- **When to decide:** Before running any cache generation command
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Running cache generation during deployment
- **Constraint:** Old cache files may reference removed classes or paths

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Deployment type | High | Fresh vs incremental deployment |
| Risk of stale references | High | Removed classes referenced in old cache cause crashes |
| Cost of clearing | Low | optimize:clear is near-instantaneous |

### Decision Tree

```
Is this a fresh deployment (new directory) or incremental?
├── Fresh deployment (new release directory, no existing cache)
│   └── No prior cache files exist
│       └── optimize:clear not needed
│           └── Run optimize directly
│
├── Incremental (in-place update with existing cache files)
│   └── ALWAYS run optimize:clear before optimize
│       ├── php artisan optimize:clear
│       ├── php artisan optimize
│       ├── php artisan event:cache
│       └── Prevents hybrid stale/fresh state
│
└── Unknown — always clear to be safe
    └── optimize:clear is idempotent and fast
```

### Rationale
Stale cache files from a previous deployment may reference removed classes, old provider paths, or different configuration structures. Building new caches without clearing creates a hybrid state where some cache entries point to old code and others point to new code. This causes unpredictable behavior and hard-to-debug production issues.

### Default Path
Always run `php artisan optimize:clear` before `php artisan optimize`.

### Risks
- Not clearing before build = ClassNotFoundException from stale provider or class references
- optimize without clear may silently merge old and new cache entries
- optimize:clear removes ALL cache files — important to regenerate immediately after

### Related Rules/Skills
- Run `optimize:clear` before every optimize
- Skill: Run Full Optimization Pipeline
