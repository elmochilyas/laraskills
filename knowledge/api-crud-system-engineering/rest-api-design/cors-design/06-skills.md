# Skill: Configure CORS Correctly for Your API Clients
## Purpose
Set up Cross-Origin Resource Sharing (CORS) headers — `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Credentials` — to control which origins, methods, and headers are permitted to access the API from browser-based clients.
## When To Use
When the API is accessed from browser-based JavaScript clients (SPA, mobile web); when third-party domains need API access; during initial API setup.
## When NOT To Use
Server-to-server APIs (no browser enforcement); same-origin APIs (no CORS needed); when using a reverse proxy that handles CORS independently.
## Prerequisites
API route definitions; list of allowed origins; HTTP method understanding; Laravel CORS middleware (or `fruitcake/laravel-cors`).
## Inputs
Allowed origins (domains); allowed HTTP methods; allowed headers; whether credentials (cookies, auth headers) are supported.
## Workflow
1. List all origins that should be allowed to access the API
2. For public APIs, use `*` origin (but cannot use with credentials)
3. For credentialed requests, specify exact origins (not `*`) and set `Allow-Credentials: true`
4. Set allowed methods to match the routes (GET, POST, PUT, PATCH, DELETE, OPTIONS)
5. Set allowed headers to match what the client sends (Authorization, Content-Type, Accept, X-Requested-With)
6. Set exposed headers for custom response headers (X-Total-Count, Link)
7. Configure `preflight max age` to reduce OPTIONS requests (86400 seconds recommended)
8. Test CORS with browser devtools - check preflight and actual request headers
## Validation Checklist
- [ ] Allowed origins are correct (exact origins for credentialed, `*` for public)
- [ ] Credentials flag matches the use case (true if cookies/auth headers are used)
- [ ] Exposed headers include all custom response headers (X-Total-Count, Link, X-Request-Id)
- [ ] Max age is set to reduce preflight requests (86400 seconds typical)
- [ ] Allowed methods match registered API routes
- [ ] Allowed headers include Authorization for authenticated endpoints
- [ ] Preflight (OPTIONS) requests return 204 with correct headers
- [ ] CORS is not applied to same-origin requests (no performance cost)
- [ ] Non-API routes (web, auth pages) are excluded from CORS middleware
- [ ] Production origins are locked down (no `*` with credentials)
## Common Failures
- Using `*` origin with `Allow-Credentials: true` — browser rejects the response
- Not exposing custom headers (X-Total-Count) — client JavaScript can't read them
- Missing `Access-Control-Allow-Headers: Authorization` — authenticated requests fail preflight
- Max age not set — every CORS request triggers a preflight OPTIONS request
- Overly permissive origins in production — any domain can make authenticated requests
## Decision Points
- Specific origin list vs origin regex vs `*` wildcard
- CORS middleware in Laravel vs reverse proxy (Nginx) CORS handling
- Preflight max age: 86400s (24h) vs shorter for development flexibility
## Performance/Security Considerations
Preflight OPTIONS requests add latency. Set a high max-age to avoid them. Security: never use `*` origin with credentials; use exact origins in production; audit allowed origins regularly.
## Related Rules/Skills
REST Architectural Constraints; REST Maturity Model; API Route Design; Content Negotiation.
## Success Criteria
Browser-based clients can access the API from allowed origins; credentialed requests work with specific origins; preflight requests are minimized via max-age; custom response headers are exposed.
