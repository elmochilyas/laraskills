# Metadata

Domain: Security & Identity Engineering
Subdomain: Additional Security Concerns
Knowledge Unit: Enlightn static/dynamic security analysis
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Enlightn is a comprehensive static and dynamic security analysis tool for Laravel applications. It checks 100+ categories covering: configuration security (debug mode, APP_KEY strength), dependency vulnerabilities (composer audit integration), mass assignment protection, CSRF coverage, session configuration, CORS setup, rate limiting, and more. Checks run as static analysis (no app execution), dynamic analysis (hitting running app), or a hybrid. Enlightn integrates into CI pipelines and provides a score that can be gated on. It is the most thorough automated security analysis tool in the Laravel ecosystem.

---

# Core Concepts

- **Static Checks**: Analyze source code and configuration files without running the application. Examples: `APP_DEBUG` check, `$fillable` presence, CSP header config.
- **Dynamic Checks**: Make HTTP requests to the running application. Examples: security headers on response, CSRF protection on POST routes, `X-Powered-By` header presence.
- **Categories**: 12+ categories (Authentication, Authorization, Configuration, CSRF, Data, Dependencies, Environment, Headers, Input, Middleware, Sessions, etc.). Each check has a severity and remediation guidance.
- **Reporting**: Artisan command `enlightn:report` generates HTML/JSON report. CI integration via exit code (fail on score threshold).
- **Custom Checks**: Extend Enlightn by writing custom check classes implementing `Enlightn\Enlightn\Contracts\Check`.

---

# Mental Models

- **Automated Security Code Review**: Enlightn performs the tedious, repeatable parts of a security review automatically. It catches the "forgot to block debug mode" mistakes.
- **Baseline, Not Comprehensive**: Enlightn catches configuration and coding pattern issues. It does NOT catch business logic flaws, authorization logic errors, or novel vulnerabilities.

---

# Patterns

## CI Gate Pattern
- **Implementation**: Run `php artisan enlightn --ci --score=90` in CI. Fail if score < 90.
- **Benefits**: Enforces a minimum security baseline for every PR.
- **Tradeoffs**: May block PRs for non-critical issues if threshold is too high.

## Baseline Tuning Pattern
- **Implementation**: First run generates many warnings. Create an Enlightn baseline file that acknowledges known issues. New issues (not in baseline) fail CI.
- **Benefits**: Allows gradual improvement without blocking all PRs on day one.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Static vs dynamic analysis | Pre-deployment vs production | Static in CI (fast, no running app needed). Dynamic in staging (pre-deployment) for header and middleware checks |
| Enlightn vs manual review | Automation vs expert analysis | Enlightn for baseline 80% coverage. Manual review for the remaining 20% |
| Fail build vs warn | Enforce vs inform | Fail on high-severity issues. Warn on medium/low. Score threshold at 90+ is recommended |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| 100+ automated security checks | False positives require tuning | Teams may ignore results if there are too many irrelevant warnings |
| CI integration prevents security regression | Adds 10-30 seconds to CI pipeline | Negligible overhead for the security confidence gained |
| Clear remediation guidance | Cannot catch business logic flaws | Enlightn does not know your authorization logic, data validation rules, or API security design |

---

# Performance Considerations

- Static analysis: <30 seconds for most projects. Runs on source code only — no app boot.
- Dynamic analysis: makes ~50 HTTP requests to the running app. Staging environment needed.
- No production performance impact — Enlightn does not run in production.

---

# Production Considerations

- **First Run**: Expect 20-50 warnings for an existing project. Prioritize critical (APP_DEBUG, weak APP_KEY, CSRF gaps) and fix incrementally.
- **Baseline Management**: Keep baseline file in version control. Update when acknowledging new issues or fixing old ones.
- **False Positives**: Some checks may not apply (e.g., CLI-only app doesn't need session security). Document and skip.

---

# Common Mistakes

- **Ignoring high-score issues**: CI passes with score 90, but the remaining 10 points include critical issues (exposed debug mode). Review all failed checks, not just the score.
- **Never re-running after fixes**: Enlightn score is a snapshot. Run after every meaningful config or code change.
- **Assuming Enlightn covers everything**: Enlightn does not check business logic vulnerabilities (IDOR, mass assignment in complex scenarios, SSRF, business logic abuse). Manual review is still required.

---

# Related Knowledge Units

- Prerequisites: Application configuration, Session configuration, Security headers
- Related: Laravel-Shield security scanning CLI, Dependency security (composer audit)
- Advanced Follow-up: Custom Enlightn checks for application-specific security rules, Security score trending over time

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

## Failure Modes

- **Authentication bypass**: Missing middleware on route groups allows unauthenticated access to protected endpoints. Use route grouping with consistent middleware application. Test authentication requirements in every deployment.
- **Session fixation**: Without session regeneration after login, an attacker can fixate a session ID and hijack the authenticated session. Always call session()->regenerate() after successful authentication.
- **Token leakage**: API tokens in URL parameters, logs, or error responses expose credentials. Use Authorization header exclusively for token transmission. Sanitize tokens from log output.
- **CSRF bypass**: Missing or misconfigured CSRF token verification allows cross-site request forgery. Ensure VerifyCsrfToken middleware is applied to all state-changing routes.
- **Rate limit exhaustion**: Legitimate users blocked by aggressive rate limiting. Monitor rate limit hit rates and adjust thresholds based on actual traffic patterns. Use tiered rate limiting (guest vs. authenticated vs. admin).
- **Security header misconfiguration**: Incorrect CSP directives can block legitimate resources or leave vulnerabilities open. Use reporting endpoints (eport-uri/eport-to) to monitor CSP violations without blocking content.
