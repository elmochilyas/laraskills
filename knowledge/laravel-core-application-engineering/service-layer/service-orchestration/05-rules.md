# Service Orchestration — Engineering Rules

---

## Rule 1: Services Orchestrate, Actions Execute

Service methods must coordinate multi-step workflows. Individual execution steps must be delegated to action classes or other services. A service method must not implement the detailed logic of each step inline.

---

## Category

Architecture

---

## Rule

Service orchestration methods must compose operations by calling action classes or sub-services. The service method defines the workflow (call order, transaction boundary, error handling, result aggregation), but the individual steps are delegated to separate classes.

---

## Reason

Separating orchestration from execution keeps each layer focused. Services handle the workflow; actions handle the individual operation. This makes both layers testable in isolation, allows actions to be reused across workflows, and prevents service methods from becoming monolithic procedures.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        // Everything inline — orchestration + execution mixed
        $items = collect($data->items);
        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            if ($product->stock < $item['quantity']) {
                throw new InsufficientStockException($product);
            }
            $product->decrement('stock', $item['quantity']);
        }
        $payment = Payment::create([
            'amount' => $data->amount,
            'method' => $data->paymentMethod,
            'status' => 'pending',
        ]);
        $order = Order::create([
            'user_id' => $data->userId,
            'total' => $data->amount,
            'status' => 'confirmed',
        ]);
        return $order;
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->processPayment->handle($data->payment);
            $order = $this->createOrder->handle($data, $payment);
            return new OrderResult(order: $order, payment: $payment, inventory: $inventory);
        });
    }
}
```

---

## Exceptions

For very simple two-step orchestrations where the execution logic is trivial (e.g., calling a repository and sending a notification), inline implementation may be acceptable.

---

## Consequences Of Violation

Maintenance risks: orchestration methods become monolithic, hard to read and modify. Testing risks: entire workflow must be tested as a single unit. Reusability risks: individual operations cannot be reused in other workflows.

---

## Rule 2: Actions Must Not Call Services

Action classes must never depend on or call service classes. The dependency direction must always be Service → Action, never Action → Service.

---

## Category

Architecture

---

## Rule

Action classes must not inject or call any service class. Actions may call other actions, repositories, or infrastructure adapters, but must not depend on service-layer classes. The service layer is the orchestrator, not the orchestrated.

---

## Reason

Allowing actions to call services creates circular dependency potential and inverts the intended layering. Services orchestrate actions; actions execute operations. When actions call services, the dependency graph becomes tangled, and breaking the cycle requires refactoring both layers.

---

## Bad Example

```php
class ReserveInventoryAction
{
    public function __construct(
        private NotificationService $notifications, // Action calling service — prohibited
    ) {}

    public function handle(array $items): void
    {
        // ... reserve inventory ...
        $this->notifications->sendLowStockAlert($items);
    }
}
```

---

## Good Example

```php
class ReserveInventoryAction
{
    public function handle(array $items): void
    {
        // ... reserve inventory ... return result
    }
}

