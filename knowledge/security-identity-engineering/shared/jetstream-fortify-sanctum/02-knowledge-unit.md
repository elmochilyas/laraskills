# Metadata

Domain: Security & Identity Engineering
Subdomain: Additional Security Concerns
Knowledge Unit: Laravel Jetstream (Fortify + Sanctum - legacy context)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Jetstream was a feature-rich application starter kit built on Fortify (backend) and Sanctum (API/SPA auth), adding teams management, profile management, API token management, and Livewire/Inertia frontend stacks. Jetstream has been superseded by stack-specific Laravel Starter Kits (Laravel 12/13), which provide the same canonical stack (Fortify + Sanctum + Passkeys) without the teams or API token management overhead. Jetstream is now a legacy reference for understanding how Fortify + Sanctum + Starter Kits evolved.

---

# Core Concepts

- **Fortify Backend**: Jetstream used Fortify for all authentication routes (login, register, 2FA, password confirmation, email verification).
- **Sanctum Integration**: API token management UI (create, revoke tokens with abilities). Cookie-based SPA session auth via Sanctum.
- **Teams**: `Jetstream\Jetstream` managed teams with membership roles (owner, admin, editor, viewer). Team invitation system with email notifications.
- **Two-Factor Authentication**: Built-in TOTP 2FA via Fortify with recovery codes.
- **Profile Management**: Profile photo, name, email, password, 2FA settings, API tokens, connected accounts (Socialite).

---

# Mental Models

- **Feature-Rich Demo**: Jetstream was a demo of what Fortify + Sanctum could do together. It showed the complete auth stack working with teams and API tokens.
- **Training Wheels**: Jetstream provided teams and API management off the shelf — great for prototyping but often replaced with custom implementations in production.

---

# Migration and Replacement

- **Current replacement**: Laravel Starter Kits (React Starter Kit, Vue Starter Kit, Livewire Starter Kit, Svelte Starter Kit). These ship the same Fortify + Sanctum + Passkeys stack without Jetstream's teams or API token UI.
- **Teams**: Jetstream's teams feature was tightly coupled. Migrating to a custom teams solution (Spatie Permission with team scoping, or a custom Team model) is the recommended path.
- **API Tokens**: Starter Kits do not include API token management UI. Build your own using Sanctum's `HasApiTokens` trait.

---

# Common Mistakes

- **Using Jetstream for new projects**: Jetstream is deprecated. Use Laravel 13 Starter Kits for new projects. The teams feature is available from ecosystem packages or custom implementation.
- **Expecting Jetstream's API token UI in Starter Kits**: Starter Kits do not include API token management. Implement it separately if needed.
- **Confusing Jetstream's teams with multi-tenancy**: Jetstream teams are collaborative groups, not tenant isolation. Do not use Jetstream teams for multi-tenant data isolation.

---

# Related Knowledge Units

- Prerequisites: Fortify headless auth backend, Sanctum SPA vs Token auth
- Related: Laravel Breeze auth scaffolding, Laravel Starter Kits (current)
- Advanced Follow-up: Jetstream teams migration to custom teams, API token UI implementation with Sanctum

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

## Architectural Decisions

- **Decision**: Starter kit vs. custom authentication setup
  - Context: Breeze/Jetstream provide pre-built auth; custom setup gives full control
  - Consequence: Starter kits accelerate development but impose framework conventions; custom setup requires more effort but allows complete customization
- **Decision**: Sanctum vs. Passport vs. custom token system
  - Context: API token authentication needs for first-party SPAs vs. third-party OAuth clients
  - Consequence: Sanctum for first-party SPA/token auth; Passport for OAuth2 third-party access; custom tokens for specialized M2M scenarios
- **Decision**: Built-in CSRF/XSS protection vs. additional headers
  - Context: Laravel provides CSRF tokens and Blade escaping; additional headers (CSP, HSTS, X-Frame-Options) add layers
  - Consequence: Framework defaults handle common cases; security headers address advanced attack vectors (XSSI, clickjacking, MIME sniffing)

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Starter kits provide production-ready auth quickly | Framework conventions may not match project requirements | Customize or extend starter kits for non-standard needs |
| Additional security headers reduce attack surface | Headers can break legacy clients or third-party integrations | Test header configurations with all client types |
| Multi-factor authentication significantly improves security | Adds friction to login flow; requires backup codes | Make MFA optional for most users, required for admin |
| Social login reduces password management burden | Relies on third-party availability; privacy implications | Use as complement to, not replacement for, email auth |

## Performance Considerations

- **Authentication overhead**: Each authentication request adds 5-50ms for credential verification, session creation, and token generation. Cache session data in Redis to reduce database load.
- **Authorization check cost**: Policy and gate checks execute on every request. Policy auto-discovery adds negligible overhead (cached after first resolution). For high-throughput endpoints, cache permission results with user-based cache keys.
- **Encryption performance**: Encryption/decryption operations add 0.1-2ms per field. For high-throughput APIs, encrypt only sensitive fields rather than entire payloads.
- **Rate limiting overhead**: In-memory rate limiting (Cache::driver('array')) is faster than Redis-backed limiting. Use Redis-based limiting for distributed deployments; array-based for single-server setups.
- **Session storage**: File-based sessions degrade under high concurrency. Use Redis or database sessions for production deployments with multiple web servers.
- **Header processing**: Security headers (CSP, HSTS, etc.) are set once per response and add negligible overhead. However, CSP policy size affects browser parsing time. Keep CSP directives focused on actual requirements.

## Production Considerations

- **HTTPS enforcement**: Redirect all HTTP traffic to HTTPS. Use HSTS header with preload directive for domain-wide HTTPS enforcement. Configure HSTS max-age of at least 6 months (31536000 seconds).
- **Session security**: Use secure and httpOnly cookie flags. Set SameSite=Lax or Strict for session cookies. Regenerate session ID after login to prevent session fixation.
- **Security monitoring**: Monitor authentication failures, rate limit hits, and suspicious IP addresses. Set up alerts for brute force patterns and unusual login geographies.
- **Regular dependency audits**: Run composer audit in CI/CD to detect known vulnerabilities. Subscribe to security advisories for Laravel and major packages.
- **Breach response plan**: Document procedures for credential leaks, API key exposure, and session hijacking incidents. Include communication templates and rollback procedures.
- **Penetration testing**: Conduct regular security assessments, including automated scanning (OWASP ZAP, Burp Suite) and manual penetration testing for critical applications.

## Failure Modes

- **Authentication bypass**: Missing middleware on route groups allows unauthenticated access to protected endpoints. Use route grouping with consistent middleware application. Test authentication requirements in every deployment.
- **Session fixation**: Without session regeneration after login, an attacker can fixate a session ID and hijack the authenticated session. Always call session()->regenerate() after successful authentication.
- **Token leakage**: API tokens in URL parameters, logs, or error responses expose credentials. Use Authorization header exclusively for token transmission. Sanitize tokens from log output.
- **CSRF bypass**: Missing or misconfigured CSRF token verification allows cross-site request forgery. Ensure VerifyCsrfToken middleware is applied to all state-changing routes.
- **Rate limit exhaustion**: Legitimate users blocked by aggressive rate limiting. Monitor rate limit hit rates and adjust thresholds based on actual traffic patterns. Use tiered rate limiting (guest vs. authenticated vs. admin).
- **Security header misconfiguration**: Incorrect CSP directives can block legitimate resources or leave vulnerabilities open. Use reporting endpoints (eport-uri/eport-to) to monitor CSP violations without blocking content.
