# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Authorization Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Blade Directive Testing Over Server-Side**: Testing Blade `@can` directives instead of the server-side authorization boundary
- [ ] Prevent anti-pattern: No Tenant Isolation Tests**: Missing cross-tenant access tests in multi-tenant applications
- [ ] Prevent anti-pattern: No Permission Cache Test**: Not testing that permission changes take effect after cache invalidation
- [ ] Every policy method tested (view, create, update, delete, restore, forceDelete)
- [ ] Authorized and unauthorized users tested for each method
- [ ] Edge cases covered: unauthenticated, suspended, soft-deleted
- [ ] RBAC permission checks tested independently
- [ ] Gate closures tested with passing and failing conditions
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing positive cases
- [ ] Avoid: Not testing model-specific scoping

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- HTTP tests: `$this->actingAs($user)->get('/posts/1/edit')->assertStatus(200)`
- Gate/Policy tests: `$this->assertTrue(Gate::allows('update', $post))`
- Permission matrix: define an array of `[user_type, action, resource, expected_result]`
- Test the super-admin bypass: verify that super-admin can access resources they don't own
- Test unauthenticated access: guest users should get 401/403 for protected routes

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Every policy method tested (view, create, update, delete, restore, forceDelete)
- [ ] - [ ] Authorized and unauthorized users tested for each method
- [ ] - [ ] Edge cases covered: unauthenticated, suspended, soft-deleted
- [ ] - [ ] RBAC permission checks tested independently

# Performance Checklist
- Authorization tests are fast â€” typically <50ms per test case
- Data providers reduce test duplication without performance cost
- Refresh database between test classes (not between every test) for faster runs

# Security Checklist
- **100% Test Coverage of Authorization**: Every Gate/Policy method should have at least one positive and one negative test.
- **CSRF Protection**: Authenticated tests bypass CSRF by default. If testing API with Bearer tokens, CSRF is not applicable.
- **Super-Admin Tests**: Verify that super-admins can access all resources, including those they don't own.
- **Tenant Isolation Tests**: Cross-tenant access should always be denied.

# Reliability Checklist
- [ ] Ensure: Authorization testing in Laravel verifies that Gates, Policies, and permission c...

# Testing Checklist
- [ ] Every policy method tested (view, create, update, delete, restore, forceDelete)
- [ ] Authorized and unauthorized users tested for each method
- [ ] Edge cases covered: unauthenticated, suspended, soft-deleted
- [ ] RBAC permission checks tested independently
- [ ] Gate closures tested with passing and failing conditions
- [ ] Permission cache tests verify invalidation works
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing positive cases
- [ ] Avoid: Not testing model-specific scoping

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Blade Directive Testing Over Server-Side**: Testing Blade `@can` directives instead of the server-side authorization boundary
- [ ] Prevent: No Tenant Isolation Tests**: Missing cross-tenant access tests in multi-tenant applications
- [ ] Prevent: No Permission Cache Test**: Not testing that permission changes take effect after cache invalidation
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only testing positive cases
- [ ] Avoid mistake: Not testing model-specific scoping
- [ ] Avoid mistake: Skipping unauthenticated tests
- [ ] Avoid mistake: Not testing super-admin bypass

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
- Blade Directive Testing Over Server-Side**: Testing Blade `@can` directives instead of the server-side authorization boundary
- No Tenant Isolation Tests**: Missing cross-tenant access tests in multi-tenant applications
- No Permission Cache Test**: Not testing that permission changes take effect after cache invalidation
## Skills
- Test Authorization Policies, Gates, and Permissions


