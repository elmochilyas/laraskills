# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** Pest Framework Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions
- [ ] Apply rule: Scope `uses()` to specific directories, never use global wildcard
- [ ] Apply rule: Always use named keys in dataset definitions
- [ ] Apply rule: Limit `describe()` nesting to 2 levels maximum
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Correct function choice: `test()` with `$this`, `it()` for pure assertions
- [ ] All dataset keys are named semantically
- [ ] Describe blocks â‰¤ 2 levels of nesting
- [ ] No mixing of Pest and PHPUnit syntax in the same file
- [ ] Multi-step tests use `test()` closures, not higher-order chains
- [ ] Avoid: Using `it()` when `test()` is needed
- [ ] Avoid: Overusing global `uses()` in pest.php
- [ ] Avoid: Untracked dataset keys in failure output

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **File naming**: Pest test files use `*.test.php` extension. PHPUnit files use `*Test.php`. Both can coexist.
- **Configuration layering**: `phpunit.xml` (global) â†’ `pest.php` (Pest-specific) â†’ per-file `uses()` (file-level).
- **Helper organization**: Custom expectations via `expect()->extend()`. Custom helpers via traits. Dataset files in `tests/Datasets/`.
- **Directory structure**: `tests/Unit/`, `tests/Feature/`, `tests/Browser/`, `tests/Architecture/`, `tests/Datasets/`.
- **Test organization**: Group tests by feature, not by type. Use describe blocks for logical grouping within files.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions
- [ ] Follow rule: Scope `uses()` to specific directories, never use global wildcard
- [ ] Follow rule: Always use named keys in dataset definitions
- [ ] Follow rule: Limit `describe()` nesting to 2 levels maximum
- [ ] Follow rule: Extract shared datasets to `tests/Datasets/` files
- [ ] Follow rule: Never mix Pest `it()`/`test()` with PHPUnit class syntax in the same file
- [ ] - [ ] Correct function choice: `test()` with `$this`, `it()` for pure assertions
- [ ] - [ ] All dataset keys are named semantically
- [ ] - [ ] Describe blocks â‰¤ 2 levels of nesting
- [ ] - [ ] No mixing of Pest and PHPUnit syntax in the same file

# Performance Checklist
- **Transpilation overhead**: Pest adds ~20-50ms per test file for transpilation. Not meaningful for CI but noticeable on single-file runs during development.
- **Cache**: Pest caches transpiled files. Cache invalidation is automatic on file change. CI cold starts are marginally slower than raw PHPUnit.
- **Memory**: Higher-order closures have negligible overhead vs PHPUnit methods. Dataset-heavy files have higher memory due to expanded data providers.
- **Parallel overhead**: Pest's parallel mode uses Paratest; same performance characteristics as PHPUnit parallel.
- **Dataset explosion**: Datasets that combine multiple arrays (cartesian product) can generate thousands of test cases. Profile with `--profile` to identify.

# Security Checklist
- **`uses()` scoping**: Wide-scoped `uses()` may import traits unintentionally to test files. Always use `->in()` for directory scoping.
- **Custom expectations**: `expect()->extend()` runs in test context. Ensure macros don't expose testing infrastructure.
- **Pest plugins**: Third-party Pest plugins run with test process permissions. Vet plugins before installation.

# Reliability Checklist
- [ ] Ensure: Pest is the dominant testing framework in the Laravel ecosystem (2026). It wraps...
- [ ] Verify: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions
- [ ] Verify: Scope `uses()` to specific directories, never use global wildcard
- [ ] Verify: Always use named keys in dataset definitions
- [ ] Verify: Limit `describe()` nesting to 2 levels maximum

# Testing Checklist
- [ ] Correct function choice: `test()` with `$this`, `it()` for pure assertions
- [ ] All dataset keys are named semantically
- [ ] Describe blocks â‰¤ 2 levels of nesting
- [ ] No mixing of Pest and PHPUnit syntax in the same file
- [ ] Multi-step tests use `test()` closures, not higher-order chains
- [ ] Shared datasets extracted to `tests/Datasets/` where appropriate
- [ ] Avoid: Using `it()` when `test()` is needed
- [ ] Avoid: Overusing global `uses()` in pest.php
- [ ] Avoid: Untracked dataset keys in failure output

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions
- [ ] Apply: Scope `uses()` to specific directories, never use global wildcard
- [ ] Apply: Always use named keys in dataset definitions
- [ ] Apply: Limit `describe()` nesting to 2 levels maximum

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Using `it()` when `test()` is needed
- [ ] Avoid mistake: Overusing global `uses()` in pest.php
- [ ] Avoid mistake: Untracked dataset keys in failure output
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
- Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions
- Scope `uses()` to specific directories, never use global wildcard
- Always use named keys in dataset definitions
- Limit `describe()` nesting to 2 levels maximum
- Extract shared datasets to `tests/Datasets/` files
- Never mix Pest `it()`/`test()` with PHPUnit class syntax in the same file
- Cache Pest transpilation in CI for cold-start performance
- Prefer `test()` for multi-step tests, higher-order syntax for single assertions
- Document custom `expect()->extend()` helpers in project guidelines
- Use `describe()` blocks for shared setup within a single file
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Write Pest Tests with Correct Syntax and Organization


