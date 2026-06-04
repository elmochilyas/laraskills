# Skill: Write Feature Tests with HTTP Helpers

## Purpose
Write comprehensive feature tests using Laravel's HTTP test helpers — simulating GET/POST/PUT/DELETE requests through the full middleware pipeline with proper assertions.

## When To Use
- Testing the full request-response cycle through controllers and middleware
- Writing the majority (~70%) of your test suite
- Testing CRUD operations on resources
- Testing validation, authentication, and authorization integration

## When NOT To Use
- Testing business logic in isolation (use unit tests)
- Testing JavaScript behavior (use Dusk or Playwright)
- When `withoutMiddleware()` would bypass critical middleware (avoid in feature tests)

## Prerequisites
- Routes defined with controllers
- Understanding of named routes
- TestCase with RefreshDatabase or equivalent

## Inputs
- Route definitions and named route references
- User factories for authentication setup
- Request payload data for POST/PUT endpoints

## Workflow
1. Use named routes with `route('users.show', $user)` — never hardcode URLs
2. Use `getJson()`/`postJson()` for API routes (JSON responses), `get()`/`post()` for web routes (HTML/Blade)
3. Use `actingAs($user)` for authenticated endpoints — do not manually set session cookies
4. Follow Arrange-Act-Assert structure with blank line separators
5. Test both success responses (200/201/302) and error responses (401/403/404/422) for every endpoint
6. Keep middleware active — never use `withoutMiddleware()` in feature tests (CSRF, auth, throttle must be verified)
7. Use `$this->withSession()` to pre-populate session state when needed
8. Assert response content, not just status code — at minimum `assertSee()` or `assertJson()` for the expected outcome

## Validation Checklist
- [ ] Feature tests use named routes, not hardcoded URLs
- [ ] Error responses (404, 403, 422, 500) tested per endpoint
- [ ] `actingAs()` used for authenticated endpoints
- [ ] `withoutMiddleware()` not used in feature tests
- [ ] Tests follow Arrange-Act-Assert structure
- [ ] `getJson()`/`postJson()` for API routes, `get()`/`post()` for web routes
- [ ] Response content asserted (not just status code)
- [ ] Tests organized by feature (tests/Feature/Users/, tests/Feature/Orders/)

## Common Failures
- Hardcoded URLs that break when route structure changes
- Using `withoutMiddleware()` — tests bypass CSRF, auth, rate limiting
- Only testing status code without verifying response content
- Using `get()` for API routes — validation errors return HTML instead of JSON
- No error response tests — error handling untested

## Decision Points
- `get()`/`post()` for web routes (HTML responses) vs `getJson()`/`postJson()` for API routes (JSON responses)
- Isolated controller tests with `withoutMiddleware()` (rare, for unit testing) vs full feature tests (standard)
- `assertSee()` for text content vs `assertSeeHtml()` for HTML structure

## Performance Considerations
- Each HTTP test boots Laravel: ~30ms overhead
- `RefreshDatabase` transaction: <1ms per test
- `assertSee()` with HTML parsing is slower than JSON assertions
- Parallel execution benefits HTTP tests significantly (I/O-bound)

## Security Considerations
- HTTP tests simulate requests — they don't make real network calls
- CSRF protection is active by default; test forms include `@csrf`
- Rate limiting is active; disable with `withoutMiddleware(ThrottleRequests::class)` only if it interferes

## Related Rules (from 05-rules.md)
- Rule 1: Always use named routes in HTTP tests
- Rule 2: Never use `withoutMiddleware()` in feature tests
- Rule 3: Test both success and error responses for every endpoint
- Rule 4: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes
- Rule 5: Follow Arrange-Act-Assert structure in every test
- Rule 6: Don't use `withoutCSRF()` — include CSRF tokens or test with middleware active

## Success Criteria
- Every endpoint has tests for success and at least one error scenario
- Tests survive URL structure changes (named routes used consistently)
- Full middleware pipeline is verified (auth, CSRF, throttle)
- Tests are organized by feature for easy discovery
