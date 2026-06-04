# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Resilience & Chaos Engineering
**Knowledge Unit:** Chaos Experiments with Laravel Bazooka
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never Enable Bazooka in Production Environment
- [ ] Apply rule: Use 1-5% Probability for CI Chaos Experiments
- [ ] Apply rule: Log Every Chaos Injection
- [ ] Apply rule: Mix Disruption Types â€” Don't Only Use Exceptions
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Experiment is designed with a specific fault and scope
- [ ] Success criteria are defined (what should happen)
- [ ] Failure criteria are defined (what should NOT happen)
- [ ] Laravel-specific injection method is identified (middleware, service override, queue)
- [ ] Monitoring is confirmed to detect the injected fault
- [ ] Avoid: Enabling Bazooka in production
- [ ] Avoid: High probability in CI
- [ ] Avoid: Not logging chaos injections

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Configuration file structure**: Place Bazooka config in `config/bazooka.php`. Enable only for `local` and `testing` environments.
- **Chaos point naming**: Use descriptive names for chaos points: `payment-gateway-timeout`, `email-send-latency`. Names appear in logs.
- **Environment gating**: `'enabled' => env('BAZOOKA_ENABLED', false)` and ensure `BAZOOKA_ENABLED` is never set in production.
- **Seed storage**: Store the random seed in CI configuration. Same seed + same code = same chaos behavior.
- **Blast radius per experiment**: One chaos point per experiment initially. Combine only after each point's behavior is understood.
- **Experiment grouping**: Group chaos points by service domain (payments, notifications, auth) for focused experiments.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never Enable Bazooka in Production Environment
- [ ] Follow rule: Use 1-5% Probability for CI Chaos Experiments
- [ ] Follow rule: Log Every Chaos Injection
- [ ] Follow rule: Mix Disruption Types â€” Don't Only Use Exceptions
- [ ] Follow rule: Review Chaos Configuration Quarterly
- [ ] Follow rule: Run Chaos CI as a Separate Scheduled Workflow
- [ ] - [ ] Experiment is designed with a specific fault and scope
- [ ] - [ ] Success criteria are defined (what should happen)
- [ ] - [ ] Failure criteria are defined (what should NOT happen)
- [ ] - [ ] Laravel-specific injection method is identified (middleware, service override, queue)

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Laravel Bazooka is a chaos engineering package that injects controlled disruptio...
- [ ] Verify: Never Enable Bazooka in Production Environment
- [ ] Verify: Use 1-5% Probability for CI Chaos Experiments
- [ ] Verify: Log Every Chaos Injection
- [ ] Verify: Mix Disruption Types â€” Don't Only Use Exceptions

# Testing Checklist
- [ ] Experiment is designed with a specific fault and scope
- [ ] Success criteria are defined (what should happen)
- [ ] Failure criteria are defined (what should NOT happen)
- [ ] Laravel-specific injection method is identified (middleware, service override, queue)
- [ ] Monitoring is confirmed to detect the injected fault
- [ ] Rollback procedure is ready
- [ ] Avoid: Enabling Bazooka in production
- [ ] Avoid: High probability in CI
- [ ] Avoid: Not logging chaos injections

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never Enable Bazooka in Production Environment
- [ ] Apply: Use 1-5% Probability for CI Chaos Experiments
- [ ] Apply: Log Every Chaos Injection
- [ ] Apply: Mix Disruption Types â€” Don't Only Use Exceptions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Enabling Bazooka in production
- [ ] Avoid mistake: High probability in CI
- [ ] Avoid mistake: Not logging chaos injections
- [ ] Avoid mistake: Only testing exception disruptions

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
- Never Enable Bazooka in Production Environment
- Use 1-5% Probability for CI Chaos Experiments
- Log Every Chaos Injection
- Mix Disruption Types â€” Don't Only Use Exceptions
- Review Chaos Configuration Quarterly
- Run Chaos CI as a Separate Scheduled Workflow
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Design and Run Chaos Experiments for Laravel


