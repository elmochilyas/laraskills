# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Passport vs Sanctum Decision Framework |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

The Sanctum vs Passport decision is the most critical authentication architecture choice for Laravel API authentication. **Sanctum** is the default choice for first-party authentication (SPAs, mobile apps, simple token auth). **Passport** is required only when your application must act as an OAuth2 provider for third-party applications. Sanctum covers ~80% of use cases with significantly less complexity. Passport introduces OAuth2 client management, grant types, scope negotiation, and RSA key infrastructure.

---

## Core Concepts

| Feature | Sanctum | Passport |
|---------|---------|----------|
| Complexity | Minimal | High |
| SPA Auth | Cookie-based session (same-domain) | OAuth2 Authorization Code + PKCE |
| Token Auth | SHA-256 hashed PATs | JWT access tokens (RSA-signed) |
| Third-Party Clients | Not supported | Full OAuth2 client support |
| Grant Types | Cookie + Bearer token | Auth Code + PKCE, Client Credentials, Device Code |
| Scopes | Ability-based (simple) | OAuth2 scopes (complex) |
| Setup Time | Minutes | Hours (key management, client setup) |

---

## When To Use Sanctum

- First-party SPA (same-domain or subdomain)
- Mobile app consuming your API
- Simple API token for external services (API key pattern)
- Monolithic Laravel application with auth UI

## When To Use Passport

- Your app is an OAuth2 provider for third-party developers
- Delegated authorization ("Allow App X to access my Y data")
- Multi-service architecture where Passport is the authorization server
- Compliance with OAuth2 specifications is required

---

## Best Practices

- **Default to Sanctum**: Start with Sanctum. Only add Passport when third-party OAuth2 requirements are confirmed.
- **Sanctum for First-Party**: Cookie-based SPA auth (same-domain) is more secure than Bearer tokens for browser apps (CSRF protection, no token in JS scope).
- **Passport for Third-Party**: Use Authorization Code + PKCE for third-party web apps, Client Credentials for M2M.
- **Dual Setup Possible**: Both can coexist — Sanctum for first-party apps, Passport for third-party OAuth2. Configure separate guards.

---

## Architecture Guidelines

- Sanctum: single token table (`personal_access_tokens`), SHA-256 hashed tokens, ability-based scoping
- Passport: multiple tables (oauth_clients, oauth_access_tokens, oauth_refresh_tokens, oauth_auth_codes), RSA keys, full scopes
- Dual-guard: Sanctum guard for first-party API, Passport guard for third-party API
- Tradeoff: Sanctum cannot do delegated authorization; Passport adds client management, grants, scopes, and key infrastructure

---

## Performance Considerations

- Sanctum: SHA-256 hash lookup on each request. Minimal database overhead.
- Passport: JWT signature verification + token DB lookup. Slightly more overhead.
- Sanctum token creation is simpler (no authorization code flow).

---

## Security Considerations

- **Sanctum SPA Security**: Cookie-based session auth provides CSRF protection via `same_site` cookie and XSS mitigation (token not accessible to JS).
- **Sanctum Token Security**: Bearer tokens for mobile/third-party are hashed with SHA-256 — database compromise does not expose plaintext tokens.
- **Passport Security**: OAuth2 standards-compliance (PKCE for public clients, Client Credentials for M2M, token revocation).

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Passport for first-party SPA | Assuming "more enterprise = better" | Unnecessary complexity for simple first-party auth | Use Sanctum |
| Using Sanctum for third-party OAuth | Unaware of Sanctum limitations | Cannot support OAuth2 delegated authorization | Use Passport |
| Setting up both unnecessarily | "Just in case" complexity | Maintenance burden for unused OAuth2 features | Start with Sanctum; add Passport only when needed |
| Password Grant with Sanctum | OAuth2 habit | No delegated authorization support | Sanctum's token model doesn't need grants |

---

## Anti-Patterns

- **"Passport is more enterprise/complete than Sanctum"**: Both serve different use cases. Sanctum is the correct default for first-party auth.
- **Using Password Grant in either**: Deprecated in OAuth2; unnecessary in Sanctum
- **Implementing OAuth2-like flows on top of Sanctum**: If you need OAuth2, use Passport

---

## Examples

**Decision flowchart:**
```
Need API authentication?
├── First-party app (SPA, mobile, M2M)?
│   └── Use Sanctum ✓
├── Third-party OAuth2 provider?
│   └── Use Passport ✓
└── Both?
    └── Sanctum for first-party + Passport for third-party ✓
```

**Dual setup:**
```php
// config/auth.php
'guards' => [
    'api' => ['driver' => 'sanctum', 'provider' => 'users'],
    'oauth' => ['driver' => 'passport', 'provider' => 'users'],
],
```

---

## Related Topics

- Sanctum SPA vs Token auth
- Passport OAuth2
- API authentication
- Laravel authentication architecture

---

## AI Agent Notes

- This is the most common architectural decision point in Laravel API auth. Default recommendation is always: start with Sanctum.
- If a project has Passport and only needs first-party auth, recommend migrating to Sanctum for reduced complexity.
- Both can coexist — check `config/auth.php` guards for dual setups.

---

## Verification

- [ ] Auth package selected based on requirements (Sanctum for first-party, Passport for OAuth2)
- [ ] No unnecessary dual setup (Passport added only if third-party OAuth2 required)
- [ ] Guard configuration matches selected package
- [ ] Token model (Sanctum abilities vs Passport scopes) appropriate for use case
- [ ] SPA uses Sanctum cookie auth (not Bearer tokens) for browser-based auth
