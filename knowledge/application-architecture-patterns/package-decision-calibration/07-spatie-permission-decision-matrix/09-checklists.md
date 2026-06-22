# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Spatie Permission Decision Matrix
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Permission naming follows `{resource}:{action}` convention
- [ ] Permissions are seeded, not created at runtime

---

# Architecture Checklist

- [ ] RBAC model is appropriate (not trying to force ReBAC or ABAC into Spatie)
- [ ] Spatie is not used as a substitute for native Gates/Policies on model operations
- [ ] Guard names are consistent across permission creation and checking
- [ ] Team permission resolution uses middleware pattern with context reset
- [ ] Don't mix Spatie permissions with native Gates for the same resource (pick one pattern)

---

# Implementation Checklist

- [ ] Workflow step completed: Permission seeder created using `Permission::findOrCreate()` for idempotent seeding
- [ ] Workflow step completed: `{resource}:{action}` naming convention applied consistently
- [ ] Workflow step completed: Permission cache TTL configured (1 hour max) with invalidation on role changes
- [ ] Workflow step completed: `setPermissionsTeamId()` set in tenant middleware with `finally` reset
- [ ] Workflow step completed: Cache cleared in test `setUp()` (`app()['cache']->forget('spatie.permission.cache')`)
- [ ] Workflow step completed: Escape hatch (native Gates/Policies) designed for ReBAC patterns
- [ ] Workflow step completed: Permission audit export functional (users → roles → permissions)

---

# Performance Checklist

- [ ] Permission cache enabled and TTL configured
- [ ] Team permission pivot `team_id` column indexed
- [ ] Wildcard permission resolution overhead measured (wildcards are slower than exact match)
- [ ] Cache stampede avoided on global cache flush (use per-user invalidation)

---

# Security Checklist

- [ ] Permission cache invalidated immediately on role/permission changes (not waiting for TTL)
- [ ] Guard names consistent — a `web` permission is not checked against an `api` guard
- [ ] Direct permission assignment to users is rare and auditable (prefer role-based assignment)
- [ ] Permissions are version-controlled and code-reviewed (seeded, not runtime-created)

---

# Reliability Checklist

- [ ] Failure addressed: Using Spatie for simple boolean admin checks:
- [ ] Failure addressed: Not invalidating permission cache after role changes:
- [ ] Failure addressed: Using Spatie for ReBAC (relationship-based) patterns:
- [ ] Failure addressed: Team permission memory leak (static context not reset):
- [ ] Failure addressed: Guard name inconsistency between creation and checking:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Permission naming follows `{resource}:{action}` convention
- [ ] Permissions are seeded, not created at runtime
- [ ] Permission cache is invalidated on role/permission changes
- [ ] Team permissions use `setPermissionsTeamId()` in middleware
- [ ] Team permission context is reset after use (especially in queued jobs)
- [ ] Guard names are consistent across permission creation and checking
- [ ] Escape hatch (native Gates/Policies) is designed for ReBAC patterns
- [ ] Permission audit export is functional
- [ ] Tests clear permission cache in `setUp()`
- [ ] No dynamic permission creation via admin UI

### Success Criteria
- [ ] All permission names follow `{resource}:{action}` (enforced by convention check)
- [ ] Permission cache invalidation verified (demoted user cannot access within 1 second)
- [ ] Cross-team permission isolation verified in tests
- [ ] Permission audit export generates complete user→role→permission matrix

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Permission explosion (200+ permissions instead of well-designed roles)
- [ ] Anti-pattern prevented: Dynamic permission creation (creating permissions at runtime)
- [ ] Anti-pattern prevented: Spatie for everything (using @role for feature flags, plan limits)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Permission cache stale after role change:
- [ ] Failure scenario handled: Guard name migration:
- [ ] Failure scenario handled: Team permission migration (non-team → team-scoped):

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
