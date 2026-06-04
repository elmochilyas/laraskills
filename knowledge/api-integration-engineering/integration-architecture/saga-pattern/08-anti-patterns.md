# Anti-Patterns: Saga Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Saga Pattern |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Implementing Compensations After Forward Actions | Reliability | Critical |
| 2 | Choreography Without Monitoring or Recovery | Architecture | High |
| 3 | Skipping Compensation Definition for Non-Critical Steps | Reliability | Critical |
| 4 | No Saga Step Timeout Handling | Reliability | High |
| 5 | Mixing Business Reversal with Technical Compensation | Architecture | Medium |

---

## Anti-Pattern 1: Implementing Compensations After Forward Actions

### Category
Reliability

### Description
Writing the forward action logic first and treating compensation (rollback) logic as an afterthought, implementing it only after the forward path is complete and tested.

### Why Happens
Forward actions are the primary business path; they feel more important. Compensation is seen as "error handling" that can be added later. Development velocity prioritizes the happy path.

### Warning Signs
- Compensation actions are marked as TODOs in the initial implementation
- Saga code has forward steps fully tested but compensation steps never executed in tests
- Compensation logic is copy-pasted from forward logic with modifications
- Compensation fails in production because it assumes different state than what exists
- Forward actions are refactored but compensations are not updated

### Why Harmful
If compensation is not designed and implemented alongside the forward action, it may not correctly undo the operation. By the time a compensation is needed (production failure), the state has changed, the data is different, and the compensation logic (written months ago as an afterthought) is buggy. In a saga, the compensation IS the rollback; incorrect compensation means permanent data inconsistency.

### Real-World Consequences
- Payment charged but inventory update fails; compensation "refund" sends wrong amount (written without testing)
- Account credited but notification fails; compensation tries to "de-credit" but account has subsequent transactions
- Forward action is refactored to include tax calculation; compensation still uses pre-tax amount
- Compensation never tested with real data; first production invocation causes data corruption

### Preferred Alternative
Implement compensation logic BEFORE or alongside forward actions. Test compensation paths with the same rigor as forward paths. Compensations should be defined in the design phase.

```php
class PaymentSaga {
    // Design compensations FIRST, then forward actions
    private array $compensations = [
        'chargePayment' => 'refundPayment',
        'updateInventory' => 'restoreInventory',
        'sendEmail' => 'markEmailAsUndone', // or no-op if acceptable
    ];
    
    public function chargePayment(): void { /* ... */ }
    public function refundPayment(): void { /* Test this first! */ }
    
    public function updateInventory(): void { /* ... */ }
    public function restoreInventory(): void { /* Test this first! */ }
}
```

### Refactoring Strategy
1. For each saga, list all forward actions and their compensating actions
2. Write and test each compensation independently (unit test with fixtures)
3. Verify compensation produces the correct state regardless of how much time has passed
4. Add integration tests that simulate forward action failure at each step
5. Document compensation behavior and limitations for operations team

### Detection Checklist
- [ ] Compensation actions are defined before or alongside forward actions
- [ ] Compensation code is tested with the same coverage as forward code
- [ ] Forward action refactoring updates compensation logic too
- [ ] Production-like test verifies compensation correctness
- [ ] Operations team knows what compensations do and their side effects

### Related Rules/Skills/Trees
- Rule: Always define compensating actions before implementing forward actions
- Rule: Test compensation paths as rigorously as forward paths
- Related KU: Distributed transactions and rollback patterns

---

## Anti-Pattern 2: Choreography Without Monitoring or Recovery

### Category
Architecture

### Description
Using choreography-based saga (each service produces events that trigger the next step) without implementing monitoring, timeout handling, or recovery procedures for stalled sagas.

### Why It Happens
Choreography feels natural and loosely coupled: service A fires an event, service B reacts to it. Developers assume the event-driven flow will complete as designed and don't plan for partial failures or stalled sagas.

