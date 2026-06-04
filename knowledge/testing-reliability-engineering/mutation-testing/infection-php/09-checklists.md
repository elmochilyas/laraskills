# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mutation Testing
**Knowledge Unit:** Infection PHP Mutation Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use Differential Mutation for CI Gates, Full Mutation for Nightly
- [ ] Apply rule: Always Use Coverage Optimization
- [ ] Apply rule: Set Achievable MSI Targets â€” Start at 60-70%
- [ ] Apply rule: Use Infection Baseline for Known Acceptable Survivors
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Infection is configured with correct source directories
- [ ] MSI threshold is set (80% recommended for production apps)
- [ ] Covered MSI threshold is set (90% for tested code)
- [ ] Mutators are configured (enable relevant, disable noisy ones)
- [ ] Infection report is reviewed for escaped mutants
- [ ] Avoid: Mistake
- [ ] Avoid: Running full mutation on every PR
- [ ] Avoid: Using Infection without coverage optimization

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Infection vs Pest mutation**: Infection for comprehensive analysis (CI gates, release quality). Pest mutation for quick local feedback.
- **Full vs differential**: Full mutation for pre-release and scheduled nightly runs. Differential mutation for per-commit CI.
- **MSI configuration**: Overall MSI `--min-msi=60`, covered MSI `--min-covered-msi=70`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use Differential Mutation for CI Gates, Full Mutation for Nightly
- [ ] Follow rule: Always Use Coverage Optimization
- [ ] Follow rule: Set Achievable MSI Targets â€” Start at 60-70%
- [ ] Follow rule: Use Infection Baseline for Known Acceptable Survivors
- [ ] Follow rule: Set Per-Module MSI Targets
- [ ] Follow rule: Review Surviving Mutations as a Team
- [ ] - [ ] Infection is configured with correct source directories
- [ ] - [ ] MSI threshold is set (80% recommended for production apps)
- [ ] - [ ] Covered MSI threshold is set (90% for tested code)
- [ ] - [ ] Mutators are configured (enable relevant, disable noisy ones)

# Performance Checklist
- Initial coverage collection: same time as running tests with coverage (pcov).
- Per-mutation test execution: ~100-500ms per mutation (coverage-guided, only relevant tests).
- Total mutation time: For 1000 mutations at 200ms each = ~200s + initial coverage.
- Parallel execution: `--threads=4` reduces by ~3.5x.
- Differential mutation: 1-5 minutes. Fast enough for CI.
- Memory: 100-500MB RAM for large codebases.

# Security Checklist
- Mutation testing on security-critical code (auth, encryption, validation) is essential. A surviving mutation in auth logic could mean a missing test for an auth bypass vulnerability.
- Ensure mutation test reports are not publicly accessible (they reveal internal code logic).

# Reliability Checklist
- [ ] Ensure: Infection PHP is a standalone mutation testing framework for PHP projects that e...
- [ ] Verify: Use Differential Mutation for CI Gates, Full Mutation for Nightly
- [ ] Verify: Always Use Coverage Optimization
- [ ] Verify: Set Achievable MSI Targets â€” Start at 60-70%
- [ ] Verify: Use Infection Baseline for Known Acceptable Survivors

# Testing Checklist
- [ ] Infection is configured with correct source directories
- [ ] MSI threshold is set (80% recommended for production apps)
- [ ] Covered MSI threshold is set (90% for tested code)
- [ ] Mutators are configured (enable relevant, disable noisy ones)
- [ ] Infection report is reviewed for escaped mutants
- [ ] New tests are written for escaped mutants
- [ ] Avoid: Mistake
- [ ] Avoid: Running full mutation on every PR
- [ ] Avoid: Using Infection without coverage optimization

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use Differential Mutation for CI Gates, Full Mutation for Nightly
- [ ] Apply: Always Use Coverage Optimization
- [ ] Apply: Set Achievable MSI Targets â€” Start at 60-70%
- [ ] Apply: Use Infection Baseline for Known Acceptable Survivors

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Running full mutation on every PR
- [ ] Avoid mistake: Using Infection without coverage optimization
- [ ] Avoid mistake: Setting unrealistically high MSI targets
- [ ] Avoid mistake: Ignoring uncovered code mutations

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
- Use Differential Mutation for CI Gates, Full Mutation for Nightly
- Always Use Coverage Optimization
- Set Achievable MSI Targets â€” Start at 60-70%
- Use Infection Baseline for Known Acceptable Survivors
- Set Per-Module MSI Targets
- Review Surviving Mutations as a Team
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Run Mutation Tests with Infection PHP


