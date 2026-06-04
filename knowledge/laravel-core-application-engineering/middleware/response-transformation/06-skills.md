# Skill: Implement a Response Transformation Middleware for Security Headers

## Purpose

Create middleware that adds HTTP security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS, Referrer-Policy) to all responses, ensuring consistent security posture without relying on individual controllers.

## When To Use

When implementing security headers for the application, during a security audit, or when standardizing HTTP response hardening.

## When NOT To Use

For cache headers that vary per-route — use `cache.headers` middleware at the route level. For CORS headers — use `HandleCors` middleware.

## Prerequisites

- Understanding of response transformation (post-processing) position
- Knowledge of which security headers apply to the application

## Inputs

- List of security headers to add with their values
- Deployment environment (production vs development)

## Workflow

1. Create a `SecurityHeadersMiddleware` class in `app/Http/Middleware/`
2. Implement `handle()` with post-processing pattern: capture `$response = $next($request)`
3. Add headers after `$next($request)` — all run on the outbound pass
4. Set X-Frame-Options, X-Content-Type-Options, Referrer-Policy unconditionally
5. Set HSTS (`Strict-Transport-Security`) only in production — browsers remember HSTS and refuse HTTP
6. Set CSP initially as `Content-Security-Policy-Report-Only`, collect violation reports, then switch to enforcement
7. Register at the appropriate group level (web group for HTML, api group for JSON) or globally if needed
8. Also add the same security headers to error responses in the exception handler

## Validation Checklist

- [ ] X-Frame-Options set to `SAMEORIGIN` or `DENY` — prevents clickjacking
- [ ] X-Content-Type-Options set to `nosniff` — prevents MIME sniffing
- [ ] Referrer-Policy set — controls referrer header leakage
- [ ] HSTS only set in production — not in development environments
- [ ] CSP starts in report-only mode before enforcement
- [ ] Error responses (404, 500) from exception handler also include security headers
- [ ] Response type checked before content modification (if modifying body)

## Common Failures

- HSTS set in development — browser remembers HTTPS requirement, app becomes inaccessible via HTTP
- CSP enforced without report-only mode — blocks legitimate scripts, styles, or fonts
- Security headers missing on error responses (404, 500) — exception handler bypasses middleware
- Double headers — two middleware or middleware + nginx both set the same header

## Decision Points

- If nginx already sets security headers for static assets, ensure Laravel middleware headers do not conflict
- If one specific route needs different headers, use `$response->headers->set()` in the controller to override
- For CSP, always deploy in report-only mode first, monitor for a week, then switch to enforcement

## Performance Considerations

Adding security headers adds ~200-800 bytes to each response. No significant performance impact. ETag generation reads full response content into memory — be cautious with large responses.

## Security Considerations

Security headers are the application's first line of HTTP defense. Error responses generated after the pipeline completes do not pass through middleware — must add headers in the exception handler separately.

## Related Rules

- Add Security Headers in Middleware, Not in Controllers (response-transformation:5)
- Check Response Type Before Modifying Content (response-transformation:5)
- Test CSP in Report-Only Mode Before Enforcing (response-transformation:5)
- Do Not Set HSTS in Development Environments (response-transformation:5)
- Add Security Headers to Exception Handler Error Responses (response-transformation:5)

## Related Skills

- Configure TrustedProxies and CORS Correctly
- Implement a JSON Envelope Middleware for API Routes

## Success Criteria

All HTTP responses (including error responses) have consistent security headers. HSTS is production-only. CSP is tested in report-only before enforcement. Headers are verified by automated tests.

---

# Skill: Implement a JSON Envelope Middleware for API Routes

## Purpose

Create middleware that wraps JSON API responses in a standardized envelope (`{"success": true, "data": ..., "meta": ...}`) applied exclusively to API route groups.

## When To Use

When standardizing JSON API response format across all API endpoints, or when frontend clients expect a consistent response structure.

## When NOT To Use

On web routes returning HTML, on file download routes, or globally — envelope middleware must be applied only to the `api` group.

## Prerequisites

- Understanding of response type mutability
- Knowledge of response type checking

## Inputs

- Envelope structure (fields like `success`, `data`, `meta`, `errors`)

## Workflow

1. Create a `JsonEnvelopeMiddleware` class in `app/Http/Middleware/`
2. Implement `handle()` with post-processing pattern: capture `$response = $next($request)`
3. Check response type before modification: `if (! $response instanceof JsonResponse) { return $response; }`
4. Read existing data: `$data = $response->getData(true)`
5. Set new envelope: `$response->setData(['success' => $response->isSuccessful(), 'data' => $data, 'meta' => ['timestamp' => now()->toIso8601String()]])`
6. Register ONLY on the `api` group: `$middleware->api(append: [JsonEnvelopeMiddleware::class])`
7. Do NOT register globally — HTML, redirect, and file responses should not be enveloped

## Validation Checklist

- [ ] Response type is checked before modification (`instanceof JsonResponse`)
- [ ] Envelope fields are documented (success, data, meta, errors)
- [ ] Middleware is registered on `api` group only — not globally
- [ ] HTML routes return HTML, not JSON envelope
- [ ] Error responses (401, 403, 422) are also enveloped consistently
- [ ] Empty responses (204 No Content) are handled — not forced into envelope

## Common Failures

- Global registration — HTML views, file downloads, and redirects are corrupted
- No response type check — `BadMethodCallException` when calling `getData()` on HTML responses
- 204 No Content responses forced into envelope — should return empty body
- Error responses not enveloped — inconsistent format between success and error

## Decision Points

- Include pagination data (current_page, total, per_page) in the `meta` field for paginated responses
- Include request timing in `meta` only in non-production environments
- For validation errors, include errors in a separate `errors` field

## Performance Considerations

JSON envelope middleware reads and rewrites the response data. For large response bodies, this doubles memory usage temporarily. No significant latency impact for typical API payloads.

## Security Considerations

Do not expose internal data (stack traces, debug info) through the envelope's meta field. Ensure the envelope is applied consistently to error responses — error enveloping must match success enveloping.

## Related Rules

- Apply JSON Envelope Wrapping Only to API Routes (response-transformation:5)
- Check Response Type Before Modifying Content (response-transformation:5)
- Use Private Cache for Authenticated Responses (response-transformation:5)

## Related Skills

- Implement a Response Transformation Middleware for Security Headers
- Choose the Correct Registration Tier for Middleware

## Success Criteria

All API JSON responses are consistently enveloped. Web routes are unaffected. Response type is checked before modification. Middleware is registered on `api` group only. Error responses follow the same envelope format.
