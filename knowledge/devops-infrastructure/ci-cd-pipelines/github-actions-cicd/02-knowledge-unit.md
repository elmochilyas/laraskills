# GitHub Actions CI/CD

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** CI/CD Pipelines
- **Knowledge Unit:** GitHub Actions CI/CD
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

GitHub Actions is the dominant CI/CD platform for Laravel, providing integrated testing and deployment workflows directly within GitHub's ecosystem. A standard Laravel pipeline includes linting, static analysis, multi-version PHP testing, asset building, and automated deployment via Forge API, Envoyer, or Vapor CLI.

---

## Core Concepts

- **Workflow** — YAML-defined automation process triggered by Git events
- **Job** — Unit of work running on a runner (lint, test, build, deploy)
- **Step** — Individual command or action within a job
- **Action** — Reusable unit of automation from the marketplace
- **Runner** — Virtual machine that executes workflow jobs
- **Matrix Strategy** — Run jobs across multiple PHP versions or dependency configurations
- **Service Container** — Ephemeral database/Redis containers for integration testing

---

## Mental Models

- **Git-Native Automation** — GitHub Actions lives in your repository's `.github/workflows/` directory. The workflow configuration is part of your codebase, version-controlled alongside your application.
- **Marketplace Ecosystem** — The GitHub Marketplace provides pre-built actions for almost every task. Use community actions judiciously — pin versions and audit the source.
- **Ephemeral Runners** — Each workflow run starts on a fresh virtual machine. Nothing persists between runs except cached dependencies. This guarantees clean environments but requires explicit caching for performance.

---

## Internal Mechanics

When a Git event occurs (push, pull_request, workflow_dispatch), GitHub creates a new runner instance, checks out the repository, and executes the workflow steps sequentially within each job. Jobs run in parallel by default unless dependencies are specified. Steps within a job share the same filesystem. Service containers provide isolated MySQL/PostgreSQL and Redis instances for the duration of the job. The workflow succeeds only if all jobs complete successfully.

---

## Patterns

- **Pin Action Versions** — Use exact versions (`actions/checkout@v4`) not branches (`@main`) to prevent silent breaking changes
- **Cache Dependencies** — Cache Composer and npm directories keyed on lock file hashes for automatic invalidation
- **Matrix Testing** — Test against PHP 8.2, 8.3, and 8.4 to catch version-specific issues
- **Service Containers** — Use MySQL/PostgreSQL and Redis as service containers for isolated integration tests

---

## Architectural Decisions

- **GitHub Actions vs. GitLab CI** — Use GitHub Actions for GitHub-hosted code; use GitLab CI for GitLab-hosted code. Both provide equivalent capabilities for Laravel CI/CD.
- **Marketplace Actions vs. Custom Scripts** — Use marketplace actions for standard tasks (checkout, setup-php, cache); write custom scripts for project-specific deployment logic.
- **Matrix vs. Single Build** — Use matrix builds for libraries and packages supporting multiple PHP versions; use single optimized build for application deployment.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Integrated with GitHub ecosystem | Not available for GitLab/Bitbucket hosted code | Must use different CI if repository hosting changes |
| Large marketplace of pre-built actions | Supply chain risk from compromised actions | Pin versions and review action source code |
| Generous free tier for public repos | Minute limits for private repositories | Costs scale with team size and commit frequency |
| Service containers for integration tests | Runner startup latency | Typical workflow start takes 15-30 seconds |

---

## Performance Considerations

Workflow without caching downloads all dependencies on every run — 5-minute workflows become 15-minute workflows. Key caches on lock file checksums for automatic invalidation. Use matrix builds for parallel testing across PHP versions. Set reasonable timeout per job to prevent runaway workflows. Limit workflow concurrency to prevent resource exhaustion on shared runners.

---

## Production Considerations

Store all secrets (API tokens, SSH keys, deployment credentials) in GitHub Secrets, never in workflow files. Avoid `pull_request_target` trigger without safe checkout practices to prevent fork PRs from accessing secrets. Use environment protection rules for production deployments (required reviewers, wait timer). Configure deployment notifications via Slack or email.

---

## Common Mistakes

- **Unpinned Action Versions** — Using `@main` or `@v3` (floating tag) causes builds to break when action maintainers push breaking changes. Pin to specific versions.
- **No Cache Configuration** — Each workflow run downloads all dependencies from scratch. 5-minute workflows become 15-minute workflows.
- **Secrets in Workflow Files** — Hardcoding API keys or tokens in `.github/workflows/*.yml` instead of using GitHub Secrets.
- **Fork-Vulnerable Workflows** — Using `pull_request_target` without safe checkout practices allows fork PRs to access repository secrets.

---

## Failure Modes

- **Action Breaking Change** — A pinned action's behavior changes in a patch version. Detection: workflow fails after action update. Mitigation: pin to exact version, pin Dependabot updates for actions.
- **Cache Miss** — Cache key doesn't match, causing full dependency download. Detection: workflow run time increases. Mitigation: review cache key composition, ensure lock files are committed.
- **Runner Quota Exhaustion** — GitHub Actions minute limit reached for private repositories. Detection: workflow queued but not executed. Mitigation: self-hosted runners, optimize workflow to reduce minutes.

---

## Ecosystem Usage

GitHub Actions is the standard CI/CD platform for Laravel projects hosted on GitHub. Laravel-specific setup actions include `shivammathur/setup-php` (PHP version configuration, extension installation) and `ramsey/composer-install` (optimized Composer caching). Deployment integration targets include Forge API, Envoyer webhooks, Vapor CLI, and Deployer PHP. The `laravel/sail` package provides Docker-based test environments compatible with GitHub Actions service containers.

---

## Related Knowledge Units

### Prerequisites
- Git, GitHub, basic CI/CD concepts

### Related Topics
- GitLab CI (alternative platform)
- Pipeline Structure
- Deployment Automation

### Advanced Follow-up Topics
- Custom GitHub Actions
- Reusable Workflows
- Composite Actions

---

## Research Notes

GitHub Actions is the standard CI/CD for Laravel on GitHub. Use `shivammathur/setup-php` for PHP configuration and `ramsey/composer-install` for caching. Pin action versions to avoid breaking changes. Always use GitHub Secrets for credentials. Service containers provide isolated test databases.
