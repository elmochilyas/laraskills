# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** Spot Instances
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Spot instances used for fault-tolerant stateless workloads
- [ ] Graceful shutdown handler (SIGTERM) implemented
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] Auto Scaling Group with mixed instances policy
- [ ] On-Demand fallback configured for critical capacity
- [ ] Use Spot for queue workers applied
- [ ] Implement graceful shutdown handlers applied
- [ ] Diversify across instance types and AZs applied
- [ ] Use Spot for All Queue Workers followed
- [ ] Implement Graceful Shutdown Handling via SIGTERM followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Spot for databases prevented
- [ ] Single-AZ Spot prevented
- [ ] No interruption handling prevented
- [ ] Single instance type in Spot request prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Run baseline capacity on Reserved Instances, burst/overflow on Spot
- [ ] Architecture guideline: Queue workers
- [ ] Architecture guideline: Web servers
- [ ] Architecture guideline: Avoid Spot for Laravel Octane (long-lived processes with state)
- [ ] Architecture guideline: Use Fargate Spot for containerized queue workers (less configuration overhead)
- [ ] Architecture guideline: Implement CloudWatch alarms on Spot termination notifications for observability
- [ ] Use Spot for All Queue Workers followed
- [ ] Implement Graceful Shutdown Handling via SIGTERM followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Set Max Price to On-Demand Rate Ã¢â‚¬â€ Never Lower followed
- [ ] Use Auto Scaling Groups with Mixed Instances Ã¢â‚¬â€ Never Manual Spot Requests followed

---

# Implementation Checklist

- [ ] Best practice applied: Use Spot for queue workers
- [ ] Best practice applied: Implement graceful shutdown handlers
- [ ] Best practice applied: Diversify across instance types and AZs
- [ ] Best practice applied: Use mixed instances groups with ASG
- [ ] Best practice applied: Set max price to On-Demand rate
- [ ] Use Spot for All Queue Workers followed
- [ ] Implement Graceful Shutdown Handling via SIGTERM followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Set Max Price to On-Demand Rate Ã¢â‚¬â€ Never Lower followed
- [ ] Use Auto Scaling Groups with Mixed Instances Ã¢â‚¬â€ Never Manual Spot Requests followed
- [ ] Workflow step completed: Inventory current Spot Instances resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Spot instances are identical to On-Demand performance (same hardware, same CPU)
- [ ] Interruption rate varies
- [ ] 2-minute warning is usually sufficient for worker checkpoints (<5% of recovery cases take longer)
- [ ] Spot with capacity-rebalancing (recommended) proactively replaces instances before interruptions
- [ ] Fargate Spot has similar 70% discount but less control over instance types

---

# Security Checklist

- [ ] Spot instances have same security boundary as On-Demand (same VPC, security groups, IAM)
- [ ] Termination notification is internal to instance metadata; no external API dependency
- [ ] Spot instance termination can be used by attackers to force instance replacement timing
- [ ] Isolate Spot instances in separate security groups if needed for compliance (auditing)

---

# Reliability Checklist

- [ ] Mistake prevented: No interruption handling
- [ ] Mistake prevented: Single instance type in Spot request
- [ ] Mistake prevented: Not using Fargate Spot for container workloads

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

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Spot Instances configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use Spot for All Queue Workers followed
- [ ] Implement Graceful Shutdown Handling via SIGTERM followed
- [ ] Diversify Across 3+ Instance Types and 2+ AZs followed
- [ ] Set Max Price to On-Demand Rate Ã¢â‚¬â€ Never Lower followed
- [ ] Use Auto Scaling Groups with Mixed Instances Ã¢â‚¬â€ Never Manual Spot Requests followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Spot for databases
- [ ] Anti-pattern prevented: Single-AZ Spot
- [ ] Anti-pattern prevented: No fallback to On-Demand
- [ ] Anti-pattern prevented: Manual Spot management
- [ ] Common mistake prevented: No interruption handling
- [ ] Common mistake prevented: Single instance type in Spot request
- [ ] Common mistake prevented: Not using Fargate Spot for container workloads

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
