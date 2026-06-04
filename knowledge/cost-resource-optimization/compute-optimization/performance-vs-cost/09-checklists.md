# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Performance vs Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Performance profile conducted before optimization (Laravel debugbar, Blackfire)
- [ ] Breakeven analysis for Lambda vs EC2/Fargate if applicable
- [ ] Cost per request calculated (<$0.0001 target)
- [ ] Performance budgets defined (p50 < 200ms, p95 < 500ms)
- [ ] OPcache + PHP-FPM tuned as baseline before advanced optimization
- [ ] Measure before optimizing applied
- [ ] Use break-even analysis for compute decisions applied
- [ ] Target the 80/20 rule applied
- [ ] Premium tier for no reason prevented
- [ ] Optimization paralysis prevented
- [ ] Optimizing before measuring prevented
- [ ] Ignoring breakeven points prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Low traffic (<100 req/s)
- [ ] Architecture guideline: Medium traffic (100-1000 req/s)
- [ ] Architecture guideline: High traffic (1000+ req/s)
- [ ] Architecture guideline: Use RIs at scale
- [ ] Architecture guideline: Benchmark before migration

---

# Implementation Checklist

- [ ] Best practice applied: Measure before optimizing
- [ ] Best practice applied: Use break-even analysis for compute decisions
- [ ] Best practice applied: Target the 80/20 rule
- [ ] Best practice applied: Set performance budgets
- [ ] Best practice applied: Calculate cost per request
- [ ] Workflow step completed: Inventory current Performance Vs Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] OPcache
- [ ] PHP-FPM tuning
- [ ] Octane
- [ ] Octane + JIT
- [ ] Lambda
- [ ] EC2 + Octane

---

# Security Checklist

- [ ] Performance optimization should not bypass security controls (e.g., caching authenticated data)
- [ ] Cost optimization should not reduce security budget (WAF, Shield, GuardDuty)
- [ ] Third-party performance services (Blackfire, Tideways) need IAM access; scope appropriately
- [ ] Load testing tooling should not trigger security alarms (whitelist during tests)

---

# Reliability Checklist

- [ ] Mistake prevented: Optimizing before measuring
- [ ] Mistake prevented: Ignoring breakeven points
- [ ] Mistake prevented: Over-engineering for theoretical scale

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Performance profile conducted before optimization (Laravel debugbar, Blackfire)
- [ ] Breakeven analysis for Lambda vs EC2/Fargate if applicable
- [ ] Cost per request calculated (<$0.0001 target)
- [ ] Performance budgets defined (p50 < 200ms, p95 < 500ms)
- [ ] OPcache + PHP-FPM tuned as baseline before advanced optimization
- [ ] 80/20 rule applied (biggest impact changes first)
- [ ] Optimization ROI calculated (savings vs engineering cost)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Performance Vs Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Premium tier for no reason
- [ ] Anti-pattern prevented: Optimization paralysis
- [ ] Anti-pattern prevented: Vanity metrics
- [ ] Anti-pattern prevented: Ignoring operations cost
- [ ] Common mistake prevented: Optimizing before measuring
- [ ] Common mistake prevented: Ignoring breakeven points
- [ ] Common mistake prevented: Over-engineering for theoretical scale

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Performance profile conducted before optimization (Laravel debugbar, Blackfire)
- [ ] Verification passed: Breakeven analysis for Lambda vs EC2/Fargate if applicable
- [ ] Verification passed: Cost per request calculated (<$0.0001 target)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
