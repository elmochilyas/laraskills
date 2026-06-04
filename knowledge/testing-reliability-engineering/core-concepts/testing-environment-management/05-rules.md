# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: Testing Environment Management

---

### Rule 1: Always set `APP_ENV=testing` in `phpunit.xml`

| Field | Value |
|-------|-------|
| **Name** | Set `APP_ENV=testing` in `phpunit.xml` |
| **Category** | Environment Configuration |
| **Rule** | Always include `<env name="APP_ENV" value="testing"/>` as the first environment variable in `phpunit.xml`'s `<php>` section. |
| **Reason** | Laravel only loads `.env.testing` when `APP_ENV=testing`. Without this setting, tests use the development `.env` values, potentially connecting to production databases or sending real emails. |
| **Bad Example** | `<php>` section omitting `APP_ENV` — tests silently use `.env` values. |
| **Good Example** | `<php><env name="APP_ENV" value="testing"/><env name="DB_CONNECTION" value="sqlite"/>...</php>` |
| **Exceptions** | When running tests in an environment where `APP_ENV` is already set via system environment variables (e.g., CI). |
| **Consequences Of Violation** | Tests may write to production databases, send real emails, or use production cache — corrupting production data. |

---

### Rule 2: Never run `php artisan config:cache` when `APP_ENV=testing`

| Field | Value |
|-------|-------|
| **Name** | Never cache config for testing |
| **Category** | Environment Configuration |
| **Rule** | Never run `php artisan config:cache` before or during test execution. Always run `php artisan config:clear` before running tests. |
| **Reason** | Configuration caching freezes config values. When tests set `APP_ENV=testing`, the `.env.testing` overrides are ignored because the cached config was built with the cached environment values. |
| **Bad Example** | CI pipeline running `php artisan config:cache` before `php artisan test` — tests read stale cached config. |
| **Good Example** | `php artisan config:clear && php artisan test` — fresh config read from files. |
| **Exceptions** | None. Configuration caching is fundamentally incompatible with the testing pattern of reading environment-specific configuration. |
| **Consequences Of Violation** | Tests use wrong database, mail, or queue configuration. Failures are confusing and environment-dependent. |

---

### Rule 3: Use `Env::fake()` for test-scoped environment overrides

| Field | Value |
|-------|-------|
| **Name** | Use `Env::fake()` instead of direct `$_ENV` manipulation |
| **Category** | Environment Configuration |
| **Rule** | For test-scoped environment variable changes, use `Env::fake(['KEY' => 'value'])`. Never modify `$_ENV` or `$_SERVER` directly. |
| **Reason** | `Env::fake()` is scoped to the test and automatically cleaned up when the test ends (via `RefreshDatabase` or manual teardown). Direct `$_ENV` manipulation can leak between tests, causing non-deterministic behavior. |
| **Bad Example** | `$_ENV['API_TIMEOUT'] = 30;` — value persists after test ends, affecting subsequent tests. |
| **Good Example** | `Env::fake(['API_TIMEOUT' => 30]);` — automatically restored after test. |
| **Exceptions** | When testing `Env::fake()` itself or when configuring values at the `phpunit.xml` level. |
| **Consequences Of Violation** | Environment variables leak between tests. Tests pass or fail based on execution order. |

---

### Rule 4: Set null drivers for mail, queue, cache, session, and broadcast in testing

