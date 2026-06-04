# Rules — GitHub Actions CI/CD for Laravel

## Rule 1: Always Cache Composer Dependencies
| Field | Value |
|-------|-------|
| **Name** | Always Cache Composer Dependencies |
| **Category** | CI & Performance |
| **Rule** | Use `actions/cache` to cache `vendor/` and `~/.composer/cache` using `composer.lock` hash as the cache key. Never run `composer install` without caching. |
| **Reason** | Without caching, `composer install` takes 30-60 seconds per CI run. With caching, it takes 5-10 seconds. This is the single highest-ROI optimization for Laravel CI pipelines. The lock file hash ensures cache is invalidated when dependencies change. |
| **Bad Example** | `run: composer install --no-interaction` without caching — 45 seconds wasted on every CI run. |
| **Good Example** | `uses: actions/cache@v4 with: { path: vendor, key: composer-${{ hashFiles('**/composer.lock') }} }` then `run: composer install`. |
| **Exceptions** | Self-hosted runners with local Composer cache persistence. |
| **Consequences Of Violation** | Thousands of wasted CI minutes per year; slower developer feedback. |

## Rule 2: Use Service Containers for Production-Equivalent Databases
| Field | Value |
|-------|-------|
| **Name** | Use Service Containers for Production-Equivalent Databases |
| **Category** | CI & Accuracy |
| **Rule** | Use MySQL or PostgreSQL Docker service containers in CI to match the production database engine. Never use SQLite as the sole CI database. |
| **Reason** | SQLite doesn't enforce foreign keys by default, has limited JSON support, and different transaction semantics than MySQL/PostgreSQL. Tests passing on SQLite but failing on MySQL/PostgreSQL is a common source of production bugs. Service containers are trivial to configure in GitHub Actions. |
| **Bad Example** | Running all tests with SQLite in CI — MySQL-specific JSON operations and foreign key constraints are never tested. |
| **Good Example** | `services: mysql: image: mysql:8.0` in CI — tests run against the production database engine. |
| **Exceptions** | Projects using SQLite in production (rare for Laravel applications). |
| **Consequences Of Violation** | Production database differences cause unexpected failures; JSON queries, foreign keys, and transactions behave differently. |

## Rule 3: Run Minimal Matrix on PRs, Full Matrix on Main Branch
| Field | Value |
|-------|-------|
| **Name** | Run Minimal Matrix on PRs, Full Matrix on Main Branch |
| **Category** | CI & Strategy |
| **Rule** | Use a reduced CI matrix (production PHP version + production database) on PRs. Run the full matrix (multiple PHP versions × database engines) on merge to main or nightly. |
| **Reason** | A full matrix multiplies CI time by the number of combinations. For a project with 3 PHP versions × 2 databases, that's 6x CI time. Running full matrix on every PR slows feedback for trivial changes. Reduced matrix catches most issues; full matrix ensures comprehensive compatibility. |
| **Bad Example** | Running 6 matrix cells (3 PHP × 2 DB) on every PR — 15-minute CI for a documentation typo fix. |
| **Good Example** | PR: 1 cell (PHP 8.3 + MySQL). Merge to main: 6 cells (PHP 8.2, 8.3, 8.4 × MySQL, PostgreSQL). |
| **Exceptions** | Open-source packages that need broad compatibility verification on every PR. |
| **Consequences Of Violation** | Slow CI feedback; developer frustration; CI minutes wasted. |

## Rule 4: Set Up Quality Gates Sequentially
| Field | Value |
|-------|-------|
| **Name** | Set Up Quality Gates Sequentially |
| **Category** | CI & Pipeline Design |
| **Rule** | Configure CI with sequential quality gates: lint (Pint) → static analysis (PHPStan) → test → deploy. Each stage blocks the next. |
| **Reason** | Sequential gates give the fastest possible feedback. Lint fails in 2-10 seconds, static analysis in 2-5 minutes, and tests in 5-15 minutes. A lint error found in the first 10 seconds is much faster feedback than finding it after 15 minutes of test execution. |
| **Bad Example** | Single job: `pint --test && phpstan analyze && php artisan test` — test runs even if lint fails; developer waits 15 minutes to discover a formatting issue. |
| **Good Example** | Job 1 (lint) → Job 2 (static analysis, needs lint) → Job 3 (test, needs static analysis) → Job 4 (deploy, needs test). |
| **Exceptions** | Very small projects where combined jobs complete in <3 minutes. |
| **Consequences Of Violation** | Slower feedback; developers wait for test suite to find issues that lint would catch in seconds. |

## Rule 5: Store CI Artifacts for Debugging
| Field | Value |
|-------|-------|
| **Name** | Store CI Artifacts for Debugging |
| **Category** | Observability & Debugging |
| **Rule** | Upload test output, coverage reports, and Dusk screenshots as CI artifacts. Set retention to 7-14 days. |
| **Reason** | CI failures are often environment-specific and hard to reproduce locally. Artifacts (test output XML, coverage HTML, Dusk screenshots) provide the evidence needed to diagnose failures without reproduction. Retention policies prevent storage costs from accumulating. |
| **Bad Example** | CI shows "Test failed" with no additional output — developer cannot determine why without running tests locally. |
| **Good Example** | Artifacts: `coverage-report/` and `dusk-screenshots/` with `retention-days: 7` — full debugging context available. |
| **Exceptions** | Projects where artifact storage cost is prohibitive (use text-based test output only). |
| **Consequences Of Violation** | Inability to debug CI-specific failures; wasted developer time on reproduction attempts. |

## Rule 6: Store All Secrets in GitHub Actions Secrets
| Field | Value |
|-------|-------|
| **Name** | Store All Secrets in GitHub Actions Secrets |
| **Category** | Security & Compliance |
| **Rule** | Store all sensitive values (APP_KEY, database passwords, API tokens, deploy SSH keys) in GitHub Actions secrets. Never commit secrets to the repository or embed them in workflow YAML. |
| **Reason** | Secrets in repository files or workflow YAML are exposed to anyone with repository access and appear in plain text in Git history. GitHub Actions secrets are encrypted, masked in logs, and only accessible to authorized workflows. |
| **Bad Example** | `run: php artisan deploy --key=my-secret-key` — secret is visible in workflow YAML and CI logs. |
| **Good Example** | `run: php artisan deploy --key=${{ secrets.DEPLOY_KEY }}` — secret is masked and encrypted. |
| **Exceptions** | Development/CI-only values that are not sensitive (test database passwords with no real data). |
| **Consequences Of Violation** | Secret exposure; compromised credentials; security incident. |
