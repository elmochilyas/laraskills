# Laravel Breeze Auth Scaffolding — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel Breeze Auth Scaffolding (Legacy Context) |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Using Breeze for New Laravel Projects
2. Extensively Modifying Breeze Published Controllers
3. Not Monitoring Security Patches for Breeze Controllers
4. Disabling Email Verification
5. No Rate Limiting on Breeze Login Routes

---

## Repository-Wide Anti-Patterns

- **Rolling custom auth alongside Breeze**: Building duplicate auth logic on top of scaffolding.
- **Staying on Breeze indefinitely**: Increasing maintenance burden as Laravel evolves away from published-controller pattern.
- **Assuming composer update patches Breeze controllers**: Published files in `app/` are not updated by Composer.

---

## Anti-Pattern 1: Using Breeze for New Laravel Projects

### Category

Framework Usage

### Description

Installing `laravel/breeze` and running `php artisan breeze:install` on a new Laravel 12/13+ project instead of using the current stack-specific Starter Kits.

### Why It Happens

Breeze is well-documented, the name is familiar, and many tutorials reference it. Developers may not be aware it's deprecated in favor of Starter Kits.

### Warning Signs

- `composer.json` contains `laravel/breeze` for a project created with Laravel 12/13+
- Authentication controllers exist in `app/Http/Controllers/Auth/`
- Project was scaffolded with the published-controller pattern instead of Fortify actions
- No Fortify configuration in `config/fortify.php`

### Why Harmful

Breeze is deprecated for new projects. It publishes controllers directly to the application namespace, requiring manual security patch application. The current Starter Kits use Fortify's action pattern — security patches are applied automatically via `composer update`. Using Breeze for new projects inherits a deprecated architecture with unnecessary maintenance burden.

### Consequences

- Deprecated scaffolding with no automatic security patches
- Manual patch effort for every Laravel security release
- Technical debt from using an outdated architecture pattern
- Migration effort required before the next major version upgrade

### Alternative

Use the stack-specific Starter Kits provided with Laravel 12/13+. Run `php artisan install:livewire` (or `install:react`, `install:vue`, `install:svelte`) instead.

### Refactoring Strategy

1. Remove Breeze: `composer remove laravel/breeze`
2. Install the appropriate Starter Kit: `php artisan install:livewire`
3. Update route references from Breeze's manual routes to Starter Kit patterns
4. Verify all auth flows work (login, register, password reset, email verification)

### Detection Checklist

- [ ] No `laravel/breeze` in `composer.json` for Laravel 12/13+ projects
- [ ] New projects use `php artisan install:*` commands, not `breeze:install`
- [ ] Auth uses Fortify actions, not published controllers
- [ ] Project is on a supported, upgrade-safe auth architecture

### Related Rules

- Never Use Breeze for New Laravel Projects (05-rules.md)

### Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md)

### Related Decision Trees

- Breeze vs Starter Kit for New Laravel Projects (07-decision-trees.md)

---

## Anti-Pattern 2: Extensively Modifying Breeze Published Controllers

### Category

Architecture

### Description

Making extensive customizations directly to Breeze's published controllers in `app/Http/Controllers/Auth/` instead of extracting custom logic into Fortify action classes.

### Why It Happens

The controllers are in the application namespace and look like regular code. Developers naturally modify them for custom registration workflows, login redirects, or additional validation.

### Warning Signs

- `RegisteredUserController` contains 50+ lines of custom business logic
- Custom validation, external API calls, or workflow steps in published auth controllers
- Breeze controllers reference application-specific services or models
- Migration to Starter Kits is blocked because "controllers are too customized"

### Why Harmful

Breeze publishes controllers directly into `app/Http/Controllers/Auth/`, making them part of your application code. Direct modifications couple your business logic to the controller structure. When migrating to Starter Kits (which use Fortify actions), all that custom logic must be manually extracted and reimplemented. The deeper the customizations, the harder the migration.

### Consequences

- Custom logic coupled to Breeze's controller structure
- Migration to Starter Kits requires manual extraction of all customizations
- Increased migration effort proportional to customization depth
- Risk of regression during migration — custom workflows may break

### Alternative

Extract custom registration, login, or password reset logic into Fortify action classes (`App\Actions\Fortify\CreateNewUser`, `UpdateUserPassword`, etc.). Keep Breeze controllers minimal (or bypass them entirely with Fortify routes).

### Refactoring Strategy

1. Identify custom logic in Breeze controllers
2. Extract into Fortify action classes
3. Install Fortify and configure routes to use Fortify actions
4. Remove Breeze controllers after Fortify actions are verified

### Detection Checklist

- [ ] Breeze controllers contain minimal or no custom business logic
- [ ] Custom authentication logic lives in Fortify action classes
- [ ] Migration to Starter Kits is straightforward (actions transfer directly)
- [ ] No application-specific code coupled to Breeze's controller structure

### Related Rules

- Prefer Fortify Actions Over Direct Controller Modification (05-rules.md)

### Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md)

### Related Decision Trees

- Breeze Migration Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Not Monitoring Security Patches for Breeze Controllers

### Category

Security

### Description

Assuming that running `composer update` automatically applies security patches to Breeze's published authentication controllers.

### Why It Happens

Developers are accustomed to Composer handling dependency updates. They don't realize that Breeze publishes files to the application namespace (`app/Http/Controllers/Auth/`), which are not managed by Composer.

### Warning Signs

