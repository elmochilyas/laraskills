# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Never Use Breeze for New Laravel Projects

## Category

Framework Usage

## Rule

Never install `laravel/breeze` or run `php artisan breeze:install` on a new Laravel 12/13+ project.

## Reason

Breeze is deprecated and only maintained for Laravel 11.x and prior. New projects must use the stack-specific Starter Kits (React, Vue, Svelte, Livewire) which provide upgrade-safe authentication via Fortify's action pattern.

## Bad Example

```bash
composer create-project laravel/laravel new-app
cd new-app
composer require laravel/breeze
php artisan breeze:install
```

## Good Example

```bash
composer create-project laravel/laravel new-app
cd new-app
php artisan install:api
php artisan install:livewire
```

## Exceptions

Existing Laravel 11.x projects already using Breeze may continue using it until the next major version upgrade, at which point migration to Starter Kits should be planned.

## Consequences Of Violation

Security: Published controllers require manual security patch application; no automatic updates. Maintenance: Manual upgrade effort for every Laravel release. Scalability: Increasing technical debt as Laravel evolves away from the published-controller pattern.

---

## Rule Name

Prefer Fortify Actions Over Direct Controller Modification

## Category

Architecture

## Rule

When customizing Breeze authentication behavior, never modify the published controllers directly. Instead, extract the customization into Fortify action classes or service classes.

## Reason

Breeze publishes controllers directly into `app/Http/Controllers/Auth/`, making them part of your application code. Direct modifications couple your business logic to the controller structure, making migration to Starter Kits harder. Fortify actions provide an upgrade-safe customization layer.

## Bad Example

```php
// app/Http/Controllers/Auth/RegisteredUserController.php
// Directly modified — changes are coupled to Breeze structure
public function store(StoreRequest $request): RedirectResponse
{
    // Custom registration logic mixed with controller concerns
    $this->customWorkflow($request);
    return $this->createUser($request);
}
```

## Good Example

```php
// App\Actions\Fortify\CreateNewUser.php
public function create(array $input): User
{
    // Custom logic in a Fortify action — migrates cleanly to Starter Kits
    return $this->customWorkflow($input);
}
```

## Exceptions

Trivial UI-only changes (label text, redirection targets) may be applied directly to published views, as views are replaced during migration anyway.

## Consequences Of Violation

Maintenance: Heavier migration effort when moving to Starter Kits. Security: Custom logic bypasses Fortify's upgrade-safe patching.

---

## Rule Name

Always Monitor Security Patches for Breeze Controllers

## Category

Security

## Rule

For existing Breeze-based projects, subscribe to the Laravel changelog and manually review auth-related security patches each release. Never assume published controllers receive automatic security updates.

## Reason

Breeze publishes authentication controllers to `app/Http/Controllers/Auth/`, placing them under your full ownership. When Laravel releases a security fix for authentication (e.g., rate limiting changes, session regeneration improvements), the published controllers in your application namespace are not updated by `composer update`.

## Bad Example

```bash
# Relying on composer update to patch Breeze controllers
composer update
# Assumption: auth controllers are now patched
# Reality: published files in app/ are unchanged
```

## Good Example

```bash
# After each Laravel release, check the changelog
# Compare published Breeze controllers against the latest version
# Manually apply auth-related security patches
git diff --stat app/Http/Controllers/Auth/
```

## Exceptions

No common exceptions. All Breeze-based projects require manual security patch monitoring regardless of size or traffic.

## Consequences Of Violation

Security: Known vulnerabilities remain unpatched until manual intervention. Compliance: Fails automated security scanning requirements. Reliability: Exploit window grows with every unpatched release.

---

## Rule Name

Plan Migration to Starter Kits During Next Major Upgrade

## Category

Maintainability

## Rule

When a Breeze-based project undergoes a major Laravel version upgrade (e.g., 11 → 12 or 12 → 13), simultaneously migrate from Breeze to the equivalent Starter Kit. Never stay on Breeze across multiple major versions.

## Reason

Each major Laravel release deepens the architectural gap between Breeze's published-controller pattern and the current Fortify + Sanctum + Passkeys stack. Staying on Breeze accumulates technical debt: manual patch effort increases, ecosystem packages assume Starter Kit structure, and the migration surface grows larger.

## Bad Example

```bash
# Upgrading Laravel without addressing Breeze
composer update laravel/framework
# Breeze controllers remain — now incompatible with new features
```

## Good Example

```bash
composer remove laravel/breeze
rm -rf app/Http/Controllers/Auth/
php artisan install:livewire
# Update any route references to use Starter Kit patterns
```

## Exceptions

Projects on a long-term support (LTS) Laravel version may defer migration until the next LTS cycle, provided manual security patching is maintained.

## Consequences Of Violation

Maintenance: Increasing divergence from upstream auth patterns. Security: Growing manual patch burden. Scalability: Difficulty adopting new Laravel auth features (passkeys, WebAuthn).

---

## Rule Name

Never Disable Email Verification in Breeze Projects

## Category

Security

## Rule

Always keep email verification enabled (`Features::emailVerification()`) in Breeze-based projects. Never comment out or remove the email verification feature from the published routes or configuration.

## Reason

Email verification ensures that registered users control the email address they provided. Disabling it removes a critical identity validation layer, increases spam account risk, and creates a vector for account takeover via unverified email addresses.

## Bad Example

```php
// routes/auth.php or similar published Breeze route file
// Email verification routes removed
Route::get('/register', [RegisteredUserController::class, 'create']);
Route::post('/register', [RegisteredUserController::class, 'store']);
// verify email routes omitted
```

## Good Example

```php
// Email verification routes remain active
Route::get('/register', [RegisteredUserController::class, 'create']);
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::get('/verify-email', [EmailVerificationPromptController::class, '__invoke'])
    ->middleware('auth');
Route::get('/verify-email/{id}/{hash}', [VerifyEmailController::class, '__invoke'])
    ->middleware(['auth', 'signed', 'throttle:6,1']);
```

## Exceptions

Internal-only applications (corporate intranets, admin panels) where email delivery is unavailable and all users are manually created by administrators.

## Consequences Of Violation

Security: Unverified identities increase fraud and spam account risk. Compliance: Fails identity assurance requirements for regulated industries.

---

## Rule Name

Verify Rate Limiting Configuration on Breeze Login Routes

## Category

Security

## Rule

Always confirm that rate limiting middleware is applied to Breeze login routes. Never assume the default 5-attempts-per-minute limit is active without explicit verification.

## Reason

Breeze's published controllers may not include rate limiting by default across all versions. Without rate limiting, brute-force password attacks against user accounts are unthrottled, making credential guessing practically unbounded.

## Bad Example

```php
// Published Breeze controller — no rate limiting
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();
    $request->session()->regenerate();
    return redirect()->intended(RouteServiceProvider::HOME);
}
```

## Good Example

```php
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
// Or apply middleware directly:
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();
    $request->session()->regenerate();
    return redirect()->intended(RouteServiceProvider::HOME);
}
// Route definition with throttle:
Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:5,1');
```

## Exceptions

Applications using an alternative authentication mechanism (SSO, OAuth, passkeys) that does not expose password-based login endpoints.

## Consequences Of Violation

Security: Unbounded brute-force attacks against user credentials. Compliance: Fails OWASP authentication guideline AS-3.
