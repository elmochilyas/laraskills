# Skill: Compose Actions into a Workflow

## Purpose

Combine multiple single-responsibility action classes into a cohesive business workflow where data flows through explicit return values and sub-actions are independently testable.

## When To Use

- A business operation can be decomposed into 2-3 independently testable sub-operations.
- The sub-operations are useful in other workflows or entry points.
- You need to keep each operation's test isolation while coordinating execution order.

## When NOT To Use

- The workflow requires 4+ action dependencies — extract to a Service class instead.
- Sub-actions share mutable state — refactor to pass data through return values first.
- The composed actions manage their own transactions — the orchestrator must own the transaction boundary.
- The workflow has circular dependencies between actions — break the cycle by extracting shared logic.
- The workflow is a simple linear sequence of method calls on the same entity — a service method suffices.

## Prerequisites

- Two or more existing action classes that follow the single-public-method convention.
- Understanding of the service container's recursive resolution.
- A clear understanding of the execution order and data flow between sub-actions.

## Inputs

- The action classes to compose.
- A specification of execution order and data dependencies between sub-actions.
- The transaction boundary requirement (is the composition inside a transaction?).

## Workflow

1. **Identify the orchestrating action.** Create a new action class that represents the composed workflow (e.g., `PlaceOrderAction` that composes `ReserveInventoryAction`, `ChargePaymentAction`, `CreateOrderAction`). Name it after the top-level operation.

2. **Inject sub-actions via constructor.** Add each sub-action as a typed constructor property. Limit to 3 action dependencies — at 4+, extract to a Service class instead.
   ```php
   final readonly class PlaceOrderAction
   {
       public function __construct(
           private ReserveInventoryAction $reserveInventory,
           private ChargePaymentAction $chargePayment,
           private CreateOrderAction $createOrder,
       ) {}
   }
   ```

3. **Write the orchestrating method.** In the single public method, call sub-actions in explicit sequence. Capture return values and pass data explicitly — never rely on shared state.
   ```php
   public function handle(PlaceOrderData $data): Order
   {
       $this->reserveInventory->handle($data->items);
       $payment = $this->chargePayment->handle($data->payment);
       return $this->createOrder->handle($data, $payment);
   }
   ```

4. **Pass data through return values.** Sub-action A should not write to a shared service that sub-action B reads. Pass A's result as a parameter to B. This eliminates temporal coupling.

5. **Verify no shared mutable state.** Check that no sub-action writes to a singleton service that another sub-action reads. If two sub-actions use the same singleton mutable service, refactor to pass data through return values instead.

6. **Verify no transaction ownership in sub-actions.** Check that no sub-action calls `DB::transaction()`, `DB::beginTransaction()`, etc. The orchestrator (or its caller) owns the transaction boundary. Sub-actions must be transaction-agnostic.

7. **Document the composition chain.** Add a comment in the orchestrating method documenting the calling order and data flow: "Step 1: reserve inventory. Step 2: charge payment. Step 3: create order."

8. **Write tests for each sub-action independently.** Each sub-action has its own test class with mocked collaborators. Do not test sub-action logic through the orchestrator's tests.

9. **Write orchestrator tests with mocked sub-actions.** In the orchestrator's test class, mock all sub-actions. Use `ordered()` expectations to verify call sequence. Assert on data flow between sub-actions.

## Validation Checklist

- [ ] Orchestrating action has at most 3 action constructor dependencies
- [ ] Sub-action execution order is explicit in the method body (not implied by constructor order)
- [ ] Data flows between sub-actions through return values, not shared mutable state
- [ ] No sub-action manages its own transaction
- [ ] No circular dependencies exist between composed actions
- [ ] Composition chain is documented with a comment in the orchestrating method
- [ ] Each sub-action has its own independent test class
- [ ] Orchestrator tests use mocked sub-actions with ordered expectations

## Common Failures

