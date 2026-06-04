# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Mockery Integration

---

### Rule 1: Use Mockery only for custom interfaces, not Laravel-native services

| Field | Value |
|-------|-------|
| **Name** | Reserve mocks for custom interfaces |
| **Category** | Double Selection |
| **Rule** | Use Mockery mocks only for custom interfaces, repositories, and third-party SDKs without built-in fakes. For `Mail`, `Event`, `Queue`, `Http`, and other Laravel services, use the `::fake()` method. |
| **Reason** | Laravel's built-in fakes are less brittle, require less setup, and are designed specifically for testing those services. Mocking them with Mockery creates unnecessary brittleness and verbosity. |
| **Bad Example** | `Mail::shouldReceive('send')->once()` — Mockery mocking a Laravel service. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);`. |
| **Exceptions** | When you need to test edge cases that the built-in fake doesn't support. Rare. |
| **Consequences Of Violation** | Tests are more brittle and verbose than necessary. Refactoring breaks mock expectations. |

---

### Rule 2: Always specify explicit call count expectations

| Field | Value |
|-------|-------|
| **Name** | Set call counts on all expectations |
| **Category** | Mock Expectations |
| **Rule** | Every `shouldReceive()` must be followed by `once()`, `twice()`, `times(N)`, `atLeast()`, or `never()`. |
| **Reason** | Without a call count, the method can be called 0, 1, or 10 times and the test still passes. This means the tested code could completely skip calling the dependency and the assertion would succeed. |
| **Bad Example** | `$mock->shouldReceive('send')->andReturn(true)` — can be called 0 times, test still passes. |
| **Good Example** | `$mock->shouldReceive('send')->once()->andReturn(true)` — must be called exactly once. |
| **Exceptions** | Stubs where only the return value matters and call count is irrelevant (use `andReturn()` without `shouldReceive()` expectations in this case). |
| **Consequences Of Violation** | Test passes even when the dependency is never called. Behaviour may be entirely missing. |

---

### Rule 3: Use spies for post-hoc verification, mocks for pre-configured behavior

| Field | Value |
|-------|-------|
| **Name** | Spies for verification, mocks for setup |
| **Category** | Double Selection |
| **Rule** | Use `$this->spy(Class::class)` and `shouldHaveReceived()` when you need to verify interactions after the fact. Use `$this->mock()` with `shouldReceive()` when you need to configure return values and expectations upfront. |
| **Reason** | Spies don't interrupt the test on unexpected calls — they record everything and let you assert after. Mocks with pre-configured expectations fail immediately on unexpected calls. Spies are less brittle for verification scenarios. |
| **Bad Example** | `$mock->shouldReceive('log')->once()` — mock immediately fails if a different method is called first. |
| **Good Example** | `$spy = $this->spy(Logger::class); // ... code under test ... $spy->shouldHaveReceived('log')->once();`. |
| **Exceptions** | When strict enforcement is needed (verify NO other methods were called). |
| **Consequences Of Violation** | Tests fail on unexpected but harmless calls. Cascading failures obscure real problems. |

---

### Rule 4: Never mock Eloquent models

| Field | Value |
|-------|-------|
| **Name** | Don't mock Eloquent |
| **Category** | Anti-Pattern |
| **Rule** | Never create `$this->mock(User::class)` or `Mockery::mock(User::class)`. Use factory-created records in feature tests instead. |
| **Reason** | Eloquent models are tightly coupled to the database. Their magic methods, relationship loading, and query builder behavior are nearly impossible to mock correctly. Mocked models behave differently from real ones, creating false confidence. |
| **Bad Example** | `$mock = $this->mock(User::class); $mock->shouldReceive('save')->once()` — extremely brittle. |
| **Good Example** | `$user = User::factory()->create(); $this->actingAs($user)->post('/dashboard')->assertOk();`. |
| **Exceptions** | None. This is a hard constraint. |
| **Consequences Of Violation** | Mocks behave differently from real models. Tests pass with mocks but fail with real models. |

---

### Rule 5: Prefer dependency extraction over partial mocking

| Field | Value |
|-------|-------|
| **Name** | Extract rather than partial mock |
| **Category** | Code Design |
| **Rule** | When you need to mock one method of a class, consider extracting that method to a separate collaborator. Use `$this->partialMock()` only as a temporary measure. |
| **Reason** | Partial mocking tests internal structure (which method calls which other method on the same class). This is an implementation detail. Extracting the method to a separate class creates a clean interface boundary that can be mocked naturally. |
| **Bad Example** | `$this->partialMock(OrderService::class)->shouldReceive('getShippingRate')->once()` — testing internal method routing. |
| **Good Example** | `$shipping = $this->mock(ShippingRateProvider::class); $service = new OrderService($shipping);` — clear separation of concerns. |
| **Exceptions** | Legacy code that cannot be refactored. |
| **Consequences Of Violation** | Tests are coupled to internal class structure. Refactoring breaks tests. |

---

### Rule 6: Keep mock setup visible in test methods

| Field | Value |
|-------|-------|
| **Name** | Visible mock configuration |
| **Category** | Test Readability |
| **Rule** | Configure mocks directly in the test method, not in a shared `setUp()` or `beforeEach()` block. |
| **Reason** | Shared mock setup hides important test configuration. A developer reading the test must scan multiple methods to understand what the test does. Changes to shared setup affect all tests, often unexpectedly. |
| **Bad Example** | `$repo = $this->createMock(Repo::class); $repo->method('find')->willReturn($user);` in `setUp()` — hidden from each test method. |
| **Good Example** | Mock configured within the test method — all expectations visible in one place. |
| **Exceptions** | Mocks that are truly identical across all tests in a class (very rare). |
| **Consequences Of Violation** | Tests are harder to read. Changes to shared mock setup break unrelated tests. |
