# Decision Trees: Optimize Command

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Optimize Command
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-OP-01 | Optimize in Deployment Workflow | Strategy | Low | Per deployment |
| DT-OP-02 | Clear-Before-Optimize Sequence | Reliability | Low | Per deployment |
| DT-OP-03 | Optimize Failure Recovery | Reliability | Medium | Per deployment failure |

---

## DT-OP-01: Optimize in Deployment Workflow

### Decision Context
- **When to decide:** When writing deployment scripts
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Including production warmup steps in deployment
- **Constraint:** optimize must run as the final step after all setup commands

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Deployment phase timing | High | optimize must be last Artisan command before traffic |
| Environment type | High | Production vs development vs CI |
| Dependencies | High | Must run after migrations, composer install |

### Decision Tree

```
Where is optimize positioned in the deployment sequence?
├── After all setup commands (correct)
│   └── Sequence:
│       1. composer install --no-dev -o
│       2. php artisan migrate --force
│       3. php artisan optimize:clear
│       4. php artisan optimize
│       5. php artisan event:cache
│       6. php artisan view:cache
│       7. (traffic switch and worker restart)
│
├── Before migrations (incorrect)
│   └── Routes cached reference non-existent database columns
│       └── Runtime errors on migrated features
│
├── Before composer install (incorrect)
│   └── Cached services manifest references old vendor paths
│       └── ClassNotFoundException for package providers
│
└── In development (incorrect)
    └── Config/route changes invisible until optimize:clear
        └── Confusing debugging sessions
```

### Rationale
Optimize must run as the final Artisan command because its output (caches) must reflect the final state of the deployment. Running it before migrations, composer install, or any other setup produces caches that reference incomplete or non-existent code.

### Default Path
Position optimize as the last command after code deploy, composer install, and migrations.

### Risks
- Optimize before migrations = cached routes reference non-existent schema
- Optimize before composer install = services cache references old vendor paths
- Running optimize in development = developer confusion about invisible changes

### Related Rules/Skills
- Run optimize as the final deployment step
- Never run optimize in local development
- Skill: Execute Optimize in Deployment Sequence

---

## DT-OP-02: Clear-Before-Optimize Sequence

### Decision Context
- **When to decide:** When writing deployment script
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Including optimize in deployment
- **Constraint:** Old cache files may reference old classes and paths

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Deployment type | High | Fresh vs incremental deployment |
| Stale artifact risk | High | Old references cause fatal errors |
| Clear cost | Low | optimize:clear is instant |

### Decision Tree

```
Is this an incremental deployment with existing cache files?
├── Yes — previous cache files exist on disk
│   └── MUST run optimize:clear before optimize
│       ├── php artisan optimize:clear
│       ├── php artisan optimize
│       └── Prevents:
│           ├── ClassNotFoundException from old provider references
│           ├── Stale route definitions
│           └── Mixed old/new config values
│
├── No — fresh deployment directory, no prior caches
│   └── optimize:clear is optional but harmless
│       ├── optimize:clear (safe, idempotent)
│       └── php artisan optimize
│
└── (always clear before optimize for safety)
```

### Rationale
Old cache files from previous deployments may reference removed classes, old provider paths, or different configuration structures. `optimize` builds new files but does not inherently remove old ones or their stale entries. The safe pattern is always clear before build.

### Default Path
Always run `php artisan optimize:clear` immediately before `php artisan optimize`.

### Risks
- Not clearing = hybrid stale/fresh cache state causing unpredictable behavior
- Removed provider class still referenced in old services.php = fatal error

### Related Rules/Skills
- Clear before optimize: run `optimize:clear` first
- Skill: Execute Optimize in Deployment Sequence

---

## DT-OP-03: Optimize Failure Recovery

### Decision Context
- **When to decide:** When handling a failed optimize during deployment
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** optimize exits with error during deployment
- **Constraint:** Partial cache state (some caches built, others not) must be handled

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Failure scope | High | Which sub-command failed determines recovery |
| Partial state risk | High | Config cached + routes not = inconsistent state |
| Rollback necessity | Medium | May need to roll back if fix is not immediate |

### Decision Tree

```
Which sub-command failed?
├── config:cache failed
│   ├── Probable cause: Closure in config file, permissions
│   ├── No caches written (config:cache runs first)
│   ├── Action: Fix the config file issue, re-run full optimize
│   └── Rollback if fix takes too long
│
├── route:cache failed (config:cache succeeded)
│   ├── Probable cause: Closure in route definition
│   ├── Partial state: config cached, routes not
│   ├── Action:
│   │   ├── Fix route issue (replace Closure with controller)
│   │   ├── php artisan optimize:clear
│   │   └── php artisan optimize (full re-run)
│   │
│   └── Risk: Production has config cache but uncached routes
│       └── If deploying anyway, app runs with mixed cached/uncached state
│
├── event:cache failed (run separately)
│   ├── Probable cause: Listener class missing, auto-discovery error
│   ├── Action: Fix event configuration, re-run event:cache
│   └── Risk: Events uncached (auto-discovery still works, just slower)
│
└── services manifest not generated
    ├── Probable cause: Permissions on bootstrap/cache/
    ├── No services manifest = provider scanning on every request
    └── Action: Fix permissions, re-run optimize
```

### Rationale
When `optimize` fails partway through, the application enters a partial cache state. The safest recovery is to fix the root cause, clear all caches, and re-run the full `optimize` sequence. Partial recovery (only fixing the failed sub-command) risks missing interdependencies between cache types.

### Default Path
Fix the root cause, run `php artisan optimize:clear`, then re-run full `php artisan optimize` sequence.

### Risks
- Deploying with partial cache state = unpredictable application behavior
- Fixing only the failed sub-command may leave interdependent caches inconsistent
- optimize:clear without re-running optimize = app runs fully uncached (performance regression)

### Related Rules/Skills
- Verify optimize output for errors
- Ensure `bootstrap/cache/` has correct permissions
- Skill: Execute Optimize in Deployment Sequence
