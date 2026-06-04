# Skill: Configure CORS for Cross-Origin API Access

## Purpose
Configure `config/cors.php` to allow legitimate cross-origin requests from known frontend domains while blocking unauthorized origins, including required settings for Sanctum SPA cookie auth.

## When To Use
- Applications serving browser-based clients from different origins
- Sanctum SPA auth (requires credentials + specific origins)
- Public APIs consumed by browser-based third-party apps
- Admin panels and APIs served from different subdomains

## When NOT To Use
- Same-origin applications (no CORS needed)
- Server-to-server API calls (CORS is browser-only)

## Prerequisites
- Laravel application with CORS config published
- List of allowed origins (frontend domains)

## Workflow
1. Identify all origins that need browser access to the API
2. Set `allowed_origins` to specific origins — never `*` when credentials enabled
3. Set `supports_credentials: true` for Sanctum SPA cookie auth
4. Configure `allowed_methods` to HTTP methods used by the API
5. Set `allowed_headers` to include required headers (Content-Type, X-XSRF-TOKEN, Authorization)
6. Configure `exposed_headers` if the client needs to read custom response headers
7. Set `max_age` to cache preflight responses (3600 seconds recommended)
8. Test CORS with actual browser requests and verify preflight OPTIONS responses

## Validation Checklist
- [ ] `allowed_origins` contains only known frontend domains
- [ ] `supports_credentials: true` when using Sanctum SPA auth
- [ ] `allowed_origins` is `['*']` only for public APIs without credentials
- [ ] CORS preflight responses include correct headers
- [ ] Sanctum stateful domains match CORS allowed origins
- [ ] Tested with actual browser client
