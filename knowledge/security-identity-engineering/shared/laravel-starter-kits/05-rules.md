# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Always Use Starter Kits for New Laravel Authentication

## Category

Framework Usage

## Rule

For every new Laravel 12/13+ project that requires user authentication, install the appropriate Starter Kit (React, Vue, Svelte, or Livewire). Never build authentication from scratch or use deprecated Breeze/Jetstream.

## Reason

Starter Kits provide the canonical Laravel auth stack — Fortify + Sanctum + Passkeys — with upgrade-safe action patterns. Building authentication from scratch duplicates months of battle-tested security logic (rate limiting, password reset tokens, email verification, session management, 2FA). Using deprecated Breeze/Jetstream creates manual patch maintenance burden.

## Bad Example

```bash
# Building auth from scratch — no Starter Kit
composer create-project laravel/laravel new-app
# Manually writing login, register, password reset controllers
```

## Good Example

```bash
composer create-project laravel/laravel new-app
php artisan install:api
php artisan install:react
```

## Exceptions

API-only projects (no web UI, mobile app backend) do not need a Starter Kit — use Fortify headlessly with Sanctum for token/SPA auth.

## Consequences Of Violation

Security: Custom auth likely misses security patterns (rate limiting, session regeneration, email verification). Maintenance: Significant development effort for features that are free with Starter Kits.

---

## Rule Name

Customize Auth via Fortify Actions, Not Published Files

## Category

Architecture

## Rule

Override authentication behavior by modifying Fortify action classes in `App\Actions\Fortify\`. Never modify vendor files or Starter Kit published files directly.

## Reason

Fortify actions (`CreateNewUser`, `UpdateUserPassword`, `ResetUserPassword`) are designed as customization points. They live in your application namespace and are safe to modify. Vendor files and Starter Kit scaffolding are overwritten on `composer update`. Modifying them causes all changes to be lost on the next package update and prevents receiving security patches.

## Bad Example

```php
// Modifying vendor-published Fortify files
// vendor/laravel/fortify/src/Actions/CreateNewUser.php
// Changes lost on composer update
```

## Good Example

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

## Exceptions

Published view files (Blade/React/Vue/Svelte components) are intended for modification — they are the frontend UI. Only backend logic must use the Fortify action pattern.

## Consequences Of Violation

Maintenance: Customizations lost on `composer update`. Security: Security patches in Fortify updates are ineffective if actions are overridden in vendor.

---

## Rule Name

Choose Starter Kit by Frontend Stack Only

## Category

Architecture

## Rule

Select the Starter Kit based on the team's frontend technology: React for React teams, Vue for Vue teams, Svelte for Svelte teams, Livewire for Blade/Laravel-centric teams. The backend auth is identical across all kits.

## Reason

All four Starter Kits share the identical backend (Fortify + Sanctum + Passkeys). The only difference is the frontend stack. Choosing by anything other than frontend expertise leads to productivity loss, onboarding friction, and increased framework complexity. A team that knows Vue should not use the React kit "because it's more popular."

## Bad Example

```bash
# Chosen for popularity, not team expertise
php artisan install:react
# Team only knows Blade/Livewire — steep learning curve
```

## Good Example

```bash
# Chosen for team expertise
php artisan install:livewire
```

## Exceptions

Organizations with dedicated frontend teams may choose a kit that their frontend team owns, even if the backend team is unfamiliar with it. In this case, ensure clear API contracts between frontend and backend.

## Consequences Of Violation

Maintenance: Frontend code written in a stack nobody maintains effectively. Performance: Improperly optimized frontend due to lack of expertise.

---

## Rule Name

Enable Passkeys in Fortify Configuration When Needed

## Category

Framework Usage

## Rule

Explicitly enable passkey support in `config/fortify.php` by adding `Features::passkeys()` to the features array. Never assume passkeys are auto-enabled after Starter Kit installation.

## Reason

Starter Kits ship with passkey scaffolding (frontend components, routes), but the passkey feature must be enabled in Fortify's configuration to register the backend endpoints and logic. Without explicit enabling, passkey UI elements are present but nonfunctional — users see the option but cannot register or use passkeys.

## Bad Example

```php
// config/fortify.php — passkeys not enabled
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    // Features::passkeys() missing
],
```

## Good Example

```php
// config/fortify.php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::passkeys(),
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

## Exceptions

Projects that intentionally do not want passkey authentication (e.g., enterprise applications with hardware-token-based MFA only).

## Consequences Of Violation

User Experience: Users see passkey options that do not work. Support: Help desk tickets about non-functional passkey features.

---

## Rule Name

Pin Exact Versions for Pre-1.0 Packages

## Category

Maintainability

## Rule

Pin `laravel/passkeys` to an exact version in `composer.json`. Never use `^` or `>=` version constraints for pre-1.0 packages.

## Reason

`laravel/passkeys` is pre-1.0 software. Per semver, pre-1.0 packages make breaking changes at any minor/patch bump. Using `^1.0` or `>=1.0` constraints may pull a breaking version changes that breaks authentication flows without warning during deployment.

## Bad Example

```json
{
    "require": {
        "laravel/passkeys": "^1.0"
    }
}
```

## Good Example

```json
{
    "require": {
        "laravel/passkeys": "0.2.0"
    }
}
```

## Exceptions

Projects with comprehensive end-to-end authentication test suites that detect breaking changes during CI, allowing controlled upgrades via explicit version bumps.

## Consequences Of Violation

Reliability: Authentication broken by unexpected breaking changes in passkey package. Security: Untested authentication flow changes deployed to production.

---

## Rule Name

Never Mix Frontend Stacks in a Single Starter Kit Project

## Category

Code Organization

## Rule

Commit to a single Starter Kit frontend stack for the entire application. Never mix React components into a Vue Starter Kit, or Livewire components into a React Starter Kit.

## Reason

Starter Kits are opinionated about their frontend framework. Each kit's build pipeline (Vite configuration, routing, state management) is optimized for its specific stack. Mixing stacks creates duplicate build tooling, conflicting state management patterns, inconsistent UI rendering, and a maintenance nightmare. Components from different stacks cannot share state or communicate without complex bridging.

## Bad Example

```bash
# Started with React, added Livewire for "easy" features
php artisan install:react
# Later: composer require livewire/livewire
# Now managing two frontend pipelines
```

## Good Example

```bash
# Choose one and stick with it
php artisan install:react
# All frontend code in React
```

## Exceptions

Legacy migration projects where an existing codebase in one stack is being incrementally migrated to another. During the migration window, a clear migration plan and timeline must exist.

## Consequences Of Violation

Maintenance: Two frontend build pipelines, conflicting patterns. Performance: Duplicate assets, increased bundle size. Reliability: Cross-stack communication bugs.
