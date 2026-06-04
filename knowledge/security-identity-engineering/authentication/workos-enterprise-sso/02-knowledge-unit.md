# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: WorkOS enterprise SSO / SCIM / directory sync
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

WorkOS provides a managed enterprise SSO abstraction layer that replaces direct SAML/OIDC integration complexity with a single JSON API. Your Laravel app redirects users to WorkOS AuthKit or calls the WorkOS API directly; WorkOS handles SAML/OIDC protocol negotiation with the enterprise IdP (Okta, Azure AD, Google Workspace, etc.) and returns user profile data as JSON. Beyond SSO, WorkOS provides SCIM (System for Cross-domain Identity Management) for automated user provisioning/deprovisioning and directory sync for importing organizational structures. The tradeoff is a third-party dependency for what could be native SAML/OIDC — but the operational savings in IdP compatibility testing are substantial for multi-enterprise SaaS products.

---

# Core Concepts

- **AuthKit**: WorkOS's hosted login UI supporting email/password, magic links, and enterprise SSO (SAML/OIDC) behind one interface.
- **Enterprise SSO API**: Single endpoint — redirect user to WorkOS, receive back `profile` object with `id`, `email`, `firstName`, `lastName`, `organizationId`. WorkOS handles SAML/OIDC protocol details.
- **SCIM**: Automated user provisioning — when a user is added/removed from the enterprise IdP, WorkOS sends a webhook to your app with the user details and action (create, update, deactivate).
- **Directory Sync**: Syncs organizational directory (groups, departments, manager relationships). Useful for authorization (group-based access control).
- **Organization**: WorkOS abstraction for an enterprise customer. Each organization has its own IdP connection(s), SCIM configuration, and directory sync settings.

---

# Mental Models

- **SSO Proxy**: WorkOS sits between your app and 20+ enterprise IdPs. Your app speaks one JSON protocol; WorkOS translates to SAML/OIDC for each IdP. You never touch XML or JWKS directly.
- **Identity as Service**: Instead of building SAML configuration, certificate management, and JWKS caching into your app, you pay WorkOS to handle it. The tradeoff: latency (redirect to WorkOS) + cost + vendor lock-in vs in-house complexity.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| WorkOS vs native SAML/OIDC | Few enterprise customers vs many diverse IdPs | Native SAML/OIDC for 1-2 IdPs (e.g., only Okta). WorkOS for 5+ IdPs or when onboarding new IdPs frequently |
| WorkOS AuthKit vs API-only | Need pre-built SSO UI vs custom UI | AuthKit for rapid deployment; API-only for custom-branded experiences |
| WorkOS SCIM vs custom SCIM endpoint | Automated provisioning needs | WorkOS SCIM if already using WorkOS for SSO; custom SCIM endpoint if not |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| One SSO integration replaces 20+ IdP-specific integrations | Third-party dependency for authentication | If WorkOS has downtime, all enterprise SSO logins fail |
| SCIM webhooks automate user lifecycle | Webhook delivery is not guaranteed | Missed webhooks create stale users. Implement webhook replay and periodic reconciliation |
| No SAML/OIDC debugging needed | API costs scale with MAU | At scale, WorkOS cost may exceed the engineering cost of maintaining native SAML/OIDC |
| Directory sync enables group-based RBAC | Directory structure varies by IdP | Mapping IdP groups to app roles requires per-IdP configuration in WorkOS dashboard |

---

# Performance Considerations

- WorkOS SSO adds one redirect hop (your app → WorkOS → IdP → WorkOS → your app). Typically adds 1-3 seconds to login compared to direct SAML/OIDC.
- SCIM webhooks are asynchronous. Provisioning delay depends on WorkOS sync interval (typically minutes).
- WorkOS API calls from your backend (for profile verification) add 50-200ms per call.

---

# Production Considerations

- **Webhook Security**: WorkOS sends webhooks with a signature header. Verify using `WorkOS\Webhooks\Webhook` utility with your webhook secret. Replay protection via timestamp tolerance.
- **Connection Health**: WorkOS provides a dashboard to monitor IdP connection health. Check periodically. If an IdP certificate expires, WorkOS flags it, but your users see failures first.
- **Session Management**: When using WorkOS SSO, the user's session in your app is independent of the IdP session. IdP-initiated logout (SLO) will not log the user out of your app. Implement your own session timeout.
- **SCIM Mapping**: WorkOS SCIM attributes may not map 1:1 with your User model. Configure attribute mapping in the WorkOS dashboard or transform in your webhook handler.

