# ECC Standardized Knowledge — Response Header Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Response Header Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Response header tests assert that API endpoints return correct HTTP headers — Content-Type, Cache-Control, Location, rate-limit headers, CORS headers, and custom application headers. `assertHeader` and `assertHeaderMissing` verify header presence, values, and absence. Headers control caching, security, content negotiation, rate limiting, and cross-origin behavior. Header tests catch production-critical misconfigurations that body tests miss.

## Core Concepts

- **assertHeader($name, $value)**: Asserts header exists with given value.
- **assertHeaderMissing($name)**: Asserts header is absent.
- **Common headers to test**: Content-Type (application/json), Location (created resource URL), X-RateLimit-*, Cache-Control, Access-Control-Allow-Origin.
- **Security headers**: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options.
- **Raw header access**: `$response->headers->get('Content-Type')`.
- **Case-insensitive matching**: Header names are case-insensitive.

## When To Use

- Every API endpoint (at minimum Content-Type assertion)
- Created resource endpoints (Location header)
- Rate-limited endpoints (X-RateLimit-* headers)
- CORS-configured endpoints (Access-Control-* headers)
- Security-sensitive endpoints (security headers)

## When NOT To Use

- Response body content (covered by happy-path and response-shape KUs)
- Status code assertions (covered by response-status-code-testing)
- Request headers (covered by rate-limit-testing, cors-behavior-testing)

## Best Practices

- **Test Location header on created resources**: `$response->assertHeader('Location', '/api/posts/'.$post->id)`.
- **Assert Content-Type on every endpoint**: `$response->assertHeader('Content-Type', 'application/json')`.
- **Test security headers in dedicated suite**: Group X-Frame-Options, CSP, HSTS tests.
- **Test header absence on error responses**: `$response->assertHeaderMissing('Location')` on validation errors.
- **Parameterize header expectations by endpoint type**: Collection endpoints get cache headers; member endpoints get no-cache.
- **Use `beforeEach` for common headers**: Assert Content-Type, CORS in a `describe()` block for all endpoints.

## Architecture Guidelines

- Feature-level header tests validate both controller and middleware pipeline.
- Security headers are production requirements — enforce with header tests that fail CI build.
- Debug headers (X-Debug-Bar) must be stripped in production — test in production-like env.
- CORS headers must match allowed origins configuration — test with both allowed and disallowed origins.

## Performance Considerations

- Header assertions are cheap — read from response object without JSON parsing.
- Bundle header assertions into same test method as status/shape assertions.
- Use `beforeEach` to assert common headers for all endpoints.

## Security Considerations

- Security headers (CSP, HSTS, X-Content-Type-Options) must be tested explicitly.
- Debug headers must be stripped in production — `assertHeaderMissing` validates this.
- Location header must not expose internal URLs in production.

## Common Mistakes

- Not testing Location header after resource creation.
- Assuming Content-Type is always application/json — error responses from HTML middleware may return text/html.
- Testing CORS headers with same origin (no cross-origin) — header may be absent.
- Forgetting assertHeader is case-insensitive — testing `content-type` works but is misleading.

## Anti-Patterns

- **No header assertions at all**: Consumers depend on headers for caching, security, and CORS.
- **Assuming Content-Type without testing**: A misconfigured route returns HTML instead of JSON silently.

## Examples

- Content-Type: `$response->assertHeader('Content-Type', 'application/json')`.
- Location: `$response->assertCreated()->assertHeader('Location', '/api/posts/1')`.
- Rate limit: `$response->assertHeader('X-RateLimit-Remaining', '59')`.
- Missing security header: `$response->assertHeaderMissing('X-Debug-Bar')`.

## Related Topics

- **Prerequisites**: HTTP Headers (Content-Type, Cache-Control, CORS, Security), Feature Test Structure
- **Closely Related**: CORS Behavior Testing, Rate Limit Testing, Response Shape Testing
- **Advanced**: Custom header propagation across microservices, ETag and conditional request testing, Header-based API versioning testing

## AI Agent Notes

When testing response headers: assert Content-Type on every endpoint, test Location on created resources, test security headers in dedicated suite, assert header absence where expected (debug headers, Location on errors), use beforeEach for common header assertions, test both allowed and disallowed CORS origins.

## Verification

Sources: `Symfony\Component\HttpFoundation\ResponseHeaderBag`, `Illuminate\Testing\TestResponse::assertHeader`, domain-analysis.md.
