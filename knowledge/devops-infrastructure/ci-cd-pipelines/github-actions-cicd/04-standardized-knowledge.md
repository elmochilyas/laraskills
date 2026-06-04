# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** github-actions-cicd
**Difficulty:** Intermediate
**Category:** CI/CD Pipelines
**Last Updated:** 2026-06-03

# Overview

GitHub Actions is the dominant CI/CD platform for Laravel, providing integrated testing and deployment workflows that trigger on Git events. A standard Laravel pipeline includes linting (Pint/PHP-CS-Fixer), static analysis (PHPStan), testing (Pest/PHPUnit with matrix PHP versions), asset building (npm/Vite), and deployment (via Forge API, Envoyer, Vapor CLI, Deployer, or Fly.io).

GitHub Actions exists because it's integrated directly into GitHub's ecosystem. The engineering value is zero-configuration setup for GitHub-hosted repositories, deep GitHub API integration, and a large marketplace of pre-built actions.

# When To Use

- Code hosted on GitHub
- Teams wanting CI/CD without maintaining infrastructure
- Multi-version PHP testing with matrix builds
- Automated deployment on merge to main branch

# When NOT To Use

- Code hosted on GitLab or Bitbucket (use their native CI)
- Self-hosted CI requirements with restricted network access
- Complex pipelines exceeding action limits

# Best Practices

**Pin Action Versions.** Use exact versions (`actions/checkout@v4`) not branches (`@main`). Branch references silently pull in breaking changes.

**Cache Dependencies.** Cache Composer and npm directories. Key caches on lock file hashes for automatic invalidation.

**Use Matrix Testing.** Test against PHP 8.2, 8.3, and 8.4. This catches version-specific issues before deployment.

**Service Containers.** Use MySQL/PostgreSQL and Redis as service containers for integration tests. This provides isolated test databases without external dependencies.

# Common Mistakes

**Unpinned Action Versions.** Using `@main` or `@v3` (floating tag) causes builds to break when action maintainers push breaking changes.

**No Cache Configuration.** Each workflow run downloads all dependencies from scratch. 5-minute workflows become 15-minute workflows.

**Secrets in Workflow Files.** Hardcoding API keys or tokens in `.github/workflows/*.yml` instead of using GitHub Secrets.

**Fork-Vulnerable Workflows.** Using `pull_request_target` without safe checkout practices, allowing fork PRs to access repository secrets.

# Related Topics

**Prerequisites:** Git, GitHub, basic CI/CD concepts
**Closely Related:** GitLab CI (alternative), Pipeline Structure, Deployment Automation
**Advanced Follow-Ups:** Custom GitHub Actions, Reusable Workflows, Composite Actions
**Cross-Domain Connections:** Database Migration in CI, Deployment Strategies