---

# Common Mistakes

- **Not handling WorkOS API key rotation**: WorkOS API keys can be rotated. If your `.env` has a stale key, SSO initiations and token verifications fail. Use environment variable management.
- **Assuming WorkOS handles session management**: WorkOS authenticates the user once. Your app manages the session duration and expiry. WorkOS does not invalidate your app's sessions.
- **Not implementing webhook idempotency**: WorkOS may deliver the same SCIM webhook twice. Use `id`empotency keys or idempotent database operations (upsert instead of create).
- **Ignoring the `organization_id` in SSO responses**: Multiple enterprise customers may have users with the same email (different orgs). The `organization_id` distinguishes them — use it in your user identity.

---

# Related Knowledge Units

- Prerequisites: SAML 2.0 SSO, OIDC integration (conceptual understanding of enterprise SSO)
- Related: Socialite OAuth client (alternative for consumer SSO), Multi-tenancy security (organization context)
- Advanced Follow-up: WorkOS AuthKit customization, Custom IdP connection management, SCIM attribute reconciliation strategies

---

# Research Notes

- WorkOS provides a Laravel-specific integration guide with helper functions for webhook signature verification and SSO profile resolution.
- The enterprise SSO market is converging on WorkOS and similar products (Stytch, Clerk) as the "API for enterprise identity." Evaluate cost vs in-house SAML/OIDC engineering at projected customer count.
- SCIM is standardized as RFC 7643/7644 but every IdP implements it slightly differently. WorkOS abstracts these differences — one of its strongest value propositions.
- WorkOS supports "magic link" and "email/password" authentication via AuthKit, but these are better handled by Fortify + Sanctum for most apps. WorkOS is primarily valuable for enterprise SSO and SCIM.

## Ecosystem Usage
- **Laravel Sanctum**: Token-based API authentication with ability scoping; integrates via HasApiTokens trait and AuthManager guard registration using iaRequest(). Sanctum provides a dual SPA/token resolution path.
- **Laravel Passport**: Full OAuth2 server implementation using league/oauth2-server; provides Passport guards, token validation middleware, and scope-based authorization. Used for third-party API access delegation.
- **Laravel Fortify**: Headless authentication backend implementing register, login, password reset, email verification, and two-factor authentication. Designed for integration with Vue/React SPAs via API routes.
- **Laravel Jetstream**: Application starter kit combining Fortify, Livewire/Inertia, teams, and Sanctum/Telescope integration. Provides pre-built authentication views.
- **Laravel Breeze**: Minimal authentication scaffolding using Blade or Inertia/Vue/React; provides a lighter alternative to Jetstream with simple authentication views.
- **Spatie Laravel Passkeys**: Adds WebAuthn/passkey support using Laravel's authentication system; registers passkeys as an additional authentication factor compatible with Sanctum and session guards.
- **Socialite**: OAuth1/OAuth2 social login provider for Laravel; supports 20+ providers (Google, GitHub, Facebook, etc.) and allows custom provider implementations via Socialite::extend().
- **WorkOS**: Enterprise SSO integration using SAML and OIDC protocols; provides a Laravel-specific package for directory sync and SSO authentication flows.

