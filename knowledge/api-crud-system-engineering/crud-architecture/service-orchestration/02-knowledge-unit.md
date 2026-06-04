# Service Orchestration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Service Orchestration
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Service orchestration is the pattern of coordinating multiple services, actions, and external systems to complete a complex business workflow. An orchestrator service calls several sub-services in sequence, manages transaction boundaries, handles errors, and determines the workflow outcome. This is distinct from action composition because the orchestrated units are full services (each with multiple methods) rather than single-purpose actions.

The engineering significance is that orchestration centralizes workflow logic in one place. Without orchestration, each service calls other services directly — creating a web of hidden dependencies where no class owns the overall workflow. With orchestration, the orchestrator owns the sequence, and each sub-service remains focused on its domain capability.

---

## Core Concepts

### Orchestrator Service

A service whose primary responsibility is calling other services in the correct sequence:

```php
class CheckoutOrchestrator
{
    public function __construct(
        private CartService $cart,
        private InventoryService $inventory,
        private PaymentService $payment,
        private OrderService $orders,
        private NotificationService $notifier,
    ) {}

    public function checkout(CheckoutDto $dto): Order
    {
        $cart = $this->cart->getActiveCart($dto->userId);
        $this->inventory->reserve($cart->items());
        $charge = $this->payment->charge($cart->total(), $dto->paymentMethod);
        $order = $this->orders->createFromCart($cart, $charge);
        $this->notifier->sendConfirmation($order);
        return $order;
    }
}
```

### Orchestration vs Composition

| Aspect | Service Orchestration | Action Composition |
|--------|----------------------|-------------------|
| Unit size | Full services (multi-method) | Single actions (single-method) |
| Scope | Cross-domain workflows | Intra-domain workflows |
| Error handling | Saga/compensation patterns | Transaction rollback |
| When to use | 3+ services involved | 2-4 actions within a domain |

---

## Mental Models

### The Conductor

The orchestrator is a conductor. The conductor doesn't play an instrument — they coordinate the musicians (services) to produce a symphony (workflow). Each musician knows their part; the conductor knows the sequence.

### The Workflow Chart

An orchestrator is the executable version of a workflow chart. Each step in the chart corresponds to a service call. The orchestrator ensures the chart is followed exactly.

---

## Internal Mechanics

### Orchestration Flow

An orchestrator calls sub-services in a defined sequence. Each sub-service call is a synchronous method invocation resolved by the container. The orchestrator is resolved with all its sub-service dependencies injected via the constructor. When `CheckoutOrchestrator::checkout()` is called, each service method executes in order — cart lookup, inventory reservation, payment charge, order creation, notification.

### Multi-Step Coordination

Coordination involves sequencing (step A must complete before step B), conditional branching (if plan is enterprise, enable features), data passing (output of one service becomes input to the next), and error handling (if payment fails, release inventory reservation). Each coordination concern is explicit in the orchestrator method.

### Transaction Management

Database transactions wrap the orchestration sequence to ensure atomicity. If any step fails, the transaction rolls back all database changes. For external system calls (payment gateways, email APIs), compensating actions are needed because database rollback cannot undo an API call. Compensation patterns include voiding transactions, sending failure notifications, and flagging for manual review.

---

## Patterns

### Sequential Orchestration

```php
class UserOnboardingOrchestrator
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
```

### Conditional Orchestration

```php
class SubscriptionOrchestrator
{
    public function changePlan(ChangePlanDto $dto): Subscription
    {
        $subscription = $this->billing->findSubscription($dto->userId);

        if ($dto->plan === 'enterprise') {
            $this->features->enableAll($subscription);
        }

        $this->billing->updatePlan($subscription, $dto->plan);
        $this->audit->logPlanChange($subscription, $dto->plan);
        return $subscription;
    }
}
```

