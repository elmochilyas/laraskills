# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: PHPUnit Configuration
 KU Code: ku-01-phpunit-configuration
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
PHPUnit configuration via `phpunit.xml` controls test suite discovery, environment variables, extension loading, and execution parameters. Pest compiles to PHPUnit under the hood, meaning all PHPUnit assertions, annotations, and extensions remain accessible from Pest test files. Understanding PHPUnit configuration is essential for gradually migrating PHPUnit test suites to Pest, using PHPUnit-only features (like `@depends`) from Pest, and debugging test failures by understanding the transpiled output. Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.

# Core Concepts
- **`phpunit.xml`**: The master configuration file for the test suite. Read by both PHPUnit and Pest. Defines test suites, environment variables, extensions, and filters.
- **Pest → PHPUnit transpilation**: Every Pest file is converted to a PHPUnit TestCase subclass. `it()` blocks become `test*()` methods. Datasets become `@dataProvider` methods.
- **Assertion equivalence**: `expect($a)->toBe($b)` transpiles to `assertEquals($a, $b)`. Every Pest expectation maps to a PHPUnit assertion.
- **Trait compatibility**: `uses(RefreshDatabase::class)` is equivalent to `use RefreshDatabase` in a PHPUnit class.
- **Mixed-mode projects**: You cannot mix `it()`/`test()` with PHPUnit class methods in the same file, but different files can use either syntax.
- **Configuration inheritance**: `phpunit.xml` settings (env vars, test suites, extensions) apply to Pest-run suites. `pest.php` adds Pest-specific configuration.

# When To Use
- Setting up a new Laravel project's test configuration
- Configuring environment variables for testing (database, mail, queue drivers)
- Registering PHPUnit extensions (custom assertions, test listeners, coverage collectors)
- Configuring parallel execution parameters (worker count, cache directory)
- Defining test suite discovery paths and file inclusions/exclusions
- Setting coverage thresholds and slow test thresholds

# When NOT To Use
- Pest-specific configuration (use `pest.php` for Pest-only options)
- Test-level setup (use `setUp()`, `beforeEach()`, or dataset files)
- Environment secrets (use CI secrets, not committed config files)
- Complex PHPUnit extension development (use a dedicated extension class)

# Best Practices (WHY)
- **Keep `phpunit.xml` as the single source of truth for test suite config**: Reason: both PHPUnit and Pest read it. `pest.php` augments but doesn't replace it.
- **Set `APP_ENV=testing` in `phpunit.xml`**: Reason: ensures `.env.testing` is loaded before `.env`. Prevents accidental production database connections.
- **Use `<php><env>` for environment overrides, not `.env.testing` for everything**: Reason: `phpunit.xml` env vars have the highest precedence. Use them for CI-specific settings.
- **Configure `<source>` for coverage filtering**: Reason: excludes vendor, config, and migrations from coverage reports. Accurate coverage measurement requires proper source configuration.
- **Set `<parameters>` for parallel execution thresholds**: Reason: `processes`, `maxBatchSize`, and `slowThreshold` control parallel test behavior.
- **Use `<extensions>` for custom test hooks**: Reason: PHPUnit extensions hook into `startTest()`, `endTest()`, `beforeFirstTest()`. Useful for custom reporting or setup.
- **Document configuration changes in commit messages**: Reason: configuration changes can have wide-reaching effects on test behavior. Team needs to know what changed and why.

# Architecture Guidelines
- **File structure**: `phpunit.xml` at project root. `pest.php` alongside it for Pest-specific config.
- **Environment variable hierarchy**: `phpunit.xml <env>` > `.env.testing` > `.env`. Highest priority in XML.
- **Test suite organization**: Define `<testsuite>` entries for unit, feature, and other test types. Allows targeted runs.
- **Coverage configuration**: Use `<source><include>` and `<source><exclude>` for accurate coverage. Exclude config, migrations, vendor.
- **Extension registration**: Register custom extensions in `<extensions>`. Extensions are PHP classes implementing PHPUnit extension interfaces.

# Performance
- **Transpilation cache**: Cold cache adds ~20-50ms per file. CI should warm the cache or accept the overhead.
- **No runtime overhead**: Transpiled code executes at native PHPUnit speeds. Pest adds zero runtime overhead.
- **Configuration parsing**: `phpunit.xml` parsing adds ~5-10ms per test run. Negligible.
- **Extension overhead**: Each extension adds ~1-5ms per test run. Keep extension count minimal.
- **Parallel compatibility**: Pest's parallel mode uses identical Paratest infrastructure. Same performance characteristics.

