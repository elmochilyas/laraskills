# Anti-Patterns — Service Orchestration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Service Orchestration |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Orchestrator God Class | High | Medium | Code review: 8+ services coordinated in one orchestrator |
| Missing Compensation | Critical | Medium | Code review: multi-step orchestration with no rollback on failure |
| Domain Logic in Orchestrator | High | Medium | Code review: orchestrator contains business rules |
| Over-Orchestration | Medium | High | Code review: orchestrator for every 2-step operation |
| Orchestrator Without Error Handling | High | Medium | Code review: orchestrator assumes sub-services never fail |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Orchestration Without Logging | No tracing at the orchestrator level | Failures are invisible — you don't know which step failed or why |
| Orchestrator Bypassing Security | Authorization checks missing in orchestrator because sub-services are assumed to handle them | Security gap: a fast-fail at the orchestrator level could prevent unauthorized operations |
| No Orchestrator Testing | Orchestrators tested only through integration tests, never unit tests with mocked services | Orchestration logic (sequencing, error handling) is untested |

---

## Anti-Pattern Details

### AP-SOR-01: Orchestrator God Class

**Description**: An orchestrator that coordinates 8+ services, with complex conditional logic, error handling for each service, and accumulated business rules. The orchestrator's execute method is 100+ lines with nested conditionals, loops, and try-catch blocks. It has become the most complex class in the application — the opposite of "pure coordination."

**Root Cause**: The orchestrator grows incrementally. Each sprint adds "one more step" to the workflow. The orchestrator absorbs coordination for every new business requirement without being split or refactored.

**Impact**:
- The orchestrator is untestable in isolation (too many mocked services, too many code paths)
- A failure in any one of the 8 services is hard to trace
- The orchestrator violates its own contract: it's no longer "pure coordination"
- Splitting it later is high-risk because every step depends on previous steps

**Detection**:
- Code review: orchestrator's primary method exceeds 50 lines
- Code review: orchestrator has 5+ injected dependencies
- Metrics: orchestrator file exceeds 200 lines

**Solution**:
- Split into sub-orchestrators for logical workflow phases (e.g., `PaymentPhaseOrchestrator`, `FulfillmentPhaseOrchestrator`)
- Extract conditional logic to strategy classes or sub-actions
- Keep the main orchestrator to 3-5 step calls with clear sequencing
- If the workflow has 8+ steps, consider a state machine or saga pattern

**Example**:
```php
// BEFORE: Orchestrator god class
class CheckoutOrchestrator
{
    public function checkout(CheckoutDto $dto): Order
    {
        // Step 1: Validate
        if ($dto->plan === 'enterprise') { /* enterprise validation */ }
        if ($dto->coupon) { /* coupon validation */ }
        // Step 2: Payment (5 sub-steps with conditionals)
        // Step 3: Inventory (3 sub-steps)
        // Step 4: Order creation (4 sub-steps)
        // Step 5: Notification (3 sub-steps)
        // Step 6-8: More steps...
        // 80 lines of orchestration
    }
}

// AFTER: Split into phase orchestrators
class CheckoutOrchestrator
{
    public function checkout(CheckoutDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $this->validatePhase->execute($dto);
            $payment = $this->paymentPhase->execute($dto);
            return $this->fulfillmentPhase->execute($dto, $payment);
        });
    }
}
```

---

### AP-SOR-02: Missing Compensation

**Description**: A multi-step orchestration involves external systems (payment gateways, email APIs, SMS services) but has no compensation logic. When step 4 fails, steps 1-3 have already committed irreversible changes (a payment was charged, an email was sent). The system is in an inconsistent state with no automated recovery path.

**Root Cause**: The developer designs the happy path only. Error handling is added as an afterthought, and compensating for external API calls is complex (requires API calls to reverse operations).

**Impact**:
- Production incidents require manual database intervention or manual API reversals
- Customers may be charged without receiving service, or receive service without being charged
- No audit trail for the partial failure — operations team discovers it from customer complaints
- Financial reconciliation requires manual accounting adjustments

**Detection**:
- Code review: orchestrator calls external APIs but has no catch/rollback block
- Code review: the catch block only logs the error (no compensation)
- Incident analysis: recurring issues with orders stuck in "payment taken, order not created" state

**Solution**:
- For every external API call, implement a compensating action (refund payment, delete external resource)
- Wrap the orchestration in a try-catch with explicit compensation steps
- If compensation fails, escalate to manual intervention (flag for review, notify operations team)
- Consider the saga pattern for long-running orchestration with compensations

**Example**:
```php
// BEFORE: No compensation
class RefundOrchestrator
{
    public function refund(RefundDto $dto): void
    {
        $this->payments->reverse($dto->transactionId);
        $this->orders->markRefunded($dto->orderId);
        $this->inventory->restock($dto->orderId); // if this fails, payment already reversed
    }
}

// AFTER: Compensation on failure
class RefundOrchestrator
{
    public function refund(RefundDto $dto): void
    {
        try {
            DB::beginTransaction();
            $this->payments->reverse($dto->transactionId);
            $this->orders->markRefunded($dto->orderId);
            $this->inventory->restock($dto->orderId);
            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();
            $this->payments->flagForManualReview($dto->transactionId);
            $this->notifier->sendRefundAlert($dto->orderId);
            throw $e;
        }
    }
}
```

---

### AP-SOR-03: Domain Logic in Orchestrator

**Description**: The orchestrator contains business rules, calculations, validation, and decision logic instead of delegating to sub-services. For example, the orchestrator calculates discount amounts, validates coupon codes, and determines shipping methods — all logic that belongs in dedicated services.

**Root Cause**: The developer finds it more convenient to write logic directly in the orchestrator than to create a sub-service. "It's just a simple calculation" — but every simple calculation added to the orchestrator violates its pure-coordination contract.

**Impact**:
- The orchestrator cannot be reused across different workflows (discount logic is embedded in checkout)
- Orchestrator tests must test business logic and coordination simultaneously
- Business rules are hard to find: they're in the orchestrator, not in the domain layer
- Orchestrator becomes a dumping ground for "workflow-adjacent" logic

**Detection**:
- Code review: orchestrator has `if` conditions that test business rules, not coordination conditions
- Code review: orchestrator calls services but also does inline calculations between calls
- Code review: extracting the inline logic to a sub-service would make the orchestrator testable

**Solution**:
- All domain logic must live in sub-services, not in the orchestrator
- The orchestrator's execute method should only contain: prepare input → call service → pass result to next service
- If you find yourself writing `if ($total > 100)`, extract that to a `DiscountService` or `PricingService`
- Test the orchestrator purely for sequencing and error handling — mock all sub-services

**Example**:
```php
// BEFORE: Domain logic in orchestrator
class CheckoutOrchestrator
{
    public function execute(CheckoutDto $dto): Order
    {
        $total = $this->calculateTotal($dto->items); // ❌ domain logic
        $discount = $dto->coupon ? $total * 0.1 : 0; // ❌ business rule inline
        $finalTotal = $total - $discount;
        return $this->placeOrder->execute($dto, $finalTotal);
    }

    private function calculateTotal(array $items): float { /* ... */ }
}

// AFTER: Pure coordination orchestrator
class CheckoutOrchestrator
{
    public function execute(CheckoutDto $dto): Order
    {
        $pricing = $this->pricingService->calculate($dto->items, $dto->coupon);
        return $this->placeOrder->execute($dto, $pricing);
    }
}
```
