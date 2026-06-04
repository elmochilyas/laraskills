# Anti-Patterns: Fortify Headless Auth Backend

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Fortify Headless Auth Backend |
| Audience | Architects, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-FH-01 | Vendor File Modification | Critical | Medium | Low |
| AP-FH-02 | Feature Bloat Enablement | High | High | Low |
| AP-FH-03 | Disabled Rate Limiting | Critical | Medium | Low |
| AP-FH-04 | Mail-Skipped Email Verification | High | Medium | Medium |
| AP-FH-05 | Unnecessary Action Override Proliferation | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Fortify Without Frontend**: Installing Fortify with no plan to build auth UI routes — half-configured backend
- **Stale Fortify Config**: Publishing config once and never revisiting when features change or upgrade
- **Missing 2FA Confirmation**: Skipping `confirmPassword` in 2FA feature config, leaving 2FA settings unprotected

---

## 1. Vendor File Modification

### Category
Maintainability · Framework Usage

### Description
Editing Fortify's vendor files directly in `vendor/laravel/fortify/` instead of using the action override pattern through `App\Actions\Fortify\*` classes.

### Why It Happens
Developers unfamiliar with Fortify's action pattern search for the controller or action code, find it in `vendor/`, and edit it there. In a time crunch, modifying vendor files feels faster than learning the override mechanism.

