# Laravel-Shield Security Scanning CLI — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel-Shield Security Scanning CLI |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Relying on Shield Alone Without Enlightn
2. Running Shield Only Once in the Project Lifecycle
3. Ignoring Medium-Severity Shield Findings
4. Bypassing Shield CI Gate Instead of Fixing Issues
5. Not Verifying Shield Fixes at the Network Level

---

## Repository-Wide Anti-Patterns

- **No scheduled shield scans**: Only runs at deployment — configuration drift undetected between deploys.
- **Not running in pre-deployment hook**: Deployment proceeds even with exposed .env or debug mode.
- **Treating Shield as a comprehensive security audit**: It only checks ~20 items.
- **Custom severity filters**: Using `--severity=high` to bypass medium findings.

---

## Anti-Pattern 1: Relying on Shield Alone Without Enlightn

### Category

Testing

### Description

Using Laravel-Shield as the only security scanning tool without also running Enlightn for comprehensive analysis.

### Why It Happens

Shield is fast, easy to install, and produces immediate results. Teams may install it and consider security "handled" without evaluating coverage.

### Warning Signs

- CI pipeline runs `shield:scan --ci` but no `enlightn --ci --score=90`
- Team believes Shield covers all Laravel security concerns
- No Enlightn in `composer.json`
- CSRF, session, CORS, and rate limiting configuration never audited

### Why Harmful

Shield checks approximately 20 categories focused on the most critical Laravel misconfigurations. Enlightn checks 120+ categories covering authentication, authorization, CSRF, sessions, CORS, rate limiting, dependency vulnerabilities, and more. Shield is a fast safety net (under 10 seconds); Enlightn is a thorough audit. Using only Shield leaves the majority of potential vulnerabilities unexamined.

### Consequences

- CSRF, session, CORS, and rate limiting issues undetected
- False sense of security — "we have a security scanner"
- Majority of vulnerability categories remain unchecked
- Compliance requirements for comprehensive scanning unmet

### Alternative

Use both: Shield for fast pre-deployment checks and Enlightn for comprehensive CI audit.

### Refactoring Strategy

1. Install Enlightn: `composer require enlightn/enlightn`
2. Create baseline and configure CI gate at score 90+
3. Run Shield pre-deployment (fast fail) and Enlightn in CI (deep audit)
4. Document the layered scanning approach

### Detection Checklist

- [ ] Both Shield and Enlightn are configured
- [ ] Shield runs pre-deployment for fast checks
- [ ] Enlightn runs in CI for comprehensive audit
- [ ] Team understands Shield's coverage limitations
- [ ] No reliance on Shield as the sole security scanner

### Related Rules

- Complement Shield with Enlightn for Comprehensive Coverage (05-rules.md)

### Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)

### Related Decision Trees

- Shield vs Enlightn Deployment (07-decision-trees.md)

---

## Anti-Pattern 2: Running Shield Only Once in the Project Lifecycle

### Category

Security

### Description

Running `php artisan shield:scan` once during project setup and never again, assuming the configuration remains secure.

### Why It Happens

Developers run Shield on initial setup, fix the issues, and consider it done. They don't think about configuration drift over time.

### Warning Signs

- Shield was run once during project bootstrap, never scheduled
- No CI step runs `shield:scan --ci`
- No scheduled `shield:scan` in the Laravel scheduler
- Configuration drift (debug mode, `.env` access) exists but Shield hasn't caught it

### Why Harmful

Security configuration drifts over time: developers enable debug mode for debugging and forget to disable it, `.env` file permissions change due to server updates, storage directories become accessible after system updates. Running Shield only once catches issues at that point in time but provides no ongoing protection.

### Consequences

- Configuration drift undetected for weeks or months
- Debug mode re-enabled by a developer, never caught
- `.env` access changed by server update, remaining exposed until manual audit
- No continuous security monitoring for critical misconfigurations

### Alternative

Run Shield in CI on every push and schedule weekly scans via Laravel's scheduler.

### Refactoring Strategy

1. Add `shield:scan --ci` to the CI pipeline
2. Add scheduled scan in `app/Console/Kernel.php`: `$schedule->command('shield:scan --ci --email=security@company.com')->weekly()`
3. Configure email notification for findings
4. Verify that configuration drift is detected between deployments

### Detection Checklist

- [ ] Shield runs in CI on every push or PR
- [ ] Weekly scheduled scan is configured
- [ ] Email notification is set up for critical findings
- [ ] Configuration drift is detected in a timely manner
- [ ] No long-duration gaps between Shield scans

### Related Rules

- Schedule Regular Shield Scans for Configuration Drift Detection (05-rules.md)

### Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)

### Related Decision Trees

- Shield Scan Scheduling (07-decision-trees.md)

---

## Anti-Pattern 3: Ignoring Medium-Severity Shield Findings

### Category

Security

### Description

Running Shield with `--severity=high` filter or explicitly ignoring medium and low severity findings.

### Why It Happens

Teams focus on "critical only" to reduce noise. Medium issues seem less urgent and are deferred indefinitely.

### Warning Signs

- Shield runs with `--severity=high` flag in CI
- Medium findings are acknowledged but never scheduled for fix
- "We only care about critical" attitude toward findings
- No documented risk acceptance for medium findings

### Why Harmful

