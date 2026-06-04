# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Flaky Test Prevention
**Knowledge Unit:** Test Organization Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Group Tests by Feature, Not by Implementation Type
- [ ] Apply rule: Use Descriptive Pest Test Names
- [ ] Apply rule: Use Arrange-Act-Assert with Blank Line Separation
- [ ] Apply rule: Prefer Readable Tests Over DRY Tests
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Tests are organized by feature, not by implementation type
- [ ] Each feature has a dedicated test directory
- [ ] Test files are kept under ~300 lines
- [ ] Test names are descriptive and communicate expected behavior
- [ ] AAA pattern is used with blank line separation
- [ ] Avoid: Mistake
- [ ] Avoid: Organizing tests by implementation type
- [ ] Avoid: Long, unstructured test methods

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Feature vs type organization**: Feature-based for most applications. Type-based only for very large codebases (>1000 tests).
- **File vs describe grouping**: Separate files per sub-feature when a feature has many tests (>50). Use `describe()` blocks for smaller groupings.
- **Test helper location**: `Tests/Helpers/` for shared helpers. Feature-specific helpers in `Tests/Feature/<Feature>/Helpers/`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Group Tests by Feature, Not by Implementation Type
- [ ] Follow rule: Use Descriptive Pest Test Names
- [ ] Follow rule: Use Arrange-Act-Assert with Blank Line Separation
- [ ] Follow rule: Prefer Readable Tests Over DRY Tests
- [ ] Follow rule: Limit Test Files to ~300 Lines
- [ ] - [ ] Tests are organized by feature, not by implementation type
- [ ] - [ ] Each feature has a dedicated test directory
- [ ] - [ ] Test files are kept under ~300 lines
- [ ] - [ ] Test names are descriptive and communicate expected behavior

# Performance Checklist
- Organization does not directly affect execution time. Indirectly: well-organized tests are easier to parallelize (feature-based sharding), easier to identify as flaky, and easier to optimize.
- Feature-based grouping works well with parallel execution. Each feature directory can be a shard.
- Large fixture data in helpers may increase memory. Use lazy loading.

# Security Checklist
- Security-critical tests (auth, permissions) must be easy to find and review. Feature-based organization helps locate them.
- Architecture tests can enforce security conventions: "every protected endpoint must have a guest access test."

# Reliability Checklist
- [ ] Ensure: Test organization patterns define how test files are structured, named, and grou...
- [ ] Verify: Group Tests by Feature, Not by Implementation Type
- [ ] Verify: Use Descriptive Pest Test Names
- [ ] Verify: Use Arrange-Act-Assert with Blank Line Separation
- [ ] Verify: Prefer Readable Tests Over DRY Tests

# Testing Checklist
- [ ] Tests are organized by feature, not by implementation type
- [ ] Each feature has a dedicated test directory
- [ ] Test files are kept under ~300 lines
- [ ] Test names are descriptive and communicate expected behavior
- [ ] AAA pattern is used with blank line separation
- [ ] Declarative factory methods encapsulate complex setup
- [ ] Avoid: Mistake
- [ ] Avoid: Organizing tests by implementation type
- [ ] Avoid: Long, unstructured test methods

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Group Tests by Feature, Not by Implementation Type
- [ ] Apply: Use Descriptive Pest Test Names
- [ ] Apply: Use Arrange-Act-Assert with Blank Line Separation
- [ ] Apply: Prefer Readable Tests Over DRY Tests

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Organizing tests by implementation type
- [ ] Avoid mistake: Long, unstructured test methods
- [ ] Avoid mistake: Mixing AAA sections
- [ ] Avoid mistake: Generic test names

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
- Group Tests by Feature, Not by Implementation Type
- Use Descriptive Pest Test Names
- Use Arrange-Act-Assert with Blank Line Separation
- Prefer Readable Tests Over DRY Tests
- Limit Test Files to ~300 Lines
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Organize Tests for Readability and Maintainability


