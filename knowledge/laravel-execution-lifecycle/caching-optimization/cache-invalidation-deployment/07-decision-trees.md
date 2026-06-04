# Decision Trees: Cache Invalidation Deployment

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Cache Invalidation Deployment
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-CI-01 | Build on Server vs Build in CI | Architecture | High | Per deployment |
| DT-CI-02 | Full Cache Clear vs Targeted Clear | Strategy | Medium | Per deployment |
| DT-CI-03 | Migration Timing vs Cache Timing | Reliability | Medium | Per deployment |
| DT-CI-04 | Rollback Cache Strategy | Reliability | Low | Per deployment strategy change |

---

## DT-CI-01: Build on Server vs Build in CI

### Decision Context
- **When to decide:** During deployment pipeline design
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Setting up deployment infrastructure for a Laravel application
- **Constraint:** Caches must be built before traffic is routed to new code

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Environment parity | High | Server build uses real production env; CI needs production-like secrets |
| Error detection timing | Medium | CI build catches errors earlier in pipeline |
| Secret exposure | High | Server build keeps secrets on server; CI build requires secrets in pipeline |
| Deployment speed | Low | CI build parallelizes; server build adds to deployment window |

### Decision Tree

```
What is the deployment model?
├── Symlink-swap deployment (Envoyer, Deployer)
│   └── Build caches on server in release directory
│       ├── Deploy code to /releases/{release}
│       ├── Composer install, migrate
│       ├── php artisan optimize:clear && php artisan optimize
│       ├── php artisan event:cache
│       └── Swap symlink
│
├── Container deployment (Docker, ECS, Kubernetes)
│   ├── CI/CD has production-like secrets available
│   │   └── Build caches during Docker image build
│   │       ├── Multi-stage Dockerfile
│   │       ├── Generate caches in build stage
│   │       ├── Copy to final stage
│   │       └── Include in container image
│   │
│   └── CI/CD does NOT have production-like secrets
│       └── Build caches at container startup
│           ├── Entrypoint script generates caches
│           └── Health check waits for cache generation
│
└── Serverless deployment (Vapor)
    └── Build caches during CI/CD build phase
        ├── Generate caches in CI
        └── Include in deployment artifact
```

### Rationale
Server builds are the safest for env parity — the production environment variables are available on the server. CI builds are faster and catch errors earlier but require production secrets to flow through the CI pipeline. Container deployments with build-stage separation can safely generate caches in CI if secrets are injected as build args.

### Default Path
Symlink-swap: build on server. Container: build in CI with production-like env. Serverless: build in CI.

### Risks
- CI builds with wrong env values cause production failures
- Cache files with secrets persist in container layers
- Server builds expose cache generation to production filesystem

### Related Rules/Skills
- Warm Caches Before Routing Traffic to New Deployment
- Skill: Execute Cache Invalidation Deployment

---

## DT-CI-02: Full Cache Clear vs Targeted Clear

### Decision Context
- **When to decide:** During each deployment, based on what changed
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Evaluating scope of code changes in deployment
- **Constraint:** Stale cache entries must not reference old code

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Scope of changes | High | More cache categories affected = stronger case for full clear |
| Deployment window | Medium | Full clear + warm takes 5-30s; targeted takes 1-5s |
| Safety | High | Full clear eliminates stale entry risk entirely |

### Decision Tree

```
What categories of code changed?
├── Routes + Config + Events + Providers all changed
│   └── Full clear and rebuild
│       ├── php artisan optimize:clear
│       ├── php artisan optimize
│       ├── php artisan event:cache
│       └── php artisan view:cache
│
├── Routes only changed
│   ├── Targeted: php artisan route:cache
│   └── Verify after: php artisan route:list
│
├── Config only changed
│   └── Targeted: php artisan config:cache
│
├── Event listeners only changed
│   └── Targeted: php artisan event:cache
│
├── Views only changed
│   └── Targeted: php artisan view:cache
│
└── Provider or dependency changes
    ├── composer dump-autoload -o
    └── php artisan optimize (providers are in services cache)
```

### Rationale
Full clear is safest because cache categories are interdependent — route caching depends on resolved config, and provider changes affect all caches. Targeted clear is appropriate only when the developer has verified no interdependencies are affected.

### Default Path
Full `optimize:clear` + `optimize` + `event:cache`. Use targeted only for rapid hotfixes affecting a single category.

