# Skill: Test CORS Behavior

## Purpose
Write feature tests verifying CORS headers on API responses — testing preflight OPTIONS requests, allowed origins, disallowed origins, credentialed requests, exposed headers, and CORS header presence on error responses.

## When To Use
- Any API consumed by browser-based frontends (SPA, mobile web)
- APIs with multiple frontend origins (staging, production, local dev)
- APIs supporting credentialed requests (cookies, authorization headers)

## When NOT To Use
- Internal APIs consumed only by server-to-server clients
- APIs behind a reverse proxy that handles CORS
- Browser-level E2E CORS testing (use Cypress, Playwright instead)

## Prerequisites
- CORS Protocol
- HTTP OPTIONS Method handling in Laravel
- CORS configuration (config/cors.php)

## Inputs
- CORS configuration (allowed_origins, allowed_methods, allowed_headers, supports_credentials, max_age)
- Allowed and disallowed origin URLs

## Workflow
1. Test preflight OPTIONS request: send `optionsJson()` with `Origin` and `Access-Control-Request-Method` headers — assert all `Access-Control-*` headers returned
2. Test actual request from allowed origin: send GET/POST with `Origin` header, assert CORS headers present
3. Test disallowed origin: request with untrusted origin, assert CORS headers absent (`assertHeaderMissing`)
4. Test credentialed requests: with `supports_credentials: true`, assert `Access-Control-Allow-Credentials: true` and origin is not `*`
5. Test `Access-Control-Expose-Headers`: assert custom headers (X-RateLimit-*) are exposed for browser JS access
6. Test CORS headers on error responses: ensure 4xx and 5xx responses still include CORS headers
7. Use datasets to test all allowed origins and methods in parameterized tests

## Validation Checklist
- [ ] Preflight OPTIONS request returns correct CORS headers for allowed origins
- [ ] Actual requests from allowed origins include CORS headers
- [ ] Disallowed origins get no CORS headers
- [ ] Credentialed requests work when `supports_credentials: true`
- [ ] CORS headers present on error responses (4xx, 5xx)
- [ ] `Access-Control-Expose-Headers` includes all custom response headers
- [ ] `Access-Control-Max-Age` asserted on preflight

## Common Failures
- Testing CORS without sending an `Origin` header — middleware only acts when `Origin` is present
- Confusing preflight (OPTIONS) with actual request (GET/POST) — both need CORS headers but only OPTIONS gets `Allow-Methods` and `Allow-Headers`
- Using `*` with `supports_credentials: true` — browser rejects credentialed requests with wildcard
- Forgetting to test `Access-Control-Expose-Headers` — custom response headers invisible to browser JS
- Testing only preflight, not actual requests — preflight passes but actual request may miss CORS headers

## Decision Points
- Test scope: all CORS headers vs subset (always test Allow-Origin, Allow-Methods, Allow-Credentials)
- Error response coverage: all error types vs representative sample
- Allowed origins: test each origin individually vs parameterized with datasets

## Performance Considerations
- CORS tests are lightweight — OPTIONS or GET requests with custom headers
- Test all allowed origins in a dataset to minimize kernel boots
- Batch CORS preflight and actual-request tests in the same class

## Security Considerations
- Missing `Access-Control-Allow-Origin` is a silent failure — browser blocks without clear error
- Test CORS headers on error responses — otherwise browser can't read the error
- Never use wildcard `*` origins with `supports_credentials: true`
- Ensure `Access-Control-Expose-Headers` includes all custom headers browser JS needs to read

## Related Rules
- Test Preflight OPTIONS Request
- Test Both Allowed And Disallowed Origins
- Test CORS Headers On Error Responses
- Test Access-Control-Expose-Headers
- Test Credentialed Requests

## Related Skills
- Test Response Headers
- Test Response Status Codes
- Test API Version Behavior

## Success Criteria
- Preflight OPTIONS returns correct CORS headers for every allowed origin
- Actual requests from allowed origins include CORS headers
- Disallowed origins are correctly rejected (no CORS headers)
- Credentialed requests work with `supports_credentials: true`
- Error responses include CORS headers
- Expose-Headers includes all custom response headers
