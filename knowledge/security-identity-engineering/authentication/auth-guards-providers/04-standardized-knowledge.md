# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Laravel Auth Guards and Providers Architecture |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel's authentication architecture is built on two abstractions: **guards** (how users are authenticated per request) and **providers** (how users are retrieved from persistent storage). Guards define the authentication strategy (session, token, OAuth2), while providers define the user data source (Eloquent, database table, custom API). Guard-provider separation enables multi-guard setups (admin guard, API guard, tenant guard) with independent configurations.

---

## Core Concepts

- **Guards**: Define authentication mechanism per request — `session` (cookie-based), `token` (API tokens), `sanctum` (SPA cookie + tokens), `passport` (OAuth2).
- **Providers**: Define user retrieval — `eloquent` (User model), `database` (query builder), `custom` (your own UserProvider implementation).
- **`config/auth.php`**: Central configuration defining guards, providers, and default guard.
- **`Auth::guard('admin')`**: Access a specific guard. `Auth::check()` uses the default guard.
- **Multi-Guard Setup**: Different authentication strategies for different parts of the application (admins, API users, tenants).

---

## When To Use

- Every Laravel application — the authentication system is configured here
- Multi-guard setups for applications with different user types (admin, customer, API)
- Custom authentication backends (LDAP, Active Directory, custom API)

## When NOT To Use

- Stateless microservices without user authentication (service-to-service)
- When using a third-party IdP that handles authentication entirely externally

---

## Best Practices

- **Create guards for different user types**: Admin guard (`web-admin`) with separate session, API guard (`api`) with token auth.
- **Custom providers for non-standard user storage**: Implement `Illuminate\Contracts\Auth\UserProvider` for LDAP, REST API, or file-based users.
- **Default guard should match the primary use case**: Web apps default to `web` guard; API-first apps default to `sanctum` or `api`.
- **Never modify the `web` guard's provider to change user retrieval**: Create a new guard.

---

## Architecture Guidelines

- Guard-provider separation allows mixing strategies (session for web, tokens for API)
- User providers must return a `Illuminate\Contracts\Auth\Authenticatable` implementation
- The `Authenticatable` contract requires `getAuthIdentifierName()`, `getAuthIdentifier()`, `getAuthPassword()`, `getRememberToken()`, `setRememberToken()`, `getRememberTokenName()`

---

## Performance Considerations

- Guard resolution is cached after first request — negligible overhead
- Provider queries depend on the data source (Eloquent adds DB query, custom providers vary)
- Session guard requires session read on every request — use Redis for session storage in production

---

## Security Considerations

- **Guard Confusion**: Misconfiguring which guard protects which route is a common auth bypass. Each guard should clearly map to a route group.
- **Default Guard Risks**: If the default guard is `web` but API routes are not explicitly guarding with `sanctum`, API routes may incorrectly use session auth.
- **Provider Security**: Custom providers must validate credentials securely (hash verification, no plaintext passwords).

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using same guard for web and API | Single guard convenience | Session auth on API routes; token auth on web routes | Create separate guards |
| Modifying `providers.users.model` for multi-tenancy | Reusing the web guard | User retrieval breaks across tenants | Create tenant-specific guard or provider |
| Not specifying guard in routes | Using default guard implicitly | Wrong auth strategy applied | Explicitly specify guard in route middleware |

---

## Anti-Patterns

- **One guard for all user types**: Forces all authentication into one strategy
- **Modifying the `web` guard's driver**: The `web` guard should always use `session` driver
- **Creating a guard without a corresponding provider**: Guards and providers must be paired

---

## Examples

**Multi-guard configuration:**
```php
// config/auth.php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'admin' => [
        'driver' => 'session',
        'provider' => 'admins',
    ],
    'api' => [
        'driver' => 'sanctum',
        'provider' => 'users',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],
    'admins' => [
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
],
```

**Route guard specification:**
```php
Route::middleware('auth:admin')->group(function () {
    // Admin routes — uses admin guard
});

Route::middleware('auth:sanctum')->group(function () {
    // API routes — uses Sanctum guard
});
```

---

## Related Topics

- Sanctum SPA vs Token auth
- Passport OAuth2
- Authentication middleware
- Multi-tenancy security

---

## AI Agent Notes

- Guard-provider configuration is the foundation of all authentication. Always examine `config/auth.php` first when debugging auth issues.
- Multi-guard setups are common in applications with admin panels and public APIs. Verify each guard has appropriate driver and provider.
- Custom providers are the extension point for non-DB user storage — check `Auth::provider()` calls for custom implementations.

---

## Verification

- [ ] `config/auth.php` defines appropriate guards for each user type
- [ ] Each guard has the correct driver (session, sanctum, passport, token)
- [ ] Each provider references the correct model or database table
- [ ] Route middleware explicitly specifies guard names
- [ ] Custom providers implement the `UserProvider` contract
- [ ] Default guard matches the primary auth use case
- [ ] Multi-guard setup tested for each route group
