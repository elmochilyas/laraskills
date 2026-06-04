# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Event Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel fakes, Event system fundamentals, Listener development |
| Related KUs | Queue/job testing, Mail/notification testing, Service container events |
| Source | domain-analysis.md K030 |

# Overview

Event testing verifies that events are dispatched with correct data and that listeners respond appropriately. `Event::fake()` intercepts event dispatching, enabling assertions on what was dispatched without executing listeners. `Event::assertDispatched()` and `assertListening()` verify dispatch contracts, while listener tests verify side effects. Event-driven architectures rely on correct event dispatch — an undetected event failure means missing side effects (notifications, logging, state changes).

# Core Concepts

- **`Event::fake()`**: Fakes the event dispatcher. Records dispatched events.
- **`Event::assertDispatched(Event::class, $callback)`**: Asserts an event was dispatched. Optional callback for event data verification.
- **`Event::assertDispatchedTimes(Event::class, $count)`**: Asserts event dispatched exactly N times.
- **`Event::assertListening(Event::class, Listener::class)`**: Asserts a specific listener is registered.
- **`Event::assertNothingDispatched()`**: Asserts no events were dispatched.
- **`Event::fakeExcept([...])`**: Fakes all events except specified ones.
- **`Event::fakeFor(fn () => ...)`**: Fakes events only within a callback scope.

# When To Use

- For every custom event in the application (verify dispatch with correct data)
- For testing listener registration (`assertListening`)
- For testing event dispatch counts (idempotency, duplicate prevention)
- For integration testing where event side effects must be prevented

# When NOT To Use

- For testing listener logic (test listeners separately)
- For testing queued listeners without also using `Queue::fake()`
- When the event dispatch is not the concern under test (don't fake events unnecessarily)

# Best Practices (WHY)

- **Always assert dispatch after `Event::fake()`**: `Event::fake()` prevents listener side effects, but without an assertion, the test passes even if no event was dispatched. The fake + assertion is the mandatory pair.
- **Test listeners separately from dispatch**: `Event::fake()` prevents listener execution. Test dispatch with fakes. Test listener logic by calling `listener->handle($event)` directly.
- **Verify event data in the callback**: `assertDispatched(fn ($event) => $event->user->id === $id)` verifies the event carries the correct payload. Don't assume the data is correct without verification.
- **Use `assertListening` for registration verification**: If a listener is not registered in `EventServiceProvider`, the event dispatches but no listener handles it. `assertListening()` catches missing registration.
- **Use `fakeFor` to scope faking**: `Event::fakeFor(fn () => ...)` ensures the fake is active only for the code under test and restored afterward. Prevents faking bleeding into other test sections.

# Architecture Guidelines

- **Fake all vs selective**: Fake all for unit-level dispatch tests. Use `fakeExcept()` for integration tests needing some listener execution.
- **Queued listeners**: Use both `Event::fake()` and `Queue::fake()` to test both dispatch and queuing of `ShouldQueue` listeners.
- **Model events**: Test Eloquent model events (created, updated, deleted) separately from custom events.

# Performance Considerations

- Fake registration: <0.5ms.
- Event dispatch via fake: <0.01ms per event (no listener execution).
- Assertion execution: <0.1ms per assertion.
- `fakeFor` scope: Negligible overhead.

# Security Considerations

- Events carrying sensitive data (user PII, payment info) should be verified for correct data (not leaking extra data) in dispatch assertions.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Faking events but not asserting dispatch | `Event::fake()` prevents side effects | Test passes even if no event was dispatched | Always assert dispatch: `Event::assertDispatched(MyEvent::class)` |
| Testing listener logic through event dispatch | Expecting fake to execute listeners | Fakes prevent listener execution; listener never runs | Test listener separately: `(new MyListener())->handle($event)` |
| Not testing queued listeners | Event dispatches with queued listener | Listener's handle() never executed; queued job never asserted | Use `Queue::fake()` in addition to verify queued dispatch |
| Not asserting event data | `assertDispatched(Event::class)` without callback | Event may have wrong data | Use callback: `fn ($e) => $e->user->id === $id` |

# Anti-Patterns

- **Fake without assertion**: `Event::fake()` at start but no `assertDispatched()`. Action may not have dispatched any event; test passes anyway.
- **Testing listener through fake**: Trying to verify listener side effects via faked event dispatch. Fakes prevent listeners from executing.
- **No data verification**: Asserting event was dispatched but never checking its properties. The event may have wrong or missing data.
- **Forgetting `fakeFor` scope**: Global `Event::fake()` bleeds into other tests. Use `fakeFor` or ensure restore in teardown.

# Examples

```php
// Dispatch assertion with data verification
public function test_user_registered_event_is_dispatched()
{
    Event::fake();

    $user = User::factory()->create();
    $this->actingAs($user)->post('/register', [...]);

    Event::assertDispatched(
        UserRegistered::class,
        fn ($event) => $event->user->id === $user->id
    );
}

// Dispatch count assertion
public function test_event_dispatched_exactly_once()
{
    Event::fake();

    $this->post('/order', ['product_id' => 1]);

    Event::assertDispatchedTimes(OrderPlaced::class, 1);
}

// Listener registration test
public function test_send_welcome_email_listener_is_registered()
{
    Event::assertListening(
        UserRegistered::class,
        SendWelcomeEmail::class
    );
}

// Selective faking
public function test_integration_with_selective_faking()
{
    Event::fakeExcept([UserRegistered::class]);

    $this->post('/register', [...]);
    // UserRegistered triggers; other events are faked
}

// Listener unit test
public function test_send_welcome_email_listener()
{
    $user = User::factory()->create();
    $event = new UserRegistered($user);
    $listener = new SendWelcomeEmail();

    Mail::fake();
    $listener->handle($event);

    Mail::assertSent(WelcomeMail::class);
}
```

# Related Topics

- **Prerequisites**: Laravel fakes, Event system fundamentals, Listener development
- **Related**: Queue/job testing, Mail/notification testing, Service container events
- **Advanced**: Event-subscriber testing, Queued listener patterns, Event sourcing basics

# AI Agent Notes

- Always test dispatch with `Event::fake()` + `assertDispatched()`. Never one without the other.
- For queued listeners (`ShouldQueue`), use `Queue::fake()` and assert the job was pushed: `Queue::assertPushed(SendWelcomeEmail::class)`.
- Test listeners by directly calling `handle($event)` — this is simpler and more reliable than trying to test through the event dispatch pipeline.

# Verification

- [ ] Every custom event has a dispatch test with `Event::fake()` + `assertDispatched()`
- [ ] Event data is verified in assertion callbacks
- [ ] Listener registration is tested with `assertListening()`
- [ ] Listeners are tested separately by calling `handle($event)` directly
- [ ] Queued listeners use `Queue::fake()` for job dispatch assertions
- [ ] `Event::fake()` is scoped properly (use `fakeFor` or ensure teardown)
- [ ] No faking without corresponding assertions
- [ ] Event dispatch counts are verified where duplicate prevention matters
