# Skill: Write a Pure Unit Test for an Action

## Purpose

Verify an action class's business logic in isolation by instantiating it with mocked dependencies, without booting the framework, database, or HTTP context.

## When To Use

- Testing any action whose dependencies can be mocked (repositories, services, gateways, loggers).
- The action's business logic (validation, computation, conditional side effects) needs precise verification.
- Fast feedback is required — sub-millisecond tests that can run on every file save.

## When NOT To Use

- The action's primary collaborator is the database and it uses Eloquent directly (use hybrid test with `DatabaseTransactions`).
- The action uses facades directly without injection (refactor the action first to use constructor injection).
- Testing an orchestrator service that composes multiple actions (use mocked sub-actions in an orchestrator test).
- Testing that the action was dispatched to the queue (use `QueueableActionFake`).

## Prerequisites

- An action class with constructor dependency injection (no facades, no static calls inside the action).
- PHPUnit or Pest test framework configured.
- Mockery or PHPUnit mocks available.
- A test file location: `tests/Unit/Actions/{Domain}/{ActionName}Test.php`.

## Inputs

- The action class file.
- The constructor signature (list of typed dependencies).
- The public method signature (parameters and return type).
- Specification of business rules to test.

## Workflow

1. **Create the test file.** Create `tests/Unit/Actions/{Domain}/{ActionName}Test.php`. Declare a test class with the same name as the action plus `Test` suffix.

2. **Identify dependencies to mock.** List all constructor parameters. Mock only expensive or unreliable dependencies: API clients, mailers, file systems, payment gateways. Use real implementations for simple dependencies: value objects, in-memory repositories, null loggers.

3. **Build mock dependencies for each test.** Create fresh mocks in each test method (or in `setUp()`). Configure expectations with `shouldReceive()`:
   ```php
   $repo = Mockery::mock(UserRepository::class);
   $repo->shouldReceive('create')
       ->once()
       ->with(Mockery::on(fn ($data) => $data['email'] === 'test@test.com'))
       ->andReturn(new User(['id' => 1, 'email' => 'test@test.com']));
   ```

4. **Instantiate the action.** Call `new ActionName($mockDep1, $realDep2)` directly. Do NOT use the container — instantiate manually with the mocked dependencies.

5. **Call the action method.** Invoke the single public method with test input data. Capture the return value.
   ```php
   $action = new RegisterUserAction($repo, new PasswordHasher());
   $user = $action->execute(new RegisterUserData(
       name: 'John',
       email: 'john@test.com',
       password: 'secret123',
   ));
   ```

6. **Assert on business outcomes.** Assert on the return value, exception, or side-effect mock verification. Name the test by business outcome, not technical operation.
   ```php
   public function test_it_registers_a_new_user(): void
   {
       // ... setup and execute ...
       $this->assertEquals('John', $user->name);
       $this->assertEquals('john@test.com', $user->email);
   }
   ```

7. **Write validation/exception tests.** Test that the action throws the correct exception for invalid inputs. Verify that mocked dependencies are NOT called when validation fails.
   ```php
   public function test_it_rejects_duplicate_emails(): void
   {
       $this->expectException(DuplicateEmailException::class);
       $repo->shouldReceive('findByEmail')->with('existing@test.com')->andReturn(new User());
       $repo->shouldReceive('create')->never();
       // ... execute ...
   }
   ```

8. **Write side-effect tests.** Verify that side-effect dependencies (mailers, event dispatchers, loggers) receive the correct calls with the correct parameters.
   ```php
   public function test_it_sends_welcome_email(): void
   {
       $mailer->shouldReceive('send')->once()->with(Mockery::type(WelcomeMail::class));
       // ... execute ...
   }
   ```

9. **Freeze time if needed.** If the action uses `now()`, `Carbon::now()`, or `Date::now()`, freeze time with `Carbon::setTestNow()` before executing the action.

## Validation Checklist

