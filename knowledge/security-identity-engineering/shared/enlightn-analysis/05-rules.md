# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Always Gate Deployments on Enlightn Score

## Category

Security

## Rule

Run `php artisan enlightn --ci --score=90` in the CI/CD pipeline. Fail the build if the score is below 90. Never deploy without a passing Enlightn scan.

## Reason

Enlightn performs 120+ automated security and performance checks covering configuration security, mass assignment, CSRF, session configuration, CORS, rate limiting, and more. Without a gated CI check, configuration drift (e.g., `APP_DEBUG=true` enabled accidentally, weak `APP_KEY`, disabled CSRF) reaches production undetected. A score of 90 ensures at least critical and high-severity issues are resolved before deployment.

## Bad Example

```bash
# CI runs test suite but no security analysis
phpunit
# Deployment proceeds even with debug mode enabled
```

## Good Example

```bash
php artisan enlightn --ci --score=90
# Non-zero exit code on failure — deployment blocked
```

## Exceptions

Initial project adoption: first scan may score below 90. Use a baseline file to acknowledge known issues, then gate on new issues not in the baseline. Set a progressive target: 60 → 75 → 90 over three sprints.

## Consequences Of Violation

Security: Critical misconfigurations (debug mode, weak keys, disabled CSRF) deployed to production. Compliance: Fails automated security verification requirements.

---

## Rule Name

Use a Baseline to Manage Existing Issues

## Category

Maintainability

## Rule

Create an Enlightn baseline file on first scan. Commit it to version control. Subsequent CI scans must compare against the baseline, failing only on new issues not already acknowledged.

## Reason

First-run Enlightn scans typically produce many warnings in established projects. Without a baseline, the overwhelming volume of issues causes teams to ignore the tool entirely. A baseline allows teams to acknowledge existing technical debt while preventing new issues from being introduced. Without this, Enlightn is either ignored (too many failures) or disabled (blocking deployments indefinitely).

## Bad Example

```bash
# Running without baseline — all existing issues surface every time
php artisan enlightn --ci --score=90
# Fails on 50 pre-existing issues — developer bypasses the gate
```

## Good Example

```bash
# First run: generate baseline
php artisan enlightn --baseline

# Commit enlightn-baseline.json

# Subsequent CI runs: compare against baseline
php artisan enlightn --ci --score=90 --baseline=enlightn-baseline.json
```

## Exceptions

Greenfield projects with zero existing security debt may skip baseline creation. Baseline must be regenerated after intentional remediation of acknowledged issues.

## Consequences Of Violation

Maintenance: Pre-existing issues mask new regressions. Security: New vulnerabilities introduced without detection. Reliability: CI gate becomes effectively disabled.

---

## Rule Name

Run Both Static and Dynamic Enlightn Checks

## Category

Testing

## Rule

Configure Enlightn to run static analysis in CI (fast checks requiring no running app) and dynamic analysis on the staging environment before production deployment. Never run only one type.

## Reason

Static checks analyze source code and configuration (debug mode, APP_KEY, mass assignment). Dynamic checks make HTTP requests to the running application (security headers, CSRF enforcement, X-Powered-By headers). These check categories detect different vulnerability classes. Relying on only static analysis misses response-level issues; relying on only dynamic analysis misses code-level issues.

## Bad Example

```bash
# CI runs static only — dynamic issues undetected
php artisan enlightn --ci --score=90
# Response headers, CSRF enforcement not verified
```

## Good Example

```bash
# CI static check
php artisan enlightn --ci --score=90

# Pre-deployment dynamic check on staging
php artisan enlightn --ci --score=90 --dynamic
```

## Exceptions

Stateless applications (e.g., queue workers, CLI commands) with no HTTP response layer. For these, static analysis is sufficient.

## Consequences Of Violation

Security: Response-level vulnerabilities (missing security headers, disabled CSRF) pass CI undetected. Reliability: Configuration that works in static analysis fails at runtime.

---

## Rule Name

Never Rely on Enlightn as the Only Security Review

## Category

Security

## Rule

Treat Enlightn as a complementary automated layer, not a replacement for manual security review, penetration testing, or business logic audit.

## Reason

