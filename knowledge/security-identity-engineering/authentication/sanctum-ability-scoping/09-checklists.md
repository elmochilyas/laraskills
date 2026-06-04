# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Sanctum ability-based token scoping
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Unlimited Token Creation**: No per-user limits allowing token sprawl and database bloat
- [ ] Prevent anti-pattern: Ability as Sole Auth Layer**: Using abilities without Gates/Policies, missing user-scope restrictions
- [ ] Prevent anti-pattern: Stale Token Proliferation**: No pruning of tokens never used or expired
- [ ] Abilities use `resource:action` format (not role names)
- [ ] `tokenCan()` checked in controllers for token-protected routes
- [ ] Gates/Policies used alongside `tokenCan()` for user-level authorization
- [ ] SPA cookie auth routes do not use `tokenCan()`
- [ ] Explicit abilities array on every `createToken()` call
- [ ] Avoid: Mistake
- [ ] Avoid: Using role names as abilities
- [ ] Avoid: Only checking ability in one place

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Abilities are stored in the `personal_access_tokens` table as a JSON `abilities` column
- `tokenCan()` checks if an ability exists in the token's abilities array
- A token with no abilities means "check with the user's full permissions" (not "no permissions")
- SPA cookie auth bypasses ability checking (uses session, not token)
- Create custom middleware for reusable ability checks: `php artisan make:middleware CheckTokenAbility`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Abilities use `resource:action` format (not role names)
- [ ] - [ ] `tokenCan()` checked in controllers for token-protected routes
- [ ] - [ ] Gates/Policies used alongside `tokenCan()` for user-level authorization
- [ ] - [ ] SPA cookie auth routes do not use `tokenCan()`

# Performance Checklist
- `tokenCan()` is an in-memory check against the token's abilities array â€” negligible overhead
- Token retrieval (from database or cache) is the primary cost
- No additional database queries for ability checking

# Security Checklist
- **Abilities vs User Permissions**: Abilities restrict what a token can do. They complement user authorization â€” a token with `'admin'` ability only bypasses token-level checks, not Gate/Policy authorization.
- **Token Without Abilities**: A token created with no abilities array defaults to allowing all actions. Be explicit.
- **SPA Session Bypass**: SPA cookie auth does not use tokens â€” `tokenCan()` is not applicable. SPA sessions use the user's full permissions.
- **Token Leakage**: A leaked API token exposes only its permitted abilities, not the user's full access.

# Reliability Checklist
- [ ] Ensure: Sanctum's ability-based token scoping allows API tokens to have granular permiss...

# Testing Checklist
- [ ] Abilities use `resource:action` format (not role names)
- [ ] `tokenCan()` checked in controllers for token-protected routes
- [ ] Gates/Policies used alongside `tokenCan()` for user-level authorization
- [ ] SPA cookie auth routes do not use `tokenCan()`
- [ ] Explicit abilities array on every `createToken()` call
- [ ] Unused tokens pruned and per-user limit enforced
- [ ] Avoid: Mistake
- [ ] Avoid: Using role names as abilities
- [ ] Avoid: Only checking ability in one place

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Unlimited Token Creation**: No per-user limits allowing token sprawl and database bloat
- [ ] Prevent: Ability as Sole Auth Layer**: Using abilities without Gates/Policies, missing user-scope restrictions
- [ ] Prevent: Stale Token Proliferation**: No pruning of tokens never used or expired
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using role names as abilities
- [ ] Avoid mistake: Only checking ability in one place
- [ ] Avoid mistake: Empty abilities array means no access
- [ ] Avoid mistake: Relying solely on abilities for authorization

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
- Unlimited Token Creation**: No per-user limits allowing token sprawl and database bloat
- Ability as Sole Auth Layer**: Using abilities without Gates/Policies, missing user-scope restrictions
- Stale Token Proliferation**: No pruning of tokens never used or expired
## Skills
- Scope Sanctum API Tokens with Abilities for Granular Access Control


