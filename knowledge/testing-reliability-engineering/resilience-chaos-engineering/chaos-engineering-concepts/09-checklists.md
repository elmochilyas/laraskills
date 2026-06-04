# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Resilience & Chaos Engineering
**Knowledge Unit:** Chaos Engineering Concepts
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Start with Deterministic Fault Injection Before Probability-Based Chaos
- [ ] Apply rule: State a Clear Hypothesis Before Every Chaos Experiment
- [ ] Apply rule: Inject One Fault Per Experiment
- [ ] Apply rule: Run Chaos Experiments in a Separate CI Stage
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Steady-state metrics are documented before the experiment
- [ ] Hypothesis is clearly stated (if X fails, Y should happen)
- [ ] Blast radius is defined and bounded
- [ ] Rollback triggers are identified and monitored
- [ ] Experiment duration is limited
- [ ] Avoid: No hypothesis before experiment
- [ ] Avoid: One experiment testing everything
- [ ] Avoid: No steady-state measurement

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Service decoration layer**: Chaos tools decorate container-managed services. Ensure all external-facing services are bound to the container as interfaces.
- **Environment gating**: Chaos experiments must be environment-aware. Never enable in production. Use `APP_ENV` checks and CI variable verification.
- **Fault scope isolation**: Each test should activate its own faults and clean up in teardown. Global faults across tests cause unpredictable failures.
- **Monitoring integration**: Chaos experiments should log every injection (what, where, when, result). Logs enable debugging unexpected test failures.
- **Fallback instrumentation**: Fallback code paths should set assertion markers (`$fallbackUsed = true`) that resilience tests can verify.
- **Gradual adoption path**: Start with 1-2 critical services (payment gateway, auth provider), add resilience tests, then expand to all external dependencies.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Start with Deterministic Fault Injection Before Probability-Based Chaos
- [ ] Follow rule: State a Clear Hypothesis Before Every Chaos Experiment
- [ ] Follow rule: Inject One Fault Per Experiment
- [ ] Follow rule: Run Chaos Experiments in a Separate CI Stage
- [ ] Follow rule: Use Fixed Random Seeds for Reproducibility
- [ ] Follow rule: Measure Steady State Before Injecting Chaos
- [ ] - [ ] Steady-state metrics are documented before the experiment
- [ ] - [ ] Hypothesis is clearly stated (if X fails, Y should happen)
- [ ] - [ ] Blast radius is defined and bounded
- [ ] - [ ] Rollback triggers are identified and monitored

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Chaos engineering is the discipline of experimenting on a system to build confid...
- [ ] Verify: Start with Deterministic Fault Injection Before Probability-Based Chaos
- [ ] Verify: State a Clear Hypothesis Before Every Chaos Experiment
- [ ] Verify: Inject One Fault Per Experiment
- [ ] Verify: Run Chaos Experiments in a Separate CI Stage

# Testing Checklist
- [ ] Steady-state metrics are documented before the experiment
- [ ] Hypothesis is clearly stated (if X fails, Y should happen)
- [ ] Blast radius is defined and bounded
- [ ] Rollback triggers are identified and monitored
- [ ] Experiment duration is limited
- [ ] Monitoring is verified to detect the injected fault
- [ ] Avoid: No hypothesis before experiment
- [ ] Avoid: One experiment testing everything
- [ ] Avoid: No steady-state measurement

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Start with Deterministic Fault Injection Before Probability-Based Chaos
- [ ] Apply: State a Clear Hypothesis Before Every Chaos Experiment
- [ ] Apply: Inject One Fault Per Experiment
- [ ] Apply: Run Chaos Experiments in a Separate CI Stage

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: No hypothesis before experiment
- [ ] Avoid mistake: One experiment testing everything
- [ ] Avoid mistake: No steady-state measurement
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
- Start with Deterministic Fault Injection Before Probability-Based Chaos
- State a Clear Hypothesis Before Every Chaos Experiment
- Inject One Fault Per Experiment
- Run Chaos Experiments in a Separate CI Stage
- Use Fixed Random Seeds for Reproducibility
- Measure Steady State Before Injecting Chaos
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Apply Chaos Engineering Concepts to Laravel