Medium severity findings indicate configuration weaknesses that may not be directly exploitable alone but contribute to broader attack surface. For example, a "medium" session cookie configuration issue may enable session fixation when combined with another weakness. Accepting medium findings without documentation creates an expanding security debt that eventually includes critical issues.

### Consequences

- Accumulated medium issues create exploitable vulnerability chains
- No documentation for accepted risks
- Security debt grows until it becomes critical
- Compliance failure for incomplete vulnerability management

### Alternative

Investigate and remediate all Shield findings. Document accepted medium/low findings with justification.

### Refactoring Strategy

1. Remove `--severity=high` filter from Shield command
2. Review all findings: fix critical/high immediately, schedule medium/low
3. Document any accepted findings with risk justification
4. Set a target date for medium finding remediation

### Detection Checklist

- [ ] Shield runs without severity filters
- [ ] All findings are reviewed and addressed
- [ ] Accepted findings have documented risk justification
- [ ] No `--severity=high` flag in CI configuration
- [ ] Medium findings have scheduled remediation dates

### Related Rules

- Never Ignore Medium-Severity Shield Findings (05-rules.md)

### Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)

### Related Decision Trees

- Shield vs Enlightn Deployment (07-decision-trees.md)

---

## Anti-Pattern 4: Bypassing Shield CI Gate Instead of Fixing Issues

### Category

Maintainability

### Description

Adding `--allow-failure` or `|| true` to the Shield CI command, or adjusting severity thresholds to bypass legitimate findings instead of fixing them.

### Why It Happens

When Shield blocks a deployment, the fastest path to deploy is to bypass the gate. Teams may "temporarily" disable the check and never re-enable it.

### Warning Signs

- CI runs `php artisan shield:scan --ci || true` — ignores exit code
- `--allow-failure` flag is used
- Severity threshold was lowered to "high only"
- Findings exist that have been known for months but not fixed

### Why Harmful

Each Shield finding represents a real misconfiguration that an attacker can exploit. Adjusting severity to "high only" or passing `--allow-failure` turns Shield into a placebo — it runs but blocks nothing. The purpose of Shield is to catch these exact issues, and every finding should drive a fix. Bypassing the gate defeats the entire purpose.

### Consequences

- Shield becomes a placebo — runs but blocks nothing
- Known misconfigurations remain exploitable
- Security tooling becomes ceremonial rather than effective
- Team loses visibility into security issues

### Alternative

Fix the findings instead of bypassing the check. If a finding cannot be fixed immediately, document it with a planned remediation date.

### Refactoring Strategy

1. Remove bypass flags (`--allow-failure`, `|| true`) from CI command
2. Address each finding — fix critical/high first
3. For findings that cannot be fixed immediately, create tickets with remediation dates
4. Ensure Shield blocks deployments with unresolved high-severity issues

### Detection Checklist

- [ ] No `--allow-failure` or `|| true` in Shield CI command
- [ ] No severity filters that bypass legitimate findings
- [ ] All findings have remediation plans or documented acceptance
- [ ] Shield actually blocks deployments with critical issues
- [ ] Team treats Shield findings as deployment-blocking items

### Related Rules

- Fix All Shield Findings, Not Just CI-Blocking Ones (05-rules.md)

### Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)

### Related Decision Trees

- Shield Scan Scheduling (07-decision-trees.md)

---

## Anti-Pattern 5: Not Verifying Shield Fixes at the Network Level

### Category

Testing

### Description

After Shield reports a fixable issue (e.g., `.env` accessible), re-running Shield to verify the fix without making an actual HTTP request to confirm the endpoint returns 404/403.

### Why It Happens

Running Shield again is the obvious verification step. Teams may not realize that Shield tests from the application's perspective, while the actual security boundary is the web server's response.

### Warning Signs

- `.env` accessibility fix verified only by re-running Shield
- No `curl -I https://example.com/.env` in the verification process
- Fix applied at application level but web server still serves `.env`
- Shield passes but `.env` still accessible via direct HTTP request

### Why Harmful

Shield reports the finding, but the actual security boundary is the web server's response. A Shield scan may pass after a firewall change, but the web server configuration still serves `.env` files. Direct verification ensures the fix is effective at the network layer, not just at the application testing layer.

### Consequences

- `.env` remains accessible despite Shield passing
- False sense of security — "Shield says it's fixed"
- Credentials in `.env` exposed to internet
- No network-level verification in the fix process

### Alternative

After fixing an issue, verify it at the network level using `curl` or equivalent HTTP client. Confirm the endpoint returns 404 or 403.

### Refactoring Strategy

1. After each Shield finding fix, make a direct HTTP request: `curl -I https://example.com/.env`
2. Verify the response is 404 (Not Found) or 403 (Forbidden)
3. Add the verification step to the deployment checklist
4. For automated verification, add `curl` checks to the CI pipeline

### Detection Checklist

- [ ] Shield fixes are verified with direct HTTP requests
- [ ] `.env` endpoint returns 404 or 403
- [ ] `/storage/` endpoint returns 404 or 403
- [ ] Verification is automated in CI/CD pipeline
- [ ] No accessible sensitive endpoints despite Shield passing

### Related Rules

- Verify .env and Storage Endpoints Return 404/403 (05-rules.md)

### Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)

### Related Decision Trees

- Shield vs Enlightn Deployment (07-decision-trees.md)
