# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Neon Serverless PostgreSQL
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use Neon for all non-production database environments applied
- [ ] Set compute limits per branch applied
- [ ] Configure auto-pause for idle branches applied
- [ ] Neon for production with strict HA requirements prevented
- [ ] Branching every PR with full production data prevented
- [ ] Using Neon for production primary without evaluation prevented
- [ ] Not setting branch TTL prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Neon for dev/staging/CI/CD; Aurora/RDS for production
- [ ] Architecture guideline: Branch naming
- [ ] Architecture guideline: Auto-delete branches after 7-14 days (Neon branch TTL setting)
- [ ] Architecture guideline: Production Ã¢â€ â€™ Neon sync via logical replication for realistic dev data
- [ ] Architecture guideline: Compute sizing

---

# Implementation Checklist

- [ ] Best practice applied: Use Neon for all non-production database environments
- [ ] Best practice applied: Set compute limits per branch
- [ ] Best practice applied: Configure auto-pause for idle branches
- [ ] Best practice applied: Branch from production for realistic testing
- [ ] Best practice applied: Monitor compute credit usage on free tier
- [ ] Workflow step completed: Inventory current Neon Serverless Postgres resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Cold start
- [ ] Warm queries
- [ ] Compute Units
- [ ] Maximum compute
- [ ] Storage
- [ ] Concurrent connections

---

# Security Checklist

- [ ] Neon uses AWS infrastructure for storage (us-east-1, eu-west-1, ap-southeast-1)
- [ ] Encryption at rest with AES-256; in transit with TLS 1.3
- [ ] IP allowlisting for connection security
- [ ] Branch access inherits parent database roles and permissions
- [ ] Production data in branches requires same access controls as production

---

# Reliability Checklist

- [ ] Mistake prevented: Using Neon for production primary without evaluation
- [ ] Mistake prevented: Not setting branch TTL
- [ ] Mistake prevented: Oversizing compute for developer branches
- [ ] Mistake prevented: Not configuring auto-pause

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
- [ ] Neon Serverless Postgres configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Neon for production with strict HA requirements
- [ ] Anti-pattern prevented: Branching every PR with full production data
- [ ] Anti-pattern prevented: No compute limits on branches
- [ ] Anti-pattern prevented: Ignoring free tier limits
- [ ] Common mistake prevented: Using Neon for production primary without evaluation
- [ ] Common mistake prevented: Not setting branch TTL
- [ ] Common mistake prevented: Oversizing compute for developer branches
- [ ] Common mistake prevented: Not configuring auto-pause

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
