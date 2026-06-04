# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | HTTP Client Faking |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel fakes, HTTP Client (Http facade), Laravel service container |
| Related KUs | Laravel fakes, Mail/notification testing, Mockery integration |
| Source | domain-analysis.md K031 |

# Overview

Laravel's `Http::fake()` method intercepts outgoing HTTP requests made via the `Http` facade, returning predefined responses without reaching real servers. It enables deterministic testing of integrations with external APIs (payment gateways, third-party services, microservices). With response sequences, status code simulation, and request assertions, `Http::fake()` is the primary tool for testing HTTP-dependent code without network calls.

# Core Concepts

- **`Http::fake()`**: Fakes all outgoing HTTP requests. No arguments = all requests return 200 with empty body.
- **Response sequences**: `Http::sequence($responses)` returns responses in order. Useful for polling or multi-call flows.
- **URL-specific faking**: `Http::fake(['stripe.com/*' => Http::response($body, 200)])` mocks specific URLs.
- **Response factory**: `Http::response($body, $status, $headers)` creates a faked response.
- **Request assertions**: `Http::assertSent($callback)`, `assertNotSent()`, `assertNothingSent()`.
- **Request recording**: All sent requests are recorded. `Http::recorded()` returns sent requests and responses.

# When To Use

- For every test that makes HTTP calls via the `Http` facade
- For testing external API integrations (payment gateways, third-party services)
- For testing error handling paths (500, 403, 429, timeout)
- For testing polling/retry logic with response sequences
- For testing webhook sending or API client libraries

# When NOT To Use

- For testing real API integration (use separate integration tests against sandbox)
- When the code uses a custom HTTP client (Guzzle directly) instead of the `Http` facade
- For testing network timeout handling specifically (use custom exception throwing)

# Best Practices (WHY)

- **Always call `Http::fake()` before HTTP-dependent code**: Without it, tests make real HTTP calls. Slow, unreliable, potentially costly. Make it the first line of any HTTP-dependent test.
- **Use URL pattern matching with wildcards**: `Http::fake(['api.github.com/*' => ...])` matches all requests to that domain. Exact URLs often fail due to trailing slashes or query parameters.
- **Test each error response path**: Simulate 500, 403, 429, and connection errors. Error handling code is only executed when the corresponding error is simulated.
- **Use `assertSent()` to verify request content**: Fake responses verify the system handles responses correctly. Request assertions verify the system sends the correct requests.
- **Use a catch-all pattern to prevent unexpected requests**: `Http::fake(['*' => Http::response(null, 500)])` ensures any unmatched URL causes a test failure rather than a real network call.

# Architecture Guidelines

- **Stub vs assert**: Use URL-specific faking for response stubbing. Use `assertSent()` for request verification. Don't rely on `assertSent()` to validate response handling.
- **Wildcard vs exact URL**: Use exact URLs for critical endpoints. Use wildcards for many-endpoint integrations.
- **`Http::fake()` vs `Http::fakeSequence()`**: URL patterns for most cases. Sequences for multi-response flows.
- **Prevent stray requests**: Global catch-all `Http::fake()` without URL argument ensures no unexpected HTTP calls.

# Performance Considerations

- Fake registration: <0.5ms.
- Response delivery: <0.01ms per request.
- Request recording: <0.01ms per request.
- Assertion execution: <0.1ms per assertion.

# Security Considerations

- Ensure fake API responses don't contain real secrets or credentials. Use placeholder values.
- API keys and tokens in requests should be verified as sent correctly, not stored in test code.
- Test that error responses don't leak internal API credentials or configuration.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting to call `Http::fake()` | Test written without faking | Real HTTP calls; slow, unreliable, potentially costly | Always call `Http::fake()` at start of HTTP-dependent tests |
| Not matching URL patterns correctly | `Http::fake(['https://api.example.com' => ...])` without wildcard | URL doesn't match; falls through to default (200 empty) | Use wildcard: `Http::fake(['https://api.example.com/*' => ...])` |
| Using `assertSent` without faking first | `Http::assertSent()` called without `Http::fake()` | Assertion may fail or behave unexpectedly | Always call `Http::fake()` before code making HTTP calls |
| Not testing error responses | Only testing successful API responses | Error handling never executed | Test each error path with faked error response |
| Not matching URL order correctly (sequence) | Wrong sequence order | Responses returned in wrong order | Assert call order with `assertSentInOrder()` |

# Anti-Patterns

- **Real HTTP calls in tests**: Never make real external HTTP calls in automated test suites. Use `Http::fake()` or integration tests with sandbox environments.
- **Default catch-all returning 200**: `Http::fake()` without arguments returns 200 for all requests. If a URL is misconfigured, the test passes. Always assert specific request URLs.
- **No error path testing**: Only faking successful responses. Error handling code is dead code until tested.
- **Testing response handling without request assertion**: Faking responses but never checking what request was sent. The API may have received wrong data.

# Examples

```php
// Simple API mock
public function test_fetches_github_user()
{
    Http::fake([
        'api.github.com/*' => Http::response(
            ['login' => 'testuser', 'id' => 123],
            200
        ),
    ]);

    $response = $this->get('/github/user');
    $response->assertSee('testuser');
}

// Error code simulation
public function test_handles_500_error()
{
    Http::fake([
        'api.payment.com/*' => Http::response(null, 500),
    ]);

    $response = $this->post('/payment', ['amount' => 100]);
    $response->assertStatus(502);
    $response->assertSee('Payment service unavailable');
}

// Response sequence for polling
public function test_polls_until_complete()
{
    Http::fake([
        'api.job.com/*' => Http::sequence()
            ->push(['status' => 'pending'], 200)
            ->push(['status' => 'pending'], 200)
            ->push(['status' => 'complete'], 200),
    ]);

    $response = $this->post('/start-job');
    $response->assertSee('Job completed');
}

// Request content assertion
public function test_sends_correct_payload()
{
    Http::fake();

    $this->post('/order', ['product_id' => 123, 'quantity' => 2]);

    Http::assertSent(function ($request) {
        return $request->url() == 'https://api.orders.com/orders'
            && $request['product_id'] == 123;
    });
}
```

# Related Topics

- **Prerequisites**: Laravel fakes, HTTP Client (Http facade), Laravel service container
- **Related**: Laravel fakes, Mail/notification testing, Mockery integration
- **Advanced**: Custom HTTP fake responses, Async HTTP testing, Webhook testing with Http fakes

# AI Agent Notes

- Always use wildcard URL patterns (`domain.com/*`) — exact URLs often fail due to trailing slashes or query parameters.
- Test error paths with the same thoroughness as success paths. Error handling is dead code until tested.
- Use `Http::fake(['*' => Http::response(null, 500)])` as a catch-all to ensure no unexpected requests are made. If a request hits the catch-all, the test will likely fail, alerting you to a missing URL pattern.

# Verification

- [ ] `Http::fake()` is called before all HTTP-dependent code in tests
- [ ] URL-specific faking uses wildcard patterns (`domain.com/*`)
- [ ] Each error path (500, 403, 429) is tested with faked error responses
- [ ] Request content is verified with `assertSent()` callbacks
- [ ] Response sequences match call order for multi-call flows
- [ ] A catch-all pattern prevents unexpected real HTTP calls
- [ ] No real external API calls are made in tests
- [ ] API mock responses use placeholder values (no real secrets)
