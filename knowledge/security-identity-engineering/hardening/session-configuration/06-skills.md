# Skill: Configure Secure Session Settings for Production

## Purpose
Harden Laravel session configuration (`config/session.php`) with secure cookie attributes, appropriate drivers, and proper lifetime settings for production deployments.

## When To Use
- Every Laravel application deployment to production
- When enabling Sanctum SPA cookie auth (session-dependent)
- Multi-server deployments requiring shared session storage

## When NOT To Use
- Stateless API-only applications without session auth
- Local development environments (relaxed settings acceptable)

## Prerequisites
- Published session config
- Understanding of deployment environment (single vs multi-server)

## Workflow
1. Set session driver to `redis` or `database` for multi-server production (never `file`)
2. Set `secure` to `true` — cookies only sent over HTTPS
3. Set `http_only` to `true` — cookies inaccessible to JavaScript (XSS mitigation)
4. Set `same_site` to `lax` (default) or `none` for cross-domain SPA with `secure=true`
5. Set `lifetime` to reasonable value (120 minutes typical; lower for sensitive apps)
6. Set `encrypt` to `false` unless session data contains sensitive values
7. Set `cookie` name to application-specific value to prevent conflicts
8. Test session persistence across requests

## Validation Checklist
- [ ] Session driver is Redis/database in production (not file on multi-server)
- [ ] `secure` = `true` in production (HTTPS-only cookies)
- [ ] `http_only` = `true` (JS cannot read session cookie)
- [ ] `same_site` configured appropriately for domain setup
- [ ] Session lifetime appropriate for application needs
- [ ] Session cookie name unique to the application