| Field | Value |
|-------|-------|
| **Name** | Set null/log drivers for external services |
| **Category** | Service Configuration |
| **Rule** | Configure `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, and `BROADCAST_DRIVER=log` in `.env.testing` or `phpunit.xml`. |
| **Reason** | Default drivers may attempt real external service calls during tests. Sending real emails, queuing jobs to real queues, or using real cache in testing causes side effects, slows tests, and depends on external service availability. |
| **Bad Example** | `MAIL_MAILER=smtp` in testing — tests send real emails. |
| **Good Example** | `MAIL_MAILER=array` — emails are stored in memory for assertion but never sent. |
| **Exceptions** | Integration or contract tests that deliberately test real service interactions. These should be explicitly marked and run in a separate suite. |
| **Consequences Of Violation** | Tests send real emails, queue real jobs, or hit real external services. Side effects are unpredictable and tests become flaky. |

---

### Rule 5: Use SQLite for local testing, production-equivalent DB in CI

| Field | Value |
|-------|-------|
| **Name** | Use SQLite locally, production DB in CI |
| **Category** | Database Configuration |
| **Rule** | Use SQLite in-memory (`DB_CONNECTION=sqlite DB_DATABASE=:memory:`) for local development testing. Use the production-equivalent database engine (MySQL/PostgreSQL) in CI. |
| **Reason** | SQLite is 2-3x faster than MySQL for local runs and requires no setup. However, SQLite and MySQL differ in JSON queries, full-text search, locking behavior, and some SQL syntax. CI must use the production engine to catch engine-specific issues. |
| **Bad Example** | SQLite in both local and CI — engine-specific bugs (JSON queries, `FOR UPDATE` locks) go undetected. |
| **Good Example** | Local: `.env.testing` with `DB_CONNECTION=sqlite`. CI: environment variables override to `DB_CONNECTION=mysql`. |
| **Exceptions** | Projects that only use SQLite in production can use SQLite everywhere. |
| **Consequences Of Violation** | Engine-specific SQL bugs reach production. CI passes locally but fails in production. |

---

### Rule 6: Never commit real secrets to `.env.testing`

| Field | Value |
|-------|-------|
| **Name** | Keep secrets out of `.env.testing` |
| **Category** | Security |
| **Rule** | Commit only `.env.testing.example` with placeholder values. Add `.env.testing` to `.gitignore`. Inject real secrets via CI environment variables or GitHub Secrets. |
| **Reason** | `.env.testing` is for default configuration, not secrets. Hard-coded secrets in version-controlled files are exposed to everyone with repository access and can be leaked through CI logs or backups. |
| **Bad Example** | `DB_PASSWORD=supersecret` in committed `.env.testing`. |
| **Good Example** | `.env.testing.example` with `DB_PASSWORD=` (empty/placeholder). `.env.testing` in `.gitignore`. CI injects `DB_PASSWORD` via secrets. |
| **Exceptions** | Non-sensitive defaults like `DB_DATABASE=:memory:` or `MAIL_MAILER=array` are safe to commit. |
| **Consequences Of Violation** | Credentials exposed in git history. Security breach if repository access is compromised. |

---

### Rule 7: Disable non-essential service providers in testing

| Field | Value |
|-------|-------|
| **Name** | Disable heavy service providers in testing |
| **Category** | Performance |
| **Rule** | Disable service providers that are not needed for testing (e.g., Telescope, Debugbar, analytics) in the testing environment. |
| **Reason** | Each service provider adds 50-100ms of boot time per test class load. For 500 test files, a single unnecessary provider adds 25-50 seconds to the test suite. |
| **Bad Example** | Telescope provider registered and booting in every test — 50ms × 300 test files = 15 seconds of overhead. |
| **Good Example** | Checking `if (!$this->app->environment('testing'))` before registering heavy providers in `AppServiceProvider`. |
| **Exceptions** | Tests that specifically need these providers (e.g., testing Telescope integration itself). |
| **Consequences Of Violation** | Test suite is significantly slower than necessary. Developers wait longer for feedback. |

---

### Rule 8: Use CI environment variables for engine-override testing config

| Field | Value |
|-------|-------|
| **Name** | Inject CI-specific config via environment variables |
| **Category** | CI/CD |
| **Rule** | Override testing configuration for CI (e.g., database engine, credentials) via CI provider environment variables, not by modifying `.env.testing`. |
| **Reason** | Local `.env.testing` uses SQLite for speed. CI needs MySQL/PostgreSQL. Using CI environment variables allows the same codebase to use different database engines without modifying version-controlled files. |
| **Bad Example** | Checking in a modified `.env.testing` for CI that uses MySQL credentials. |
| **Good Example** | CI workflow sets `DB_CONNECTION=mysql DB_DATABASE=test DB_USERNAME=root DB_PASSWORD=${{ secrets.DB_PASSWORD }}` as job environment variables. |
| **Exceptions** | None. Environment-specific overrides belong in the environment, not in version control. |
| **Consequences Of Violation** | Configuration is environment-specific and cannot be reused. CI setup requires modifying committed files. |

---

### Rule 9: Always verify `APP_ENV` in CI test output

| Field | Value |
|-------|-------|
| **Name** | Verify `APP_ENV` in CI test output |
| **Category** | Security |
| **Rule** | Include a log line or check in CI configuration that confirms `APP_ENV=testing` is set before running tests. |
| **Reason** | Running tests with `APP_ENV=production` or unset `APP_ENV` can write to production databases, send real emails, or corrupt production data. This guard catches misconfiguration before damage occurs. |
| **Bad Example** | CI runs `php artisan test` without verifying `APP_ENV` — production database could be targeted. |
| **Good Example** | CI step: `echo "APP_ENV=${{ env.APP_ENV }}"` in workflow; or test helper: `if (app()->environment('production')) { $this->fail('Tests running in production!'); }` |
| **Exceptions** | None. This is a critical safety check. |
| **Consequences Of Violation** | Catastrophic: tests modify production data. Recovery requires database restore. |
