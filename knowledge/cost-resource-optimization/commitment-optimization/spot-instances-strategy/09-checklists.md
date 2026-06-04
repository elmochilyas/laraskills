# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** Spot Instances Strategy
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Spot instances used for fault-tolerant stateless workloads
- [ ] Graceful shutdown handler (SIGTERM) implemented
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] Auto Scaling Group with mixed instances policy
- [ ] On-Demand fallback configured for critical capacity
- [ ] Use Spot for all queue workers applied
- [ ] Implement graceful shutdown handling applied
- [ ] Diversify instance types and AZs applied
- [ ] Default to Spot for All Queue Workers and CI/CD Runners followed
- [ ] Always Pair Spot with On-Demand Fallback or RI Baseline followed
- [ ] Implement SIGTERM Handlers in Laravel Workers followed
- [ ] Spot for databases prevented
- [ ] Single-AZ Spot prevented
- [ ] No interruption handling prevented
- [ ] Single instance type in Spot request prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Queue workers
- [ ] Architecture guideline: Web servers
- [ ] Architecture guideline: CI/CD
- [ ] Architecture guideline: Use capacity-rebalancing (recommended) for proactive instance replacement
- [ ] Architecture guideline: Fargate Spot for containerized workers (less configuration, same savings)
- [ ] Architecture guideline: Implement CloudWatch alarms on Spot termination notifications
- [ ] Architecture guideline: Avoid Spot for Laravel Octane (long-lived processes with in-memory state)
- [ ] Default to Spot for All Queue Workers and CI/CD Runners followed
- [ ] Always Pair Spot with On-Demand Fallback or RI Baseline followed
- [ ] Implement SIGTERM Handlers in Laravel Workers followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Avoid Spot for Laravel Octane (Long-Lived Stateful Processes) followed

---

# Implementation Checklist

- [ ] Best practice applied: Use Spot for all queue workers
- [ ] Best practice applied: Implement graceful shutdown handling
- [ ] Best practice applied: Diversify instance types and AZs
- [ ] Best practice applied: Use mixed instances groups with ASG
- [ ] Best practice applied: Set max price to On-Demand rate
- [ ] Default to Spot for All Queue Workers and CI/CD Runners followed
- [ ] Always Pair Spot with On-Demand Fallback or RI Baseline followed
- [ ] Implement SIGTERM Handlers in Laravel Workers followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Avoid Spot for Laravel Octane (Long-Lived Stateful Processes) followed
- [ ] Workflow step completed: Inventory current Spot Instances Strategy resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Spot instances are identical hardware to On-Demand (same CPU, same performance)
- [ ] Interruption rate
- [ ] 2-minute warning handles >95% of graceful shutdown cases
- [ ] Capacity-rebalancing reduces interruption impact by proactively replacing instances
- [ ] Fargate Spot has same 70% discount but less instance type control

---

# Security Checklist

- [ ] Same security boundary as On-Demand (same VPC, security groups, IAM)
- [ ] Termination notification via instance metadata (no external API dependency)
- [ ] Isolate Spot instances in separate security groups for compliance auditing
- [ ] Spot termination can be used by attackers to force instance replacement timing
- [ ] Ensure IAM roles attached to Spot instances have minimum necessary permissions

---

# Reliability Checklist

- [ ] Mistake prevented: No interruption handling
- [ ] Mistake prevented: Single instance type in Spot request
- [ ] Mistake prevented: Not using Fargate Spot for containers

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Spot instances used for fault-tolerant stateless workloads
- [ ] Graceful shutdown handler (SIGTERM) implemented
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] Auto Scaling Group with mixed instances policy
- [ ] On-Demand fallback configured for critical capacity
- [ ] Fargate Spot considered for containerized workers
- [ ] Spot capacity-rebalancing enabled

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Spot Instances Strategy configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Default to Spot for All Queue Workers and CI/CD Runners followed
- [ ] Always Pair Spot with On-Demand Fallback or RI Baseline followed
- [ ] Implement SIGTERM Handlers in Laravel Workers followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Avoid Spot for Laravel Octane (Long-Lived Stateful Processes) followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Spot for databases
- [ ] Anti-pattern prevented: Single-AZ Spot
- [ ] Anti-pattern prevented: No On-Demand fallback
- [ ] Anti-pattern prevented: Manual Spot management
- [ ] Anti-pattern prevented: Spot for Octane
- [ ] Common mistake prevented: No interruption handling
- [ ] Common mistake prevented: Single instance type in Spot request
- [ ] Common mistake prevented: Not using Fargate Spot for containers

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Spot instances used for fault-tolerant stateless workloads
- [ ] Verification passed: Graceful shutdown handler (SIGTERM) implemented
- [ ] Verification passed: Diversified instance types (3+) and AZs (2+)

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
