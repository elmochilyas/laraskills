# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | GitHub Actions CI/CD for Laravel |
| Difficulty | Core |
| Maturity | Mature |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | GitHub basics, YAML syntax, Laravel environment configuration |
| Related KUs | Matrix testing, Parallel test sharding, Path-based triggering, Zero-downtime deployment |
| Source | domain-analysis.md K016 |

# Overview

GitHub Actions is the standard CI/CD platform for Laravel projects in 2026, providing workflow automation for linting, static analysis, testing, and deployment. A typical Laravel CI pipeline includes four stages: lint/style (Pint), static analysis (PHPStan/Larastan), test suite (parallel, potentially sharded), and deployment (zero-downtime via Deployer or Forge). GitHub Actions supports matrix testing (PHP versions x database engines), parallel test sharding, artifact caching (Composer, npm), and path-based workflow triggering. The `shivammathur/setup-php` action is the standard PHP environment setup tool.

# Core Concepts

- **Workflow file**: YAML file in `.github/workflows/` defining triggers, jobs, and steps.
- **`shivammathur/setup-php`**: Action that installs PHP, extensions (pcov, redis, mysql), and tools (Composer, Pint, PHPStan).
- **Jobs and steps**: Jobs run in parallel by default; steps within a job run sequentially.
- **Matrix strategy**: `strategy.matrix.php: [8.2, 8.3, 8.4]` runs jobs for each PHP version in parallel.
- **Service containers**: MySQL/PostgreSQL run as Docker service containers for database testing.
- **Caching**: `actions/cache` for `~/.composer/cache` and `vendor/` to speed up dependency installation.
- **Artifacts**: Store test results, coverage reports, and screenshots for post-workflow review.

# When To Use

- For every Laravel project using GitHub as the hosting platform
- When running automated test suites in CI
- When deploying to production via zero-downtime strategies
- For enforcing quality gates (lint, static analysis, coverage thresholds)
- When testing against multiple PHP versions and database engines

# When NOT To Use

- For projects using other CI platforms (GitLab CI, Bitbucket Pipelines, CircleCI) — adapt concepts but use platform-native tooling
- For projects small enough that local testing suffices (though CI is still recommended for team projects)
- When deploying to non-GitHub platforms without GitHub Actions deployment support
- For projects where CI runner minutes cost is prohibitive (consider self-hosted runners)

# Best Practices (WHY)

- **Cache Composer dependencies**: Without caching, `composer install` takes 30-60s. With `actions/cache` using `composer.lock` hash as key, it takes 5-10s. This is the single highest-ROI optimization for Laravel CI pipelines.
- **Use service containers for production-equivalent databases**: SQLite in CI creates blind spots (JSON behavior, foreign key enforcement, transaction semantics). Use MySQL/PostgreSQL service containers to match the production environment.
- **Run minimal matrix on PRs, full matrix on main**: Running all PHP versions x all database engines on every PR multiplies CI time and runner usage. Use a reduced matrix for PR feedback; run exhaustive matrix before merging to main.
- **Set up quality gates sequentially**: Lint (Pint) → Static analysis (PHPStan) → Tests → Deploy. Each stage blocks the next. This gives fastest feedback (lint fails in seconds, tests fail in minutes).
- **Store test artifacts for debugging**: Upload coverage reports, test output, and Dusk screenshots as CI artifacts. This enables debugging CI failures without reproducing locally.

# Architecture Guidelines

- **Single workflow vs multiple**: Single workflow for most projects. Multiple workflows for monorepos or when deploy needs separate approval (e.g., `ci.yml` + `deploy.yml`).
- **Self-hosted vs GitHub-hosted runners**: GitHub-hosted for standard projects. Self-hosted for large monorepos, slow test suites, or compliance requirements.
- **Deployment strategy**: Deployer for zero-downtime or Laravel Forge hooks for simpler projects. Deploy only from main/default branch after successful CI.
- **Secret management**: Store `APP_KEY`, `DB_PASSWORD`, deploy SSH keys, and API tokens in GitHub Actions secrets.

# Performance Considerations

- Dependency installation: 30-60s without cache, 5-10s with cache.
- Test execution: 100 Pest tests with parallel: 1-3 minutes. 1000 tests: 5-15 minutes.
- Static analysis (PHPStan level max): 2-5 minutes for medium codebase.
- Pint linting: 2-10 seconds. Fastest stage.
- Full pipeline (cached, parallel tests): 5-10 minutes typical. 15-30 minutes for large codebases.

