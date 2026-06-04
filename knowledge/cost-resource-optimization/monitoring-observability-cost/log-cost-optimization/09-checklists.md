# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Log Cost Optimization
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] LOG_LEVEL set to warning in production
- [ ] Structured logging (JSON) configured
- [ ] Log retention set to 30 days (operational)
- [ ] Health check and cron logs filtered
- [ ] High-volume logs sampled (1:10)
- [ ] Set log level to WARNING in production applied
- [ ] Use structured logging applied
- [ ] Sample high-volume logs applied
- [ ] Set LOG_LEVEL to Warning in Production followed
- [ ] Use Structured JSON Logging Ã¢â‚¬â€ Never Unstructured Text followed
- [ ] Sample High-Volume Logs Ã¢â‚¬â€ Never Sample Errors followed
- [ ] Dumping Laravel log file to CloudWatch as-is prevented
- [ ] Not monitoring log costs prevented
- [ ] DEBUG logging in production prevented
- [ ] No log retention policy prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Laravel's logging channels
- [ ] Architecture guideline: Consider DataDog/New Relic for unified log + metric + trace observability (higher cost, simpler setup)
- [ ] Architecture guideline: Use dedicated log shipper (Vector, fluentd) for batch compression and delivery
- [ ] Architecture guideline: Route compliance logs (financial transactions) to S3 directly (not through log aggregator)
- [ ] Architecture guideline: Set up log-based alerts only for ERROR/CRITICAL level; reduce noise
- [ ] Architecture guideline: Tag logs with service name and environment for cost attribution
- [ ] Set LOG_LEVEL to Warning in Production followed
- [ ] Use Structured JSON Logging Ã¢â‚¬â€ Never Unstructured Text followed
- [ ] Sample High-Volume Logs Ã¢â‚¬â€ Never Sample Errors followed
- [ ] Filter Health Check and Cron Logs at Source followed
- [ ] Set 30-Day Retention for Operational Logs Ã¢â‚¬â€ Export Compliance Logs to S3 followed

---

# Implementation Checklist

- [ ] Best practice applied: Set log level to WARNING in production
- [ ] Best practice applied: Use structured logging
- [ ] Best practice applied: Sample high-volume logs
- [ ] Best practice applied: Set retention to 30 days for operational logs
- [ ] Best practice applied: Use log compression at source
- [ ] Best practice applied: Filter health check and cron logs
- [ ] Set LOG_LEVEL to Warning in Production followed
- [ ] Use Structured JSON Logging Ã¢â‚¬â€ Never Unstructured Text followed
- [ ] Sample High-Volume Logs Ã¢â‚¬â€ Never Sample Errors followed
- [ ] Filter Health Check and Cron Logs at Source followed
- [ ] Set 30-Day Retention for Operational Logs Ã¢â‚¬â€ Export Compliance Logs to S3 followed
- [ ] Workflow step completed: Inventory current Log Cost Optimization resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Logging adds 1-5ms per log call (sync writes); use async logging in production
- [ ] Log batch shipping reduces API calls by 100x (single batch vs per-line delivery)
- [ ] Compression reduces network transfer by 3-5x
- [ ] Log level filtering at source (not at aggregator) reduces CPU and network overhead
- [ ] CloudWatch Logs agent uses ~2-5% CPU for high-volume log delivery

---

# Security Checklist

- [ ] Never log PII, passwords, tokens, or credit card numbers
- [ ] Configure Laravel's `App\Exceptions\Handler` to mask sensitive data in logs
- [ ] Use Logstash or Fluentd filtering to redact sensitive fields
- [ ] Log access to sensitive data (GDPR/CCPA compliance)
- [ ] Encrypt logs at rest and in transit

---

# Reliability Checklist

- [ ] Mistake prevented: DEBUG logging in production
- [ ] Mistake prevented: No log retention policy
- [ ] Mistake prevented: Logging request/response bodies for all endpoints

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] LOG_LEVEL set to warning in production
- [ ] Structured logging (JSON) configured
- [ ] Log retention set to 30 days (operational)
- [ ] Health check and cron logs filtered
- [ ] High-volume logs sampled (1:10)
- [ ] Log cost < 5% of total infrastructure spend
- [ ] No PII or sensitive data in logs

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Log Cost Optimization configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Set LOG_LEVEL to Warning in Production followed
- [ ] Use Structured JSON Logging Ã¢â‚¬â€ Never Unstructured Text followed
- [ ] Sample High-Volume Logs Ã¢â‚¬â€ Never Sample Errors followed
- [ ] Filter Health Check and Cron Logs at Source followed
- [ ] Set 30-Day Retention for Operational Logs Ã¢â‚¬â€ Export Compliance Logs to S3 followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Dumping Laravel log file to CloudWatch as-is
- [ ] Anti-pattern prevented: Not monitoring log costs
- [ ] Anti-pattern prevented: Excessive log retention
- [ ] Anti-pattern prevented: Logging in tight loops
- [ ] Common mistake prevented: DEBUG logging in production
- [ ] Common mistake prevented: No log retention policy
- [ ] Common mistake prevented: Logging request/response bodies for all endpoints

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: LOG_LEVEL set to warning in production
- [ ] Verification passed: Structured logging (JSON) configured
- [ ] Verification passed: Log retention set to 30 days (operational)

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
