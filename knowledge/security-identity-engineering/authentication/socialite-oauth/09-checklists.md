# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Socialite OAuth1/OAuth2 client
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Hardcoded Provider Credentials**: Embedding client IDs and secrets in controllers or routes
- [ ] Prevent anti-pattern: Missing Token Storage**: Discarding provider access/refresh tokens that could be used for API calls
- [ ] Prevent anti-pattern: Community Provider Without Maintenance Check**: Installing community providers without verifying maintenance activity
- [ ] Provider credentials configured in `config/services.php` (not hardcoded)
- [ ] Stateless mode for API-driven OAuth (`->stateless()`)
- [ ] Error handling for provider exceptions (catch and redirect with message)
- [ ] Provider email verified before accepting as verified email
- [ ] `social_accounts` pivot table for multiple providers
- [ ] Avoid: Mistake
- [ ] Avoid: Not handling provider errors
- [ ] Avoid: Using stateful for API auth

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Socialite handles the OAuth handshake only â€” user creation/matching is your responsibility
- `user()` call returns token + profile data. Use the token for API calls to the provider.
- Provider-specific options via `with()` method: `Socialite::driver('google')->with(['hd' => 'company.com'])`.
- Community providers use SocialiteProviders manager â€” install the provider-specific package and register its listener.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Provider credentials configured in `config/services.php` (not hardcoded)
- [ ] - [ ] Stateless mode for API-driven OAuth (`->stateless()`)
- [ ] - [ ] Error handling for provider exceptions (catch and redirect with message)
- [ ] - [ ] Provider email verified before accepting as verified email

# Performance Checklist
- Socialite adds provider redirect latency (user leaves your app, authenticates, returns)
- Token exchange: one HTTP request to the provider per login
- User profile retrieval: one HTTP request per login
- No persistent overhead â€” once authenticated, the application uses its own auth session/token

# Security Checklist
- **State Parameter**: Protects against CSRF on the OAuth callback. Socialite handles this in stateful mode. Stateless mode skips this â€” ensure your own CSRF protection.
- **HTTPS**: All redirect URLs must be HTTPS. Some providers (Apple) require HTTPS for the callback.
- **Email Verification**: Provider-returned emails may not be verified. Verify emails from OAuth providers (most verified providers mark `email_verified`).
- **Account Hijacking**: If a provider account is compromised, the linked Laravel account is at risk. Consider MFA for OAuth-linked accounts.

# Reliability Checklist
- [ ] Ensure: Laravel Socialite is an OAuth1/OAuth2 client for "Sign in with Google/GitHub/App...

# Testing Checklist
- [ ] Provider credentials configured in `config/services.php` (not hardcoded)
- [ ] Stateless mode for API-driven OAuth (`->stateless()`)
- [ ] Error handling for provider exceptions (catch and redirect with message)
- [ ] Provider email verified before accepting as verified email
- [ ] `social_accounts` pivot table for multiple providers
- [ ] Password/email auth fallback maintained
- [ ] Avoid: Mistake
- [ ] Avoid: Not handling provider errors
- [ ] Avoid: Using stateful for API auth

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Hardcoded Provider Credentials**: Embedding client IDs and secrets in controllers or routes
- [ ] Prevent: Missing Token Storage**: Discarding provider access/refresh tokens that could be used for API calls
- [ ] Prevent: Community Provider Without Maintenance Check**: Installing community providers without verifying maintenance activity
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not handling provider errors
- [ ] Avoid mistake: Using stateful for API auth
- [ ] Avoid mistake: Not verifying provider email
- [ ] Avoid mistake: Making social login the only auth method

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
- Hardcoded Provider Credentials**: Embedding client IDs and secrets in controllers or routes
- Missing Token Storage**: Discarding provider access/refresh tokens that could be used for API calls
- Community Provider Without Maintenance Check**: Installing community providers without verifying maintenance activity
## Skills
- Configure Socialite OAuth Client for Social Login and Third-Party OAuth