- Breeze controllers exist in `app/` and haven't been manually updated since installation
- No process for reviewing Laravel changelog for auth security fixes
- `composer update` is the only "security patching" process
- Published controllers differ from the latest Breeze release

### Why Harmful

Breeze publishes authentication controllers to `app/Http/Controllers/Auth/`, placing them under your full ownership. When Laravel releases a security fix for authentication (e.g., rate limiting changes, session regeneration improvements, CSRF updates), the published controllers in your application namespace are not updated by `composer update`. A known vulnerability in your auth controllers persists until someone manually updates them.

### Consequences

- Known CVE in authentication controllers persists after composer update
- Vulnerability window between disclosure and manual patch
- Security audit failure — patched Laravel but not published controllers
- Compliance violation for timely patch management

### Alternative

Subscribe to the Laravel changelog. After each Laravel release, compare published Breeze controllers against the latest version and manually apply auth-related security patches.

### Refactoring Strategy

1. Set up a process to monitor Laravel changelog for auth security fixes
2. After each relevant release, diff Breeze controllers against latest upstream
3. Manually apply security patches to `app/Http/Controllers/Auth/*`
4. Plan migration to Starter Kits to eliminate the manual patching burden

### Detection Checklist

- [ ] Published Breeze controllers are monitored for security patches
- [ ] Process exists for reviewing Laravel changelog auth changes
- [ ] Controllers are up to date with latest security fixes
- [ ] Migration to Starter Kits is planned to eliminate manual patching
- [ ] No known unpatched vulnerabilities in auth controllers

### Related Rules

- Always Monitor Security Patches for Breeze Controllers (05-rules.md)

### Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md)

### Related Decision Trees

- Breeze Migration Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Disabling Email Verification

### Category

Security

### Description

Removing or commenting out email verification routes, controllers, or middleware from Breeze's published scaffolding, allowing unverified user registrations.

### Why It Happens

Developers disable email verification for development speed, testing convenience, or because email configuration isn't set up yet. The change persists into production.

### Warning Signs

- Email verification routes removed from published Breeze route files
- `VerifiedMiddleware` not applied to protected routes
- User can access all application features without verifying their email
- No `mustVerifyEmail()` check in `config/fortify.php` or equivalent Breeze config

### Why Harmful

Email verification ensures that registered users control the email address they provided. Disabling it removes a critical identity validation layer, increases spam account risk, and creates a vector for account takeover via unverified email addresses. Unverified accounts can be created with any email address, including those belonging to existing users.

### Consequences

- Unverified user registrations — spam and fake accounts
- Account takeover vector — register with someone else's email
- Compliance failure — identity assurance requirements unmet
- Increased support burden from users whose emails are used by others

### Alternative

Keep email verification enabled. Configure mail properly for production. Use Laravel's built-in `mustVerifyEmail()` interface on the User model.

### Refactoring Strategy

1. Restore email verification routes and middleware
2. Configure mail in production (SMTP, Mailgun, Postmark, SES)
3. Implement the `MustVerifyEmail` contract on the User model
4. Apply `verified` middleware to sensitive routes

### Detection Checklist

- [ ] Email verification is enabled in production
- [ ] `MustVerifyEmail` is implemented on the User model
- [ ] Verified middleware is applied to authenticated routes
- [ ] Mail is properly configured to send verification emails
- [ ] No unverified users can access sensitive features

### Related Rules

- Never Disable Email Verification in Breeze Projects (05-rules.md)

### Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md)

### Related Decision Trees

- Breeze vs Starter Kit for New Laravel Projects (07-decision-trees.md)

---

## Anti-Pattern 5: No Rate Limiting on Breeze Login Routes

### Category

Security

### Description

Not applying rate limiting middleware to login routes in Breeze's published controllers, allowing unbounded brute-force password attempts.

### Why It Happens

Breeze's published controllers may not include rate limiting by default across all versions. Developers may not explicitly add the `throttle` middleware to the login route.

### Warning Signs

- Login route definition has no `->middleware('throttle:5,1')`
- Published `AuthenticatedSessionController` does not apply rate limiting
- No rate limiting configuration specific to login attempts
- Brute-force attack would go unthrottled

### Why Harmful

Without rate limiting, brute-force password attacks against user accounts are unthrottled, making credential guessing practically unbounded. An attacker can attempt thousands of passwords per minute against any user account until successful. Rate limiting at 5 attempts per minute dramatically reduces the feasibility of brute-force attacks.

### Consequences

- Unbounded brute-force attacks against user credentials
- Account compromise via password guessing
- Compliance failure — OWASP authentication guideline AS-3
- No logging or alerting on repeated login failures

### Alternative

Apply the `throttle:5,1` middleware to the login route to limit to 5 attempts per minute.

### Refactoring Strategy

1. Add `throttle:5,1` middleware to the login route in the Breeze route file
2. Verify that excessive login attempts return `429 Too Many Requests`
3. Consider increasing the limit for high-traffic applications (but never remove it entirely)
4. Log failed login attempts for monitoring

### Detection Checklist

- [ ] Login route has `throttle` middleware applied
- [ ] Rate limit is set to a reasonable value (5-10 attempts per minute)
- [ ] Excessive login attempts return 429 status
- [ ] Failed login attempts are logged for monitoring
- [ ] No brute-force vulnerability in login endpoint

### Related Rules

- Verify Rate Limiting Configuration on Breeze Login Routes (05-rules.md)

### Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md)

### Related Decision Trees

- Breeze vs Starter Kit for New Laravel Projects (07-decision-trees.md)
