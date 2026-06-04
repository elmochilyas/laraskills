# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Laravel Starter Kits (React, Vue, Svelte, Livewire - current)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Forking Starter Kit code instead of extending**: Creates maintenance burden when upgrading.
- [ ] Prevent anti-pattern: Choosing kit by popularity, not team expertise**: React kit for a team that only knows Livewire.
- [ ] Prevent anti-pattern: Not pinning pre-1.0 passkeys version**: Breaking changes deployed automatically.
- [ ] Starter kit selected based on project requirements
- [ ] Appropriate frontend stack chosen (Blade, Livewire, React, Vue)
- [ ] Auth flows tested (login, register, password reset)
- [ ] Additional features configured (2FA, teams, API tokens if Jetstream)
- [ ] Build pipeline works (npm, Vite, migrations)
- [ ] Avoid: Mistake
- [ ] Avoid: Modifying vendor-published Fortify files
- [ ] Avoid: Choosing wrong frontend stack

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Installation: `composer create-project laravel/laravel` â†’ `php artisan install:api` â†’ `php artisan install:react|vue|svelte|livewire`
- Backend is identical across all kits â€” only frontend files differ
- Fortify actions handle all authentication logic â€” upgrade-safe via Composer
- Starter Kit views are published and modifiable; backend actions are customizable via Fortify's action pattern

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Starter kit selected based on project requirements
- [ ] - [ ] Appropriate frontend stack chosen (Blade, Livewire, React, Vue)
- [ ] - [ ] Auth flows tested (login, register, password reset)
- [ ] - [ ] Additional features configured (2FA, teams, API tokens if Jetstream)

# Performance Checklist
- Starter Kits add minimal overhead â€” Fortify, Sanctum, and Passkeys are lazy-loaded
- Frontend assets are built with Vite â€” production builds are optimized
- Authentication requests: 5-50ms for credential verification, session creation, token generation

# Security Checklist
- **Upgrade-Safe Auth**: Because Fortify handles auth logic, security patches are received via Composer updates â€” not manual file patches.
- **Passkeys Pre-1.0**: Monitor for breaking changes in `laravel/passkeys` API during upgrades.
- **Basic Authentication Tests**: Starter Kits provide basic auth tests. Extend coverage for custom auth flows.
- **No Teams or API Tokens**: Starter Kits do not include teams or API token management â€” build separately if needed.

# Reliability Checklist
- [ ] Ensure: Laravel 12/13 Starter Kits are the current recommended authentication scaffoldin...

# Testing Checklist
- [ ] Starter kit selected based on project requirements
- [ ] Appropriate frontend stack chosen (Blade, Livewire, React, Vue)
- [ ] Auth flows tested (login, register, password reset)
- [ ] Additional features configured (2FA, teams, API tokens if Jetstream)
- [ ] Build pipeline works (npm, Vite, migrations)
- [ ] Avoid: Mistake
- [ ] Avoid: Modifying vendor-published Fortify files
- [ ] Avoid: Choosing wrong frontend stack

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Forking Starter Kit code instead of extending**: Creates maintenance burden when upgrading.
- [ ] Prevent: Choosing kit by popularity, not team expertise**: React kit for a team that only knows Livewire.
- [ ] Prevent: Not pinning pre-1.0 passkeys version**: Breaking changes deployed automatically.
- [ ] Prevent: Expecting Jetstream features (teams, API tokens) in Starter Kits**: These must be built separately.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Modifying vendor-published Fortify files
- [ ] Avoid mistake: Choosing wrong frontend stack
- [ ] Avoid mistake: Expecting Jetstream features
- [ ] Avoid mistake: Not enabling passkey feature

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
- Forking Starter Kit code instead of extending**: Creates maintenance burden when upgrading.
- Choosing kit by popularity, not team expertise**: React kit for a team that only knows Livewire.
- Not pinning pre-1.0 passkeys version**: Breaking changes deployed automatically.
- Expecting Jetstream features (teams, API tokens) in Starter Kits**: These must be built separately.
## Skills
- Select and Configure Laravel Starter Kits for Auth Scaffolding