- [ ] Test class has exactly one corresponding action class (1:1 mapping)
- [ ] Test method names describe business outcomes, not technical operations
- [ ] Only expensive/unreliable dependencies are mocked (not every dependency)
- [ ] Action is instantiated manually (not through container)
- [ ] Happy path is tested
- [ ] At least one validation/exception path is tested
- [ ] At least one side-effect path is tested
- [ ] Time is frozen if the action is time-dependent
- [ ] Test runs in under 1ms
- [ ] No database, framework boot, or HTTP context

## Common Failures

- **Over-mocking.** Mocking a simple Eloquent repository or a null logger adds test brittleness. Use `InMemoryUserRepository` or `NullLogger` instead.
- **Testing through HTTP.** Calling `$this->post('/api/register')` instead of instantiating the action directly. Feature tests are 20-30x slower and couple to routing/middleware.
- **Testing implementation details.** A test named `test_it_calls_user_repository_create` breaks when the action changes its repository method name. Name by business outcome: `test_it_registers_a_new_user`.
- **No exception tests.** Only the happy path is tested. Production failures in edge cases are not caught by the test suite.
- **Shared mutable mocks.** Reusing a mock across multiple tests creates test pollution when mock expectations from one test affect another. Create fresh mocks per test or per `setUp()`.
- **Time-dependent test failures.** Using `now()` without freezing time produces non-deterministic results.

## Decision Points

- **Mock vs real implementation:** Mock API clients, mailers, file systems. Use real implementations for repositories (in-memory), loggers (NullLogger), value objects. The rule: mock expensive or non-deterministic collaborators; use real implementations for cheap, deterministic ones.
- **Data provider vs individual tests:** Use data providers when the same business rule is tested with different inputs. Use individual tests when each business rule is distinct.

## Performance Considerations

- Pure unit tests execute in 0.1-0.5ms. A full suite of 200 action tests runs in under 100ms.
- This is 200-300x faster than feature tests (each requires framework boot, ~20-30ms).

## Security Considerations

- Test authorization logic at the action level with both authorized and unauthorized inputs. This ensures authorization is enforced regardless of entry point (HTTP, CLI, queue).

## Related Rules

- Rule: Maintain 1:1 Mapping Between Action Files and Test Files (action-testing/05-rules.md)
- Rule: Name Action Tests by Business Outcome, Not Technical Operation (action-testing/05-rules.md)
- Rule: Use Pure Unit Tests as the Primary Testing Strategy (action-testing/05-rules.md)
- Rule: Limit Mocking to Expensive or Unreliable Dependencies (action-testing/05-rules.md)
- Rule: Freeze Time in Time-Dependent Action Tests (action-testing/05-rules.md)
- Rule: Test Business Rules, Not Only the Happy Path (action-testing/05-rules.md)
- Rule: Do Not Test Actions Through HTTP Feature Tests as Primary Strategy (action-testing/05-rules.md)

## Related Skills

- Test an Orchestrating Service with Mocked Sub-Actions (action-composition/06-skills.md)
- Test a Queued Action with QueueableActionFake (queued-actions/06-skills.md)

## Success Criteria

- All business rules of the action are verified in pure unit tests without framework boot.
- A change to the action's implementation (renaming a private method, changing a query) does not break tests — only behavioral changes break tests.
- The action's test file is discoverable by its path: `tests/Unit/Actions/{Domain}/{ActionName}Test.php`.
- Tests run in under 1ms each, enabling sub-second feedback during development.

---

# Skill: Test a Queued Action with QueueableActionFake

## Purpose

Verify that an action using Spatie's `QueueableAction` trait correctly dispatches sub-actions to the queue, without requiring a running queue worker or asserting on worker-side results.

## When To Use

- An action dispatches another action to the queue via `onQueue()->execute()`.
- You need to verify that the correct action class was dispatched with the correct parameters.
- Testing synchronous dispatch behavior (which actions were queued, not whether they executed on the worker).

## When NOT To Use

- Verifying worker-side execution (e.g., database changes from the queued action) — a single integration test with a real queue worker is appropriate as a supplement.
- Testing an action that does not use `QueueableAction` — use `Queue::fake()` instead.

## Prerequisites

- Spatie's `laravel-queueable-action` package installed.
- The action under test or its sub-action uses the `QueueableAction` trait.
- PHPUnit or Pest configured.

## Inputs

