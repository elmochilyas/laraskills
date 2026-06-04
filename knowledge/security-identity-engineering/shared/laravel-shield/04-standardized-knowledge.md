# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel-Shield Security Scanning CLI |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Laravel-Shield is a dedicated security scanning CLI tool for Laravel applications (`github.com/Mana007777/Laravel-Shield`). It scans for: weak APP_KEY generation, exposed `.env` files via misconfigured web servers, hardcoded credentials in source code, debug mode enabled, exposed storage directories, misconfigured session and cookie settings, and common Laravel misconfigurations. Unlike Enlightn's comprehensive analysis, Shield focuses on the most critical Laravel-specific misconfigurations. It is designed for quick scanning (run in under 10 seconds) and CI integration.

---

## Core Concepts

- **Scan Categories**: Environment scan (APP_DEBUG, APP_KEY), File scan (exposed .env, storage), Config scan (session, cookie, CORS), Code scan (hardcoded secrets, credentials).
- **Artisan Command**: `php artisan shield:scan` — scans the current project.
- **CI Mode**: `php artisan shield:scan --ci` — exits with non-zero code if any critical issues found.
- **Entropy Detection**: Scans source code for high-entropy strings that look like API keys or tokens (base64, hex strings of sufficient length).

---

## When To Use

- Pre-deployment quick check — runs in under 10 seconds
- CI/CD integration as a fast security gate
- Scheduled scans to detect configuration drift (e.g., someone enabled debug mode in production)

## When NOT To Use

- As a replacement for comprehensive security scanning (Enlightn) — Shield only checks ~20 items
- For deep business logic or authorization analysis

---

## Best Practices

- **Pre-Deployment Hook**: Run `php artisan shield:scan --ci` in deploy script. Abort deployment on critical issues.
- **Scheduled Scan**: Weekly cron: `php artisan shield:scan --ci --email=security@company.com`. Emails report if issues found.
- **Complement with Enlightn**: Shield for fast pre-deploy check; Enlightn for comprehensive CI audit.

---

## Architecture Guidelines

- Fail CI on critical/high severity findings; warn on medium/low
- Run in pre-deployment hook alongside `composer audit`
- Schedule scans to detect configuration drift between deployments

---

## Performance Considerations

- Complete scan in under 10 seconds for most projects
- No dependency on running application — purely file-system and config analysis
- No impact on production performance

---

## Security Considerations

- **.env Accessibility Check**: Shield attempts to access `/.env` via HTTP. Ensure this endpoint returns 404.
- **Weak APP_KEY Detection**: Always use `php artisan key:generate` — never hardcode or use default keys.
- **Storage Exposure**: Checks if `storage/` is publicly accessible. Should return 403/404.
- **Entropy Detection**: Catches hardcoded API keys, tokens, and secrets in source code.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running only Shield, not Enlightn | Assuming Shield covers everything | Misses many security checks (CSRF, session config details, headers) | Use both — Shield for fast checks, Enlightn for comprehensive analysis |
| Ignoring medium-severity findings | De-prioritizing non-critical issues | Medium issues become critical vulnerabilities over time | Fix all findings, not just critical |
| Not running after every deployment | Assuming configuration doesn't change | Configuration drift goes undetected | Run Shield in CI/CD on every deployment |

---

## Anti-Patterns

- **Running Shield only once in the project lifecycle**: Configuration drift requires ongoing scanning
- **Treating Shield as a comprehensive security audit**: Shield is a quick check, not a deep analysis
- **Ignoring Shield failures in CI**: Bypassing the gate defeats the purpose

---

## Examples

**Pre-deployment script:**
```bash
php artisan shield:scan --ci || { echo "Critical security issues found; deployment aborted"; exit 1; }
```

**Scheduled scan with email:**
```php
// app/Console/Kernel.php
$schedule->command('shield:scan --ci --email=security@company.com')->weekly();
```

---

## Related Topics

- Enlightn static/dynamic security analysis
- .env management and APP_KEY
- Session configuration
- Secrets scanning and detection tools
- File upload security

---

## AI Agent Notes

- Shield is the fastest way to check for the most dangerous Laravel misconfigurations. It should be the first security tool recommended for projects without any automated scanning.
- If both Shield and Enlightn are absent, this is a significant security gap. Recommend both, starting with Shield for immediate quick wins.
- Shield's entropy detection feature is particularly useful for preventing accidental credential leaks into version control.

---

## Verification

- [ ] Laravel-Shield installed via Composer
- [ ] CI/CD pipeline includes `php artisan shield:scan --ci`
- [ ] Pre-deployment hook aborts on critical findings
- [ ] Scheduled scan configured (weekly)
- [ ] All critical/high findings addressed
- [ ] Medium/low findings documented or resolved
- [ ] `.env` endpoint returns 404
- [ ] `storage/` endpoint returns 403/404
