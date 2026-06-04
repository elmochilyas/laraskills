# Decision Trees: Bootstrap Warmup in CI/CD

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Bootstrap Warmup in CI/CD
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-BW-01 | Build-Time vs Deploy-Time Warmup | Architecture | Medium | Per deployment |
| DT-BW-02 | Full Optimize vs Targeted Commands | Strategy | Low | Per deployment |
| DT-BW-03 | Cache Verification Strategy | Reliability | Low | Per deployment |
| DT-BW-04 | Environment Variable Strategy for Cache Builds | Security | Medium | Per deployment |

---

## DT-BW-01: Build-Time vs Deploy-Time Warmup

### Decision Context
- **When to decide:** During CI/CD pipeline design for new deployment infrastructure
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Setting up a new deployment pipeline (container, symlink-swap, serverless)
- **Constraint:** Cache must exist before traffic reaches the new deployment

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Deployment strategy | High | Symlink-swap, container, or serverless dictates where caches can be built |
| Environment parity | High | Build-time env must match production for correct cache values |
| Pipeline speed | Medium | Build-time warmup adds to CI duration; deploy-time adds to deployment window |
| Error detection timing | Medium | Build-time catches cache errors earlier in pipeline |
| Secret exposure risk | Medium | Build-time caches may persist in container layers |

### Decision Tree

```
What is the deployment strategy?
├── Container deployments (Docker, Vapor)
│   ├── Build-time warmup in Dockerfile
│   │   └── Multi-stage build: generate caches in build stage, copy to final stage
│   └── Deploy-time warmup in entrypoint
│       └── Simple Dockerfile: run optimize in container startup script
│
├── Symlink-swap deployments (Envoyer, Deployer)
│   └── Deploy-time warmup in release directory before symlink swap
│       ├── Deploy code to new /releases/{n} directory
│       ├── Run composer install --no-dev -o
│       ├── Run php artisan migrate --force
│       ├── Run php artisan optimize:clear && php artisan optimize
│       ├── Run php artisan event:cache, view:cache
│       └── Swap symlink (ln -sfn /releases/{n} /current)
│
└── Serverless deployments
    └── Build-time warmup in CI/CD build phase
        └── Generate caches during artifact build, include in deployment bundle
```

### Rationale
Container and serverless deployments benefit from build-time warmup because the cache generation cost is paid once during build, not on every container start. Symlink-swap deployments must warm on the server because caches must match the exact environment where they run — the release directory is the deployment unit, not the artifact.

### Default Path
Use deploy-time warmup for symlink-swap; build-time warmup for containers and serverless.

### Risks
- Build-time caches built with mismatched environment variables cause production failures
- Container image layers containing caches with secrets may be pushed to registries
- Build-time warmup adds 5-30s to CI pipeline duration

### Related Rules/Skills
- Warm Caches Before Traffic Is Routed in CI/CD
- Use Production-Like Environment Variables for Cache Builds in CI
- Skill: Warm Caches During CI/CD Deployment

---

## DT-BW-02: Full Optimize vs Targeted Commands

### Decision Context
- **When to decide:** During each deployment, based on what changed
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Code changes that require cache regeneration
- **Constraint:** Stale caches must not remain after deployment

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Scope of changes | High | Full optimize for comprehensive deploys; targeted for single-category changes |
| Deployment time budget | Medium | Full optimize takes 5-30s; targeted takes 1-5s per category |
| Risk of stale artifacts | High | Targeted approach may miss interdependent caches |

### Decision Tree

```
What kind of changes are being deployed?
├── Full deployment (routes + config + events + providers changed)
│   └── Run php artisan optimize (config:cache + route:cache + services cache)
│       ├── php artisan optimize:clear
│       ├── php artisan optimize
│       ├── php artisan event:cache
│       └── php artisan view:cache
│
├── Config-only changes
│   └── php artisan config:cache
│
├── Route-only changes
│   └── php artisan route:cache
│
├── Event listener changes
│   └── php artisan event:cache
│
├── Blade template changes
│   └── php artisan view:cache
│
└── Provider or composer dependency changes
    ├── composer dump-autoload -o
    └── php artisan optimize
```

