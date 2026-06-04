# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: HTTP Client Faking

---

### Rule 1: Always call `Http::fake()` before any HTTP-dependent code

| Field | Value |
|-------|-------|
| **Name** | Fake HTTP before external calls |
| **Category** | Test Setup |
| **Rule** | Call `Http::fake()` as the first line of any test that makes outgoing HTTP requests via the `Http` facade. |
| **Reason** | Without `Http::fake()`, tests make real HTTP calls. Real calls are slow (network latency), unreliable (service availability), and potentially costly (API charges). A test that hits a real API is a bug. |
| **Bad Example** | `$this->post('/sync')->assertOk()` — makes real API calls; slow and network-dependent. |
| **Good Example** | `Http::fake(['api.example.com/*' => Http::response(['status' => 'ok'], 200)]); $this->post('/sync')->assertOk();`. |
| **Exceptions** | Dedicated integration tests against real sandbox environments, in a separate CI suite. |
| **Consequences Of Violation** | Tests are slow, network-dependent, and may incur API costs. CI fails when external services are unavailable. |

---

### Rule 2: Use URL pattern matching with wildcards

| Field | Value |
|-------|-------|
| **Name** | Wildcard URL patterns |
| **Category** | Response Stubbing |
| **Rule** | Use wildcard URL patterns like `api.github.com/*` instead of exact URLs like `api.github.com`. |
| **Reason** | Exact URLs fail due to trailing slashes, query parameters, or path changes. A URL that matches in production may not match the fake pattern, falling through to the default empty 200 response silently. |
| **Bad Example** | `Http::fake(['api.github.com' => ...])` — matching fails for `api.github.com/users`. |
| **Good Example** | `Http::fake(['api.github.com/*' => ...])` — matches all paths under that domain. |
| **Exceptions** | Exact endpoint URLs that are guaranteed stable (rare). |
| **Consequences Of Violation** | URL mismatch causes the request to fall through to the catch-all. Test passes but wrong code path is exercised. |

---

### Rule 3: Test each error response path with faked error codes

| Field | Value |
|-------|-------|
| **Name** | Simulate all API error paths |
| **Category** | Error Handling |
| **Rule** | For every external API integration, write separate tests faking 500, 403, and 429 responses. Verify the application handles each error correctly. |
| **Reason** | Error handling code is only exercised when the corresponding error occurs. Without simulated errors, error handling is dead code. A 500 response handler may be completely broken without any test noticing. |
| **Bad Example** | Only testing successful API responses — error handling code never executes in tests. |
| **Good Example** | `test_handles_500_error()`, `test_handles_rate_limit()`, `test_handles_unauthorized()` — each with a faked error response. |
| **Exceptions** | APIs where the error handling is identical for all error types. |
| **Consequences Of Violation** | Error handling code is untested. Production errors may crash the application or leak sensitive data. |

---

### Rule 4: Use `assertSent()` to verify request content

| Field | Value |
|-------|-------|
| **Name** | Verify outgoing request content |
| **Category** | Request Verification |
| **Rule** | After faking HTTP responses, use `Http::assertSent(fn ($request) => $request->url() === '...' && $request['key'] === 'value')` to verify the application sent the correct request. |
| **Reason** | A faked response only verifies the application handles responses correctly. Request assertions verify the application sends the correct data. Both are needed — wrong request payloads are a common bug. |
| **Bad Example** | `Http::fake([...]); $this->post('/sync');` — no assertion on what request was sent. |
| **Good Example** | `Http::fake([...]); $this->post('/sync'); Http::assertSent(fn ($r) => $r->url() === 'https://api.example.com/orders' && $r['product_id'] === 123);`. |
| **Exceptions** | Tests where the request content is not the concern (rare — usually indicates a test gap). |
| **Consequences Of Violation** | Application sends wrong data to external API. Integration failures that are invisible in tests. |

---

### Rule 5: Use a catch-all pattern to prevent unexpected HTTP requests

| Field | Value |
|-------|-------|
| **Name** | Catch unexpected HTTP requests |
| **Category** | Test Safety |
| **Rule** | Include a catch-all pattern `'*' => Http::response(null, 500)` in `Http::fake()` to ensure any unmocked URL causes a test failure. |
| **Reason** | If a URL pattern is misspelled or a new API endpoint is added without updating mocks, the request falls through to the default response (200, empty body). The catch-all returns 500, causing the test to fail and alerting you to the missing mock. |
| **Bad Example** | `Http::fake(['api.github.com/*' => ...])` — a request to `api.unknown.com` goes unmocked, returning 200 silently. |
| **Good Example** | `Http::fake(['api.github.com/*' => Http::response(...), '*' => Http::response(null, 500)])` — unknown URLs cause failures. |
| **Exceptions** | When you genuinely don't care about unmatched URLs (rare). |
| **Consequences Of Violation** | Unmocked HTTP requests pass silently. Tests exercise different code paths than intended. |

---

### Rule 6: Use `Http::sequence()` for multi-response flows (polling, retries)

| Field | Value |
|-------|-------|
| **Name** | Sequence responses for multi-call flows |
| **Category** | Response Stubbing |
| **Rule** | For code that makes multiple sequential HTTP calls (polling, retry logic), use `Http::sequence()` to return different responses in order. |
| **Reason** | Polling and retry flows require different responses over time (e.g., "pending" → "pending" → "complete"). `Http::response()` returns the same response every time. `Http::sequence()` returns responses in the specified order. |
| **Bad Example** | `Http::fake(['api.job.com/*' => Http::response(['status' => 'complete'], 200)])` — polling code never sees "pending" status. |
| **Good Example** | `Http::fake(['api.job.com/*' => Http::sequence()->push(['status' => 'pending'], 200)->push(['status' => 'pending'], 200)->push(['status' => 'complete'], 200)])`. |
| **Exceptions** | Single-request integrations that don't poll or retry. |
| **Consequences Of Violation** | Polling/retry logic never hits intermediate states. Edge cases untested. |
