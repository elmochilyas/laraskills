# 07-Decision Trees: Automated Deployment Pipelines

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | automated-deployment-pipelines |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Deployment Target | Forge vs Vapor vs Envoyer vs custom | Which Laravel deployment platform fits the application architecture? |
| D02 | Deployment Trigger | Auto-deploy vs manual approval gates | When should deployments happen automatically vs requiring approval? |
| D03 | Quality Gates | Which checks must pass before deployment | What tests and analysis must succeed before code reaches production? |
| D04 | Rollback Strategy | How to revert a failed deployment | How do we recover quickly if a deployment causes issues? |

## Architecture-Level Decision Trees

### D01: Deployment Target

```
START: Which deployment platform should we use?
│
├── Laravel Forge (traditional VPS)
│   ├── Use when: dedicated server, full control, PHP-FPM + Nginx
│   ├── Arch: VPS (DigitalOcean, AWS, Linode) + Forge management
│   ├── Deploy: git pull → composer install --no-dev → migrate → cache → restart
│   ├── Pro: full server control, affordable, widely used
│   ├── Con: manual server management, scaling requires more servers
│   └── Best for: most Laravel applications
│
├── Laravel Vapor (serverless)
│   ├── Use when: auto-scaling, pay-per-request, zero server management
│   ├── Arch: AWS Lambda + RDS + SQS + S3 (managed by Vapor)
│   ├── Deploy: vapor deploy production (single command)
│   ├── Pro: auto-scaling, no server management, pay-per-use
│   ├── Con: cold starts, Lambda limitations, higher cost at scale
│   └── Best for: variable traffic, auto-scaling needs
│
├── Laravel Envoyer (zero-downtime)
│   ├── Use when: high-availability, zero-downtime requirement
│   ├── Arch: symlink switching between releases
│   ├── Deploy: clone → install → migrate → symlink → activate
│   ├── Pro: zero downtime, instant rollback (symlink switch)
│   ├── Con: requires server management (Forge recommended alongside)
│   └── Best for: applications with SLAs requiring zero-downtime
│
├── Custom Docker/Kubernetes
│   ├── Use when: container orchestration, multi-service architecture
│   ├── Arch: Docker containers on Kubernetes or Docker Swarm
│   ├── Deploy: CI builds image → push to registry → update pods
│   ├── Pro: full flexibility, reproducible environments
│   ├── Con: high operational complexity
│   └── Best for: complex microservice architectures
│
└── Recommendation: Forge for most apps; Vapor for serverless/auto-scaling
```

### D02: Deployment Trigger

```
START: When should deployments happen?
│
├── Auto-deploy to staging (always)
│   ├── Trigger: push to develop/staging branch
│   ├── No approval needed
│   ├── Fast feedback: code merged → staged in minutes
│   └── Best practice: always auto-deploy to staging
│
├── Auto-deploy to production (continuous delivery)
│   ├── Trigger: push to main branch (after CI passes)
│   ├── Prerequisite: full confidence in CI quality gates
│   ├── Pro: fast delivery, automated pipeline
│   ├── Con: risk if CI has gaps
│   └── Best for: mature teams, strong test coverage
│
├── Manual approval for production (recommended)
│   ├── Trigger: push to main → CI passes → wait for approval
│   ├── Reviewer: tech lead or release manager
│   ├── Pro: human judgment before production deploy
│   ├── Con: slower, bottleneck if approver unavailable
│   └── Best for: most teams — balance of speed and safety
│
├── Scheduled deployments
│   ├── Time-based: deploy on schedule (e.g., Tuesday 10am)
│   ├── Best for: high-compliance environments
│   └── Con: urgent fixes wait for schedule
│
└── Deployment timing best practice
    ├── Deploy early week (Tue/Wed), not Friday
    ├── Ensure team available for post-deploy monitoring
    └── Communicate deployment schedule to stakeholders
```

### D03: Quality Gates

```
START: What checks must pass before deployment?
│
├── Required checks (always)
│   ├── Full test suite passes (PHPUnit/Pest)
│   ├── PHPStan at configured level (no new errors)
│   ├── Pint --test passes (code style)
│   ├── Composer audit passes (no known vulnerabilities)
│   └── Migration tested in staging first
│
├── Recommended checks
│   ├── Dusk browser tests (critical user flows)
│   ├── Security scan (SAST, dependency audit)
│   ├── Coverage threshold met (>80%)
│   └── Performance regression check (response time)
│
├── Gate order
│   ├── Fast checks first (Pint, Composer audit)
│   ├── Medium checks (PHPStan)
│   ├── Slow checks (full test suite, Dusk)
│   ├── Deployment step
│   └── Post-deploy health check
│
└── Gate bypass policy (documented exceptions)
    ├── Emergency hotfix: skip non-essential gates
    ├── Post-deploy: run skipped gates asynchronously
    └── Track bypass frequency — if common, gates are too strict
```

### D04: Rollback Strategy

```
START: How do we roll back a failed deployment?
│
├── Forge rollback
│   ├── Mechanism: Forge keeps previous release directory
│   ├── Rollback: click "Rollback" in Forge dashboard
│   ├── What it does: re-symlinks previous release
│   ├── Caveat: DB migrations are NOT automatically reversed
│   └── Migration rollback: must run manually if destructive
│
├── Envoyer rollback (zero-downtime)
│   ├── Mechanism: atomic symlink switch
│   ├── Rollback: click "Rollback" → switches to previous release
│   ├── Time: <1 second (symlink is atomic)
│   └── Ideal: fastest rollback mechanism
│
├── Vapor rollback
│   ├── Mechanism: switch Lambda alias to previous version
│   ├── Rollback: vapor deploy:rollback
│   ├── Time: seconds
│   └── Note: DB changes from migration also need rollback
│
├── Common rollback requirements
│   ├── Reversible migrations (always implement down())
│   ├── Data backup before destructive migrations
│   ├── Document rollback procedure per release
│   ├── Test rollback in staging before production
│   └── Post-rollback: health check, root cause analysis
│
└── Rollback decision tree
    ├── Health check fails after deploy?
    │   ├── Minor issue → hotfix forward
    │   └── Major issue → rollback immediately
    ├── Rollback → verify → fix → redeploy
    └── Post-incident: document what went wrong, fix CI gate
```
