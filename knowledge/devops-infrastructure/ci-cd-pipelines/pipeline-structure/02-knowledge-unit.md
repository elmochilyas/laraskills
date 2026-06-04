# Pipeline Structure

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** CI/CD Pipelines
- **Knowledge Unit:** Pipeline Structure
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Pipeline structure defines how code moves from commit to production through a series of automated stages. A well-structured CI/CD pipeline provides fast feedback, reliable deployments, and clear ownership of each transition, following a standard lint → test → build → deploy → post-deploy progression.

---

## Core Concepts

- **Stage** — A logical phase in the pipeline (lint, test, build, deploy)
- **Job** — A unit of work within a stage (run PHPStan, run Pest tests)
- **Trigger** — The event that initiates the pipeline (push, PR, tag)
- **Quality Gate** — An automated check that must pass before proceeding
- **Artifact** — Output from one stage consumed by another (compiled assets, Docker image)
- **Environment Promotion** — Moving artifacts through dev → staging → production

---

## Mental Models

- **Assembly Line** — Each stage is a quality checkpoint. Defects are caught early and prevent the artifact from reaching the next stage. Fail fast, fail cheap.
- **Funnel Design** — Early stages are broad and fast (linting catches many issues instantly); later stages are narrow and deep (production deployment triggers only after all checks pass).
- **Build Once Convention** — The artifact built in the build stage is promoted through environments without rebuilding. This ensures what you test is what you deploy.

---

## Internal Mechanics

A pipeline is defined in a YAML configuration file (`.github/workflows/*.yml`, `.gitlab-ci.yml`). When a trigger event occurs, the CI/CD platform allocates a runner, checks out the code, and executes stages sequentially. Jobs within a stage run in parallel by default. Artifacts from completed stages are passed to subsequent stages. Each stage must succeed for the pipeline to continue. If any stage fails, the pipeline stops and reports the failure. Post-deploy stages can include health checks, smoke tests, and notifications.

---

## Patterns

- **Fail Fast** — Run linting and static analysis before tests. A style violation shouldn't wait behind a 10-minute test suite.
- **Parallelize Independent Work** — Linting, static analysis, and testing with different dependencies can run in parallel within the same stage.
- **Promote Artifacts** — Build once, deploy everywhere. The artifact tested in staging is the exact artifact deployed to production.
- **Retain Artifacts** — Store build artifacts for a defined period to enable rollback without rebuilding.

---

## Architectural Decisions

- **Sequential vs. Parallel Stages** — Sequential stages enforce ordering (lint before test before deploy); parallel stages within a phase (PHP 8.2, 8.3, 8.4 matrix testing) speed up validation.
- **Two-Stage vs. Three-Stage Pipeline** — Two-stage (test, deploy) for simple applications; three-stage (test, build, deploy) when build produces deployable artifacts.
- **Environment Count** — Minimum dev + production. Add staging when deployment risks justify pre-production validation with production-like data and configuration.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast feedback from early stages | Pipeline configuration overhead | Simple projects may not benefit from complex pipelines |
| Parallel execution reduces total time | Resource contention from parallel jobs | Runner capacity must be sized for peak parallel load |
| Quality gates prevent bad deployments | Gate failures block all deployments | Must balance gate strictness with deployment velocity |
| Artifact retention enables easy rollback | Storage costs for retained artifacts | Retention policies must balance cost against rollback needs |

---

## Performance Considerations

Run linting and static analysis before tests — they're fast and catch issues immediately. Parallelize independent work within stages. Cache dependencies across pipeline runs to reduce install time. Build artifacts should be scoped to essential files only. Set job timeouts to prevent runaway builds. Monitor pipeline duration trends to detect performance regressions.

---

## Production Considerations

Use branch protection rules to require pipeline success before merge. Configure deployment approvals for production environments. Notify team on deployment success/failure through communication channels. Monitor pipeline success rate as a key team metric. Implement environment promotion gates that require manual approval for production deployment.

---

## Common Mistakes

- **Sequential Everything** — Running all jobs in sequence when some are independent. Linting and static analysis can (and should) run simultaneously.
- **No Caching** — Every pipeline stage downloads fresh dependencies without caching. This wastes time and bandwidth.
- **Production-Only Pipeline** — Deploying directly to production without staging verification. Issues are discovered by users.
- **Overly Complex Pipeline** — Adding too many stages or parallel jobs creates confusion and maintenance burden. Start simple and add complexity as needed.

---

## Failure Modes

- **Flaky Test in Pipeline** — Non-deterministic test causes random pipeline failures. Detection: pipeline fails intermittently without code changes. Mitigation: quarantine flaky tests, implement test retry with backoff.
- **Cache Poisoning** — Corrupted cache causes dependency installation failures. Detection: pipeline fails on dependency install step. Mitigation: implement cache invalidation strategy, use cache keys based on lock file checksums.
- **Artifact Expiry Mid-Promotion** — Build artifact expires before it reaches production environment. Detection: deploy stage fails because artifact is unavailable. Mitigation: ensure artifact retention window covers maximum promotion time.

---

## Ecosystem Usage

Laravel pipeline structure follows the standard lint-test-build-deploy pattern implemented in GitHub Actions or GitLab CI. Common tools per stage: Pint (linting), PHPStan (static analysis), Pest (testing), Vite (build), Envoyer/Forge/Vapor (deploy). Laravel-specific packages like `laravel/pennant` or `laravel/horizon` may require additional pipeline stages for feature flag configuration or Horizon termination.

---

## Related Knowledge Units

### Prerequisites
- Version control, basic CI/CD concepts

### Related Topics
- GitHub Actions CI/CD
- GitLab CI
- Deployment Automation

### Advanced Follow-up Topics
- GitOps
- Release Engineering

---

## Research Notes

Pipeline structure is the foundation of CI/CD. Start with a simple two-stage pipeline (test, deploy) and add complexity as the project grows. The "fail fast" principle guides stage ordering. Build artifacts once and promote through environments. Pipeline configuration should be version-controlled alongside the application code.