- **Action with 4+ action dependencies.** The class has crossed from composition to orchestration. Extract to a Service class.
- **Implicit execution order.** Developer relies on constructor parameter order to imply execution order. Constructor order has no semantic meaning — always sequence calls explicitly in the method.
- **Shared mutable state.** Sub-action A sets state on a singleton that sub-action B reads. Creates hidden temporal coupling. Pass data through return values instead.
- **Circular dependency.** Action A injects Action B which injects Action A. The container throws a runtime resolution error. Break the cycle by extracting shared logic to a third class.
- **Sub-action manages its own transaction.** Creates savepoint confusion when called inside an outer transaction. The orchestrator must own the transaction boundary.
- **Orchestrator test exercises full action chain.** Tests that instantiate real sub-actions are slow, brittle, and fail without indicating which sub-action broke. Always mock sub-actions in orchestrator tests.

## Decision Points

- **Action vs Service for the orchestrator:** At 1-3 sub-action dependencies, use an action. At 4+, use a Service class. The number of action dependencies is the primary architectural signal.
- **Synchronous vs asynchronous composition:** If a sub-action does not need to return a result (notifications, logging, cache warming), dispatch it via `onQueue()` for asynchronous execution. The parent should not depend on the queued sub-action's result.

## Performance Considerations

- Each level of composition adds container resolution time (additive, not multiplicative). A chain of 3 actions resolves each once.
- After OpCache and container caching, resolved services are stored and not re-resolved.
- Each resolved action adds ~1-2KB of memory for the request lifetime. A depth-3 chain with 6-10 total resolved classes adds ~10-20KB.

## Security Considerations

- Authorization checks buried deep in a composition chain may be invisible to developers. Ensure authorization is visible at the orchestration level, not hidden in sub-actions.
- Shared mutable state in singleton services can leak data between requests in Octane. Never compose actions that share singleton mutable state.

## Related Rules

- Rule: Limit Composition Depth to 3 Action Dependencies (action-composition/05-rules.md)
- Rule: Sub-Actions Must Not Manage Their Own Transactions (action-composition/05-rules.md)
- Rule: Pass Data Through Return Values, Not Shared Mutable State (action-composition/05-rules.md)
- Rule: Make Sub-Action Execution Order Explicit (action-composition/05-rules.md)
- Rule: Prevent Circular Dependencies Between Actions (action-composition/05-rules.md)
- Rule: Test Each Action Independently with Mocked Sub-Actions (action-composition/05-rules.md)
- Rule: Do Not Compose Actions with Shared Singleton Mutable State (action-composition/05-rules.md)

## Related Skills

- Refactor an Over-Composed Action to a Service (action-composition/06-skills.md)
- Write a Transaction-Safe Orchestrator with afterCommit Side Effects (transactional-actions/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)

## Success Criteria

- The orchestrating action has exactly 1-3 action dependencies, each independently testable.
- The composition chain is readable in a single screen — the method body clearly shows "step 1, step 2, step 3."
- No sub-action fails when called outside the orchestration context (standalone, in a different order, or inside/outside a transaction).
- All orchestrator tests run in under 5ms with mocked sub-actions.

---

# Skill: Refactor an Over-Composed Action to a Service

## Purpose

Convert an action class that has exceeded the composition depth threshold (4+ action dependencies) into a properly named Service class that owns the transaction boundary and orchestration responsibility.

## When To Use

- An action class has 4+ action dependencies in its constructor.
- An action class owns a transaction AND composes sub-actions — it should be a service.
- An action's single public method is longer than 50 lines due to orchestration logic.
- Code review identifies that an action is "orchestrating, not composing."

## When NOT To Use

- The action has exactly 3 action dependencies — this is still composition, not orchestration.
- The over-composition is caused by unnecessary action granularity — merge related sub-actions first.
- The action is intentionally orchestrating within a single conceptual level (e.g., `NotifyAllStakeholdersAction` calling 4 notification actions for different channels).

