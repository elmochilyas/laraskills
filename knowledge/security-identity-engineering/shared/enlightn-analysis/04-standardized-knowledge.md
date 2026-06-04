# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Enlightn Static/Dynamic Security Analysis |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Enlightn is a comprehensive static and dynamic security analysis tool for Laravel applications. It checks 120+ categories covering: configuration security (debug mode, APP_KEY strength), dependency vulnerabilities (composer audit integration), mass assignment protection, CSRF coverage, session configuration, CORS setup, rate limiting, and more. Checks run as static analysis (no app execution), dynamic analysis (hitting the running app), or a hybrid. Enlightn integrates into CI pipelines and provides a score that can be gated for deployment approval.

---

## Core Concepts

- **Static Checks**: Analyze source code and configuration files without running the application (APP_DEBUG check, $fillable presence, CSP header config).
- **Dynamic Checks**: Make HTTP requests to the running application (security headers on response, CSRF protection on POST routes, X-Powered-By header presence).
- **Score System**: Weighted pass/fail/warning scoring. Typically gated at 90+ in CI.
- **Categories**: 12+ categories (Authentication, Authorization, Configuration, CSRF, Data, Dependencies, Environment, Headers, Input, Middleware, Sessions).
- **Custom Checks**: Extend Enlightn by writing custom check classes implementing `Enlightn\Enlightn\Contracts\Check`.

---

## When To Use

- Every Laravel project as a CI gate — baseline security assurance before deployment
- Pre-deployment dynamic analysis on staging environment
- Gradual security improvement with baseline tuning

## When NOT To Use

- As a replacement for manual security review — Enlightn does not catch business logic flaws, authorization logic errors, or novel vulnerabilities
- In production — Enlightn is a CI/staging tool, not a runtime scanner

---

## Best Practices

- **CI Gate**: Run `php artisan enlightn --ci --score=90` in CI. Fail if score < 90.
- **Baseline Tuning**: First run generates many warnings. Create a baseline file acknowledging known issues. New issues not in the baseline fail CI.
- **Layer Approaches**: Static analysis for fast feedback (no running app needed). Dynamic analysis on staging before deployment.
- **Review All Failures**: Do not just check the score — review each failed check. The remaining 10 points may include critical issues.

---

## Architecture Guidelines

- Run static checks in CI (fast, no running app needed)
- Run dynamic checks in staging (pre-deployment) for header and middleware verification
- Fail on high-severity issues; warn on medium/low
- Score threshold at 90+ for CI gating; adjust based on project maturity

---

## Performance Considerations

- Static analysis: <30 seconds for most projects. No app boot needed.
- Dynamic analysis: ~50 HTTP requests to the running app. Requires a running environment.
- No production performance impact — Enlightn does not run in production.

---

## Security Considerations

- **Automated Security Code Review**: Enlightn catches the tedious, repeatable parts of a security review — "forgot to block debug mode" mistakes.
- **Baseline, Not Comprehensive**: Enlightn catches configuration and coding pattern issues. It does NOT catch business logic flaws, authorization logic errors, or novel vulnerabilities.
- **False Positive Management**: Some checks may not apply (e.g., CLI-only app does not need session security). Document and skip.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Ignoring high-score issues | Focusing only on score number | Critical issues (exposed debug mode) pass CI | Review all failed checks individually |
| Running only once | Assuming security is static | Configuration drift goes undetected | Run after every meaningful config or code change |
| Assuming Enlightn covers everything | Over-reliance on automated scanning | Business logic vulnerabilities missed | Manual review + Enlightn as complementary layer |

---

## Anti-Patterns

- **Setting score threshold too low (e.g., 50)**: Passes CI despite critical security gaps
- **Never creating a baseline**: First-run warnings are overwhelming and ignored
- **Only running static checks**: Misses response-level issues (headers, CSRF enforcement)

---

## Examples

**CI pipeline integration:**
```bash
php artisan enlightn --ci --score=90
```

**Baseline management:**
```bash
# Initial scan (generates baseline file)
php artisan enlightn --baseline

# Subsequent scans compare against baseline
php artisan enlightn --ci --score=90 --baseline=enlightn-baseline.json
```

---

## Related Topics

- Laravel-Shield security scanning CLI
- Dependency security (composer audit)
- Application configuration security
- Session configuration
- Security headers

---

## AI Agent Notes

- When evaluating a Laravel project's security posture, check if Enlightn is configured. Its absence is a gap in automated security assurance.
- For projects just adopting Enlightn: start with a first-run baseline to avoid being overwhelmed. Prioritize critical severity fixes.
- Enlightn 2026 covers Laravel 12/13 specific items including Reverb security settings, Pulse dashboard authorization, and Pennant feature flag security.

---

## Verification

- [ ] Enlightn installed via Composer (`composer require enlightn/enlightn`)
- [ ] CI pipeline includes `php artisan enlightn --ci --score=90`
- [ ] Baseline file committed to version control (if used)
- [ ] Dynamic analysis configured on staging environment
- [ ] Score threshold gated at 90+
- [ ] Failed checks reviewed and addressed periodically
- [ ] Custom checks implemented for application-specific security rules (if needed)
