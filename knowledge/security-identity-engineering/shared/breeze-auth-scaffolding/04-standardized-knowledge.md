# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel Breeze Auth Scaffolding (Legacy Context) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Deprecated — legacy only |

---

## Overview

Laravel Breeze was the minimal authentication scaffolding package (pre-Laravel 12) providing published controllers, views (Blade or Livewire), and routes for login, registration, password reset, and email verification. It published code directly to the application, giving full ownership and debuggability — at the cost of manual upgrades for security patches. Breeze is now **deprecated** in favor of stack-specific Starter Kits (Laravel 12/13). Knowledge of Breeze is relevant only for maintaining existing Breeze-based applications or understanding the evolution of Laravel's auth stack.

---

## Core Concepts

- **Published Controllers**: Unlike Fortify's action pattern, Breeze routes pointed to controllers in `app/Http/Controllers/Auth/`. You owned the code completely.
- **Stack Options**: Blade with Alpine.js, Livewire (with Volt), React, Vue. Each stack had its own Breeze installation command.
- **Fortify Not Included**: Breeze did not use Fortify. It directly called the `Auth` facade and validation logic.
- **Dark Mode**: Breeze included dark mode support for the Blade stack.
- **Profile Page**: Basic profile update (name, email, password) with Blade or Livewire components.

---

## When To Use

- Maintaining an existing Laravel application originally built with Breeze (pre-Laravel 12)
- Understanding the evolution of Laravel's auth scaffolding for migration planning

## When NOT To Use

- **New projects (Laravel 12/13+)**: Use stack-specific Starter Kits (React, Vue, Svelte, Livewire)
- Projects requiring automatic security patch adoption — Breeze's published controllers require manual updates

---

## Best Practices

- **Migrate to Fortify**: Replace Breeze controllers with Fortify configuration. Remove published controllers from `app/Http/Controllers/Auth/`. Configure Fortify features.
- **Monitor for Security Patches**: Breeze controllers in the app directory do not receive automatic security updates. Monitor the Laravel changelog for auth-related security fixes and manually update controllers.
- **Plan Upgrade During Major Version**: For existing projects, consider keeping Breeze until the next major Laravel upgrade, then migrate to Starter Kits.

---

## Architecture Guidelines

- Breeze's architecture places authentication logic directly in application controllers (`app/Http/Controllers/Auth/`)
- Fortify's action pattern (`App\Actions\Fortify\*`) provides upgrade-safe customization
- Migration path: Breeze → Fortify headless backend → Starter Kit frontend

---

## Performance Considerations

- Breeze adds negligible overhead — controllers are loaded from the application namespace
- Rate limiting on login (5 attempts/minute by default) is included but may need tuning

---

## Security Considerations

- **Manual Security Patches**: Security fixes from Laravel (e.g., rate limiting on login) do not automatically apply to published controllers
- **Password Confirmation**: Breeze includes password confirmation middleware for sensitive routes
- **Email Verification**: Enabled by default in Breeze — do not disable in production

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Breeze for new projects | Unaware of deprecation | Legacy scaffolding with manual patch maintenance | Use Laravel 13 Starter Kits |
| Not applying security patches | Assuming published code auto-updates | Vulnerability window until manual update | Monitor changelog; plan migration to Fortify |
| Modifying Breeze controllers extensively | Customization needs | Harder to migrate away from Breeze | Use Fortify action pattern for customization |

---

## Anti-Patterns

- **Rolling custom auth alongside Breeze**: Builds duplicate auth logic on top of scaffolding
- **Staying on Breeze indefinitely**: Increasing maintenance burden as Laravel evolves away from published-controller pattern

---

## Examples

**Migration command (Laravel 11 → Laravel 12/13):**
```bash
# Remove Breeze
composer remove laravel/breeze
# Remove published controllers manually from app/Http/Controllers/Auth/
# Install Laravel 13 Starter Kit
php artisan install:livewire
```

**Breeze controller pattern (legacy):**
```php
// app/Http/Controllers/Auth/AuthenticatedSessionController.php
class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request)
    {
        $request->authenticate();
        $request->session()->regenerate();
        return redirect()->intended(RouteServiceProvider::HOME);
    }
}
```

---

## Related Topics

- Fortify headless auth backend
- Sanctum SPA vs Token auth
- Laravel Starter Kits (current)
- Auth guards/providers architecture
- Jetstream (Fortify + Sanctum - legacy)

---

## AI Agent Notes

- When encountering a Laravel project using Breeze, confirm Laravel version first. Projects on Laravel 11.x may still use Breeze legitimately; projects on 12/13 should not.
- Security audit of a Breeze project: check that rate limiting is configured on login routes, password confirmation middleware is applied, and email verification is enabled.
- Migration planning: recommend Fortify + Starter Kit transition as part of the next major version upgrade.

---

## Verification

- [ ] Confirm Breeze controllers exist in `app/Http/Controllers/Auth/`
- [ ] Verify rate limiting is configured on login routes
- [ ] Check password confirmation middleware on sensitive routes
- [ ] Ensure email verification is enabled
- [ ] Verify Laravel version — if 12+, recommend Starter Kit migration
- [ ] Check `composer.json` does not reference `laravel/breeze` for new projects
