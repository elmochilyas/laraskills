# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mutation Testing
**Knowledge Unit:** Pest Mutation Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Use `covers()` to Scope Mutation
- [ ] Apply rule: Set Realistic MSI Targets â€” Start at 60%
- [ ] Apply rule: Review Surviving Mutations â€” Don't Just Check the Score
- [ ] Apply rule: Combine `--mutate` with `--filter` for Fast Local Feedback
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Infection is configured for Pest test execution
- [ ] Source directories target application code (not tests, config, or vendor)
- [ ] Pest parallel execution is enabled for faster runs
- [ ] Mutators are tuned to avoid Pest-specific false positives
- [ ] Mutation score is tracked and trended over time
- [ ] Avoid: Mistake
- [ ] Avoid: Running `--mutate` without `covers()`
- [ ] Avoid: Setting `--min` too high initially

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Pest mutation vs Infection**: Pest mutation for developer-local use and CI on critical paths. Infection for comprehensive pre-release analysis.
- **`covers()` vs `mutates()`**: Use `covers()` for standard mappings. Use `mutates()` when a test exercises a class but cares about a different class's mutation.
- **MSI threshold**: 60-70% for initial adoption. 80%+ for well-tested critical paths.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Use `covers()` to Scope Mutation
- [ ] Follow rule: Set Realistic MSI Targets â€” Start at 60%
- [ ] Follow rule: Review Surviving Mutations â€” Don't Just Check the Score
- [ ] Follow rule: Combine `--mutate` with `--filter` for Fast Local Feedback
- [ ] Follow rule: Target Mutation on Service and Action Classes First
- [ ] Follow rule: Prefer Pest Mutation Before Adopting Infection
- [ ] - [ ] Infection is configured for Pest test execution
- [ ] - [ ] Source directories target application code (not tests, config, or vendor)
- [ ] - [ ] Pest parallel execution is enabled for faster runs
- [ ] - [ ] Mutators are tuned to avoid Pest-specific false positives

# Performance Checklist
- Without `covers()`: mutation time = full suite time Ã— number of mutations. Impractical.
- With `covers()`: mutation time = 1-5 minutes for targeted mutation.
- Coverage collection adds pcov overhead (20-40%) on initial run.
- Sequential execution only (no parallel mutation in Pest).

# Security Checklist
- Mutation testing on security-critical code (auth, permissions, validation) should be targeted first. A surviving mutation in these areas represents a real security risk.

# Reliability Checklist
- [ ] Ensure: Pest's built-in mutation testing evaluates test suite quality by introducing fau...
- [ ] Verify: Always Use `covers()` to Scope Mutation
- [ ] Verify: Set Realistic MSI Targets â€” Start at 60%
- [ ] Verify: Review Surviving Mutations â€” Don't Just Check the Score
- [ ] Verify: Combine `--mutate` with `--filter` for Fast Local Feedback

# Testing Checklist
- [ ] Infection is configured for Pest test execution
- [ ] Source directories target application code (not tests, config, or vendor)
- [ ] Pest parallel execution is enabled for faster runs
- [ ] Mutators are tuned to avoid Pest-specific false positives
- [ ] Mutation score is tracked and trended over time
- [ ] CI runs mutation testing on a scheduled basis (nightly)
- [ ] Avoid: Mistake
- [ ] Avoid: Running `--mutate` without `covers()`
- [ ] Avoid: Setting `--min` too high initially

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Use `covers()` to Scope Mutation
- [ ] Apply: Set Realistic MSI Targets â€” Start at 60%
- [ ] Apply: Review Surviving Mutations â€” Don't Just Check the Score
- [ ] Apply: Combine `--mutate` with `--filter` for Fast Local Feedback

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Running `--mutate` without `covers()`
- [ ] Avoid mistake: Setting `--min` too high initially
- [ ] Avoid mistake: Not understanding surviving mutations
- [ ] Avoid mistake: Using `covers()` incorrectly

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
- Always Use `covers()` to Scope Mutation
- Set Realistic MSI Targets â€” Start at 60%
- Review Surviving Mutations â€” Don't Just Check the Score
- Combine `--mutate` with `--filter` for Fast Local Feedback
- Target Mutation on Service and Action Classes First
- Prefer Pest Mutation Before Adopting Infection
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Integrate Mutation Testing with Pest


