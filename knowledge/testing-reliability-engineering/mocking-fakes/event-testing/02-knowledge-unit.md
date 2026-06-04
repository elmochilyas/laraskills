# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Event Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Event testing verifies that events are dispatched with correct data and that listeners respond appropriately. `Event::fake()` intercepts event dispatching, enabling assertions on what was dispatched without executing listeners. `Event::assertDispatched()` and `assertListening()` verify dispatch contracts, while listener tests verify side effects. Event-driven architectures rely on correct event dispatch—an undetected event failure means missing side effects (notifications, logging, state changes).

# Core Concepts
- **`Event::fake()`**: Fakes the event dispatcher. Records dispatched events. Assert with `assertDispatched()`, `assertNotDispatched()`.
- **`Event::assertDispatched(Event::class, $callback)`**: Asserts an event was dispatched. Optional callback for event data verification.
- **`Event::assertDispatchedTimes(Event::class, $count)`**: Asserts event dispatched exactly N times.
- **`Event::assertListening(Event::class, Listener::class)`**: Asserts a specific listener is registered for an event.
- **`Event::assertNothingDispatched()`**: Asserts no events were dispatched.
- **`Event::fakeExcept([...])`**: Fakes all events except specified ones. Real listeners execute for exceptions.
- **`Event::fakeFor(fn () => ...)`**: Fakes events only within a callback scope.
- **Event class inspection**: Inspect event public properties to verify data.

# Mental Models
- **Event fake as event inbox**: Every dispatched event is recorded. Assertions search the inbox.
- **Event as notification of past action**: Events announce that something happened. The event object carries data about the past action.
- **Listener as side-effect handler**: Listeners perform side effects (logging, notification, sync). They should be tested separately from dispatch.
- **Fake prevents side effects**: `Event::fake()` stops listeners from executing. This prevents side effects and isolates the dispatch test.

# Internal Mechanics
- **`EventFake::dispatch()`**: Implements `Dispatcher::dispatch()`. Stores the event object in an internal array by event class.
- **`assertDispatched($event, $callback)`**: Filters by event class. Applies callback to each match. Asserts at least one match.
- **`assertListening()`**: Reads `EventServiceProvider` mapping. Verifies the event-listener pair is registered.
- **`fakeExcept()`**: Wraps specified events in a fake bypass. Other events go through the real dispatcher.
- **`fakeFor()`**: Creates a scope with a fake dispatcher. When the closure completes, restores the real dispatcher.
- **Event class properties**: Events typically have public properties. Access in assertion callbacks: `fn ($event) => $event->user->id === $id`.

# Patterns
- **Pattern: Dispatch assertion**
  - Purpose: Verify an event was dispatched with correct data
  - Benefits: Tests communication contract between components
  - Tradeoffs: Doesn't test listener execution
  - Implementation: `Event::fake(); $this->performAction(); Event::assertDispatched(UserRegistered::class, fn ($e) => $e->user->id === $user->id)`

- **Pattern: Dispatch count assertion**
  - Purpose: Verify event dispatched exactly N times (not more, not less)
  - Benefits: Prevents duplicate dispatch bugs
  - Tradeoffs: Brittle count if dispatch logic changes
  - Implementation: `Event::assertDispatchedTimes(UserRegistered::class, 1)`

- **Pattern: Listener registration test**
  - Purpose: Verify the event-listener mapping is registered
  - Benefits: Catches missing listener registration
  - Tradeoffs: Only tests registration, not listener logic
  - Implementation: `Event::assertListening(UserRegistered::class, SendWelcomeEmail::class)`

- **Pattern: Selective faking for integration testing**
  - Purpose: Fake some events while allowing others to execute
  - Benefits: Mix of isolation and integration in one test
  - Tradeoffs: Must know which events have side effects
  - Implementation: `Event::fakeExcept([UserRegistered::class]); // UserRegistered triggers; other events are faked`

