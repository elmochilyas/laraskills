# Metadata

Domain: Security & Identity Engineering
Subdomain: Additional Security Concerns
Knowledge Unit: Laravel Starter Kits (React, Vue, Svelte, Livewire - current)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel 12/13 Starter Kits are the current recommended authentication scaffolding, replacing the deprecated Breeze and Jetstream. Each kit targets a specific frontend stack: React, Vue, Svelte, or Livewire. All kits ship the canonical Laravel auth stack: Fortify (backend authentication) + Sanctum (SPA cookie auth) + Passkeys (WebAuthn). The kits provide pre-built login, registration, password reset, email verification, passkey registration, and profile management, with the frontend stack chosen at installation time. Unlike Breeze's published controllers, the starter kits use Fortify's action pattern — upgrade-safe.

---

# Core Concepts

- **Stack-Specific**: Four kits — React (Inertia), Vue (Inertia), Svelte (Inertia), Livewire (with Volt). Choose the one matching your frontend stack.
- **Canonical Stack**: Every kit uses Fortify + Sanctum + Passkeys. The same backend regardless of frontend choice.
- **Fortify Actions**: Authentication logic lives in Fortify's action classes (`App\Actions\Fortify\*`). Customizable via overrides, not by modifying published controllers.
- **Passkey Support**: All kits include WebAuthn passkey registration and login out of the box via `laravel/passkeys`.
- **Dark Mode**: Built-in dark mode support across all stacks.
- **Profile Management**: Name, email, password update, passkey management, and 2FA TOTP settings.

---

# Mental Models

- **Pick Stack, Get Auth**: The decision is only about the frontend stack. The backend auth implementation is identical across all kits.
- **Upgrade-Safe**: Because Fortify handles the auth logic, security patches are received via Composer updates — not manual file patches.

---

# Installation

- `composer create-project laravel/laravel` → `php artisan install:api` (for Sanctum routes) → `php artisan install:livewire` or `install:react` or `install:vue` or `install:svelte`.
- Each install command publishes the starter kit files for the chosen stack.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| React vs Vue vs Svelte vs Livewire | Frontend team expertise and preference | Choose by team skill. Livewire for server-rendered apps; React/Vue/Svelte for SPA architecture |
| Starter Kit vs manual Fortify setup | Rapid prototyping vs custom UI | Starter Kit for most projects; manual Fortify for custom-branded auth UI |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Upgrade-safe auth (Fortify actions) | Less code ownership than Breeze | Customization requires understanding Fortify's action pattern |
| Passkeys included out of the box | Passkeys are pre-1.0 — API may change | Pin exact package versions; monitor changelog |
| Stack-specific = no unused code | Cannot switch frontend stack without re-install | Choose carefully — React starter kit is React-only |

---

# Production Considerations

