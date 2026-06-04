# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.4 Tenant resolution strategies (domain, subdomain, header, token, authenticated user)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Middleware chain applied
- [ ] Caching resolution applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Resolving tenant in service layer**: Tenant resolution belongs in middleware. Resolving in controllers or services leads to duplication and inconsistent scoping. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Tenant resolved in < 10ms per request
- [ ] Zero false-positive tenant matches
- [ ] All requests have valid tenant context before business logic executes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Middleware chain applied
- [ ] Caching resolution applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Choose resolution strategy (subdomain is most common for web, header for API) completed
- [ ] For subdomain: parse `$request->getHost()`, extract subdomain, query tenants table completed
- [ ] For domain: query tenants table by custom domain, verify DNS completed
- [ ] For header: read `X-Tenant-ID` or `X-Organization` from request headers completed
- [ ] For auth: `$request->user()->tenant_id` for single-tenant-per-user model completed

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

- [ ] Resolving tenant in service layer**: Tenant resolution belongs in middleware. Resolving in controllers or services leads to duplication and inconsistent scoping. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tenant resolved before any database query runs
- [ ] Unresolvable requests return appropriate error (404/401)
- [ ] Resolved tenant cached and accessible throughout request
- [ ] Resolution works for all route groups (web, api, artisan)
- [ ] Tenant context available throughout request via singleton
- [ ] Tenant resolved in < 10ms per request
- [ ] Zero false-positive tenant matches
- [ ] All requests have valid tenant context before business logic executes
- [ ] Tenant lookup executed at most once per request
- [ ] Cache hit ratio > 99.9% for tenant resolution queries

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
- [ ] Tenant resolution runs after middleware that queries tenant data prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Resolving tenant in service layer**: Tenant resolution belongs in middleware. Resolving in controllers or services leads to duplication and inconsistent scoping. prevented

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
