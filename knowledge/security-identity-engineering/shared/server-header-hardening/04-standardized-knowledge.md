# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Server Header Removal and Hardening |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Server header removal is part of attack surface reduction — hiding the PHP version (`X-Powered-By`), Laravel version, and server software (Nginx/Apache version) from HTTP responses. These headers provide information that attackers use to identify vulnerable versions. Removal is typically configured at the web server level (Nginx/Apache) and PHP level (`expose_php = Off`), with Laravel's HTTP kernel handling application-level headers. Combined with security headers (HSTS, CSP, XFO), header hardening reduces the information available for reconnaissance.

---

## Core Concepts

- **X-Powered-By**: PHP header indicating PHP version. Disabled by setting `expose_php = Off` in `php.ini`.
- **Server Header**: Web server header (Nginx/Apache) indicating server software and version. Removed via `server_tokens off;` (Nginx) or `ServerTokens Prod` (Apache).
- **Custom Laravel Headers**: Some Laravel packages or middleware add custom headers that may leak version info.
- **Defense in Minor Depth**: Header removal is the lowest-effort hardening step — takes 2 minutes and blocks a class of reconnaissance bots.

---

## When To Use

- Every production Laravel deployment
- Any internet-accessible staging environment
- As part of standard server provisioning checklist

## When NOT To Use

- Local development environments (unnecessary, but does no harm)
- When compliance requirements demand server version headers (rare — usually the opposite)

---

## Best Practices

- **Configure at ALL Layers**: Web server for infrastructure headers, PHP for X-Powered-By, Laravel middleware for application-level headers.
- **Test for Leaks**: Use `curl -I https://your-app.com | findstr /i "powered-by server x-.*-version"` to check for remaining headers.
- **Audit After Deployment**: Run header leak test in CI after every deployment.
- **Apply to Error Pages**: Ensure custom error pages (404, 500) also have headers removed.

---

## Architecture Guidelines

- Nginx: `server_tokens off;`
- Apache: `ServerTokens Prod`
- PHP-FPM: `expose_php = Off` in `php.ini`
- Laravel global middleware: remove `X-Powered-By` and any package-added headers
- Load balancers (ALB, CloudFront, HAProxy): configure separately

---

## Performance Considerations

- Zero performance impact — header removal is a configuration change, not a runtime operation
- Middleware-based removal adds negligible overhead (<0.01ms per request)

---

## Security Considerations

- **Security by Opacity**: Hiding server versions does not make the application more secure against determined attackers — but it eliminates easy reconnaissance for automated scanners.
- **Not a Replacement**: Header removal is complementary to, not a replacement for, proper vulnerability patching and security hardening.
- **Load Balancer Headers**: CloudFront, ALB, and HAProxy may add their own Server or Via headers. Configure them separately.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Removing only web server header, not PHP | Configuring Nginx/Apache only | X-Powered-By still leaks PHP version | Configure both web server and `php.ini` |
| Only configuring on production | Staging is still internet-accessible | Staging environment leaks version info | Apply to all environments |
| Assuming header removal is complete | Not testing with curl | Custom middleware or packages add version headers | Audit with `curl -I` after every deployment |

---

## Anti-Patterns

- **Rolling custom middleware that adds version headers**: Name version headers like `X-App-Version` are information leaks
- **Configuring only at the Laravel level**: Web server and PHP-FPM headers are outside Laravel's control

---

## Examples

**Nginx configuration:**
```nginx
server_tokens off;
```

**PHP-FPM configuration:**
```ini
; php.ini
expose_php = Off
```

**Laravel middleware:**
```php
// app/Http/Middleware/RemoveServerHeaders.php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->remove('X-Powered-By');
    $response->headers->remove('server');
    return $response;
}
```

**Testing for header leaks:**
```bash
curl -I https://your-app.com | findstr /i "powered-by server x-.*-version"
```

---

## Related Topics

- Security headers (HSTS, CSP, XFO, etc.)
- Enlightn static/dynamic security analysis
- Attack surface reduction
- Web server configuration (Nginx/Apache)

---

## AI Agent Notes

- Server header removal is the easiest security hardening step. If a project lacks this, it indicates minimal security hardening has been applied.
- When auditing, check all three layers: web server config, PHP-FPM config, and Laravel middleware.
- For Docker-based deployments, check the Dockerfile for `expose_php = Off` and web server `server_tokens off`.

---

## Verification

- [ ] Nginx `server_tokens off;` or Apache `ServerTokens Prod` configured
- [ ] `expose_php = Off` in `php.ini`
- [ ] Laravel global middleware removes server headers
- [ ] `curl -I` shows no X-Powered-By header
- [ ] `curl -I` shows no Server header with version info
- [ ] Load balancer headers configured (if applicable)
- [ ] Error pages also have headers removed
- [ ] CI pipeline includes header leak test
