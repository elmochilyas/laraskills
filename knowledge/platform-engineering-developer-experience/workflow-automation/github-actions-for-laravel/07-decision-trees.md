# 07-Decision Trees: GitHub Actions for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | github-actions-for-laravel |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Workflow Structure | Single vs multiple workflow files | How do we organize CI jobs for best feedback speed? |
| D02 | Job Parallelization | Sequential vs parallel job execution | How do we minimize total CI time while maximizing feedback? |
| D03 | Caching Strategy | What and how to cache in workflows | How do we speed up repeated dependency installation? |
| D04 | Deployment Integration | How to trigger deployments from CI | How does CI connect to Forge/Vapor/Envoyer for deployment? |

## Architecture-Level Decision Trees

### D01: Workflow Structure

```
START: How should we organize GitHub Actions workflows?
│
├── Single workflow file (simple projects)
│   ├── .github/workflows/ci.yml — all jobs in one file
│   ├── Pro: simple, everything visible in one place
│   ├── Con: can become large and hard to maintain
│   └── Best for: small projects, teams new to Actions
│
├── Multiple workflow files (recommended)
│   ├── ci.yml — test, lint, static analysis
│   ├── deploy.yml — deployment triggers (separate permissions)
│   ├── dusk.yml — browser tests (separate, slower)
│   ├── scheduled.yml — maintenance tasks (cron)
│   ├── Pro: clear separation, independent permissions
│   ├── Pro: can trigger independently
│   └── Best for: most projects
│
├── Workflow triggers
│   ├── on: [push, pull_request] — CI on every commit
│   ├── on: pull_request — CI on PR (avoids duplicate runs)
│   ├── on: workflow_dispatch — manual trigger for deploy
│   └── on: schedule — cron for maintenance tasks
│
└── Branch protection
    ├── Require CI status checks before merge
    ├── Require specific jobs (pint, phpstan, tests)
    └── Require approvals for production deployments
```

### D02: Job Parallelization

```
START: How should we structure jobs for speed?
│
├── Sequential (simple, slow)
│   ├── Pint → PHPStan → Tests → Deploy
│   ├── Total: sum of all job times (~15-20min)
│   ├── Pro: simple dependency chain
│   ├── Con: if Pint fails, PHPStan still runs (can use continue-on-error)
│   └── Best for: minimal CI setups
│
├── Parallel (recommended)
│   ├── Job 1: Pint (style, 5s) — runs independently
│   ├── Job 2: PHPStan (analysis, 2min) — runs independently
│   ├── Job 3: PHPUnit (tests, 5min) — runs independently
│   ├── Job 4: Deploy (after jobs 1-3 pass) — depends on all
│   ├── Total: max(Pint, PHPStan, Tests) + Deploy (~5-6min)
│   └── Pro: all results visible in one run, parallel execution
│
├── Matrix builds (multi-version testing)
│   ├── PHP matrix: [8.2, 8.3, 8.4]
│   ├── Laravel matrix: [10, 11] (for packages)
│   ├── Exclude: incompatible pairs
│   └── Best for: packages, libraries, multi-version support
│
└── Dusk as separate job
    ├── Browser tests: slower, more resource-intensive
    ├── Run: after feature tests pass (or in parallel)
    └── Resources: larger runner (4GB+ RAM needed)
```

### D03: Caching Strategy

```
START: What should we cache in GitHub Actions?
│
├── Composer vendor/ (essential)
│   ├── Action: actions/cache@v4
│   ├── Key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
│   ├── Restore-keys: ${{ runner.os }}-composer- (fallback)
│   ├── Path: vendor/
│   └── Save: 30-60s per run
│
├── PHPStan result cache
│   ├── Path: .phpstan.result.cache
│   ├── Key: phpstan-${{ hashFiles('**.php', 'phpstan.neon') }}
│   └── Save: 2-5min per run (full → incremental analysis)
│
├── NPM node_modules/ (if frontend assets)
│   ├── Path: node_modules/
│   ├── Key: npm-${{ hashFiles('**/package-lock.json') }}
│   └── Save: 20-40s per run
│
└── Cache best practices
    ├── Upload and download cache in same job
    ├── Use hash-based keys for invalidation
    ├── Restore keys for cache hit on lock file changes
    └── Separate caches per dependency type
```

### D04: Deployment Integration

```
START: How does CI trigger deployments?
│
├── Forge deployment
│   ├── Forge provides unique deploy webhook URL
│   ├── CI: curl -X POST https://forge.laravel.com/servers/.../deploy?token=...
│   ├── Trigger: after all CI jobs pass on main branch
│   └── Forge handles: git pull, composer install, migrate, cache
│
├── Vapor deployment
│   ├── CI: vapor deploy production --commit="${{ github.sha }}"
│   ├── Trigger: after all CI jobs pass on main branch
│   └── Vapor handles: Lambda update, migrations, env sync
│
├── Envoyer deployment
│   ├── Envoyer provides deploy webhook similar to Forge
│   ├── CI: curl -X POST https://envoyer.io/deploy/...
│   └── Envoyer handles: zero-downtime symlink switch
│
└── Deployment best practices
    ├── Deploy only from main branch, after CI passes
    ├── Use GitHub Environments for production secrets
    ├── Add manual approval gate for production deploys
    ├── Deploy step depends on (needs:) all test jobs
    └── Post-deploy health check in workflow
```
