# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** ReBAC relationship-based authorization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Relationship Type Vocabulary**: Inconsistent relationship names (owner, admin, manager used interchangeably)
- [ ] Prevent anti-pattern: ReBAC for Simple Ownership**: Using relationship tuples when a simple `owner_id` column suffices
- [ ] Prevent anti-pattern: No Cascade on Resource Delete**: Relationship tuples accumulate when resources are deleted
- [ ] Relationship types defined and documented
- [ ] Resource hierarchy mapped (parent-child inheritance)
- [ ] Relationship inheritance tested (parent grant propagates to children)
- [ ] Relationship revocation tested (parent revoke cascades correctly)
- [ ] Edge cases: circular relationships, multiple relationship paths
- [ ] Avoid: Mistake
- [ ] Avoid: Modeling relationships in resource table columns
- [ ] Avoid: Lack of consistency

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Relationship tuple table: `object_type`, `object_id`, `relation`, `subject_type`, `subject_id`
- Intersection with RBAC: users have roles (RBAC), roles have relationships to resources (ReBAC)
- Evaluation: join relationships table to determine access
- Graph traversal: for nested relationships (org â†’ team â†’ resource), iterate through the relationship chain
- External services: Google Zanzibar open-source implementations (SpiceDB, Keto) for large-scale ReBAC

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Relationship types defined and documented
- [ ] - [ ] Resource hierarchy mapped (parent-child inheritance)
- [ ] - [ ] Relationship inheritance tested (parent grant propagates to children)
- [ ] - [ ] Relationship revocation tested (parent revoke cascades correctly)

# Performance Checklist
- Relationship lookups: indexed queries on relationship tuples â€” 1-5ms
- Graph traversal: depth N requires N queries â€” use recursive CTEs or caching
- Relationship caching: cache resolved relationships per user+resource
- Tuple storage: relationship table grows with resource sharing â€” index aggressively

# Security Checklist
- **Consistency**: ReBAC decisions must be based on the latest relationship state. Use database transactions for relationship changes.
- **Relationship Sprawl**: Limit who can create relationships to prevent privilege escalation.
- **Zombie Relationships**: When a resource is deleted, all related tuples must be removed (cascade).
- **Audit Trail**: Every relationship change must be logged â€” who granted, who received, on which resource.

# Reliability Checklist
- [ ] Ensure: Relationship-Based Access Control (ReBAC) evaluates authorization based on relat...

# Testing Checklist
- [ ] Relationship types defined and documented
- [ ] Resource hierarchy mapped (parent-child inheritance)
- [ ] Relationship inheritance tested (parent grant propagates to children)
- [ ] Relationship revocation tested (parent revoke cascades correctly)
- [ ] Edge cases: circular relationships, multiple relationship paths
- [ ] Avoid: Mistake
- [ ] Avoid: Modeling relationships in resource table columns
- [ ] Avoid: Lack of consistency

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Relationship Type Vocabulary**: Inconsistent relationship names (owner, admin, manager used interchangeably)
- [ ] Prevent: ReBAC for Simple Ownership**: Using relationship tuples when a simple `owner_id` column suffices
- [ ] Prevent: No Cascade on Resource Delete**: Relationship tuples accumulate when resources are deleted
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Modeling relationships in resource table columns
- [ ] Avoid mistake: Lack of consistency
- [ ] Avoid mistake: Not cleaning up relationship on resource delete
- [ ] Avoid mistake: Graph traversal without caching

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
- No Relationship Type Vocabulary**: Inconsistent relationship names (owner, admin, manager used interchangeably)
- ReBAC for Simple Ownership**: Using relationship tuples when a simple `owner_id` column suffices
- No Cascade on Resource Delete**: Relationship tuples accumulate when resources are deleted
## Skills
- Implement Relationship-Based Access Control (ReBAC) for Graph-Like Permissions


