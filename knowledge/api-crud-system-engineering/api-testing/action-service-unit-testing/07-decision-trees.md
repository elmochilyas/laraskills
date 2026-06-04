# Decision Trees — Action / Service Unit Testing

## Tree 1: Mock Boundary Strategy

**Decision Context**: Which dependencies to mock in action/service tests — all dependencies vs repository boundaries only vs selective mocking.

**Decision Criteria**:
- Dependency ownership (your interfaces vs third-party)
- Test reliability requirements
- Business logic complexity

**Decision Tree**:
```
Does the action use repository interfaces you own?
├── YES → Mock all repository interfaces; use real implementations for value objects (DTOs, collections)
└── NO → Does the action use Eloquent models directly?
    ├── YES → Use RefreshDatabase + real models (mocking Eloquent is fragile and couples to implementation)
    └── NO → Does the action call external services (HTTP APIs, SDKs)?
        ├── YES → Mock the HTTP client or service interface; use Http::fake() for HTTP calls
        └── NO → Mock at the nearest abstraction boundary; prefer fakes over mocks
```

**Rationale**: Mock at boundaries you own. Use real implementations for Eloquent (via database) and value objects. Mock external services at their interface.

**Recommended Default**: Mock repository interfaces; real database for Eloquent; Http::fake() for external calls.

**Risks**: Mocking concrete classes instead of interfaces creates brittle tests that break during refactoring.

---

## Tree 2: Event and Bus Assertion Strategy

**Decision Context**: How to verify side effects (events, jobs) in service tests — Event::fake(), Bus::fake(), or Mail::fake().

**Decision Criteria**:
- Side effect type (event, job, mail, notification)
- Dispatch timing (sync vs queue)
- Assertion granularity

**Decision Tree**:
```
Does the action dispatch events or jobs?
├── YES → Use Event::fake() or Bus::fake() before the action; assertDispatch after
│   Do you need to assert event data (payload)?
│   ├── YES → Event::assertDispatched(PostCreated::class, fn($event) => $event->postId === 1)
│   └── NO → Event::assertDispatched(PostCreated::class) — existence only
└── NO → Does the action send mail or notifications?
    ├── YES → Mail::fake() or Notification::fake(); assertSentTo with expected recipients
    └── NO → No side effect assertions needed; test return value only
```

**Rationale**: Fakes capture dispatched events/jobs without executing their handlers. Asserting the event was dispatched with correct data verifies the action's side effects without triggering downstream logic.

**Recommended Default**: `Event::fake()` + `Event::assertDispatched()` with event data assertions.

**Risks**: Not asserting event dispatch means the action may silently fail to trigger important side effects (email, webhook, audit log).
