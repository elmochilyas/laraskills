# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: HTTP Client Faking
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel's `Http::fake()` method intercepts outgoing HTTP requests made via the `Http` facade, returning predefined responses without reaching real servers. It enables deterministic testing of integrations with external APIs (payment gateways, third-party services, microservices). With response sequences, status code simulation, and request assertions, `Http::fake()` is the primary tool for testing HTTP-dependent code without network calls.

# Core Concepts
- **`Http::fake()`**: Fakes all outgoing HTTP requests. No arguments = all requests return 200 with empty body.
- **Response sequences**: `Http::sequence($responses)` returns responses in order. Useful for polling or multi-call flows.
- **URL-specific faking**: `Http::fake(['stripe.com/*' => Http::response($body, 200)])` mocks specific URLs.
- **Response factory**: `Http::response($body, $status, $headers)` creates a faked response.
- **Request assertions**: `Http::assertSent($callback)`, `assertNotSent()`, `assertNothingSent()`.
- **Request recording**: All sent requests are recorded. `Http::recorded()` returns sent requests and their responses.
- **Connection pooling prevention**: Faked HTTP client doesn't make real connections. Safe for offline testing.

# Mental Models
- **Http::fake() as network firewall**: All HTTP requests are intercepted. Real network calls never happen unless explicitly allowed.
- **Response sequence as script**: Each call to an external API returns the next response in sequence. Like a scripted conversation.
- **URL pattern matching as routing**: The URL pattern determines which fake response is returned. Wildcard patterns (`*`) for domain-level matching.
- **Request assertion as API contract verification**: `assertSent()` verifies your code sent the correct request to the external service.

# Internal Mechanics
- **`HttpFake` implementation**: Replaces the `Illuminate\Http\Client\Factory` binding. `get()`, `post()`, etc. are intercepted.
- **Response queue**: `Http::response()` creates `Illuminate\Http\Client\Response` instances. Stored in a queue for sequential delivery.
- **URL pattern matching**: Uses `str_is()` for wildcard matching. Exact URL matching first, then wildcard patterns.
- **Request recording**: Each fake request creates a `PendingRequest` recording with URL, method, headers, and body.
- **`assertSent()`**: Searches recorded requests. Matches by URL, closure, or a combination.
- **`Http::sequence()`**: Pre-queues multiple responses. Each call dequeues one response. When queue is empty, subsequent calls throw `OutOfBoundsException`.

# Patterns
- **Pattern: Simple API mock with response**
  - Purpose: Return a predefined JSON response for an API call
  - Benefits: Deterministic test data; no network dependency
  - Tradeoffs: Mock may not match real API response format
  - Implementation: `Http::fake(['api.github.com/*' => Http::response(['login' => 'testuser'], 200)]);`

- **Pattern: Error code simulation**
  - Purpose: Test error handling paths (500, 403, 429, timeout)
  - Benefits: Error handling code actually runs
  - Tradeoffs: Must test each error code separately
  - Implementation: `Http::fake(['*' => Http::response(null, 500)]);` then assert error handling behavior

- **Pattern: Response sequence for polling**
  - Purpose: Simulate a multi-call flow (poll until complete)
  - Benefits: Tests complex polling logic without real delays
  - Tradeoffs: Sequence must match call order exactly
  - Implementation: `Http::sequence([Http::response(['status' => 'pending']), Http::response(['status' => 'complete'])]);`

- **Pattern: Request content assertion**
  - Purpose: Verify the exact request payload sent to an API
  - Benefits: Catches incorrect request formatting
  - Tradeoffs: Tight coupling to request structure
  - Implementation: `Http::assertSent(fn ($request) => $request->url() == 'https://api.example.com/orders' && $request['product_id'] == 123);`

