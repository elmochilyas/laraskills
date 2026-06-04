# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: PHPUnit Compatibility & Migration Paths
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Pest compiles to PHPUnit under the hood. This means all PHPUnit assertions, annotations, and extensions remain accessible from Pest test files. Understanding the compatibility layer is essential for: (1) gradually migrating existing PHPUnit test suites to Pest, (2) using PHPUnit-only features (like `@depends` or custom assertions) from Pest, and (3) debugging Pest failures by understanding the transpiled output. Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.

# Core Concepts
- **Pest → PHPUnit transpilation**: Every Pest file is converted to a PHPUnit TestCase subclass. `it()` blocks become `test*()` methods. Datasets become `@dataProvider` methods.
- **Assertion equivalence**: `expect($a)->toBe($b)` → `assertEquals($a, $b)`. Every Pest expectation maps 1:1 to a PHPUnit assertion. The mapping is documented in Pest's source.
- **Trait compatibility**: `uses(RefreshDatabase::class)` is equivalent to `use RefreshDatabase` in a PHPUnit class—same trait, same behavior.
- **Mixed-mode files**: You cannot mix `it()`/`test()` with PHPUnit class methods in the same file. Either use Pest syntax or PHPUnit class syntax. But different files in the same project can use either.
- **PHPUnit annotations**: All PHPUnit annotations (`@group`, `@depends`, `@dataProvider`, `@testWith`, `@covers`) work in Pest files. Use `test()` closures (not `it()`) to access `$this` for annotation compatibility.
- **Configuration**: Pest reads `phpunit.xml` for PHPUnit configuration. `pest.php` adds Pest-specific configuration. Both files can coexist.

# Mental Models
- **Pest as syntactic sugar**: PHPUnit is the engine; Pest is the ergonomic wrapper. Any PHPUnit feature you know still works.
- **Gradual migration path**: Use the `--parallel` flag with both frameworks. Migrate file by file. Coexistence is first-class.
- **Transpilation as compilation step**: Think of `vendor/bin/pest` as a compiler that runs `vendor/bin/phpunit` underneath. Debug output shows the transpiled PHPUnit class.

# Internal Mechanics
- **`pest.php` configuration**: Registers a `Pest\TestSuite` instance, configures `uses()`, and returns a `Pest\Kernel`. The kernel manages transpilation and delegates execution to PHPUnit.
- **Transpilation process**: For each `.test.php` file, Pest's parser:
  1. Extracts `uses()` calls and `describe()` blocks
  2. Generates a PHPUnit class with `test_*` methods
  3. Maps `it('description')` to `test_description()` method names
  4. Converts datasets to `@dataProvider` annotations
  5. Compiles `expect()` chains to PHPUnit `assert*()` calls
- **Caching**: Transpiled PHPUnit classes are cached in a runtime directory. Cache key is file content hash. Cache miss triggers transpilation.
- **PHPUnit configuration inheritance**: `phpunit.xml` `<php>` settings (environment variables), `<include>` (test file discovery), and `<extensions>` all apply to Pest-run test suites.
- **`@group` annotation**: When added via PHP docblock on a `test()` closure, Pest generates the PHPUnit annotation on the transpiled method. Works with `phpunit --group` and `pest --group`.

# Patterns
- **Pattern: Phased migration**
  - Purpose: Convert PHPUnit test suites to Pest incrementally without breaking CI
  - Benefits: No big-bang rewrite; teams learn Pest gradually
  - Tradeoffs: Mixed codebase until migration complete; developers must know both syntaxes
  - Steps: (1) Install Pest + `pest-plugin-laravel`, (2) migrate one feature directory, (3) move to parallel coexistence, (4) phase out PHPUnit when migration complete

- **Pattern: PHPUnit extension usage from Pest**
  - Purpose: Use PHPUnit extensions (like `@depends` for test ordering) from Pest
  - Benefits: Access PHPUnit ecosystem without leaving Pest syntax
  - Tradeoffs: `@depends` creates hidden test coupling; prefer Pest-only isolation
  - Implementation: Use `test('depends on X', fn($result) => ...)->depends('test_previous')`

- **Pattern: Custom PHPUnit assertion as Pest macro**
  - Purpose: Expose a custom PHPUnit assertion via Pest's expect() chain
  - Benefits: Consistent DSL for team-specific assertions
  - Tradeoffs: Requires PHP extension registration
  - Implementation: `expect()->extend('toBeValidEmail', fn() => $this->toBe(/* assert logic */))`