### Warning Signs
- No saga state tracking: no record of which saga steps have completed
- No timeout or "saga not progressing" alert
- Stalled sagas are invisible until business impact is reported
- No dashboard showing in-progress, completed, and failed sagas
- Recovery from partial saga failure requires manual database queries and fixes

### Why Harmful
In choreography, no single component has visibility into the saga's overall progress. If a service fails to emit its event (crash, bug, race condition), the saga stalls silently. Subsequent steps never execute, and no compensating actions are triggered for already-completed steps. The system is partially inconsistent with no automated recovery.

### Real-World Consequences
- Payment charged → order created → inventory update service crashes before emitting event
- Saga stalls: payment captured, order exists, but fulfillment never starts
- Customer is charged but order never ships; no alert to anyone
- 47 stalled sagas discovered during monthly reconciliation
- Each stalled saga requires manual investigation and compensation

### Preferred Alternative
Use orchestration-based saga for workflows with monitoring and recovery requirements. If choreography is preferred, implement a saga log and monitoring layer that tracks saga progress and alerts on stalls.

```php
// Saga log for choreography monitoring
class SagaMonitor {
    public static function recordStep(string $sagaId, string $step, string $status): void {
        SagaLog::create([
            'saga_id' => $sagaId,
            'step' => $step,
            'status' => $status,
            'recorded_at' => now(),
        ]);
    }
}

// Scheduled check for stalled sagas
class DetectStalledSagas extends Command {
    public function handle(): void {
        $stalled = SagaLog::where('status', 'started')
            ->where('created_at', '<', now()->subHours(2))
            ->whereNotIn('saga_id', function ($q) {
                $q->select('saga_id')->from('saga_logs')
                  ->where('status', 'completed');
            })
            ->distinct('saga_id')
            ->pluck('saga_id');
        
        foreach ($stalled as $sagaId) {
            Log::critical('Saga stalled', ['saga_id' => $sagaId]);
            Notification::alert('saga.stalled', ['saga_id' => $sagaId]);
        }
    }
}
```

### Refactoring Strategy
1. Add saga log table recording each step's start and completion
2. Implement saga stall detection (scheduled check for incomplete sagas past timeout)
3. Add alerting on stalled sagas with escalation path
4. Build admin interface for viewing and manually compensating stalled sagas
5. Consider migrating critical sagas to orchestration-based implementation

### Detection Checklist
- [ ] Saga steps are logged with timestamps
- [ ] Scheduled job detects stalled sagas (incomplete past timeout)
- [ ] Alerting exists for stalled sagas
- [ ] Manual recovery procedure is documented and tested
- [ ] Orchestration is considered for sagas exceeding 3 steps

### Related Rules/Skills/Trees
- Rule: Prefer choreography for simplicity when services are loosely coupled
- Rule: Saga log in event store for full audit trail and recovery
- Decision Tree: Choreography vs Orchestration (based on complexity)

---

## Anti-Pattern 3: Skipping Compensation Definition for Non-Critical Steps

### Category
Reliability

### Description
Defining compensations only for "important" saga steps while leaving some steps without rollback logic, assuming those steps don't matter enough to compensate.

### Why It Happens
Some saga steps feel less critical (sending a notification email, updating a analytics counter). Teams decide these don't need compensation to "reduce complexity."

### Warning Signs
- Some saga steps have compensating actions defined; others throw `NotImplementedException`
- Documentation says "step X is not critical, no compensation needed"
- Saga failure during a "non-critical" step leaves all steps unrolled back
- No analysis of cascade effects for each step if not compensated
- Decision of which steps need compensation is undocumented

### Why Harmful
In a saga, if any step fails, ALL previous steps must be compensated to maintain data consistency. Skipping compensation for "non-critical" steps means the entire rollback is incomplete. The saga's guarantee of eventual consistency is broken. What seems non-critical today (logging) may be critical tomorrow (compliance audit).

