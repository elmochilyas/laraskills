# Skill: Govern CORS Policy

## Purpose
Configure environment-specific CORS origin allowlists with no wildcards on authenticated endpoints, explicit header exposure, 24-hour preflight cache, formal origin change process, quarterly audits, and CORS headers on error responses.

## When To Use
- Any browser-accessible API
- APIs consumed by SPAs, browser extensions, or web applications
- Public APIs with multiple client origins
- Multi-tenant SaaS APIs with tenant-specific origins

## When NOT To Use
- Server-to-server APIs (CORS is browser-only)
- Mobile or native applications (no CORS enforcement)
- Internal-only APIs accessed exclusively from backend services

## Prerequisites
- Understanding of CORS protocol
- Environment configuration management
- Security review process

## Inputs
- List of allowed origins per environment
- Custom response headers to expose
- Preflight cache TTL configuration

## Workflow
1. Use environment-specific origin lists: dev allows localhost, staging allows internal domains, production has curated allowlist
2. Never set `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` — use explicit origin echoing
3. List all custom response headers in `Access-Control-Expose-Headers` (X-Request-Id, Deprecation, Link, X-RateLimit-*)
4. Cache preflight responses for 24 hours with `Access-Control-Max-Age: 86400`
5. Implement formal origin change process requiring security review and business justification for production additions
6. Include CORS headers on error responses (4xx, 5xx) — not just successful responses
7. Audit origin allowlist quarterly to remove unused or expired origins
8. For multi-tenant SaaS, validate against tenant-specific allowlist dynamically

## Validation Checklist
- [ ] Environment-specific origin lists (dev/staging/production)
- [ ] No wildcard with credentials (explicit origin echoing for authenticated endpoints)
- [ ] All custom headers exposed in Access-Control-Expose-Headers
- [ ] Preflight cache set to 86400 seconds
- [ ] Formal change process for production origin additions
- [ ] CORS headers present on error responses
- [ ] Quarterly origin allowlist audit
- [ ] Dynamic origin validation for multi-tenant

## Common Failures
- Using wildcard origin with credentials flag (browsers reject)
- Forgetting to expose custom headers — browser hides them from JS
- Setting Max-Age too low (many preflights) or too high (stale permissions)
- Allowing localhost in production
- Not including CORS headers on error responses — browser cannot read error body

## Decision Points
- Origin validation: static list from env vars vs dynamic from database
- Preflight handling: gateway (nginx) vs application middleware
- Max-Age: 24 hours default vs shorter during policy transitions

## Performance Considerations
- Preflight adds one round-trip cross-origin — caching with Max-Age minimizes
- Origin validation O(n) against allowlist — keep under 100 entries
- Dynamic origin resolution adds ~5ms — cache allowlist in memory

## Security Considerations
- CORS does NOT protect against direct server-to-server requests — authenticate all requests
- Never use wildcard origin with credentials (browsers reject)
- Do not allow localhost in production
- Quarterly audit of origin allowlist to remove unused origins

## Related Rules
- Never Use Wildcard Origin with Credentials
- Use Environment-Specific Origin Lists
- Explicitly Expose All Custom Headers
- Cache Preflight Responses for 24 Hours
- Implement Formal Origin Change Process
- Include CORS Headers on Error Responses
- Audit Origin Allowlist Quarterly

## Related Skills
- Configure CORS in Middleware
- Design API Security Headers
- Conduct API Audit Reviews

## Success Criteria
- CORS configuration is environment-specific, not shared across environments
- Authenticated endpoints never use wildcard origin
- All custom headers are accessible to browser JavaScript
- Preflight requests are cached for 24 hours
- New origins require security review before addition
- Error responses include CORS headers
- Origin allowlist is audited and cleaned quarterly
