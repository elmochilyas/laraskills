# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 09-server-sizing-autoscaling
**Knowledge Unit:** Scheduled Scaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Scale down to minimum capacity, not zero (for staging) applied
- [ ] Schedule scale-up 15 minutes before work starts applied
- [ ] Use cron expressions for complex schedules applied
- [ ] Scale Down Non-Production Environments on Weekends and Off-Hours followed
- [ ] Schedule Scale-Up 15 Minutes Before Need followed
- [ ] Never Scale to Zero in Production (Keep Minimum Capacity) followed
- [ ] 24/7 staging prevented
- [ ] No schedule at all prevented
- [ ] Scaling to 0 with no emergency access prevented
- [ ] Not accounting for timezone differences prevented

---

# Architecture Checklist

- [ ] Architecture guideline: AWS Auto Scaling scheduled actions for EC2 and ECS
- [ ] Architecture guideline: CloudWatch Events / EventBridge Scheduler for more complex scheduling
- [ ] Architecture guideline: Terraform `aws_autoscaling_schedule` resource for IaC management
- [ ] Architecture guideline: Combine with lifecycle hooks for graceful shutdown before scale-in
- [ ] Architecture guideline: For Kubernetes, use KEDA `ScaledObject` with cron triggers
- [ ] Architecture guideline: For Laravel Cloud, use environment scaling schedules (platform feature)
- [ ] Scale Down Non-Production Environments on Weekends and Off-Hours followed
- [ ] Schedule Scale-Up 15 Minutes Before Need followed
- [ ] Never Scale to Zero in Production (Keep Minimum Capacity) followed
- [ ] Use Cron Expressions for Weekdays-Only Scaling followed
- [ ] Test Schedule Changes in Non-Production First followed

---

# Implementation Checklist

- [ ] Best practice applied: Scale down to minimum capacity, not zero (for staging)
- [ ] Best practice applied: Schedule scale-up 15 minutes before work starts
- [ ] Best practice applied: Use cron expressions for complex schedules
- [ ] Best practice applied: Tag instances by schedule
- [ ] Best practice applied: Test schedule changes in non-production first
- [ ] Scale Down Non-Production Environments on Weekends and Off-Hours followed
- [ ] Schedule Scale-Up 15 Minutes Before Need followed
- [ ] Never Scale to Zero in Production (Keep Minimum Capacity) followed
- [ ] Use Cron Expressions for Weekdays-Only Scaling followed
- [ ] Test Schedule Changes in Non-Production First followed
- [ ] Workflow step completed: Inventory current Scheduled Scaling resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Scheduled scaling provides instant capacity at scheduled time; no ML warm-up required
- [ ] Instance launch time
- [ ] Application warm-up
- [ ] Scale-in cooldown
- [ ] No adaptation to changing patterns; schedule is static until manually updated

---

# Security Checklist

- [ ] Scheduled scaling events logged in CloudTrail; audit who created/modified schedules
- [ ] Ensure scale-down events don't terminate instances mid-deployment (use lifecycle hooks)
- [ ] Scheduled scaling for security testing environments
- [ ] Auto Scaling group termination policies affect which instances are terminated
- [ ] Protect critical instances with termination protection

---

# Reliability Checklist

- [ ] Mistake prevented: Scaling to 0 with no emergency access
- [ ] Mistake prevented: Not accounting for timezone differences
- [ ] Mistake prevented: No warm-up buffer
- [ ] Mistake prevented: Forgetting holiday schedules

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
- [ ] Scheduled Scaling configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Scale Down Non-Production Environments on Weekends and Off-Hours followed
- [ ] Schedule Scale-Up 15 Minutes Before Need followed
- [ ] Never Scale to Zero in Production (Keep Minimum Capacity) followed
- [ ] Use Cron Expressions for Weekdays-Only Scaling followed
- [ ] Test Schedule Changes in Non-Production First followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 24/7 staging
- [ ] Anti-pattern prevented: No schedule at all
- [ ] Anti-pattern prevented: Manual scale-up/down
- [ ] Anti-pattern prevented: Production-only thinking
- [ ] Common mistake prevented: Scaling to 0 with no emergency access
- [ ] Common mistake prevented: Not accounting for timezone differences
- [ ] Common mistake prevented: No warm-up buffer
- [ ] Common mistake prevented: Forgetting holiday schedules

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
