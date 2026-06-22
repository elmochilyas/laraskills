# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Team-Scoped Spatie Permission Depth for SaaS
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] `setPermissionsTeamId()` called before every permission check in team context
- [ ] Team context middleware resolves and validates team membership on every request
- [ ] Permission cache invalidated on every team switch (`forgetCachedPermissions()`)
- [ ] Platform admins bypass team scope via `Gate::before()`, not via team-assigned roles
- [ ] All roles and permissions use the same guard name (no mismatched guards)
- [ ] No subscription plan features encoded as Spatie permissions
- [ ] Entitlement/FeatureGate service exists separately from Spatie Permission
- [ ] Cross-team permission leakage tested (user in team A cannot access team B resources)
- [ ] Team context never accepted unsanitized from user input
- [ ] `team_foreign_key` indexed in all Spatie permission tables

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Team context middleware**: Runs on every request, resolves team from session, validates membership
- **Permission cache layer**: Invalidated on team switch, role change, permission change
- **Gate::before() layer**: Only truly global roles (super-admin, platform-support) bypass here
- **Policy layer**: Team-scoped authorization — validates team_id match before role check
- **Entitlement layer**: Separate service for plan-based feature access checks

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] `config/permission.php`: `'teams' => true`, `team_foreign_key` set correctly
- [ ] `ResolveTeamContext` middleware registered in kernel, before auth middleware
- [ ] Middleware validates team membership before calling `setPermissionsTeamId()`
- [ ] `TeamSwitchController`: `setPermissionsTeamId()` → `forgetCachedPermissions()` → session update
- [ ] `AuthServiceProvider::boot()`: `Gate::before()` for super-admin and platform-support only
- [ ] All Policies validate `$document->team_id === getPermissionsTeamId()` before role checks
- [ ] `EntitlementService` class for plan-based feature checks, separate from Spatie
- [ ] Role/permission seeder uses consistent guard name throughout

# Performance Checklist
- Spatie permission cache keyed per-user-per-team when team mode is active
- Cache hit means one Redis read instead of multiple DB queries per request
- Team switching is the critical cache invalidation point — ensure atomic and fast
- Large teams with 50+ permissions: serialized cache can be large — monitor cache memory

# Security Checklist
- [ ] Team context is a security boundary — team_id never accepted from untrusted input
- [ ] Permission cache staleness is a vulnerability: invalidate on every team switch and role change
- [ ] Cross-team permission leakage tested explicitly for every resource type
- [ ] `Gate::before()` bypass limited to truly global roles — never includes team-scoped logic
- [ ] Guard name consistency enforced — mismatched guards silently fail permission checks

# Reliability Checklist
- [ ] Team context middleware handles unauthenticated users gracefully (no-op, continues)
- [ ] Team context middleware handles users with no team membership (clears team context)
- [ ] Permission cache invalidation observers registered on Role, Permission, and pivot models
- [ ] Team switch flow regenerates session to prevent session fixation
- [ ] Last active team tracked for returning users who haven't selected a team

# Testing Checklist
- [ ] Test that user in Team A cannot access Team B resources (cross-team isolation)
- [ ] Test that platform admin (global role) can access any team's resources
- [ ] Test that team owner has full access within their team
- [ ] Test that team viewer can read but not write/delete
- [ ] Test that team switch invalidates old team's permissions
- [ ] Test that `setPermissionsTeamId()` is called before every permission check
- [ ] Test guard name consistency — role assigned with `web` guard is checked correctly

# Maintainability Checklist
- [ ] Team context resolution logic centralized in middleware, not scattered across controllers
- [ ] `Gate::before()` logic documented — which roles bypass and why
- [ ] Entitlement service has clear interface separate from Spatie's permission checks
- [ ] Team switch flow has dedicated controller with clear audit trail

# Anti-Pattern Prevention Checklist
- [ ] Prevent: Plan-as-permission (encoding subscription tiers as Spatie permissions)
- [ ] Prevent: Global role via team membership (assigning super-admin to every team)
- [ ] Prevent: Cache staleness on permission revocation (no cache invalidation)
- [ ] Prevent: Team-switching without cache reset (`setPermissionsTeamId` without `forgetCachedPermissions`)
- [ ] Prevent: Inline team_id override from request (privilege escalation via parameter manipulation)

# Production Readiness Checklist
- [ ] Team mode enabled in `config/permission.php` with correct foreign key
- [ ] `ResolveTeamContext` middleware applied to all team-scoped route groups
- [ ] `Gate::before()` bypass only for global roles, tested in production
- [ ] Permission cache invalidation verified on team switch, role change, permission change
- [ ] Entitlement service deployed and used alongside (not instead of) Spatie permission checks
- [ ] Cross-team isolation verified in production with automated tests
- [ ] `team_foreign_key` indexes confirmed on all Spatie tables
- [ ] Guard name audit completed — all roles and permissions share same guard

# Final Approval Checklist
- [ ] Architecture review completed (team context middleware, Gate::before, Policy design)
- [ ] Security review completed (cross-team isolation, cache invalidation, input validation)
- [ ] Performance impact assessed (cache strategy, team switch flow)
- [ ] Testing coverage adequate (all roles, cross-team, team switch, cache invalidation)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Always Call setPermissionsTeamId() Before Every Permission Check
- Invalidate Permission Cache on Every Team Switch
- Do Not Encode Subscription Plan Features as Spatie Permissions
- Use Gate::before() Only for Truly Global Roles
- Validate Team Membership Before Setting the Team Context
## Anti-Patterns
- Plan-as-permission
- Global role via team membership
- Cache staleness on permission revocation
- Team-switching without cache reset
- Inline team_id override from request
