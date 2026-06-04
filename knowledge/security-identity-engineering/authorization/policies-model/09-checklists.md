# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Policies: model-centric authorization classes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Guest-Unsafe Policies**: Not handling null authenticated user in Policy methods
- [ ] Prevent anti-pattern: Policy Without Tests**: Authorization policies lacking both positive and negative tests
- [ ] Prevent anti-pattern: Missing Policy Entirely**: No Policy class for a model, relying on ad-hoc authorization in controllers
- [ ] Policy registered in `AuthServiceProvider`
- [ ] All CRUD methods implemented (viewAny, view, create, update, delete)
- [ ] Soft-delete methods where needed (restore, forceDelete)
- [ ] Policies authorize based on resource ownership or attributes
- [ ] Super-admin bypass implemented
- [ ] Avoid: Mistake
- [ ] Avoid: Not using authorizeResource()
- [ ] Avoid: Putting business logic in policies

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

# Reliability Checklist
- [ ] Ensure: Policies are classes that organize authorization logic around a specific Eloquen...

# Testing Checklist
- [ ] Policy registered in `AuthServiceProvider`
- [ ] All CRUD methods implemented (viewAny, view, create, update, delete)
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
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not using authorizeResource()
- [ ] Avoid mistake: Putting business logic in policies
- [ ] Avoid mistake: Forgetting restore/forceDelete methods
- [ ] Avoid mistake: Not handling guest users

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
## Skills
- Create Model Policies for Resource-Based Authorization


