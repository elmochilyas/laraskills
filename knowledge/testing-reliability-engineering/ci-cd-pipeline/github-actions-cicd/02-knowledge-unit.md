# Metadata
Domain: Testing & Reliability Engineering
Subdomain: CI/CD Pipeline Integration
Knowledge Unit: GitHub Actions CI/CD for Laravel
Difficulty Level: Core
Last Updated: 2026-06-02

---

# Executive Summary
GitHub Actions is the standard CI/CD platform for Laravel projects in 2026, providing workflow automation for linting, static analysis, testing, and deployment. A typical Laravel CI pipeline includes four stages: lint/style (Pint), static analysis (PHPStan/Larastan), test suite (parallel, potentially sharded), and deployment (zero-downtime via Deployer or Forge). GitHub Actions supports matrix testing (PHP versions × database engines), parallel test sharding, artifact caching (Composer, npm), and path-based workflow triggering. The `shivammathur/setup-php` action is the standard PHP environment setup tool.

# Core Concepts
- **Workflow file**: YAML file in `.github/workflows/` defining triggers, jobs, and steps. Named `ci.yml` or `test.yml` conventionally.
- **`shivammathur/setup-php`**: Action that installs PHP, extensions (pcov, redis, mysql), and tools (Composer, Pint, PHPStan). Supports matrix PHP versions.
- **Jobs and steps**: Jobs run in parallel by default; steps within a job run sequentially. Test jobs depend on dependency installation steps.
- **Matrix strategy**: `strategy.matrix.php: [8.2, 8.3, 8.4]` runs jobs for each PHP version in parallel.
- **Service containers**: MySQL/PostgreSQL run as Docker service containers for database testing.
- **Caching**: `actions/cache` for `~/.composer/cache` and `vendor/` to speed up dependency installation.
- **Artifacts**: Store test results, coverage reports, and screenshots for review after workflow completion.

# Mental Models
- **CI pipeline as factory line**: Code moves through stages: incoming (settings) → lint (quality check) → static analysis (safety check) → test (behavior check) → deploy (ship). Each stage gates the next.
- **Matrix as product testing**: Run the same tests across PHP versions and database engines. If production runs PHP 8.3 + MySQL 8, the matrix should verify at least this combination.
- **Caching as acceleration**: Composer install without cache = 30-60s. With cache = 5-10s. Cache is the difference between a 3-minute CI and an 8-minute CI.
- **Artifacts as evidence trail**: Every CI run produces artifacts (test output, coverage, screenshots). These are the audit trail for test reliability.

# Internal Mechanics
- **Workflow trigger**: `on: [push, pull_request]` triggers on push to any branch and on PR. `paths:` filter for monorepo optimization.
- **`setup-php` internals**: Downloads and installs PHP from pre-built binaries (Linux/macOS/Windows). Configures php.ini, enables extensions, installs tools via phive or composer.
- **Service container lifecycle**: GitHub Actions starts the specified Docker service container, exposes it at `localhost` with the configured port, and tears it down when the job completes.
- **Cache keys**: `composer-cache-php8.3-${{ hashFiles('**/composer.lock') }}`. Falls back to `composer-cache-php8.3-` if lock file changes. Cache is restored/ saved per job.
- **Parallel job concurrency**: GitHub Actions runs matrix jobs in parallel (up to 20 concurrent jobs on standard hosted runners). Each job gets its own VM.

# Patterns
- **Pattern: Standard Laravel CI workflow**
  - Purpose: Lint → static analysis → test → deploy for every PR
  - Benefits: Comprehensive quality gate in one workflow
  - Tradeoffs: Full run takes 5-15 minutes depending on matrix size
  - Implementation: Four-job workflow with `needs` dependencies

- **Pattern: Matrix testing (PHP × DB)**
  - Purpose: Test against multiple PHP versions and database engines
  - Benefits: Catches PHP version and DB-specific compatibility issues
  - Tradeoffs: Multiplies CI time and runner usage
  - Implementation: `strategy.matrix: { php: [8.2, 8.3, 8.4], db: [mysql, pgsql] }`

- **Pattern: Dependency caching**
  - Purpose: Speed up Composer install across CI runs
  - Benefits: 50-80% reduction in dependency installation time
  - Tradeoffs: Cache invalidation complexity; stale cache may cause issues
  - Implementation: `actions/cache` with key based on `composer.lock` hash

- **Pattern: Artifact upload for test results**
  - Purpose: Store coverage report, test output, and screenshots
  - Benefits: Debug CI failures without re-running
  - Tradeoffs: Storage costs and retention management
  - Implementation: `actions/upload-artifact` with retention-days setting

# Architectural Decisions
- **Single workflow vs multiple workflows**: Single workflow for most projects (simpler). Multiple workflows for monorepos or when deploy needs separate approval (e.g., `ci.yml` + `deploy.yml`).
- **Matrix exhaustiveness**: Full matrix (all PHP × all DB) is ideal but expensive. Minimum: production PHP version + production DB, plus one additional PHP version and one additional DB.
- **Caching strategy**: Cache `vendor/` only (most reliable) or `~/.composer/cache` (faster but more cache keys). Prefer caching `vendor/` for simplicity.
- **Self-hosted vs GitHub-hosted runners**: GitHub-hosted for standard projects (no maintenance). Self-hosted for large monorepos, slow test suites, or compliance requirements.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Matrix testing catches compatibility issues | 2-4x CI time for full matrix | Use minimal matrix (PHP 8.3/8.4, MySQL/PostgreSQL) |
| Caching speeds up installs significantly | Cache invalidation complexity | Use lock file hash as primary key |
| Artifacts provide debug trail | Storage costs (5-50MB per run) | Set 7-day retention; archive important reports |
| Parallel jobs complete faster | More runner minutes consumed | Balance matrix size against cost |