### Warning Signs
- Changes to `vendor/laravel/fortify/` tracked in git (they shouldn't be)
- `composer update` breaks authentication behavior
- Custom logic found in `vendor/` files during code review
- No `App\Actions\Fortify\` directory present despite custom auth behavior

### Why Harmful
Vendor files are overwritten on every `composer update`. All customizations vanish silently, causing authentication to revert to defaults. The team is unaware until a user reports broken registration or login flow after a deployment that included a composer update.

### Real-World Consequences
- Production outage after `composer update` — user registration silently broken
- Security patch (e.g., `composer update laravel/fortify`) removes custom validation logic
- New developer onboarding wastes days because "auth customizations" are untraceable
- CI pipeline passes tests but production auth breaks after fresh `composer install`

### Preferred Alternative
Extend Fortify action classes in `App\Actions\Fortify\` and register via `Fortify::createUsersUsing()`:
```php
class CreateNewUser extends \Laravel\Fortify\Actions\CreateNewUser
{
    public function create(array $input): User
    {
        // Custom logic here
    }
}
```

### Refactoring Strategy
1. Identify all modified vendor files via `git diff vendor/` or `git status`
2. For each modified file, extract custom logic into an `App\Actions\Fortify\*` class
3. Register the custom action in `FortifyServiceProvider`
4. Restore vendor files to original state: `git checkout vendor/laravel/fortify/`
5. Run `composer update` and verify all customizations survive
6. Add `vendor/` to `.gitignore` locally if not already ignored globally

### Detection Checklist
- [ ] `git diff --name-only vendor/` — any tracked vendor changes
- [ ] Does `App\Actions\Fortify\` exist and contain all overrides?
- [ ] Run `composer update` locally and test auth flows
- [ ] CI pipeline should run `git diff --exit-code vendor/` as a check

### Related Rules/Skills/Trees
- Customize Fortify via Action Overrides, Never Vendor Files (05-rules.md)
- Customize Fortify Headless Auth Backend (06-skills.md)
- Action Customization Strategy decision tree (07-decision-trees.md)

---

## 2. Feature Bloat Enablement

### Category
Security · Maintainability

### Description
Enabling all Fortify features in `config/fortify.php` without reviewing which ones the application actually needs, exposing unnecessary authentication routes.

### Why It Happens
The default Fortify config or documentation examples show all features enabled. Developers copy the config verbatim without auditing each feature. "Enable everything, disable later" rarely results in later cleanup.

### Warning Signs
- `config/fortify.php` has every `Features::*()` call enabled
- Routes exist for features the application doesn't use (password reset on an API-only app)
- Registration routes exposed on a whitelabel app that provisions users externally
- Profile update routes available when user profiles are managed elsewhere

### Why Harmful
Each enabled feature adds routes, controllers, middleware, and validation logic to the application's attack surface. Unused features are untested, unmonitored, and unmaintained — they may contain vulnerabilities that go unnoticed. The additional routes also clutter route listings and confuse developers.

### Real-World Consequences
- Password reset routes exposed on an API-only app where no mail system is configured — 500 errors when triggered
- Registration routes allow unauthorized user creation on an invite-only platform
- Security scan finds 2FA-related routes on an app that doesn't use 2FA, creating false positives
- Upgrade breaks an unused feature that no one tests, causing deployment failures

### Preferred Alternative
Enable only features the application uses:
```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

### Refactoring Strategy
1. Audit every feature in `config/fortify.php` against the application's requirements
2. Disable features not in use by removing them from the features array
3. Run `php artisan route:list` and verify only intended auth routes exist
4. Update frontend UI to match only enabled features
5. Add a comment in `config/fortify.php` documenting why each enabled feature is needed

### Detection Checklist
- [ ] Compare enabled features against documented requirements
- [ ] `php artisan route:list | grep 'laravel/fortify'` — count unexpected routes
- [ ] Test each enabled feature end-to-end in staging
- [ ] Check if mail is configured before enabling email verification

### Related Rules/Skills/Trees
- Enable Only Required Fortify Features (05-rules.md)
- Features to Enable decision tree (07-decision-trees.md)

---

## 3. Disabled Rate Limiting

### Category
Security · Critical

### Description
Disabling or not configuring Fortify's login rate limiting, leaving the authentication endpoint unprotected against brute force attacks.

### Why It Happens
During development, rate limiting is inconvenient because developers need to test login flows repeatedly. The rate limiter is set to `Limit::none()` or left unconfigured. The team forgets to restore it before production deployment.

### Warning Signs
- `RateLimiter::for('login', fn ($request) => Limit::none())` in `FortifyServiceProvider`
- No `configureRateLimiting()` method in `FortifyServiceProvider`
- Login endpoint accepts unlimited requests from a single IP
- No throttling response (429) observed during penetration testing

### Why Harmful
Without rate limiting, an attacker can attempt thousands of passwords per minute against any user account. Credential stuffing attacks (using breached passwords from other sites) become trivially feasible. The 6-digit TOTP code (1M combinations) also becomes vulnerable without rate limiting.

### Real-World Consequences
- Account takeover via brute force — attacker guesses weak passwords
- Credential stuffing attack succeeds — breached credentials from other sites work
- Compliance violation (OWASP ASVS requires rate limiting on auth endpoints)
- User accounts locked out by active brute force attack (if lockout policy exists without rate limit)

### Preferred Alternative
Configure rate limiting with reasonable thresholds:
```php
RateLimiter::for('login', function (Request $request) {
    $key = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());
    return Limit::perMinute(5)->by($key);
});
```

### Refactoring Strategy
1. Implement `configureRateLimiting()` in `FortifyServiceProvider`
2. Set per-email+IP key to prevent distributed attacks
3. Set threshold appropriate for the application (5-10 attempts per minute)
4. Test that rate limiting returns 429 responses on excess attempts
5. Configure Redis cache backend for rate limiter state in production

### Detection Checklist
- [ ] Does `FortifyServiceProvider` contain `configureRateLimiting()`?
- [ ] Search for `Limit::none()` in service providers
- [ ] Send 10 rapid login requests — verify 429 response on the 6th
- [ ] Check cache driver is Redis (not file) for rate limiter persistence

### Related Rules/Skills/Trees
- Never Disable Login Rate Limiting in Production (05-rules.md)
- Rate-Limit TOTP Verification Attempts (05-rules.md)

---

## 4. Mail-Skipped Email Verification

### Category
Architecture · Reliability

### Description
Enabling Fortify's email verification feature without configuring Laravel's mail system, causing verification emails to fail silently and locking users out of verified-only routes.

### Why It Happens
Email verification is enabled early in development when mail configuration is often incomplete or using `log` driver. The developer assumes mail will be configured "later" but the feature remains active without working delivery.

### Warning Signs
- `Features::emailVerification()` enabled but `MAIL_MAILER=log` in production
- Users report they never receive verification emails
- Support tickets from users stuck at "please verify your email" screens
- No mail queue configured for high-volume verification email sending

### Why Harmful
Users who register cannot verify their email and are permanently blocked from routes and features that require verified accounts. This creates an unrecoverable dead end — the user cannot log out and retry because the account is partially created. Support must manually verify accounts or delete them, creating operational burden.

### Real-World Consequences
- New user signups stuck at verification screen — conversion loss
- Support team manually verifying hundreds of users — operational overhead
- Users create multiple accounts because they think the first one failed
- Compliance violation for apps requiring verified emails (KYC, financial services)

### Preferred Alternative
Configure mail before enabling verification, and always test deliverability:
```php
// .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
```

### Refactoring Strategy
1. Configure production mail driver (SMTP, SES, Mailgun, Postmark)
2. Test mail delivery: `Mail::raw('test', fn($m) => $m->to('test@example.com'))`
3. Queue verification emails for better UX: configure `queue` mailer or dispatch job
4. Add monitoring for verification email failures (SesComplained, Mailgun bounces)
5. Consider adding a "resend verification" button with cool-down to the frontend

### Detection Checklist
- [ ] Is `Features::emailVerification()` enabled in config?
- [ ] Is mail driver configured for production (not `log`)?
- [ ] Send test email from production-like environment
- [ ] Check mail queue worker is running if using queue mailer
- [ ] Monitor mail provider dashboard for bounce/complaint rates

### Related Rules/Skills/Trees
- Configure Mail Before Enabling Email Verification (05-rules.md)
- Features to Enable decision tree (07-decision-trees.md)

---

## 5. Unnecessary Action Override Proliferation

### Category
Maintainability · Architecture

### Description
Overriding every Fortify action class unnecessarily, creating maintenance burden and code drift from Fortify defaults.

### Why It Happens
Developers believe they must override actions to customize any behavior. Documentation examples showing "how to override" are interpreted as "you should override." The team overrides actions without assessing whether the default behavior is sufficient.

### Warning Signs
- Every `App\Actions\Fortify\*` class is overridden even when no custom logic exists
- Overridden actions simply call `parent::method()` with no changes
- Custom actions copy-paste Fortify's entire default implementation with minor tweaks
- `FortifyServiceProvider` registers overrides for every available action

### Why Harmful
Each overridden action must be maintained, tested, and reviewed during upgrades. Overrides that mirror defaults create drift when Fortify's internal implementation changes. The team must manually verify that overridden actions remain compatible with each Laravel/Fortify upgrade.

### Real-World Consequences
- Fortify security patch shipped — overridden action has an old, vulnerable implementation
- Upgrade from Fortify v1.x to v2.x breaks because custom actions don't implement new interfaces
- Code review time wasted verifying overrides that add no value
- New team members think overriding everything is "the Laravel way"

### Preferred Alternative
Override only actions where custom behavior is needed:
```php
// Only override CreateNewUser if custom registration logic needed
Fortify::createUsersUsing(App\Actions\Fortify\CreateNewUser::class);
// Use Fortify's defaults for everything else
```

### Refactoring Strategy
1. Review each `App\Actions\Fortify\*` class and identify which have actual custom logic
2. For actions that mirror defaults, remove the override registration and delete the class
3. For actions with minimal modifications, consider if they can be composed rather than overridden
4. Document remaining overrides with a comment explaining why each is necessary

### Detection Checklist
- [ ] List all registered action overrides in `FortifyServiceProvider`
- [ ] Compare each against Fortify's default implementation in `vendor/`
- [ ] Mark actions that simply call `parent::method()` as candidates for removal
- [ ] Check if overridden actions reference any Fortify internals that changed recently

### Related Rules/Skills/Trees
- Customize Fortify via Action Overrides, Never Vendor Files (05-rules.md)
- Do Not Re-Implement Fortify Features in Custom Controllers (05-rules.md)
- Action Customization Strategy decision tree (07-decision-trees.md)
