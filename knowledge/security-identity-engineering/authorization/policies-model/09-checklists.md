# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Policies: model-centric authorization classes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Guest-Unsafe Policies**: Not handling null authenticated user in Policy methods
- [ ] Prevent anti-pattern: Policy Without Tests**: Authorization policies lacking both positive and negative tests
- [ ] Prevent anti-pattern: Missing Policy Entirely**: No Policy class for a model, relying on ad-hoc authorization in controllers
- [ ] Prevent anti-pattern: Registered But Not Enforced**: Policy created but never called at endpoint level
- [ ] `viewAny` defined before `view` (viewAny handles index; view handles show)
- [ ] Policy registered in `AuthServiceProvider`
- [ ] All CRUD methods implemented (viewAny, view, create, update, delete)
- [ ] Soft-delete methods where needed (restore, forceDelete)
- [ ] Policies authorize based on resource ownership or attributes
- [ ] Super-admin bypass implemented
- [ ] Avoid: Mistake
- [ ] Avoid: Not using authorizeResource()
- [ ] Avoid: Putting business logic in policies
- [ ] Every controller method calls `$this->authorize()`, `$request->user()->can()`, or `Gate::authorize()`
- [ ] AuthN middleware (`auth`) is present AND authZ checks (Policy/Gate) are present on every protected route

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Policies live in `app/Policies/{Model}Policy.php`
- Auto-discovery: Policy class name = Model name + `Policy` suffix
- For non-standard naming, register manually in `AuthServiceProvider::$policies`
- Policy receives the authenticated User as the first parameter; the model instance for model-aware methods (view, update, delete, restore, forceDelete)
- Create methods receive only the user (no model exists yet)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Policy registered in `AuthServiceProvider`
- [ ] - [ ] All CRUD methods implemented (viewAny, view, create, update, delete)
- [ ] - [ ] Soft-delete methods where needed (restore, forceDelete)
- [ ] - [ ] Policies authorize based on resource ownership or attributes

# Performance Checklist
- Policy resolution: cached after first use â€” negligible overhead
- Auto-discovery scans the `Policies` directory once per request, then caches
- Policy methods execute on every authorized action â€” keep them lightweight

# Security Checklist
- **Server-Side Enforcement**: Policies are server-side only. Always pair with Blade `@can` for UI, but never rely on Blade alone.
- **Model Not Found**: If a model is not found in route-model binding, the policy is not called â€” the 404 takes precedence.
- **Guest Users**: By default, unauthenticated users fail all policies. Override with `before()` to allow guest-specific behavior.
- **Policy Enforced at Endpoint**: Registration alone is insufficient. Every endpoint must call `$this->authorize()`, `$request->user()->can()`, `Gate::authorize()`, or `authorizeResource()`.
- **AuthN vs AuthZ**: The `auth` middleware confirms identity but does NOT authorize actions. Both authentication middleware and authorization checks (Policy/Gate) must be present on every protected route.

# Reliability Checklist
- [ ] Ensure: Policies are classes that organize authorization logic around a specific Eloquen...

# Testing Checklist
- [ ] Policy registered in `AuthServiceProvider`
- [ ] All CRUD methods implemented (viewAny, view, create, update, delete)
- [ ] `viewAny` defined before `view`
- [ ] Soft-delete methods where needed (restore, forceDelete)
- [ ] Policies authorize based on resource ownership or attributes
- [ ] Super-admin bypass implemented
- [ ] Policy tests cover all methods with both positive and negative cases
- [ ] Avoid: Mistake
- [ ] Avoid: Not using authorizeResource()
- [ ] Avoid: Putting business logic in policies

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Guest-Unsafe Policies**: Not handling null authenticated user in Policy methods
- [ ] Prevent: Policy Without Tests**: Authorization policies lacking both positive and negative tests
- [ ] Prevent: Missing Policy Entirely**: No Policy class for a model, relying on ad-hoc authorization in controllers
- [ ] Prevent: Registered But Not Enforced**: Policy created but never called at endpoint level, leaving routes unprotected
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not using authorizeResource()
- [ ] Avoid mistake: Putting business logic in policies
- [ ] Avoid mistake: Forgetting restore/forceDelete methods
- [ ] Avoid mistake: Not handling guest users
- [ ] Avoid mistake: Confusing authentication middleware with authorization

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
- Guest-Unsafe Policies**: Not handling null authenticated user in Policy methods
- Policy Without Tests**: Authorization policies lacking both positive and negative tests
- Missing Policy Entirely**: No Policy class for a model, relying on ad-hoc authorization in controllers
- Registered But Not Enforced**: Policy class created and registered but never called at endpoint level
## Skills
- Create Model Policies for Resource-Based Authorization


