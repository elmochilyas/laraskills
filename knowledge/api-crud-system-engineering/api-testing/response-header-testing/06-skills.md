# Skill: Test Response Headers

## Purpose
Write feature tests asserting correct HTTP headers on API responses — Content-Type, Location, rate-limit headers, CORS headers, security headers — using `assertHeader`, `assertHeaderMissing`, parameterized suites, and `beforeEach` for common assertions.

## When To Use
- Every API endpoint (at minimum Content-Type assertion)
- Created resource endpoints (Location header)
- Rate-limited endpoints (X-RateLimit-* headers)
- CORS-configured endpoints (Access-Control-* headers)
- Security-sensitive endpoints (security headers)

## When NOT To Use
- Response body content or status code assertions
- Request headers (covered by rate-limit-testing, cors-behavior-testing)

## Prerequisites
- Feature test structure (PHPUnit/PestPHP)
- HTTP headers knowledge (Content-Type, Cache-Control, CORS, Security)

## Inputs
- List of expected headers per endpoint type
- Security headers configuration
- CORS origins configuration

## Workflow
1. Assert `Content-Type: application/json` on every API endpoint — misconfigured route may return HTML
2. Test `Location` header on every created resource endpoint — equals correct resource URL
3. Test security headers in a dedicated parameterized suite covering all endpoints (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
4. Assert header absence where expected: `assertHeaderMissing('X-Debug-Bar')` in production, `assertHeaderMissing('Location')` on validation errors
5. Use `beforeEach` for common header assertions (Content-Type, CORS) to avoid duplication
6. Test CORS headers with both allowed and disallowed origins
7. Parameterize header expectations by endpoint type — collection endpoints get cache headers, member endpoints get no-cache

## Validation Checklist
- [ ] Content-Type asserted on every endpoint
- [ ] Location header asserted on created resources
- [ ] Security headers tested in dedicated parameterized suite
- [ ] Debug headers asserted missing in production-like environment
- [ ] Header absence asserted on error responses (no Location on 422)
- [ ] CORS headers tested with allowed and disallowed origins
- [ ] Common headers asserted via `beforeEach`

## Common Failures
- Not testing Location header after resource creation
- Assuming Content-Type without testing — route may return HTML
- Testing CORS headers with same origin (header may be absent)
- Forgetting `assertHeader` is case-insensitive
- No header assertions at all — consumers depend on headers for caching and security

## Decision Points
- Security header scope: per-endpoint tests vs dedicated parameterized suite
- CORS tests: feature tests vs dedicated CORS test helper
- Header absence assertions: per-error-type vs global error response test

## Performance Considerations
- Header assertions are cheap — read from response object without JSON parsing
- Bundle header assertions into same test as status/shape assertions
- Use `beforeEach` for common headers to avoid redundancy

## Security Considerations
- Security headers must be tested explicitly — CSP, HSTS, X-Content-Type-Options
- Debug headers must be stripped in production — `assertHeaderMissing` validates this
- Location header must not expose internal URLs in production

## Related Rules
- Assert Content-Type On Every Endpoint
- Test Location Header On Created Resources
- Assert Security Headers In Dedicated Suite
- Assert Header Absence Where Expected
- Use BeforeEach For Common Header Assertions

## Related Skills
- Test Response Status Codes
- Test CORS Behavior
- Test Rate Limit Behavior

## Success Criteria
- Content-Type asserted on every endpoint
- Location header correct for all created resources
- Security headers present on all endpoints via parameterized suite
- Debug headers absent in production tests
- CORS headers correct for allowed/disallowed origins
- Common header assertions centralized in `beforeEach`
