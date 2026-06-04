# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Blade @can/@cannot/@canany directives
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Using @can on Routes Without Server-Side Checks**: Hiding UI elements while the underlying route is unprotected
- [ ] Prevent anti-pattern: @can Without @else Fallback**: Not providing fallback content for unauthorized users (blank UI)
- [ ] Prevent anti-pattern: Template-Only Authorization**: All authorization logic in Blade, no controller/middleware enforcement
- [ ] `@can` uses permission names, not role names
- [ ] Policy methods exist for each directive used
- [ ] `@cannot` used for inverse checks (not `@unlesscan`)
- [ ] Fallback content provided with `@else` where appropriate
- [ ] Avoid: Mistake
- [ ] Avoid: Only using @can for security
- [ ] Avoid: Using role names in @can

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- `@can('update', $post)` â†’ resolves `PostPolicy@update` or named gate
- Arguments match Gate::authorize() signature: ability name + model (if applicable)
- No additional database queries â€” reuses the same Gate/Policy resolution as server-side
- Can be used in layouts for menu display (link visibility based on permissions)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `@can` uses permission names, not role names
- [ ] - [ ] Policy methods exist for each directive used
- [ ] - [ ] `@cannot` used for inverse checks (not `@unlesscan`)
- [ ] - [ ] Fallback content provided with `@else` where appropriate

# Performance Checklist
- Directive resolution adds negligible overhead â€” same cached Gate/Policy system
- No additional database queries unless the Policy method performs them
- Multiple `@can` calls in a single view reuse the same resolved policies

# Security Checklist
- **Not a Security Measure**: Directives are presentation-only. They do NOT prevent a user from navigating to a URL directly or sending a cURL request.
- **Never Rely Solely on Blade Directives**: Any action behind a Blade directive must also be protected server-side.
- **Information Leakage**: Hiding UI elements does not prevent users from knowing the route exists. Server-side authorization still blocks the action.
- **Super-Admin Visibility**: `Gate::before()` super-admin bypass also affects Blade directives â€” super-admins see everything.

# Reliability Checklist
- [ ] Ensure: Blade authorization directives (`@can`, `@cannot`, `@canany`) provide conditiona...

# Testing Checklist
- [ ] `@can` uses permission names, not role names
- [ ] Policy methods exist for each directive used
- [ ] `@cannot` used for inverse checks (not `@unlesscan`)
- [ ] Fallback content provided with `@else` where appropriate
- [ ] Avoid: Mistake
- [ ] Avoid: Only using @can for security
- [ ] Avoid: Using role names in @can

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Using @can on Routes Without Server-Side Checks**: Hiding UI elements while the underlying route is unprotected
- [ ] Prevent: @can Without @else Fallback**: Not providing fallback content for unauthorized users (blank UI)
- [ ] Prevent: Template-Only Authorization**: All authorization logic in Blade, no controller/middleware enforcement
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only using @can for security
- [ ] Avoid mistake: Using role names in @can
- [ ] Avoid mistake: Complex PHP logic in Blade
- [ ] Avoid mistake: Forgetting model argument

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
- Using @can on Routes Without Server-Side Checks**: Hiding UI elements while the underlying route is unprotected
- @can Without @else Fallback**: Not providing fallback content for unauthorized users (blank UI)
- Template-Only Authorization**: All authorization logic in Blade, no controller/middleware enforcement
## Skills
- Use Blade Authorization Directives for Conditional UI Rendering


