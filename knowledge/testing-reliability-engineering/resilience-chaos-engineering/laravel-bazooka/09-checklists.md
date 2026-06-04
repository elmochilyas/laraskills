# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Resilience & Chaos Engineering
**Knowledge Unit:** Laravel Bazooka Chaos Engineering
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never Enable Bazooka in Production
- [ ] Apply rule: Use Seeded Randomness for Reproducibility
- [ ] Apply rule: Use 1-5% Probability in CI, 25-100% Local
- [ ] Apply rule: Log Every Chaos Injection
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Laravel Bazooka is installed and configured
- [ ] Fault scenarios are defined with specific fault types and parameters
- [ ] Conditional triggers are configured (percentage-based or header-based)
- [ ] Bazooka middleware is enabled only for non-production environments
- [ ] Fault scenarios are tested against the application
- [ ] Avoid: Enabling Bazooka in production
- [ ] Avoid: High probability in CI
- [ ] Avoid: Not logging chaos injections

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Environment scoping**: Enable Bazooka only for `local` and `testing`. Never production.
- **Probability levels**: 1-5% for CI, 10-25% for development, 50-100% for targeted experiments.
- **Disruption variety**: Mix disruption types (exceptions, latency, random values, null returns) for comprehensive coverage.
- **Discovery workflow**: Run `php artisan bazooka:discover` to generate initial chaos point configuration.
- **Seed-based reproducibility**: Use fixed random seed in CI to ensure repeatable chaos experiments.
- **Chaos experiment documentation**: Document each experiment's purpose, expected behavior, and known gaps.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never Enable Bazooka in Production
- [ ] Follow rule: Use Seeded Randomness for Reproducibility
- [ ] Follow rule: Use 1-5% Probability in CI, 25-100% Local
- [ ] Follow rule: Log Every Chaos Injection
- [ ] Follow rule: Run Chaos in a Separate CI Job
- [ ] Follow rule: Review Chaos Points Quarterly
- [ ] - [ ] Laravel Bazooka is installed and configured
- [ ] - [ ] Fault scenarios are defined with specific fault types and parameters
- [ ] - [ ] Conditional triggers are configured (percentage-based or header-based)
- [ ] - [ ] Bazooka middleware is enabled only for non-production environments

# Performance Checklist
- **Chaos point check**: <0.1ms per registered chaos point. Negligible overhead when not injecting chaos.
- **Latency injection**: Delays response by configured amount (100ms-5000ms). Significant during chaos experiments.
- **Logging overhead**: ~1ms per chaos injection. Acceptable for testing.
- **No chaos when disabled**: Zero overhead when chaos is disabled for the environment.
- **Discovery mode**: 1-10 seconds depending on codebase size. Runs once to generate configuration.

# Security Checklist
- **Production safety**: Bazooka must never be enabled in production. Use environment detection and CI variable verification.
- **Chaos point discovery**: Discovered chaos points may reveal internal application structure. Review discovered points before committing.
- **Data corruption risk**: Random value disruption may cause data corruption if injected into data-modifying operations. Configure chaos points carefully.
- **Disruption logging**: Chaos injection logs may contain sensitive information. Restrict access to logs.

# Reliability Checklist
- [ ] Ensure: Laravel Bazooka is a chaos engineering package for Laravel that injects controll...
- [ ] Verify: Never Enable Bazooka in Production
- [ ] Verify: Use Seeded Randomness for Reproducibility
- [ ] Verify: Use 1-5% Probability in CI, 25-100% Local
- [ ] Verify: Log Every Chaos Injection

# Testing Checklist
- [ ] Laravel Bazooka is installed and configured
- [ ] Fault scenarios are defined with specific fault types and parameters
- [ ] Conditional triggers are configured (percentage-based or header-based)
- [ ] Bazooka middleware is enabled only for non-production environments
- [ ] Fault scenarios are tested against the application
- [ ] Application handles injected faults correctly
- [ ] Avoid: Enabling Bazooka in production
- [ ] Avoid: High probability in CI
- [ ] Avoid: Not logging chaos injections

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never Enable Bazooka in Production
- [ ] Apply: Use Seeded Randomness for Reproducibility
- [ ] Apply: Use 1-5% Probability in CI, 25-100% Local
- [ ] Apply: Log Every Chaos Injection

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Enabling Bazooka in production
- [ ] Avoid mistake: High probability in CI
- [ ] Avoid mistake: Not logging chaos injections
- [ ] Avoid mistake: Only testing happy-path chaos

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
- Never Enable Bazooka in Production
- Use Seeded Randomness for Reproducibility
- Use 1-5% Probability in CI, 25-100% Local
- Log Every Chaos Injection
- Run Chaos in a Separate CI Job
- Review Chaos Points Quarterly
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Use Laravel Bazooka for Fault Injection Testing


