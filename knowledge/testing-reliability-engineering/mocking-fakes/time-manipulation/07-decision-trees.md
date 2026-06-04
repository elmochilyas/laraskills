# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Time Manipulation

---

### Tree 1: Which Time Manipulation Method to Use

```mermaid
flowchart TD
    A[Choose time manipulation approach] --> B{What do you need<br>to express?}
    B -->|Current time is irrelevant| C[freezeTime — prevent flakiness]
    B -->|Relative offset from now| D[travel(N)->unit — e.g., travel(5)->days]
    B -->|Specific date/time| E[travelTo('2026-01-01 12:00:00')]
    B -->|Multiple time steps in one test| F[freezeTime + multiple travel/assert cycles]
    C --> G[Call at start of test — prevents midnight/DST flakiness]
    D --> H[Clear intent: "advance 5 days from current"]
    E --> I[Best for boundary testing: midnight, month-end, leap year]
    F --> J[freezeTime → travel → assert → travel → assert]
    B --> K{Microsecond ordering<br>matters?}
    K -->|Yes| L[Use freezeSecond instead of freezeTime]
    K -->|No| M[freezeTime is sufficient]
```

**Key decision points:**
- **Prevent flakiness**: `freezeTime()` at test start prevents date boundary failures (midnight, DST).
- **Relative vs absolute**: `travel()` for "5 days from now." `travelTo()` for specific calendar scenarios.
- **Microsecond ordering**: `freezeTime()` gives same microsecond to all events. `freezeSecond()` allows microsecond progression.

---

### Tree 2: Time Reset Strategy

```mermaid
flowchart TD
    A[Plan time reset] --> B{What test framework<br>are you using?}
    B -->|Pest| C[Automatic reset after each test — travelBack called by framework]
    B -->|PHPUnit| D[Must manually reset in tearDown]
    D --> E[Call Carbon::setTestNow(null) in tearDown]
    E --> F{Test group uses time<br>manipulation?}
    F -->|Yes — dedicated test class| G[Add tearDown to that class]
    F -->|No — mixed| H[Add tearDown to base TestCase once]
    C --> I[Verify: check framework resets after each test]
    A --> J{Does this test modify<br>time?}
    J -->|Yes| K[Ensure reset happens]
    J -->|No| L[No reset needed — but freezeTime doesn't require reset]
    K --> M[Without reset → frozen time leaks → flaky failures in next tests]
```

**Key decision points:**
- **Pest vs PHPUnit**: Pest auto-resets time. PHPUnit requires manual `Carbon::setTestNow(null)` in `tearDown()`.
- **Safety**: Always reset — even one test forgetting causes hard-to-debug cascading failures.

---

### Tree 3: Database Timestamps — How to Handle with Frozen Time

```mermaid
flowchart TD
    A[Handle DB timestamps with frozen time] --> B{How are timestamps<br>set in the migration?}
    B -->|useCurrent or CURRENT_TIMESTAMP| C[NOT affected by Carbon::setTestNow]
    B -->|Eloquent $timestamps / Carbon values| D[Affected by Carbon::setTestNow]
    C --> E[Pass explicit values in factory/creation]
    E --> F[User::factory()->create(['created_at' => now()])]
    D --> G[Timestamps respect frozen time automatically]
    F --> H{Asserting on DB<br>timestamp?}
    G --> H
    H -->|Yes| I[Compare against now() or frozen reference]
    H -->|No| J[No special handling needed]
    A --> K{Relying on DB default<br>timestamp?}
    K -->|Yes| L[Replace with explicit Carbon value — always]
    K -->|No| M[Current approach is fine]
```

**Key decision points:**
- **`useCurrent` vs Carbon**: Database `CURRENT_TIMESTAMP` defaults are NOT affected by `Carbon::setTestNow()`. Always pass explicit values.
- **Explicit > implicit**: Factory definitions should use `now()` for timestamps to respect time freezing.

---

### Tree 4: Testing Time-Dependent Business Logic

```mermaid
flowchart TD
    A[Test time-dependent logic] --> B{What type of time<br>logic?}
    B -->|Expiration| C[Create record just before expiry → travel past expiry → assert expired]
    B -->|Rate limiting| D[Make requests up to limit → assert blocked → travel past window → assert allowed]
    B -->|Scheduled task| E[Freeze at task time → run command → assert side effects]
    B -->|Boundary condition| F[Test both sides of boundary: just before and just after]
    C --> G[Test: not expired → travel → expired]
    D --> H[Test: within limit → at limit → after window reset]
    E --> I[Test: task runs at correct time; doesn't run at wrong time]
    F --> J[Test: 23:59:59 vs 00:00:00, 2026-01-31 vs 2026-02-01]
    B --> K{Does logic use<br>Carbon::now()?}
    K -->|Yes| L[Time manipulation works]
    K -->|No — uses time() or date()| M[Cannot test with time manipulation — refactor to Carbon::now()]
```

**Key decision points:**
- **Boundary testing**: Always test both sides of time boundaries (before/after expiration, before/after rate limit reset).
- **Carbon vs raw PHP**: Code using `time()` or `date()` cannot be tested with time manipulation. Refactor to `Carbon::now()`.
