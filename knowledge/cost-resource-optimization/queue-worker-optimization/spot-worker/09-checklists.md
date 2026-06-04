# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Spot Worker
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Queue workers use Spot instances (EC2 or Fargate)
- [ ] Graceful shutdown handler implemented
- [ ] Mixed instances policy (70/30 Spot/On-Demand)
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] SQS visibility timeout configured for interruption
- [ ] Use Spot for ALL queue workers applied
- [ ] Implement graceful shutdown handler applied
- [ ] Use mixed instances policy applied
- [ ] Spot for databases prevented
- [ ] Spot without monitoring prevented
- [ ] No graceful shutdown handler prevented
- [ ] Single instance type for Spot prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker ASG
- [ ] Architecture guideline: Instance types
- [ ] Architecture guideline: AZs
- [ ] Architecture guideline: Lifecycle hook
- [ ] Architecture guideline: SQS visibility timeout
- [ ] Architecture guideline: Spot rebalance recommendation
- [ ] Architecture guideline: Fargate Spot

---

# Implementation Checklist

- [ ] Best practice applied: Use Spot for ALL queue workers
- [ ] Best practice applied: Implement graceful shutdown handler
- [ ] Best practice applied: Use mixed instances policy
- [ ] Best practice applied: Diversify instance types
- [ ] Best practice applied: Set Spot interruption handler for long jobs
- [ ] Best practice applied: Monitor Spot interruption rate
- [ ] Workflow step completed: Inventory current Spot Worker resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Spot instance performance identical to On-Demand (same hardware)
- [ ] Interruption rate
- [ ] Interruption notice time
- [ ] Chunked jobs
- [ ] Fargate Spot interruption

---

# Security Checklist

- [ ] Spot instances share hypervisor but are isolated via Nitro (no co-residency access)
- [ ] Termination notification instance metadata
- [ ] Workers should not hold sensitive data in memory across interruptions
- [ ] Instance metadata service v2 (IMDSv2) should be enforced on Spot instances
- [ ] Spot instance logs may not be available after termination (ship logs in real-time)

---

# Reliability Checklist

- [ ] Mistake prevented: No graceful shutdown handler
- [ ] Mistake prevented: Single instance type for Spot
- [ ] Mistake prevented: 100% Spot without On-Demand fallback
- [ ] Mistake prevented: Not testing interruption handling

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Queue workers use Spot instances (EC2 or Fargate)
- [ ] Graceful shutdown handler implemented
- [ ] Mixed instances policy (70/30 Spot/On-Demand)
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] SQS visibility timeout configured for interruption
- [ ] Interruption rate monitored (< 5% target)
- [ ] Fargate Spot considered for containerized workers

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Spot Worker configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Spot for databases
- [ ] Anti-pattern prevented: Spot without monitoring
- [ ] Anti-pattern prevented: Manual Spot request management
- [ ] Anti-pattern prevented: Ignoring Fargate Spot
- [ ] Common mistake prevented: No graceful shutdown handler
- [ ] Common mistake prevented: Single instance type for Spot
- [ ] Common mistake prevented: 100% Spot without On-Demand fallback
- [ ] Common mistake prevented: Not testing interruption handling

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Queue workers use Spot instances (EC2 or Fargate)
- [ ] Verification passed: Graceful shutdown handler implemented
- [ ] Verification passed: Mixed instances policy (70/30 Spot/On-Demand)

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
