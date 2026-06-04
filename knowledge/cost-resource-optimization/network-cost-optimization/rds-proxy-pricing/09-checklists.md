# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** RDS Proxy Pricing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use RDS Proxy for Lambda->RDS/Aurora patterns applied
- [ ] Avoid RDS Proxy with Aurora Serverless v2 unless necessary applied
- [ ] Enable ConnectionBorrowTimeout applied
- [ ] Use RDS Proxy for Lambda Ã¢â€ â€™ RDS/Aurora Architectures followed
- [ ] Avoid RDS Proxy with Aurora Serverless v2 Due to 8 ACU Minimum Charge followed
- [ ] Enable ConnectionBorrowTimeout (5 Seconds) followed
- [ ] RDS Proxy for everything prevented
- [ ] Serverless v2 + RDS Proxy without cost analysis prevented
- [ ] Using RDS Proxy with Aurora Serverless v2 and discovering $300/month charge prevented
- [ ] Using RDS Proxy for non-Lambda, non-critical apps prevented

---

# Architecture Checklist

- [ ] Architecture guideline: RDS Proxy for Lambda architectures requiring connection pooling with managed failover
- [ ] Architecture guideline: PgBouncer for stable EC2/ECS fleets where cost optimization is priority
- [ ] Architecture guideline: For Aurora Serverless v2
- [ ] Architecture guideline: Enable IAM database authentication for RDS Proxy to avoid storing passwords
- [ ] Architecture guideline: Place RDS Proxy in same VPC as application and database to minimize latency
- [ ] Architecture guideline: For multi-AZ RDS, RDS Proxy automatically handles failover with no application changes
- [ ] Use RDS Proxy for Lambda Ã¢â€ â€™ RDS/Aurora Architectures followed
- [ ] Avoid RDS Proxy with Aurora Serverless v2 Due to 8 ACU Minimum Charge followed
- [ ] Enable ConnectionBorrowTimeout (5 Seconds) followed
- [ ] Monitor RDS Proxy Connections Ã¢â‚¬â€ Rising ClientConnections Signals Scaling Pressure followed
- [ ] Right-Size Proxy for Workload Ã¢â‚¬â€ Don't Oversize Database for Proxy Capacity followed

---

# Implementation Checklist

- [ ] Best practice applied: Use RDS Proxy for Lambda->RDS/Aurora patterns
- [ ] Best practice applied: Avoid RDS Proxy with Aurora Serverless v2 unless necessary
- [ ] Best practice applied: Enable ConnectionBorrowTimeout
- [ ] Best practice applied: Monitor RDS Proxy connections
- [ ] Best practice applied: Right-size proxy for workload
- [ ] Use RDS Proxy for Lambda Ã¢â€ â€™ RDS/Aurora Architectures followed
- [ ] Avoid RDS Proxy with Aurora Serverless v2 Due to 8 ACU Minimum Charge followed
- [ ] Enable ConnectionBorrowTimeout (5 Seconds) followed
- [ ] Monitor RDS Proxy Connections Ã¢â‚¬â€ Rising ClientConnections Signals Scaling Pressure followed
- [ ] Right-Size Proxy for Workload Ã¢â‚¬â€ Don't Oversize Database for Proxy Capacity followed
- [ ] Workflow step completed: Inventory current Rds Proxy Pricing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] RDS Proxy adds ~1-2ms latency per connection; negligible for most workloads
- [ ] Proxy auto-scales connections to meet demand; no manual pool sizing needed
- [ ] Connection reuse eliminates SSL/TLS handshake overhead (5-30ms)
- [ ] Maximum connections per proxy
- [ ] Cold start

---

# Security Checklist

- [ ] RDS Proxy supports IAM authentication for temporary credentials (more secure than passwords)
- [ ] Secrets Manager integration for database credential rotation
- [ ] Proxy automatically handles SSL/TLS encryption
- [ ] Audit logs for all connection attempts through the proxy
- [ ] No direct database access from applications; all traffic flows through proxy

---

# Reliability Checklist

- [ ] Mistake prevented: Using RDS Proxy with Aurora Serverless v2 and discovering $300/month charge
- [ ] Mistake prevented: Using RDS Proxy for non-Lambda, non-critical apps
- [ ] Mistake prevented: Not enabling ConnectionBorrowTimeout
- [ ] Mistake prevented: Over-provisioning DB instance for proxy connection capacity

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
- [ ] Rds Proxy Pricing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use RDS Proxy for Lambda Ã¢â€ â€™ RDS/Aurora Architectures followed
- [ ] Avoid RDS Proxy with Aurora Serverless v2 Due to 8 ACU Minimum Charge followed
- [ ] Enable ConnectionBorrowTimeout (5 Seconds) followed
- [ ] Monitor RDS Proxy Connections Ã¢â‚¬â€ Rising ClientConnections Signals Scaling Pressure followed
- [ ] Right-Size Proxy for Workload Ã¢â‚¬â€ Don't Oversize Database for Proxy Capacity followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: RDS Proxy for everything
- [ ] Anti-pattern prevented: Serverless v2 + RDS Proxy without cost analysis
- [ ] Anti-pattern prevented: No ConnectionBorrowTimeout
- [ ] Anti-pattern prevented: RDS Proxy for MySQL on EC2
- [ ] Common mistake prevented: Using RDS Proxy with Aurora Serverless v2 and discovering $300/month charge
- [ ] Common mistake prevented: Using RDS Proxy for non-Lambda, non-critical apps
- [ ] Common mistake prevented: Not enabling ConnectionBorrowTimeout
- [ ] Common mistake prevented: Over-provisioning DB instance for proxy connection capacity

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
