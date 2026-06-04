# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Laravel Cloud vs Vapor Cost Comparison
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Model TCO, not just compute cost applied
- [ ] Test Octane on existing Forge/EC2 before Cloud migration applied
- [ ] Use Cloud auto-hibernation for staging environments applied
- [ ] Cloud for everything prevented
- [ ] Vapor lock-in without review prevented
- [ ] Assuming Vapor's Lambda model is cheapest for all workloads prevented
- [ ] Not factoring Vapor's 9x invocation multiplier prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Cloud for new projects and Vapor migrations (recommended by Laravel team 2026)
- [ ] Architecture guideline: Vapor only for existing deep Lambda investments with spiky traffic
- [ ] Architecture guideline: Forge+EC2 for maximum control at extreme scale (>$20K/month)
- [ ] Architecture guideline: Private Cloud for enterprise compliance and dedicated capacity
- [ ] Architecture guideline: Migration path

---

# Implementation Checklist

- [ ] Best practice applied: Model TCO, not just compute cost
- [ ] Best practice applied: Test Octane on existing Forge/EC2 before Cloud migration
- [ ] Best practice applied: Use Cloud auto-hibernation for staging environments
- [ ] Best practice applied: Configure Cloud spending limits before production
- [ ] Best practice applied: Validate migration case studies against your workload pattern
- [ ] Workflow step completed: Inventory current Laravel Cloud Vs Vapor resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Cloud cold start after auto-hibernation
- [ ] Octane on Cloud
- [ ] Cloud container memory should account for Octane worker overhead (50-100MB per idle worker)
- [ ] Monitor auto-hibernation frequency
- [ ] Cloud's auto-scaling adds containers in 30-120 seconds during traffic spikes

---

# Security Checklist

- [ ] Cloud runs on AWS Fargate with AWS-managed infrastructure isolation
- [ ] Vapor runs on Lambda with Lambda's security boundary; each invocation isolated
- [ ] Both support custom domains with SSL/TLS and CloudFront CDN
- [ ] Cloud IAM roles for deployment
- [ ] Cloud environment variables encrypted at rest; Vapor uses Lambda environment variables

---

# Reliability Checklist

- [ ] Mistake prevented: Assuming Vapor's Lambda model is cheapest for all workloads
- [ ] Mistake prevented: Not factoring Vapor's 9x invocation multiplier
- [ ] Mistake prevented: Ignoring Cloud's auto-hibernation for staging
- [ ] Mistake prevented: Not testing Octane compatibility before migration

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
- [ ] Laravel Cloud Vs Vapor configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Cloud for everything
- [ ] Anti-pattern prevented: Vapor lock-in without review
- [ ] Anti-pattern prevented: Rip-and-replace Vapor simultaneous migration
- [ ] Anti-pattern prevented: Ignoring Forge for commodity workloads
- [ ] Common mistake prevented: Assuming Vapor's Lambda model is cheapest for all workloads
- [ ] Common mistake prevented: Not factoring Vapor's 9x invocation multiplier
- [ ] Common mistake prevented: Ignoring Cloud's auto-hibernation for staging
- [ ] Common mistake prevented: Not testing Octane compatibility before migration

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
