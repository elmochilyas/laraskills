# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Vapor Lambda Invocation Multiplier
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Measure your actual Lambda invocation multiplier applied
- [ ] Factor multiplier into all Vapor vs Cloud vs Forge comparisons applied
- [ ] Track per-request cost trending monthly applied
- [ ] Vapor cost calculated on HTTP request count alone prevented
- [ ] Scaling traffic on Vapor without recalculating breakeven prevented
- [ ] Estimating Vapor cost using raw Lambda pricing prevented
- [ ] Not monitoring per-request cost trending prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Bref + custom deployment for Lambda-native Laravel at scale (1x multiplier)
- [ ] Architecture guideline: Cloud (Fargate) for medium-to-high volume (no multiplier, flat container pricing)
- [ ] Architecture guideline: Forge (EC2) for maximum scale with cost optimization (no multiplier, Graviton + Savings Plans)
- [ ] Architecture guideline: Vapor only for small-to-medium deployments where managed convenience justifies premium
- [ ] Architecture guideline: Monitor per-request cost; set alert if it exceeds $0.00005/request

---

# Implementation Checklist

- [ ] Best practice applied: Measure your actual Lambda invocation multiplier
- [ ] Best practice applied: Factor multiplier into all Vapor vs Cloud vs Forge comparisons
- [ ] Best practice applied: Track per-request cost trending monthly
- [ ] Best practice applied: Use Bref as migration intermediate step
- [ ] Best practice applied: Model multi-year cost trajectory
- [ ] Workflow step completed: Inventory current Vapor Lambda Invocation Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] The multiplier doesn't affect raw request latency (all invocations happen in parallel)
- [ ] Queue-heavy apps see higher multipliers due to Lambda-based workers
- [ ] API-only apps may see lower multipliers (~4-5x) if workers are minimal
- [ ] PHP-FPM on Lambda is slower than Octane on Fargate/EC2
- [ ] Deployment frequency adds to monthly invocation count

---

# Security Checklist

- [ ] More Lambda invocations = more functions with IAM roles (larger attack surface)
- [ ] Vapor deployment scripts run with elevated permissions
- [ ] Each Lambda function in the chain is a potential security boundary
- [ ] Monitor for unexpected Lambda invocation patterns (possible abuse via your API)
- [ ] Vapor manages SSL/TLS at CloudFront level centrally

---

# Reliability Checklist

- [ ] Mistake prevented: Estimating Vapor cost using raw Lambda pricing
- [ ] Mistake prevented: Not monitoring per-request cost trending
- [ ] Mistake prevented: Comparing Vapor cost to Fargate without multiplier
- [ ] Mistake prevented: Assuming invocation count matches request count

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Vapor Lambda Invocation Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Vapor cost calculated on HTTP request count alone
- [ ] Anti-pattern prevented: Scaling traffic on Vapor without recalculating breakeven
- [ ] Anti-pattern prevented: Assuming multiplier is fixed
- [ ] Anti-pattern prevented: No cost monitoring per Vapor feature
- [ ] Common mistake prevented: Estimating Vapor cost using raw Lambda pricing
- [ ] Common mistake prevented: Not monitoring per-request cost trending
- [ ] Common mistake prevented: Comparing Vapor cost to Fargate without multiplier
- [ ] Common mistake prevented: Assuming invocation count matches request count

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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