- The action class that dispatches queued actions.
- The sub-action class(es) being dispatched.
- The expected dispatch parameters.

## Workflow

1. **Call `QueueableActionFake::fake()` at the start of the test.** This intercepts all `onQueue()->execute()` calls and records them in memory. No queue driver is involved.

2. **Execute the action under test.** Call the action's method synchronously (as it would be called in production). The action internally calls `$this->subAction->onQueue()->execute($data)`.

3. **Assert on the dispatch.** Use `assertPushed()` to verify that the correct action class was dispatched. Assert on the parameters passed to the queued action.
   ```php
   QueueableActionFake::assertPushed(GenerateInvoiceAction::class);
   QueueableActionFake::assertPushed(function (GenerateInvoiceAction $action) use ($order) {
       return $action->orderId === $order->id;
   });
   ```

4. **Assert dispatch count.** Use `assertPushedCount()` if you need to verify that exactly N dispatches occurred:
   ```php
   QueueableActionFake::assertPushedCount(2); // Exactly 2 dispatches
   ```

5. **Assert NOT dispatched.** Use `assertNotPushed()` to verify that certain actions were NOT dispatched:
   ```php
   QueueableActionFake::assertNotPushed(SendSmsAction::class);
   ```

6. **Test conditional dispatching.** Verify that queued actions are dispatched only when conditions are met.
   ```php
   // When condition is false, the action is NOT dispatched:
   $this->createOrderAction->execute($invalidCart);
   QueueableActionFake::assertNotPushed(GenerateInvoiceAction::class);
   ```

7. **Reset fake between tests.** Call `QueueableActionFake::fake()` fresh in each test method to clear accumulated dispatches from previous tests.

## Validation Checklist

- [ ] `QueueableActionFake::fake()` is called before action execution
- [ ] Dispatch is asserted with `assertPushed()`, not by checking database state
- [ ] Parameters passed to the queued action are verified
- [ ] Conditional dispatch tests exist (action NOT dispatched when condition is false)
- [ ] No assertions on worker-side results (database changes from queued action)
- [ ] Fake is reset between tests

## Common Failures

- **Asserting on database changes to verify dispatch.** `$this->assertDatabaseHas('invoices', [...])` assumes the queued action has already executed. Without a queue worker, the action was never processed. Always assert on the dispatch itself.
- **Not faking before execution.** If the action dispatches before `QueueableActionFake::fake()` is called, the dispatch goes to the real queue driver. Call `fake()` at the very start of the test.
- **Not verifying parameters.** `assertPushed(GenerateInvoiceAction::class)` without a closure verifies dispatch but not the correctness of the dispatched data. Always verify parameters.
- **Testing worker-side behavior with the fake.** The fake intercepts the dispatch — it does not execute the action. Worker-side logic (database writes, API calls) is never executed. Test that separately with an integration test.

## Decision Points

- **`QueueableActionFake` vs `Queue::fake()`:** `QueueableActionFake` is specific to Spatie's `QueueableAction` trait and intercepts `onQueue()->execute()` calls. `Queue::fake()` is Laravel's built-in queue fake for job classes. Use the one that matches your dispatch mechanism.

## Performance Considerations

- `QueueableActionFake` stores dispatches in memory. No network calls, no queue driver setup. Tests run in <1ms.
- No queue worker is needed — the test does not wait for job execution.

## Security Considerations

- Testing queued action dispatch does not verify that authorization is re-checked on the worker. Add a separate integration test for worker-side authorization.

## Related Rules

- Rule: Use QueueableActionFake for Queued Action Dispatching Tests (action-testing/05-rules.md)
- Rule: Do Not Test Actions Through HTTP Feature Tests as Primary Strategy (action-testing/05-rules.md)

## Related Skills

- Make an Action Queueable with Spatie QueueableAction (queued-actions/06-skills.md)
- Write a Pure Unit Test for an Action (action-testing/06-skills.md)

## Success Criteria

- The test verifies that the correct action is dispatched to the queue with the correct parameters.
- The test does not require a running queue worker.
- The test runs in under 1ms.
- A change to the queued action's parameter shape (adding/removing fields) causes the test to fail, catching dispatch contract violations.
