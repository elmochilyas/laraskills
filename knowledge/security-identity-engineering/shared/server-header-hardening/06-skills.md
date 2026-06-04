# Skill: Harden Server Headers to Conceal Technology Stack

## Purpose
Remove or harden server-revealing HTTP headers (X-Powered-By, Server) to obscure the PHP version, Laravel version, and web server software from potential attackers.

## When To Use
- Every production web application
- Security hardening as part of defense-in-depth
- Penetration test preparation

## When NOT To Use
- Local development environments (informational headers acceptable)

## Prerequisites
- Access to server configuration (Nginx, Apache, php.ini)
- HTTP middleware for Laravel-level header control

## Workflow
1. Set `expose_php = Off` in `php.ini` (removes X-Powered-By header)
2. Configure web server to remove `Server` header or set to generic value
3. For Nginx: `server_tokens off;`
4. For Apache: `ServerTokens Prod` and `ServerSignature Off`
5. Create Laravel middleware to remove any remaining framework-revealing headers
6. Verify with curl: `curl -I https://example.com` — no version info exposed
7. Repeat validation periodically to catch configuration drift

## Validation Checklist
- [ ] `expose_php = Off` in `php.ini`
- [ ] Nginx `server_tokens off;` or Apache `ServerTokens Prod`
- [ ] No X-Powered-By header in responses
- [ ] Server header does not reveal version
- [ ] Curl verification confirms no tech stack leakage
- [ ] Enforcement checked in CI pipeline
