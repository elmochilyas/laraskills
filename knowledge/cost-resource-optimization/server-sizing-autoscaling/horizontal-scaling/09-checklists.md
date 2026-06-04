# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 09-server-sizing-autoscaling
**Knowledge Unit:** Horizontal Scaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Stateless application design (Redis sessions, S3 files)
- [ ] Auto Scaling Group configured (min >= 2 for multi-AZ)
- [ ] ALB with connection drain (60s)
- [ ] Lifecycle hooks for instance warm-up
- [ ] Smaller instances preferred over fewer large ones
- [ ] Design for statelessness from day 1 applied
- [ ] Use smaller instances for better granularity applied
- [ ] Set target tracking on ALB RequestCountPerTarget applied
- [ ] Design for Statelessness from Day 1 followed
- [ ] Use Multiple Smaller Instances Instead of Few Large Ones followed
- [ ] Set Target Tracking on ALB RequestCountPerTarget followed
- [ ] Monolithic scaling prevented
- [ ] Identical ASG min/max prevented
- [ ] Stateful application design prevented
- [ ] One large instance instead of multiple small prevented

---

# Architecture Checklist

- [ ] Architecture guideline: ASG
- [ ] Architecture guideline: Instance
- [ ] Architecture guideline: ALB
- [ ] Architecture guideline: Health check
- [ ] Architecture guideline: Connection drain
- [ ] Architecture guideline: Warm-up
- [ ] Architecture guideline: Cooldown
- [ ] Architecture guideline: Termination policy
- [ ] Design for Statelessness from Day 1 followed
- [ ] Use Multiple Smaller Instances Instead of Few Large Ones followed
- [ ] Set Target Tracking on ALB RequestCountPerTarget followed
- [ ] Enable Connection Draining on ALB (60 Seconds) followed
- [ ] Use Lifecycle Hooks for Instance Warm-Up followed

---

# Implementation Checklist

- [ ] Best practice applied: Design for statelessness from day 1
- [ ] Best practice applied: Use smaller instances for better granularity
- [ ] Best practice applied: Set target tracking on ALB RequestCountPerTarget
- [ ] Best practice applied: Enable connection draining on ALB
- [ ] Best practice applied: Use lifecycle hooks for warm-up
- [ ] Best practice applied: Prefer many small over few large
- [ ] Best practice applied: Monitor scale-in termination policy
- [ ] Design for Statelessness from Day 1 followed
- [ ] Use Multiple Smaller Instances Instead of Few Large Ones followed
- [ ] Set Target Tracking on ALB RequestCountPerTarget followed
- [ ] Enable Connection Draining on ALB (60 Seconds) followed
- [ ] Use Lifecycle Hooks for Instance Warm-Up followed
- [ ] Workflow step completed: Inventory current Horizontal Scaling resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Small instances (t4g.medium)
- [ ] Medium instances (m7g.large)
- [ ] ALB distribution overhead
- [ ] Connection pool pressure
- [ ] Cold start
- [ ] Warm instances

---

# Security Checklist

- [ ] Instances in private subnets only (no public IPs)
- [ ] Security groups per instance role (web, worker, database)
- [ ] ALB terminates TLS; instances use HTTP (internal)
- [ ] Instance metadata service v2 (IMDSv2) enforced
- [ ] Instance identity documents for IAM role verification

---

# Reliability Checklist

- [ ] Mistake prevented: Stateful application design
- [ ] Mistake prevented: One large instance instead of multiple small
- [ ] Mistake prevented: No connection draining
- [ ] Mistake prevented: Identical instances across all ASGs

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Stateless application design (Redis sessions, S3 files)
- [ ] Auto Scaling Group configured (min >= 2 for multi-AZ)
- [ ] ALB with connection drain (60s)
- [ ] Lifecycle hooks for instance warm-up
- [ ] Smaller instances preferred over fewer large ones
- [ ] Target tracking on RequestCountPerTarget
- [ ] No stateful dependencies on local instance storage

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Horizontal Scaling configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Design for Statelessness from Day 1 followed
- [ ] Use Multiple Smaller Instances Instead of Few Large Ones followed
- [ ] Set Target Tracking on ALB RequestCountPerTarget followed
- [ ] Enable Connection Draining on ALB (60 Seconds) followed
- [ ] Use Lifecycle Hooks for Instance Warm-Up followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Monolithic scaling
- [ ] Anti-pattern prevented: Identical ASG min/max
- [ ] Anti-pattern prevented: No lifecycle hooks
- [ ] Anti-pattern prevented: No ALB health checks
- [ ] Common mistake prevented: Stateful application design
- [ ] Common mistake prevented: One large instance instead of multiple small
- [ ] Common mistake prevented: No connection draining
- [ ] Common mistake prevented: Identical instances across all ASGs

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Stateless application design (Redis sessions, S3 files)
- [ ] Verification passed: Auto Scaling Group configured (min >= 2 for multi-AZ)
- [ ] Verification passed: ALB with connection drain (60s)

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
