# Skill: Implement API Security Headers

## Purpose
Add security headers to all API responses via middleware: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, and `Permissions-Policy`.

## When To Use
- All API responses
- Defense-in-depth security hardening
- Security compliance requirements

## When NOT To Use
- Endpoints where security headers interfere (file downloads with `Content-Type` override)
- Development-only environments where headers complicate debugging

## Prerequisites
- Middleware implementation
- Security header understanding

## Inputs
- Security header specifications per environment
- CSP policy definition

## Workflow
1. Create `SecurityHeadersMiddleware` that adds all standard security headers
2. Set `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
3. Set `X-Frame-Options: DENY` — prevents clickjacking via iframe embedding
4. Set `Strict-Transport-Security: max-age=31536000; includeSubDomains` — HTTPS enforcement
5. Set `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` — restricts resource loading
6. Set `Referrer-Policy: no-referrer` — controls referrer header in outgoing requests
7. Set `Permissions-Policy: geolocation=(), camera=(), microphone=()` — restricts browser APIs
8. Apply middleware to `api` route group — never to web routes that serve HTML
9. Use environment variables for HSTS `max-age` — shorter in development, longer in production
10. Test security headers with browser dev tools or `curl -I` — verify all headers present

## Validation Checklist
- [ ] `X-Content-Type-Options: nosniff` on all API responses
- [ ] `X-Frame-Options: DENY` on all API responses
- [ ] `Strict-Transport-Security` with long max-age in production
- [ ] `Content-Security-Policy` with restrictive policy
- [ ] `Referrer-Policy: no-referrer` on all API responses
- [ ] `Permissions-Policy` restricting sensitive APIs
- [ ] Middleware applied to API route group
- [ ] Environment-specific HSTS configuration
- [ ] Headers verified with `curl -I` or equivalent
- [ ] No security headers interfere with API functionality

## Common Failures
- Setting HSTS headers over HTTP (not HTTPS) — browser ignores
- CSP too restrictive — breaks API response rendering in browser dev tools
- Missing headers on error responses — security headers only on 200, not 4xx/5xx
- Headers duplicated — middleware and web server both set them
- HSTS with short max-age — missing protection for returning visitors
- `X-Frame-Options: SAMEORIGIN` for API — API responses should never be framed by any origin

## Decision Points
- CSP strictness — `default-src 'none'` for JSON APIs, less strict for HTML-rendering endpoints
- HSTS max-age — 1 year (31536000) for production, 1 hour for development
- Preload HSTS — only after confirming all subdomains support HTTPS

## Performance Considerations
- Header injection adds negligible overhead (<0.01ms)
- Header size is ~500 bytes total for all security headers — minimal bandwidth impact
- HSTS preload list inclusion is one-time configuration — no runtime impact

## Security Considerations
- Security headers are defense-in-depth — not replacement for proper auth/CORS/CSRF
- HSTS prevents downgrade attacks but requires all subdomains to support HTTPS
- CSP for JSON APIs is straightforward (`default-src 'none'`) — not needed for XSS prevention in JSON
- Security headers must be present on all responses including error responses
- Test headers after load balancer/proxy — may strip or modify before reaching client

## Related Rules
- Add Security Headers Via Middleware
- Set X-Content-Type-Options: nosniff
- Set Strict-Transport-Security With Long max-age
- Set Content-Security-Policy For API Responses
- Apply To API Route Group
- Test Security Headers On All Responses

## Related Skills
- CORS Configuration — for cross-origin security
- API-Specific Middleware — for middleware patterns
- HTTPS Enforcement — for TLS configuration

## Success Criteria
- All API responses include complete set of security headers
- X-Content-Type-Options prevents MIME sniffing
- X-Frame-Options API responses from being framed
- HSTS enforces HTTPS on supporting browsers
- CSP prevents unintended resource loading
- Security headers present on both success and error responses
