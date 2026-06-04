# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** SAML 2.0 SSO via SocialiteProviders
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Missing Clock Skew**: Strict timestamp validation without 5-minute grace window causes intermittent SSO failures
- [ ] Prevent anti-pattern: Hardcoded ACS URL**: Not using `route()` helper generates brittle SAML configuration
- [ ] Prevent anti-pattern: No IdP-Initiated SSO Support**: Enterprise users expecting portal-based app launch find the flow broken
- [ ] IdP metadata imported (not manually configured endpoints)
- [ ] Assertion XML signature validated on every login
- [ ] Timestamp validation with 5-minute clock skew
- [ ] Audience restriction validated against SP entity ID
- [ ] ACS URL stable and generated via `route()` helper
- [ ] Avoid: Mistake
- [ ] Avoid: Not validating assertion signature
- [ ] Avoid: Hardcoding ACS URL

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `socialiteproviders/saml2` via Composer and register the provider
- Configure SP entity ID, ACS URL, and certificate in `config/services.php`
- Import IdP metadata (or manually configure IdP endpoints and certificate)
- SP-initiated flow: route â†’ Socialite redirect to IdP â†’ IdP login â†’ callback â†’ assertion processing â†’ user login/registration
- IdP-initiated flow: IdP POSTs assertion to ACS URL â†’ process assertion â†’ match/create user â†’ start session

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] IdP metadata imported (not manually configured endpoints)
- [ ] - [ ] Assertion XML signature validated on every login
- [ ] - [ ] Timestamp validation with 5-minute clock skew
- [ ] - [ ] Audience restriction validated against SP entity ID

# Performance Checklist
- SAML assertion verification: XML signature validation + timestamp checks + attribute extraction â€” ~10-50ms
- IdP redirect adds network latency (user redirected to IdP, authenticates, redirected back)
- Metadata is cached â€” no repeated IdP fetch

# Security Checklist
- **Assertion Signature**: Always validate the XML signature against the IdP's certificate. Unsigned assertions must be rejected.
- **Timestamps**: Validate `NotBefore` and `NotOnOrAfter` conditions. Clock skew allowance (typically 5 minutes).
- **Audience Restriction**: Validate the `Audience` element matches your SP entity ID.
- **Recipient Check**: Validate the `SubjectConfirmationData Recipient` matches your ACS URL.
- **Replay Prevention**: Validate `AssertionID` against previously processed assertions (store used assertion IDs).
- **HTTPS**: All SAML endpoints must be HTTPS. SAML assertions contain sensitive identity data.

# Reliability Checklist
- [ ] Ensure: SAML 2.0 integration in Laravel is primarily handled through `SocialiteProviders...

# Testing Checklist
- [ ] IdP metadata imported (not manually configured endpoints)
- [ ] Assertion XML signature validated on every login
- [ ] Timestamp validation with 5-minute clock skew
- [ ] Audience restriction validated against SP entity ID
- [ ] ACS URL stable and generated via `route()` helper
- [ ] Replay prevention (processed assertion IDs tracked)
- [ ] Avoid: Mistake
- [ ] Avoid: Not validating assertion signature
- [ ] Avoid: Hardcoding ACS URL

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Missing Clock Skew**: Strict timestamp validation without 5-minute grace window causes intermittent SSO failures
- [ ] Prevent: Hardcoded ACS URL**: Not using `route()` helper generates brittle SAML configuration
- [ ] Prevent: No IdP-Initiated SSO Support**: Enterprise users expecting portal-based app launch find the flow broken
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not validating assertion signature
- [ ] Avoid mistake: Hardcoding ACS URL
- [ ] Avoid mistake: Ignoring clock skew
- [ ] Avoid mistake: Skipping IdP-specific testing

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
- Missing Clock Skew**: Strict timestamp validation without 5-minute grace window causes intermittent SSO failures
- Hardcoded ACS URL**: Not using `route()` helper generates brittle SAML configuration
- No IdP-Initiated SSO Support**: Enterprise users expecting portal-based app launch find the flow broken
## Skills
- Implement SAML 2.0 SSO for Enterprise Authentication