# Security Considerations

- Store all secrets in GitHub Actions secrets, never in repository files or workflow YAML.
- Use `environment: production` with required reviewers for production deployments.
- Never commit `.env` files or service credentials to the repository.
- Use `GITHUB_TOKEN` with minimal permissions (principle of least privilege).
- Regularly rotate deploy keys and API tokens stored as secrets.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not caching Composer dependencies | Caching seems optional for small projects | 30-60s wasted per run; adds up to hours per week | Use actions/cache for vendor/ with lock file hash key |
| Running full matrix on every PR | Want maximum coverage for every change | 15+ minute CI on trivial changes; blocks fast iteration | Full matrix on merge to main; minimal matrix on PR |
| Not using service containers for databases | SQLite works for most tests | SQLite blind spots (JSON, foreign keys, transactions) | Use MySQL/PostgreSQL service containers for CI |
| Hardcoding PHP version in setup-php | Single PHP version works for current project | PHP upgrade catches you off guard; no compatibility tracking | Use matrix with at least current and next PHP minor version |
| Not setting artifact retention | Storage default is 90 days | CI storage fills up; costs increase | Set `retention-days: 7` for most artifacts |

# Anti-Patterns

- **No caching at all**: Every CI run downloads dependencies from scratch. Instead, cache `vendor/` and `~/.composer/cache`.
- **All tests sequential**: Running all tests without parallelization. Instead, use Pest's `--parallel` or matrix-based sharding.
- **Deploy from every branch**: Deploying from any branch without CI passing. Instead, deploy only from main after successful CI.
- **One workflow for everything**: Putting lint, test, and deploy in a single job without `needs` dependencies. Instead, use multiple dependent jobs for faster feedback.
- **Hardcoded environment-specific values**: Embedding environment URLs, API keys, or database names in workflow YAML. Instead, use GitHub environments and secrets.

# Examples

```yaml
name: Laravel CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3', tools: pint }
      - run: pint --test

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3', tools: phpstan }
      - run: composer install --no-interaction
      - run: phpstan --level=max

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['8.2', '8.3']
        db: [mysql, pgsql]
    services:
      mysql:
        image: mysql:8.0
        env: { MYSQL_ROOT_PASSWORD: password, MYSQL_DATABASE: testing }
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '${{ matrix.php }}', extensions: pdo_mysql }
      - uses: actions/cache@v4
        with:
          path: vendor
          key: composer-${{ matrix.php }}-${{ hashFiles('**/composer.lock') }}
      - run: composer install --no-interaction
      - run: php artisan test --parallel
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.php }}-${{ matrix.db }}
          path: coverage/
          retention-days: 7
```

# Related Topics

- **Prerequisites**: GitHub basics, YAML syntax, Laravel environment configuration
- **Related**: Matrix testing, Parallel test sharding, Path-based triggering, Zero-downtime deployment
- **Advanced**: Self-hosted runners, GitHub Actions security hardening, Composite actions for Laravel

# AI Agent Notes

- When setting up a new Laravel CI pipeline, the minimal workflow is: lint (Pint) → test (Pest/Paratest) on PHP 8.3 with MySQL service container. Add static analysis and deployment as the project grows.
- The `shivammathur/setup-php` action is the standard for PHP CI. Key options: `extensions` (pcov, redis, mongodb, imagick), `tools` (composer, pint, phpstan, deployer), `coverage` (pcov, xdebug).
- Always cache `vendor/` with `composer.lock` hash. Cache `~/.composer/cache` separately if composer install is slow even with cached `vendor/`.
- For Dusk tests in CI, install Chrome/Chromium via `shivammathur/setup-php` with `tools: chrome` or use `chromium` browser in the GitHub Actions runner.

# Verification

- [ ] CI pipeline includes lint → static analysis → test → deploy stages
- [ ] Composer dependencies are cached with lock file hash key
- [ ] Service containers run production-equivalent databases
- [ ] Matrix testing covers at least 2 PHP versions
- [ ] Secrets are stored in GitHub Actions secrets, not in code
- [ ] Artifacts upload test results with retention policy
- [ ] PRs cannot merge without passing CI
- [ ] Deployment runs only from main branch after CI success
- [ ] Job timeout-minutes is set appropriately
