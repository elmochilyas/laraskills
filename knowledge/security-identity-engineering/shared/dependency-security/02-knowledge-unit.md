# Metadata

Domain: Security & Identity Engineering
Subdomain: Additional Security Concerns
Knowledge Unit: Dependency security (composer audit, Dependabot)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Dependency security in Laravel relies on `composer audit` (built-in since Composer 2.4) and automated tools like Dependabot (GitHub) or Renovate. `composer audit` checks your `composer.lock` against the PHP Security Advisories Database for known vulnerabilities. Dependabot automatically creates PRs when vulnerable dependencies are detected. The primary practice: run `composer audit` in CI, fail the pipeline on known vulnerabilities, and use Dependabot/Renovate for automated patch updates.

---

# Core Concepts

- **composer audit**: `composer audit` reads `composer.lock`, checks each package against FriendsOfPHP/security-advisories database, reports known vulnerabilities with CVE references.
- **PHP Security Advisories Database**: Open-source database of known vulnerabilities in PHP packages. Maintained by FriendsOfPHP. The `composer audit` command queries this database.
- **Dependabot**: GitHub-native tool that monitors dependencies and creates PRs when updates are available, specifically tagging security updates with priority.
- **Outdated Packages**: `composer outdated --direct` shows available updates for direct dependencies. Run periodically as part of maintenance.
- **composer.lock**: The lock file pins exact versions. Security scanning must check the lock file, not `composer.json` (which allows version ranges).

---

# Mental Models

- **Dependency as Attack Surface**: Every package you include is an attack surface. A vulnerability in a deeply nested dependency (`guzzlehttp/psr7` via `laravel/socialite`) is as dangerous as a direct dependency.
- **Timely Updates = Security**: The window between a vulnerability disclosure and your deployment is your exposure window. Automated Dependabot PRs minimize this window.

---

# Internal Mechanics

- `composer audit` outputs: package name, CVE ID, severity, advisory link. Exit code is 0 if no vulnerabilities, 1+ if vulnerabilities found.
- The advisory database is hosted at `https://github.com/FriendsOfPHP/security-advisories`. Composer downloads the latest version on each audit.
- Dependabot checks `composer.lock` on each push and periodically (daily by default). Compares against GitHub Advisory Database.

---

# Patterns

## CI Pipeline Audit Pattern
- **Implementation**: `composer audit --format=json | jq 'if .issues | length > 0 then error("Vulnerabilities found") else empty end'` in CI. Fail the build.
- **Benefits**: Blocks vulnerable dependencies from reaching production.
- **Tradeoffs**: May block urgent patches if a direct dependency has an unfixed vulnerability. Consider `composer audit --no-dev` for production.

## Dependabot + Auto-Merge Pattern
- **Implementation**: Configure Dependabot for `composer` with `schedule.interval: weekly`. Enable auto-merge for patch updates (safe). Manual review for minor/major.
- **Benefits**: Security patches applied automatically within days.
- **Tradeoffs**: Auto-merged patch may break compatibility if the package maintainer accidentally introduces a breaking change in a patch version.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| composer audit vs third-party scanner | Built-in vs commercial | composer audit for baseline. Add third-party (Snyk, Sonatype) for license compliance and extended checks |
| Dependabot vs Renovate | GitHub native vs configurable | Dependabot for GitHub-hosted projects. Renovate for GitLab, Bitbucket, or complex config (auto-merge, grouping) |
| Block CI on vulnerability vs warn | Strict vs practical | Block on critical/high severity. Warn on medium. Ignore low (or investigate per-case) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automated vulnerability detection | False positives — advisories may not affect your app's usage of the package | Investigate each advisory: does the vulnerable code path exist in your app? |
| Dependabot creates PRs automatically | PR noise — minor updates for 50 packages weekly | Group minor updates into one PR via Renovate. Dependabot creates one PR per package |
| composer audit is zero-cost (no API key) | Only checks against PHP advisories — not NVD or OSV databases | Supplement with GitHub Advisory DB scanning for non-PHP vulnerabilities |

---

# Performance Considerations

- `composer audit` runs in <1 second for most projects. Does not require network access if the advisory database is cached.
- Dependabot runs are free for public repositories, included in GitHub Actions minutes for private repos.

---

# Production Considerations

- **Outdated Base Image**: If running in Docker, also scan the base image (`docker scout`, `trivy`). A vulnerability in the PHP runtime or OS packages is outside `composer audit`'s scope.
- **Ignored Advisories**: If a vulnerability does not affect your application (package used only in development, or the vulnerable code path is not executed), add to `ignore` list with documented reason.
- **Advisory Database Freshness**: `composer audit` requires an updated advisory database. Run `composer update --lock` periodically to refresh.

---

# Common Mistakes

- **Only auditing direct dependencies**: `composer audit` checks transitive dependencies by default. The vulnerability may be in `guzzlehttp/guzzle` which you never directly use but `laravel/socialite` depends on.
- **Not running audit in CI**: Developers can introduce a vulnerable dependency locally. CI must check every commit.
- **Ignoring audit results because "it's just dev"**: Dev dependencies run in CI and on developer machines — compromised dev tools can steal credentials. Scan all dependencies (or use `--no-dev` for production).
- **Not updating `composer.lock`**: `composer audit` checks `composer.lock`, not installed packages. If `composer.lock` is out of sync with what's deployed (`composer install` ran without updating `lock`), the audit is inaccurate.

---

# Failure Modes

- **Zero-Day in Critical Dependency**: A vulnerability is disclosed with no fix available. `composer audit` reports it, but there is no update. Mitigation: evaluate the exploitability, apply a patch from the repository, or add a middleware/shield.
- **Advisory Database Stale**: The local advisory database is outdated and does not contain a known vulnerability. `composer audit` passes but the vulnerability exists. Ensure the advisory cache is fresh.
- **Dependabot PR Merged Without Review**: Auto-merge applies a patch update that introduces a breaking change. Production breaks. Mitigation: auto-merge only patch updates with thorough test coverage.

---

# Related Knowledge Units

- Prerequisites: Composer dependency management, CI/CD pipeline basics
- Related: Enlightn static/dynamic security analysis, Laravel-Shield security scanning CLI
- Advanced Follow-up: SBOM (Software Bill of Materials) generation, Container image scanning, Vulnerability scoring (CVSS) and prioritization

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