# Security
- **Environment variables**: Never store secrets in `phpunit.xml`. Use CI secrets or environment variable injection.
- **Coverage output**: Coverage reports may reveal code structure. Restrict coverage report access in CI.
- **Extension code**: Custom extensions run with test process permissions. Review extension code for security.
- **File permissions**: `phpunit.xml` and `phpunit.xml.dist` should be readable by the web server user if exposed. Use `.dist` for defaults.

# Common Mistakes

**Mistake: Assuming Pest is a separate framework**
- Description: Treating Pest as independent from PHPUnit
- Cause: "Pest has its own CLI"
- Consequence: Teams think they must choose one or the other
- Better: Understand Pest as a layer on PHPUnit. Both can coexist in the same project.

**Mistake: Missing `APP_ENV=testing` in `phpunit.xml`**
- Description: Not setting `APP_ENV=testing` in the `<php>` section
- Cause: Assuming Laravel auto-detects testing mode
- Consequence: `.env.testing` is not loaded; tests may use development database
- Better: Always set `<env name="APP_ENV" value="testing"/>` in `phpunit.xml`.

**Mistake: Using `it()` when `@depends` compatibility is needed**
- Description: Using `it()` for tests that need `@depends` annotation values
- Cause: "it() is the standard Pest function"
- Consequence: `@depends` values are injected as method arguments requiring `$this` access, which `it()` doesn't provide
- Better: Use `test()` for tests that need `@depends` or other annotation features.

**Mistake: Config cache collision**
- Description: Running `php artisan config:cache` and then running tests
- Cause: "Faster tests with cached config"
- Consequence: Cached config ignores `.env.testing` overrides; tests use wrong environment
- Better: Never run `config:cache` in testing. Use `config:clear` before test runs.

# Anti-Patterns
- **Duplicating config in `phpunit.xml` and `pest.php`**: Keep shared config in `phpunit.xml`. `pest.php` is for Pest-only settings.
- **Committing CI-specific env vars**: CI secrets (DB passwords, API keys) should come from CI environment, not version-controlled config files.
- **Global `uses()` in `pest.php`**: Applying `RefreshDatabase` globally slows unit tests. Scope to feature test directories.
- **Overloaded `<testsuite>` entries**: One massive test suite instead of logical groupings. Define separate suites for unit, feature, browser.

# Examples

**Standard `phpunit.xml` for Laravel**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_STORE" value="array"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
    </php>
</phpunit>
```

**Parallel execution parameters in `phpunit.xml`**
```xml
<phpunit>
    <parameters>
        <parameter name="processes" value="4"/>
        <parameter name="maxBatchSize" value="50"/>
        <parameter name="slowThreshold" value="500"/>
    </parameters>
</phpunit>
```

# Related Topics
- Pest configuration (pest.php)
- Parallel test execution
- Testing environment management
- Coverage reporting and enforcement
- CI/CD pipeline integration

# AI Agent Notes
- When generating `phpunit.xml` configuration, always include `APP_ENV=testing` as the first env variable.
- Use `<source><include>` to scope coverage to `app/` directory. Exclude config, migrations, vendor.
- For parallel configuration, set `processes` to match CI runner CPU count minus 1.
- When generating code for mixed-mode projects, document which files use Pest syntax and which use PHPUnit syntax.
- The `pest-plugin-migrate` tool converts PHPUnit files to Pest with ~95% accuracy. Recommend it for migration but note manual review is needed.
- Never generate `phpunit.xml` with real secrets. Use CI environment variable references.

# Verification
- [ ] `phpunit.xml` sets `APP_ENV=testing` and appropriate test environment variables
- [ ] Test suites are organized into logical groups (Unit, Feature, Browser)
- [ ] Source filtering excludes config, migrations, and vendor from coverage
- [ ] Parallel execution parameters match CI runner capacity
- [ ] Slow test threshold is configured (default 500ms)
- [ ] Environment variables are documented (no secrets in committed config)
- [ ] Both Pest and PHPUnit test files run correctly from the same configuration
- [ ] `config:cache` is never run with `APP_ENV=testing`