class OrderService // Service calls action — correct direction
{
    public function __construct(
        private ReserveInventoryAction $reserveInventory,
        private NotificationService $notifications,
    ) {}

    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);
            // ...
        });
    }
}
```

---

## Exceptions

No common exceptions. Actions must never depend on services.

---

## Consequences Of Violation

Architecture risks: circular dependencies when services also call actions. Maintenance risks: dependency graph becomes hard to trace. Testing risks: testing actions requires mocking services, defeating the purpose of action isolation.

---

## Rule 3: Keep Orchestration Methods Focused on One Workflow

Each orchestration method must coordinate exactly one business workflow. A single method must not handle multiple unrelated workflows.

---

## Category

Design

---

## Rule

Orchestration methods must be single-workflow: one method = one business process (e.g., `placeOrder`, `processRefund`, `cancelSubscription`). A method must not conditionally execute different workflows based on parameters or state.

---

## Reason

Focused orchestration methods are testable (one workflow per test method), readable (clear linear flow), and maintainable (changing one workflow doesn't risk breaking another). Multi-workflow methods violate single responsibility.

---

## Bad Example

```php
class OrderService
{
    public function process(string $action, array $data): mixed
    {
        return match ($action) {
            'place' => $this->handlePlacement($data),
            'refund' => $this->handleRefund($data),
            'cancel' => $this->handleCancellation($data),
            default => throw new InvalidArgumentException(),
        };
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function place(PlaceOrderData $data): OrderResult { /* ... */ }
    public function refund(RefundOrderData $data): RefundResult { /* ... */ }
    public function cancel(CancelOrderData $data): void { /* ... */ }
}
```

---

## Exceptions

When two workflows share significant setup logic, a private orchestration method may be called from multiple public methods. The public methods must still represent single workflows.

---

## Consequences Of Violation

Testing risks: testing one workflow requires navigating unrelated conditional branches. Maintenance risks: changing one workflow risks breaking others. Readability risks: difficult to follow the flow through conditionals.

---

## Rule 4: Handle Transactions at the Orchestration Level

`DB::transaction()` must wrap the orchestration method body, not individual actions within the workflow.

---

## Category

Reliability

---

## Rule

Transaction boundaries must be set at the service orchestration level, wrapping all database operations that require atomicity. Individual actions must not begin, commit, or roll back their own transactions. The service method controls the transaction scope.

---

## Reason

The service knows the workflow boundary. If each action manages its own transaction, nested transactions become unpredictable — only the outermost transaction actually commits. Actions that are sometimes composed (within a service transaction) and sometimes standalone must use a `TransactionalAction` pattern, not internal `DB::transaction()` calls.

---

## Bad Example

```php
class ReserveInventoryAction
{
    public function handle(array $items): void
    {
        DB::transaction(function () { // action manages its own transaction
            // ...
        });
    }
}

class ChargePaymentAction
{
    public function handle(PaymentData $data): Payment
    {
        DB::transaction(function () { // action manages its own transaction
            // ...
        });
    }
}

class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        // No transaction here — each action has its own
        $this->reserveInventory->handle($data->items);
        return $this->chargePayment->handle($data->payment);
    }
}
```

---

## Good Example

```php
class ReserveInventoryAction
{
    // No transaction management — caller controls it
    public function handle(array $items): void { /* ... */ }
}

class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);
            return $this->chargePayment->handle($data->payment);
        });
    }
}
```

---

## Exceptions

Actions that are ALWAYS called as standalone operations (never composed in a service transaction) may manage their own transaction. Document this to prevent breakage if the action is later composed.

---

## Consequences Of Violation

Reliability risks: nested transactions may not roll back correctly — partial writes can occur. Maintenance risks: actions with internal transactions cannot be safely composed. Testing risks: composing actions inside a transaction produces unexpected behavior.

---

## Rule 5: Return Aggregated Results from Orchestration

Orchestration methods must return a single result object or DTO containing all outputs from the orchestrated workflow, not individual pieces scattered across multiple return paths.

---

## Category

Design

---

## Rule

Every orchestration method must return a cohesive result object (DTO, result class, or array with documented structure) that aggregates all outputs from the workflow steps. Methods must not return different result types based on conditional paths, and callers must not need to call multiple methods to obtain the complete workflow result.

---

## Reason

Aggregated results provide a single contract for the caller. The caller receives everything needed from one method call. Scattered results force callers to understand the workflow's internal steps and combine outputs manually.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        // Only returns Order — caller loses payment and inventory info
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);
            $this->processPayment->handle($data->payment);
            return $this->createOrder->handle($data);
        });
    }
}

// Caller must call additional methods to get payment info
$order = $this->orderService->placeOrder($data);
$payment = Payment::where('order_id', $order->id)->first(); // leaky
```

---

## Good Example

```php
readonly class OrderResult
{
    public function __construct(
        public Order $order,
        public Payment $payment,
        public bool $inventoryReserved,
    ) {}
}

class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->processPayment->handle($data->payment);
            $order = $this->createOrder->handle($data, $payment);
            return new OrderResult($order, $payment, $inventory);
        });
    }
}
```

---

## Exceptions

Methods performing a single write with no conditional branching may return the created model directly (e.g., `createUser()` returning `User`).

---

## Consequences Of Violation

Maintenance risks: callers must combine results from multiple sources, duplicating workflow knowledge. Reliability risks: scattered result collection may miss edge cases. Readability risks: workflow outcome is unclear from the method signature.

---

## Rule 6: Do Not Orchestrate in Controllers

Controllers must not coordinate multi-step workflows. Orchestration must be delegated to a service method.

---

## Category

Architecture

---

## Rule

Controllers must not implement workflow orchestration. Any method that calls multiple services, manages a transaction, or coordinates conditional branching must be in a service class. Controllers may only extract request data, call a single service method, and format the response.

---

## Reason

Orchestration in controllers couples business workflows to the HTTP layer, making them unreusable from CLI, queues, or other controllers. Moving orchestration to services enables reuse, testability, and a clear separation between transport and business logic.

