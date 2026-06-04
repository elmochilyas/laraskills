## Define Compensating Actions Before Forward Actions
---
## Category
Reliability
---
## Rule
Design and implement compensating actions for every saga step before implementing the forward action; never deploy a saga without compensation.
---
## Reason
If a forward action fails midway through the saga and no compensation exists, the system is left in an inconsistent state with no automated recovery path.
---
## Bad Example
```php
// Forward action implemented — no compensation defined
public function capturePayment($order) { /* charges customer */ }
// No reversePayment() — if later steps fail, customer charged with no refund
```
---
## Good Example
```php
// Compensation defined before forward action
public function compensateCapturePayment($order) { /* refunds customer */ }
public function capturePayment($order) { /* charges customer */ }
```
---
## Exceptions
Steps with no side effects that don't require compensation.
---
## Consequences Of Violation
Unrecoverable inconsistent state after partial saga failure, manual intervention required, data corruption.
## Prefer Choreography for Simple Sagas; Orchestration for Complex
---
## Category
Architecture
---
## Rule
Use choreography-based sagas (each service emits events triggering the next) for simple linear workflows; use orchestration (central state machine) for branching and conditional compensation.
---
## Reason
Choreography is simpler but harder to debug and lacks centralized visibility. Orchestration adds complexity but provides clear workflow control, timeouts, and conditional branching.
---
## Bad Example
```php
// Orchestration for a 2-step linear saga — unnecessary complexity
```
---
## Good Example
```php
// Simple 2-step: choreography via events
Event::listen(OrderCreated::class, fn() => $this->capturePayment());
Event::listen(PaymentCaptured::class, fn() => $this->sendEmail());

// Complex multi-step with branching: orchestration
class OrderSaga {
    public function handle(OrderCreated $event) {
        $this->step('capture_payment', $event);
        $this->step('update_inventory', $event);
        $this->step_or_skip('send_email', fn() => $event->emailNotifications);
    }
}
```
---
## Exceptions
Simple 2-step sagas where orchestration overhead is justified for audit requirements.
---
## Consequences Of Violation
Choreography too complex to debug for branching sagas; orchestration overhead unnecessary for simple linear flows.
## Record Every Saga Step as an Immutable Event
---
## Category
Observability
---
## Rule
Persist every saga step execution (start, success, failure, compensation) as an immutable event in the event store.
---
## Reason
The event store provides a complete saga audit trail enabling forensic analysis, debugging, and replay for recovery.
---
## Bad Example
```php
// No saga logging — invisible when saga fails midway
```
---
## Good Example
```php
SagaStep::record('capture_payment', 'started', $orderId);
try {
    $this->capturePayment($order);
    SagaStep::record('capture_payment', 'completed', $orderId);
} catch (\Exception $e) {
    SagaStep::record('capture_payment', 'failed', $orderId, $e->getMessage());
    $this->compensate($orderId);
}
```
---
## Exceptions
Simple 2-step sagas where basic logging suffices.
---
## Consequences Of Violation
Inability to diagnose saga failures, no audit trail for compliance, difficult debugging of partial failures.
## Trigger Compensation on Timeout
---
## Category
Reliability
---
## Rule
Set a timeout per saga step; if a step doesn't complete within the timeout, trigger compensation for all completed steps.
---
## Reason
A hung saga step (never completes, never fails) would leave the system in limbo indefinitely without a timeout-based compensation trigger.
---
## Bad Example
```php
// No timeout — saga could hang forever on a stuck step
```
---
## Good Example
```php
$timeout = 60; // seconds
$result = $this->capturePayment($order);
if ($saga->waitForResult('capture_payment', $timeout) === null) {
    // Timeout — trigger compensation
    $saga->compensate();
    Alert::critical("Saga timeout on capture_payment for order {$order->id}");
}
```
---
## Exceptions
External operations where timeout cannot be enforced.
---
## Consequences Of Violation
Saga hangs indefinitely on stuck step, resources tied up, no automated recovery.
## Test Compensation Paths as Rigorously as Forward Paths
---
## Category
Testing
---
## Rule
Write dedicated tests for every compensation path; test both forward success and compensation scenarios.
---
## Reason
Compensation paths are rarely exercised in production and are the most likely to fail when actually needed; untested compensation leaves the system vulnerable.
---
## Bad Example
```php
// Only tests forward path — compensation untested
public function test_capture_payment(): void { /* forward only */ }
```
---
## Good Example
```php
public function test_capture_payment(): void { /* forward */ }
public function test_capture_payment_compensation(): void {
    // Simulate later step failure — verify compensation executes correctly
}
```
---
## Exceptions
None — always test compensation paths.
---
## Consequences Of Violation
Compensation fails when actually needed, manual intervention required, extended data inconsistency.
