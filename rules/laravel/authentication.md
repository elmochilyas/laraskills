---
paths:
  - "**/*.php"
  - "**/config/auth.php"
  - "**/config/sanctum.php"
  - "**/config/passport.php"
  - "**/config/cors.php"
  - "**/config/session.php"
  - "**/routes/*.php"
  - "**/app/Policies/*.php"
  - "**/app/Exceptions/*.php"
---
# Laravel 13 Authentication & Authorization

> This file extends common/security.md and php/security.md with Laravel 13 specific authentication and authorization rules.

## Authentication General

- All API routes must have authentication middleware by default; public endpoints must be explicitly whitelisted
- Use `database` or `redis` session driver in production — never `file`
- Session must be regenerated on login, logout, and privilege escalation (`session()->regenerate(true)`)
- Session cookies must be `Secure`, `HttpOnly`, `SameSite=Strict`
- Rate limit all auth endpoints: login (5/min per email+IP), registration (3/hour per IP), password reset (5/hour per IP)
- Account lockout after 5 failed attempts with minimum 15-minute duration
- Error messages must not reveal user existence — use generic "Invalid credentials"
- Password hashing must use bcrypt (12+ rounds) or argon2id — never MD5, SHA1, or custom algorithms

## Sanctum

- Token abilities must be scoped — never use `['*']`
- Always set token expiration (`SANCTUM_TOKEN_EXPIRATION`)
- Return `plainTextToken` exactly once — on creation only
- SPA auth must call `sanctum/csrf-cookie` before login
- CORS `allowed_origins` must be explicit URLs, never `*` when credentials are used
- Token pruning command must be registered (`sanctum:prune-expired`)
- Device metadata (IP, user agent, device name) must be stored with tokens

## Passport / OAuth2

- Never use the password grant type — always prefer Authorization Code + PKCE
- PKCE is mandatory for all public clients (SPAs, mobile apps)
- Access token TTL must be 15 minutes or less
- Refresh token rotation must be enabled
- Redirect URIs must be validated by exact match — no wildcards
- Scopes must be validated on authorization request and resource access
- RSA keys must be generated during deployment, not at runtime

## JWT

- All tokens must include `iss`, `aud`, `sub`, `exp`, `iat`, `jti` claims
- Use asymmetric algorithms (RS256, ES256, EdDSA) — never HS256 in multi-service environments
- Validate algorithm against an explicit whitelist — never trust the JWT header alone
- Access token TTL must be 15 minutes or less
- Implement token blacklisting with TTL-matched Redis keys
- Refresh tokens must use rotation — invalidate old token on each refresh
- Never put sensitive data (passwords, secrets, PII) in JWT payload

## OpenID Connect

- Always request `openid` scope to receive an ID Token
- Validate ID Token signature, issuer, audience, expiration, and nonce
- Require `email_verified: true` before creating local accounts
- Use discovery documents, never hardcode endpoint URLs
- Implement UserInfo endpoint for additional claims

## Authorization

- Every Eloquent model must have a corresponding Policy class
- Policy `before()` method must only handle super-admin — all other logic in method-specific checks
- All controller state-changing operations must use `$this->authorize()` or `Gate::authorize()`
- FormRequest `authorize()` must delegate to a Policy — never inline authorization logic
- Permission names must follow `{resource}:{action}` convention
- Cache resolved permissions with user-level cache keys; invalidate on role/permission changes

## Roles & Permissions

- Roles group permissions — never use a role name as a permission check
- Direct permissions must be supported alongside role-based permissions
- Role hierarchy must be explicitly defined in code, not just in database
- Permission caching must be invalidated on any role or permission change
- All permissions must be seeded idempotently

## Multi-Tenant

- Every query must include tenant scope — global TenantScope on all tenant-scoped models
- Tenant context must be resolved from secure sources (subdomain, path, auth), never from user input
- API tokens must be bound to a specific tenant
- Cache keys must include tenant ID prefix
- Session tenant must be validated on every request

## SSO

- Always validate IdP response signature, issuer, audience, and timestamps
- Validate state parameter on every OAuth/OIDC callback (CSRF protection)
- Implement Single Logout (SLO) — propagate logout to IdP
- JIT provisioning must be supported with attribute mapping from IdP claims
- Link accounts by verified email or `sub` claim — never by name alone

## Security

- MFA must be enforced for all admin accounts
- WebAuthn/Passkeys must use resident credentials with user verification
- Adaptive/risk-based authentication must consider device, location, time, and behavior
- Step-up authentication must be required for sensitive operations (password change, payment method, account deletion)

## Testing

- Every Policy method must have both `can` and `cannot` test cases
- Every auth endpoint must have positive (200) and negative (401/403) test cases
- Rate limiting must be tested with exact attempt counts
- Tenant isolation must be tested with cross-tenant access attempts
- Token lifecycle (create, validate, refresh, revoke, expire) must be tested end-to-end
- Architecture tests (Pest) must enforce auth patterns

## Reference

See skill: `laravel-authentication` for comprehensive authentication and authorization skill files.
See skill: `laravel-security` for general Laravel security patterns.
See agent: `laravel-authentication` for authentication implementation tasks.
See agent: `laravel-identity-architecture` for enterprise IAM architecture tasks.