### Risks
- Targeted clear on config change may leave stale route cache referencing old config values
- Forgetting to clear events cache after removing a listener class causes `ClassNotFoundException`

### Related Rules/Skills
- Clear Caches Before Warming in Deployment
- Prevent concurrent cache generation

---

## DT-CI-03: Migration Timing vs Cache Timing

### Decision Context
- **When to decide:** During deployment sequence design
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Deployment includes both schema migrations and cacheable code changes
- **Constraint:** Cached routes/config may reference database columns that don't exist yet

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Schema dependency | High | Do routes, config, or providers reference database schema? |
| Rollback complexity | Medium | Migration order affects rollback capability |
| Deployment atomicity | High | Sequence must avoid serving inconsistent state |

### Decision Tree

```
Do the deployed changes include database migrations?
├── Yes, migrations are included
│   ├── Do routes/views reference migrated columns or tables?
│   │   ├── Yes
│   │   │   └── Run migrations FIRST, THEN build caches
│   │   │       ├── php artisan migrate --force
│   │   │       ├── php artisan optimize:clear
│   │   │       ├── php artisan optimize
│   │   │       └── php artisan event:cache
│   │   │
│   │   └── No, migrations are unrelated
│   │       └── Order doesn't matter; prefer migrations first for consistency
│   │           └── php artisan migrate --force; then cache commands
│   │
│   └── Do the caches freeze values that depend on migrated schema?
│       └── Yes — always migrate before cache
│
└── No migrations in this deployment
    └── No timing dependency — build caches directly
        ├── php artisan optimize:clear
        └── php artisan optimize
```

### Rationale
Migrations must run before cache generation when cached artifacts reference database schema. A route that uses `DB::table('new_column')` will fail at runtime if the migration hasn't run yet. Running migrations first also ensures cache rollback doesn't leave schema-dependent caches from a failed migration.

### Default Path
Always run migrations before cache generation when migrations are present in the deployment.

### Risks
- Running cache before migration = runtime errors on code paths referencing new schema
- Running migration before cache = migration-dependent values frozen in cache; rollback must handle cache revert

### Related Rules/Skills
- Run Migrations Before Cache Warmup
- Skill: Execute Cache Invalidation Deployment

---

## DT-CI-04: Rollback Cache Strategy

### Decision Context
- **When to decide:** During deployment strategy design
- **Stakeholders:** DevOps
- **Trigger:** Implementing zero-downtime deployment with rollback capability
- **Constraint:** Rollback must be instant and serve correct caches

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Deployment model | High | Symlink-swap naturally preserves previous release |
| Rollback speed requirement | High | Instant rollback needs previous caches intact |
| Cache compatibility | Medium | Old code must have matching caches |

### Decision Tree

```
What deployment model is used?
├── Symlink-swap (Envoyer, Deployer)
│   └── Preserve previous release directory
│       ├── Each release has its own bootstrap/cache/
│       ├── Rollback = swap symlink to previous release
│       ├── Previous caches are already there from last deploy
│       └── No cache regeneration needed on rollback
│
├── Blue/green deployment
│   └── Keep previous environment running
│       ├── Blue environment stays with old caches
│       ├── Rollback = route traffic back to blue
│       └── No action needed
│
└── Rolling deployment or in-place update
    └── Keep snapshot of previous caches
        ├── Backup bootstrap/cache/ before cache clear
        │   └── Copy bootstrap/cache/ to backup location
        ├── If rollback needed: restore backup
        └── Trade-off: rollback requires cache regeneration or restore
            ├── Regenerate: requires running cache commands on old code
            └── Restore: faster but requires backup storage
```

### Rationale
Symlink-swap deployments provide instant rollback with correct caches because each release has its own `bootstrap/cache/` directory. In-place deployments must either snapshot previous caches or regenerate them on rollback — snapshot is faster but consumes storage.

### Default Path
Symlink-swap: preserve release directories. In-place: snapshot caches before clearing.

### Risks
- Rollback to snapshot with mismatched secrets (if env vars changed)
- Rollback without cache regeneration = production runs uncached with old code
- In-place deployments cannot atomically swap caches — risk of partial state

### Related Rules/Skills
- Keep Previous Release Caches for Instant Rollback
- Restart PHP workers after cache build
