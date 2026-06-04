# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Laravel Auth guards and providers architecture
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Copy-Paste Auth Configs**: Reusing the same auth.php without adjusting guard configurations per environment
- [ ] Prevent anti-pattern: Provider Misalignment**: Provider driver says `eloquent` but custom provider class registered â€” silent fallback to Eloquent
- [ ] Prevent anti-pattern: Missing Guard Tests**: No integration tests verifying each guard authenticates correctly under its intended strategy
- [ ] Separate guards for each user type with correct drivers
- [ ] Each guard has a corresponding provider defined
- [ ] Default guard matches primary auth use case
- [ ] Route middleware explicitly specifies guard names
- [ ] Custom providers implement `UserProvider` contract
- [ ] Avoid: Mistake
- [ ] Avoid: Using same guard for web and API
- [ ] Avoid: Modifying `providers.users.model` for multi-tenancy

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Guard-provider separation allows mixing strategies (session for web, tokens for API)
- User providers must return a `Illuminate\Contracts\Auth\Authenticatable` implementation
- The `Authenticatable` contract requires `getAuthIdentifierName()`, `getAuthIdentifier()`, `getAuthPassword()`, `getRememberToken()`, `setRememberToken()`, `getRememberTokenName()`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Separate guards for each user type with correct drivers
- [ ] - [ ] Each guard has a corresponding provider defined
- [ ] - [ ] Default guard matches primary auth use case
- [ ] - [ ] Route middleware explicitly specifies guard names

# Performance Checklist
- Guard resolution is cached after first request â€” negligible overhead
- Provider queries depend on the data source (Eloquent adds DB query, custom providers vary)
- Session guard requires session read on every request â€” use Redis for session storage in production

# Security Checklist
- **Guard Confusion**: Misconfiguring which guard protects which route is a common auth bypass. Each guard should clearly map to a route group.
- **Default Guard Risks**: If the default guard is `web` but API routes are not explicitly guarding with `sanctum`, API routes may incorrectly use session auth.
- **Provider Security**: Custom providers must validate credentials securely (hash verification, no plaintext passwords).

# Reliability Checklist
- [ ] Ensure: Laravel's authentication architecture is built on two abstractions: **guards** (...

# Testing Checklist
- [ ] Separate guards for each user type with correct drivers
- [ ] Each guard has a corresponding provider defined
- [ ] Default guard matches primary auth use case
- [ ] Route middleware explicitly specifies guard names
- [ ] Custom providers implement `UserProvider` contract
- [ ] `web` guard uses `session` driver â€” not modified
- [ ] Avoid: Mistake
- [ ] Avoid: Using same guard for web and API
- [ ] Avoid: Modifying `providers.users.model` for multi-tenancy

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Copy-Paste Auth Configs**: Reusing the same auth.php without adjusting guard configurations per environment
- [ ] Prevent: Provider Misalignment**: Provider driver says `eloquent` but custom provider class registered â€” silent fallback to Eloquent
- [ ] Prevent: Missing Guard Tests**: No integration tests verifying each guard authenticates correctly under its intended strategy
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using same guard for web and API
- [ ] Avoid mistake: Modifying `providers.users.model` for multi-tenancy
- [ ] Avoid mistake: Not specifying guard in routes

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
- Copy-Paste Auth Configs**: Reusing the same auth.php without adjusting guard configurations per environment
- Provider Misalignment**: Provider driver says `eloquent` but custom provider class registered â€” silent fallback to Eloquent
- Missing Guard Tests**: No integration tests verifying each guard authenticates correctly under its intended strategy
## Skills
- Configure Auth Guards and Providers for Multi-Strategy Authentication