### Real-World Consequences
- Saga fails at step 4 (send email); compensations only revert steps 1-3
- Step 1 (charge payment) is compensated (refund issued), but step 2 (update subscription) was skipped
- Customer is refunded but subscription remains active for 3 months
- Step 3 (record analytics) not compensated; analytics show inflated numbers
- Compliance audit finds inconsistency: payment was refunded but subscription never cancelled

### Preferred Alternative
Define a compensating action for EVERY step in the saga. For genuinely side-effect-free steps (like idempotent logging), the compensation can be a no-op, but it must be explicitly defined and documented.

```php
class OrderSaga {
    public function compensate(string $failedStep): void {
        $compensationOrder = array_reverse($this->steps);
        foreach ($compensationOrder as $step) {
            if ($step === $failedStep) break; // Don't compensate the failed step itself
            
            match ($step) {
                'chargePayment' => $this->refundPayment(),
                'updateInventory' => $this->restoreInventory(),
                'sendNotification' => null, // Explicit no-op: notification is fire-and-forget
                'recordAnalytics' => $this->reverseAnalytics(), // Must compensate
                'updateSubscription' => $this->cancelSubscriptionChange(), // Must compensate
            };
        }
    }
}
```

### Refactoring Strategy
1. Audit all saga steps for missing compensations
2. For each step without compensation, determine if it truly has no side effect
3. Implement compensations for all steps with side effects, even if small
4. For genuinely side-effect-free steps, add explicit no-op with documentation
5. Test full compensation chain for every possible failure point

### Detection Checklist
- [ ] Every saga step has a defined compensation (or explicit no-op with reason)
- [ ] Compensation chain runs ALL prior steps on failure
- [ ] No step is excluded from compensation chain
- [ ] Side-effect analysis is documented for each step
- [ ] Compliance requirements for compensation are documented

### Related Rules/Skills/Trees
- Rule: Compensating actions defined for each step
- Rule: Failure of any step triggers compensation for all completed steps
- Related KU: Event sourcing for saga log auditing

---

## Anti-Pattern 4: No Saga Step Timeout Handling

### Category
Reliability

### Description
Saga steps do not have timeouts, allowing a single hung step to block the entire saga indefinitely without triggering compensation.

### Why Happens
Saga steps are implemented as regular service calls or event handlers. Developers apply the same timeout philosophy as normal HTTP requests (assume they eventually complete or fail) and don't consider that saga steps may hang silently.

### Warning Signs
- No timeout configuration on saga step execution
- Sagas remain "in progress" for hours or days
- No mechanism to "time out" a saga step and begin compensation
- Hung external API call in a saga step blocks all subsequent steps
- Operations team manually cancels stuck sagas via database queries

### Why Harmful
A hung saga step prevents compensation from being triggered. The forward steps already completed (payment charged, inventory reserved) remain un-rolled-back indefinitely. The saga's consistency guarantee requires that either ALL steps complete or ALL are compensated. A hung step breaks this guarantee for the duration of the hang.

### Real-World Consequences
- Payment gateway API hangs during "charge" step; saga stuck at step 1
- Order is not created, but customer's payment authorization is held for 7 days
- Inventory step never executes; reserved stock stays reserved
- Manual intervention required to release payment and inventory after 3 hours
- Customer cannot retry because the saga is still "in progress"

### Preferred Alternative
Set explicit timeouts on every saga step. If a step exceeds its timeout, treat it as a failure and trigger compensation for all completed steps.

```php
class OrchestratedSaga {
    private array $stepTimeouts = [
        'chargePayment' => 30,   // seconds
        'updateInventory' => 10,
        'sendNotification' => 5,
    ];
    
    public function executeStep(string $step, callable $action): void {
        $timeout = $this->stepTimeouts[$step] ?? 30;
        
        try {
            $result = retry(3, 1000, function () use ($action, $timeout) {
                return timeout($action, $timeout); // Timeout wrapper
            });
        } catch (TimeoutException $e) {
            Log::error('Saga step timed out', ['step' => $step]);
            $this->compensateAll($step);
            throw $e;
        }
    }
}
```