### Orchestration with Compensation

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
            // Compensating actions for external systems
            $this->payments->flagForManualReview($dto->transactionId);
            $this->notifier->sendRefundAlert($dto->orderId);
            throw $e;
        }
    }
}
```

---

## Architectural Decisions

### Orchestrator Location

Place orchestrators at the application layer, not in the domain layer. They coordinate, not implement. Recommended location: `App\Orchestrators\` or `App\Services\Orchestration\`.

### Orchestrator vs Service

A service orchestrates within its domain (e.g., `OrderService` coordinates order creation). An orchestrator coordinates across domains (e.g., `CheckoutOrchestrator` coordinates cart, inventory, payment, and notification services). The distinction is cross-domain vs intra-domain.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized workflow — one class owns the sequence | Orchestrator dependencies list can grow large | Keep orchestrators focused on coordination only |
| Sub-services remain domain-focused | Orchestrator becomes the failure point | Add monitoring and error handling at orchestration level |
| Clear audit trail — workflow steps are visible | Over-orchestration — creating orchestrators for simple 2-step workflows | Only orchestrate when 3+ services are involved |

---

## Performance Considerations

Orchestration adds no direct performance overhead — it's just method calls. The performance profile is the sum of all sub-service operations. For slow sub-operations, consider dispatching them to the queue from within the orchestrator.

---

## Production Considerations

### Monitoring in Orchestrators

Add logging at the orchestrator level to trace workflow execution:

```php
public function checkout(CheckoutDto $dto): Order
{
    Log::info('Checkout started', ['user' => $dto->userId]);
    $order = // orchestration steps
    Log::info('Checkout completed', ['order' => $order->id]);
    return $order;
}
```

### Orchestrator Testing

Test orchestrators by mocking sub-services:

```php
public function test_checkout_creates_order()
{
    $cartService = $this->createMock(CartService::class);
    $paymentService = $this->createMock(PaymentService::class);
    $orchestrator = new CheckoutOrchestrator(
        $cartService, $inventoryService, $paymentService, ...
    );
    $order = $orchestrator->checkout($dto);
    $this->assertInstanceOf(Order::class, $order);
}
```

---

## Common Mistakes

### Orchestrator Doing Sub-Service Work
Why it happens: Adding domain logic to the orchestrator because it's "easier than creating a service method." Why it's harmful: The orchestrator becomes a god class with both coordination and domain logic. Better approach: Keep orchestrators pure coordination — all domain logic belongs in sub-services.

### Over-Orchestration
Why it happens: Creating orchestrator classes for every multi-step operation, even 2-step workflows. Why it's harmful: Unnecessary indirection. A service calling 2 sub-methods is not orchestration — it's service composition. Better approach: Reserve orchestrators for workflows involving 3+ services.

### Orchestrator Without Error Handling
Why it happens: Assuming sub-services never fail or that the caller will handle errors. Why it's harmful: Partial workflow execution with no compensation. Better approach: Handle failures at the orchestrator level with rollback or compensating actions.

---

## Failure Modes

### Orchestrator God Class
An orchestrator that coordinates 8+ services, contains error handling for each, and has accumulated conditional logic for various workflow paths. The class is unreadable and untestable. Split into sub-orchestrators or extract workflow steps into individual coordinator actions.

### Missing Compensation
A 5-step orchestration where step 4 fails but steps 1-3 have already committed. No compensation logic exists. The system is in an inconsistent state. Mitigate: Use database transactions where possible, add compensating actions for external system calls.

---

## Ecosystem Usage

### Monica CRM
Monica uses orchestrator-like services for complex contact management workflows — creating contacts with relationships, activities, and reminders in a single orchestrated flow.

### E-Commerce Platforms
Checkout orchestration is the canonical example — coordinating cart, inventory, payment, order, and notification services in sequence.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — Service patterns that orchestrators coordinate
- Action Composition — Composition at the action level (lighter alternative)

### Related Topics
- Service vs Action Decision — Choosing orchestration level
- Transaction Management — Transaction boundaries in orchestration

### Advanced Follow-up Topics
- Saga Pattern — Long-running orchestration with compensating transactions
- Event-Driven Orchestration — Using events instead of direct service calls

---

## Research Notes

### Source Analysis
- Monica CRM: Orchestrator-like coordination in contact workflows
- E-commerce platforms: Checkout orchestration as the canonical example
- DDD literature: Application services as orchestrators of domain services

### Key Insight
Service orchestration is the highest level of coordination in a service-oriented architecture. It should be used sparingly — only when cross-domain workflows require centralized sequencing. Most CRUD operations don't need orchestration; they need simple action composition or single-service delegation.

### Version-Specific Notes
- No Laravel version-specific changes to orchestration patterns
- Orchestration is an architectural pattern, not a framework feature
