# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Event Testing

---

### Rule 1: Always pair `Event::fake()` with `assertDispatched()` — never one without the other

| Field | Value |
|-------|-------|
| **Name** | Fake + assert as mandatory pair |
| **Category** | Event Assertion |
| **Rule** | Every `Event::fake()` call must be paired with at least one `Event::assertDispatched()` or `Event::assertNothingDispatched()` call. |
| **Reason** | `Event::fake()` prevents listener execution and records dispatched events, but without an assertion, the test passes even if no event was dispatched. The fake only prevents side effects — assertions verify behavior. |
| **Bad Example** | `Event::fake(); $this->post('/register');` — no assertion; passes even if no event dispatched. |
| **Good Example** | `Event::fake(); $this->post('/register'); Event::assertDispatched(UserRegistered::class);`. |
| **Exceptions** | Tests where preventing listener side effects is the only goal (rare — use `fakeExcept` instead). |
| **Consequences Of Violation** | Test passes despite event dispatch being completely broken. Silent failure in production. |

---

### Rule 2: Test listener logic separately from event dispatch

| Field | Value |
|-------|-------|
| **Name** | Separate listener and dispatch tests |
| **Category** | Test Strategy |
| **Rule** | Test event dispatch using `Event::fake()` + `assertDispatched()`. Test listener logic by calling `$listener->handle($event)` directly in a separate test. |
| **Reason** | `Event::fake()` prevents listener execution — you cannot verify listener side effects through the fake. Testing listeners directly by calling `handle()` is simpler, faster, and more reliable. |
| **Bad Example** | Trying to verify listener side effects through `Event::fake()` — listener never runs. |
| **Good Example** | Separate tests: `test_event_dispatched_on_registration()` (via `Event::fake()`) and `test_listener_sends_welcome_email()` (via `$listener->handle($event)`). |
| **Exceptions** | Listeners that are trivially simple (e.g., just dispatch another event). |
| **Consequences Of Violation** | Listener logic is never tested. Events are dispatched, but listeners do nothing or fail silently. |

---

### Rule 3: Verify event data in the `assertDispatched()` callback

| Field | Value |
|-------|-------|
| **Name** | Assert event data in callback |
| **Category** | Event Assertion |
| **Rule** | Use the callback argument of `assertDispatched(fn ($event) => $event->user->id === $id)` to verify event properties. |
| **Reason** | Asserting only the event class (`assertDispatched(UserRegistered::class)`) tells you the event was dispatched, but not with the correct data. The event may have wrong or missing properties, which is a silent failure. |
| **Bad Example** | `Event::assertDispatched(OrderPlaced::class)` — doesn't verify order ID or amount. |
| **Good Example** | `Event::assertDispatched(fn (OrderPlaced $e) => $e->order->id === $order->id && $e->amount === 100.00)`. |
| **Exceptions** | Events that carry no data beyond their type. |
| **Consequences Of Violation** | Events dispatched with wrong data. Downstream listeners receive incorrect information. |

---

### Rule 4: Use `assertListening()` to verify listener registration

| Field | Value |
|-------|-------|
| **Name** | Verify listener registration |
| **Category** | Event Configuration |
| **Rule** | Add `Event::assertListening(Event::class, Listener::class)` tests to verify that each event-listener mapping is registered in `EventServiceProvider`. |
| **Reason** | A listener can be correctly implemented and the event can be dispatched, but if the listener isn't registered in `EventServiceProvider`, it will never execute. `assertListening()` catches this configuration gap. |
| **Bad Example** | Listener exists and works in isolation, but isn't registered — production event does nothing. |
| **Good Example** | `Event::assertListening(UserRegistered::class, SendWelcomeEmail::class)` — verifies registration. |
| **Exceptions** | Listeners registered via `$listen` property of `EventServiceProvider` are auto-covered if the array is correct. |
| **Consequences Of Violation** | Events dispatch but listeners don't execute. Silent failure of expected side effects. |

---

### Rule 5: Use `Event::fakeExcept()` for integration tests that need some listeners to execute

| Field | Value |
|-------|-------|
| **Name** | Selective faking for integration tests |
| **Category** | Test Strategy |
| **Rule** | Use `Event::fakeExcept([CriticalEvent::class])` when some events must trigger their real listeners during a test, while others should be faked. |
| **Reason** | Full `Event::fake()` prevents all listeners. In integration tests, some listeners may be needed for the test to complete (e.g., a listener that updates a critical counter). Selective faking allows you to prevent unwanted side effects while keeping required ones. |
| **Bad Example** | `Event::fake()` — all listeners blocked; test setup that depends on a listener's side effect fails. |
| **Good Example** | `Event::fakeExcept([OrderPlaced::class])` — OrderPlaced listener runs; all other events are faked. |
| **Exceptions** | Unit tests where full faking is appropriate. |
| **Consequences Of Violation** | Integration test setup fails because a required listener's side effect doesn't execute. |

---

### Rule 6: Use `Queue::fake()` in addition to `Event::fake()` for queued listeners

| Field | Value |
|-------|-------|
| **Name** | Fake both events and queue for queued listeners |
| **Category** | Listener Testing |
| **Rule** | When a listener implements `ShouldQueue`, use both `Queue::fake()` and `Event::fake()` to verify both the event dispatch and the job dispatch. |
| **Reason** | `Event::fake()` records that the event was dispatched to the queued listener. `Queue::fake()` records that the queued job was pushed. Both assertions are needed to confirm the complete pathway. |
| **Bad Example** | `Event::fake()` only — verifies dispatch but not that the listener was actually queued. |
| **Good Example** | `Event::fake(); Queue::fake(); $this->post('/order'); Event::assertDispatched(OrderPlaced::class); Queue::assertPushed(SendConfirmation::class);`. |
| **Exceptions** | Non-queued (sync) listeners — they execute immediately. |
| **Consequences Of Violation** | Event dispatches but listener job never reaches the queue. Silent failure. |
