# Enlightn Static/Dynamic Security Analysis — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Enlightn Static/Dynamic Security Analysis |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. No Enlightn CI Gate
2. Setting Score Threshold Too Low
3. Running Only Static Analysis
4. Never Creating a Baseline
5. Relying Solely on Enlightn for Security

---

## Repository-Wide Anti-Patterns

- **Running Enlightn only once during initial setup**: Configuration drift goes undetected.
- **Ignoring individual check failures**: Focusing only on the score number, not what failed.
- **No custom checks for application-specific rules**: Domain-specific security rules unenforced.
- **Enlightn not installed at all**: No automated security configuration scanning.

---

## Anti-Pattern 1: No Enlightn CI Gate

### Category

Security

### Description

Not running `php artisan enlightn --ci --score=90` in the CI/CD pipeline, so security configuration issues reach production undetected.

### Why It Happens

Enlightn requires explicit installation and configuration. Teams may not know about it, may not have added it to CI, or may rely on manual security reviews.

### Warning Signs

- CI pipeline has no Enlightn step
- `enlightn` not in `composer.json`
- No `config/enlightn.php` file
- Configuration drift (debug mode, weak APP_KEY) not caught automatically

### Why Harmful

Enlightn performs 120+ automated security and performance checks covering configuration security, mass assignment, CSRF, session configuration, CORS, rate limiting, and more. Without a gated CI check, configuration drift (e.g., `APP_DEBUG=true` enabled accidentally, weak `APP_KEY`, disabled CSRF) reaches production undetected.

### Consequences

- Critical misconfigurations deployed to production (debug mode, weak keys)
- Compliance failure — no automated security configuration verification
- Configuration drift accumulates undetected over time
- Manual review gaps miss issues Enlightn would catch automatically

### Alternative

Install Enlightn and add `php artisan enlightn --ci --score=90` to the CI pipeline. Fail the build on score below 90.

### Refactoring Strategy

1. Install Enlightn: `composer require enlightn/enlightn`
2. Publish config: `php artisan vendor:publish --tag=enlightn`
3. Create baseline: `php artisan enlightn --baseline`
4. Add to CI: `php artisan enlightn --ci --score=90 --baseline=enlightn-baseline.json`

### Detection Checklist

- [ ] Enlightn is installed via Composer
- [ ] CI pipeline includes `php artisan enlightn --ci --score=90`
- [ ] CI fails on score below 90
- [ ] Baseline file is committed (if first-run issues exist)
- [ ] No security misconfigurations are deployed undetected

### Related Rules

- Always Gate Deployments on Enlightn Score (05-rules.md)

### Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)

### Related Decision Trees

- Enlightn Score Gate Threshold (07-decision-trees.md)

---

## Anti-Pattern 2: Setting Score Threshold Too Low

### Category

Security

### Description

Configuring an Enlightn CI gate with a score threshold below 80, allowing critical security issues to pass the pipeline.

### Why It Happens

Teams with existing security debt may set a low threshold to avoid failing CI. They intend to improve it later, but the low threshold becomes permanent.

### Warning Signs

- CI runs `--score=50` or `--score=70`
- Score passes but critical issues exist (debug mode, weak APP_KEY)
- Team is aware of security debt but hasn't fixed it
- Threshold has never been increased since initial setup

### Why Harmful

Score 90 means at least 90% of checks pass — critical issues automatically bring the score below 90 because they are weighted heavily. A threshold of 50 allows nearly half of all checks to fail while still passing CI. Critical misconfigurations like `APP_DEBUG=true`, disabled CSRF, or weak `APP_KEY` may surface at score 50.

### Consequences

- Critical security issues pass CI despite failing checks
- False sense of security — "we have a CI gate at 50"
- No incentive to fix existing issues
- Compliance audit reveals passing score with critical failures

### Alternative

Set the threshold to 90+ for production deployments. Use a baseline to acknowledge existing issues while preventing new ones.

### Refactoring Strategy

1. Increase threshold progressively: 60 → 75 → 90 over 1-3 sprints
2. Fix critical issues first (debug mode, APP_KEY, CSRF)
3. Use baseline file to acknowledge remaining non-critical issues
4. Never lower the threshold once 90+ is achieved

### Detection Checklist

- [ ] Score threshold is 90 or higher
- [ ] No critical issues pass CI under the current threshold
- [ ] Progressive target plan exists for reaching 90 (if not there yet)
- [ ] Baseline is used to manage existing debt, not to lower the threshold
- [ ] Team regularly reviews and increases the target score

### Related Rules

- Always Gate Deployments on Enlightn Score (05-rules.md)

### Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)

### Related Decision Trees

- Enlightn Score Gate Threshold (07-decision-trees.md)

---

## Anti-Pattern 3: Running Only Static Analysis

### Category

Testing

### Description

Running only static Enlightn checks (source code/config analysis) and never running dynamic checks (HTTP response verification) before deployment.

### Why It Happens

Static analysis is fast and doesn't require a running application. Dynamic analysis requires a staging environment, which may not be set up or may be considered unnecessary overhead.

### Warning Signs

- CI runs only `php artisan enlightn --ci --score=90` (static, default)
- No dynamic analysis step in pre-deployment process
- No staging environment configured
- Response-level issues (security headers, CSRF enforcement) not verified

### Why Harmful

