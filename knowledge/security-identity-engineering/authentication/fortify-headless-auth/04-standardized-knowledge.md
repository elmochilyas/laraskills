# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Fortify Headless Auth Backend |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel Fortify is a headless authentication backend implementation. It provides routes and controllers for all Laravel authentication features (login, registration, password reset, email verification, 2FA) but does NOT provide a frontend UI. Fortify's "action pattern" (customizable invokable classes) allows developers to override any authentication behavior without modifying vendor code. Fortify is the backbone of Laravel Jetstream (legacy) and the current Laravel 12/13 Starter Kits.

---

## Core Concepts

- **Headless Backend**: Fortify provides routes, controllers, and validation — but no UI views. You bring your own frontend.
- **Action Pattern**: Customizable invokable classes in `App\Actions\Fortify\*`. Override by binding your implementation in a service provider.
- **Features**: `Features::registration()`, `Features::resetPasswords()`, `Features::emailVerification()`, `Features::twoFactorAuthentication()`. Enable/disable in `config/fortify.php`.
- **Customization**: `CreateNewUser`, `UpdateUserProfileInformation`, `UpdateUserPassword`, `ResetUserPassword`, `RedirectIfTwoFactorAuthenticatable` — all overridable.
- **Rate Limiting**: Built-in rate limiting for login attempts — configurable in `FortifyServiceProvider`.

---

## When To Use

- Custom frontend authentication UI (any stack — React, Vue, Livewire, Svelte)
- Projects needing upgrade-safe auth without published controllers
- Laravel 12/13 Starter Kits (Fortify ships as the backend)
- When you want fine-grained control over auth behavior without modifying vendor code

## When NOT To Use

- Projects requiring simple scaffolding (use Breeze or Starter Kits) — Fortify requires UI work
- When you need full code ownership of controllers (Fortify abstracts them)
- Simple applications where published controllers are acceptable (legacy Breeze)

---

## Best Practices

- **Customize via Action Overrides**: Bind your action classes in `FortifyServiceProvider`. Never modify vendor files.
- **Enable Features Selectively**: `config/fortify.php` features array — enable only what you need (registration, 2FA, email verification, password reset).
- **Rate Limiting Tuning**: Configure login rate limiting in `FortifyServiceProvider::configureRateLimiting()`. Adjust `limiter('login')` as needed.
- **Homepage Customization**: Set `Fortify::redirectsTo()` to define the post-login redirect path.

---

## Architecture Guidelines

- Fortify operates as a middleware pipeline — routes → middleware (auth, verified, password.confirm) → actions
- All customization goes in `App\Actions\Fortify\*` (published via `php artisan vendor:publish --tag=fortify-actions`)
- Fortify config published to `config/fortify.php`
- Views can be published for customization: `php artisan vendor:publish --tag=fortify-views`

---

## Performance Considerations

- Fortify adds minimal overhead — routes and controllers are lazy-loaded
- Rate limiting uses Laravel's Cache — Redis-backed in production
- 2FA adds TOTP verification overhead (~50ms per challenge)

---

## Security Considerations

- **Rate-Limited Login**: Fortify's rate limiting protects against brute force attacks. Do not disable.
- **Password Confirmation**: `password.confirm` middleware available for sensitive actions (disabling 2FA, changing email).
- **2FA Recovery Codes**: Generated automatically. Users should be prompted to save them on setup.
- **Email Verification**: Fortify handles email verification links. Configure mail before enabling.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Modifying vendor Fortify files | Unfamiliarity with action pattern | Changes overwritten on composer update | Override via `App\Actions\Fortify\*` |
| Not configuring mail for email verification | Skipping mail setup | Users cannot verify email | Configure mail before enabling verification |
| Disabling rate limiting | Testing convenience | No brute force protection in production | Use environment-specific rate limit config |
| Enabling all features by default | Not reviewing features array | Exposes unnecessary auth features | Enable only needed features |

---

## Anti-Patterns

- **Re-implementing Fortify's features in controllers**: Fortify already handles them — use features array
- **Using Fortify without a frontend plan**: Fortify is headless — you must build or scaffold the UI
- **Overriding every action unnecessarily**: Override only what you need; use defaults for standard behavior

---

## Examples

**Configuration:**
```php
// config/fortify.php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

**Action override:**
```php
// AppServiceProvider or FortifyServiceProvider
use App\Actions\Fortify\CreateNewUser;

Fortify::createUsersUsing(CreateNewUser::class);
```

**Rate limiting customization:**
```php
public function boot(): void
{
    RateLimiter::for('login', function (Request $request) {
        $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());
        return Limit::perMinute(5)->by($throttleKey);
    });
}
```

---

## Related Topics

- Auth guards/providers architecture
- Sanctum SPA vs Token auth
- Starter Kits (React, Vue, Svelte, Livewire)
- MFA/TOTP with Fortify

---

## AI Agent Notes

- Fortify is the authentication backbone of the current Laravel ecosystem. Most new Laravel projects (post-Laravel 11) use Fortify through Starter Kits.
- When debugging Fortify, always check the `App\Actions\Fortify\` directory for custom overrides first.
- The `config/fortify.php` features array is the most commonly missed configuration — verify it matches the intended auth feature set.

---

## Verification

- [ ] Fortify configured in `config/fortify.php` with appropriate features enabled
- [ ] Action overrides in `App\Actions\Fortify\` (if any customization needed)
- [ ] Mail configured for email verification (if enabled)
- [ ] Rate limiting configured for login, 2FA
- [ ] `Fortify::redirectsTo()` set correctly
- [ ] Password confirmation middleware applied to sensitive routes
- [ ] Views published and customized (if needed)
- [ ] Tests cover Fortify's authentication flows
