# Metadata

Domain: Security & Identity Engineering
Subdomain: Additional Security Concerns
Knowledge Unit: Password validation rule objects
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's `Password` rule object (`Illuminate\Validation\Rules\Password`) provides configurable password validation beyond simple string length rules. Default rules via `Password::defaults()` enable centralized password policy configuration. Methods: `min()`, `max()`, `letters()`, `mixedCase()`, `numbers()`, `symbols()`, `uncompromised()` (haveibeenpwned API check). The `uncompromised` method checks the password against the Have I Been Pwned password database via k-anonymity (only the first 5 characters of the SHA-1 hash are sent to the API). Password rule objects should be used in ALL user registration and password change Form Requests.

---

# Core Concepts

- **Password Rule Object**: `new Password(min: 8)` or `Password::min(8)->letters()->mixedCase()->numbers()->symbols()` — returns a rule object for the validator.
- **Password::defaults()**: Set global defaults in `AppServiceProvider` or `FortifyServiceProvider`. All subsequent `Password` rule instances use these defaults.
- **uncompromised()**: Checks against Have I Been Pwned (HIBP) via k-anonymity API. The password's SHA-1 hash prefix (first 5 chars) is sent; the API returns all hashes with that prefix; the client checks if the full hash appears in the response. The actual password never leaves the server.
- **Bcrypt Hashing**: Laravel hashes passwords with bcrypt (default cost: 10). `Hash::make()`. `Hash::needsRehash()` checks if the current cost matches the configured cost.

---

# Mental Models

- **Password Policy as Config, Not Code**: `Password::defaults()` centralizes the password policy. Change it in one place, and all registration/password-update endpoints enforce the new policy.
- **k-Anonymity for Privacy**: The uncompromised check does not reveal the password to HIBP. Only the hash prefix is sent — the password remains private to your server.

---

# Internal Mechanics

- `Password` rule extends `Illuminate\Validation\Rules\Password`. Implements `Rule` contract. Validates in `passes()` method.
- `uncompromised()` calls `Illuminate\Validation\Rules\Password::checkUncompromised()` which: `$hash = sha1($value); $prefix = substr($hash, 0, 5);` → HTTP GET to `https://api.pwnedpasswords.com/range/{prefix}` → parses response (suffix:count pairs) → checks if `$hash` suffix appears.
- The HIBP API response is cached for the request duration. Subsequent uncompromised checks reuse the cached result.
- `Password::defaults()` stores the configuration in a static variable on the `Password` class. `Password::min(8)` creates a new instance merging defaults with instance-specific overrides.

---

# Patterns

## Centralized Password Policy Pattern
- **Implementation**: In `AppServiceProvider::boot()`: `Password::defaults(fn() => Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised())`.
- **Benefits**: Single source of truth. Form requests omit explicit password rules — the defaults apply.
- **Tradeoffs**: Changing defaults affects all endpoints immediately. Ensure backward compatibility with existing users.

## Context-Specific Override Pattern
- **Purpose**: Stricter passwords for admin accounts, more lenient for basic users.
- **Implementation**: Admin registration: `Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised()`. User registration: `Password::min(8)->uncompromised()` (uses defaults without explicit overrides).
- **Benefits**: Tiered security without losing centralized default.
- **Tradeoffs**: Two password policies to maintain.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Defaults vs explicit per-endpoint | Consistency vs flexibility | Defaults for 90% of endpoints. Override only for admin or high-security contexts |
| uncompromised() enabled vs disabled | Security vs external dependency | Enable uncompromised(). HIBP API is free, fast, and the k-anonymity protocol preserves privacy. Gracefully handle API errors |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Centralized policy = one change affects all forms | Changing existing policy may prevent users from using their current password | Policy changes apply to NEW passwords only. Existing passwords are not affected |
| uncompromised() prevents credential stuffing with known passwords | HIBP API call adds ~200-500ms to registration | Cache the HIBP response per request. Acceptable delay for the security benefit |
| Fine-grained control (letters, mixedCase, symbols) | More restrictive policies increase user frustration | Balance security with usability. A password with mixedCase + numbers + symbols + uncompromised is very secure but user-unfriendly |

---

# Performance Considerations

- `uncompromised()` adds 200-500ms to password validation (HTTP request to HIBP API). Cache the response for the request duration.
- Without `uncompromised()`, password validation is entirely local — no external calls.
- Bcrypt hashing: configurable cost. Default 10 (~100ms per hash). Increase to 12 (~400ms) for admin accounts.

---

# Production Considerations

- **HIBP API Availability**: If `uncompromised()` is enabled and the HIBP API is unreachable, the validation throws an exception. Mitigation: `Password::min(8)->uncompromised(function($failed) {})` — pass a callback to handle API errors gracefully. Or use `Password::min(8)->uncompromised(false)` to skip if API is down (passes an `If` rule with boolean condition).
- **Rate Limiting**: The HIBP k-anonymity API is free. Rate limit is generous (thousands of requests per second). Acceptable for most applications.
- **Password Policy Communication**: Show password policy requirements on the registration form. Mention the uncompromised check.

---

# Common Mistakes

- **Not setting defaults**: Each FormRequest repeats the full rule chain. Adding a new requirement (e.g., symbols) requires updating every FormRequest. Use `Password::defaults()`.
- **Using plain `min:8` instead of Password rule**: `'password' => 'required|string|min:8'` — no `letters()`, `mixedCase()`, `symbols()`, or `uncompromised()`. A password of "12345678" passes.
- **Applying uncompromised() without error handling**: HIBP API outage blocks all new registrations. Use the graceful failure pattern.
- **Bcrypt cost too low**: Default cost 10 is acceptable in 2026 but should be reviewed annually. Increase as hardware improves. Check with `Hash::needsRehash()` on login.
- **Password length too restrictive**: `Password::min(8)->max(64)` — arbitrary max length prevents passphrase-style passwords (like "correct horse battery staple"). Let max be higher (128+) or remove max entirely.

---

# Failure Modes

- **HIBP API Down**: All registrations fail because `uncompromised()` cannot verify. Mitigation: use `uncompromised(fn() => true)` to skip on API error (less secure but system stays operational).
- **Bcrypt Cost Upgrade**: After increasing bcrypt cost to 12, existing users' passwords (hashed with cost 10) still work. But `Hash::needsRehash()` returns true. Implement rehash-on-login in the user provider.
- **Password Rule Too Restrictive**: `Password::min(8)->letters()->mixedCase()->numbers()->symbols()->uncompromised()` — passwords like `P@ssw0rd` (which is compromised) are rejected. Users get frustrated. Balance complexity with usability.

---

# Related Knowledge Units

- Prerequisites: Form Request validation rules, Hash facade (Bcrypt)
- Related: Fortify password validation configuration, MFA/TOTP (complementary security)
- Advanced Follow-up: Custom password validation rules (dictionary check, keyboard pattern check), Passwordless authentication (Passkeys as alternative), Bcrypt cost benchmarking and tuning

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
