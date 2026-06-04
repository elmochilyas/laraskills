# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Signed URLs and signed routes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Expiry on Temporary URLs**: `temporarySignedRoute` with `addYears(1)` is effectively permanent
- [ ] Prevent anti-pattern: No Friendly Error for Invalid Signatures**: Users see generic 403, no recovery option
- [ ] Prevent anti-pattern: APP_KEY Rotation Breaks All Signed URLs**: No migration plan for existing signed URLs
- [ ] `signed` middleware applied to protected routes
- [ ] Temporary signed URLs have appropriate expiration
- [ ] Signature tampering results in 403 (not data exposure)
- [ ] Expired signatures show user-friendly error message
- [ ] APP_KEY is not rotated while signed URLs are in-flight (or rotation handled)
- [ ] Avoid: Mistake
- [ ] Avoid: Using permanent signed URLs for sensitive actions
- [ ] Avoid: Forgetting `signed` middleware

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Signed routes: define in `routes/web.php` or `routes/api.php` with `signed` middleware
- Email verification: Laravel uses signed URLs by default â€” customize via `VerificationUrl` callback
- Temporary routes: set `$expiry` as `now()->addMinutes(60)` â€” long enough for user action, short enough for security
- Relative signatures: `hasValidRelativeSignature()` for subdomain-independent URLs
- Signature parameters: add custom parameters to the route â€” they are included in the signature

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `signed` middleware applied to protected routes
- [ ] - [ ] Temporary signed URLs have appropriate expiration
- [ ] - [ ] Signature tampering results in 403 (not data exposure)
- [ ] - [ ] Expired signatures show user-friendly error message

# Performance Checklist
- Signed URL generation: HMAC computation â€” <0.01ms â€” negligible
- Signature validation: one HMAC computation per request â€” <0.01ms
- No database queries â€” purely cryptographic
- Temporary signed URL expiry: checked against `expires` query parameter â€” simple timestamp comparison

# Security Checklist
- **Key Dependency**: Signed URLs depend on APP_KEY. Rotating APP_KEY invalidates all existing signed URLs.
- **Permanent vs Temporary**: Permanent signed URLs never expire â€” use them carefully (unsubscribe links acceptable; password reset links not).
- **`expires` Parameter**: The expiry timestamp is part of the URL â€” visible to the user. Not a secret, but tamper-proof via signature.
- **Replay Prevention**: Signed URLs can be replayed until expiry. For one-time use, track consumed signatures server-side.
- **URL Content**: Signed URLs include parameters in the URL â€” avoid including sensitive data (tokens, secrets) in URL parameters.

# Reliability Checklist
- [ ] Ensure: Laravel signed URLs provide a way to generate URLs that are cryptographically si...

# Testing Checklist
- [ ] `signed` middleware applied to protected routes
- [ ] Temporary signed URLs have appropriate expiration
- [ ] Signature tampering results in 403 (not data exposure)
- [ ] Expired signatures show user-friendly error message
- [ ] APP_KEY is not rotated while signed URLs are in-flight (or rotation handled)
- [ ] Avoid: Mistake
- [ ] Avoid: Using permanent signed URLs for sensitive actions
- [ ] Avoid: Forgetting `signed` middleware

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Expiry on Temporary URLs**: `temporarySignedRoute` with `addYears(1)` is effectively permanent
- [ ] Prevent: No Friendly Error for Invalid Signatures**: Users see generic 403, no recovery option
- [ ] Prevent: APP_KEY Rotation Breaks All Signed URLs**: No migration plan for existing signed URLs
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using permanent signed URLs for sensitive actions
- [ ] Avoid mistake: Forgetting `signed` middleware
- [ ] Avoid mistake: Including sensitive data in URL parameters
- [ ] Avoid mistake: Not handling invalid signatures

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
- No Expiry on Temporary URLs**: `temporarySignedRoute` with `addYears(1)` is effectively permanent
- No Friendly Error for Invalid Signatures**: Users see generic 403, no recovery option
- APP_KEY Rotation Breaks All Signed URLs**: No migration plan for existing signed URLs
## Skills
- Generate and Verify Signed URLs for Tamper-Proof Links


