# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: PHPUnit Configuration

---

### Rule 1: Always set `APP_ENV=testing` in `phpunit.xml` to ensure `.env.testing` is loaded

| Field | Value |
|-------|-------|
| **Name** | Always set `APP_ENV=testing` in `phpunit.xml` |
| **Category** | Environment Configuration |
| **Rule** | Always include `<env name="APP_ENV" value="testing"/>` in the `<php>` section of `phpunit.xml`. |
| **Reason** | Laravel only loads `.env.testing` when `APP_ENV=testing`. Without this setting, tests may connect to the development database, send real emails, or use production cache stores. |
| **Bad Example** | `<php>` section omitting `APP_ENV` entirely — tests silently use the development `.env` file. |
| **Good Example** | `<php><env name="APP_ENV" value="testing"/><env name="DB_CONNECTION" value="sqlite"/><env name="DB_DATABASE" value=":memory:"/></php>` |
| **Exceptions** | When running tests against a dedicated CI database service, `APP_ENV` may be set via CI environment variables instead, but it must still be `testing`. |
| **Consequences Of Violation** | Tests may modify the development database, send real emails, or use production cache. This can corrupt data and trigger unintended side effects. |

---

### Rule 2: Never run `php artisan config:cache` for the test environment

| Field | Value |
|-------|-------|
| **Name** | Never run `config:cache` when `APP_ENV=testing` |
| **Category** | Environment Configuration |
| **Rule** | Never run `php artisan config:cache` before or during test execution. Always run `php artisan config:clear` before running tests. |
| **Reason** | Cached configuration ignores `.env.testing` overrides because the cache was built with the previous environment's values. Tests may use wrong database credentials or mail drivers. |
| **Bad Example** | `php artisan config:cache` run in CI before `phpunit` — tests use stale config values from the cache. |
| **Good Example** | `php artisan config:clear && php artisan test` — clearing config ensures `.env.testing` values are read fresh. |
| **Exceptions** | If all environment variables are set in `phpunit.xml` (not `.env`), config cache is safe. This is rare and not recommended. |
| **Consequences Of Violation** | Tests silently use wrong configuration values. Failures are intermittent and hard to debug. |

---

### Rule 3: Use `<source><include>` to scope coverage filtering to application code only

| Field | Value |
|-------|-------|
| **Name** | Scope coverage to `app/` with `<source><include>` |
| **Category** | Code Coverage |
| **Rule** | Always configure `<source><include>` in `phpunit.xml` to limit coverage collection to the `app/` directory. Explicitly exclude `config/`, `database/migrations/`, and `vendor/`. |
| **Reason** | Including vendor, config, and migrations in coverage reports inflates metrics with untested boilerplate code, making coverage percentages misleading. |
| **Bad Example** | `<source><include><directory>.</directory></include></source>` — includes everything including vendor and config. |
| **Good Example** | `<source><include><directory>app</directory></include></source>` — scope to application code only. |
| **Exceptions** | If you have custom packages in `packages/` or `src/`, include those directories additionally. |
| **Consequences Of Violation** | Coverage reports show inflated percentages. Developers cannot trust coverage metrics for decision-making. |

---

### Rule 4: Define separate `<testsuite>` entries for unit and feature tests

| Field | Value |
|-------|-------|
| **Name** | Define separate test suites for Unit and Feature |
| **Category** | Test Organization |
| **Rule** | Always define at minimum separate `Unit` and `Feature` test suites in `phpunit.xml`. |
| **Reason** | Separate suites allow targeted runs (`phpunit --testsuite=Unit`) for fast feedback during development while running the full suite in CI. |
| **Bad Example** | One monolithic test suite containing all test directories — cannot run only unit tests for quick feedback. |
| **Good Example** | `<testsuites><testsuite name="Unit"><directory>tests/Unit</directory></testsuite><testsuite name="Feature"><directory>tests/Feature</directory></testsuite></testsuites>` |
| **Exceptions** | Browser tests (Dusk) should have their own suite. Large projects may add `Integration`, `Browser`, or `Architecture` suites. |
| **Consequences Of Violation** | Developers cannot quickly run a subset of tests. CI pipelines cannot parallelize by test type. |

---

### Rule 5: Set parallel execution parameters matching CI runner capacity

