# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Data Retention Tiering
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Data retention policy documented per data type
- [ ] Hot retention: 7-30 days (logs), 30-90 days (traces), 90 days (errors)
- [ ] S3 lifecycle policy for automatic tiering
- [ ] Logs archived as Parquet (compressed, partitioned)
- [ ] Archive restoration tested quarterly
- [ ] Export logs to S3 after 7 days applied
- [ ] Set retention at data type level applied
- [ ] Use S3 Lifecycle Policies for automatic tiering applied
- [ ] Export Logs from Hot Storage to S3 After 7 Days followed
- [ ] Set Retention Per Data Type Ã¢â‚¬â€ Not a Single Policy for All followed
- [ ] Roll Up Raw Data into Aggregated Summaries Before Archiving followed
- [ ] Single-tier retention prevented
- [ ] Manual archive pruning prevented
- [ ] No data lifecycle management prevented
- [ ] Archiving without schema prevented

---

# Architecture Checklist

- [ ] Architecture guideline: CloudWatch Logs; retention = 30 days; export to S3 on Day 7
- [ ] Architecture guideline: Datadog Logs
- [ ] Architecture guideline: S3 bucket
- [ ] Architecture guideline: Athena
- [ ] Architecture guideline: Compliance
- [ ] Architecture guideline: Rollup pipeline
- [ ] Export Logs from Hot Storage to S3 After 7 Days followed
- [ ] Set Retention Per Data Type Ã¢â‚¬â€ Not a Single Policy for All followed
- [ ] Roll Up Raw Data into Aggregated Summaries Before Archiving followed
- [ ] Use S3 Lifecycle Policies for Automated Tiering Ã¢â‚¬â€ Never Manual followed
- [ ] Test Data Restoration from Archive Quarterly followed

---

# Implementation Checklist

- [ ] Best practice applied: Export logs to S3 after 7 days
- [ ] Best practice applied: Set retention at data type level
- [ ] Best practice applied: Use S3 Lifecycle Policies for automatic tiering
- [ ] Best practice applied: Rollup metrics before archiving
- [ ] Best practice applied: Test data restoration from archive quarterly
- [ ] Best practice applied: Set compliance-driven deletion
- [ ] Export Logs from Hot Storage to S3 After 7 Days followed
- [ ] Set Retention Per Data Type Ã¢â‚¬â€ Not a Single Policy for All followed
- [ ] Roll Up Raw Data into Aggregated Summaries Before Archiving followed
- [ ] Use S3 Lifecycle Policies for Automated Tiering Ã¢â‚¬â€ Never Manual followed
- [ ] Test Data Restoration from Archive Quarterly followed
- [ ] Workflow step completed: Inventory current Data Retention Tiering resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] S3 export time
- [ ] Athena query time
- [ ] Rollup computation
- [ ] Compression ratio
- [ ] Glacier restore

---

# Security Checklist

- [ ] Archived data must retain access controls (IAM policies on S3 buckets)
- [ ] Encrypt archived data (S3 SSE-KMS or client-side encryption)
- [ ] Object Lock prevents deletion/modification during compliance period
- [ ] Archive access logging (CloudTrail) for compliance auditing
- [ ] Data deletion must be verifiable (generate deletion certificate for compliance)

---

# Reliability Checklist

- [ ] Mistake prevented: No data lifecycle management
- [ ] Mistake prevented: Archiving without schema
- [ ] Mistake prevented: Not deleting after compliance

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Data retention policy documented per data type
- [ ] Hot retention: 7-30 days (logs), 30-90 days (traces), 90 days (errors)
- [ ] S3 lifecycle policy for automatic tiering
- [ ] Logs archived as Parquet (compressed, partitioned)
- [ ] Archive restoration tested quarterly
- [ ] Compliance deletion date set and automated
- [ ] Retention tiering reduced storage cost by 50%+

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Data Retention Tiering configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Export Logs from Hot Storage to S3 After 7 Days followed
- [ ] Set Retention Per Data Type Ã¢â‚¬â€ Not a Single Policy for All followed
- [ ] Roll Up Raw Data into Aggregated Summaries Before Archiving followed
- [ ] Use S3 Lifecycle Policies for Automated Tiering Ã¢â‚¬â€ Never Manual followed
- [ ] Test Data Restoration from Archive Quarterly followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Single-tier retention
- [ ] Anti-pattern prevented: Manual archive pruning
- [ ] Anti-pattern prevented: No compliance expiration tracking
- [ ] Anti-pattern prevented: Archiving everything
- [ ] Common mistake prevented: No data lifecycle management
- [ ] Common mistake prevented: Archiving without schema
- [ ] Common mistake prevented: Not deleting after compliance

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Data retention policy documented per data type
- [ ] Verification passed: Hot retention: 7-30 days (logs), 30-90 days (traces), 90 days (errors)
- [ ] Verification passed: S3 lifecycle policy for automatic tiering

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
