# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Test Double Taxonomy

---

### Rule 1: Follow the preference hierarchy: Fakes > Spies > Mocks > Stubs > Dummies

| Field | Value |
|-------|-------|
| **Name** | Prefer realistic doubles |
| **Category** | Double Selection |
| **Rule** | Choose test doubles in this order of preference: Laravel fakes (most preferred), spies, mocks, stubs, dummies (least preferred). |
| **Reason** | Fakes provide the most realistic behavior with the least brittle setup. Moving down the hierarchy, doubles become less realistic and more brittle. Using a mock when a fake would suffice creates unnecessary maintenance burden. |
| **Bad Example** | `Mockery::mock(HttpClient::class)` when `Http::fake()` would provide more realistic behavior. |
| **Good Example** | `Http::fake()` — intercepts HTTP calls, records them, and provides assertion methods. |
| **Exceptions** | Custom services without Laravel-native fakes may need mocks or custom fakes. |
| **Consequences Of Violation** | Tests are more brittle than necessary. Refactoring breaks mock expectations that fakes would handle correctly. |

---

### Rule 2: Use stubs for query methods, mocks/spies for command methods

| Field | Value |
|-------|-------|
| **Name** | Stub queries, mock/spy commands |
| **Category** | Double Selection |
| **Rule** | Use stubs (where only the return value matters) for query/read methods. Use mocks or spies (where call verification matters) for command/write methods. |
| **Reason** | Query methods return data — stub the data. Command methods perform actions — verify the action. Mocking a query's call count over-specifies; stubbing a command misses the side effect verification. |
| **Bad Example** | `$repo->expects($this->once())->method('find')` — query call count shouldn't be fixed. |
| **Good Example** | Stub: `$repo->method('find')->willReturn($user)`. Mock: `$mailer->shouldReceive('send')->once()`. |
| **Exceptions** | Methods that both query and mutate (design smell — consider separating CQRS). |
| **Consequences Of Violation** | Brittle tests with unnecessary expectations on queries. Missed verification on commands. |

---

### Rule 3: Prefer state verification over interaction verification

| Field | Value |
|-------|-------|
| **Name** | Test result state, not method calls |
| **Category** | Test Design |
| **Rule** | Verify the system under test's output (state) rather than verifying that specific methods were called (interaction). |
| **Reason** | State verification tests actual behavior. Interaction verification tests implementation details. Refactoring that preserves behavior breaks interaction tests but not state tests. |
| **Bad Example** | `$logger->shouldHaveReceived('info')->once()` — tests logger interaction, not the actual outcome. |
| **Good Example** | `expect(File::get('log.txt'))->toContain('Order confirmed')` — tests the actual outcome. |
| **Exceptions** | When the only observable effect of a method is the interaction itself (e.g., dispatching a command). |
| **Consequences Of Violation** | Tests break on refactoring without behavior change. High maintenance cost. |

---

### Rule 4: Don't mock what you don't own

| Field | Value |
|-------|-------|
| **Name** | Mock your own abstractions |
| **Category** | Boundary Design |
| **Rule** | Mock interfaces you control, not third-party SDK classes. Create your own `PaymentGatewayInterface` and mock that, not the Stripe client directly. |
| **Reason** | Third-party interfaces change without notice and outside your control. Mocking your own abstraction insulates tests from third-party changes and allows switching providers without rewriting tests. |
| **Bad Example** | `$this->createMock(Stripe\StripeClient::class)` — coupled to Stripe's interface. |
| **Good Example** | `$this->createMock(App\Contracts\PaymentGateway::class)` — coupled to your own contract. |
| **Exceptions** | Laravel's own contracts (e.g., `Mailer`, `Queue`) are stable and safe to mock. |
| **Consequences Of Violation** | Third-party SDK updates break tests. Switching providers requires rewriting all mock expectations. |

---

### Rule 5: Keep mock setup minimal (mock lines < assertion lines)

| Field | Value |
|-------|-------|
| **Name** | Mock setup should be minimal |
| **Category** | Test Design |
| **Rule** | If a test has more lines of mock setup than assertion lines, it is over-mocked. Refactor to use fakes or real instances. |
| **Reason** | Excessive mock setup indicates the code under test has too many dependencies, or the test is over-specifying interactions. Both are code smells that increase maintenance cost. |
| **Bad Example** | 15 lines of mock setup for 3 lines of assertions. |
| **Good Example** | 3 lines of mock setup for 3 lines of assertions — proportional. |
| **Exceptions** | Legacy code that cannot be refactored. |
| **Consequences Of Violation** | Tests are hard to read and expensive to maintain. Developers spend more time on mock setup than test logic. |
