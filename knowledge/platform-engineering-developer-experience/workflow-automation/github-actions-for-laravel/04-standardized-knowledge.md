# Experience Curation: GitHub Actions for Laravel

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/github-actions-for-laravel
- **Maturity:** Mature
- **Related Technologies:** GitHub Actions, CI/CD, Laravel, PHPUnit, Pint, PHPStan, Dusk, Forge, Vapor
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
GitHub Actions is the most widely used CI/CD platform for Laravel applications, providing native integration with GitHub repositories, a marketplace of pre-built actions, and flexible workflow configuration via YAML. For Laravel teams, GitHub Actions workflows typically cover: testing (PHPUnit/Pest, Pint, PHPStan, Dusk), deployment (triggering Forge/Vapor deployments, running Envoyer scripts), dependency management (Dependabot integration), code quality reporting (coverage uploads to Codecov), and automation (changelog generation, release creation). Key Laravel-specific considerations include: caching Composer dependencies and NPM packages, configuring MySQL/PostgreSQL service containers, matching PHP versions to the production environment, and handling environment-specific secrets.

## Core Concepts
- **Workflow:** A configurable YAML file (in .github/workflows/) that defines a CI/CD process; triggered by events (push, pull_request, schedule, workflow_dispatch)
- **Job:** A unit of work that runs on a GitHub-hosted or self-hosted runner; jobs can run sequentially or in parallel
- **Service Container:** A Docker container that runs alongside a job (e.g., MySQL, Redis, Mailpit) available at localhost for the application
- **Action:** A reusable unit of code (marketplace action or local action) that performs a specific task (checkout code, setup PHP, cache dependencies)
- **Runner:** A virtual machine (Ubuntu, Windows, macOS) or self-hosted machine that executes workflow jobs
- **Workflow as Pipeline Blueprint:** Each .github/workflows/*.yml file is a blueprint for a specific pipeline; GitHub Actions provisions resources to execute it

## When To Use
- Most Laravel applications (GitHub Actions is the default CI recommendation in Laravel docs)
- Teams already using GitHub for source control (native integration, no additional platform)
- Projects needing testing across multiple PHP and Laravel version combinations (matrix builds)
- Applications deploying via Laravel Forge, Vapor, or Envoyer (native deployment trigger support)
- Open-source Laravel packages (free for public repositories)

## When NOT To Use
- Projects using GitLab, Bitbucket, or other Git hosting (use their native CI instead)
- Teams with existing investment in a different CI platform (GitLab CI, CircleCI, Jenkins)
- Applications requiring Windows-specific CI runners (GitHub Actions has limited Windows support for PHP)
- Projects needing complex build pipelines beyond what YAML-based workflows can express

## Best Practices
- **WHY:** Use dependency caching for vendor/ and node_modules/ based on lock file hashes; without caching, each CI run spends 30-60 seconds re-downloading unchanged packages
- **WHY:** Health-check MySQL service containers before running tests; without health checks, the test step may run before MySQL is ready, causing spurious connection errors
- **WHY:** Use parallel jobs for linting (Pint), static analysis (PHPStan), and tests; parallelization reduces total pipeline time from 15-20 minutes to 5-10 minutes
- **WHY:** Store secrets (deployment tokens, API keys) as GitHub Actions secrets, never hardcoded in workflow files; rotated secrets quarterly
- **WHY:** Use matrix builds for packages/libraries to test across PHP and Laravel versions; use single-version builds for applications (match production environment exactly)

## Architecture Guidelines
- **Standard Laravel CI Pattern:** jobs with services (MySQL), actions/cache for vendor/, shivammathur/setup-php for PHP version and extensions, matrix strategy for multi-version testing
- **Parallel Job Pattern:** Separate jobs for pint, phpstan, and tests running concurrently; each with its own runner, reducing total pipeline time
- **Deployment Trigger Pattern:** Deploy only after all test jobs pass, on push to main branch (not PRs); uses needs: [pint, phpstan, tests] dependency
- **Scheduled Maintenance Pattern:** cron-scheduled workflows for health checks, data pruning, cache warming
- **Matrix Testing Pattern:** test against multiple PHP and Laravel version combinations; exclude incompatible pairs (e.g., PHP 8.1 with Laravel 11)
- **Runner Choice:** GitHub-hosted (ubuntu-latest) for standard projects; self-hosted for custom hardware or persistent caches

## Performance
- Well-optimized Laravel CI: 5-10 minutes total. Without caching and parallelization: 15-30 minutes. Optimize by caching vendor/ and node_modules/, parallel jobs, running Dusk separately
- Standard plan: 2000-3000 free minutes/month. A 10-minute CI run on 40 PRs/week = ~400 minutes/week. Optimize to stay within free tier
- vendor/ cache hit rate is high (90%+) since composer.lock changes infrequently; use hash-based keys for exact cache matches
- setup-php action is faster and simpler than Docker container approach for PHP version management

## Security
- Store deployment tokens, API keys, and environment variables as GitHub Actions secrets; never hardcode in workflow files
- Use GitHub environments for production-specific secrets with different scopes for different environments
- Add required reviewers to production GitHub Environment; deployments require manual approval even after CI passes
- Rotate secrets quarterly; use separate tokens for CI and development
- Avoid logging sensitive information in CI output; mask secrets in workflow output

## Common Mistakes

### No dependency caching
- **Description:** Running composer install on every push without caching vendor/
- **Consequence:** Each run spends 30-60 seconds downloading packages that haven't changed
- **Better Approach:** Use actions/cache with hash-based keys on composer.lock

### MySQL service not health-checked
- **Description:** Starting MySQL service container without a health check
- **Consequence:** Test step runs before MySQL is ready, causing spurious connection errors
- **Better Approach:** Add health check options to MySQL service container configuration

### Wrong event trigger
- **Description:** Running full test suite on both push and pull_request
- **Consequence:** Duplicate CI runs waste minutes
- **Better Approach:** Use push:main + pull_request:main for efficient coverage

### Hardcoded secrets
- **Description:** Putting database passwords or API keys directly in the workflow YAML
- **Consequence:** Secrets visible in the repository and exposed to anyone with repository access
- **Better Approach:** Use GitHub Actions secrets; reference via ${{ secrets.SECRET_NAME }}

### No PHP extension installation
- **Description:** Trying to run Laravel without required PHP extensions
- **Consequence:** Tests fail with "class not found" errors for missing extensions
- **Better Approach:** Use setup-php action to install required extensions (pdo_mysql, mbstring, bcmath, xml)

## Anti-Patterns
- **Monolithic workflow file:** One massive .yml file handling test, lint, deploy, and maintenance in a single job; hard to debug and maintain
- **Skipping parallelization:** Running lint, static analysis, and tests sequentially; wastes 10+ minutes of CI time
- **Ignoring cache key strategy:** Using a static cache key that never invalidates; CI runs with stale dependencies
- **Deploying on PR events:** Triggering production deployment on every PR commit; deploys incomplete features
- **No environment-specific configuration:** Using the same CI config for all environments; fails to catch environment-specific issues

## Examples
- **Laravel Documentation:** Official GitHub Actions CI template for Laravel applications; recommended starting point for new projects
- **Laravel Forge:** Provides deployment webhook URLs that GitHub Actions calls to trigger production deployments after successful CI
- **Laravel Vapor:** Vapor CLI can be called from GitHub Actions to deploy serverless applications
- **Laravel Nova:** CI workflows include asset compilation and cache clearing steps specific to Nova's admin panel deployment

## Related Topics
- automated-testing-in-ci (running PHPUnit/Pest in CI pipeline)
- automated-deployment-pipelines (deploying after CI passes)
- phpstan-in-ci (static analysis as a CI gate)
- pint-in-ci (code style checking in CI)
- dusk-browser-tests-ci (browser testing in CI)

## AI Agent Notes
- shivammathur/setup-php is the most widely used PHP setup action on the GitHub Marketplace; always recommend it for PHP version management
- The actions/cache action v4 uses a faster cache backend than v3; recommend v4 for new workflows
- GitHub Actions usage has grown 3x year-over-year for Laravel projects since 2022
- For organizations, establish standard workflow templates across all Laravel projects for consistency
- Matrix testing is essential for packages but excessive for applications; match production versions

## Verification
- [ ] Workflow files are in .github/workflows/ with appropriate triggers
- [ ] Dependency caching is configured for vendor/ and node_modules/
- [ ] MySQL service container has health checks configured
- [ ] Parallel jobs are used for lint, static analysis, and tests
- [ ] Secrets are stored as GitHub Actions secrets, not hardcoded
- [ ] Matrix builds test across required PHP and Laravel versions
- [ ] Deployment step depends on all test jobs passing (needs:)
- [ ] PHP extensions are explicitly installed via setup-php
- [ ] Scheduled workflows exist for maintenance tasks (if applicable)
- [ ] Environment-specific secrets and configurations are separated