# Architectural Decisions
- **When to keep PHPUnit**: Teams with mature PHPUnit test suites, custom PHPUnit extensions, or complex `@dataProvider` setups may prefer PHPUnit. Pest adds no speed benefit.
- **When to migrate to Pest**: New teams, new projects, or teams wanting arch/mutation/browser testing benefits. Pest reduces verbosity ~40%.
- **Coexistence strategy**: Keep `phpunit.xml` as the single source of test suite configuration. `pest.php` augments it. Run both with `vendor/bin/pest` (runs Pest + PHPUnit files) or `vendor/bin/phpunit` (PHPUnit files only).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full PHPUnit compatibility | Team must understand both Pest + PHPUnit semantics | Debugging transpilation issues requires PHPUnit knowledge |
| Gradual migration is supported | Mixed codebase for migration duration | Code reviews must handle both syntaxes |
| PHPUnit extensions work unchanged | Some extension hooks may not fire at expected transpilation phase | Test extension compatibility before committing to Pest |
| `@depends` and `@group` annotations work | Annotations are non-obvious in functional Pest syntax | Use Pest-native `->group('name')` for clarity |


# Performance Considerations
- **Transpilation cache**: Cold cache adds ~20-50ms per file. CI pipelines should warm the cache or ignore the overhead.
- **No runtime overhead**: Transpiled code executes at native PHPUnit speeds. Pest introduces zero runtime overhead.
- **Memory**: Transpilation creates cached PHP files on disk plus in-memory representations. Memory impact is negligible (<1MB per file).
- **Parallel compatibility**: Pest's parallel mode uses identical Paratest infrastructure. Performance characteristics match PHPUnit parallel.

# Production Considerations
- **CI compatibility**: All CI runners support Pest. GitHub Actions, GitLab CI, CircleCI, Jenkins all work. Use `vendor/bin/pest` in CI scripts.
- **Coverage tools**: pcov and Xdebug both work with Pest. Coverage reporting format is identical to PHPUnit.
- **Migration tooling**: The `pest-plugin-migrate` tool automates conversion of PHPUnit files to Pest syntax. Accuracy is ~95%; manual review of edge cases needed.
- **PHP version requirements**: Pest 4 requires PHP 8.3+. PHPUnit 12 also requires PHP 8.3+. Laravel 13 ships with PHPUnit 12.

# Common Mistakes
- **Mistake: Assuming Pest is a separate framework**
  - Why: Marketing suggests Pest is independent
  - Why harmful: Teams may think they need to choose one or the other
  - Better: Understand Pest as a layer on PHPUnit. Both can coexist.

- **Mistake: Migrating all at once**
  - Why: Big-bang migration is risky for large test suites
  - Why harmful: One regression blocks the entire migration
  - Better: Migrate file by file, directory by directory, using `pest-plugin-migrate`

- **Mistake: Using `it()` when `@depends` compatibility is needed**
  - Why: `it()` closures don't receive `$this`
  - Why harmful: `@depends` values are injected as method arguments, requiring `$this` access
  - Better: Use `test()` for tests that need `@depends` or other annotation features

# Failure Modes
- **Transpilation cache corruption**: After Pest or PHPUnit version upgrades, transpilation cache may contain stale references. Run `php artisan pest:clear` or delete cache directory.
- **Annotation parsing errors**: Complex PHP docblocks (multiple annotations, inline `@`) may not parse correctly in Pest transpilation. Verify with `pest --debug`.
- **Custom PHPUnit extension hooks**: Extensions that hook into `startTest()` or `endTest()` may fire at transpiled class methods rather than the original Pest functions. Verify extension behavior.
- **`phpunit.xml` path resolution**: If `phpunit.xml` uses relative paths, ensure the working directory is correct when running via Pest. Use absolute paths in CI configuration.

# Ecosystem Usage
- **Laravel core**: Laravel framework tests use PHPUnit directly. Community packages increasingly use Pest. First-party Laravel packages are gradually adopting Pest.
- **Spatie**: Most Spatie packages have migrated to Pest, demonstrating migration patterns in their commit history.
- **Laravel docs**: Official docs show Pest as primary, PHPUnit as secondary pattern.

# Related Knowledge Units
- **Prerequisites**: PHPUnit lifecycle (setUp, tearDown, data providers, test order), Composer autoloading
- **Related Topics**: Pest fundamentals, Test suite profiling, Parallel test execution
- **Advanced Follow-up**: Custom PHPUnit extension development, Pest plugin architecture

# Research Notes
- Pest 4's underlying PHPUnit version is 12.x, which introduced native attributes for test metadata
- The `pest-plugin-migrate` package has ~95% conversion accuracy; manual review needed for edge cases around complex data providers
- Laravel 13 installer generates Pest test files by default, but `--phpunit` flag creates PHPUnit-style files
