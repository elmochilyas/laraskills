# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** pipeline-structure
**Difficulty:** Beginner
**Category:** CI/CD Pipelines
**Last Updated:** 2026-06-03

# Overview

Pipeline structure defines how code moves from commit to production through a series of automated stages. A well-structured CI/CD pipeline provides fast feedback, reliable deployments, and clear ownership of each transition. The standard Laravel pipeline follows a lint → test → build → deploy → post-deploy progression.

Pipeline structure exists because unstructured deployments are chaotic. The engineering value is a repeatable, auditable path to production that enforces quality gates at each transition.

# Core Concepts

- **Stage** — A logical phase in the pipeline (lint, test, build, deploy)
- **Job** — A unit of work within a stage (run PHPStan, run Pest tests)
- **Trigger** — The event that initiates the pipeline (push, PR, tag)
- **Quality Gate** — An automated check that must pass before proceeding
- **Artifact** — Output from one stage consumed by another (compiled assets, Docker image)
- **Environment Promotion** — Moving artifacts through dev → staging → production

# When To Use

- Any application with multiple developers
- Teams practicing continuous integration
- Projects requiring deployment quality gates

# When NOT To Use

- Personal projects with single developer
- Prototypes where pipeline overhead exceeds benefit

# Best Practices

**Fail Fast.** Run linting and static analysis before tests. A style violation shouldn't wait behind a 10-minute test suite.

**Parallelize Independent Work.** Linting, static analysis, and testing with different dependencies can run in parallel.

**Support Environment Promotion.** Build once, deploy everywhere. The artifact tested in staging is the exact artifact deployed to production.

**Retain Artifacts.** Store build artifacts for a defined period to enable rollback without rebuilding.

# Common Mistakes

**Sequential Everything.** Running all jobs in sequence when some are independent. Linting and static analysis can (and should) run simultaneously.

**No Caching.** Every pipeline stage downloads fresh dependencies. This wastes time and bandwidth.

**Production-Only Pipeline.** Deploying directly to production without staging verification. Issues are discovered by users.

# Related Topics

**Prerequisites:** Version control, basic CI/CD concepts
**Closely Related:** GitHub Actions, GitLab CI, Deployment Automation
**Advanced Follow-Ups:** GitOps, Release Engineering
