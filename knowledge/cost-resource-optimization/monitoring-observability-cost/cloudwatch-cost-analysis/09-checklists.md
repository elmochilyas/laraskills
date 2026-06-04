# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** CloudWatch Cost Analysis
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Set log retention policies applied
- [ ] Use filter patterns to reduce log volume applied
- [ ] Consolidate dashboards applied
- [ ] Set Log Retention Policies Immediately Ã¢â‚¬â€ Never Keep Logs Indefinitely followed
- [ ] Use Filter Patterns to Reduce Log Ingestion Volume by 40-60% followed
- [ ] Avoid High-Cardinality Custom Metrics (Use Contributor Insights Instead) followed
- [ ] Verbose debug logging in production prevented
- [ ] Keeping all logs forever prevented
- [ ] Not setting log retention limits prevented
- [ ] Creating high-cardinality custom metrics prevented

---

# Architecture Checklist

- [ ] Architecture guideline: CloudWatch for AWS-native infrastructure monitoring; aggregate logs into S3 for query cost reduction
- [ ] Architecture guideline: Combine CloudWatch (infra metrics, free) + Scout APM ($39-299/month) for comprehensive Laravel visibility
- [ ] Architecture guideline: Use AWS Budgets and Cost Anomaly Detection to alert on monitoring cost spikes
- [ ] Architecture guideline: Set log retention via CloudWatch Logs subscription filters to S3 for long-term archival
- [ ] Architecture guideline: Tag resources by environment, team, and application for cost allocation in Cost Explorer
- [ ] Set Log Retention Policies Immediately Ã¢â‚¬â€ Never Keep Logs Indefinitely followed
- [ ] Use Filter Patterns to Reduce Log Ingestion Volume by 40-60% followed
- [ ] Avoid High-Cardinality Custom Metrics (Use Contributor Insights Instead) followed
- [ ] Consolidate Dashboards Ã¢â‚¬â€ Use Multi-Metric Widgets followed
- [ ] Set CloudWatch-Specific Budget Alerts to Prevent Bill Surprises followed

---

# Implementation Checklist

- [ ] Best practice applied: Set log retention policies
- [ ] Best practice applied: Use filter patterns to reduce log volume
- [ ] Best practice applied: Consolidate dashboards
- [ ] Best practice applied: Use Contributor Insights instead of custom metrics
- [ ] Best practice applied: Enable Lambda Insights selectively
- [ ] Set Log Retention Policies Immediately Ã¢â‚¬â€ Never Keep Logs Indefinitely followed
- [ ] Use Filter Patterns to Reduce Log Ingestion Volume by 40-60% followed
- [ ] Avoid High-Cardinality Custom Metrics (Use Contributor Insights Instead) followed
- [ ] Consolidate Dashboards Ã¢â‚¬â€ Use Multi-Metric Widgets followed
- [ ] Set CloudWatch-Specific Budget Alerts to Prevent Bill Surprises followed
- [ ] Workflow step completed: Inventory current Cloudwatch Cost Analysis resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] APM agents add 1-5% overhead per request; CloudWatch agent adds negligible overhead for basic metrics
- [ ] Log ingestion rate
- [ ] Trace sampling
- [ ] Custom metrics

---

# Security Checklist

- [ ] CloudWatch Logs encryption at rest using KMS adds no additional CloudWatch cost
- [ ] IAM policies should restrict who can alter log retention and metric filter configurations
- [ ] Log groups contain sensitive data; ensure IAM least privilege for log access
- [ ] CloudWatch Logs Insights queries can export data; monitor query activity

---

# Reliability Checklist

- [ ] Mistake prevented: Not setting log retention limits
- [ ] Mistake prevented: Creating high-cardinality custom metrics
- [ ] Mistake prevented: Enabling full tracing for all endpoints
- [ ] Mistake prevented: Not using AWS Budget alerts for monitoring services

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
- [ ] Cloudwatch Cost Analysis configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Set Log Retention Policies Immediately Ã¢â‚¬â€ Never Keep Logs Indefinitely followed
- [ ] Use Filter Patterns to Reduce Log Ingestion Volume by 40-60% followed
- [ ] Avoid High-Cardinality Custom Metrics (Use Contributor Insights Instead) followed
- [ ] Consolidate Dashboards Ã¢â‚¬â€ Use Multi-Metric Widgets followed
- [ ] Set CloudWatch-Specific Budget Alerts to Prevent Bill Surprises followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Verbose debug logging in production
- [ ] Anti-pattern prevented: Keeping all logs forever
- [ ] Anti-pattern prevented: One metric per state
- [ ] Anti-pattern prevented: Manual dashboard proliferation
- [ ] Common mistake prevented: Not setting log retention limits
- [ ] Common mistake prevented: Creating high-cardinality custom metrics
- [ ] Common mistake prevented: Enabling full tracing for all endpoints
- [ ] Common mistake prevented: Not using AWS Budget alerts for monitoring services

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
