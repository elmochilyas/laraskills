# Skill: Customize Fortify Headless Auth Backend for Custom Frontend Authentication

## Purpose
Configure Laravel Fortify as a headless authentication backend, enabling custom frontend UIs with upgrade-safe action overrides for login, registration, 2FA, and password management.

## When To Use
- Custom frontend authentication UI (any stack — React, Vue, Livewire, Svelte)
- Projects needing upgrade-safe auth without published controllers
- Laravel 12/13 Starter Kits where Fortify ships as the backend
- Fine-grained control over auth behavior without modifying vendor code

## When NOT To Use
- Projects needing simple scaffolding (use Breeze or Starter Kits)
- When full controller code ownership is required (Fortify abstracts them)
- Simple applications where published legacy controllers are acceptable

## Prerequisites
- `composer require laravel/fortify`
- `php artisan vendor:publish --tag=fortify-config`
- `php artisan vendor:publish --tag=fortify-actions` (for customization)
- Laravel auth guards configured in `config/auth.php`

## Inputs
- Required auth features (registration, login, 2FA, email verification, password reset)
- Custom action classes for override (CreateNewUser, UpdateUserPassword, etc.)
- Rate limiting configuration for login and 2FA
- Post-login redirect destination

## Workflow (numbered)
1. Install Fortify and publish config, actions, and views
2. Configure `config/fortify.php` features array — enable only needed features
3. Override actions via `App\Actions\Fortify\*` — never modify vendor files
4. Configure login rate limiting in `FortifyServiceProvider::configureRateLimiting()`
5. Set post-login redirect: `Fortify::redirectsTo()`
6. Configure mail before enabling email verification feature
7. Apply `password.confirm` middleware for sensitive routes (2FA disable, email change)
8. Build frontend UI for enabled features (login, register, 2FA setup, password reset)

## Validation Checklist
- [ ] Features array enables only required auth features
- [ ] Action overrides in `App\Actions\Fortify\` (not vendor files)
- [ ] Login rate limiting configured (not unlimited)
- [ ] Mail configured if email verification is enabled
- [ ] `Fortify::redirectsTo()` set correctly
- [ ] Password confirmation on sensitive routes

## Common Failures
- Modifying vendor files instead of action overrides (changes lost on update)
- Enabling all features unnecessarily (increased attack surface)
- Disabling login rate limiting (brute force vulnerability)
- Enabling email verification without mail config (users locked out)

## Decision Points
- **Features to enable**: registration, password reset, 2FA, email verification — only what the app needs
- **Action override**: override only when custom behavior needed; use defaults otherwise
- **Rate limit**: 5 attempts per minute default; adjust based on security requirements

## Performance Considerations
- Fortify routes and controllers are lazy-loaded — minimal overhead
- Rate limiting uses Laravel's Cache — Redis-backed in production
- 2FA adds ~50ms TOTP verification per challenge

## Security Considerations
- Login rate limiting is the primary brute force defense — never disable
- Password confirmation prevents session-based security setting changes
- Email verification prevents unverified accounts from using verified-only features

## Related Rules (from 05-rules.md)
- Customize Fortify via Action Overrides, Never Vendor Files
- Enable Only Required Fortify Features
- Never Disable Login Rate Limiting in Production
- Configure Mail Before Enabling Email Verification
- Apply Password Confirmation for Sensitive Auth Actions
- Set Fortify RedirectsTo for Post-Login Destination
- Do Not Re-Implement Fortify Features in Custom Controllers

## Related Skills
- Implement MFA/TOTP with Fortify
- Configure Auth Guards and Providers
- Set Up Sanctum SPA and Token Authentication
- Configure Laravel Starter Kits

## Success Criteria
- Users can register, login, reset passwords through Fortify routes
- Action overrides work without modifying vendor files
- Login rate limiting blocks brute force attempts
- Email verification sends and confirms emails (if enabled)
- 2FA setup and challenge works end-to-end
- Password confirmation protects sensitive settings
