# Skill: Configure CORS for API Access

## Purpose
Configure Laravel CORS middleware for API consumer domains with specific allowed origins, methods, headers, credentials support, and preflight caching — never using wildcard for credentialed requests.

## When To Use
- Cross-origin API consumers (SPAs, mobile apps in WebViews)
- Public APIs consumed from browser-based apps
- First-party SPA on different subdomain

## When NOT To Use
- Same-origin requests (SPA and API on same domain)
- Server-to-server communication (not browser-enforced)

## Prerequisites
- Laravel CORS configuration (`config/cors.php`)
- CORS middleware in HTTP kernel

## Inputs
- Allowed origins list
- CORS requirements per consumer type

## Workflow
1. Configure `config/cors.php` with specific allowed origins list — never `'*'` for credentialed requests
2. Set methods for API only: `'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`
3. Set allowed headers: `'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN']`
4. Set exposed headers for API responses: `'exposed_headers' => ['X-RateLimit-Remaining', 'X-Api-Version', 'Link']`
5. Enable credentials for cookie auth: `'supports_credentials' => true`
6. Set preflight max age: `'max_age' => 86400` (24 hours) for caching OPTIONS responses
7. Apply CORS middleware globally or to `api` group in kernel
8. Test preflight OPTIONS request returns correct headers for each allowed origin
9. Test that CORS headers present on all responses (not just OPTIONS)
10. Configure CORS per environment — stricter in production, permissive in development

## Validation Checklist
- [ ] Specific origins configured — not `*`
- [ ] GET, POST, PUT, PATCH, DELETE, OPTIONS allowed
- [ ] Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN in allowed headers
- [ ] X-RateLimit-Remaining, X-Api-Version, Link in exposed headers
- [ ] `supports_credentials: true` configured
- [ ] Preflight max age set to 86400
- [ ] CORS middleware applied to API group
- [ ] OPTIONS responses return correct headers per origin
- [ ] All responses include CORS headers (Access-Control-Allow-Origin)
- [ ] Environment-specific CORS configuration (stricter in production)

## Common Failures
- Using `'*'` with `supports_credentials: true` — browser rejects the combination
- Not exposing custom headers — API response headers invisible to client JS
- Preflight not cached — every request triggers OPTIONS, doubling API calls
- Missing `Access-Control-Allow-Origin` on non-OPTIONS responses — browser blocks all requests
- CORS middleware not applied — OPTIONS requests return 404 or fall through to other middleware
- Too permissive in production — any origin can make credentialed requests
- CORS errors not tested — discovered only in production with real browser

## Decision Points
- Specific origins vs dynamic origin reflection — specific for security, dynamic for multi-tenant
- Global CORS vs route group — global for simplicity, route group for granular control
- Preflight max age — 86400 (24h) for stable origins, shorter for development

## Performance Considerations
- CORS middleware adds ~0.02ms per request
- Preflight caching reduces OPTIONS requests to 1/origin/day with max_age=86400
- Dynamic origin checking (regex) is slower than exact match — prefer exact origin list

## Security Considerations
- Never use `'*'` with credentials — browser spec prohibits
- Specific origin list prevents CSRF-like attacks from unknown origins
- CORS is enforced by browser only — CORS doesn't replace server-side authentication
- OPTIONS requests must not bypass auth middleware — unauthenticated preflight is expected
- `Access-Control-Allow-Origin` must echo request origin, not wildcard, with `Vary: Origin`

## Related Rules
- Set Specific Origins Not Wildcard For Credentialed Requests
- Enable supports_credentials For Cookie Auth
- Expose Custom Response Headers For Client Access
- Set Preflight max_age For Caching
- Test CORS Preflight And Actual Requests
- Configure CORS Per Environment

## Related Skills
- Sanctum SPA Cookie Auth — for cookie auth with CORS
- API Security Headers — for additional security headers
- Same-Origin Policy — for CORS fundamentals

## Success Criteria
- Allowed origins respond with correct CORS headers
- Preflight requests cached for 24 hours
- Credentialed requests work with cookie auth
- Custom response headers accessible from client JS
- No CORS errors in browser developer console
- Production CORS restricts to known origins