- **Customization**: Starter Kit views are published and modifiable. Backend actions are in `App\Actions\Fortify\` — customize via the action pattern.
- **Testing**: Starter Kit provides basic authentication tests. Extend test coverage for custom auth flows.
- **Upgrades**: `composer update` updates Fortify, Sanctum, and Passkeys. Starter Kit frontend files are published — review diff on upgrades.

---

# Common Mistakes

- **Modifying vendor-published Fortify files**: Published views and actions are for customization. But modifying files in `vendor/` is overwritten on update. Only modify published files.
- **Choosing the wrong stack**: Picking Livewire Starter Kit for an SPA that needs React means rebuilding the entire frontend. Evaluate frontend requirements before choosing.
- **Expecting Jetstream features**: Starter Kits do NOT include teams or API token management. Build those separately if needed.
- **Not enabling passkey feature**: Passkeys are available but may need enabling in `config/fortify.php` features array.

---

# Related Knowledge Units

- Prerequisites: Fortify headless auth backend, Sanctum SPA vs Token auth, First-party Passkeys/WebAuthn
- Related: Laravel Breeze (legacy), Laravel Jetstream (legacy)
- Advanced Follow-up: Customizing Starter Kit views, Starter Kit upgrade strategies between major Laravel versions

## Ecosystem Usage
- **Enlightn**: Comprehensive static and dynamic security analysis integrating 100+ checks; CI/CD integration via Artisan command; provides scoring that can be gated for deployment approval.
- **Laravel Shield**: Community package for protecting staging/environment sites with HTTP basic auth or IP whitelisting; integrates with middleware for route-level access control.
- **Password Validation**: Laravel's built-in password validation rules (Password::min(), Password::mixedCase(), Password::letters(), Password::symbols()); integrates with Form Requests and Validator facade.
- **Server Header Hardening**: Community middleware packages remove X-Powered-By, Server, and framework-specific headers; spatie/laravel-empty-views and custom middleware strip response headers for security.
- **Dependency Security**: composer audit integrated into CI/CD pipelines; oave/security-advisories composer plugin blocks packages with known vulnerabilities; PyPi/
pm audit for non-PHP dependencies.
- **Starter Kit Security**: Breeze and Jetstream starter kits include pre-configured authentication views, password confirmation, email verification, and rate limiting for auth endpoints.
- **Laravel Security Scan**: enlightn and sonar packages provide security scanning with configurable check categories; static analysis finds configuration issues without application execution.
- **Password Complexity Rules**: Laravel 11+ provides expressive password validation via Password::defaults(); rules include minimum length, mixed case, letters, numbers, symbols, uncompromised (HaveIBeenPwned API).

## Research Notes
- Enlightn's check categories expanded to over 120 checks in 2026, covering Laravel 12-specific configuration items including Reverb security settings, Pulse dashboard authorization, and Pennant feature flag security.
- The enlightn scoring system assigns weights to each check based on severity — configuration-related checks (APP_DEBUG, APP_KEY strength) carry higher weights than optimization checks, enabling CI/CD gating based on minimum security scores.
- Password validation in Laravel 11+ allows rule chaining via Password::min(8)->mixedCase()->letters()->numbers()->symbols()->uncompromised() — the uncompromised() rule checks against the HaveIBeenPwned API using k-anonymity (partial hash matching).
- Server header hardening removes X-Powered-By, Server, and Laravel-specific headers via middleware — this prevents attackers from fingerprinting the exact framework version for targeted vulnerability exploitation.
- Breeze and Jetstream starter kits include security defaults (password confirmation, rate-limited login, email verification) that are often missing in custom authentication implementations — using starter kits for new projects provides security best practices by default.
- The composer audit command was improved in Composer 2.7+ with real-time advisory database updates and improved vulnerability matching — integrating this into CI/CD with a blocking threshold on critical/moderate vulnerabilities is security best practice.
- Community security scanning packages provide additional checks beyond Enlightn: spatie/laravel-security-checker focuses on known vulnerability scanning, and jackiedo/dotenv-editor prevents accidental .env file exposure.
- Laravel Shield and similar site protection packages use basic HTTP authentication (.htpasswd style) or IP whitelisting — these protect staging environments from public access but are not replacements for proper authentication on production.

## Internal Mechanics
- **Enlightn Check Execution Flow**: php artisan enlightn command runs checks → each check extends Enlightn\Enlightn\Check base class → checks are categorized as static (analyze source/config files) or dynamic (make HTTP requests to running app) → results are aggregated with pass/fail/warning status → a score is computed as (passed / total) * 100 → report is displayed in console output.
- **Password Validation Rule Chaining**: Password::min(8)->mixedCase()->letters() returns a Password rule instance — each method adds a constraint to an internal array → when the rule is used in a validator, it iterates over all constraints and runs each validation check → constraints are evaluated in order, failing fast on the first violation.
- **Server Header Removal Flow**: Custom middleware or community package modifies the response in handle(, ) → calls $response->headers->remove('X-Powered-By') and $response->headers->remove('Server') → for Laravel-specific headers (X-RateLimit-Remaining, etc.), Config::set('app.debug', true) or package-level configuration controls header visibility.
- **Composer Audit Integration Flow**: CI pipeline step runs composer audit --format=json → parses the JSON output for advisories → checks severity levels against a policy (critical: block, high: block, moderate: warn, low: info) → pipeline step fails if blocking advisories are found → deployment is prevented until advisories are resolved.
- **Breeze Security Flow**: laravel breeze installs authentication scaffolding with AuthController or equivalent → login route is rate-limited (5 attempts/minute by default) → password confirmation middleware is applied to sensitive routes → email verification is enabled by default in Jetstream — these are convention-based security defaults, not mandatory.
- **Staging Site Protection Flow**: Laravel Shield middleware checks Request::ip() against allowed IPs or validates HTTP Basic Auth credentials → if the request does not match the allowed list, a 403 or 401 response is returned → the protection check happens early in the middleware stack, before the application controller executes.

## Patterns

- **Defense in depth**: Multiple overlapping security controls (authentication + authorization + encryption + auditing + rate limiting) ensure no single failure compromises the system. Each layer provides backup protection if an outer layer is bypassed.
- **Principle of least privilege**: Grant the minimum permissions necessary for each component. Users get only needed scopes, services get only needed API keys, processes run with minimum OS privileges.
- **Authentication delegation**: Use dedicated authentication services (Fortify, Sanctum, Passport, WorkOS) that handle credential verification, token issuance, and session management. Application code should never handle passwords directly.
- **Authorization as middleware**: Enforce access control at the route/middleware level using gates, policies, and middleware before controller logic executes. This prevents authorization gaps when controllers are called from multiple entry points.
- **Secure defaults**: Configuration should default to the most secure option (HSTS enabled, HTTPS enforced, encryption at rest enabled). Developers must explicitly opt into less secure configurations.

## Performance Considerations

- **Authentication overhead**: Each authentication request adds 5-50ms for credential verification, session creation, and token generation. Cache session data in Redis to reduce database load.
- **Authorization check cost**: Policy and gate checks execute on every request. Policy auto-discovery adds negligible overhead (cached after first resolution). For high-throughput endpoints, cache permission results with user-based cache keys.
- **Encryption performance**: Encryption/decryption operations add 0.1-2ms per field. For high-throughput APIs, encrypt only sensitive fields rather than entire payloads.
- **Rate limiting overhead**: In-memory rate limiting (Cache::driver('array')) is faster than Redis-backed limiting. Use Redis-based limiting for distributed deployments; array-based for single-server setups.
- **Session storage**: File-based sessions degrade under high concurrency. Use Redis or database sessions for production deployments with multiple web servers.
- **Header processing**: Security headers (CSP, HSTS, etc.) are set once per response and add negligible overhead. However, CSP policy size affects browser parsing time. Keep CSP directives focused on actual requirements.

## Failure Modes

- **Authentication bypass**: Missing middleware on route groups allows unauthenticated access to protected endpoints. Use route grouping with consistent middleware application. Test authentication requirements in every deployment.
- **Session fixation**: Without session regeneration after login, an attacker can fixate a session ID and hijack the authenticated session. Always call session()->regenerate() after successful authentication.
- **Token leakage**: API tokens in URL parameters, logs, or error responses expose credentials. Use Authorization header exclusively for token transmission. Sanitize tokens from log output.
- **CSRF bypass**: Missing or misconfigured CSRF token verification allows cross-site request forgery. Ensure VerifyCsrfToken middleware is applied to all state-changing routes.
- **Rate limit exhaustion**: Legitimate users blocked by aggressive rate limiting. Monitor rate limit hit rates and adjust thresholds based on actual traffic patterns. Use tiered rate limiting (guest vs. authenticated vs. admin).
- **Security header misconfiguration**: Incorrect CSP directives can block legitimate resources or leave vulnerabilities open. Use reporting endpoints (eport-uri/eport-to) to monitor CSP violations without blocking content.
