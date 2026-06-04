# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Event Testing

---

### Tree 1: How to Structure Event Tests

```mermaid
flowchart TD
    A[Write event test] --> B{What are you<br>testing?}
    B -->|Event dispatch| C[Use Event::fake + assertDispatched]
    B -->|Listener logic| D[Call listener->handle($event) directly]
    B -->|Listener registration| E[Use Event::assertListening]
    C --> F{Does the event carry<br>data?}
    F -->|Yes| G[Add callback: assertDispatched(fn ($e) => $e->property === expected)]
    F -->|No| H[assertDispatched(Event::class) is sufficient]
    D --> I{Fake dependencies<br>inside listener}
    I --> J[Mail::fake, Queue::fake, etc. before calling handle()]
    E --> K[Assert listener is registered in EventServiceProvider]
```

**Key decision points:**
- **Dispatch vs listener vs registration**: Use `Event::fake()` for dispatch (tests events fire). Call `handle()` directly for listener logic (tests side effects). Use `assertListening()` for registration (tests wiring).
- **Data verification**: Events carrying data need callback assertions. Events without data need only class assertion.
- **Listener dependencies**: Fake external services in the listener test before calling `handle()`.

---

### Tree 2: Full vs Selective Event Faking

```mermaid
flowchart TD
    A[Choose faking strategy] --> B{Are some listeners<br>needed for the test?}
    B -->|No — unit test| C[Use Event::fake() with no arguments]
    B -->|Yes — integration test| D{Which events should<br>execute?}
    D -->|Only one or two| E[Use Event::fakeExcept([CriticalEvent::class])]
    D -->|Most should execute| F[Use Event::fake([EventToFake::class])]
    C --> G[All listeners blocked; assert dispatch only]
    E --> H[CriticalEvent listener runs; all others faked]
    F --> I[Only listed events faked; all others execute normally]
    G --> J{Scope correctly?}
    H --> J
    I --> J
    J -->|Yes| K[Use fakeFor(callable) for scoped faking]
    J -->|No| L[Fake bleeds into other tests — use setUp/tearDown]
```

**Key decision points:**
- **Unit vs integration**: Unit tests fake all events. Integration tests may need selective faking with `fakeExcept()` or targeted `fake()`.
- **Scope**: Use `fakeFor()` to limit fake duration. Prevent faking from bleeding into other tests.

---

### Tree 3: Queued Listener — What to Fake

```mermaid
flowchart TD
    A[Test queued listener] --> B{What exactly needs<br>verification?}
    B -->|Event was dispatched| C[Event::assertDispatched(Event::class)]
    B -->|Listener job was queued| D[Queue::assertPushed(Listener::class)]
    B -->|Listener handles correctly| E[Call listener->handle($event) — test directly]
    C --> F{Are both needed?}
    D --> F
    F -->|Yes| G[Event::fake + Queue::fake + listener handle test]
    F -->|No| H{Which one?}
    H -->|Dispatch only| I[Event::fake + assertDispatched + Queue::assertPushed]
    H -->|Execution only| J[Call handle() directly without faking event]
```

**Key decision points:**
- **Three layers to test**: Event dispatch, queue push, and listener execution. Choose based on what you're verifying.
- **Both fakes needed**: When testing the dispatch path, use both `Event::fake()` and `Queue::fake()` to verify both the event and the queued job.

---

### Tree 4: How Many Assertions Are Enough

```mermaid
flowchart TD
    A[Determine assertion coverage] --> B{How many events<br>should be dispatched?}
    B -->|One| C[Single assertDispatched + optional data callback]
    B -->|Multiple| D{Should any events NOT<br>have been dispatched?}
    D -->|Yes| E[assertNotDispatched for prohibited events]
    D -->|No| F[assertDispatched for each expected event]
    C --> G{Duplicate prevention<br>important?}
    E --> G
    F --> G
    G -->|Yes| H[Add assertDispatchedTimes(Event::class, 1)]
    G -->|No| I[Single assertDispatched is sufficient]
    H --> J{Event carries no data?}
    I --> J
    J -->|No data| K[Assertions complete]
    J -->|Has data| L[Add callback assertions for each data property]
```

**Key decision points:**
- **Positive + negative assertions**: Assert expected events fire AND unexpected events don't fire.
- **Count assertions**: Use `assertDispatchedTimes()` when duplicate dispatch would be a bug.
- **Data callbacks**: Add when events carry payload that must be correct.
