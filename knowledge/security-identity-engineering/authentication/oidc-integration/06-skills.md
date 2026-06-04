# Skill: Integrate OpenID Connect (OIDC) for Enterprise Single Sign-On

## Purpose
Implement OIDC-based authentication in Laravel via Socialite to enable enterprise SSO with identity providers like Azure AD, Okta, Keycloak, and Auth0.

## When To Use
- Enterprise applications needing standardized SSO with identity claims
- Integration with OIDC-supporting IdPs (Azure AD, Okta, Keycloak, Google, Auth0)
- Migration from SAML to OIDC (modern, simpler protocol)
- Applications requiring JWT-based identity tokens for downstream consumption

## When NOT To Use
- Simple social login (use Socialite's first-party providers)
- When SAML 2.0 is already deployed and working in the enterprise
- When IdP does not support OIDC (some legacy IdPs)

## Prerequisites
- Laravel with Socialite installed (`composer require laravel/socialite`)
- OIDC provider credentials (client ID, client secret, tenant, discovery URL)
- OIDC Socialite driver or custom driver for the specific IdP

## Inputs
- IdP discovery URL (`/.well-known/openid-configuration`)
- Client ID, client secret, and redirect URI
- Required scopes (`openid`, `profile`, `email`)
- JWKS caching strategy (TTL in seconds)
- Nonce generation mechanism

## Workflow (numbered)
1. Register OIDC provider in `config/services.php` with credentials and scopes
2. Install or configure the OIDC Socialite driver for the target IdP
3. Configure discovery URL loading for dynamic endpoint resolution
4. Implement nonce generation: random string stored in session, validated on callback
5. Fetch and cache JWKS keys from IdP's `jwks_uri` with appropriate TTL
6. Validate `id_token` signature using cached JWKS on every callback
7. Validate `aud` claim matches client ID and check `exp` for expiry
8. Implement refresh token flow for token renewal
9. Build user matching/creation logic from OIDC claims (`sub`, `email`, `name`)

## Validation Checklist
- [ ] `id_token` signature validated using JWKS on every callback
- [ ] Nonce parameter generated and validated for replay protection
- [ ] JWKS cached with TTL aligned with IdP key rotation schedule
- [ ] `aud` claim validated against client ID
- [ ] Token `exp` claim checked before use
- [ ] Refresh token flow implemented (if available)
- [ ] HTTPS enforced for all OIDC endpoints

## Common Failures
- Not validating `id_token` signature (accepting forged tokens)
- Missing nonce validation (replay attack vulnerability)
- Hardcoding endpoints instead of using discovery URL (breaks on IdP changes)
- Caching JWKS indefinitely (breaks when IdP rotates keys)

## Decision Points
- **Stateful vs Stateless**: Stateful for browser apps (session storage), stateless for API clients
- **JWKS Cache TTL**: 24 hours typical; align with IdP's key rotation schedule
- **Fallback auth**: Always maintain password-based fallback for IdP downtime

## Performance Considerations
- JWKS retrieval: HTTP request on first auth — cache for 24 hours
- `id_token` verification: local JWT verification using cached JWKS (<1ms)
- Token refresh: one HTTP request per refresh cycle

## Security Considerations
- Nonce validation is mandatory for replay attack prevention
- JWKS rotation handling: cache expiry must align with IdP key rotation
- `aud` claim validation prevents cross-client token reuse
- All OIDC communication must be over HTTPS — no exceptions

## Related Rules (from 05-rules.md)
- Always Validate id_token Signature Using JWKS
- Generate and Validate Nonce for Replay Protection
- Use OIDC Discovery URL Instead of Hardcoded Endpoints
- Cache JWKS Keys With Appropriate TTL
- Validate aud Claim Matches Client ID
- Enforce HTTPS for All OIDC Communication
- Monitor IdP Token Expiry and Implement Refresh Token Flow

## Related Skills
- Configure Socialite OAuth Client Authentication
- Implement SAML 2.0 SSO
- Set Up Passport OAuth2 Server
- Configure WorkOS Enterprise SSO

## Success Criteria
- Users can authenticate via OIDC IdP and are redirected back to the app
- `id_token` signature validated with cached JWKS
- Nonce prevents replay attacks
- `aud` claim validation prevents cross-client token reuse
- Token refresh works without requiring re-authentication
- Fallback password auth available when IdP is down
