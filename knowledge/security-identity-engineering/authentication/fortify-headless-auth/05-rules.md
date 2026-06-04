# Rules: Fortify Headless Auth Backend

## Customize Fortify via Action Overrides, Never Vendor Files
---
## Category
Maintainability
---
## Rule
Override Fortify behavior by binding custom action classes in `App\Actions\Fortify\` through `FortifyServiceProvider`. Never modify files in the `vendor/` directory.
---
## Reason
Vendor files are overwritten on `composer update`. Customizing Fortify via action overrides ensures upgrades do not erase your customizations and keeps the upgrade path clean.
---
## Bad Example
```php
// Editing vendor/laravel/fortify/src/Actions/CreateNewUser.php directly
```
---
## Good Example
```php
// AppServiceProvider or FortifyServiceProvider
Fortify::createUsersUsing(CreateNewUser::class);

// App\Actions\Fortify\CreateNewUser.php
class CreateNewUser extends \Laravel\Fortify\Actions\CreateNewUser
{
    // Custom logic
}
```
---
## Exceptions
No common exceptions — Fortify explicitly designed for this pattern.
---
## Consequences Of Violation
Customizations lost on update, silent behavior regression.
---

## Enable Only Required Fortify Features
---
## Category
Security
---
## Rule
Configure `config/fortify.php` features array to enable only the authentication features the application actually uses.
---
## Reason
Enabling all features exposes unnecessary attack surface. Features like registration, email verification, and 2FA each add routes and behaviors. Disabled features remove those routes entirely, reducing the application's auth-related attack surface.
---
## Bad Example
```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication(),
    Features::updateProfileInformation(),
    Features::updatePasswords(),
],
```
---
## Good Example
```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true]),
],
```
---
## Exceptions
Applications that need all features may enable everything, but each enabled feature should be intentional.
---
## Consequences Of Violation
Unnecessary auth routes exposed, increased attack surface.
---

## Never Disable Login Rate Limiting in Production
---
## Category
Security
---
## Rule
Always configure and enable Fortify's login rate limiting in `FortifyServiceProvider::configureRateLimiting()`. Never set it to unlimited in production.
---
## Reason
Without rate limiting, brute force password attacks can try thousands of passwords per minute. Fortify's rate limiter is the primary defense against credential stuffing and brute force attacks.
---
## Bad Example
```php
RateLimiter::for('login', fn ($request) => Limit::none()); // Unlimited attempts
```
---
## Good Example
```php
RateLimiter::for('login', function (Request $request) {
    $key = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());
    return Limit::perMinute(5)->by($key);
});
```
---
## Exceptions
Temporary disable during debugging in non-production environments only.
---
## Consequences Of Violation
Brute force vulnerability, account takeover.
---

## Configure Mail Before Enabling Email Verification
---
## Category
Architecture
---
## Rule
Set up and test mail configuration before enabling `Features::emailVerification()` in Fortify. Verify that verification emails are deliverable.
---
## Reason
Fortify sends email verification links via Laravel's mail system. Without proper mail configuration, users cannot verify their email addresses and are locked out of email-verified routes. This creates an unrecoverable dead end for new users.
---
## Bad Example
```php
'features' => [Features::emailVerification()]; // Enabled without MAIL_* config
```
---
## Good Example
```php
// First configure MAIL_MAILER, MAIL_HOST, etc. in .env
// Test with: php artisan tinker -> Mail::raw('test', fn($m) => $m->to('test@example.com'));
// Then enable the feature
'features' => [Features::emailVerification()];
```
---
## Exceptions
Applications that handle verification independently without Fortify's built-in email flow.
---
## Consequences Of Violation
Users cannot verify emails, blocked from email-protected features, support tickets.
---

## Apply Password Confirmation for Sensitive Auth Actions
---
## Category
Security
---
## Rule
Apply the `password.confirm` middleware to routes for sensitive actions like disabling 2FA, changing email, or modifying security settings.
---
## Reason
Without password confirmation, an attacker with an active session (e.g., unlocked workstation) can disable a user's 2FA, change their email, or modify security credentials. Password re-entry ensures the legitimate user is still present.
---
## Bad Example
```php
Route::post('/user/two-factor-authentication', [TwoFactorController::class, 'disable'])
    ->middleware('auth'); // No password confirmation
```
---
## Good Example
```php
Route::post('/user/two-factor-authentication', [TwoFactorController::class, 'disable'])
    ->middleware(['auth', 'password.confirm']);
```
---
## Exceptions
API-only applications using token-based auth where the token itself represents recent authentication.
---
## Consequences Of Violation
Session-based security setting modification, 2FA bypass, account takeover.
---

## Set Fortify RedirectsTo for Post-Login Destination
---
## Category
Maintainability
---
## Rule
Define `Fortify::redirectsTo()` in a service provider to set the post-login redirect path explicitly.
---
## Reason
Fortify defaults to redirecting to `/dashboard`. Without explicit configuration, the redirect destination is implicit and may not match the application's route structure. Explicit configuration makes the behavior clear and testable.
---
## Bad Example
```php
// Relying on Fortify default — implicit /dashboard redirect
```
---
## Good Example
```php
// FortifyServiceProvider::boot()
Fortify::redirectsTo(function () {
    return route('home');
});
```
---
## Exceptions
When the default `/dashboard` route matches the application structure exactly.
---
## Consequences Of Violation
Users redirected to non-existent routes, 404 after login.
---

## Do Not Re-Implement Fortify Features in Custom Controllers
---
## Category
Framework Usage
---
## Rule
Use the Fortify features array to enable built-in functionality. Do not create custom controllers that duplicate Fortify's authentication logic.
---
## Reason
Fortify already handles login, registration, password reset, email verification, and 2FA. Re-implementing these in custom controllers duplicates maintenance burden, increases bug surface, and risks missing security updates. The features array is simpler and safer.
---
## Bad Example
```php
// Custom LoginController duplicating Fortify login logic
class LoginController extends Controller {
    public function login(Request $request) { /* re-implemented auth */ }
}
```
---
## Good Example
```php
'features' => [Features::registration()]; // Let Fortify handle it
// Only override actions when behavior must change
Fortify::createUsersUsing(CustomCreateUser::class);
```
---
## Exceptions
When Fortify's action pattern is insufficient and full controller control is required (rare).
---
## Consequences Of Violation
Maintenance burden, security update gaps, duplicated logic.