| Field | Value |
|-------|-------|
| **Name** | Set parallel process count to CI runner CPUs minus one |
| **Category** | Parallel Execution |
| **Rule** | Always configure `<parameter name="processes"` in `phpunit.xml` to match CI runner CPU count minus one. Also set `maxBatchSize` and `slowThreshold`. |
| **Reason** | Parallel execution reduces test suite runtime proportionally to available CPU cores. Reserving one core prevents system thrashing. |
| **Bad Example** | No `<parameters>` section — tests run serially, wasting CI runner capacity. |
| **Good Example** | `<parameters><parameter name="processes" value="3"/><parameter name="maxBatchSize" value="50"/><parameter name="slowThreshold" value="500"/></parameters>` |
| **Exceptions** | On single-core CI runners or when tests have heavy I/O dependencies, parallel execution may not improve performance. Benchmark both modes. |
| **Consequences Of Violation** | Test suite takes much longer than necessary. CI pipeline throughput is reduced. |

---

### Rule 6: Never store secrets in `phpunit.xml` or `phpunit.xml.dist`

| Field | Value |
|-------|-------|
| **Name** | Never commit secrets in `phpunit.xml` |
| **Category** | Security |
| **Rule** | Never hard-code API keys, database passwords, or service credentials in `phpunit.xml` or `phpunit.xml.dist`. Use CI environment variables or `.env` files excluded from version control. |
| **Reason** | `phpunit.xml` is typically committed to version control. Secrets in version control are accessible to anyone with repository access and can be leaked in public repositories. |
| **Bad Example** | `<env name="DB_PASSWORD" value="supersecret123"/>` stored in committed `phpunit.xml`. |
| **Good Example** | Environment variables set in CI configuration (GitHub Secrets) and referenced at runtime. |
| **Exceptions** | Local development defaults for non-sensitive values like `DB_DATABASE=:memory:` are acceptable. |
| **Consequences Of Violation** | Secret exposure leads to security breaches. Rotating compromised secrets requires coordination across teams. |

---

### Rule 7: Prefer `test()` syntax over `it()` when `@depends` annotations are needed

| Field | Value |
|-------|-------|
| **Name** | Use `test()` for `@depends` dependent tests |
| **Category** | Test Syntax |
| **Rule** | Use the `test()` function instead of `it()` when a test requires PHPUnit's `@depends` annotation for inter-test dependencies. |
| **Reason** | `@depends` injects values as method arguments accessible via `$this`, which `it()` closures do not provide in the same way. `test()` methods mirror PHPUnit class methods more closely. |
| **Bad Example** | Using `it('requires a user', fn (User $user) => ...)` with `@depends` — `$this` context is not the test instance. |
| **Good Example** | `test('the user profile is accessible', function (User $user) { ... })->depends('test a user is created')` |
| **Exceptions** | In Pest, prefer composing tests without `@depends` using `beforeEach()` and shared state. `@depends` creates fragile test chains. |
| **Consequences Of Violation** | `@depends` injection has unexpected behavior. Tests fail with confusing errors about argument type mismatches. |

---

### Rule 8: Keep `phpunit.xml` as the single source of truth; use `pest.php` only for Pest-specific additions

| Field | Value |
|-------|-------|
| **Name** | Keep shared config in `phpunit.xml`, Pest-only config in `pest.php` |
| **Category** | Configuration Organization |
| **Rule** | Do not duplicate configuration between `phpunit.xml` and `pest.php`. Use `phpunit.xml` for suite-agnostic settings (env vars, test suites, extensions) and `pest.php` only for Pest-specific options (global `uses()`, dataset directories). |
| **Reason** | Both PHPUnit and Pest read `phpunit.xml`. Duplicating settings in `pest.php` creates confusion about which file is authoritative when values differ. |
| **Bad Example** | Setting `<env name="DB_CONNECTION" value="sqlite"/>` in both `phpunit.xml` and `pest.php` with different values. |
| **Good Example** | `phpunit.xml` defines all environment variables; `pest.php` only contains `uses(Tests\TestCase::class)->in('Feature');` |
| **Exceptions** | Pest plugins may require configuration in `pest.php` that has no `phpunit.xml` equivalent (e.g., `->parallel()->fake()`). |
| **Consequences Of Violation** | Conflicting settings cause hard-to-debug test failures. Team members are unsure where to add new configuration. |

---

### Rule 9: Always configure `<source>` to exclude `vendor/`, `config/`, and `database/migrations/`

