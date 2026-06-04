# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 05-cdn-storage-optimization
**Knowledge Unit:** Storage Tier Selection
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Lifecycle policy configured on each S3 bucket
- [ ] Object tier transitions aligned with access patterns
- [ ] No CDN-origin buckets pointed at Glacier
- [ ] Backup tiering moves to Glacier after 30-90 days
- [ ] Transition costs (minimum storage charges) understood and accounted for
- [ ] Implement lifecycle policies applied
- [ ] Keep originals on Standard, derivatives on One Zone-IA applied
- [ ] Never use Glacier for CDN origin applied
- [ ] Single bucket, no lifecycle prevented
- [ ] Glacier as CDN origin prevented
- [ ] Standard for all data prevented
- [ ] Using Glacier for frequently accessed objects prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Separate S3 buckets
- [ ] Architecture guideline: Lifecycle policy on uploads bucket
- [ ] Architecture guideline: Lifecycle policy on backups bucket
- [ ] Architecture guideline: Monitor transition costs
- [ ] Architecture guideline: Use S3 Intelligent-Tiering for unpredictable access patterns (monitoring fee applies)

---

# Implementation Checklist

- [ ] Best practice applied: Implement lifecycle policies
- [ ] Best practice applied: Keep originals on Standard, derivatives on One Zone-IA
- [ ] Best practice applied: Never use Glacier for CDN origin
- [ ] Best practice applied: Tag objects for lifecycle rules
- [ ] Workflow step completed: Inventory current Storage Tier Selection resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Standard
- [ ] IA
- [ ] Glacier Instant
- [ ] Glacier Flexible
- [ ] Glacier Deep Archive
- [ ] Cache at CloudFront to minimize direct S3 retrievals from cold tiers

---

# Security Checklist

- [ ] Glacier vault lock policy for compliance (WORM storage)
- [ ] Object lock prevents deletion/modification during retention period
- [ ] Cross-region replication for critical archived data
- [ ] Server-side encryption (SSE-S3 or SSE-KMS) applies to all tiers
- [ ] Lifecycle policies do not bypass IAM permissions; access remains controlled

---

# Reliability Checklist

- [ ] Mistake prevented: Standard for all data
- [ ] Mistake prevented: Using Glacier for frequently accessed objects
- [ ] Mistake prevented: No backup tiering

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Lifecycle policy configured on each S3 bucket
- [ ] Object tier transitions aligned with access patterns
- [ ] No CDN-origin buckets pointed at Glacier
- [ ] Backup tiering moves to Glacier after 30-90 days
- [ ] Transition costs (minimum storage charges) understood and accounted for

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Storage Tier Selection configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Single bucket, no lifecycle
- [ ] Anti-pattern prevented: Glacier as CDN origin
- [ ] Anti-pattern prevented: Manual object tiering
- [ ] Common mistake prevented: Standard for all data
- [ ] Common mistake prevented: Using Glacier for frequently accessed objects
- [ ] Common mistake prevented: No backup tiering

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Lifecycle policy configured on each S3 bucket
- [ ] Verification passed: Object tier transitions aligned with access patterns
- [ ] Verification passed: No CDN-origin buckets pointed at Glacier

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
