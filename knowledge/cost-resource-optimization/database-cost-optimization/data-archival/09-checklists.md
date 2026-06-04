# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Data Archival
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Data retention policy documented per entity type
- [ ] Table partitioning by date implemented
- [ ] Archival job scheduled (cron) for regular archival
- [ ] Parquet/structured export format used
- [ ] Archive restoration tested quarterly
- [ ] Archive by date partition applied
- [ ] Keep 3-6 months in active database applied
- [ ] Use soft delete with auto-archival applied
- [ ] Keeping everything forever prevented
- [ ] Manual archival prevented
- [ ] No archival strategy prevented
- [ ] Deleting instead of archiving prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Identify hot/cold data split early in database schema design (include `created_at` for partitioning)
- [ ] Architecture guideline: Use Laravel's `prunable` trait for Eloquent models to auto-purge old soft-deleted records
- [ ] Architecture guideline: Implement archival as a scheduled job (`php artisan app:archive-old-records`)
- [ ] Architecture guideline: Move archived data to separate database instance first, then to S3
- [ ] Architecture guideline: Keep archive database on smaller, cheaper instance (or serverless)
- [ ] Architecture guideline: Document data retention policy per entity type (orders

---

# Implementation Checklist

- [ ] Best practice applied: Archive by date partition
- [ ] Best practice applied: Keep 3-6 months in active database
- [ ] Best practice applied: Use soft delete with auto-archival
- [ ] Best practice applied: Export to Parquet format for archiving
- [ ] Best practice applied: Use Neon branching for instant archive DB
- [ ] Best practice applied: Test restoration from archive quarterly
- [ ] Workflow step completed: Inventory current Data Archival resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Active table size reduction
- [ ] Partition detachment
- [ ] Export to S3 time
- [ ] Archive restore
- [ ] Index maintenance

---

# Security Checklist

- [ ] Archived data still needs access controls (IAM policies for S3)
- [ ] Encrypt archival data at rest (S3 SSE-KMS or client-side encryption)
- [ ] Data retention policy must comply with GDPR/CCPA (right to deletion)
- [ ] Archive logs should track what was archived and when
- [ ] Test that PII in archived data is properly handled (redaction, anonymization)

---

# Reliability Checklist

- [ ] Mistake prevented: No archival strategy
- [ ] Mistake prevented: Deleting instead of archiving
- [ ] Mistake prevented: Archiving to CSV without structure

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Data retention policy documented per entity type
- [ ] Table partitioning by date implemented
- [ ] Archival job scheduled (cron) for regular archival
- [ ] Parquet/structured export format used
- [ ] Archive restoration tested quarterly
- [ ] Active table size reduced by 60-80% after archival
- [ ] Soft-deleted records auto-archived after 90 days

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Data Archival configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Keeping everything forever
- [ ] Anti-pattern prevented: Manual archival
- [ ] Anti-pattern prevented: Archiving without testing restoration
- [ ] Anti-pattern prevented: S3 CSV archival without indexing
- [ ] Common mistake prevented: No archival strategy
- [ ] Common mistake prevented: Deleting instead of archiving
- [ ] Common mistake prevented: Archiving to CSV without structure

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Data retention policy documented per entity type
- [ ] Verification passed: Table partitioning by date implemented
- [ ] Verification passed: Archival job scheduled (cron) for regular archival

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
