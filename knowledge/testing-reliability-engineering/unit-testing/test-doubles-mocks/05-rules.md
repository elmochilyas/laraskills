# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Test Doubles & Mocks

---

### Rule 1: Prefer Laravel fakes over Mockery mocks for framework services

| Field | Value |
|-------|-------|
| **Name** | Use fakes before mocks |
| **Category** | Double Selection |
| **Rule** | Use `Http::fake()`, `Mail::fake()`, `Queue::fake()`, `Notification::fake()`, `Storage::fake()`, `Event::fake()`, or `Bus::fake()` before using Mockery mocks for Laravel framework services. |
| **Reason** | Laravel fakes are realistic in-memory implementations with built-in assertion methods. They require less setup code than mocks and are less brittle — they don't break on refactoring as long as the final state is correct. |
| **Bad Example** | `$mailer = Mockery::mock(Mailer::class); $mailer->shouldReceive('send')->once(); app()->instance(Mailer::class, $mailer);`. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);`. |
| **Exceptions** | Custom services without Laravel-native fakes — use mocks or create custom fakes. |
| **Consequences Of Violation** | Tests are more brittle and have more setup code than necessary. Refactoring breaks many mock expectations. |

---

### Rule 2: Stub queries, mock commands

| Field | Value |
|-------|-------|
| **Name** | Match double type to method purpose |
| **Category** | Double Selection |
| **Rule** | Use stubs for query/read methods (return value matters, interaction pattern irrelevant). Use mocks or spies for command/write methods (call count and arguments matter). |
| **Reason** | Queries have return values — stub the return. Commands have side effects — verify they were called correctly. Using a mock for a query over-specifies the interaction; using a stub for a command misses verification. |
| **Bad Example** | `$repo->expects($this->once())->method('find')->willReturn($user)` — over-specifies; a query call count shouldn't be fixed. |
| **Good Example** | Stub: `$repo->method('find')->willReturn($user)`. Mock: `$mailer->expects($this->once())->method('send')`. |
| **Exceptions** | Methods that are both queries and commands (rare — indicates a design problem). |
| **Consequences Of Violation** | Brittle tests with unnecessary call count expectations on query methods. Missed verification on command methods. |

---

### Rule 3: Never mock value objects, Eloquent models, or the class under test

| Field | Value |
|-------|-------|
| **Name** | Don't mock value objects, models, or SUT |
| **Category** | Anti-Patterns |
| **Rule** | Always use real instances for value objects (`new Email('test@test.com')`), never mock Eloquent models, and never partially mock the class under test. |
| **Reason** | Value objects are simple data containers — real instances are simpler than mocks. Eloquent models are tightly coupled to the database — mocks behave differently than real models. Partial mocks of the SUT test implementation details, not behavior. |
| **Bad Example** | `$this->createMock(Email::class)` — real instance `new Email('test@test.com')` is simpler. |
| **Good Example** | `new Email('test@test.com')` — real instance. |
| **Exceptions** | None. These are hard constraints. |
| **Consequences Of Violation** | Tests are brittle, harder to read, and don't test real behavior. Mocks behave differently from real implementations. |

---

### Rule 4: Keep mock setups visible in test methods, not hidden in `setUp()`

| Field | Value |
|-------|-------|
| **Name** | Visible mock configuration |
| **Category** | Test Readability |
| **Rule** | Configure mocks and expectations in the test method itself, not in a shared `setUp()` or `beforeEach()` block. |
| **Reason** | Shared mock setup hides important test configuration from the reader. A developer must scan both `setUp()` and the test method to understand what the test does. When mock setup changes for one test, it may break others sharing the same setup. |
| **Bad Example** | Mocks configured in `setUp()` — reader must check both setup and test methods to understand expectations. |
| **Good Example** | Mocks configured at the top of each test method — all expectations visible in one place. |
| **Exceptions** | Mocks that are truly identical across all tests in a class (rare in practice; consider if the fixture is appropriate). |
| **Consequences Of Violation** | Tests are harder to read. Changes to shared mock setup break unrelated tests. |

---

### Rule 5: Don't mock what you don't own

| Field | Value |
|-------|-------|
| **Name** | Mock your own interfaces |
| **Category** | Boundary Design |
| **Rule** | Mock your own interfaces that wrap third-party SDKs, not the SDK classes themselves. |
| **Reason** | Third-party SDK interfaces change without notice. Mocking `Stripe\StripeClient` directly couples your tests to Stripe's interface. Mocking your own `PaymentGatewayInterface` isolates your tests from third-party changes. |
| **Bad Example** | `$this->createMock(Stripe\StripeClient::class)` — coupled to Stripe's interface. |
| **Good Example** | `$this->createMock(App\Contracts\PaymentGateway::class)` — coupled to your own abstraction. |
| **Exceptions** | Laravel's own contracts (e.g., `Illuminate\Contracts\Mail\Mailer`) are stable and safe to mock directly. |
| **Consequences Of Violation** | SDK updates break tests. Third-party interface changes require updating every mock expectation. |

---

### Rule 6: Use spies for post-hoc verification instead of pre-configured mocks

| Field | Value |
|-------|-------|
| **Name** | Use spies for flexible interaction verification |
| **Category** | Double Selection |
| **Rule** | Use `Mockery::spy()` for verifying interactions after the fact. Use `$this->createMock()` with `expects()` only when pre-configured expectations are required. |
| **Reason** | Spies don't interrupt the test on unexpected calls — they record everything and let you assert after. Mocks with `expects()` fail immediately on unexpected calls, which can cause cascading failures. Spies are less brittle. |
| **Bad Example** | `$mock->expects($this->once())->method('send')` — fails if any unexpected call occurs before `send()`. |
| **Good Example** | `$spy = Mockery::spy(Mailer::class); // ... execute action ... $spy->shouldHaveReceived('send')->once();`. |
| **Exceptions** | When you need strict enforcement (verify that NO other methods were called). |
| **Consequences Of Violation** | Tests fail on unexpected but harmless interactions. Cascading failures obscure the real problem. |
