# Decision Trees: View Caching (ku-04)

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** ku-04-view-caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-K04-01 | View Cache Clear During Deployment | Reliability | Low | Per deployment |
| DT-K04-02 | Pre-compile vs On-Demand Compilation | Performance | Low | Per deployment strategy |
| DT-K04-03 | View Inheritance Depth | Architecture | Medium | Per template design |

---

## DT-K04-01: View Cache Clear During Deployment

### Decision Context
- **When to decide:** When writing deployment scripts
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Deployment that may include Blade template changes
- **Constraint:** Compiled view timestamps determine freshness — old compilations may be newer than changed templates

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Template changes | High | Changed templates require invalidation of old compiled versions |
| Certainty of changes | Medium | If unsure, clear defensively |
| Deployment time | Low | view:clear is nearly instantaneous |

### Decision Tree

```
Did this deployment change any .blade.php files?
├── Yes — templates were modified or added
│   └── Run php artisan view:clear
│       ├── Deletes all compiled view files from storage/framework/views/
│       ├── Forces recompilation on next access
│       └── Ensures users see the latest template changes
│
├── No — only backend code changed (no template modifications)
│   └── view:clear is optional but recommended
│       ├── Safe: view:clear is idempotent and fast
│       ├── Defensive: template dependencies may change indirectly
│       └── Cost: near-zero (milliseconds to clear)
│
└── Unknown — run view:clear defensively
    └── Safe default — no downside to clearing compiled views
```

### Rationale
Blade uses `filemtime()` comparison to determine if a compiled view is stale. If the deployment process touches template files but sets their modification times to an older value than the compiled version, changes are invisible. Running `view:clear` is cheap and completely eliminates this risk.

### Default Path
Always run `php artisan view:clear` in every deployment script.

### Risks
- Not clearing after template changes = users see old UI
- view:clear causes a one-time compilation penalty on the first request after deploy (5-20ms per unique template)
- Pre-compiled views (view:cache) must be regenerated after view:clear

### Related Rules/Skills
- Clear compiled views during every deployment
- Skill: Manage Blade View Compilation During Deployment

---

## DT-K04-02: Pre-compile vs On-Demand Compilation

### Decision Context
- **When to decide:** During deployment optimization
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Setting up production warmup strategy
- **Constraint:** view:cache is only available in Laravel 9+

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Laravel version | High | view:cache not available before Laravel 9 |
| Traffic pattern | Medium | High-traffic apps benefit more from pre-compilation |
| Warmup tolerance | Medium | Can first request tolerate 5-20ms compilation? |

### Decision Tree

```
Is Laravel 9+ in use?
├── Yes — view:cache is available
│   ├── Is this a high-traffic deployment?
│   │   ├── Yes — pre-compile all views
│   │   │   ├── php artisan view:cache after optimize
│   │   │   ├── All views compiled before traffic hits
│   │   │   └── Zero compilation penalty on first request
│   │   │
│   │   └── No — standard traffic
│   │       ├── On-demand compilation is acceptable
│   │       │   └── First visitor per unique view pays 5-20ms
│   │       └── Skip view:cache to reduce deploy time
│   │
│   └── (pre-compile for production best practice)
│
├── No — Laravel 8 or earlier
│   └── On-demand compilation only
│       ├── view:cache command not available
│       └── First request after view:clear compiles each template
│
└── (view:cache is optional but recommended for production)
```

### Rationale
Pre-compilation via `view:cache` moves the 5-20ms compilation cost per unique template from request time to deploy time. This eliminates the latency spike on the first request after deployment. For low-traffic apps, the benefit is marginal; for high-traffic apps, it prevents a wave of slow responses during warmup.

### Default Path
Use `php artisan view:cache` after optimization in Laravel 9+ production deployments.

### Risks
- view:cache may fail silently if a template has syntax errors
- view:cache must be re-run after view:clear
- Pre-compiled views increase storage use in storage/framework/views/

### Related Rules/Skills
- Precompile views in production warmup
- Skill: Manage Blade View Compilation During Deployment

---

## DT-K04-03: View Inheritance Depth

### Decision Context
- **When to decide:** When designing Blade template structure
- **Stakeholders:** Frontend Developers, Backend Developers
- **Trigger:** Creating new layouts, sections, or components
- **Constraint:** Each @extends and @include compiles to a separate PHP file that requires a file read at render time

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Inheritance depth | High | Each level adds file I/O at render time |
| Maintainability | High | Deep inheritance is hard to trace and debug |
| Performance impact | Medium | Cascading requires compound at each level |

### Decision Tree

```
How many levels of view inheritance are needed?
├── 1-2 levels (recommended)
│   ├── layout → section
│   └── layout → partial
│       ├── Simple, fast, maintainable
│       └── Each render requires 1-2 file reads
│
├── 3 levels (acceptable maximum)
│   ├── layout → section → component
│   └── Acceptable for moderate complexity
│       ├── Each render requires 2-3 file reads
│       └── Still traceable and debuggable
│
└── 4+ levels (discouraged)
    ├── root → base → layout → section → component
    ├── High I/O: each request requires cascading file reads
    ├── Hard to debug: which level has the bug?
    └── Refactor toward:
        ├── Flatten to 2-3 levels max
        ├── Use Blade components for reusable pieces
        └── Consider partial compilation (render on-demand)
```

### Rationale
Each `@extends` and `@include` compiles to a dedicated PHP file that must be read and executed at render time. Deep inheritance chains multiply this I/O cost and make templates harder to maintain. Layouts should be flat: one master layout, one level of section inheritance, and components for reusable pieces.

### Default Path
Limit Blade inheritance to 2-3 levels maximum (layout → section → component).

### Risks
- 4+ level inheritance doubles or triples view render time
- Debugging template issues across deep chains is time-consuming
- OpCache mitigates file I/O but does not eliminate the cascading require structure

### Related Rules/Skills
- Limit view inheritance depth to 3 levels
- Keep Blade templates free of business logic