Enlightn checks configuration, coding patterns, and dependency vulnerabilities. It does NOT detect business logic flaws (e.g., "user A can read user B's private data"), authorization logic errors, race conditions, or novel vulnerability classes. Over-reliance on automated scanning creates a false sense of security while leaving application-specific vulnerabilities unaddressed.

## Bad Example

```yaml
# Assuming Enlightn covers all security concerns
security:
  - php artisan enlightn --ci --score=90
  # No manual review; no penetration testing
```

## Good Example

```yaml
security:
  - composer audit
  - php artisan shield:scan --ci
  - php artisan enlightn --ci --score=90
  - Manual security review (quarterly)
  - Penetration test (annually)
```

## Exceptions

Projects in early development (pre-MVP) where manual review is scheduled before production launch. In this case, clearly document that limited security review is a known gap.

## Consequences Of Violation

Security: Business logic and authorization vulnerabilities undetected. Compliance: Fails requirements for manual security review.

---

## Rule Name

Review All Failed Enlightn Checks, Not Just the Score

## Category

Testing

## Rule

When Enlightn fails a check, always review the specific failure details. Never approve a CI gate based solely on a passing score number.

## Reason

A score of 90 may still mask critical issues if the scoring weights certain checks lower than their actual security impact. For example, "Debug mode enabled" may be weighted lower than "CSRF disabled" but both are critical. Additionally, false positives must be evaluated — some checks may not apply to your application's architecture (e.g., session security for a CLI-only app).

## Bad Example

```bash
# Accepting score without reviewing failures
php artisan enlightn --ci --score=90
# Score passes — deploy without looking at remaining 10 points
```

## Good Example

```bash
php artisan enlightn --ci --score=90 --json > enlightn-report.json
# Review each failed/warning check individually
# Document skipped checks with justification
```

## Exceptions

No common exceptions. Score alone is insufficient for security sign-off.

## Consequences Of Violation

Security: Critical issues hidden behind scoring weights. Reliability: False positives accepted without documentation.

---

## Rule Name

Run Enlightn After Every Meaningful Configuration or Code Change

## Category

Testing

## Rule

Execute `php artisan enlightn --ci` in CI on every push, not just as a pre-deployment gate. Never run it only once during initial setup.

## Reason

Security configuration drifts over time: developers enable debug mode for debugging and forget to disable it, new middleware is added without CSRF protection, session configuration is changed for performance without considering security implications. Running Enlightn only at initial setup or only before deployment creates a gap where configuration changes between scans go unverified.

## Bad Example

```bash
# Ran once during project bootstrap — never again
php artisan enlightn --baseline
# Configuration has drifted over 6 months
```

## Good Example

```yaml
# CI pipeline — runs on every push
jobs:
  security:
    steps:
      - run: php artisan enlightn --ci --score=90
```

## Exceptions

Rapid-prototyping branches (feature spikes, proof-of-concept work) where CI gates may be temporarily relaxed. Production-facing branches must always run Enlightn.

## Consequences Of Violation

Security: Configuration drift accumulates undetected. Reliability: Production environment diverges from secure baseline.

---

## Rule Name

Implement Custom Checks for Application-Specific Security Rules

## Category

Maintainability

## Rule

When your application has security requirements not covered by Enlightn's 120+ built-in checks, write custom Enlightn check classes implementing `Enlightn\Enlightn\Contracts\Check`. Never rely solely on built-in checks if your domain has specific security rules.

## Reason

Enlightn's built-in checks cover generic Laravel security patterns. Applications in regulated industries (finance, healthcare, government) often have domain-specific requirements: custom encryption key rotation policies, specific session timeouts, particular audit logging configurations. Custom checks enforce these rules within the same CI gate, preventing separate security tool sprawl.

## Bad Example

```php
// Relying on generic checks only — domain-specific rules unenforced
// Application requires 15-minute session timeout, but default is 120
```

## Good Example

```php
use Enlightn\Enlightn\Contracts\Check;

class SessionTimeoutCheck implements Check
{
    public function boot()
    {
        // Verify config/session.php lifetime <= 15
    }

    public function passed(): bool
    {
        return config('session.lifetime') <= 15;
    }
}
```

## Exceptions

Projects in early development or without compliance requirements may defer custom checks until regulatory obligations are identified.

## Consequences Of Violation

Compliance: Domain-specific security requirements unenforced by automated checks. Maintenance: Security rules documented but not verified in CI.
