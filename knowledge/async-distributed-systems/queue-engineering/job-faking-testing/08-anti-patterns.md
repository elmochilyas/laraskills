# Anti-Patterns: Job Faking and Testing

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K088 — Job Faking and Testing |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Asserting Without Faking | Testing | Critical |
| 2 | Testing Job Logic with Queue::fake() Active | Testing | Critical |
| 3 | Class-Name-Only Assertions Without Callbacks | Testing | High |
| 4 | Missing Bus::fake() for Batch Assertions | Testing | High |
| 5 | Leaky Fake State Across Tests | Testing | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Integration Tests for Serialization | job-faking-testing, job-serialization-payload-envelope | High |
| Closures Asserted with assertPushed(Closure::class) | job-faking-testing, closures-as-queued-jobs | Medium |
| Missing Queue Routing Assertions | job-faking-testing, queue-connections-vs-queues | Medium |

---

## Anti-Pattern 1: Asserting Without Faking

### Category
Testing — False Negatives

### Description
Calling `Queue::assertPushed()` or similar assertions without first calling `Queue::fake()`. Jobs dispatched go to the real queue backend — the fake never captures them, so assertions miss dispatched jobs.

### Why It Happens
Tests are written incrementally. The `Queue::fake()` call is forgotten when adding dispatch assertions to an existing test. The test may pass because no assertion failure is triggered — but it passes vacuously, not because the assertion is satisfied.

### Warning Signs
- `Queue::assertPushed()` appears in test without preceding `Queue::fake()`
- Assertions pass even after removing or changing the dispatch logic
- Tests work in development with `QUEUE_CONNECTION=sync` but fail in CI with real queue
- No error when the test runs — the assertion simply never fires

### Why Harmful
False confidence in test coverage. The test appears to verify dispatch behavior but never actually checks it. A regression that removes a critical dispatch goes undetected.

### Real-World Consequences
A team refactors order processing and accidentally removes the `ProcessOrder::dispatch()` call. All tests pass because `Queue::fake()` is missing from every dispatch assertion — the assertions literally check nothing. In production, orders are never processed. The issue is discovered 3 days later when support receives customer complaints about unfulfilled orders.

### Preferred Alternative
Always call `Queue::fake()` before the action under test in every test that asserts dispatch behavior.

### Refactoring Strategy
1. Add `Queue::fake()` at the start of every test method that calls `Queue::assertPushed()` or similar
2. For shared test base classes, add `Queue::fake()` in `setUp()` if all tests in the class assert dispatch
3. Move `Queue::fake()` calls to test helper methods for consistency
4. Run tests after removing a dispatch to verify the assertion fails correctly

### Detection Checklist
- [ ] `Queue::assertPushed()` without preceding `Queue::fake()`
- [ ] Assertions pass after removing dispatch logic
- [ ] Tests not run with `QUEUE_CONNECTION=database` in CI
- [ ] No test helper standardizing fake setup

### Related Rules/Skills/Decision Trees
- **Rule 1**: queue-fake-before-action (`05-rules.md`)
- **Decision 1**: Queue::fake() vs Real Queue in Tests (`07-decision-trees.md`)
- **Skill 1**: Test Job Dispatch Behavior with Queue::fake() (`06-skills.md`)

---

## Anti-Pattern 2: Testing Job Logic with Queue::fake() Active

### Category
Testing — False Positives

### Description
Using `Queue::fake()` in a test that intends to verify job execution behavior. Since `Queue::fake()` blocks job execution, the job never runs — the test passes vacuously without actually testing the job's `handle()` method.

### Why It Happens
Developers combine dispatch verification and logic verification in the same test. After asserting `assertPushed()`, they assume the job executed and assert on its side effects — but those side effects never happened because the fake blocked execution.

### Warning Signs
- Test calls `Queue::fake()` then asserts on side effects that the job would produce
- Job side effect assertions pass even after job `handle()` is broken
- No `dispatchSync()` call or direct `$job->handle()` invocation in the test
- Test asserts both dispatch behavior AND job execution outcome

### Why Harmful
The job's business logic is completely untested. Errors in `handle()` are not caught until production. The developer has false confidence that the job works correctly.

