# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: PHPUnit Configuration
KU Code: ku-01-phpunit-configuration
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
PHPUnit configuration via `phpunit.xml` controls test suite discovery, environment variables, extension loading, and execution parameters. Pest compiles to PHPUnit under the hood, meaning all PHPUnit assertions, annotations, and extensions remain accessible from Pest test files. Understanding PHPUnit configuration is essential for gradually migrating PHPUnit test suites to Pest, using PHPUnit-only features like `@depends` from Pest, and debugging test failures by understanding the transpiled output. Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.

# Core Concepts
- **`phpunit.xml`**: The master configuration file for the test suite. Read by both PHPUnit and Pest. Defines test suites, environment variables, extensions, and filters.
- **Pest to PHPUnit transpilation**: Every Pest file is converted to a PHPUnit TestCase subclass. `it()` blocks become `test*()` methods. Datasets become `@dataProvider` methods.
- **Assertion equivalence**: `expect($a)->toBe($b)` transpiles to `assertEquals($a, $b)`. Every Pest expectation maps to a PHPUnit assertion.
- **Trait compatibility**: `uses(RefreshDatabase::class)` is equivalent to `use RefreshDatabase` in a PHPUnit class.
- **Mixed-mode projects**: You cannot mix `it()`/`test()` with PHPUnit class methods in the same file, but different files can use either syntax.
- **Configuration inheritance**: `phpunit.xml` settings apply to Pest-run suites. `pest.php` adds Pest-specific configuration.

# Mental Models
- **Configuration as contract**: `phpunit.xml` is the contract between the test runner and the test suite. It defines environment, structure, and behavior.
- **Transpilation as compilation**: Think of Pest as a preprocessor that compiles to PHPUnit. What PHPUnit supports, Pest supports. What PHPUnit doesn't, Pest can't either.
- **Layered configuration**: `phpunit.xml` > `.env.testing` > `pest.php` > per-file `uses()`. Each layer adds or overrides settings.

# Internal Mechanics
- `phpunit.xml` is parsed by PHPUnit's XML configuration handler on every test run.
- Pest reads `phpunit.xml` first, then applies `pest.php` overrides.
- Transpilation happens at file loading time. Each `.test.php` file is converted to a PHPUnit test class via AST manipulation.
- The transpilation cache stores converted PHP classes, avoiding re-parsing on subsequent runs.
- Extension registration in `<extensions>` hooks into PHPUnit's lifecycle events.

# Patterns
- **Environment isolation pattern**: Use `<php><env>` in `phpunit.xml` to set test-specific environment variables with highest precedence.
- **Suite organization pattern**: Define separate `<testsuite>` entries for unit, feature, and browser tests to allow targeted execution.
- **Source filtering pattern**: Use `<source><include>` and `<source><exclude>` to scope coverage analysis to application code.
- **Parallel configuration pattern**: Set `<parameters>` for `processes`, `maxBatchSize`, and `slowThreshold` in `phpunit.xml`.

# Architectural Decisions
- **Decision: `phpunit.xml` as single source of truth**: Both PHPUnit and Pest read `phpunit.xml`. `pest.php` augments but doesn't replace it. Ensures configuration consistency across test runners.
- **Decision: Transpilation over interpretation**: Pest converts test files to PHPUnit TestCase classes rather than interpreting them at runtime. Ensures zero runtime overhead and full PHPUnit extension compatibility.
- **Decision: Configuration inheritance hierarchy**: `phpunit.xml <env>` takes precedence over `.env.testing` which takes precedence over `.env`. Ensures CI-specific settings override local defaults.

# Tradeoffs
- **Pest transpilation cache**: Cold cache adds ~20-50ms per file, but warm cache has zero overhead. CI should warm the cache or accept the overhead.
- **Mixed syntax projects**: Cannot mix Pest and PHPUnit syntax in the same file, but different files can use either. Enables gradual migration but requires team discipline.
- **Environment variable precedence**: `phpunit.xml <env>` has highest precedence, which means CI overrides always win. Prevents accidental config leaks but requires understanding of the hierarchy.

# Performance Considerations
- Transpilation: Cold cache adds ~20-50ms per file. CI should warm the cache or accept the overhead.
- No runtime overhead: Transpiled code executes at native PHPUnit speeds. Pest adds zero runtime overhead.
- Configuration parsing: `phpunit.xml` parsing adds ~5-10ms per test run. Negligible.
- Extension overhead: Each extension adds ~1-5ms per test run. Keep extension count minimal.
- Parallel compatibility: Pest's parallel mode uses identical Paratest infrastructure. Same performance characteristics.

# Production Considerations
- Environment variables: Never store secrets in `phpunit.xml`. Use CI secrets or environment variable injection.
- Coverage output: Coverage reports may reveal code structure. Restrict coverage report access in CI.
- Extension code: Custom extensions run with test process permissions. Review extension code for security.
- File permissions: `phpunit.xml` and `phpunit.xml.dist` should be readable by the web server user if exposed. Use `.dist` for defaults.

# Common Mistakes
- **Assuming Pest is a separate framework**: Treating Pest as independent from PHPUnit. Both can coexist in the same project.
- **Missing `APP_ENV=testing` in `phpunit.xml`**: Not setting `APP_ENV=testing` in the `<php>` section causes `.env.testing` not to load.
- **Using `it()` when `@depends` compatibility is needed**: `@depends` values require `$this` access, which `it()` doesn't provide. Use `test()` instead.
- **Config cache collision**: Running `php artisan config:cache` and then running tests. Cached config ignores `.env.testing` overrides.

# Failure Modes
- `APP_ENV` not set to `testing`: Tests may connect to development database or use production services.
- Config cache stale: Cached configuration from a different environment may persist and override test settings.
- Missing test suite configuration: Tests may not be discovered if `<testsuite>` entries are missing or misconfigured.
- Extension errors: A failing PHPUnit extension can break the entire test run.

# Ecosystem Usage
- Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.
- The `pest-plugin-migrate` tool converts PHPUnit files to Pest with approximately 95% accuracy.
- PHPUnit extensions ecosystem includes custom assertions, test listeners, and coverage collectors.
- CI providers (GitHub Actions, GitLab CI) commonly configure `phpunit.xml` environment variables for database credentials.

# Related Knowledge Units
- Pest configuration (pest.php)
- Parallel test execution
- Testing environment management
- Coverage reporting and enforcement
- CI/CD pipeline integration

# Research Notes
- Pest's transpilation approach is unique among PHP testing frameworks. Most alternatives (PHPSpec, Codeception) use runtime interpretation.
- The PHPUnit XML schema has evolved significantly between PHPUnit 10 and 12. Laravel 13 targets PHPUnit 12.
- Community tools like `pest-plugin-migrate` reduce migration friction but edge cases remain in trait usage and data providers.
