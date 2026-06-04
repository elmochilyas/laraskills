# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** PHPUnit Compatibility & Migration Paths
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Keep `phpunit.xml` as the single source of truth for test suite configuration
- [ ] Apply rule: Migrate test files one at a time, never in a big-bang migration
- [ ] Apply rule: Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed
- [ ] Apply rule: Never mix Pest syntax and PHPUnit class syntax in the same file
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Migrated file uses consistent Pest syntax (no mixing with PHPUnit class methods)
- [ ] `test()` used for `$this` access, `it()` for pure assertions
- [ ] `@depends` annotations use `test()` closures, not `it()`
- [ ] `phpunit.xml` remains the single source of truth for env config
- [ ] Both `*Test.php` and `*.test.php` files still run in CI
- [ ] Avoid: Assuming Pest is a separate framework
- [ ] Avoid: Migrating all at once
- [ ] Avoid: Using `it()` when `@depends` compatibility is needed

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **File detection**: Pest files use `*.test.php` extension. PHPUnit files use `*Test.php`. Both are autodiscovered.
- **Configuration inheritance**: `phpunit.xml` (global) â†’ `pest.php` (Pest-specific) â†’ per-file `uses()` (file-level).
- **Transpilation caching**: Transpiled PHPUnit classes are cached in a runtime directory. Cache key is file content hash.
- **Migration order**: Start with non-critical test files. Migrate feature tests before unit tests. Leave complex data providers for last.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Keep `phpunit.xml` as the single source of truth for test suite configuration
- [ ] Follow rule: Migrate test files one at a time, never in a big-bang migration
- [ ] Follow rule: Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed
- [ ] Follow rule: Never mix Pest syntax and PHPUnit class syntax in the same file
- [ ] Follow rule: Run both framework syntaxes in CI during active migration
- [ ] Follow rule: Use `pest-plugin-migrate` for automated conversion but review every file
- [ ] - [ ] Migrated file uses consistent Pest syntax (no mixing with PHPUnit class methods)
- [ ] - [ ] `test()` used for `$this` access, `it()` for pure assertions
- [ ] - [ ] `@depends` annotations use `test()` closures, not `it()`
- [ ] - [ ] `phpunit.xml` remains the single source of truth for env config

# Performance Checklist
- **Transpilation cache**: Cold cache adds ~20-50ms per file. CI pipelines should warm the cache or ignore the overhead.
- **No runtime overhead**: Transpiled code executes at native PHPUnit speeds. Pest introduces zero runtime overhead.
- **Memory**: Transpilation creates cached PHP files on disk plus in-memory representations. Negligible (<1MB per file).
- **Parallel compatibility**: Pest's parallel mode uses identical Paratest infrastructure. Performance matches PHPUnit parallel.

# Security Checklist
- **Migration tooling**: Third-party migration tools run with test process permissions. Vet tools before use.
- **Extension compatibility**: Custom PHPUnit extensions may have different behavior in transpiled context. Test extension compatibility.

# Reliability Checklist
- [ ] Ensure: Pest compiles to PHPUnit under the hood. This means all PHPUnit assertions, anno...
- [ ] Verify: Keep `phpunit.xml` as the single source of truth for test suite configuration
- [ ] Verify: Migrate test files one at a time, never in a big-bang migration
- [ ] Verify: Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed
- [ ] Verify: Never mix Pest syntax and PHPUnit class syntax in the same file

# Testing Checklist
- [ ] Migrated file uses consistent Pest syntax (no mixing with PHPUnit class methods)
- [ ] `test()` used for `$this` access, `it()` for pure assertions
- [ ] `@depends` annotations use `test()` closures, not `it()`
- [ ] `phpunit.xml` remains the single source of truth for env config
- [ ] Both `*Test.php` and `*.test.php` files still run in CI
- [ ] Transpilation cache cleared after migration (`php artisan pest:clear`)
- [ ] Avoid: Assuming Pest is a separate framework
- [ ] Avoid: Migrating all at once
- [ ] Avoid: Using `it()` when `@depends` compatibility is needed

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Keep `phpunit.xml` as the single source of truth for test suite configuration
- [ ] Apply: Migrate test files one at a time, never in a big-bang migration
- [ ] Apply: Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed
- [ ] Apply: Never mix Pest syntax and PHPUnit class syntax in the same file

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Assuming Pest is a separate framework
- [ ] Avoid mistake: Migrating all at once
- [ ] Avoid mistake: Using `it()` when `@depends` compatibility is needed

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Keep `phpunit.xml` as the single source of truth for test suite configuration
- Migrate test files one at a time, never in a big-bang migration
- Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed
- Never mix Pest syntax and PHPUnit class syntax in the same file
- Run both framework syntaxes in CI during active migration
- Use `pest-plugin-migrate` for automated conversion but review every file
- Never rewrite working PHPUnit tests without a clear benefit
- Clear transpilation cache after framework version upgrades
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Migrate PHPUnit Test Files to Pest Syntax