## Prerequisites

- An action class with 4+ action constructor dependencies.
- Understanding of the composition vs orchestration boundary (threshold = 3-4 action deps).
- A service naming convention (e.g., `OrderService`, `CheckoutService`).

## Inputs

- The over-composed action class file.
- All call sites that invoke the over-composed action.
- Knowledge of the transaction boundary requirement.

## Workflow

1. **Count action dependencies.** Verify the action has 4+ action-type constructor parameters. Also count non-action dependencies (repositories, gateways, loggers) — if total exceeds 8, the class needs decomposition into sub-services.

2. **Create the service class.** Create `App\Services\{Domain}\{Operation}Service.php`. Do NOT use the `Action` suffix. Use the `Service` suffix instead.

3. **Move constructor dependencies.** Copy all constructor parameters from the over-composed action to the new service class. The service may have more parameters than an action because it is expected to orchestrate.

4. **Move the public method.** Copy the single public method from the action to the service. The service may have multiple public methods — add one per workflow the service manages.

5. **Add transaction ownership.** Unlike the action (which had no transaction), the service method should own the transaction boundary. Wrap the orchestration in `DB::transaction()`.
   ```php
   public function process(OrderData $data): Order
   {
       return DB::transaction(function () use ($data) {
           $step = $this->validate->execute($data);
           $payment = $this->charge->execute($step);
           $order = $this->create->execute($data, $payment);
           DB::afterCommit(fn () => $this->notify->execute($order));
           return $order;
       });
   }
   ```

6. **Add `afterCommit` for side effects.** Move all side-effect sub-actions (email, notification, webhook) inside `DB::afterCommit()` callbacks within the transaction. This ensures side effects only execute after the transaction commits.

7. **Update all call sites.** Replace references to the old action class with the new service class. Update constructor injection and `app()` calls to use the service.

8. **Keep the old action class (optional).** If individual sub-actions from the old composition are useful independently, keep them as separate action classes. The service now composes them instead of the action.

9. **Rename/reorient the old action class.** Either delete the over-composed action class (if all its callers now use the service) or rename it to the service name and update its namespace.

10. **Update tests.** Move test coverage from the old action's test file to the service's test file. Write orchestration tests with mocked sub-actions. Add transaction boundary tests.

## Validation Checklist

- [ ] New class uses `Service` suffix (not `Action`)
- [ ] Service has 4+ action dependencies (expected for orchestration)
- [ ] Service method owns the transaction boundary with `DB::transaction()`
- [ ] Side-effect sub-actions use `DB::afterCommit()` inside the transaction
- [ ] Sub-action execution order is explicit in the service method body
- [ ] All call sites updated to use the service class
- [ ] Old action class either removed or renamed
- [ ] Orchestrator tests use mocked sub-actions with ordered expectations
- [ ] Transaction boundary is documented in the service method docblock

## Common Failures

- **Service still named `XxxAction`.** The class is a service but retains the `Action` suffix, confusing team expectations about what an action is. Rename to `XxxService`.
- **Service has single public method.** A service can (and should) have multiple public methods — one per workflow. Adding more methods is the point of the extraction.
- **Transaction boundary not documented.** Developers adding new sub-actions may accidentally create their own transactions. Document that the transaction is owned at the service level.
- **All sub-actions not transferred.** Some sub-action calls were left in the old action class. Ensure all orchestration logic moved to the service.
- **Over-composed action kept as a wrapper.** The old action now delegates to the service — creating an unnecessary indirection layer. Remove the action entirely.

## Decision Points

- **Multiple services vs one service:** If the extracted orchestration covers multiple distinct workflows (checkout, returns, cancellations), consider creating separate services per workflow. One service per bounded context is the default.

## Performance Considerations

- Service resolution cost is identical to action resolution — the container resolves the full dependency tree once per request.
- Transaction overhead adds ~0.1-0.5ms for the begin/commit round trip.

