# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Architecture Testing
**Knowledge Unit:** Architecture Presets
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Combine Presets with Project-Specific Rules
- [ ] Apply rule: Start with `security` + `laravel` Presets for New Projects
- [ ] Apply rule: Use `targeting()` for Progressive Adoption on Existing Projects
- [ ] Apply rule: Read Preset Source Before Combining Presets
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Laravel preset is applied to enforce framework conventions
- [ ] Security preset catches `dd()`, `env()`, and `var_dump()` in application code
- [ ] Custom rules enforce project-specific naming and structure
- [ ] Exceptions are documented for valid deviations
- [ ] Architecture tests run in CI and block non-compliant PRs
- [ ] Avoid: Mistake
- [ ] Avoid: Applying strict preset to entire legacy codebase
- [ ] Avoid: Not maintaining exception lists

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Preset ordering**: Apply the most restrictive preset last. If presets conflict, the last-applied takes precedence for overlapping rules.
- **Placement in CI**: Run architecture presets in the lint/static analysis stage, not the test stage. They fail fast and have no database dependency.
- **Documentation**: Document which presets are in use and what each rule enforces. New team members should run `./vendor/bin/pest --arch` to verify setup.
- **Version management**: When upgrading Pest, review preset changelogs. New versions may add or remove rules.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Combine Presets with Project-Specific Rules
- [ ] Follow rule: Start with `security` + `laravel` Presets for New Projects
- [ ] Follow rule: Use `targeting()` for Progressive Adoption on Existing Projects
- [ ] Follow rule: Read Preset Source Before Combining Presets
- [ ] Follow rule: Maintain a Baseline File for Known Violations
- [ ] Follow rule: Run Architecture Presets in CI Lint Stage, Not Test Stage
- [ ] - [ ] Laravel preset is applied to enforce framework conventions
- [ ] - [ ] Security preset catches `dd()`, `env()`, and `var_dump()` in application code
- [ ] - [ ] Custom rules enforce project-specific naming and structure
- [ ] - [ ] Exceptions are documented for valid deviations

# Performance Checklist
- Preset evaluation: ~5-20ms per preset (bounded by file scanning).
- Combined presets do not re-scan files â€” expectations are evaluated in a single pass.
- Security preset is fastest (checks function calls only). Strict preset is slower (parses type declarations).
- Custom expectations combined with presets add negligible overhead.

# Security Checklist
- The `security` preset is the most security-relevant: it blocks debug functions (`dd`, `dump`, `var_dump`, `ray`), dangerous functions (`eval`, `exec`, `system`, `passthru`, `shell_exec`, `sleep`, `exit`), and raw SQL string concatenation patterns.
- Security preset enforcement in CI prevents accidental exposure of sensitive information through debug functions in production.
- Presets cannot catch all security vulnerabilities (SQL injection through Eloquent, XSS through unsanitized output). Use in conjunction with security audit tools and secure coding practices.

# Reliability Checklist
- [ ] Ensure: Pest architecture presets provide pre-configured sets of architectural expectati...
- [ ] Verify: Always Combine Presets with Project-Specific Rules
- [ ] Verify: Start with `security` + `laravel` Presets for New Projects
- [ ] Verify: Use `targeting()` for Progressive Adoption on Existing Projects
- [ ] Verify: Read Preset Source Before Combining Presets

# Testing Checklist
- [ ] Laravel preset is applied to enforce framework conventions
- [ ] Security preset catches `dd()`, `env()`, and `var_dump()` in application code
- [ ] Custom rules enforce project-specific naming and structure
- [ ] Exceptions are documented for valid deviations
- [ ] Architecture tests run in CI and block non-compliant PRs
- [ ] Rules are reviewed quarterly for relevance
- [ ] Avoid: Mistake
- [ ] Avoid: Applying strict preset to entire legacy codebase
- [ ] Avoid: Not maintaining exception lists

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Combine Presets with Project-Specific Rules
- [ ] Apply: Start with `security` + `laravel` Presets for New Projects
- [ ] Apply: Use `targeting()` for Progressive Adoption on Existing Projects
- [ ] Apply: Read Preset Source Before Combining Presets

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Applying strict preset to entire legacy codebase
- [ ] Avoid mistake: Not maintaining exception lists
- [ ] Avoid mistake: Duplicating preset rules in custom expectations
- [ ] Avoid mistake: Confusing preset strictness levels

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
- Always Combine Presets with Project-Specific Rules
- Start with `security` + `laravel` Presets for New Projects
- Use `targeting()` for Progressive Adoption on Existing Projects
- Read Preset Source Before Combining Presets
- Maintain a Baseline File for Known Violations
- Run Architecture Presets in CI Lint Stage, Not Test Stage
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Define and Enforce Architecture Rules with Presets


