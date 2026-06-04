# Skill: Implement API-Specific Middleware

## Purpose
Build and apply API-specific middleware for response envelope injection, request logging, version detection, and security headers using route groups and `RegisterMiddleware` in Kernel.

## When To Use
- Cross-cutting concerns specific to API routes
- Response transformation (envelope injection)
- Request validation (version detection, API key validation)
- Security header injection

## When NOT To Use
- Web-specific middleware (VerifyCsrfToken, StartSession)
- Controller-specific logic — use controller or action patterns

## Prerequisites
- Laravel middleware system
- API route group structure

## Inputs
- API middleware requirements (envelope, versioning, logging, security)
- Middleware execution order

## Workflow
1. Create middleware per concern: `EnforceJsonResponse`, `VersionDetector`, `ApiLogger`, `SecurityHeaders`
2. Register middleware in `Kernel.php` route middleware array with aliases
3. Apply API middleware to `api` route group — not to web or individual controllers
4. Order middleware correctly: version detection before rate limiting, logging after response
5. For `EnforceJsonResponse`: set `Accept: application/json` header or return 406
6. For `ApiLogger`: log request method, path, duration, status, user_id
7. For `SecurityHeaders`: set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
8. Use middleware parameters for configurable behavior: `throttle:api,1000,60`
9. Test middleware in isolation — create request, assert response headers/behavior
10. Never modify request body in middleware — use Form Request for that

## Validation Checklist
- [ ] Middleware registered as named route middleware
- [ ] Applied to `api` route group in `Kernel.php`
- [ ] Middleware order correct (detection before enforcement)
- [ ] `EnforceJsonResponse` sets Accept header or 406
- [ ] `ApiLogger` logs request method, path, duration, user_id
- [ ] `SecurityHeaders` sets X-Content-Type-Options, X-Frame-Options
- [ ] Middleware parameters used for configurable behavior
- [ ] Middleware tests in isolation with request/assert pattern
- [ ] No body modification in middleware
- [ ] Middleware doesn't duplicate existing Laravel middleware functionality

## Common Failures
- Applying middleware globally instead of to API group — web routes affected
- Middleware doing too much — single middleware handling versioning, logging, and headers
- Incorrect middleware order — logging runs before version detection, versions wrong
- Modifying request body in middleware — breaks downstream validation
- Duplicating framework functionality — rewriting `throttle` instead of configuring
- Not testing middleware in isolation — behaviors break without detection

## Decision Points
- Route group vs controller-level middleware — group for cross-cutting, controller for specific
- Middleware vs service provider — middleware for request/response, provider for bootstrap
- Response manipulation — middleware for headers, transformer for body

## Performance Considerations
- Each middleware adds ~0.05-0.1ms per request
- `ApiLogger` writing to disk adds I/O — use async logger or log channel
- Header middleware adds response size overhead (~200 bytes)
- Middleware chain order affects total latency — put cheap checks before expensive ones

## Security Considerations
- API logger must not log sensitive data (passwords, tokens, request bodies)
- Security headers must be set before response is sent — middleware is ideal
- `EnforceJsonResponse` prevents HTML error pages in API responses (stack trace leak)
- Middleware that modifies security properties must run before response is prepared

## Related Rules
- Create Middleware Per Single Concern
- Register With Alias In Route Middleware
- Apply To api Route Group
- Order Middleware Correctly
- Test Middleware In Isolation
- Never Modify Request Body in Middleware

## Related Skills
- CORS Configuration — for CORS middleware
- IP-based Rate Limiting — for rate limit middleware
- API Security Headers — for security header middleware
- Response Envelope Design — for envelope middleware

## Success Criteria
- API middleware handles cross-cutting concerns consistently
- JSON is enforced — no HTML responses from API routes
- Request logging captures duration, method, path, status, user_id
- Security headers present on all API responses
- Middleware order is correct and tested
- API middleware doesn't affect web routes
