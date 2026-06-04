# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel Jetstream (Fortify + Sanctum — Legacy Context) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Deprecated — legacy only |

---

## Overview

Laravel Jetstream was a feature-rich application starter kit built on Fortify (backend) and Sanctum (API/SPA auth), adding teams management, profile management, API token management, and Livewire/Inertia frontend stacks. Jetstream has been superseded by stack-specific Laravel Starter Kits (Laravel 12/13), which provide the same canonical stack (Fortify + Sanctum + Passkeys) without the teams or API token management overhead. Jetstream is now a legacy reference for understanding how Fortify + Sanctum + Starter Kits evolved.

---

## Core Concepts

- **Fortify Backend**: Jetstream used Fortify for all authentication routes (login, register, 2FA, password confirmation, email verification).
- **Sanctum Integration**: API token management UI (create, revoke tokens with abilities). Cookie-based SPA session auth via Sanctum.
- **Teams**: `Jetstream\Jetstream` managed teams with membership roles (owner, admin, editor, viewer). Team invitation system with email notifications.
- **Two-Factor Authentication**: Built-in TOTP 2FA via Fortify with recovery codes.
- **Profile Management**: Profile photo, name, email, password, 2FA settings, API tokens, connected accounts (Socialite).

---

## When To Use

- Maintaining an existing Laravel application originally built with Jetstream
- Understanding the architectural evolution from Jetstream to Starter Kits

## When NOT To Use

- New projects (Laravel 12/13+): Use stack-specific Starter Kits
- Projects needing only the canonical auth stack without teams or API token UI

---

## Best Practices

- **Migrate to Starter Kits**: For new projects, use the appropriate stack-specific Starter Kit (React, Vue, Svelte, Livewire).
- **Teams Migration**: Jetstream's teams feature was tightly coupled. Migrate to a custom teams solution (Spatie Permission with team scoping, or a custom Team model).
- **API Token UI**: Starter Kits do not include API token management. Build your own using Sanctum's `HasApiTokens` trait if needed.

---

## Architecture Guidelines

- Jetstream demonstrated the canonical Fortify + Sanctum stack that Starter Kits now provide without the teams overhead
- Teams management in Jetstream was an opinionated implementation — not a multi-tenancy solution
- API token management UI was built on Sanctum's `HasApiTokens` trait — reusable pattern for custom implementations

---

## Performance Considerations

- Jetstream's teams feature added database queries for membership checks on every request
- Starter Kits have no teams overhead — faster baseline performance
- API token management UI can add database load if not cached

---

## Security Considerations

- Jetstream's teams roles (owner, admin, editor, viewer) are not suitable for multi-tenant isolation — they are collaborative groups, not tenant isolation
- Two-factor authentication via Fortify is still the recommended approach in current Starter Kits
- Email verification is enabled by default in both Jetstream and Starter Kits

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Jetstream for new projects | Unaware of deprecation | Legacy scaffolding with maintenance overhead | Use Laravel 13 Starter Kits |
| Expecting Jetstream features in Starter Kits | Assuming feature parity | Missing teams/API token management | Build separately or use ecosystem packages |
| Confusing Jetstream teams with multi-tenancy | Overlapping vocabulary | Incorrect data isolation model | Use dedicated multi-tenancy packages (stancl/tenancy, spatie/laravel-multitenancy) |

---

## Anti-Patterns

- **Customizing Jetstream's teams for multi-tenancy**: Jetstream teams are not designed for tenant isolation
- **Staying on Jetstream indefinitely**: Deprecated package with no future updates

---

## Examples

**Jetstream API token configuration (legacy):**
```php
// config/jetstream.php
'features' => [
    Features::termsAndPrivacyPolicy(),
    Features::profilePhotos(),
    Features::api(),
    Features::teams(['invitations' => true]),
    Features::accountDeletion(),
],
```

**Current Starter Kit equivalent:**
```bash
# No teams, no API token UI — just the canonical auth stack
composer create-project laravel/laravel example-app
cd example-app
php artisan install:livewire
```

---

## Related Topics

- Fortify headless auth backend
- Sanctum SPA vs Token auth
- Laravel Breeze auth scaffolding (legacy)
- Laravel Starter Kits (current)
- Multi-tenancy security

---

## AI Agent Notes

- Jetstream projects on Laravel 11.x are the only valid use case. Any project on Laravel 12/13 with Jetstream should plan migration.
- The key difference between Jetstream and Starter Kits: Jetstream included teams and API token management UI; Starter Kits do not.
- When migrating from Jetstream, the Fortify and Sanctum configuration patterns generally transfer directly.

---

## Verification

- [ ] Confirm Jetstream is installed — check `composer.json` for `laravel/jetstream`
- [ ] Verify Laravel version — if 12+, recommend Starter Kit migration
- [ ] Document teams feature usage for migration planning
- [ ] IP checks for Fortify action customization patterns
- [ ] Review Sanctum token management implementation for reuse
