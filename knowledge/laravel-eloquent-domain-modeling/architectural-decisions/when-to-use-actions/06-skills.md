# When to Use Actions — Skills

---

## Skill 1: Decide When to Extract an Action

### Purpose
Evaluate whether a use case warrants its own action class or belongs on a model method, based on aggregate coordination, transaction needs, and side-effects.

### When To Use
- You are designing a new use case and deciding where to put the logic
- You are reviewing code and questioning whether an action is needed
- You want to avoid both action proliferation and anemic models

### When NOT To Use
- The decision is already clear (single model save = model method; multi-aggregate = action)
- You are retrofitting actions to existing working code without a specific reason

### Prerequisites
- Understanding of aggregate boundaries
- Knowledge of what the operation needs to do

### Inputs
- Use case description
- Number of aggregate roots involved
- External side-effects required
- Need for atomicity across multiple models

### Workflow

1. **Count the aggregate roots** involved in the operation

2. **Check for external side-effects** — email, API calls, queue dispatch, file writes

3. **Check for transaction atomicity** — must multiple models be saved all-or-nothing?

4. **Apply the decision rules**:

   | Condition | Result |
   |---|---|
   | 1 aggregate, no side-effects, no transaction needed | Model method |
   | 1 aggregate, with side-effects | Model method that raises events; action if orchestration is needed |
   | 2+ aggregates, with or without side-effects | Action class |
   | Trivial CRUD (3 lines in controller) | Controller — no action needed |

5. **If the answer is "Action"**:
   - Name the action `{Verb}{Entity}Action`
   - Place in `App\Actions\{Domain}\`
   - Use constructor injection for dependencies
   - Wrap cross-aggregate operations in `DB::transaction()`
   - Push domain logic down to model methods

6. **If the answer is "Model method"**:
   - Add a named method to the model
   - Enforce invariants at the method start
   - Raise events for side effects
   - Let the controller or action manage the transaction boundary

### Validation Checklist

- [ ] Decision matches the aggregate/side-effect criteria
- [ ] Action has a clear single use case (if action is chosen)
- [ ] Action name follows the `VerbEntityAction` convention
- [ ] Action pushes domain logic down to model methods
- [ ] Model method is within-aggregate only (if model method is chosen)
- [ ] Model method raises events, not external service calls

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Extract action for 2+ aggregates | `05-rules.md` Rule 1 |
| Rule 6: Wrap cross-aggregate actions in DB::transaction() | `05-rules.md` Rule 6 |
| Rule 7: Name actions VerbEntityAction | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create an Action Class | Follows the "yes" decision |
| Add a State-Changing Method to a Model | Follows the "no" decision |

### Success Criteria
- Correct pattern chosen for the use case (action vs. model method)
- Action (if chosen) has a single reason to change
- Model method (if chosen) is within-aggregate and pure

---

## Skill 2: Refactor a Fat Controller into Actions

### Purpose
Extract cross-aggregate orchestration from a bloated controller into dedicated action classes, leaving the controller as a thin HTTP adapter.

### When To Use
- A controller method exceeds 15 lines
- The controller coordinates multiple models or external services
- The same orchestration logic is needed from CLI, queue, or another action

### When NOT To Use
- The controller method only reads data and returns a response
- The controller method does a single model save with no orchestration

### Prerequisites
- The controller method to refactor

### Inputs
- Controller file with the fat method
- List of models and services the method touches

### Workflow

1. **Identify the orchestration boundary**: what logic coordinates multiple models vs. what is HTTP response handling?

2. **Name the action** after the use case: `PlaceOrderAction`, `RegisterUserAction`

3. **Move constructor-injectable dependencies** from the controller to the action (services, gateways, repos)

4. **Move the orchestration logic** into the action's `__invoke()`:
   - Wrap cross-aggregate code in `DB::transaction()`
   - Replace `event()` with `DB::afterCommit()`
   - Push domain logic to model methods

5. **Replace the controller body** with action invocation:
   ```php
   // Before
   public function store(StoreOrderRequest $request): RedirectResponse
   {
       $order = $this->orders->createFromRequest($request->validated());
       $this->gateway->charge($order, $request->amount);
       event(new OrderCreated($order));
       return redirect()->route('orders.show', $order);
   }

   // After
   public function store(
       StoreOrderRequest $request,
       PlaceOrderAction $placeOrder
   ): RedirectResponse {
       $order = $placeOrder($request->toDTO());
       return redirect()->route('orders.show', $order);
   }
   ```

6. **Move controller tests** to action tests — add dedicated tests for the action

7. **Verify** the controller now only validates, invokes, and responds

### Validation Checklist

- [ ] Controller method is under 10 lines
- [ ] Controller only: validates, invokes action, returns response
- [ ] Action has all the orchestration logic with proper transaction boundary
- [ ] Action returns typed result, not HTTP response
- [ ] Action does not import `Request` or `Response`
- [ ] Action is independently testable without HTTP mocks

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Extract action for 2+ aggregates | `05-rules.md` Rule 1 |
| Rule 3: Never reference HTTP concerns in actions | `05-rules.md` Rule 3 |
| Rule 6: Wrap cross-aggregate in DB::transaction() | `05-rules.md` Rule 6 |
| Rule 7: Name actions VerbEntityAction | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create an Action Class | The target pattern for refactoring |
| Decide When to Extract an Action | Decision framework for each use case |

### Success Criteria
- Controller is thin (validates, invokes, responds)
- Action contains all orchestration with transaction boundary
- Action is testable without HTTP
- Action does not contain HTTP types or response construction

---

## Skill 3: Refactor a God Action into Focused Sub-Actions

### Purpose
Split an action that exceeds 100 lines or handles multiple branching paths into smaller, focused sub-actions, each with a single use case.

### When To Use
- An action exceeds 100 lines
- An action uses `if/else` branching on a `$type` or `$mode` argument
- An action has multiple reasons to change

### When NOT To Use
- The action is under 100 lines and has a single clear purpose
- The branching is on infrastructure concerns (sync vs. queue) with identical business logic

### Prerequisites
- The action class to refactor

### Inputs
- Action file with multiple responsibilities or large method body

### Workflow

1. **Identify the different use cases** currently handled by one action — look for branching on argument values

2. **Create a separate action for each branch**:
   ```php
   // Before
   class ProcessPaymentAction
   {
       public function __invoke(Payment $payment, string $mode): void
       {
           if ($mode === 'refund') { /* refund logic */ }
           elseif ($mode === 'capture') { /* capture logic */ }
       }
   }

   // After
   class RefundPaymentAction { /* ... */ }
   class CapturePaymentAction { /* ... */ }
   ```

3. **Create a strategy/decorator** if branching is on infrastructure only (sync vs. queue):
   - Keep the same business logic
   - Wrap in sync or queued execution based on the decorator

4. **Move shared logic** into a private method on a common base or injectable service, not duplicated

5. **Update callers** to inject the specific action they need rather than the god action

6. **Remove the original god action**

### Validation Checklist

- [ ] No action exceeds 100 lines
- [ ] No action branches on argument values
- [ ] Each sub-action has one clear use case
- [ ] Shared logic is extracted to a common service, not duplicated
- [ ] All callers updated to inject the specific action they need
- [ ] Tests pass with the new split

### Related Rules

| Rule | Reference |
|---|---|
| Rule 2: Actions are stateless | `05-rules.md` Rule 2 |
| Rule 5: One action per use case | `05-rules.md` Rule 5 |

### Success Criteria
- God action deleted and replaced with focused sub-actions
- Each sub-action is under 100 lines with one use case
- No branching on argument values
- Shared logic is in one place
