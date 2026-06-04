# Skill: Fake HTTP Client Requests in Tests

## Purpose
Prevent real HTTP requests during tests by faking the Laravel HTTP client, returning controlled responses to verify that your application correctly handles API interactions.

## When To Use
- Any test that makes HTTP calls to external services (weather APIs, payment gateways, etc.)
- When testing error handling for HTTP failures (timeouts, 500 errors, connection refused)
- When testing response parsing for different API response formats
- When you need deterministic, fast tests without network dependencies

## When NOT To Use
- For dedicated integration tests that verify real API contracts (run separately from main suite)
- When testing the HTTP client configuration itself (trust Laravel's HTTP client)
- When the HTTP call is a side effect that doesn't affect the test assertion (use `Http::fake()` without assertions)
- For testing that should verify request structure (use `Http::assertSent()`)

## Prerequisites
- Laravel HTTP client facade (`Illuminate\Support\Facades\Http`)
- Understanding of `Http::fake()`, `Http::response()`, and `Http::sequence()`
- Knowledge of the external API endpoints and expected responses

## Inputs
- URL patterns to fake (with wildcards)
- Response status codes, headers, and body for each URL
- Error scenarios to simulate (timeouts, connection errors, status codes)
- Sequential responses for retry testing

## Workflow
1. Call `Http::fake()` before the action with URL-to-response mappings
2. For specific URLs, provide a response: `Http::fake(['api.weather.com/*' => Http::response(['temp' => 22], 200)])`
3. For sequential responses, use `Http::sequence()`: `Http::fake([/* ... */ Http::sequence()->push(['status' => 'ok'], 200)->pushStatus(429)])`
4. Execute the action that makes HTTP calls
5. Assert on the application's behavior based on the faked response
6. Optionally verify the outgoing request: `Http::assertSent(fn ($request) => $request->url() === '...')`
7. Verify no stray requests: `Http::assertNothingSent()` or `assertSentCount(3)`

## Validation Checklist
- [ ] `Http::fake()` is called before any HTTP requests are made
- [ ] URL patterns use wildcards for dynamic segments
- [ ] Response status codes and body match expected API contract
- [ ] Error scenarios (500, timeout, 429) are tested
- [ ] Sequential responses are used for retry logic testing
- [ ] Request assertions verify correct URL, headers, and body
- [ ] No real HTTP requests are made during the test

## Common Failures
- Not faking all URL patterns — unmatched URLs throw exceptions
- Using exact URLs instead of wildcards — test breaks when URL changes slightly
- Not testing error responses — only testing happy path leaves error handling unverified
- Forgetting to assert outgoing request structure — API contract may be wrong
- Faking too broadly — `Http::fake()` without arguments fakes all URLs, may hide bugs

## Decision Points
- Fake all URLs vs specific URLs — specific for targeted testing, all for broad safety
- `Http::response()` vs `Http::sequence()` — single for one-off, sequence for multiple calls
- `Http::assertSent()` vs response-based assertion — assertSent for request verification, response for behavior

## Performance Considerations
- Faked HTTP responses are instant (<0.1ms) vs real API calls (100-5000ms)
- No rate limiting or quota concerns with faked requests
- Multiple sequential responses add negligible overhead

## Security Considerations
- Faked responses should not contain real API keys or tokens
- Ensure faked error responses include realistic error structures
- Test that sensitive data is not sent to external URLs (assert request body has no secrets)

## Related Rules
- [Rule: Fake All External HTTP Calls](./05-rules.md)
- [Rule: Test Error Responses](./05-rules.md)
- [Rule: Verify Outgoing Request Structure](./05-rules.md)

## Related Skills
- Event Testing
- Queue Job Testing
- Mail Notification Testing

## Success Criteria
- [ ] Every test interacting with an external API fakes HTTP responses
- [ ] Error handling is tested for at least timeout, 500, and 429 responses
- [ ] Request structure (URL, headers, body) is verified for correctness
- [ ] Tests pass without any network connectivity