## Research Notes
- Sanctum's dual-path resolution (session cookie first, Bearer token fallback) is unique in the PHP ecosystem — most libraries choose one authentication mode exclusively. This dual mode introduces subtle behavior differences: SPA auth supports ability checking, token auth does not.
- Passport 12+ dropped support for password grants in favor of the Authorization Code Grant with PKCE, aligning with OAuth2 Security Best Current Practices (BCP) and deprecating the resource owner password flow.
- Fortify's action-based architecture (actions for login, register, password reset, etc.) allows complete customization of authentication behavior without forking framework code — each action can be overridden via Fortify::loginView() or custom action classes.
- WebAuthn and passkey support in Laravel (via spatie/laravel-passkeys and community packages) relies on PHP's gmp or cmath extensions for cryptographic operations — servers without these extensions cannot validate WebAuthn assertions.
- OIDC integration in Laravel uses Socialite as the primary abstraction for provider interaction, but production SSO systems should use league/oauth2-client directly for better control over provider configuration and token handling.
- SAML SSO for Laravel (via community packages like lightsaml/lightsaml) requires XML signature verification using PHP's openssl extension — the assertion processing pipeline handles XML security, signature verification, and session mapping.
- The uth.guards.providers architecture decouples authentication method from user storage — this enables LDAP, OIDC, SAML, and database-backed authentication to coexist within a single application.
- MFA TOTP (via pragmarx/google2fa-laravel or Fortify's built-in 2FA) generates time-based one-time passwords using HMAC-SHA1 with 30-second windows — the recovery codes provide backup access when the authenticator device is lost.

## Internal Mechanics
- **AuthManager Resolution**: Auth::guard('web') → AuthManager->guard('web') → checks if guard is already resolved in $this->guards array → if not, calls esolve('web') → reads config/auth.php for guard config → factory method (createSessionDriver, createTokenDriver, or custom via extend()) → resolves the provider by name → returns guard instance.
- **SessionGuard Login**: ttempt() fires Attempting event → calls provider etrieveByCredentials() → calls provider alidateCredentials() via Hash::check() → if successful, calls login() → regenerates session ID → fires Login event → updates emember_token if requested. The authenticated user is stored in session by identifier.
- **SessionGuard per-request resolution**: StartSession middleware reads session ID from cookie → hydrates session → uth middleware calls guard->user() → SessionGuard retrieves user ID from session → calls provider->retrieveById(). No password check per request.
- **Sanctum dual-path resolution**: For SPA requests (cookie-based), Sanctum uses the StartSession middleware's session state; for token requests (Bearer), Sanctum uses a RequestGuard closure that reads the token from the Authorization header and validates it against the personal_access_tokens table.
- **Fortify action pipeline**: Each authentication action (login, register, password reset) is a Laravel action class implementing __invoke(). Fortify dispatches through a middleware pipeline before each action, with default middleware handling rate limiting, validation, and authentication.
- **Passport token validation**: Passport registers a custom guard that intercepts the Authorization header, decodes the JWT via league/oauth2-server, validates the token signature, expiry, and scopes, then resolves the authenticated user from the token's sub claim.

## Patterns

- **Defense in depth**: Multiple overlapping security controls (authentication + authorization + encryption + auditing + rate limiting) ensure no single failure compromises the system. Each layer provides backup protection if an outer layer is bypassed.
- **Principle of least privilege**: Grant the minimum permissions necessary for each component. Users get only needed scopes, services get only needed API keys, processes run with minimum OS privileges.
- **Authentication delegation**: Use dedicated authentication services (Fortify, Sanctum, Passport, WorkOS) that handle credential verification, token issuance, and session management. Application code should never handle passwords directly.
- **Authorization as middleware**: Enforce access control at the route/middleware level using gates, policies, and middleware before controller logic executes. This prevents authorization gaps when controllers are called from multiple entry points.
- **Secure defaults**: Configuration should default to the most secure option (HSTS enabled, HTTPS enforced, encryption at rest enabled). Developers must explicitly opt into less secure configurations.

## Failure Modes

- **Authentication bypass**: Missing middleware on route groups allows unauthenticated access to protected endpoints. Use route grouping with consistent middleware application. Test authentication requirements in every deployment.
- **Session fixation**: Without session regeneration after login, an attacker can fixate a session ID and hijack the authenticated session. Always call session()->regenerate() after successful authentication.
- **Token leakage**: API tokens in URL parameters, logs, or error responses expose credentials. Use Authorization header exclusively for token transmission. Sanitize tokens from log output.
- **CSRF bypass**: Missing or misconfigured CSRF token verification allows cross-site request forgery. Ensure VerifyCsrfToken middleware is applied to all state-changing routes.
- **Rate limit exhaustion**: Legitimate users blocked by aggressive rate limiting. Monitor rate limit hit rates and adjust thresholds based on actual traffic patterns. Use tiered rate limiting (guest vs. authenticated vs. admin).
- **Security header misconfiguration**: Incorrect CSP directives can block legitimate resources or leave vulnerabilities open. Use reporting endpoints (eport-uri/eport-to) to monitor CSP violations without blocking content.