### Real-World Consequences
A team writes a test with `Queue::fake()` that asserts `OrderConfirmationMail::assertPushed()`. They also assert "email was sent" by checking the mail log — but with `Queue::fake()`, mail was never sent. The test passes because the assertion checks a stale state. In production, the mail job throws an exception due to a bug in `handle()`, and customers don't receive order confirmations for 2 weeks.

### Preferred Alternative
Test dispatch behavior with `Queue::fake()`. Test job logic separately using `dispatchSync()` or direct `$job->handle()` calls.

### Refactoring Strategy
1. Split the test: one test for dispatch behavior (with `Queue::fake()`), one for job logic (no fake, use `dispatchSync()`)
2. In the logic test, construct the job and call `$job->handle()` directly
3. Assert on the side effects of `handle()` (DB records, mail assertions, etc.)
4. Remove `Queue::fake()` from the logic test

### Detection Checklist
- [ ] `Queue::fake()` active while asserting job side effects
- [ ] Job logic test passes after breaking `handle()`
- [ ] No direct `$job->handle()` or `dispatchSync()` call
- [ ] Single test mixes dispatch and execution assertions

### Related Rules/Skills/Decision Trees
- **Rule 3**: never-test-logic-with-fake (`05-rules.md`)
- **Decision 2**: Unit Test vs Integration Test for Jobs (`07-decision-trees.md`)
- **Skill 1**: Test Job Dispatch Behavior with Queue::fake() (`06-skills.md`)

---

## Anti-Pattern 3: Class-Name-Only Assertions Without Callbacks

### Category
Testing — Low Precision

### Description
Using `Queue::assertPushed(JobClass::class)` without a callback assertion. This verifies that SOME instance of the job class was dispatched, but does not verify the job's data — missing cases where the wrong data (e.g., wrong order ID) is dispatched.

### Why It Happens
Developers are unaware of the callback assertion syntax. Class-name assertions are simpler to write and pass trivially. The test "passes" even with data bugs in dispatch logic.

### Warning Signs
- All `Queue::assertPushed()` calls use class-name-only syntax
- Tests pass after swapping different order IDs or user IDs
- No callback assertions that verify job constructor properties
- Data-specific bugs in dispatch logic not caught by tests

### Why Harmful
A job may be dispatched with the wrong data — wrong order ID, wrong user ID, wrong amount — but the test passes because the class name is correct. The error surfaces in production where a customer receives a notification about someone else's order.

### Real-World Consequences
A team has `Queue::assertPushed(ProcessOrder::class)` in their dispatch test. A bug causes `ProcessOrder::dispatch($wrongOrder)` to be called instead of `ProcessOrder::dispatch($order)` — the wrong order is processed. The test passes because the class matches. In production, customers are charged incorrect amounts, and a full audit is required to reverse the charges.

### Preferred Alternative
Use callback assertions to verify job data properties: `Queue::assertPushed(fn (ProcessOrder $job) => $job->orderId === $expectedOrder->id)`.

### Refactoring Strategy
1. Identify all `assertPushed()` calls that only check the class name
2. Add callback assertions for each: `assertPushed(fn ($job) => $job->id === $expected->id)`
3. For jobs with multiple significant properties, assert each property in the callback
4. Run tests after modifying dispatch data to verify the assertion catches it

### Detection Checklist
- [ ] All `assertPushed()` calls use class-name-only
- [ ] No callback assertions checking job properties
- [ ] Data-specific dispatch bugs not caught by tests
- [ ] Tests pass after changing dispatched data values

### Related Rules/Skills/Decision Trees
- **Rule 2**: prefer-callback-assertions (`05-rules.md`)
- **Decision 1**: Queue::fake() vs Real Queue in Tests (`07-decision-trees.md`)

---

## Anti-Pattern 4: Missing Bus::fake() for Batch Assertions

### Category
Testing — False Negatives

### Description
Using `Queue::fake()` instead of `Bus::fake()` when testing batch or chain dispatches. `Queue::fake()` only captures individual job dispatches — batch and chain dispatches use a different path through `BusFake` and are not captured.

