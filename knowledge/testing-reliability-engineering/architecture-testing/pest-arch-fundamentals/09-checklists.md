# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Architecture Testing
**Knowledge Unit:** Pest Architecture Testing Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never Use Architecture Tests for Runtime Behavior Validation
- [ ] Apply rule: Write Expectations as Contracts, Not Individual Checks
- [ ] Apply rule: Start Permissive, Tighten Over Time
- [ ] Apply rule: Place Arch Tests in CI Lint Stage
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Naming conventions are enforced with `toHaveSuffix`, `toHavePrefix`, or matching patterns
- [ ] Inheritance/implementation requirements are enforced
- [ ] Directory structure is verified (classes in wrong directories are flagged)
- [ ] Layer boundaries are enforced (domain doesn't depend on infrastructure)
- [ ] Exceptions are documented and justified
- [ ] Avoid: Mistake
- [ ] Avoid: Using arch tests for runtime behavior
- [ ] Avoid: Overly broad expectations

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Placement**: Store arch tests in `tests/Arch/` or `tests/Architecture/`. Keep separate from feature/unit test files.
- **Integration with CI**: Run in lint stage before static analysis. Fastest feedback loop.
- **Baseline management**: Use Pest's arch() baseline feature for known violations. Commit baseline to repository; update quarterly.
- **Preset combination**: Start with Pest built-in presets (`security`, `laravel`), then add project-specific expectations.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never Use Architecture Tests for Runtime Behavior Validation
- [ ] Follow rule: Write Expectations as Contracts, Not Individual Checks
- [ ] Follow rule: Start Permissive, Tighten Over Time
- [ ] Follow rule: Place Arch Tests in CI Lint Stage
- [ ] Follow rule: Use Namespace Targeting for PSR-4 Code
- [ ] Follow rule: Document Every `ignoring()` Exception
- [ ] - [ ] Naming conventions are enforced with `toHaveSuffix`, `toHavePrefix`, or matching patterns
- [ ] - [ ] Inheritance/implementation requirements are enforced
- [ ] - [ ] Directory structure is verified (classes in wrong directories are flagged)
- [ ] - [ ] Layer boundaries are enforced (domain doesn't depend on infrastructure)

# Performance Checklist
- Arch tests run in 5-50ms per expectation (PHP Parser overhead).
- Large namespace scanning (e.g., whole `app/`) takes 20-100ms depending on file count.
- Combined expectations on the same target share parse results; no redundant parsing.
- No database or application booting necessary â€” fastest test type in the suite.

# Security Checklist
- Architecture tests cannot validate security behaviors (use feature tests for auth, authorization, validation).
- Debug statement detection (`dd`, `dump`, `var_dump`) is a security best practice for preventing information leakage in production.
- Security-enforcing architecture rules (e.g., "no raw SQL concatenation") complement but do not replace security audits.

# Reliability Checklist
- [ ] Ensure: Pest's `arch()` testing enables structural and dependency validation of Laravel ...
- [ ] Verify: Never Use Architecture Tests for Runtime Behavior Validation
- [ ] Verify: Write Expectations as Contracts, Not Individual Checks
- [ ] Verify: Start Permissive, Tighten Over Time
- [ ] Verify: Place Arch Tests in CI Lint Stage

# Testing Checklist
- [ ] Naming conventions are enforced with `toHaveSuffix`, `toHavePrefix`, or matching patterns
- [ ] Inheritance/implementation requirements are enforced
- [ ] Directory structure is verified (classes in wrong directories are flagged)
- [ ] Layer boundaries are enforced (domain doesn't depend on infrastructure)
- [ ] Exceptions are documented and justified
- [ ] Architecture tests are part of CI
- [ ] Avoid: Mistake
- [ ] Avoid: Using arch tests for runtime behavior
- [ ] Avoid: Overly broad expectations

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never Use Architecture Tests for Runtime Behavior Validation
- [ ] Apply: Write Expectations as Contracts, Not Individual Checks
- [ ] Apply: Start Permissive, Tighten Over Time
- [ ] Apply: Place Arch Tests in CI Lint Stage

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using arch tests for runtime behavior
- [ ] Avoid mistake: Overly broad expectations
- [ ] Avoid mistake: Not maintaining ignoring() lists
- [ ] Avoid mistake: Misunderstanding namespace vs directory

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
- Never Use Architecture Tests for Runtime Behavior Validation
- Write Expectations as Contracts, Not Individual Checks
- Start Permissive, Tighten Over Time
- Place Arch Tests in CI Lint Stage
- Use Namespace Targeting for PSR-4 Code
- Document Every `ignoring()` Exception
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Write Pest Architecture Tests for Custom Rules