## Security Considerations

- Services that own transactions must ensure authorization checks happen before the transaction begins, not inside it. Stale read results from concurrent transactions can lead to incorrect authorization decisions.

## Related Rules

- Rule: Limit Composition Depth to 3 Action Dependencies (action-composition/05-rules.md)
- Rule: Sub-Actions Must Not Manage Their Own Transactions (action-composition/05-rules.md)
- Rule: Actions Must Not Manage Their Own Database Transactions (transactional-actions/05-rules.md)

## Related Skills

- Compose Actions into a Workflow (action-composition/06-skills.md)
- Write a Transaction-Safe Orchestrator with afterCommit Side Effects (transactional-actions/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)

## Success Criteria

- The over-composed action is replaced by a service that explicitly owns the transaction boundary.
- The service has 4+ action dependencies (expected and appropriate for orchestration).
- The service may have multiple public methods — the extraction has not reduced functionality.
- Each sub-action remains independently testable with its own test class.
- Transaction behavior is deterministic: all operations commit or all roll back together.

---

# Skill: Test an Orchestrating Service with Mocked Sub-Actions

## Purpose

Verify that a service or orchestrating action calls its sub-actions in the correct order, passes the correct data, and handles sub-action failures, without re-testing the sub-actions' internal logic.

## When To Use

- Testing any class that composes 2+ action dependencies (orchestrator, service, or parent action).
- The sub-actions have their own independent test classes.
- The orchestrator's job is coordination, not execution.

## When NOT To Use

- The class has no sub-action dependencies — test it directly without mocks.
- Testing sub-action internal logic — each sub-action has its own test class.
- Critical end-to-end workflows that need a single integration test with real collaborators — this supplements, does not replace, mocked orchestrator tests.

## Prerequisites

- An orchestrating class (service or action) with 2+ action constructor dependencies.
- Existing unit tests for each sub-action.
- PHPUnit or Pest with Mockery for mock expectations.

## Inputs

- The orchestrating class file.
- List of sub-actions and their expected call signatures.
- Specification of execution order and data flow.

## Workflow

1. **Create the orchestrator test class.** Create `tests/Unit/Services/{Domain}/{ServiceName}Test.php` or `tests/Unit/Actions/{Domain}/{ActionName}Test.php`. Use a 1:1 mapping with the orchestrator class.

2. **Set up mocked sub-actions in the constructor or setUp method.** Create Mockery mocks for each sub-action dependency. Pass them into the orchestrator's constructor alongside any real dependencies (loggers, configs).
   ```php
   private ValidateCartAction|MockInterface $validateCart;
   private ProcessPaymentAction|MockInterface $processPayment;
   private CheckoutService $service;

   protected function setUp(): void
   {
       $this->validateCart = Mockery::mock(ValidateCartAction::class);
       $this->processPayment = Mockery::mock(ProcessPaymentAction::class);
       $this->service = new CheckoutService(
           $this->validateCart,
           $this->processPayment,
       );
   }
   ```

3. **Write the happy-path test.** Set expectations that each sub-action is called exactly once, in the correct order, with the expected parameters. Use `ordered()` to enforce sequence.
   ```php
   public function test_it_processes_checkout_in_correct_order(): void
   {
       $this->validateCart->shouldReceive('execute')
           ->once()->ordered()->with($this->cart)->andReturn($validation);
       $this->processPayment->shouldReceive('execute')
           ->once()->ordered()->with($this->cart, $validation)->andReturn($payment);

       $result = $this->service->checkout($this->cart);

       $this->assertSame($payment, $result);
   }
   ```

4. **Write failure-path tests.** Set mock expectations that throw exceptions. Verify the orchestrator handles the exception (re-throws, returns an error result, triggers compensation).
   ```php
   public function test_it_aborts_when_validation_fails(): void
   {
       $this->validateCart->shouldReceive('execute')
           ->once()->andThrow(new ValidationException('Cart invalid'));
       $this->processPayment->shouldReceive('execute')->never();

       $this->expectException(ValidationException::class);
       $this->service->checkout($this->cart);
   }
   ```