| Field | Value |
|-------|-------|
| **Name** | Exclude non-application directories from coverage |
| **Category** | Code Coverage |
| **Rule** | Always exclude `vendor/`, `config/`, and `database/migrations/` from coverage source filters. |
| **Reason** | These directories contain code that is not owned by the project (vendor), not tested (config), or boilerplate (migrations). Including them inflates coverage with non-actionable metrics. |
| **Bad Example** | No `<source>` configuration at all — PHPUnit falls back to including every file in the project. |
| **Good Example** | `<source><include><directory>app</directory></include></source>` — implicitly excludes vendor, config, migrations. |
| **Exceptions** | If you have custom migration logic or config classes that require testing, add them explicitly as additional `<include>` entries. |
| **Consequences Of Violation** | Coverage reports show inflated percentages. Teams make decisions based on misleading data. |

---

### Rule 10: Never apply `RefreshDatabase` globally in `pest.php`

| Field | Value |
|-------|-------|
| **Name** | Scope database trait usage to feature tests only |
| **Category** | Test Organization |
| **Rule** | Never apply `RefreshDatabase` or `DatabaseMigrations` globally in `pest.php`. Scope database traits to feature test directories using `uses()->in('Feature')`. |
| **Reason** | Unit tests should not touch the database. Applying database traits globally forces every test to run migrations, slowing the entire suite unnecessarily. |
| **Bad Example** | `uses(RefreshDatabase::class)->in('*')` or `uses(RefreshDatabase::class)->in('**')` — applies to unit tests too. |
| **Good Example** | `uses(RefreshDatabase::class)->in('Feature')` — scoped only to feature test files. |
| **Exceptions** | If a project has no unit tests (all tests are feature tests), global application is acceptable but still not recommended. |
| **Consequences Of Violation** | Unit tests run slowly. Developers avoid writing unit tests because they are slow. Test suite feedback time increases. |

---

### Rule 11: Register PEST-specific plugins in `pest.php`, not `phpunit.xml`

| Field | Value |
|-------|-------|
| **Name** | Register Pest plugins in `pest.php` |
| **Category** | Extension Registration |
| **Rule** | Register Pest plugins and extensions in `pest.php` only. Do not attempt to register Pest-specific functionality in `phpunit.xml`. |
| **Reason** | Pest plugins are PHP objects that wire into Pest's compilation pipeline. PHPUnit's `<extensions>` block expects PHPUnit extension interfaces, not Pest plugins. |
| **Bad Example** | `$this->extend(FakerPlugin::class)` written in a PHPUnit extension class. |
| **Good Example** | `->withFaker()` or `->plugin(FakerPlugin::class)` in `pest.php`. |
| **Exceptions** | Custom PHPUnit extensions implementing `PHPUnit\Event\Subscriber` can be registered in `phpunit.xml` and work with Pest. |
| **Consequences Of Violation** | Pest plugin registration fails silently or produces runtime errors. Tests that depend on plugin functionality behave unexpectedly. |

---

### Rule 12: Always document configuration changes in pull requests

| Field | Value |
|-------|-------|
| **Name** | Document `phpunit.xml` changes in commit messages |
| **Category** | Team Practices |
| **Rule** | Always include a clear description of why `phpunit.xml` or `pest.php` was changed in the commit message or pull request description. |
| **Reason** | Test configuration changes can have wide-reaching effects — altering which tests run, what environment they use, or how parallel execution behaves. Team members need to understand the impact. |
| **Bad Example** | Commit message: "Update phpunit.xml" — no explanation of what changed or why. |
| **Good Example** | Commit message: "Add parallel execution parameters to phpunit.xml to match 4-core CI runner. Set processes=3, maxBatchSize=50." |
| **Exceptions** | Trivial changes like formatting or XML comments that do not affect behavior. |
| **Consequences Of Violation** | Team members are unaware of configuration changes. Debugging CI failures becomes harder because the configuration change is unexpected. |

---

### Rule 13: Prefer `phpunit.xml.dist` as the committed default, with `phpunit.xml` gitignored for local overrides

| Field | Value |
|-------|-------|
| **Name** | Use `phpunit.xml.dist` for committed defaults |
| **Category** | Version Control |
| **Rule** | Commit `phpunit.xml.dist` with the project's default configuration and add `phpunit.xml` to `.gitignore`. |
| **Reason** | Developers can override settings locally (e.g., different database, debug mode) without accidentally committing personal configuration. PHPUnit reads `phpunit.xml` first if it exists, falling back to `phpunit.xml.dist`. |
| **Bad Example** | Only `phpunit.xml` committed — developers must be careful not to commit local changes. |
| **Good Example** | `phpunit.xml.dist` committed with defaults; `phpunit.xml` in `.gitignore` for local overrides. |
| **Exceptions** | Single-developer projects or CI-only configurations where local overrides are never needed. |
| **Consequences Of Violation** | Developers accidentally commit local debugging configuration. CI breaks because local DB credentials are in version control. |