Static checks analyze source code and configuration (debug mode, APP_KEY, mass assignment). Dynamic checks make HTTP requests to the running application (security headers, CSRF enforcement, X-Powered-By headers). These check categories detect different vulnerability classes. Relying on only static analysis misses response-level issues that can only be verified by making actual HTTP requests.

### Consequences

- Missing security headers deployed (CSP, X-Frame-Options, HSTS)
- CSRF enforcement not verified on POST routes
- X-Powered-By headers exposing PHP version
- SSL/TLS configuration issues undetected
- Response-level vulnerabilities reach production

### Alternative

Run static analysis in CI and dynamic analysis on the staging environment before deployment.

### Refactoring Strategy

1. Set up a staging environment that mirrors production
2. Add dynamic Enlightn analysis to the pre-deployment step
3. Run `php artisan enlightn --ci --score=90 --dynamic` against staging
4. Verify that response-level checks pass before production deployment

### Detection Checklist

- [ ] Static analysis runs in CI on every push
- [ ] Dynamic analysis runs on staging before deployment
- [ ] Security headers are verified dynamically
- [ ] CSRF enforcement is verified on POST routes
- [ ] Response-level issues are caught before production

### Related Rules

- Run Both Static and Dynamic Enlightn Checks (05-rules.md)

### Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)

### Related Decision Trees

- Static vs Dynamic Analysis Timing (07-decision-trees.md)

---

## Anti-Pattern 4: Never Creating a Baseline

### Category

Maintainability

### Description

Running Enlightn in CI without a baseline file, causing the pipeline to fail on pre-existing issues whenever the tool is adopted on an established project.

### Why It Happens

Teams may not know about the `--baseline` flag or may skip it thinking baselines are unnecessary.

### Warning Signs

- CI runs `php artisan enlightn --ci --score=90` without `--baseline`
- First scan shows 50+ issues
- CI frequently fails on pre-existing issues
- Team disables Enlightn because "it's too noisy"

### Why Harmful

First-run Enlightn scans typically produce many warnings in established projects. Without a baseline, the overwhelming volume of issues causes teams to ignore the tool entirely. A baseline allows teams to acknowledge existing technical debt while preventing new issues from being introduced. Without this, Enlightn is either ignored (too many failures) or disabled (blocking deployments indefinitely).

### Consequences

- Pre-existing issues mask new regressions
- CI gate becomes effectively disabled due to noise
- Team ignores or disables Enlightn entirely
- New security issues introduced without detection

### Alternative

Create a baseline file on the first scan: `php artisan enlightn --baseline`. Commit it and use `--baseline=enlightn-baseline.json` in subsequent CI runs.

### Refactoring Strategy

1. Run `php artisan enlightn --baseline` to generate the baseline
2. Commit `enlightn-baseline.json` to version control
3. Update CI command: `php artisan enlightn --ci --score=90 --baseline=enlightn-baseline.json`
4. Gradually fix baseline issues and regenerate the baseline as they're resolved

### Detection Checklist

- [ ] Baseline file exists and is committed to version control
- [ ] CI uses `--baseline` flag with the baseline file
- [ ] New issues (not in baseline) cause CI to fail
- [ ] Baseline is regenerated after fixing acknowledged issues
- [ ] Team is aware that baseline issues should be progressively resolved

### Related Rules

- Use a Baseline to Manage Existing Issues (05-rules.md)

### Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)

### Related Decision Trees

- Enlightn Score Gate Threshold (07-decision-trees.md)

---

## Anti-Pattern 5: Relying Solely on Enlightn for Security

### Category

Security

### Description

Treating Enlightn as a complete security program and not conducting manual security reviews, penetration testing, or business logic audits.

### Why It Happens

Automated tools feel comprehensive. A score of 90+ looks like a green checkmark, and teams may assume security is "handled."

### Warning Signs

- No manual security review process exists
- No penetration testing is scheduled
- Security checklist consists only of "Run Enlightn"
- Business logic flaws and authorization errors exist but are not detected by Enlightn
- Team says "our CI security gate passes, we're secure"

### Why Harmful

Enlightn checks configuration, coding patterns, and dependency vulnerabilities. It does NOT detect business logic flaws (e.g., "user A can read user B's private data"), authorization logic errors, race conditions, or novel vulnerability classes. Over-reliance on automated scanning creates a false sense of security while leaving application-specific vulnerabilities unaddressed.

### Consequences

- Business logic vulnerabilities undetected
- Authorization errors not caught by automated scanning
- False sense of security — score 90+ but application is vulnerable
- Compliance failure — manual review requirements unmet

### Alternative

Use Enlightn as one layer in a defense-in-depth security program. Supplement with manual code review, penetration testing, and business logic audit.

### Refactoring Strategy

1. Schedule quarterly manual security reviews
2. Plan annual penetration testing
3. Add business logic and authorization tests to the test suite
4. Use Enlightn results to inform the manual review, not replace it

### Detection Checklist

- [ ] Manual security reviews are conducted (quarterly minimum)
- [ ] Penetration testing is scheduled (annually minimum)
- [ ] Business logic tests cover authorization scenarios
- [ ] Enlightn is recognized as a complementary layer, not a comprehensive solution
- [ ] Security program includes multiple layers beyond automated scanning

### Related Rules

- Never Rely on Enlightn as the Only Security Review (05-rules.md)

### Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)

### Related Decision Trees

- Static vs Dynamic Analysis Timing (07-decision-trees.md)
