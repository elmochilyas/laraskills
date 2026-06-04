# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Laravel Breeze auth scaffolding (legacy context)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Rolling custom auth alongside Breeze**: Building duplicate auth logic on top of scaffolding.
- [ ] Prevent anti-pattern: Staying on Breeze indefinitely**: Increasing maintenance burden as Laravel evolves away from published-controller pattern.
- [ ] Prevent anti-pattern: Assuming composer update patches Breeze controllers**: Published files in `app/` are not updated by Composer.
- [ ] Breeze installed with chosen frontend stack
- [ ] Auth routes functional (login, register, password reset)
- [ ] Email verification configured and working
- [ ] Profile update page functional
- [ ] NPM dependencies installed and built
- [ ] Avoid: Mistake
- [ ] Avoid: Using Breeze for new projects
- [ ] Avoid: Not applying security patches

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Breeze's architecture places authentication logic directly in application controllers (`app/Http/Controllers/Auth/`)
- Fortify's action pattern (`App\Actions\Fortify\*`) provides upgrade-safe customization
- Migration path: Breeze â†’ Fortify headless backend â†’ Starter Kit frontend

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Breeze installed with chosen frontend stack
- [ ] - [ ] Auth routes functional (login, register, password reset)
- [ ] - [ ] Email verification configured and working
- [ ] - [ ] Profile update page functional

# Performance Checklist
- Breeze adds negligible overhead â€” controllers are loaded from the application namespace
- Rate limiting on login (5 attempts/minute by default) is included but may need tuning

# Security Checklist
- **Manual Security Patches**: Security fixes from Laravel (e.g., rate limiting on login) do not automatically apply to published controllers
- **Password Confirmation**: Breeze includes password confirmation middleware for sensitive routes
- **Email Verification**: Enabled by default in Breeze â€” do not disable in production

# Reliability Checklist
- [ ] Ensure: Laravel Breeze was the minimal authentication scaffolding package (pre-Laravel 1...

# Testing Checklist
- [ ] Breeze installed with chosen frontend stack
- [ ] Auth routes functional (login, register, password reset)
- [ ] Email verification configured and working
- [ ] Profile update page functional
- [ ] NPM dependencies installed and built
- [ ] Blade/Livewire/React/Vue components customized as needed
- [ ] Avoid: Mistake
- [ ] Avoid: Using Breeze for new projects
- [ ] Avoid: Not applying security patches

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Rolling custom auth alongside Breeze**: Building duplicate auth logic on top of scaffolding.
- [ ] Prevent: Staying on Breeze indefinitely**: Increasing maintenance burden as Laravel evolves away from published-controller pattern.
- [ ] Prevent: Assuming composer update patches Breeze controllers**: Published files in `app/` are not updated by Composer.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using Breeze for new projects
- [ ] Avoid mistake: Not applying security patches
- [ ] Avoid mistake: Modifying Breeze controllers extensively

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
- Rolling custom auth alongside Breeze**: Building duplicate auth logic on top of scaffolding.
- Staying on Breeze indefinitely**: Increasing maintenance burden as Laravel evolves away from published-controller pattern.
- Assuming composer update patches Breeze controllers**: Published files in `app/` are not updated by Composer.
## Skills
- Scaffold Authentication with Laravel Breeze