### Refactoring Strategy
1. Define timeouts for each saga step based on expected execution time + buffer
2. Implement step timeout enforcement (async with timeout or circuit breaker)
3. On timeout, trigger compensation for all completed steps (same as any other failure)
4. Monitor timeout frequency per step for timeout tuning
5. Add alert for saga steps nearing timeout thresholds

### Detection Checklist
- [ ] Every saga step has an explicit timeout
- [ ] Timeout triggers full compensation chain
- [ ] Timeout duration is based on step's expected execution time
- [ ] Timeout frequency is monitored per step
- [ ] No saga can hang indefinitely on a single step

### Related Rules/Skills/Trees
- Rule: Timeout handling: saga step timeout triggers compensation
- Rule: Idle saga timeouts trigger compensation
- Related KU: Webhook Retry Logic (timeout patterns)

---

## Anti-Pattern 5: Mixing Business Reversal with Technical Compensation

### Category
Architecture

### Description
Implementing compensations as business reversals (e.g., "cancel order") rather than technical rollbacks (e.g., "restore order status to previous state"), mixing business logic with technical compensation.

### Why Happens
It's intuitive to think "if charging fails, refund the payment" — but refund is a business operation, not a technical rollback. A saga compensation should undo the technical change, not trigger a new business process.

### Warning Signs
- Compensations have business names like "cancelOrder" or "refundPayment" instead of "restoreOrderStatus"
- Compensation logic is as complex as the forward action (includes business rules, validation, side effects)
- Compensation failures are treated as new incidents (customer service tickets, business escalation)
- Compensations create new events in the event store (saga compensation produces more saga triggers)
- Compensations have business impact beyond the original operation

### Why Harmful
Business reversals have side effects: cancellation emails, audit log entries, CRM updates, customer notifications. These side effects can trigger additional sagas, creating infinite loops or cascading failures. Technical compensations should restore state silently without triggering new business processes.

### Real-World Consequences
- Payment saga fails; compensation "cancels order" — which triggers an OrderCancelled event
- OrderCancelled event triggers a new saga: "send cancellation email, update inventory, refund payment"
- Refund triggers another saga: "record refund, send refund notification"
- The original saga's 3 steps generate 10 additional events across the system
- Monitoring system floods with alerts from compensation cascades

### Preferred Alternative
Implement technical compensations that restore state to the previous value without triggering new business events. Business reversals (emails, notifications) should be handled separately.

```php
// Wrong: Compensation as business reversal
public function cancelOrderCompensation($orderId): void {
    $order = Order::find($orderId);
    $order->cancel(); // Triggers OrderCancelled event → more sagas
    Mail::send(new OrderCancelledMail($order)); // Side effect
}

// Correct: Compensation as technical rollback
public function restoreOrderStatus($orderId, $previousStatus): void {
    Order::withoutEvents(function () use ($orderId, $previousStatus) {
        Order::where('id', $orderId)->update(['status' => $previousStatus]);
    });
    // No events, no emails, no side effects
}
```

### Refactoring Strategy
1. Audit all compensations for business side effects (events, emails, notifications)
2. Refactor compensations to use technical state restoration instead of business operations
3. Use `withoutEvents()` or equivalent to prevent event cascade during compensation
4. Separate business reversal (customer notification) from technical compensation (state rollback)
5. Add test: verify compensation does not trigger any events or queue jobs

### Detection Checklist
- [ ] Compensations restore technical state, not trigger business operations
- [ ] Compensation does not fire events, send emails, or create new sagas
- [ ] State restoration uses `withoutEvents()` or equivalent
- [ ] Business reversal (notification) is separate from technical compensation
- [ ] Test verifies no event cascade from compensation execution

### Related Rules/Skills/Trees
- Rule: Compensating events undo technical state, not trigger new business processes
- Rule: Compensation is also an event (recorded, auditable)
- Related KU: Event Sourcing for Webhooks (compensation events)