# Architectural Decisions
- **`Event::fake()` all vs selective**: Fake all for unit-level dispatch tests. Use `fakeExcept()` for integration tests that need some listener execution.
- **Model event testing**: For Eloquent model events (created, updated, deleted), use `Event::fake()` with `Model::boot()` calls or test model events separately.
- **Queued listeners vs sync**: Queued listeners dispatch jobs. Test both the event dispatch and the queued job dispatch.
- **Event data verification**: Verify event properties in the `assertDispatched` callback. Don't verify data after dispatch (listener may have already processed it).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `Event::fake()` prevents listener side effects | Listeners never execute; their code is untested | Layer listener unit tests |
| `assertDispatched` with callback is precise | Callback can be complex for data-rich events | Keep callback focused on 1-2 assertions |
| `assertListening` catches registration bugs | Only checks registration, not listener behavior | Supplement with listener execution tests |
| `fakeExcept()` enables partial integration | Knowing which events to except is complex | Document event side effects per feature |

# Performance Considerations
- Fake registration: <0.5ms.
- Event dispatch via fake: <0.01ms per event (no listener execution).
- Assertion execution: <0.1ms per assertion.
- `fakeExcept()`: Scope setup overhead. Negligible.
- `fakeFor()`: Callable scope overhead. Negligible.

# Production Considerations
- **Event coverage**: Every custom event should have a dispatch test. Failure to dispatch events means missing side effects.
- **Queued listeners**: Listeners implementing `ShouldQueue` need separate job testing. Verify both dispatch and queuing.
- **Event contract stability**: Event properties form a contract with listeners. Changing properties may break listeners. Test both sides.
- **Wildcard listeners**: Listeners registered with `Event::listen('event.*')` catch multiple events. Test that wildcard pattern matches expected events.

# Common Mistakes
- **Mistake: Faking events but not asserting dispatch**
  - Why: `Event::fake()` prevents side effects
  - Why harmful: Test passes even if no event was dispatched (missing functionality)
  - Better: Always assert the event was dispatched: `Event::assertDispatched(MyEvent::class)`

- **Mistake: Testing listener logic through event dispatch**
  - Why: Expecting `Event::fake()` to execute listeners
  - Why harmful: Fakes prevent listener execution; listener never runs
  - Better: Test listener separately: `(new MyListener())->handle($event)`

- **Mistake: Not testing queued listeners**
  - Why: Event dispatches have a queued listener
  - Why harmful: Listener's handle() is never executed; queued job is never asserted
  - Better: Use `Queue::fake()` in addition to `Event::fake()` to verify queued listener dispatch

- **Mistake: Forgetting to restore Event fake**
  - Why: `Event::fake()` persists across tests
  - Why harmful: Subsequent tests may have faked events unintentionally
  - Better: Pest auto-restores; PHPUnit needs `tearDown()` or use `Event::fakeFor()`

# Failure Modes
- **Event not dispatched**: Action didn't trigger event. `assertDispatched` fails. Check that event was `dispatch()`ed in the code.
- **Listener not registered**: `EventServiceProvider` missing mapping. `assertListening` catches this.
- **Event data mismatch**: Event properties don't match the callback expectation. Check event constructor arguments.
- **`fakeFor` scope boundary**: Event dispatched outside the `fakeFor` closure uses the real dispatcher. Ensure the action under test is inside the closure.

# Ecosystem Usage
- **Laravel core**: Auth events (Login, Logout, Registered) are tested with `Event::fake()`.
- **Laravel Spark**: Team events (TeamCreated, TeamMemberAdded) use `Event::fake()` for dispatch testing.
- **Laravel Cashier**: Billing events (SubscriptionCreated, PaymentSucceeded) are dispatched and tested via fakes.
- **Laravel Horizon**: Horizon's event system (LongWaitDetected, MasterSupervisorOutOfMemory) uses fakes for dispatch tests.

# Related Knowledge Units
- **Prerequisites**: Laravel fakes, Event system fundamentals, Listener development
- **Related Topics**: Queue/job testing, Mail/notification testing, Service container events
- **Advanced Follow-up**: Event-subscriber testing, Queued listener patterns, Event sourcing basics

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