# Performance Considerations
- Dependency installation: 30-60s without cache, 5-10s with cache. This is the largest single time contributor.
- Test execution: Varies by suite size. 100 Pest tests with parallel: 1-3 minutes. 1000 tests: 5-15 minutes.
- Static analysis (PHPStan level max): 2-5 minutes for medium Laravel codebase.
- Pint linting: 2-10 seconds. Fastest stage.
- Full pipeline (cached, parallel tests): 5-10 minutes typical. 15-30 minutes for large codebases.

# Production Considerations
- **Deployment strategy**: Use Deployer for zero-downtime or Laravel Forge hooks for simpler projects. Deploy only from main/default branch after successful CI.
- **Secret management**: Store `APP_KEY`, `DB_PASSWORD`, deploy SSH keys, and API tokens in GitHub Actions secrets. Never commit secrets to repository.
- **Environment-specific workflows**: Production deploy uses `environment: production` with required reviewers. Staging deploy is automatic after merge.
- **Failure notifications**: Configure Slack/Discord webhook notifications on workflow failure. Use `n8n` or Zapier for complex notification logic.
- **Scheduled workflows**: Nightly full test suite (with mutation testing and full matrix). PR workflows use minimal matrix for speed.

# Common Mistakes
- **Mistake: Not caching Composer dependencies**
  - Why: Every CI run is fresh; caching seems optional
  - Why harmful: 30-60s wasted per run; adds up to hours per week
  - Better: Use `actions/cache` for `vendor/` with lock file hash key

- **Mistake: Running full matrix on every PR**
  - Why: Want maximum coverage for every change
  - Why harmful: 15+ minute CI on trivial changes; blocks fast iteration
  - Better: Full matrix on merge to main; minimal matrix on PR

- **Mistake: Not using service containers for databases**
  - Why: SQLite works for most tests
  - Why harmful: SQLite blind spots (JSON, foreign keys, transactions)
  - Better: Use MySQL/PostgreSQL service containers for CI

- **Mistake: Hardcoding PHP version in setup-php**
  - Why: Single PHP version works for current project
  - Why harmful: PHP upgrade catches you off guard; no compatibility tracking
  - Better: Use matrix with at least the current and next PHP minor version

# Failure Modes
- **Service container not ready**: MySQL/PgSQL container may not be ready when tests start. Use `healthcheck` or `sleep` before running tests.
- **Cache corruption**: Corrupted `vendor/` cache causes obscure Composer/autoloading errors. Clear cache as first troubleshooting step.
- **Matrix explosion**: Combining PHP (8.2, 8.3, 8.4) × DB (mysql, pgsql, sqlite) × dependency (stable, dev) = 18+ jobs. Use `include/exclude` to control matrix.
- **Runner timeout**: Default 6-hour timeout. Large test suites may exceed. Set explicit `timeout-minutes` per job.
- **Secrets not propagated**: Actions cannot pass secrets between jobs by default. Use `needs` contexts or artifact-based sharing.

# Ecosystem Usage
- **shivammathur/setup-php**: Used in virtually all Laravel CI workflows. Configures PHP, extensions, and tools. See `setup-php.com` for configuration reference.
- **Laravel core**: Laravel's own CI uses GitHub Actions with PHP 8.2/8.3/8.4 matrix, MySQL/PostgreSQL service containers, and Deployer for deployment.
- **Laravel Jetstream**: Jetstream's CI tests against both Livewire and Inertia stacks using GitHub Actions matrix.
- **Laravel Nova**: Nova CI workflows include Dusk browser tests with ChromeDriver service container.

# Related Knowledge Units
- **Prerequisites**: GitHub basics, YAML syntax, Laravel environment configuration
- **Related Topics**: Matrix testing, Parallel test sharding, Path-based triggering, Zero-downtime deployment
- **Advanced Follow-up**: Self-hosted runners, GitHub Actions security hardening, Composite actions for Laravel

# Research Notes
- `shivammathur/setup-php` is the most-starred PHP-related GitHub Action with 3000+ stars and supports PHP 5.6 through 8.4 across Ubuntu, macOS, and Windows runners
- GitHub Actions hosted runners provide 2-core CPU and 7GB RAM for Linux runners; Windows and macOS runners have different specifications that affect test suite performance
- The `actions/cache` action v4 improved cache restoration speed by using compression; cache save/restore takes ~2 seconds for a typical 50MB `vendor/` directory
- GitHub Actions usage limits: 2000 minutes/month for free accounts, 3000 minutes/month for Team, 50000+ minutes/month for Enterprise; matrix testing consumes significant minutes
- Self-hosted runners are increasingly used by large Laravel projects to avoid minute usage limits and gain control over the CI environment, particularly for Dusk browser tests and load testing
