# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 09-server-sizing-autoscaling
**Knowledge Unit:** Predictive Autoscaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] 14+ days of historical traffic data available
- [ ] Forecast-only mode run for 1 week before enabling actions
- [ ] Predictive + dynamic scaling configured (not predictive alone)
- [ ] Max capacity cap set (1.5-2x expected peak)
- [ ] Predictive accuracy monitored (PredictedCapacity vs Actual)
- [ ] Enable predictive scaling after 2+ weeks of traffic data applied
- [ ] Use forecast-only mode first applied
- [ ] Combine predictive + dynamic scaling applied
- [ ] Enable Predictive Scaling After 2+ Weeks of Traffic Data followed
- [ ] Use Forecast-Only Mode for 1 Week Before Enabling Scaling Actions followed
- [ ] Always Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Predictive Alone followed
- [ ] Predictive-only scaling prevented
- [ ] Predictive scaling without max capacity prevented
- [ ] Not using forecast-only mode prevented
- [ ] Replacing dynamic scaling with predictive prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Predictive scaling enabled on primary ASG (web tier)
- [ ] Architecture guideline: Forecast-only for 1 week -> evaluate -> enable forecast-and-scale
- [ ] Architecture guideline: Combine with target tracking dynamic scaling (reactive safety net)
- [ ] Architecture guideline: Scale types
- [ ] Architecture guideline: Set max capacity = 1.5x-2x baseline peak (budget cap)
- [ ] Architecture guideline: Monitor with CloudWatch metrics
- [ ] Architecture guideline: Review predictive model monthly; adjust if traffic patterns change
- [ ] Enable Predictive Scaling After 2+ Weeks of Traffic Data followed
- [ ] Use Forecast-Only Mode for 1 Week Before Enabling Scaling Actions followed
- [ ] Always Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Predictive Alone followed
- [ ] Set Max Capacity Cap (1.5-2x Expected Peak) followed
- [ ] Monitor Forecast Accuracy Ã¢â‚¬â€ Retrain Model if <80% Accurate followed

---

# Implementation Checklist

- [ ] Best practice applied: Enable predictive scaling after 2+ weeks of traffic data
- [ ] Best practice applied: Use forecast-only mode first
- [ ] Best practice applied: Combine predictive + dynamic scaling
- [ ] Best practice applied: Set max capacity buffer
- [ ] Best practice applied: Monitor forecast accuracy
- [ ] Best practice applied: Integrate with scheduled events
- [ ] Best practice applied: Use custom schedules for special days
- [ ] Enable Predictive Scaling After 2+ Weeks of Traffic Data followed
- [ ] Use Forecast-Only Mode for 1 Week Before Enabling Scaling Actions followed
- [ ] Always Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Predictive Alone followed
- [ ] Set Max Capacity Cap (1.5-2x Expected Peak) followed
- [ ] Monitor Forecast Accuracy Ã¢â‚¬â€ Retrain Model if <80% Accurate followed
- [ ] Workflow step completed: Inventory current Predictive Autoscaling resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Predictive scaling acts 15-30 minutes before forecasted peak (enough for 2-5 minute boot time)
- [ ] Dynamic scaling catches up in 2-5 minutes if traffic exceeds prediction
- [ ] Predictive scaling eliminates cold-start capacity lag entirely
- [ ] No cooldown needed (predictive actions are scheduled, not reactive)
- [ ] Prediction accuracy improves over time (more data = better model)

---

# Security Checklist

- [ ] Predictive scaling uses CloudWatch metrics; no data leaves AWS
- [ ] ASG max capacity acts as budget cap regardless of predictions
- [ ] IAM roles for ASG apply to all instances launched by predictive scaling
- [ ] CloudTrail logs all scaling actions (predictive and dynamic)
- [ ] Budget alerts on scaling group costs (emergency stop if cost exceeds threshold)

---

# Reliability Checklist

- [ ] Mistake prevented: Not using forecast-only mode
- [ ] Mistake prevented: Replacing dynamic scaling with predictive
- [ ] Mistake prevented: No schedule override for known events
- [ ] Mistake prevented: Insufficient historical data
- [ ] Mistake prevented: Ignoring forecast reports

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] 14+ days of historical traffic data available
- [ ] Forecast-only mode run for 1 week before enabling actions
- [ ] Predictive + dynamic scaling configured (not predictive alone)
- [ ] Max capacity cap set (1.5-2x expected peak)
- [ ] Predictive accuracy monitored (PredictedCapacity vs Actual)
- [ ] Schedule overrides for known events (holidays, campaigns)
- [ ] Predictive model reviewed monthly for accuracy

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Predictive Autoscaling configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Enable Predictive Scaling After 2+ Weeks of Traffic Data followed
- [ ] Use Forecast-Only Mode for 1 Week Before Enabling Scaling Actions followed
- [ ] Always Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Predictive Alone followed
- [ ] Set Max Capacity Cap (1.5-2x Expected Peak) followed
- [ ] Monitor Forecast Accuracy Ã¢â‚¬â€ Retrain Model if <80% Accurate followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Predictive-only scaling
- [ ] Anti-pattern prevented: Predictive scaling without max capacity
- [ ] Anti-pattern prevented: Using predictive for one-off events
- [ ] Anti-pattern prevented: Enabling without historical data
- [ ] Common mistake prevented: Not using forecast-only mode
- [ ] Common mistake prevented: Replacing dynamic scaling with predictive
- [ ] Common mistake prevented: No schedule override for known events
- [ ] Common mistake prevented: Insufficient historical data
- [ ] Common mistake prevented: Ignoring forecast reports

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: 14+ days of historical traffic data available
- [ ] Verification passed: Forecast-only mode run for 1 week before enabling actions
- [ ] Verification passed: Predictive + dynamic scaling configured (not predictive alone)

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
