# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** access-control-authorization
**Knowledge Unit:** laravel-gates-policies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Gates and Policies concepts understood, including when to use each
- [ ] Auto-discovery pattern configured for Policy mapping
- [ ] `can` middleware and `@can` Blade directive usage reviewed
- [ ] `before`/`after` hooks evaluated for global authorization overrides
- [ ] Authorization logic separated from controller and model concerns

---

# Architecture Checklist

- [ ] Gates used for non-model actions (admin dashboard, Reports) and Policies used per Eloquent model
- [ ] Policy auto-discovery enabled via `AuthServiceProvider` or manual registration for explicit mapping
- [ ] `before` hook reserved for super-admin overrides, `after` hook for logging or audit
- [ ] No authorization logic duplicated across Gates and Policies for the same resource
- [ ] Dependency boundaries respected: Gates/Policies depend on Spatie Permission layer, not vice versa

---

# Implementation Checklist

- [ ] `viewAny`, `view`, `create`, `update`, `delete`, `restore`, and `forceDelete` methods defined per Policy
- [ ] `Gate::define()` registered in `AuthServiceProvider` for actions with no associated model
- [ ] `$this->authorize()` calls placed in controllers, not in route closures
- [ ] `@can` and `@cannot` Blade directives applied in views for conditional rendering
- [ ] `can` middleware applied on route groups for bulk authorization enforcement

---

# Performance Checklist

- [ ] Policy resolution cached via service provider registration, not repeated per request
- [ ] Policy `before` and `after` hooks benchmarked for request overhead
- [ ] `can` calls minimized in Blade loops; pre-fetch authorization state where possible
- [ ] No N+1 authorization checks across collection iterations
- [ ] Gate closure performance reviewed for expensive database queries

---

# Security Checklist

- [ ] All controller actions protected by `$this->authorize()` or `can` middleware
- [ ] `before` hook does not accidentally grant access to unauthorized users
- [ ] Guest user authorization (unauthenticated) handled via `Gate::before` or `Gate::define` with null user check
- [ ] Policy `forceDelete` restricted to authorized roles only
- [ ] Wildcard Gate definitions do not bypass specific Policy checks

---

# Reliability Checklist

- [ ] Policy methods return boolean; exception-based denial via `AuthorizationException` tested
- [ ] `Gate::denies()` fallback paths defined for unauthorized responses
- [ ] `before` hook failure does not cascade into authorization denial for all routes
- [ ] Policy auto-discovery fallback to manual registration verified for production

---

# Testing Checklist

- [ ] Unit tests written for each Policy method (view, create, update, delete)
- [ ] Feature tests verify `can` middleware blocks unauthorized requests with 403
- [ ] `Gate::before` super-admin override tested for both grant and deny scenarios
- [ ] Guest user authorization paths tested for unauthenticated access denial
- [ ] Blade `@can` directive rendering tested in feature tests

---

# Maintainability Checklist

- [ ] Policies organized per model in `app/Policies` directory
- [ ] Policy methods follow single-responsibility: one permission check per method
- [ ] `AuthServiceProvider` registration kept clean: Gates for non-model, Policies for models
- [ ] Policy method signatures match the corresponding model and user parameter conventions
- [ ] Related skills (Spatie Permission, OPA) referenced in Policy documentation

---

# Anti-Pattern Prevention Checklist

- [ ] No authorization logic in controller methods; always delegate to Gates/Policies
- [ ] No hardcoded user IDs or role checks inside Policy methods
- [ ] `before` hook not used for business logic filtering
- [ ] No duplicate authorization checks across controller and Blade view
- [ ] No authorization bypass via route model binding without `can` middleware

---

# Production Readiness Checklist

- [ ] Authorization failures logged with user ID, action, and resource identifier
- [ ] Monitoring set up for 403 response rate to detect authorization misconfigurations
- [ ] Policy auto-discovery verified in production environment
- [ ] Rollback strategy defined for Policy changes that break authorization
- [ ] Deployment checklist includes verification of new Policy registrations

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Gates vs Policies correctly chosen per use case
- [ ] Security requirements satisfied: all endpoints protected, guest access handled
- [ ] Performance requirements satisfied: no N+1 authorization, caching evaluated
- [ ] Testing requirements satisfied: unit and feature tests cover all Policy methods
- [ ] Anti-pattern checks passed: no authorization in controllers, no policy duplication
- [ ] Production readiness verified: monitoring, logging, rollback plan in place

---

# Related References

- GCE-ACC-002 (spatie-permission) — Adds role/permission management on top of Gates/Policies
- GCE-ACC-003 (opa-openpolicyagent) — External policy engine for cross-service authorization
- GCE-FFG-001 (laravel-pennant) — Feature flag authorization parallel
