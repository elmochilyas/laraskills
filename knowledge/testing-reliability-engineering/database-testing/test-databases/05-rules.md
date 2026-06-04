# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Test Databases

---

### Rule 1: Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence

| Field | Value |
|-------|-------|
| **Name** | Match database engine to environment |
| **Category** | Environment Configuration |
| **Rule** | Configure SQLite in-memory for local development testing. In CI, run tests against the production-equivalent database engine (MySQL or PostgreSQL) in at least one CI matrix job. |
| **Reason** | SQLite is 2-3x faster than MySQL/PostgreSQL and requires zero setup — ideal for rapid local TDD. However, engine differences (JSON queries, locking, full-text) require CI validation against the production engine. |
| **Bad Example** | SQLite in CI and MySQL in production — engine-specific bugs undetected until deployment. |
| **Good Example** | Local: `DB_CONNECTION=sqlite DB_DATABASE=:memory:`. CI: matrix includes `DB_CONNECTION=mysql`. |
| **Exceptions** | Projects using SQLite in production can use SQLite everywhere. |
| **Consequences Of Violation** | Engine-specific SQL bugs reach production without detection. |

---

### Rule 2: Never store real secrets in `.env.testing`

| Field | Value |
|-------|-------|
| **Name** | Keep secrets out of `.env.testing` |
| **Category** | Security |
| **Rule** | Use `.env.testing.example` with placeholder values committed to version control. Add `.env.testing` to `.gitignore`. Inject real secrets via CI environment variables or GitHub Secrets. |
| **Reason** | `.env.testing` is typically committed to version control. Real secrets in version control are exposed to everyone with repository access. |
| **Bad Example** | `DB_PASSWORD=supersecret` in committed `.env.testing`. |
| **Good Example** | `.env.testing.example` with `DB_PASSWORD=` (empty). CI injects `DB_PASSWORD` via secrets. `.env.testing` in `.gitignore`. |
| **Exceptions** | Non-sensitive defaults like `DB_DATABASE=:memory:` or `MAIL_MAILER=array` are safe to commit. |
| **Consequences Of Violation** | Credentials exposed in git history. Security breach if repository access is compromised. |

---

### Rule 3: Never run `php artisan config:cache` in the testing environment

| Field | Value |
|-------|-------|
| **Name** | Do not cache config for testing |
| **Category** | Environment Configuration |
| **Rule** | Never run `php artisan config:cache` with `APP_ENV=testing`. Always run `php artisan config:clear` before running tests. |
| **Reason** | Configuration caching freezes config values. When tests set `APP_ENV=testing`, the `.env.testing` overrides are ignored because the cached config was built with stale values. |
| **Bad Example** | CI pipeline runs `config:cache` before `php artisan test` — tests use stale DB credentials. |
| **Good Example** | `php artisan config:clear && php artisan test` — fresh config read from files each time. |
| **Exceptions** | None. Config caching is fundamentally incompatible with environment-specific testing. |
| **Consequences Of Violation** | Tests use wrong database, mail, or queue configuration. Debugging is confusing because config appears correct in files but cached version differs. |

---

### Rule 4: Configure parallel database naming with `ParallelTesting::token()`

| Field | Value |
|-------|-------|
| **Name** | Use process-specific database names in parallel |
| **Category** | Parallel Execution |
| **Rule** | Use `ParallelTesting::token()` to create unique database names per parallel worker (e.g., `myapp_test_1`, `myapp_test_2`). Clean up with `ParallelTesting::tearDownProcess()`. |
| **Reason** | Without unique database names, parallel workers share the same database. `RefreshDatabase` wraps each test in a transaction, but concurrent transactions from different workers cause deadlocks and collisions. |
| **Bad Example** | `php artisan test --parallel` with `DB_DATABASE=myapp_test` — all workers use the same database. |
| **Good Example** | `ParallelTesting::setUpProcess(fn ($token) => DB::statement("CREATE DATABASE IF NOT EXISTS myapp_test_{$token}"))`. |
| **Exceptions** | SQLite in-memory databases are inherently isolated per process. |
| **Consequences Of Violation** | Deadlocks, transaction conflicts, random test failures in parallel mode. |

---

### Rule 5: Set null drivers for all external services in `.env.testing`

| Field | Value |
|-------|-------|
| **Name** | Nullify external service drivers in testing |
| **Category** | Service Configuration |
| **Rule** | Configure `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log` in `.env.testing`. |
| **Reason** | Default drivers attempt real service calls during tests. Sending real emails, queuing jobs, or using remote cache in testing causes side effects, depends on service availability, and slows tests. Null drivers prevent accidental external calls. |
| **Bad Example** | `MAIL_MAILER=smtp` — tests send real emails to real recipients. |
| **Good Example** | `MAIL_MAILER=array` — emails stored in memory for assertions. |
| **Exceptions** | Integration tests for specific external services, run in a dedicated suite. |
| **Consequences Of Violation** | Tests send real emails, queue jobs to real queues, or hit real external services. Side effects are unpredictable. |

---

### Rule 6: Use `Env::fake()` for per-test environment overrides, never `$_ENV`

| Field | Value |
|-------|-------|
| **Name** | Use `Env::fake()` for test-scoped overrides |
| **Category** | Environment Overrides |
| **Rule** | Use `Env::fake(['KEY' => 'value'])` for test-scoped environment variable changes. Never modify `$_ENV` or `$_SERVER` directly. |
| **Reason** | `Env::fake()` is scoped to the test and automatically cleaned up. Direct `$_ENV` manipulation leaks between tests, causing non-deterministic behavior and order-dependent failures. |
| **Bad Example** | `$_ENV['API_KEY'] = 'test-key'` — value persists after test ends. |
| **Good Example** | `Env::fake(['API_KEY' => 'test-key'])` — automatically restored after test. |
| **Exceptions** | When testing `Env::fake()` itself. |
| **Consequences Of Violation** | Environment variables leak between tests. Tests pass or fail based on execution order. |
