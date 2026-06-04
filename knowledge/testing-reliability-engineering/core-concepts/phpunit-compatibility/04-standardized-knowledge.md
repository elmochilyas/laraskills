# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Framework & Runner Infrastructure |
| Knowledge Unit | PHPUnit Compatibility & Migration Paths |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHPUnit lifecycle, Composer autoloading |
| Related KUs | Pest fundamentals, Test suite profiling, Parallel test execution |
| Source | domain-analysis.md K002 |

# Overview

Pest compiles to PHPUnit under the hood. This means all PHPUnit assertions, annotations, and extensions remain accessible from Pest test files. Understanding the compatibility layer is essential for: (1) gradually migrating existing PHPUnit test suites to Pest, (2) using PHPUnit-only features (like `@depends` or custom assertions) from Pest, and (3) debugging Pest failures by understanding the transpiled output. Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.

# Core Concepts

- **Pest → PHPUnit transpilation**: Every Pest file is converted to a PHPUnit TestCase subclass. `it()` blocks become `test*()` methods. Datasets become `@dataProvider` methods.
- **Assertion equivalence**: `expect($a)->toBe($b)` → `assertEquals($a, $b)`. Every Pest expectation maps 1:1 to a PHPUnit assertion.
- **Trait compatibility**: `uses(RefreshDatabase::class)` is equivalent to `use RefreshDatabase` in a PHPUnit class.
- **Mixed-mode files**: You cannot mix `it()`/`test()` with PHPUnit class methods in the same file. Different files in the same project can use either.
- **PHPUnit annotations**: All PHPUnit annotations (`@group`, `@depends`, `@dataProvider`, `@covers`) work in Pest files. Use `test()` closures (not `it()`) to access `$this`.
- **Configuration**: Pest reads `phpunit.xml` for PHPUnit configuration. `pest.php` adds Pest-specific configuration.

# When To Use

- Gradually migrating existing PHPUnit test suites to Pest
- Using PHPUnit-only features from Pest (e.g., `@depends`, custom extensions)
- Debugging Pest test failures by understanding transpiled output
- Running mixed PHPUnit + Pest test suites in the same project

# When NOT To Use

- New projects starting with Pest (just use Pest syntax)
- Teams without existing PHPUnit investment
- As an excuse to avoid learning Pest syntax
- When all team members are comfortable with Pest

# Best Practices (WHY)

- **Keep `phpunit.xml` as the single source of truth**: Reason: both PHPUnit and Pest read it. `pest.php` augments but doesn't replace it.
- **Migrate file by file, not all at once**: Reason: big-bang migration is risky. Use `pest-plugin-migrate` for automated conversion (~95% accuracy).
- **Use `test()` for tests needing `@depends` or `$this`**: Reason: `it()` closures don't receive `$this`; annotations require `$this` for method argument injection.
- **Document mixed-mode strategy in team guidelines**: Reason: developers must know when to use which syntax until migration is complete.
- **Run both frameworks in CI during migration**: Reason: ensures no regression during the transition period.

# Architecture Guidelines

- **File detection**: Pest files use `*.test.php` extension. PHPUnit files use `*Test.php`. Both are autodiscovered.
- **Configuration inheritance**: `phpunit.xml` (global) → `pest.php` (Pest-specific) → per-file `uses()` (file-level).
- **Transpilation caching**: Transpiled PHPUnit classes are cached in a runtime directory. Cache key is file content hash.
- **Migration order**: Start with non-critical test files. Migrate feature tests before unit tests. Leave complex data providers for last.

# Performance Considerations

- **Transpilation cache**: Cold cache adds ~20-50ms per file. CI pipelines should warm the cache or ignore the overhead.
- **No runtime overhead**: Transpiled code executes at native PHPUnit speeds. Pest introduces zero runtime overhead.
- **Memory**: Transpilation creates cached PHP files on disk plus in-memory representations. Negligible (<1MB per file).
- **Parallel compatibility**: Pest's parallel mode uses identical Paratest infrastructure. Performance matches PHPUnit parallel.

# Security Considerations

- **Migration tooling**: Third-party migration tools run with test process permissions. Vet tools before use.
- **Extension compatibility**: Custom PHPUnit extensions may have different behavior in transpiled context. Test extension compatibility.

# Common Mistakes

**Mistake: Assuming Pest is a separate framework**
- Description: Treating Pest as independent from PHPUnit
- Cause: Marketing suggests Pest is independent
- Consequence: Teams think they must choose one or the other
- Better: Understand Pest as a layer on PHPUnit. Both can coexist.

**Mistake: Migrating all at once**
- Description: Big-bang migration of the entire test suite
- Cause: Want to complete migration quickly
- Consequence: One regression blocks the entire migration
- Better: Migrate file by file, directory by directory.

**Mistake: Using `it()` when `@depends` compatibility is needed**
- Description: Using `it()` for tests that need `@depends` annotation values
- Cause: "it() is the standard Pest function"
- Consequence: `@depends` values require `$this` access
- Better: Use `test()` for tests that need `@depends` or other annotation features.

# Anti-Patterns

- **Rewriting working PHPUnit tests**: If PHPUnit tests are stable and working, leave them. Migrate only when there's a clear benefit.
- **Forcing Pest syntax in legacy projects**: Teams with 1000+ PHPUnit tests should migrate gradually, not rewrite everything.
- **Ignoring transpilation cache issues**: Stale cache causes confusing failures. Run `php artisan pest:clear` after upgrades.

# Examples

**PHPUnit test (original)**
```php
class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_user()
    {
        $user = User::factory()->create();
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }
}
```

**Pest test (migrated)**
```php
uses(RefreshDatabase::class);

test('it creates a user', function () {
    $user = User::factory()->create();
    $this->assertDatabaseHas('users', ['id' => $user->id]);
});
```

**Using @depends from Pest**
```php
test('first', function () {
    return 'result';
});

test('depends on first', function ($result) {
    expect($result)->toBe('result');
})->depends('first');
```

# Related Topics

- Pest fundamentals
- Test suite profiling
- Parallel test execution
- Custom PHPUnit extension development
- Pest plugin architecture

# AI Agent Notes

- When generating code for mixed-mode projects, document which files use Pest syntax and which use PHPUnit syntax.
- The `pest-plugin-migrate` tool converts PHPUnit files to Pest with ~95% accuracy. Recommend it for migration but note manual review is needed.
- For complex PHPUnit features like custom `@dataProvider` methods, verify transpilation behavior before committing to migration.
- Keep `phpunit.xml` as the primary config even in Pest projects for maximum compatibility.

# Verification

- [ ] `phpunit.xml` is the single source of truth for test suite configuration
- [ ] `pest.php` augments but does not duplicate `phpunit.xml` configuration
- [ ] Mixed-mode files use consistent syntax within each file
- [ ] Migration tooling has been tested on a subset before full migration
- [ ] Parallel execution works in mixed-mode projects
- [ ] PHPUnit extensions work correctly in Pest-run test suites
- [ ] Transpilation cache is cleared after framework version upgrades
