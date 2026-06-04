# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.22 Compliance-driven isolation (GDPR, HIPAA, SOC 2)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Isolation by regulation tier applied
- [ ] Audit trail per tenant applied
- [ ] Data residency applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Single isolation for all tenants**: If 95% of tenants don't need HIPAA compliance, don't force them into DB-per-tenant. Map isolation to compliance requirement. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] All regulated data properly isolated per regulation requirements
- [ ] Compliance audit passes without findings
- [ ] Right to deletion completes within regulatory timeframe

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Isolation by regulation tier applied
- [ ] Audit trail per tenant applied
- [ ] Data residency applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Identify regulations per tenant: GDPR, HIPAA, SOC 2, PCI-DSS completed
- [ ] Map regulation requirements to isolation controls: completed
- [ ] Select isolation model that satisfies strictest regulation among tenants completed
- [ ] Implement required controls: encryption, audit logging, access reviews, backup/restore completed
- [ ] Conduct compliance validation: penetration testing, access audit, data flow analysis completed

---

# Performance Checklist

- [ ] Performance: Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Single isolation for all tenants**: If 95% of tenants don't need HIPAA compliance, don't force them into DB-per-tenant. Map isolation to compliance requirement. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Isolation model satisfies all applicable regulations
- [ ] Audit logging captures all regulated data access
- [ ] Encryption at rest and in transit enabled
- [ ] Right to deletion workflow tested and verified
- [ ] Penetration testing results show no cross-tenant access
- [ ] All regulated data properly isolated per regulation requirements
- [ ] Compliance audit passes without findings
- [ ] Right to deletion completes within regulatory timeframe
- [ ] Audit logs capture all regulated data access
- [ ] Tenant data deleted from all systems within regulatory timeframe

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Never Trust Tenant ID From Request prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Assuming shared-table isolation satisfies HIPAA (it does not â€” PHI requires stricter controls) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Single isolation for all tenants**: If 95% of tenants don't need HIPAA compliance, don't force them into DB-per-tenant. Map isolation to compliance requirement. prevented

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

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