5. **Write data-flow verification tests.** Assert that the orchestrator correctly passes data from sub-action A's return value to sub-action B's parameters. Capture the parameters passed to B and verify they match A's output.
   ```php
   public function test_it_passes_validation_result_to_payment(): void
   {
       $validation = new ValidationResult(valid: true, total: 100.0);
       $this->validateCart->shouldReceive('execute')->once()->andReturn($validation);
       $this->processPayment->shouldReceive('execute')
           ->once()->with(Mockery::on(fn ($p) => $p->total === 100.0))
           ->andReturn($payment);

       $this->service->checkout($this->cart);
   }
   ```

6. **Verify sub-actions are NOT called when not expected.** Use `->never()` on sub-actions that should not execute in error scenarios. This catches bugs where the orchestrator continues execution after a sub-action fails.

7. **Run sub-action tests in isolation.** Ensure sub-action test classes still pass — the orchestrator's mocked tests did not accidentally test sub-action logic.

## Validation Checklist

- [ ] Orchestrator test uses mocked sub-actions (not real implementations)
- [ ] Call order is verified with `ordered()` expectations
- [ ] Each sub-action's parameters are verified (not just that it was called)
- [ ] Failure paths test that subsequent sub-actions are NOT called
- [ ] Data flow between sub-actions is verified (A's output → B's input)
- [ ] Sub-action tests still pass independently
- [ ] Tests run in under 5ms (no database, no framework boot)

## Common Failures

- **Mock expectations too loose.** `shouldReceive('execute')->once()` without parameter verification. The test passes even if the orchestrator passes wrong data. Always verify the parameters.
- **Not testing failure paths.** Only the happy path is tested. A sub-action throws an exception — does the orchestrator propagate it, catch it, or silently swallow it? Test all paths.
- **Over-mocking simple dependencies.** Mocking a `Logger` or `Config` for a simple log line adds brittleness. Use real implementations (NullLogger, in-memory config) for trivial dependencies.
- **Real sub-action accidentally used.** The test constructs real sub-action instances alongside mocks for others — the real sub-action executes and may touch the database. Ensure all sub-actions are mocked.
- **Test exercises the full action chain.** A test that calls the orchestrator without mocking sub-actions is a slow integration test. Sub-action tests cover internal logic; orchestrator tests cover coordination.

## Decision Points

- **Mockery vs PHPUnit mocks:** Both work. Mockery provides `ordered()` and `shouldReceive()` syntax. PHPUnit provides `createMock()` and `expects()`. Choose the one the team is comfortable with.

## Performance Considerations

- A mocked orchestrator test runs in 0.1-0.5ms — 100-200x faster than an integration test that exercises real sub-actions and database queries.

## Security Considerations

- Orchestrator tests should verify that authorization-checking sub-actions are called before execution sub-actions. If a `ValidateAccessAction` is skipped, authorization is bypassed.

## Related Rules

- Rule: Test Each Action Independently with Mocked Sub-Actions (action-composition/05-rules.md)
- Rule: Maintain 1:1 Mapping Between Action Files and Test Files (action-testing/05-rules.md)
- Rule: Use Pure Unit Tests as the Primary Testing Strategy (action-testing/05-rules.md)

## Related Skills

- Compose Actions into a Workflow (action-composition/06-skills.md)
- Write a Pure Unit Test for an Action (action-testing/06-skills.md)

## Success Criteria

- The orchestrator test verifies call order without calling actual sub-action implementations.
- A bug in sub-action call order is caught by the test, even though all sub-actions are mocked.
- A bug in data flow (wrong parameter passed between sub-actions) is caught by the test.
- The test suite for the orchestrator adds < 10ms total to the overall test run.