---

## Bad Example

```php
class OrderController
{
    public function store(Request $request)
    {
        DB::beginTransaction(); // orchestration in controller
        $inventory = (new ReserveInventoryAction())->handle($request->items);
        $payment = (new ProcessPaymentAction())->handle($request->payment);
        $order = Order::create([...]);
        DB::commit();
        return new OrderResource($order);
    }
}
```

---

## Good Example

```php
class OrderController
{
    public function __construct(
        private OrderService $orders,
    ) {}

    public function store(PlaceOrderRequest $request)
    {
        $result = $this->orders->place(PlaceOrderData::fromRequest($request));
        return new OrderResource($result->order);
    }
}
```

---

## Exceptions

Extremely simple two-step workflows that are specific to a single controller action (e.g., creating a record and sending a notification) may remain in the controller if extracting to a service adds no reuse value.

---

## Consequences Of Violation

Reusability risks: workflow logic is trapped in HTTP context. Testing risks: testing workflow requires HTTP feature tests. Maintenance risks: duplicate orchestration logic across multiple controllers.

---

## Rule 7: Do Not Over-Orchestrate Independent Operations

Operations that have no dependency on each other must not be wrapped in a single orchestration method. Let the caller coordinate independent operations separately.

---

## Category

Design

---

## Rule

Service orchestration methods must only coordinate operations that are part of the same logical workflow. Independent operations (e.g., sending a weekly report and updating user preferences) must not be combined into a single orchestration method, even if they are triggered by the same controller action.

---

## Reason

Forcing independent operations into a single orchestration method creates unnecessary coupling. If one operation fails, the other should not be rolled back. Independent operations should be separately invocable and independently tested.

---

## Bad Example

```php
class DashboardService
{
    // Two independent operations forced into one method
    public function refreshDashboard(User $user): void
    {
        DB::transaction(function () use ($user) {
            $this->generateWeeklyReport($user);  // Independent
            $this->updateUserPreferences($user);  // Independent
        });
    }
}
```

---

## Good Example

```php
class DashboardService
{
    public function refreshDashboard(User $user): DashboardData
    {
        // Call independent operations — each manages its own scope
        $report = $this->generateWeeklyReport($user);
        $preferences = $this->updateUserPreferences($user);
        return new DashboardData($report, $preferences);
    }
}
```

---

## Exceptions

When independent operations must be presented as a single result (e.g., a combined API response), orchestration is acceptable if the operations remain independently testable.

---

## Consequences Of Violation

Maintenance risks: unnecessary coupling causes cascading failures. Reliability risks: one failed operation blocks independent operations. Performance risks: operations that could run in parallel are serialized.

---

## Rule 8: Handle Workflow-Level Errors in Orchestration

Error handling (logging failures, sending notifications, triggering compensations) must be implemented at the orchestration level, not inside individual actions.

---

## Category

Reliability

---

## Rule

Workflow-level error handling — logging, notifications, compensating actions, and re-throwing — must be implemented in the service orchestration method, not inside individual actions. Actions should throw exceptions for failure cases and let the orchestrator decide how to handle them.

---

## Reason

The orchestrator has the full context to decide how to handle failures: whether to retry, compensate, notify, or abort. Individual actions lack this context and should not make workflow-level decisions.

---

## Bad Example

```java
class ReserveInventoryAction
{
    public function handle(array $items): void
    {
        try {
            // ... reserve logic ...
        } catch (OutOfStockException $e) {
            Log::error('Inventory reservation failed');
            Mail::send(...); // action decides error handling
            throw $e;
        }
    }
}
```

---

## Good Example

```php
class ReserveInventoryAction
{
    public function handle(array $items): void
    {
        // Just throw — no handling
    }
}

class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        try {
            return DB::transaction(function () use ($data) {
                $this->reserveInventory->handle($data->items);
                // ...
            });
        } catch (OutOfStockException $e) {
            Log::error('Order placement failed: out of stock', [
                'items' => $data->items,
            ]);
            throw new OrderPlacementFailedException(
                message: 'Unable to reserve inventory',
                previous: $e,
            );
        }
    }
}
```

---

## Exceptions

Actions may perform local cleanup (e.g., releasing a lock) in a `finally` block. They must not make workflow-level decisions like sending notifications or deciding compensation strategies.

---

## Consequences Of Violation

Maintenance risks: error handling logic is scattered and inconsistent. Reliability risks: actions may swallow exceptions that the orchestrator needs to see. Testing risks: testing error handling requires testing actions instead of orchestrators.
