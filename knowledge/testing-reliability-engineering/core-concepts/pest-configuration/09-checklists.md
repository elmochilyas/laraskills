# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** Pest Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Scope `uses()` to specific directories, never apply globally
- [ ] Apply rule: Use `test()` when `$this` is needed, `it()` for pure assertions
- [ ] Apply rule: Always name dataset keys semantically for readable failure output
- [ ] Apply rule: Limit `describe()` nesting to 2 levels maximum
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `pest.php` scopes traits to specific directories with `->in()`
- [ ] `uses(Tests\TestCase::class)` applied only to feature tests
- [ ] No global `uses()` with wildcard patterns
- [ ] `it()` used only for pure assertions without `$this`
- [ ] `test()` used for tests requiring TestCase methods
- [ ] Avoid: Using `it()` when `test()` is needed
- [ ] Avoid: Global `uses()` in `pest.php`
- [ ] Avoid: Untracked dataset key names

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **File naming**: Pest test files use `*.test.php` extension. PHPUnit files use `*Test.php`. Both can coexist.
- **`pest.php` location**: Project root, alongside `phpunit.xml`. Returns `Pest\TestSuite` configuration.
- **Configuration layering**: `phpunit.xml` (global) â†’ `pest.php` (Pest-specific) â†’ per-file `uses()` (file-level).
- **Helper organization**: Custom expectations via `expect()->extend()`. Custom helpers via traits. Dataset files in `tests/Datasets/`.
- **Directory structure**: `tests/Unit/`, `tests/Feature/`, `tests/Browser/`, `tests/Architecture/`, `tests/Datasets/`.
- **Dataset files**: Store reusable datasets in `tests/Datasets/` as PHP files returning arrays.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Scope `uses()` to specific directories, never apply globally
- [ ] Follow rule: Use `test()` when `$this` is needed, `it()` for pure assertions
- [ ] Follow rule: Always name dataset keys semantically for readable failure output
- [ ] Follow rule: Limit `describe()` nesting to 2 levels maximum
- [ ] Follow rule: Extract reusable datasets to `tests/Datasets/` files
- [ ] Follow rule: Prefer `test()` over higher-order syntax for tests with more than 2-3 lines
- [ ] - [ ] `pest.php` scopes traits to specific directories with `->in()`
- [ ] - [ ] `uses(Tests\TestCase::class)` applied only to feature tests
- [ ] - [ ] No global `uses()` with wildcard patterns
- [ ] - [ ] `it()` used only for pure assertions without `$this`

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Pest is the dominant testing framework in the Laravel ecosystem (2026). It wraps...
- [ ] Verify: Scope `uses()` to specific directories, never apply globally
- [ ] Verify: Use `test()` when `$this` is needed, `it()` for pure assertions
- [ ] Verify: Always name dataset keys semantically for readable failure output
- [ ] Verify: Limit `describe()` nesting to 2 levels maximum

# Testing Checklist
- [ ] `pest.php` scopes traits to specific directories with `->in()`
- [ ] `uses(Tests\TestCase::class)` applied only to feature tests
- [ ] No global `uses()` with wildcard patterns
- [ ] `it()` used only for pure assertions without `$this`
- [ ] `test()` used for tests requiring TestCase methods
- [ ] Dataset keys are named semantically
- [ ] Avoid: Using `it()` when `test()` is needed
- [ ] Avoid: Global `uses()` in `pest.php`
- [ ] Avoid: Untracked dataset key names

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Scope `uses()` to specific directories, never apply globally
- [ ] Apply: Use `test()` when `$this` is needed, `it()` for pure assertions
- [ ] Apply: Always name dataset keys semantically for readable failure output
- [ ] Apply: Limit `describe()` nesting to 2 levels maximum

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Using `it()` when `test()` is needed
- [ ] Avoid mistake: Global `uses()` in `pest.php`
- [ ] Avoid mistake: Untracked dataset key names
- [ ] Avoid mistake: Complex closures in higher-order tests

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
- Scope `uses()` to specific directories, never apply globally
- Use `test()` when `$this` is needed, `it()` for pure assertions
- Always name dataset keys semantically for readable failure output
- Limit `describe()` nesting to 2 levels maximum
- Extract reusable datasets to `tests/Datasets/` files
- Prefer `test()` over higher-order syntax for tests with more than 2-3 lines
- Never mix `it()`, `test()`, and PHPUnit class syntax in the same file
- Cache transpilation output in CI for faster cold starts
- Document custom expectations and helpers in team guidelines
- Use `pest.php` only for Pest-specific configuration, not environment variables
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Pest Test Suite


