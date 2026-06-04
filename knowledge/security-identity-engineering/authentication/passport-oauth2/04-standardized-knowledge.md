# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Passport OAuth2 Server |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Mature |

---

## Overview

Laravel Passport is a full OAuth2 server implementation built on `league/oauth2-server`. It provides Authorization Code + PKCE, Client Credentials, and Device Code grants. Passport manages OAuth clients, access tokens, refresh tokens, authorization codes, and token scopes. Since Laravel 13.x, Passport is headless (no UI) — client management UI must be implemented separately. RSA key pairs (`passport:keys`) sign and verify access tokens. Passport is the choice when your Laravel application needs to act as an OAuth2 provider for third-party applications.

---

## Core Concepts

- **Grant Types**: Authorization Code + PKCE (third-party apps), Client Credentials (M2M), Device Code (CLI/headless), Password Grant (deprecated).
- **Clients**: Registered applications that can request tokens. Each client has a client ID and secret, redirect URLs, and grant type limitations.
- **Scopes**: Token permissions (e.g., `read-posts`, `write-posts`). Third-party apps request specific scopes; users authorize them.
- **RSA Keys**: Private key signs tokens; public key verifies them. Generated via `php artisan passport:keys`.
- **Token Lifecycle**: Access tokens (short-lived, typically 1 hour), Refresh tokens (long-lived, used to get new access tokens).
- **PKCE (Proof Key for Code Exchange)**: Required for public clients (SPAs, mobile apps). Prevents authorization code interception.

---

## When To Use

- Your Laravel app is an OAuth2 provider for third-party applications
- API access delegation (e.g., "Allow MyApp to access your profile data")
- Multi-service architecture where Passport acts as the authorization server
- Compliance with OAuth2 standards for API access

## When NOT To Use

- First-party SPA authentication (use Sanctum)
- Simple API token auth for your own mobile app (use Sanctum)
- Any scenario where Sanctum's simpler token model suffices (80% of use cases)
- When you don't need delegated authorization (third-party app access)

---

## Best Practices

- **Use PKCE for Public Clients**: Authorization Code + PKCE is required for SPAs and mobile apps. Do not use the deprecated Password Grant.
- **Key Management**: Generate RSA keys with `passport:keys`. Store private key securely. Rotate keys periodically.
- **Scope Design**: Design scopes as granular permissions (`read-orders`, `write-orders`). Avoid overly broad scopes.
- **Token Lifetimes**: Short access tokens (15-60 minutes) with long refresh tokens (14-30 days). Refresh token rotation for security.
- **Client Verification**: Require client secret for confidential clients (server-side apps). Disable secret for public clients (SPAs).

---

## Architecture Guidelines

- Passport routes mounted via `Passport::routes()` in your service provider
- Token scopes defined in `Passport::tokensCan()` — register all available scopes
- Token validation middleware: `CheckScopes`, `CheckForAnyScope`
- Revoked tokens checked automatically on each request — no additional setup needed
- Headless since Laravel 13.x — client management UI must be implemented separately
- Separate token database tables from user tables (no schema conflicts)

---

## Performance Considerations

- RSA signature verification on every authenticated request (~0.1-0.5ms)
- Token database queries: scope lookup, token revocation check, client lookup
- Token introspection: Passport checks token existence and revocation status on each request
- Token pruning: schedule `passport:purge` for expired tokens to prevent table bloat

---

## Security Considerations

- **Private Key Protection**: The OAuth2 private key is the root of trust. Store securely, restrict file permissions, rotate on compromise.
- **Client Secret Exposure**: Server-side clients must keep secrets confidential. Public clients (SPAs) cannot — use PKCE instead.
- **CSRF for Authorization**: Authorization Code grant without PKCE is vulnerable to authorization code interception.
- **Token Revocation**: Revoke tokens on security events (password change, logout from all devices).
- **Scope Validation**: Always validate that requested scopes are valid and authorized by the resource owner.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Password Grant in production | Convenience for first-party apps | Credentials exposed to third-party clients; no MFA support | Use Authorization Code + PKCE or Sanctum |
| Not securing the private key | Default file permissions | Anyone with server access can sign valid tokens | 600 permissions on `oauth-private.key`; store outside web root |
| Overly broad scopes | Designing scopes like roles | Third-party apps can access more than needed | Granular, permission-level scopes |
| Not pruning expired tokens | Forgetting maintenance | Token tables grow indefinitely, slowing queries | Schedule `passport:purge` |
| No token revocation on security events | Missing event listener | Compromised tokens remain valid after password change | Revoke tokens on password change, logout-all |

---

## Anti-Patterns

- **Using Passport for first-party SPA auth**: Sanctum is simpler and sufficient
- **Deprecated Password Grant**: Credentials pass through client — unacceptable for third-party apps
- **No scope granularity**: A single scope "all" defeats the purpose of token scopes
- **Storing private key in version control**: Keys must be provisioned per environment

---

## Examples

**Scopes configuration:**
```php
// AppServiceProvider or PassportServiceProvider
use Laravel\Passport\Passport;

Passport::tokensCan([
    'read-orders' => 'View your orders',
    'write-orders' => 'Create and modify orders',
    'read-profile' => 'View your profile information',
]);

Passport::setDefaultScope(['read-profile']);
```

**Client credentials grant (M2M):**
```php
use GuzzleHttp\Client;

$http = new Client;
$response = $http->post(config('app.url') . '/oauth/token', [
    'form_params' => [
        'grant_type' => 'client_credentials',
        'client_id' => 'client-id',
        'client_secret' => 'client-secret',
        'scope' => 'read-orders',
    ],
]);
```

---

## Related Topics

- Sanctum SPA vs Token auth
- Passport vs Sanctum decision framework
- OAuth2 protocol fundamentals
- API authentication
- Socialite OAuth client

---

## AI Agent Notes

- Passport is overkill for most projects. Only use when third-party OAuth2 provider needs are confirmed.
- The most common mistake is using Passport where Sanctum would suffice. Recommend evaluating the decision framework first.
- Headless since v13.x — client management requires custom UI or API-based management.

---

## Verification

- [ ] Grant types evaluated and configured (PKCE for public, Client Credentials for M2M)
- [ ] RSA keys generated (`php artisan passport:keys`) and secured (600 permissions)
- [ ] Private key not stored in version control
- [ ] Scopes defined in `Passport::tokensCan()` with granular permissions
- [ ] Password Grant disabled (if previously enabled)
- [ ] Token pruning scheduled (`passport:purge` in `Kernel`)
- [ ] Token revocation on password change/logout-all implemented
- [ ] Client management UI or API implemented (since headless)
- [ ] OAuth2 routes registered (`Passport::routes()`)