### Rationale
Full `php artisan optimize` (with separate `event:cache`) is the safest default because it covers all cache categories. Targeted commands are faster but risk missing interdependent caches — for example, route caching depends on resolved configuration.

### Default Path
Run full `optimize:clear` + `optimize` + `event:cache` + `view:cache` for general deployments.

### Risks
- Targeted approach may leave stale config cache when routes depend on new config
- Missing `event:cache` (not in `optimize` in most versions) leaves listeners uncached

### Related Rules/Skills
- Run `optimize:clear` before `optimize` in CI/CD
- Skill: Execute Optimize in Deployment Sequence

---

## DT-BW-03: Cache Verification Strategy

### Decision Context
- **When to decide:** During CI/CD pipeline design
- **Stakeholders:** DevOps
- **Trigger:** After cache generation steps in pipeline
- **Constraint:** Failed cache warmup must fail the deployment

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Failure detection | High | Silent cache failure must be caught |
| Pipeline complexity | Medium | Verification adds steps to pipeline |
| Environment constraints | Low | Some environments limit verification capability |

### Decision Tree

```
What deployment environment?
├── Full CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins)
│   └── Programmatic verification
│       ├── Test-Path bootstrap/cache/config.php (file existence)
│       ├── Test-Path bootstrap/cache/routes.php (file existence)
│       ├── php artisan route:list --format=json | Out-Null (cache usability)
│       └── Fail pipeline step if any check fails
│
├── Container entrypoint
│   └── Basic file existence check
│       ├── test -f bootstrap/cache/config.php || exit 1
│       └── test -f bootstrap/cache/routes.php || exit 1
│
└── Manual deploy
    └── Manual verification
        ├── php artisan route:list
        └── php artisan config:get app.name
```

### Rationale
Programmatic verification in CI/CD ensures that a failed cache build (permissions error, missing directory, Closure in config) causes the deployment to fail rather than silently falling back to uncached mode. File existence checks are the minimum; route list validation confirms the cache is usable.

### Default Path
Include file existence checks and `route:list` validation after cache generation.

### Risks
- Verification may pass but cache may contain wrong environment values
- Verification adds ~1s to deployment time

### Related Rules/Skills
- Verify Cache Integrity After Warmup
- Fail the deployment on cache build errors

---

## DT-BW-04: Environment Variable Strategy for Cache Builds

### Decision Context
- **When to decide:** During CI/CD pipeline setup
- **Stakeholders:** DevOps, Security
- **Trigger:** Configuring CI/CD environment for cache generation
- **Constraint:** Cache freezes `env()` values at build time

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Environment parity | High | CI env values must match production for correct caches |
| Secret management | High | Production secrets must be available in CI but not exposed |
| Config architecture | Medium | Whether app uses env() vs config() determines impact |

### Decision Tree

```
How does the application consume configuration?
├── App uses env() in config files (standard Laravel pattern)
│   ├── CI has access to production-like secrets
│   │   └── Use production-like env values in CI
│   │       ├── Copy .env.production to .env before cache build
│   │       ├── Or set all required env vars as CI secrets
│   │       └── Verify resolved values after build
│   │
│   └── CI does NOT have production secrets
│       └── Build caches on production server (deploy-time warmup)
│           ├── Deploy code without cached config
│           ├── Set production env on server
│           └── Run optimize commands on production server
│
└── App uses zero env() calls (config() with hardcoded defaults)
    └── No env-value concern — cache is environment-independent
        ├── CI can build caches safely
        └── No risk of wrong env values
```

### Rationale
Cache files freeze `env()` calls — if CI builds caches with staging database URLs, production will use staging URLs. The safest approach is deploy-time warmup on the production server where real environment variables are available. If build-time warmup is required, CI must have access to production-like secrets.

### Default Path
Use deploy-time warmup on production server when CI cannot mirror production secrets exactly.

### Risks
- Production secrets stored in CI/CD secrets manager become additional attack surface
- Build artifacts containing cached secrets may be persisted in artifact storage
- Multi-environment pipelines risk cross-contamination of env values

### Related Rules/Skills
- Use Production-Like Environment Variables for Cache Builds in CI
- Secure the cached config file with restrictive permissions
