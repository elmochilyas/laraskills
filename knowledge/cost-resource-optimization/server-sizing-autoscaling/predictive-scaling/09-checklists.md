# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 09-server-sizing-autoscaling
**Knowledge Unit:** Predictive Scaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use predictive scaling as primary, step scaling as fallback applied
- [ ] Start with "Forecast only" mode for 2 weeks applied
- [ ] Provide 14+ days of clean historical data applied
- [ ] Use Predictive Scaling as Primary, Step Scaling as Fallback followed
- [ ] Start with Forecast-Only Mode for 2 Weeks followed
- [ ] Provide Clean Training Data (Remove Anomalous Periods) followed
- [ ] Predictive scaling for random traffic prevented
- [ ] No reactive fallback prevented
- [ ] Using reactive scaling only prevented
- [ ] Not providing clean training data prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Predictive scaling for primary traffic patterns; step scaling with target tracking as safety net
- [ ] Architecture guideline: Scheduled scaling for known events (marketing campaigns, product launches, maintenance windows)
- [ ] Architecture guideline: Predictive scaling works with EC2 Auto Scaling and ECS Service Auto Scaling
- [ ] Architecture guideline: For Laravel Octane apps, pair predictive scaling with worker pool warm-up
- [ ] Architecture guideline: Use CloudWatch metrics (CPU, request count, memory) as input for predictive model
- [ ] Architecture guideline: Enable scale-in protection to prevent terminating instances with active connections
- [ ] Use Predictive Scaling as Primary, Step Scaling as Fallback followed
- [ ] Start with Forecast-Only Mode for 2 Weeks followed
- [ ] Provide Clean Training Data (Remove Anomalous Periods) followed
- [ ] Set Max Capacity Bounds (2x Expected Peak) followed
- [ ] Monitor Forecast Accuracy (<80% = Retrain or Disable) followed

---

# Implementation Checklist

- [ ] Best practice applied: Use predictive scaling as primary, step scaling as fallback
- [ ] Best practice applied: Start with "Forecast only" mode for 2 weeks
- [ ] Best practice applied: Provide 14+ days of clean historical data
- [ ] Best practice applied: Set max capacity bounds
- [ ] Best practice applied: Monitor forecast accuracy
- [ ] Use Predictive Scaling as Primary, Step Scaling as Fallback followed
- [ ] Start with Forecast-Only Mode for 2 Weeks followed
- [ ] Provide Clean Training Data (Remove Anomalous Periods) followed
- [ ] Set Max Capacity Bounds (2x Expected Peak) followed
- [ ] Monitor Forecast Accuracy (<80% = Retrain or Disable) followed
- [ ] Workflow step completed: Inventory current Predictive Scaling resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Predictive scaling adds capacity 30 minutes before predicted load; eliminates cold-start latency
- [ ] ML model requires 14 days of data; new apps use scheduled/step scaling during ramp-up
- [ ] Model refreshes daily; takes 24 hours to incorporate new patterns
- [ ] Forecast accuracy
- [ ] Capacity changes are pre-computed; no scaling delay for predicted load changes

---

# Security Checklist

- [ ] Predictive scaling uses CloudWatch metrics which can be affected by compromised resources
- [ ] Ensure Auto Scaling groups use instance metadata service (IMDSv2) for security
- [ ] Scaling events generate CloudTrail events for audit trail
- [ ] Set CloudWatch alarms on scaling activity to detect anomalous scaling events
- [ ] Use service-linked roles for Auto Scaling; AWS-managed permissions

---

# Reliability Checklist

- [ ] Mistake prevented: Using reactive scaling only
- [ ] Mistake prevented: Not providing clean training data
- [ ] Mistake prevented: No max capacity bound
- [ ] Mistake prevented: Switching from scheduled directly to predictive

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
- [ ] Predictive Scaling configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use Predictive Scaling as Primary, Step Scaling as Fallback followed
- [ ] Start with Forecast-Only Mode for 2 Weeks followed
- [ ] Provide Clean Training Data (Remove Anomalous Periods) followed
- [ ] Set Max Capacity Bounds (2x Expected Peak) followed
- [ ] Monitor Forecast Accuracy (<80% = Retrain or Disable) followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Predictive scaling for random traffic
- [ ] Anti-pattern prevented: No reactive fallback
- [ ] Anti-pattern prevented: Scheduled scaling after predictive
- [ ] Anti-pattern prevented: Predictive scaling without training data
- [ ] Common mistake prevented: Using reactive scaling only
- [ ] Common mistake prevented: Not providing clean training data
- [ ] Common mistake prevented: No max capacity bound
- [ ] Common mistake prevented: Switching from scheduled directly to predictive

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
