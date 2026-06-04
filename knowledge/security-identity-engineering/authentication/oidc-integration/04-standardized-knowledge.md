# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | OIDC Integration |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Emerging |

---

## Overview

OpenID Connect (OIDC) integration in Laravel is typically implemented via custom Socialite drivers that extend the OAuth2 provider. OIDC adds an identity layer on top of OAuth2, providing a standardized `id_token` (JWT) that contains user identity claims. The primary packages are: `jeffersongoncalves/laravel-oidc` (Socialite-based), custom Socialite drivers for specific providers (Keycloak, Okta, Azure AD), and WorkOS for enterprise IdP connectivity. OIDC flow includes: `issuer` discovery, JWKS key retrieval for token verification, `nonce` parameter for replay prevention, and `id_token` claim validation.

---

## Core Concepts

- **OIDC vs OAuth2**: OIDC extends OAuth2 with a standardized identity token (`id_token`) and user info endpoint.
- **id_token**: JSON Web Token (JWT) signed by the IdP, containing user claims (`sub`, `email`, `name`, `preferred_username`).
- **JWKS (JSON Web Key Set)**: The IdP's public keys used to verify the `id_token`'s signature. Retrieved from the `jwks_uri` discovery endpoint.
- **Discovery URL**: `https://provider.com/.well-known/openid-configuration` — documents all OIDC endpoints.
- **Nonce**: A one-time use parameter in the authentication request that prevents replay attacks.
- **Socialite Community Providers**: Keycloak provider available at SocialiteProviders.

---

## When To Use

- Enterprise applications needing standardized SSO with identity claims
- Integration with identity providers that support OIDC (Azure AD, Okta, Keycloak, Google, Auth0)
- Migration from SAML to OIDC (modern, simpler protocol)
- Applications requiring JWT-based identity tokens for downstream consumption

## When NOT To Use

- Simple social login (use Socialite's first-party providers — GitHub, Google, Facebook)
- When SAML 2.0 is already deployed and working in the enterprise
- When the IdP does not support OIDC (some legacy IdPs only support SAML)
- For machine-to-machine auth (use OAuth2 Client Credentials grant directly)

---

## Best Practices

- **Validate id_token Signature**: Always verify the JWT signature using the IdP's JWKS endpoint. Do not accept unsigned tokens.
- **Validate Nonce**: Implement nonce generation and validation to prevent replay attacks.
- **Use Discovery URL**: Load OIDC configuration dynamically from `/.well-known/openid-configuration` rather than hardcoding endpoints.
- **Handle Token Expiry**: Check `exp` claim in `id_token`. Implement refresh token flow if available.
- **Monitor Package Maturity**: The OIDC Socialite driver ecosystem is single-contributor — monitor for maintenance activity.

---

## Architecture Guidelines

- Extend Socialite's OAuth2 provider for OIDC integration
- JWKS keys should be cached — they change infrequently (rotate ~monthly)
- Nonce generation: random string stored in session, validated on callback
- `scope` must include `openid` (add `profile`, `email` for additional claims)
- Configure a dedicated guard for OIDC-authenticated users if needed

---

## Performance Considerations

- JWKS retrieval: HTTP request to IdP on first authentication. Cache for 24 hours (or respect `Cache-Control` headers).
- `id_token` verification: local JWT signature verification using cached JWKS — <1ms.
- Token refresh: one HTTP request per refresh cycle.

---

## Security Considerations

- **Nonce Replay Prevention**: Without nonce validation, an attacker can reuse an intercepted `id_token` to authenticate.
- **JWKS Rotation**: IdPs rotate signing keys periodically. Cache expiry should be aligned with rotation frequency.
- **id_token `aud` Claim**: Validate that the `aud` (audience) claim matches your application's client ID.
- **HTTPS Required**: All OIDC communication must be over HTTPS. No exceptions.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not validating id_token signature | Assuming HTTPS is sufficient | Trusting forged tokens | Always verify JWT signature with JWKS |
| Missing nonce validation | Following OAuth2-only flow | Replay attack vulnerability | Generate and validate nonce per request |
| Hardcoding endpoints | Copy-paste configuration | Broken when IdP changes discovery URLs | Use OIDC discovery URL |
| Caching JWKS indefinitely | Performance optimization | Broken when IdP rotates keys | Set cache TTL aligned with rotation |

---

## Anti-Patterns

- **Accepting unsigned id_tokens**: No signature verification defeats OIDC's security model
- **Ignoring `azp` claim**: For multi-client IdPs, verify the authorized party matches your app
- **Not handling key rotation**: Stale JWKS cache will reject valid tokens

---

## Examples

**Socialite OIDC driver configuration:**
```php
// config/services.php
'azure' => [
    'client_id' => env('AZURE_CLIENT_ID'),
    'client_secret' => env('AZURE_CLIENT_SECRET'),
    'redirect' => env('AZURE_REDIRECT_URI'),
    'tenant' => env('AZURE_TENANT_ID', 'common'),
    'additional_scopes' => 'openid profile email',
],
```

**OIDC callback handling:**
```php
// Using Socialite with OIDC
$user = Socialite::driver('azure')->stateless()->user();

// Access OIDC claims from id_token
$idToken = $user->id_token;  // raw JWT
$claims = $user->user;        // decoded claims (sub, email, name)
```

---

## Related Topics

- Socialite OAuth client configuration
- SAML 2.0 SSO
- Passport OAuth2
- WorkOS Enterprise SSO
- JWT fundamentals

---

## AI Agent Notes

- OIDC integration is emerging in the Laravel ecosystem — the main driver is single-contributor. Evaluate long-term maintenance before building critical flows.
- For production enterprise SSO, WorkOS provides a managed alternative that abstracts OIDC/SAML complexity.
- Always recommend caching JWKS with a TTL — but validate the TTL matches the IdP's key rotation policy.

---

## Verification

- [ ] OIDC provider configured in `config/services.php`
- [ ] `id_token` signature validated using JWKS
- [ ] Nonce parameter generated and validated
- [ ] JWKS cached with appropriate TTL
- [ ] `aud` claim validated against client ID
- [ ] HTTPS enforced for all OIDC endpoints
- [ ] Token expiry (exp) validated
- [ ] Refresh token flow implemented (if available)
- [ ] Fallback auth method for IdP downtime
