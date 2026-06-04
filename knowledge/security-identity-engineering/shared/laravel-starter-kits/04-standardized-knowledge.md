# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel Starter Kits (React, Vue, Svelte, Livewire — Current) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Current (Laravel 12/13) |

---

## Overview

Laravel 12/13 Starter Kits are the current recommended authentication scaffolding, replacing the deprecated Breeze and Jetstream. Each kit targets a specific frontend stack: React, Vue, Svelte, or Livewire. All kits ship the canonical Laravel auth stack: Fortify (backend authentication) + Sanctum (SPA cookie auth) + Passkeys (WebAuthn). The kits provide pre-built login, registration, password reset, email verification, passkey registration, and profile management, with the frontend stack chosen at installation time. Unlike Breeze's published controllers, the starter kits use Fortify's action pattern — upgrade-safe.

---

## Core Concepts

- **Stack-Specific**: Four kits — React (Inertia), Vue (Inertia), Svelte (Inertia), Livewire (with Volt). Choose the one matching your frontend stack.
- **Canonical Stack**: Every kit uses Fortify + Sanctum + Passkeys. The same backend regardless of frontend choice.
- **Fortify Actions**: Authentication logic lives in Fortify's action classes (`App\Actions\Fortify\*`). Customizable via overrides, not by modifying published controllers.
- **Passkey Support**: All kits include WebAuthn passkey registration and login out of the box via `laravel/passkeys`.
- **Profile Management**: Name, email, password update, passkey management, and 2FA TOTP settings.

---

## When To Use

- Every new Laravel project (Laravel 12/13+)
- Projects needing the canonical Laravel auth stack with zero-effort scaffolding
- Teams wanting upgrade-safe authentication (Fortify action pattern)

## When NOT To Use

- Projects needing teams or API token management UI — Starter Kits do not include these
- Custom-branded auth UI requiring full control — use manual Fortify setup
- Existing Breeze/Jetstream projects (use the starter kit equivalent for new projects, migrate existing gradually)

---

## Best Practices

- **Choose by Frontend Stack**: The only decision is frontend stack. Backend auth is identical across all kits.
- **Customize via Action Pattern**: Override Fortify action classes (`App\Actions\Fortify\*`). Do not modify vendor files.
- **Enable Passkeys**: Passkeys are available but may need enabling in `config/fortify.php` features array.
- **Pin Exact Package Versions**: Passkeys (`laravel/passkeys`) is pre-1.0. Pin exact versions and monitor changelog.

---

## Architecture Guidelines

- Installation: `composer create-project laravel/laravel` → `php artisan install:api` → `php artisan install:react|vue|svelte|livewire`
- Backend is identical across all kits — only frontend files differ
- Fortify actions handle all authentication logic — upgrade-safe via Composer
- Starter Kit views are published and modifiable; backend actions are customizable via Fortify's action pattern

---

## Performance Considerations

- Starter Kits add minimal overhead — Fortify, Sanctum, and Passkeys are lazy-loaded
- Frontend assets are built with Vite — production builds are optimized
- Authentication requests: 5-50ms for credential verification, session creation, token generation

---

## Security Considerations

- **Upgrade-Safe Auth**: Because Fortify handles auth logic, security patches are received via Composer updates — not manual file patches.
- **Passkeys Pre-1.0**: Monitor for breaking changes in `laravel/passkeys` API during upgrades.
- **Basic Authentication Tests**: Starter Kits provide basic auth tests. Extend coverage for custom auth flows.
- **No Teams or API Tokens**: Starter Kits do not include teams or API token management — build separately if needed.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Modifying vendor-published Fortify files | Treating Fortify like Breeze controllers | Changes overwritten on `composer update` | Only modify published files in `App\Actions\Fortify\` |
| Choosing wrong frontend stack | Rushing initial setup | Must rebuild entire frontend to switch stacks | Evaluate frontend requirements before choosing |
| Expecting Jetstream features | Assuming feature parity | Missing teams and API token management | Build separately or use ecosystem packages |
| Not enabling passkey feature | Assuming Passkeys are auto-enabled | Passkey login not available to users | Enable in `config/fortify.php` features array |

---

## Anti-Patterns

- **Forking Starter Kit code instead of extending**: Creates maintenance burden when upgrading
- **Using Breeze/Jetstream for new projects in 2026**: Deprecated stacks with manual patch requirements
- **Mixing frontend stacks**: React Starter Kit is React-only — cannot mix Vue components

---

## Examples

**Installation:**
```bash
composer create-project laravel/laravel example-app
cd example-app
php artisan install:api
php artisan install:react  # or install:vue, install:svelte, install:livewire
```

**Customizing a Fortify action:**
```php
// App\Actions\Fortify\CreateNewUser.php
class CreateNewUser implements CreatesNewUsers
{
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
        ]);
    }
}
```

---

## Related Topics

- Fortify headless auth backend
- Sanctum SPA vs Token auth
- First-party Passkeys/WebAuthn
- Laravel Breeze (legacy)
- Laravel Jetstream (legacy)

---

## AI Agent Notes

- For new Laravel projects (12/13+), always recommend Starter Kits over Breeze or Jetstream.
- The frontend stack decision drives the kit selection — ask about the team's frontend expertise.
- Starter Kits provide the canonical auth stack: Fortify + Sanctum + Passkeys. No teams, no API token UI.
- Passkeys are an additive feature — enable via Fortify configuration if needed.

---

## Verification

- [ ] Correct Starter Kit installed for the frontend stack
- [ ] Fortify actions customized in `App\Actions\Fortify\` (not vendor files)
- [ ] Passkeys enabled in `config/fortify.php` (if desired)
- [ ] Authentication tests passing
- [ ] Frontend build (Vite) completes successfully
- [ ] `composer.json` does not reference `laravel/breeze` or `laravel/jetstream`