### Why It Happens
Developers are familiar with `Queue::fake()` and apply it to all queue-related tests without understanding that batches use a separate dispatch path. The batch dispatch succeeds but is not captured — assertions fail with confusing "not pushed" messages.

### Warning Signs
- `Bus::batch()` or `Bus::chain()` tested with `Queue::fake()`
- `Bus::assertBatchDispatched()` assertion is missing or placed after `Queue::fake()`
- Tests for batch/chain dispatch fail with confusing "not pushed" errors
- Developer adds `Bus::fake()` only after test debugging, not from the start

### Why Harmful
Batch and chain dispatch logic is untested. A regression that changes the batch composition (wrong jobs in batch, missing callbacks) goes undetected.

### Real-World Consequences
A team changes the composition of a batch of jobs for order processing — accidentally removing a critical job from the batch. The test uses `Queue::fake()` so the batch assertion passes vacuously. In production, a job in the chain is never dispatched, and the order pipeline stalls. The issue is caught 2 hours later when the monitoring dashboard shows stuck orders.

### Preferred Alternative
Always use `Bus::fake()` when testing batch and chain dispatches.

### Refactoring Strategy
1. Replace `Queue::fake()` with `Bus::fake()` in batch/chain tests
2. Use `Bus::assertBatchDispatched()` for batch structure assertions
3. Test individual job dispatches within batches separately with `Queue::fake()`
4. If both individual and batch assertions are needed, use both `Queue::fake()` and `Bus::fake()`

### Detection Checklist
- [ ] `Bus::batch()` or `Bus::chain()` tested with `Queue::fake()` only
- [ ] No `Bus::fake()` call in batch/chain tests
- [ ] `Bus::assertBatchDispatched()` not used
- [ ] Batch structure bugs not caught by tests

### Related Rules/Skills/Decision Trees
- **Rule 4**: use-bus-fake-for-batches (`05-rules.md`)
- **Decision 3**: Bus::fake() vs Queue::fake() Selection (`07-decision-trees.md`)

---

## Anti-Pattern 5: Leaky Fake State Across Tests

### Category
Testing — Test Pollution

### Description
Not cleaning up `QueueFake` state between tests. The fake accumulates all dispatched jobs in memory across test methods — a later test sees jobs from an earlier test, causing false-positive assertions.

### Why It Happens
Developers create a `Queue::fake()` in individual test methods but forget to reset the fake state. PHPUnit's shared application instance retains the fake binding across tests within the same class.

### Warning Signs
- Tests depend on test execution order (pass when run individually, fail in a suite)
- Jobs from earlier tests appear in later test assertions
- `Queue::assertCount()` returns more jobs than expected
- No `tearDown()` cleanup for queue fake state
- Intermittent test failures that resolve when tests run in isolation

### Why Harmful
Flaky tests erode trust in the test suite. Developers start ignoring test failures, and real regressions slip through.

### Real-World Consequences
A developer adds a test that asserts `Queue::assertPushed(OrderMail::class)`. The test passes because a previous test dispatched the same job — the current test's action didn't dispatch it at all. A bug removes the mail dispatch in production, but the test still passes. Customers stop receiving order confirmations for 2 days before the issue is discovered.

### Preferred Alternative
Clean up fake state between tests in `tearDown()` or `setUp()`.

### Refactoring Strategy
1. Add `$this->app->forgetInstance('queue')` in `tearDown()`
2. Or call `Queue::fake()` fresh in `setUp()` for each test
3. For Pest, use `beforeEach(fn () => Queue::fake())` and `afterEach(fn () => ...)`
4. Run tests in random order to verify no inter-test pollution
5. Monitor for test order dependency

### Detection Checklist
- [ ] No fake cleanup in `tearDown()`
- [ ] Tests pass in order but fail in isolation
- [ ] `assertCount()` returns unexpected totals
- [ ] Jobs from unrelated tests appear in assertions

### Related Rules/Skills/Decision Trees
- **Rule 5**: cleanup-fakes-between-tests (`05-rules.md`)
- **Decision 2**: Unit Test vs Integration Test for Jobs (`07-decision-trees.md`)
