# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** VM Sizing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Graviton (m7g/r7g/c7g) instance types selected for new deployments
- [ ] t4g instances used only for burstable/dev workloads (not sustained production)
- [ ] Instance size based on 2-week monitoring data (not guesswork)
- [ ] Horizontal scaling preferred over vertical scaling
- [ ] Right-sizing review conducted quarterly
- [ ] Always choose Graviton applied
- [ ] Right-size with monitoring applied
- [ ] Start small, scale out applied
- [ ] One big instance instead of multiple small prevented
- [ ] x86 default prevented
- [ ] Using t4g for production with sustained load prevented
- [ ] Over-provisioning based on peak prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Web servers
- [ ] Architecture guideline: Queue workers
- [ ] Architecture guideline: Database servers
- [ ] Architecture guideline: Cache nodes
- [ ] Architecture guideline: Dev/staging
- [ ] Architecture guideline: CI/CD runners

---

# Implementation Checklist

- [ ] Best practice applied: Always choose Graviton
- [ ] Best practice applied: Right-size with monitoring
- [ ] Best practice applied: Start small, scale out
- [ ] Best practice applied: Use t4g for burstable workloads
- [ ] Workflow step completed: Inventory current Vm Sizing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Graviton vs x86
- [ ] CPU credits on t4g
- [ ] EBS bandwidth scales with instance size; large instances get more EBS throughput
- [ ] Network bandwidth scales with instance size; consider for high-traffic API servers

---

# Security Checklist

- [ ] Dedicated instances prevent multi-tenant CPU co-residency (compliance requirement)
- [ ] Nitro hypervisor provides hardware-level isolation for all modern instances
- [ ] Instance metadata service (IMDSv2) should be enforced (prevents SSRF-based credential theft)
- [ ] Use instance-level security groups, not just subnets, for fine-grained access control

---

# Reliability Checklist

- [ ] Mistake prevented: Using t4g for production with sustained load
- [ ] Mistake prevented: Over-provisioning based on peak
- [ ] Mistake prevented: Ignoring Graviton

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Graviton (m7g/r7g/c7g) instance types selected for new deployments
- [ ] t4g instances used only for burstable/dev workloads (not sustained production)
- [ ] Instance size based on 2-week monitoring data (not guesswork)
- [ ] Horizontal scaling preferred over vertical scaling
- [ ] Right-sizing review conducted quarterly

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Vm Sizing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: One big instance instead of multiple small
- [ ] Anti-pattern prevented: x86 default
- [ ] Anti-pattern prevented: Sizing for peak without Auto Scaling
- [ ] Common mistake prevented: Using t4g for production with sustained load
- [ ] Common mistake prevented: Over-provisioning based on peak
- [ ] Common mistake prevented: Ignoring Graviton

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Graviton (m7g/r7g/c7g) instance types selected for new deployments
- [ ] Verification passed: t4g instances used only for burstable/dev workloads (not sustained production)
- [ ] Verification passed: Instance size based on 2-week monitoring data (not guesswork)

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
