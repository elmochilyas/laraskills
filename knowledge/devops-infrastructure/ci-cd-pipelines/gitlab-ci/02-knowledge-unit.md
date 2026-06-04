# GitLab CI

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** CI/CD Pipelines
- **Knowledge Unit:** GitLab CI
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

GitLab CI is the primary alternative to GitHub Actions for Laravel CI/CD, preferred by teams already using GitLab for repository hosting. Pipelines are defined in `.gitlab-ci.yml` with stages and jobs running on GitLab Runners, featuring Docker-in-Docker, environment-specific variables, multi-project pipelines, and a built-in container registry.

---

## Core Concepts

- **Pipeline** — Collection of stages and jobs defined in `.gitlab-ci.yml`
- **Stage** — Logical group of jobs that run in parallel (test, build, deploy)
- **Job** — Individual unit of work assigned to a Runner
- **Runner** — Agent that executes jobs (shared, group, or specific)
- **DIND** — Docker-in-Docker for building container images within CI
- **Environment** — Target deployment environment with associated variables

---

## Mental Models

- **Single Platform** — GitLab provides source control, CI/CD, container registry, and package registry in one platform. Everything stays within GitLab.
- **Runner as Execution Agent** — Runners can be shared (GitLab-hosted), group-scoped, or project-specific. The Runner executes the job and reports results back.
- **DIND for Container Workflows** — When building Docker images in CI, DIND provides a full Docker daemon inside the job container. Use when you need `docker build` and `docker push`.

---

## Internal Mechanics

When code is pushed to a GitLab repository, the pipeline is triggered based on rules in `.gitlab-ci.yml`. The pipeline runner allocates a job container, clones the repository, executes the defined stages sequentially (with parallel jobs within stages), and reports results. Artifacts from earlier stages can be passed to later stages. The container registry stores built Docker images. Environment-specific variables are injected based on the deployment environment. Multi-project pipelines can trigger downstream pipelines in other repositories.

---

## Patterns

- **YAML Anchors** — Use `.job-template` anchors to reduce duplication across stages
- **Cache Keyed on Lock Files** — Cache Composer and npm directories keyed on lock file checksums
- **Masked CI/CD Variables** — Mark all tokens and passwords as masked to prevent exposure in logs
- **DIND vs. Kaniko** — Use DIND for simple Docker builds; use kaniko for secure, privileged-free container builds

---

## Architectural Decisions

- **GitLab CI vs. GitHub Actions** — Choose GitLab CI when code is hosted on GitLab; the integrated platform advantage outweighs any feature differences
- **Shared vs. Specific Runners** — Use shared runners for standard CI/CD; use specific runners for air-gapped environments or custom hardware requirements
- **DIND vs. Kaniko** — Use DIND for simplicity in trusted environments; use kaniko for security-conscious deployments where privileged containers are restricted

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Integrated platform (code + CI/CD + registry) | Not available for GitHub-hosted code | Must use different CI if repository hosting changes |
| Built-in container registry | Runner maintenance if self-hosting | Self-hosted runners require infrastructure management |
| Multi-project pipeline support | Pipeline configuration complexity | Simple pipelines may not need advanced features |
| DIND for Docker builds | Privileged DIND mode security risk | Use kaniko for secure environments |

---

## Performance Considerations

Jobs without caching download all dependencies on every run. Key caches on lock file checksums. Use YAML anchors to reduce configuration size and maintenance overhead. Job artifacts should be scoped to necessary files only. Self-hosted runners should be sized appropriately for the workload and configured with concurrent job limits.

---

## Production Considerations

Mask all secrets using GitLab CI/CD masked variables. Use environment-specific CI/CD variables scoped to protect branches. Configure deployment jobs with environment names for traceability. Implement multi-project pipelines for microservice deployments. Use GitLab Container Registry as the canonical image storage for Docker-based deployments.

---

## Common Mistakes

- **Privileged DIND Mode** — Running Docker-in-Docker in privileged mode unnecessarily creates security risk. Use kaniko or Kubernetes runners for secure builds.
- **No Cache Configuration** — Pipelines without caching download dependencies on every run, significantly increasing execution time.
- **Hardcoded Environment Names** — Using literal environment names in deploy jobs instead of CI/CD variables. Use variables for environment-specific configuration.
- **Missing Artifact Dependencies** — Not passing build artifacts between stages, causing rebuild of assets in each stage.

---

## Failure Modes

- **Runner Offline** — Self-hosted Runner loses connectivity. Detection: pipeline stuck in pending state. Mitigation: monitor Runner health, configure fallback to shared runners.
- **DIND Daemon Failure** — Docker daemon inside DIND crashes. Detection: docker commands fail during job. Mitigation: implement retry logic, consider kaniko as alternative.
- **Container Registry Full** — GitLab Container Registry reaches storage quota. Detection: `docker push` fails. Mitigation: configure cleanup policies for old images.

---

## Ecosystem Usage

GitLab CI is common in Laravel projects hosted on self-managed GitLab instances or GitLab.com. The `.gitlab-ci.yml` configuration typically includes Composer caching, PHPStan analysis, Pest testing, and deployment via Deployer PHP or Forge API. GitLab's built-in container registry stores PHP-FPM and Nginx Docker images. Multi-project pipelines enable coordinated deployments across Laravel microservices.

---

## Related Knowledge Units

### Prerequisites
- GitLab, Docker basics

### Related Topics
- GitHub Actions CI/CD
- Pipeline Structure
- Docker-in-Docker Patterns

### Advanced Follow-up Topics
- GitLab Kubernetes Integration
- Multi-Project Pipelines
- Container Registry

---

## Research Notes

GitLab CI is the primary alternative to GitHub Actions for Laravel. Prefer GitLab CI when code is hosted on GitLab. Use YAML anchors for configuration maintainability. DIND is convenient but has security implications — recommend kaniko for production CI/CD pipelines. Cache keys should be based on lock file checksums for automatic invalidation.
