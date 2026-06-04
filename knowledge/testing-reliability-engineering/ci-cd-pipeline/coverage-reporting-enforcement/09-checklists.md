# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** Coverage Reporting & Enforcement
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use pcov, Never Xdebug, for CI Coverage
- [ ] Apply rule: Set `--min` at 70-80%, Never 100%
- [ ] Apply rule: Run Coverage Only in CI, Never Locally During TDD
- [ ] Apply rule: Combine Coverage with Mutation Testing for Quality Insight
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Coverage driver (PCOV/Xdebug) is installed and configured
- [ ] Minimum coverage threshold is set and enforced in CI
- [ ] Coverage reports are generated and stored as CI artifacts
- [ ] Coverage trends are tracked over time
- [ ] Per-module thresholds are configured if needed
- [ ] Avoid: Mistake
- [ ] Avoid: Setting 100% coverage requirement
- [ ] Avoid: Running coverage locally during TDD

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **pcov vs Xdebug**: pcov always preferred for coverage-only use. Xdebug only when step debugging is also needed.
- **Format selection**: HTML for visual browsing (CI artifact), Clover for CI platform integration (SonarQube, GitLab), text for terminal output.
- **Coverage in CI**: Run full coverage in CI only. Too slow for local TDD.
- **Coverage merging for parallel tests**: Each parallel worker computes its own coverage. Use Pest's built-in merging or PHPUnit's `--coverage-php` for coalesced cache.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use pcov, Never Xdebug, for CI Coverage
- [ ] Follow rule: Set `--min` at 70-80%, Never 100%
- [ ] Follow rule: Run Coverage Only in CI, Never Locally During TDD
- [ ] Follow rule: Combine Coverage with Mutation Testing for Quality Insight
- [ ] Follow rule: Use Baseline for Existing Projects â€” Raise Threshold Gradually
- [ ] Follow rule: Store Coverage Reports as CI Artifacts
- [ ] - [ ] Coverage driver (PCOV/Xdebug) is installed and configured
- [ ] - [ ] Minimum coverage threshold is set and enforced in CI
- [ ] - [ ] Coverage reports are generated and stored as CI artifacts
- [ ] - [ ] Coverage trends are tracked over time

# Performance Checklist
- pcov overhead: 20-40% test time increase. Xdebug: 200-500%.
- Coverage without `--min` is the same speed as with `--min` (computation is post-processing).
- HTML report generation: 1-5 seconds for moderate codebases (10-50k LOC).
- Coverage caching: Pest caches coverage data between runs when using `--cache` flag.

# Security Checklist
- Coverage reports reveal code structure and execution paths. Restrict access to CI artifacts.
- Do not upload coverage reports to publicly accessible storage.
- Coverage data may contain file paths that reveal server configuration. Sanitize before sharing.

# Reliability Checklist
- [ ] Ensure: Coverage reporting and enforcement in Laravel measures what percentage of code i...
- [ ] Verify: Use pcov, Never Xdebug, for CI Coverage
- [ ] Verify: Set `--min` at 70-80%, Never 100%
- [ ] Verify: Run Coverage Only in CI, Never Locally During TDD
- [ ] Verify: Combine Coverage with Mutation Testing for Quality Insight

# Testing Checklist
- [ ] Coverage driver (PCOV/Xdebug) is installed and configured
- [ ] Minimum coverage threshold is set and enforced in CI
- [ ] Coverage reports are generated and stored as CI artifacts
- [ ] Coverage trends are tracked over time
- [ ] Per-module thresholds are configured if needed
- [ ] CI blocks PRs that decrease coverage below threshold
- [ ] Avoid: Mistake
- [ ] Avoid: Setting 100% coverage requirement
- [ ] Avoid: Running coverage locally during TDD

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use pcov, Never Xdebug, for CI Coverage
- [ ] Apply: Set `--min` at 70-80%, Never 100%
- [ ] Apply: Run Coverage Only in CI, Never Locally During TDD
- [ ] Apply: Combine Coverage with Mutation Testing for Quality Insight

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Setting 100% coverage requirement
- [ ] Avoid mistake: Running coverage locally during TDD
- [ ] Avoid mistake: Using Xdebug for CI coverage
- [ ] Avoid mistake: Ignoring uncovered code in reports

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
- Use pcov, Never Xdebug, for CI Coverage
- Set `--min` at 70-80%, Never 100%
- Run Coverage Only in CI, Never Locally During TDD
- Combine Coverage with Mutation Testing for Quality Insight
- Use Baseline for Existing Projects â€” Raise Threshold Gradually
- Store Coverage Reports as CI Artifacts
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Enforce Code Coverage Thresholds in CI


