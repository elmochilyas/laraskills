# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** WorkOS enterprise SSO / SCIM / directory sync
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Bypassing WorkOS for Direct IdP Integration**: Integrating directly with each customer's IdP instead of using WorkOS as the abstraction layer
- [ ] Prevent anti-pattern: Hardcoded WorkOS Credentials**: Committing API keys or client IDs to version control
- [ ] Prevent anti-pattern: Unhandled IdP Errors**: Not catching WorkOS authentication exceptions when customer IdPs are misconfigured
- [ ] WorkOS API key and client ID configured in services config
- [ ] SSO redirect route generates correct WorkOS authorization URL
- [ ] SSO callback route exchanges code for user profile
- [ ] Users matched by email, not by IdP-specific ID
- [ ] Local session/token created (WorkOS token not leaked to client)
- [ ] Avoid: Mistake
- [ ] Avoid: Not matching users by email
- [ ] Avoid: Passing WorkOS tokens directly to client

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `workos/workos-php` SDK via Composer
- Configure WorkOS API key and client ID in `.env`
- SSO flow: redirect to WorkOS â†’ customer IdP login â†’ WorkOS callback â†’ local session creation
- Directory sync: register webhook endpoints for SCIM events â†’ process user provisioning
- Organization context: store WorkOS `organization_id` on the User model for tenancy routing
- User matching: use `external_id` (WorkOS user ID) or email for linking

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] WorkOS API key and client ID configured in services config
- [ ] - [ ] SSO redirect route generates correct WorkOS authorization URL
- [ ] - [ ] SSO callback route exchanges code for user profile
- [ ] - [ ] Users matched by email, not by IdP-specific ID

# Performance Checklist
- SSO redirect adds IdP authentication latency (typically 1-5 seconds for enterprise IdPs)
- WorkOS API calls for user info â€” cache WorkOS user data with short TTL
- Directory sync is event-driven (webhook) â€” no impact on request performance

# Security Checklist
- **WorkOS API Key**: Protect the API key â€” scoped to your WorkOS environment. Rotate if compromised.
- **Webhook Verification**: Verify WorkOS webhook signatures using the webhook secret. Do not process unverified webhooks.
- **Session Security**: After WorkOS SSO, create a proper Laravel session or token. Do not pass WorkOS tokens directly to the client.
- **SCIM Security**: SCIM webhooks contain sensitive user data â€” process over HTTPS only.

# Reliability Checklist
- [ ] Ensure: WorkOS provides a managed enterprise SSO service that abstracts the complexity o...

# Testing Checklist
- [ ] WorkOS API key and client ID configured in services config
- [ ] SSO redirect route generates correct WorkOS authorization URL
- [ ] SSO callback route exchanges code for user profile
- [ ] Users matched by email, not by IdP-specific ID
- [ ] Local session/token created (WorkOS token not leaked to client)
- [ ] Directory sync webhook endpoint configured with signature verification
- [ ] Avoid: Mistake
- [ ] Avoid: Not matching users by email
- [ ] Avoid: Passing WorkOS tokens directly to client

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Bypassing WorkOS for Direct IdP Integration**: Integrating directly with each customer's IdP instead of using WorkOS as the abstraction layer
- [ ] Prevent: Hardcoded WorkOS Credentials**: Committing API keys or client IDs to version control
- [ ] Prevent: Unhandled IdP Errors**: Not catching WorkOS authentication exceptions when customer IdPs are misconfigured
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not matching users by email
- [ ] Avoid mistake: Passing WorkOS tokens directly to client
- [ ] Avoid mistake: Not handling webhook verification
- [ ] Avoid mistake: Ignoring directory sync events

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
- Bypassing WorkOS for Direct IdP Integration**: Integrating directly with each customer's IdP instead of using WorkOS as the abstraction layer
- Hardcoded WorkOS Credentials**: Committing API keys or client IDs to version control
- Unhandled IdP Errors**: Not catching WorkOS authentication exceptions when customer IdPs are misconfigured
## Skills
- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On