# Architectural Decisions
- **Stub vs assert**: Use URL-specific faking with response for setup (stub). Use `assertSent()` for verification. Don't rely on `assertSent()` to validate response handling.
- **Wildcard vs exact URL**: Use exact URLs for critical endpoints. Use wildcards (`domain.com/*`) for less critical or many-endpoint integrations.
- **`Http::fake()` vs `Http::fakeSequence()`**: `Http::fake` with URL patterns for most cases. `Http::fakeSequence()` for complex multi-response flows.
- **Prevent stray requests**: `Http::fake()` without URL argument catches all requests. Use this to ensure no unexpected HTTP calls.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| No network dependency; fast tests | Mock responses may not match real API | Test against real API in integration suite |
| URL-pattern matching is flexible | Wildcard patterns may match too broadly | List URL patterns explicitly when possible |
| Response sequences handle multi-call flows | Sequence errors fail silently (wrong order) | Assert call order with `assertSentInOrder()` |
| Request assertions catch formatting errors | Tightly coupled to request structure | Acceptable for API boundaries |

# Performance Considerations
- Fake registration: <0.5ms.
- Response delivery: <0.01ms per request.
- Request recording: <0.01ms per recorded request.
- Assertion execution: <0.1ms per assertion.
- Memory: Each recorded request stores full request/response objects. Manageable for <1000 requests.

# Production Considerations
- **Accidental real HTTP calls**: If `Http::fake()` is not called, tests make real HTTP requests. Fail CI if any test makes real external HTTP calls.
- **API mock drift**: Real API responses may change. Scheduled integration tests against real sandbox API catch drift.
- **Secret exposure**: Ensure fake API responses don't contain real secrets. Use placeholder values.
- **Timeout simulation**: `Http::fake()` cannot simulate network timeouts. Use `Http::fake()` with custom response that throws `ConnectionException` for timeout testing.

# Common Mistakes
- **Mistake: Forgetting to call `Http::fake()`**
  - Why: Test written without faking HTTP
  - Why harmful: Real HTTP calls in test environment; slow, unreliable, potential costs
  - Better: Always call `Http::fake()` at the start of HTTP-dependent tests

- **Mistake: Not matching URL patterns correctly**
  - Why: `Http::fake(['https://api.example.com' => ...])` instead of `https://api.example.com/*`
  - Why harmful: URL doesn't match; request falls through to no-match response (default 200 empty)
  - Better: Use wildcard: `Http::fake(['https://api.example.com/*' => ...])`

- **Mistake: Using `assertSent` without faking first**
  - Why: `Http::assertSent()` called but `Http::fake()` wasn't called
  - Why harmful: `assertSent` checks the recorded requests; without faking, assertions may fail or behave unexpectedly
  - Better: Always call `Http::fake()` before code that makes HTTP calls

- **Mistake: Not testing error responses**
  - Why: Only testing successful API responses
  - Why harmful: Error handling (500, 429 rate limit) never executed
  - Better: Test each error path with a faked error response

# Failure Modes
- **No matching URL pattern**: Request to unmatched URL returns default response (200 empty). Use `Http::fake(['*' => ...])` as catch-all to prevent unexpected matches.
- **Sequence exhausted**: More requests made than responses in sequence. Throws `OutOfBoundsException`. Ensure sequence matches request count.
- **Response format mismatch**: Fake response has different structure than real API. Code assumes fields that don't exist in real response.
- **Connection timeout not simulated**: `Http::fake()` doesn't simulate timeouts. Use custom exception throwing for timeout scenarios.

# Ecosystem Usage
- **Laravel core**: `Http` facade testing is documented extensively. The faking system was redesigned in Laravel 10+ for better ergonomics.
- **Laravel Cashier**: Stripe integration uses `Http::fake()` for all payment testing. Cashier's test suite demonstrates comprehensive HTTP faking patterns.
- **Laravel Socialite**: OAuth provider callbacks are tested with `Http::fake()` to mock provider responses.
- **Spatie packages**: Spatie's API-dependent packages (Laravel News, Mailcoach) use `Http::fake()` for HTTP integration testing.

# Related Knowledge Units
- **Prerequisites**: Laravel fakes, HTTP Client (Http facade), Laravel service container
- **Related Topics**: Laravel fakes, Mail/notification testing, Mockery integration
- **Advanced Follow-up**: Custom HTTP fake responses, Async HTTP testing, Webhook testing with Http fakes

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
