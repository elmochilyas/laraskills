# Service Orchestration — Rules

## Rule 1: Orchestrators Must Be Pure Coordination — No Domain Logic
---
## Category
Architecture
---
## Rule
Never implement business rules, data transformations, or validation inside an orchestrator; all domain logic belongs in sub-services or actions.
---
## Reason
An orchestrator with inline business logic is a god class — it violates single responsibility and makes sub-services untestable in isolation because business rules are hidden in the coordinator.
---
## Bad Example
```php
class OnboardingOrchestrator
{
    public function onboard(OnboardingDto $dto): User
    {
        if ($dto->plan === 'enterprise' && $dto->companySize < 50) { // ❌ Business rule
            throw new \DomainException('Enterprise plan requires 50+ employees');
        }
        $user = $this->users->create($dto);
        return $user;
    }
}
```
---
## Good Example
```php
class OnboardingOrchestrator
{
    public function onboard(OnboardingDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = $this->users->create($dto);
            $this->teams->createDefault($user);
            $this->preferences->setDefaults($user);
            return $user;
        });
    }
}
// Business rules enforced in the UserService::create method
```
---
## Exceptions
No common exceptions. Orchestrators coordinate; they do not decide.
---
## Consequences Of Violation
God orchestrator, untestable sub-services, business rules hidden in orchestration layer.
</rule>

## Rule 2: Only Create Orchestrators for 3+ Services
---
## Category
Architecture
---
## Rule
Never create an orchestrator for workflows involving fewer than 3 services; use action composition or direct service calls for simpler workflows.
---
## Reason
An orchestrator that coordinates 1-2 services adds ceremony without value — the controller or a service method can call the sub-services directly. Orchestration overhead is justified only when the coordination complexity warrants dedicated management.
---
## Bad Example
```php
class CreateUserOrchestrator // ❌ Orchestrates only 2 services
{
    public function execute(CreateUserDto $dto): User
    {
        $user = $this->users->create($dto);
        $this->mailer->sendWelcome($user);
        return $user;
    }
}
// Controller or UserService can do this directly
```
---
## Good Example
```php
class CheckoutOrchestrator // ✅ 4+ services — orchestrator justified
{
    public function checkout(CheckoutDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $cart = $this->cartService->validate($dto->cartId);
            $payment = $this->paymentService->charge($cart->total);
            $order = $this->orderService->create($cart, $payment);
            $this->inventoryService->reserve($dto->items);
            $this->notificationService->sendConfirmation($order);
            return $order;
        });
    }
}
```
---
## Exceptions
Workflows with complex error handling or compensation requirements may justify an orchestrator even with 2 services.
---
## Consequences Of Violation
Over-engineering, unnecessary layers, orchestrators that just forward to 1-2 services.
</rule>

## Rule 3: Always Implement Error Handling and Compensation Paths
---
## Category
Reliability
---
## Rule
Never write an orchestrator without error handling, rollback, or compensating actions for each sub-service call.
---
## Reason
In a multi-step orchestration, a failure at step 4 may leave steps 1-3 committed. Without compensation, the system is in an inconsistent state that requires manual data repair.
---
## Bad Example
```php
class RefundOrchestrator
{
    public function refund(RefundDto $dto): void
    {
        $this->payments->reverse($dto->transactionId);
        $this->orders->markRefunded($dto->orderId);
        $this->inventory->restock($dto->orderId);
        $this->notifier->sendRefundAlert($dto->orderId);
        // ❌ No transaction, no rollback, no compensation
    }
}
```
---
## Good Example
```php
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
## Exceptions
Read-only orchestrations (aggregating data) do not need rollback, but still need error handling for failed data sources.
---
## Consequences Of Violation
Partial workflow commits, data inconsistency, manual data repair, financial reconciliation failures.
</rule>

## Rule 4: Test Orchestrators with Mocked Sub-Services
---
## Category
Testing
---
## Rule
Always test orchestrators by mocking all sub-services and asserting call sequence and data passing, never with real service implementations.
---
## Reason
Orchestrator tests verify coordination, not business logic. Mocking isolates the orchestration logic and runs in milliseconds without database or external service setup.
---
## Bad Example
```php
public function test_onboarding(): void
{
    // ❌ Real services — slow, tests both orchestrator and sub-service logic
    $result = $this->orchestrator->onboard($dto);
    $this->assertDatabaseHas('users', ['email' => 'test@test.com']);
}
```
---
## Good Example
```php
public function test_onboarding_sequence(): void
{
    $this->userService->expects($this->once())
        ->method('create')
        ->willReturn(new User(['id' => 1]));
    $this->teamService->expects($this->once())
        ->method('createDefault')
        ->with($this->callback(fn($u) => $u->id === 1));
    $this->preferenceService->expects($this->once())
        ->method('setDefaults')
        ->with($this->callback(fn($u) => $u->id === 1));

    $result = $this->orchestrator->onboard($dto);
}
```
---
## Exceptions
No common exceptions. Orchestrator tests always mock sub-services.
---
## Consequences Of Violation
Slow flaky tests, tests that fail when unrelated sub-services change, no separation between coordination and business logic testing.
</rule>

## Rule 5: Add Logging at the Orchestrator Level
---
## Category
Observability
---
## Rule
Always add structured logging at the orchestrator level to trace workflow execution, sub-service call timing, and failure points.
---
## Reason
Orchestrators are the failure point for entire workflows. Without orchestrator-level logging, a failure in step 3 of 5 appears as a generic error with no context about which step failed or what data was involved.
---
## Bad Example
```php
class RefundOrchestrator
{
    public function refund(RefundDto $dto): void
    {
        $this->payments->reverse($dto->transactionId);
        $this->orders->markRefunded($dto->orderId);
        $this->inventory->restock($dto->orderId);
        // ❌ No logging — failure produces unhelpful trace
    }
}
```
---
## Good Example
```php
class RefundOrchestrator
{
    public function refund(RefundDto $dto): void
    {
        Log::info('Refund workflow started', ['transaction_id' => $dto->transactionId]);

        $this->payments->reverse($dto->transactionId);
        Log::info('Payment reversed');

        $this->orders->markRefunded($dto->orderId);
        Log::info('Order marked refunded');

        $this->inventory->restock($dto->orderId);
        Log::info('Inventory restocked');

        Log::info('Refund workflow completed');
    }
}
```
---
## Exceptions
Extremely high-throughput orchestrators may reduce logging verbosity but must keep error logging for failures.
---
## Consequences Of Violation
Inability to diagnose production failures, no audit trail for financial operations, extended MTTR (mean time to repair).
</rule>
