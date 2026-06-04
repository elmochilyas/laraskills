# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** ABAC attribute-based authorization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Policies Scattered Across Controllers**: ABAC logic spread across controllers instead of centralized in a PDP or service
- [ ] Prevent anti-pattern: Missing ABAC Audit Trail**: Not logging PDP evaluations for compliance and debugging
- [ ] Prevent anti-pattern: ABAC Without RBAC Foundation**: Implementing ABAC as the sole authorization model without any role-based structure
- [ ] Policy methods evaluate all relevant attributes
- [ ] User attributes checked (department, location, clearance)
- [ ] Resource attributes checked (owner, classification)
- [ ] Environmental conditions evaluated (time, IP, request context)
- [ ] Policies registered in `AuthServiceProvider`
- [ ] Avoid: Mistake
- [ ] Avoid: ABAC for simple permission checks
- [ ] Avoid: Trusting client-provided attributes

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Laravel acts as PEP: intercepts requests via middleware/Gates â†’ evaluates attributes â†’ calls PDP â†’ enforces decision
- PDP can be external (Permit.io API) or internal (custom service evaluating policies)
- Attribute context: collect user, resource, action, and environment attributes at request time
- Policy-as-code: write policies in a declarative format (Rego for OPA, Permit.io policy language)
- Policy combination strategy: deny-overrides (most secure) or permit-overrides (least restrictive)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Policy methods evaluate all relevant attributes
- [ ] - [ ] User attributes checked (department, location, clearance)
- [ ] - [ ] Resource attributes checked (owner, classification)
- [ ] - [ ] Environmental conditions evaluated (time, IP, request context)

# Performance Checklist
- PDP evaluation adds latency â€” external PDP: 10-100ms HTTP call; local PDP: 1-5ms
- Attribute collection: gather all context before PDP call â€” minimize PDP calls
- Cache PDP decisions per user+resource+action combination
- Batch PDP evaluations when possible (single request may need multiple decisions)

# Security Checklist
- **Attribute Integrity**: Attributes must come from trusted sources (server-side, not user-provided). Validate/resolve at the PEP.
- **Default Deny**: If no policy matches, the default should be deny.
- **PDP Availability**: External PDP failure should default to deny (fail closed), not permit (fail open).
- **Policy Management**: Policies should be version-controlled and reviewed. Unauthorized policy changes can expose data.

# Reliability Checklist
- [ ] Ensure: Attribute-Based Access Control (ABAC) evaluates authorization based on attribute...

# Testing Checklist
- [ ] Policy methods evaluate all relevant attributes
- [ ] User attributes checked (department, location, clearance)
- [ ] Resource attributes checked (owner, classification)
- [ ] Environmental conditions evaluated (time, IP, request context)
- [ ] Policies registered in `AuthServiceProvider`
- [ ] Policy tests cover positive and negative scenarios
- [ ] Avoid: Mistake
- [ ] Avoid: ABAC for simple permission checks
- [ ] Avoid: Trusting client-provided attributes

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Policies Scattered Across Controllers**: ABAC logic spread across controllers instead of centralized in a PDP or service
- [ ] Prevent: Missing ABAC Audit Trail**: Not logging PDP evaluations for compliance and debugging
- [ ] Prevent: ABAC Without RBAC Foundation**: Implementing ABAC as the sole authorization model without any role-based structure
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: ABAC for simple permission checks
- [ ] Avoid mistake: Trusting client-provided attributes
- [ ] Avoid mistake: No PDP availability fallback
- [ ] Avoid mistake: Not caching PDP decisions

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Policies Scattered Across Controllers**: ABAC logic spread across controllers instead of centralized in a PDP or service
- Missing ABAC Audit Trail**: Not logging PDP evaluations for compliance and debugging
- ABAC Without RBAC Foundation**: Implementing ABAC as the sole authorization model without any role-based structure
## Skills
- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization


