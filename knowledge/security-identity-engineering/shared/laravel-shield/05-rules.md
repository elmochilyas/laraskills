# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Always Run Laravel-Shield as a Pre-Deployment Gate

## Category

Security

## Rule

Run `php artisan shield:scan --ci` in the deployment script. Abort deployment if any critical or high-severity findings are reported. Never deploy without a passing Shield scan.

## Reason

Shield detects the most dangerous Laravel misconfigurations: exposed `.env` files, weak `APP_KEY`, debug mode enabled in production, accessible storage directories, hardcoded credentials, and common configuration errors. These are the first things attackers probe. A deployment that bypasses Shield may silently introduce any of these critical vulnerabilities.

## Bad Example

```bash
# Deployment script without security check
php artisan migrate --force
php artisan config:cache
# Deployed — even with debug mode enabled
```

## Good Example

```bash
php artisan shield:scan --ci || { echo "Critical security issues found; deployment aborted"; exit 1; }
php artisan migrate --force
php artisan config:cache
```

## Exceptions

Local development and CI-only environments not exposed to the internet. For staging environments that mirror production, Shield should run with the same strictness.

## Consequences Of Violation

Security: Critical misconfigurations deployed to production. Compliance: Fails baseline security verification requirements.

---

## Rule Name

Complement Shield with Enlightn for Comprehensive Coverage

## Category

Testing

## Rule

Use Laravel-Shield for fast pre-deployment checks and Enlightn for comprehensive CI audit. Never rely on Shield alone for security scanning.

## Reason

Shield checks approximately 20 categories focused on the most critical Laravel misconfigurations. Enlightn checks 120+ categories covering authentication, authorization, CSRF, sessions, CORS, rate limiting, dependency vulnerabilities, and more. Shield is a fast safety net (under 10 seconds); Enlightn is a thorough audit. Using only Shield leaves the majority of potential vulnerabilities unexamined.

## Bad Example

```bash
# Assuming Shield is sufficient
php artisan shield:scan --ci
# Deploy — CSRF, session, CORS issues unchecked
```

## Good Example

```bash
# Fast pre-deployment check
php artisan shield:scan --ci

# Comprehensive CI audit
php artisan enlightn --ci --score=90
```

## Exceptions

Projects in early development (pre-alpha) may start with Shield alone and add Enlightn before the first production deployment.

## Consequences Of Violation

Security: Majority of vulnerability categories remain unchecked. Maintenance: False confidence in security posture.

---

## Rule Name

Schedule Regular Shield Scans for Configuration Drift Detection

## Category

Security

## Rule

Configure a scheduled Shield scan (weekly via Laravel scheduler) with email notification. Never scan only at deployment time.

## Reason

Configuration drift occurs between deployments: developers enable debug mode in a production-adjacent environment and forget to disable it, `.env` file permissions change due to server updates, storage directories become accessible after system updates. Deployment-time scanning catches issues introduced in the deployment itself, but weekly scanning catches issues that arise between deployments.

## Bad Example

```php
// app/Console/Kernel.php — no scheduled scan
// Shield only runs during deployment
```

## Good Example

```php
// app/Console/Kernel.php
$schedule->command('shield:scan --ci --email=security@company.com')
    ->weekly()
    ->environments(['production', 'staging']);
```

## Exceptions

Applications deployed multiple times daily (CI/CD with every merge) where deployment-time scanning effectively acts as continuous monitoring. Even then, a weekly scan is a low-cost safety net.

## Consequences Of Violation

Security: Undetected configuration drift between deployments. Compliance: Gaps in continuous security monitoring.

---

## Rule Name

Never Ignore Medium-Severity Shield Findings

## Category

Security

## Rule

Investigate and remediate all Shield findings, not just critical and high. Document accepted medium/low findings with justification.

## Reason

Medium and low severity findings indicate configuration weaknesses that may not be directly exploitable alone but contribute to broader attack surface. For example, a "medium" session cookie configuration issue may enable session fixation when combined with another weakness. Accepting medium findings without documentation creates an expanding security debt that eventually includes critical issues.

## Bad Example

```bash
# Running with severity filter — medium issues invisible
php artisan shield:scan --ci --severity=high
```

## Good Example

```bash
# Full scan — all findings visible
php artisan shield:scan --ci
# Review all findings; document accepted risks
```

## Exceptions

Projects with a formally documented risk acceptance process where specific findings are reviewed and accepted by a security officer.

## Consequences Of Violation

Security: Accumulated medium issues create exploitable vulnerability chains. Compliance: Fails requirements for complete vulnerability management.

---

## Rule Name

Fix All Shield Findings, Not Just CI-Blocking Ones

## Category

Maintainability

## Rule

When Shield reports findings, remediate them immediately rather than tuning severity filters or bypassing the CI gate. Never adjust severity thresholds to bypass legitimate findings.

## Reason

Each Shield finding represents a real misconfiguration that an attacker can exploit. Adjusting severity to "high only" or passing `--allow-failure` turns Shield into a placebo — it runs but blocks nothing. The purpose of Shield is to catch these exact issues, and every finding should drive a fix.

## Bad Example

```bash
# Bypassing findings instead of fixing them
php artisan shield:scan --ci --severity=high
# Medium findings — including exposed .env — are ignored
```

## Good Example

```bash
# Run full scan, fix everything
php artisan shield:scan --ci
# Fix each finding:
# - Set expose_php = Off
# - Generate new APP_KEY
# - Set APP_DEBUG=false
# - Restrict storage permissions
```

## Exceptions

Genuine false positives where Shield reports an issue that does not apply to the application's architecture (e.g., session security for a CLI-only API consumer). These must be documented with justification.

## Consequences Of Violation

Security: Known misconfigurations remain exploitable. Maintenance: Security tooling becomes ceremonial rather than effective.

---

## Rule Name

Verify .env and Storage Endpoints Return 404/403

## Category

Security

## Rule

After Shield identifies `.env` accessibility or storage exposure, verify the fix by making HTTP requests to `/.env` and `/storage/` — not just by rerunning Shield. These endpoints must return 404 or 403.

## Reason

Shield reports the finding, but the actual security boundary is the web server's response. A Shield scan may pass after a firewall change, but the web server configuration still serves `.env` files. Direct verification ensures the fix is effective at the network layer, not just at the application testing layer.

## Bad Example

```bash
# Rerunning Shield after "fix" — not verifying at network level
php artisan shield:scan --ci
```

## Good Example

```bash
# Apply fix, then verify at network level
curl -I https://example.com/.env
# Expected: HTTP/1.1 404 Not Found or 403 Forbidden

curl -I https://example.com/storage/
# Expected: HTTP/1.1 404 Not Found or 403 Forbidden
```

## Exceptions

Environments without direct HTTP access (local development, CI-only environments) where network-level verification is not possible.

## Consequences Of Violation

Security: `.env` or storage remains accessible despite passing Shield scan. Compliance: Fails perimeter security verification.
