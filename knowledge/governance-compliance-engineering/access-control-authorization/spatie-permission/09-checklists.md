# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** access-control-authorization
**Knowledge Unit:** spatie-permission
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Spatie/laravel-permission package installed and configured for role/permission management
- [ ] Roles and permissions seeded and assigned to users
- [ ] Gate integration verified — Spatie permissions work with Laravel's native Gate system
- [ ] Teams support (v6+) evaluated for multi-tenant scoped roles
- [ ] Blade directives (`@role`, `@permission`, `@hasrole`) applied in views

---

# Architecture Checklist

- [ ] Roles defined as logical groupings of permissions, not as standalone authorization rules
- [ ] Gate integration used so Spatie permissions are consumed through Policy methods
- [ ] Teams feature scoped per tenant isolation strategy (schema-per-tenant or DB-per-tenant)
- [ ] Direct permissions reserved for user-specific overrides, not default assignment
- [ ] Permission naming conventions established and consistent across modules

---

# Implementation Checklist

- [ ] `HasRoles` trait added to the User model
- [ ] `PermissionRegistrar` cache cleared after seeding roles and permissions
- [ ] Seeder classes created for default roles (admin, editor, viewer) with associated permissions
- [ ] Middleware (`permission:`, `role:`) applied to route groups for declarative access control
- [ ] Artisan commands for role/permission management implemented for ops workflows

---

# Performance Checklist

- [ ] `PermissionRegistrar` cache TTL configured appropriately for deployment frequency
- [ ] Permission lookup queries monitored for N+1 via eager loading (`$user->roles()->with('permissions')`)
- [ ] Cache driver selected for performance (Redis recommended over file/database)
- [ ] Number of permission checks per request audited and minimized
- [ ] Middleware group ordering ensures permission checks occur after authentication

---

# Security Checklist

- [ ] Super-admin role bypasses all permission checks via `Gate::before` hook
- [ ] Role assignment restricted to authorized admin users only
- [ ] Wildcard permissions (`*`) audited to prevent accidental over-granting
- [ ] Teams-scoped permissions do not leak across tenant boundaries
- [ ] Direct permission assignment audited for unauthorized privilege escalation

---

# Reliability Checklist

- [ ] `PermissionRegistrar` cache invalidation handled on role/permission changes
- [ ] Permission check fallback returns false, not exception, for undefined permissions
- [ ] Database migrations for roles/permissions tables verified for idempotency
- [ ] Missing role assignment does not cause 500 errors, only 403

---

# Testing Checklist

- [ ] Unit tests for each role/permission gate check
- [ ] Feature tests for middleware enforcing route access per role
- [ ] Teams-scoped permission isolation tested across tenants
- [ ] Cache invalidation tests verify permissions refresh on change
- [ ] Guest user (unauthenticated) permission checks return false

---

# Maintainability Checklist

- [ ] Permission names follow `<action>-<resource>` convention (`edit-posts`, `view-reports`)
- [ ] Role seeder documented with description of each role's purpose
- [ ] Permission registrations centralized in a single seeder or config file
- [ ] Direct permission assignments reviewed during code review to prevent drift
- [ ] Related skills (Laravel Gates & Policies, Isolation Strategies) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No role/permission logic duplicated in custom middleware when Spatie middleware exists
- [ ] No soft-deleted roles causing stale permission state
- [ ] No permission checks in Blade evaluated without corresponding server-side enforcement
- [ ] No hardcoded role names in Policy methods; use `$user->hasRole()` consistently
- [ ] No direct permission assignments where role membership would suffice

---

# Production Readiness Checklist

- [ ] `PermissionRegistrar` cache warm-up included in deployment script
- [ ] Monitoring for cache hit ratio on permission lookups
- [ ] Permission change audit logged with user identifier and timestamp
- [ ] Rollback script prepared for permission seed changes that break access
- [ ] Teams feature tested with real multi-tenant data before production

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: roles/permissions separated, Gate integration complete
- [ ] Security requirements satisfied: super-admin bypass, team isolation, no privilege escalation
- [ ] Performance requirements satisfied: cache configured, N+1 queries eliminated
- [ ] Testing requirements satisfied: permissions tested per role, team isolation verified
- [ ] Anti-pattern checks passed: no middleware duplication, no hardcoded roles
- [ ] Production readiness verified: cache warm-up, audit logging, rollback ready

---

# Related References

- GCE-ACC-001 (laravel-gates-policies) — Underlying authorization layer
- GCE-ACC-003 (opa-openpolicyagent) — External policy engine for complex rules
- GCE-MUL-001 (isolation-strategies) — Multi-tenant authorization patterns
