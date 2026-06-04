# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Serverless Database
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Serverless vs provisioned break-even analyzed
- [ ] Aurora Serverless v2 min ACU set to baseline needs (not 0.5)
- [ ] RDS Proxy configured with Aurora Serverless
- [ ] ACU utilization monitored (adjust min/max range)
- [ ] Aurora Serverless v1 not used for production
- [ ] Use Aurora Serverless v2 for variable workloads applied
- [ ] Compare break-even with RDS Reserved applied
- [ ] Use Neon for ephemeral environments applied
- [ ] Aurora Serverless v2 + single AZ prevented
- [ ] Neon for all environments including production prevented
- [ ] Using Aurora Serverless v1 for production prevented
- [ ] Setting min ACU to 0.5 for production prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Set min ACU = (baseline_queries_per_second / 1000) * 2 (rough estimate)
- [ ] Architecture guideline: Set max ACU = (peak_queries_per_second / 1000) * 2 or budget limit
- [ ] Architecture guideline: Always use RDS Proxy with Aurora Serverless v2
- [ ] Architecture guideline: Use Neon for
- [ ] Architecture guideline: Use Aurora Serverless v2 for
- [ ] Architecture guideline: Monitor scaling events

---

# Implementation Checklist

- [ ] Best practice applied: Use Aurora Serverless v2 for variable workloads
- [ ] Best practice applied: Compare break-even with RDS Reserved
- [ ] Best practice applied: Use Neon for ephemeral environments
- [ ] Best practice applied: Set min ACU for baseline, not 0.5
- [ ] Best practice applied: Use RDS Proxy with Aurora Serverless
- [ ] Best practice applied: Monitor ACU utilization
- [ ] Workflow step completed: Inventory current Serverless Database resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Cold start (Neon)
- [ ] Aurora v2 scaling
- [ ] ACU = ~2GB memory + 1 vCPU (roughly); 4 ACU = comparable to t4g.medium
- [ ] Maximum ACU scale
- [ ] Query throughput scales with ACU; more ACU = more connections, faster queries

---

# Security Checklist

- [ ] Aurora Serverless
- [ ] Neon
- [ ] Database branches contain all data; ensure branch pruning for deleted environments
- [ ] Serverless database connections may change IP addresses; use DNS-based connections
- [ ] Auto-pause can cause connection timeouts; configure wait time appropriately

---

# Reliability Checklist

- [ ] Mistake prevented: Using Aurora Serverless v1 for production
- [ ] Mistake prevented: Setting min ACU to 0.5 for production
- [ ] Mistake prevented: Not considering break-even
- [ ] Mistake prevented: Neon for production with large data (>50GB)

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Serverless vs provisioned break-even analyzed
- [ ] Aurora Serverless v2 min ACU set to baseline needs (not 0.5)
- [ ] RDS Proxy configured with Aurora Serverless
- [ ] ACU utilization monitored (adjust min/max range)
- [ ] Aurora Serverless v1 not used for production
- [ ] Neon used for dev/staging/CI (not production)
- [ ] Max ACU cap set for budget control

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Serverless Database configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Aurora Serverless v2 + single AZ
- [ ] Anti-pattern prevented: Neon for all environments including production
- [ ] Anti-pattern prevented: No max ACU cap
- [ ] Anti-pattern prevented: Serverless for steady-state workloads
- [ ] Common mistake prevented: Using Aurora Serverless v1 for production
- [ ] Common mistake prevented: Setting min ACU to 0.5 for production
- [ ] Common mistake prevented: Not considering break-even
- [ ] Common mistake prevented: Neon for production with large data (>50GB)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Serverless vs provisioned break-even analyzed
- [ ] Verification passed: Aurora Serverless v2 min ACU set to baseline needs (not 0.5)
- [ ] Verification passed: RDS Proxy configured with Aurora Serverless

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
