# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: Exception Handling Testing

---

### Rule 1: Always call `Exceptions::fake()` before triggering exceptions in reporting tests

| Field | Value |
|-------|-------|
| **Name** | Fake exceptions before triggering them |
| **Category** | Exception Reporting |
| **Rule** | Always call `Exceptions::fake()` at the start of any test that verifies exception reporting behavior. |
| **Reason** | Without `Exceptions::fake()`, exceptions are reported to the real exception handler, which may send them to Sentry/Flare, log them, or crash the test process. `assertReported()` cannot capture exceptions reported to the real handler. |
| **Bad Example** | `$this->postJson('/orders', [])` without `Exceptions::fake()` — real error monitoring receives test errors. |
| **Good Example** | `Exceptions::fake(); $this->postJson('/orders', [])->assertStatus(422); Exceptions::assertReported(OrderFailedException::class);`. |
| **Exceptions** | Tests that specifically test the real exception handler's behavior (integration tests). |
| **Consequences Of Violation** | Real error monitoring services receive test data. `assertReported()` returns false negatives. |

---

### Rule 2: Test both reporting and rendering for critical exceptions

| Field | Value |
|-------|-------|
| **Name** | Test exception reporting and rendering |
| **Category** | Exception Handling |
| **Rule** | For every custom application exception, write two tests: one verifying the exception is reported (via `assertReported()`) and one verifying the rendered response (via HTTP test or custom handler test). |
| **Reason** | Reporting and rendering are independent concerns. An exception may be correctly reported but render the wrong HTTP response, or render correctly but never reach the error monitoring service. |
| **Bad Example** | Testing only `Exceptions::assertReported(PaymentFailedException::class)` — user sees a blank error page. |
| **Good Example** | Reporting test + render test: `$response->assertStatus(402)->assertJson(['error' => 'Payment failed'])`. |
| **Exceptions** | Exceptions that are never intended to render (e.g., internal exceptions that are always caught and handled). |
| **Consequences Of Violation** | Exceptions reach error monitoring with wrong formatting. Users see confusing or unsafe error pages. |

---

### Rule 3: Assert that expected exceptions (validation, 404, auth) are NOT reported

| Field | Value |
|-------|-------|
| **Name** | Verify expected failures are not reported as errors |
| **Category** | Exception Reporting |
| **Rule** | Use `Exceptions::assertNotReported()` to verify that validation errors, 404s, and authorization failures are not reported to error monitoring. |
| **Reason** | Expected client errors should not clutter error monitoring dashboards. A validation error is not an application bug — reporting it creates noise that hides real errors. |
| **Bad Example** | Only testing that critical exceptions ARE reported — error monitoring is full of validation errors. |
| **Good Example** | `Exceptions::assertNotReported(ValidationException::class); Exceptions::assertNotReported(AuthenticationException::class);`. |
| **Exceptions** | If the project deliberately reports all 4xx errors for analytics purposes. |
| **Consequences Of Violation** | Error monitoring is polluted with expected errors. Real application errors are buried in noise. Alert fatigue increases. |

---

### Rule 4: Test exception context data for debugging information

| Field | Value |
|-------|-------|
| **Name** | Verify exception context contains debugging data |
| **Category** | Exception Context |
| **Rule** | When custom exceptions carry context data (order_id, user_id, request data), use `Exceptions::assertReported(fn ($e) => $e->context['order_id'] === 123)` to verify the context is correct. |
| **Reason** | Error monitoring relies on context data for debugging. Missing or incorrect context makes production errors impossible to diagnose. |
| **Bad Example** | `Exceptions::assertReported(OrderFailedException::class)` — no context verification. |
| **Good Example** | `Exceptions::assertReported(fn (OrderFailedException $e) => $e->context['user_id'] === $user->id && $e->context['order_id'] > 0)`. |
| **Exceptions** | Generic exceptions without context data. |
| **Consequences Of Violation** | Production errors reported without debugging context. Engineers cannot diagnose root causes. MTTR increases significantly. |

---

### Rule 5: Test sensitive data redaction in exception context

| Field | Value |
|-------|-------|
| **Name** | Verify sensitive data is excluded from exception context |
| **Category** | Security |
| **Rule** | Test that passwords, tokens, credit card numbers, and PII are stripped from exception context before reporting. |
| **Reason** | Exception context is sent to error monitoring services and logged. Sensitive data in context creates a data breach vector through monitoring tools. |
| **Bad Example** | Login exception reports include `password` in context — exposed in Sentry/Flare logs. |
| **Good Example** | `Exceptions::assertReported(fn (LoginException $e) => !isset($e->context['password']) && !isset($e->context['credit_card']))`. |
| **Exceptions** | None. Sensitive data must always be redacted. |
| **Consequences Of Violation** | Sensitive data stored in error monitoring systems. GDPR/PCI compliance violations. Credential leakage. |
