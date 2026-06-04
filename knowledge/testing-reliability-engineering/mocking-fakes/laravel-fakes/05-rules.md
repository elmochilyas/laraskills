# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Laravel Fakes

---

### Rule 1: Prefer `::fake()` over Mockery mocks for all Laravel-native services

| Field | Value |
|-------|-------|
| **Name** | Use built-in fakes before mocks |
| **Category** | Double Selection |
| **Rule** | For `Bus`, `Event`, `Http`, `Mail`, `Notification`, `Queue`, `Storage`, and `Exceptions` — always use the `::fake()` method instead of Mockery mocks. |
| **Reason** | Built-in fakes are realistic in-memory implementations with assertion methods designed for each service. They require less setup, are less brittle, and test behavior rather than implementation. Mocks should be reserved for custom interfaces without built-in fakes. |
| **Bad Example** | `$this->mock(Mailer::class)->shouldReceive('send')->once()` — more brittle, more setup. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);` — cleaner, less brittle. |
| **Exceptions** | Custom interfaces and third-party SDKs without built-in fakes. |
| **Consequences Of Violation** | Tests are more brittle and have more setup code. Refactoring breaks mock expectations. |

---

### Rule 2: Call `::fake()` before the code under test, not after

| Field | Value |
|-------|-------|
| **Name** | Fake before the action |
| **Category** | Test Setup |
| **Rule** | Call `::fake()` at the start of the test method (or in `setUp()`), before any code that might use the faked service. |
| **Reason** | `::fake()` replaces the service container binding. If the service was already resolved before `::fake()` is called, the original binding is cached and the fake has no effect. The code continues to use the real service. |
| **Bad Example** | `$this->post('/register'); Mail::fake(); Mail::assertSent(WelcomeMail::class);` — fake after the action. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);` — fake before the action. |
| **Exceptions** | None. Always fake before the action. |
| **Consequences Of Violation** | Fake has no effect. Real mail is sent, real HTTP calls are made. Assertions fail mysteriously. |

---

### Rule 3: Every `::fake()` must be paired with at least one assertion

| Field | Value |
|-------|-------|
| **Name** | Fake without assertion is useless |
| **Category** | Test Strategy |
| **Rule** | Every call to `::fake()` must be followed by at least one assertion (`assertSent()`, `assertDispatched()`, `assertPushed()`, `assertExists()`, etc.). |
| **Reason** | A fake only prevents side effects — it does not verify that the service was actually used. Without assertions, the test passes even if the service was never called. The test provides no confidence about the behavior. |
| **Bad Example** | `Mail::fake(); $this->post('/register');` — no assertion; passes even if no mail is sent. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);`. |
| **Exceptions** | None. Every fake requires an assertion. |
| **Consequences Of Violation** | Test provides false confidence. Service interaction may be completely broken but tests still pass. |

---

### Rule 4: Use assertion callbacks for data verification

| Field | Value |
|-------|-------|
| **Name** | Verify service data in assertions |
| **Category** | Service Assertion |
| **Rule** | Use the callback argument of assertion methods to verify service data: `Mail::assertSent(fn ($mail) => $mail->hasTo($user->email))`. |
| **Reason** | Asserting only the class (e.g., `Mail::assertSent(WelcomeMail::class)`) tells you the service was called, but not with the correct data. The mail may go to the wrong recipient or have wrong content. |
| **Bad Example** | `Mail::assertSent(WelcomeMail::class)` — doesn't verify recipient or content. |
| **Good Example** | `Mail::assertSent(fn (WelcomeMail $mail) => $mail->hasTo($user->email) && $mail->hasSubject('Welcome!'))`. |
| **Exceptions** | Events or commands that carry no data beyond their type. |
| **Consequences Of Violation** | Service is called but with wrong data. Mail goes to wrong recipient. Job dispatched with wrong parameters. |

---

### Rule 5: Fake all external services in feature tests

| Field | Value |
|-------|-------|
| **Name** | Fake all external services |
| **Category** | Test Safety |
| **Rule** | For feature/integration tests, call `Mail::fake(); Http::fake(); Queue::fake(); Event::fake(); Storage::fake();` at the start to prevent any accidental external service calls. |
| **Reason** | A single unfaked service call during testing can send real emails, make real HTTP calls, or write to real cloud storage. Faking all services by default provides a safety net against accidental external interactions. |
| **Bad Example** | Only faking the service under test — an unrelated code path makes a real HTTP call. |
| **Good Example** | `Mail::fake(); Http::fake(); Queue::fake(); Event::fake(); Storage::fake();` — all external services faked. |
| **Exceptions** | Tests that specifically test a real service integration (separate integration suite). |
| **Consequences Of Violation** | Accidental real service calls during testing. Real emails sent, real API costs incurred. |

---

### Rule 6: Fake selectively in unit tests, comprehensively in integration tests

| Field | Value |
|-------|-------|
| **Name** | Scope faking to test type |
| **Category** | Test Strategy |
| **Rule** | In unit tests, fake only the specific service under test. In integration tests, fake all external services. |
| **Reason** | Unit tests focus on one service's behavior — faking only that service keeps the test focused. Integration tests must prevent any external calls to maintain determinism and speed — fake everything. |
| **Bad Example** | Integration test faking only `Mail` — `Http` call leaks to real service. |
| **Good Example** | Unit test: `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);`. Integration test: `Mail::fake(); Http::fake(); Queue::fake(); Event::fake();`. |
| **Exceptions** | None. This is the standard faking convention. |
| **Consequences Of Violation** | Unit tests have unnecessary fakes (obscuring test intent) or integration tests miss fakes (real external calls). |
