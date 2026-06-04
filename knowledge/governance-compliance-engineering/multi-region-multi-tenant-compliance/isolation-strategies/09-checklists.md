# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** multi-region-multi-tenant-compliance
**Knowledge Unit:** isolation-strategies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Multi-tenant isolation strategy selected: column-scoped, schema-per-tenant, or database-per-tenant
- [ ] GDPR Article 25 (data protection by design) requirements mapped to isolation level
- [ ] HIPAA data segmentation requirements evaluated
- [ ] Isolation level determines compliance posture against regulatory requirements
- [ ] Legal compliance mapping documented per tenant model and strategy

---

# Architecture Checklist

- [ ] Column-scoped isolation (tenant_id + global scopes) chosen for simplest sharing with highest compliance risk
- [ ] Schema-per-tenant chosen for strong isolation with per-tenant backup capability
- [ ] Database-per-tenant chosen for maximum isolation with per-tenant region assignment
- [ ] Isolation level directly determines compliance posture for GDPR, HIPAA, and other regulations
- [ ] Legal compliance mapping documents which regulations are satisfied at each isolation level

---

# Implementation Checklist

- [ ] Global scope applied to all queries for column-scoped isolation
- [ ] Schema-per-tenant migration system created for per-tenant schema management
- [ ] Database-per-tenant connection resolver implemented for dynamic tenant DB selection
- [ ] Tenant context resolver set up (subdomain, header, JWT claim)
- [ ] Tenant isolation middleware registered for request-scoped context

---

# Performance Checklist

- [ ] Global scope query performance monitored for filtering overhead
- [ ] Schema-per-tenant connection pool sized for expected tenant count
- [ ] Database-per-tenant connection overhead measured per request
- [ ] Tenant context resolver latency benchmarked
- [ ] Cross-tenant reporting query strategy evaluated for performance

---

# Security Checklist

- [ ] Global scope enforced on all query paths; bypass verified impossible
- [ ] Schema-per-tenant cross-schema access prevented by DB user permissions
- [ ] Database-per-tenant credential isolation prevents cross-tenant access
- [ ] Tenant context cannot be forged by user input
- [ ] Legal compliance mapping ensures isolation level meets regulatory minimum

---

# Reliability Checklist

- [ ] Tenant context missing handled with clear error (not data leak)
- [ ] Schema-per-tenant migration failure isolated to single tenant
- [ ] Database-per-tenant connection failure handled per tenant
- [ ] Cross-tenant maintenance operations scoped correctly

---

# Testing Checklist

- [ ] Tenant isolation tested: Tenant A cannot access Tenant B data at any layer
- [ ] Global scope bypass attempts verified blocked
- [ ] Schema-per-tenant migration tested per tenant
- [ ] Database-per-tenant connection switching tested
- [ ] Legal compliance mapping test per regulation per isolation level

---

# Maintainability Checklist

- [ ] Tenant isolation strategy rationale documented per tenant model
- [ ] Global scope implementation documented for query layer
- [ ] Schema/DB provisioning documented for ops team
- [ ] Compliance matrix documented: isolation level vs regulation
- [ ] Related skills (Data Residency, Spatie Permission Teams, Three-Tier Classification) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No global scope that can be disabled by query hints
- [ ] No schema-per-tenant without isolated credentials
- [ ] No database-per-tenant without per-tenant backup strategy
- [ ] No tenant context derived from user input without validation
- [ ] No single isolation level applied to all data regardless of sensitivity

---

# Production Readiness Checklist

- [ ] Isolation strategy tested with production-like tenant count
- [ ] Tenant provisioning automated for schema/DB-per-tenant
- [ ] Tenant data leak monitoring configured
- [ ] Backup strategy verified per isolation level
- [ ] Incident response drill for tenant isolation breach scenario

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: isolation strategy chosen per tenant data sensitivity
- [ ] Security requirements satisfied: isolation enforced at DB layer, no forgable context
- [ ] Performance requirements satisfied: connection overhead OK, scope queries indexed
- [ ] Testing requirements satisfied: cross-tenant access blocked, migration isolated
- [ ] Anti-pattern checks passed: scope not bypassable, isolated credentials, context validated
- [ ] Production readiness verified: tenant provisioning automated, backup per isolation, breach drill

---

# Related References

- GCE-MUL-002 (data-residency-tenants) — DB-per-tenant enables regional data placement
- GCE-GDP-002 (laravel-ai-act-compliance) — Tenant management in AI Act compliance (v1.5)
- GCE-ACC-002 (spatie-permission) — Team-scoped permissions
- GCE-DCS-001 (three-tier-classification) — Data tier determines isolation level
