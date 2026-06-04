# Action Composition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Action Composition
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Action composition is the practice of building complex business workflows by composing multiple action classes together. A composed action (or orchestrator) calls several sub-actions in sequence, each responsible for a single operation. This creates a hierarchy of testable, reusable units — the composed action coordinates, the sub-actions execute.

The engineering significance is that action composition enables complex workflows without creating monolithic action classes. Each sub-action is independently testable. The composed action only tests the coordination logic (sequencing, error handling, conditional execution). This is the same principle as function composition in functional programming — complex behavior emerges from simple, composable parts.

---

## Core Concepts

### Coordinator Action

A composed action that calls sub-actions:

```php
class OnboardUserAction
{
    public function __construct(
        private CreateUserAction $createUser,
        private SendWelcomeEmailAction $sendWelcome,
        private CreateDefaultTeamAction $createTeam,
    ) {}

    public function execute(OnboardUserDto $dto): User
    {
        $user = $this->createUser->execute($dto);
        $this->sendWelcome->execute($user);
        $this->createTeam->execute($user);
        return $user;
    }
}
```

The coordinator's responsibility is sequencing and error handling — not the individual operation logic.

### Pipeline Composition

Actions execute in sequence, passing results forward:

```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $reservation = $this->reserveInventory->execute($cart);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        $order = $this->createOrder->execute($cart, $payment);
        $this->sendConfirmation->execute($order);
        return $order;
    }
}
```

Each action receives the output of the previous step as input.

---

## Mental Models

### The Assembly Line

Actions are workstations on an assembly line. Each workstation does one thing: install the engine, attach the wheels, paint the body. The foreman (coordinator action) ensures the sequence is correct and handles exceptions.

### Function Composition

Action composition is function composition: `CreateOrder(SendConfirmation(ProcessPayment(ValidateCart(input))))`. Each function is pure (deterministic, no side effects beyond its scope). The composed function is the workflow.

---

## Internal Mechanics

### Dependency Tree

A composed action's constructor declares all sub-actions it calls. The container resolves the entire dependency tree recursively:

```php
OnboardUserAction
  ├── CreateUserAction
  │     ├── UserRepository
  │     └── PasswordHasher
  ├── SendWelcomeEmailAction
  │     ├── Mailer
  │     └── UserRepository
  └── CreateDefaultTeamAction
        ├── TeamRepository
        └── UserRepository
```

The container resolves each leaf dependency once and shares instances where possible (singletons).

---

## Patterns

### Sequential Composition

```php
class ProcessRefundAction
{
    public function execute(RefundDto $dto): void
    {
        $transaction = $this->validateRefund->execute($dto);
        $this->processPaymentRefund->execute($transaction);
        $this->updateOrderStatus->execute($transaction);
        $this->notifyCustomer->execute($dto);
    }
}
```

Steps execute in order. Failure at step 3 may require compensating actions for steps 1-2.

### Conditional Composition

```php
class UpdateOrderAction
{
    public function execute(UpdateOrderDto $dto): Order
    {
        $order = $this->findOrder->execute($dto->orderId);
        $order = $this->updateOrder->execute($order, $dto);
        if ($dto->shouldNotify) {
            $this->notifyCustomer->execute($order);
        }
        return $order;
    }
}
```

Sub-actions execute only when conditions are met.

### Loop Composition

```php
class ProcessBatchImportAction
{
    /** @param ImportRowDto[] $rows */
    public function execute(BatchImportDto $dto): BatchResult
    {
        $results = [];
        foreach ($dto->rows as $row) {
            try {
                $results[] = $this->importRow->execute($row);
            } catch (ImportException $e) {
                $results[] = ImportResult::failure($row, $e->getMessage());
            }
        }
        return new BatchResult($results);
    }
}
```

---

## Architectural Decisions

### Composition Depth Limit

Limit composition to 3-4 levels. Beyond that, the workflow is too complex for a single coordinator and should be modeled as a service or a state machine.

### Error Handling Responsibility

The coordinator action handles errors that affect the workflow (sequencing rollbacks). Sub-actions handle errors within their own scope (validation, business rule violations).

### Shared Context

Pass context through method parameters, not through shared mutable state:

```php
// Good: context passed explicitly
$user = $this->createUser->execute($dto);
$team = $this->createTeam->execute($user, $dto->teamName);

// Bad: context stored in property
$this->context->user = $user;
$this->createTeam->execute($dto->teamName);
```

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Sub-actions are independently testable | Coordinator action complexity scales with composition depth | Limit to 3-4 levels |
| Clear workflow sequence in coordinator | Coordinator must handle error propagation | Add compensation actions for rollback |
| Reusable sub-actions across workflows | Composed actions create deep dependency trees | Use container for dependency management |

---

## Performance Considerations

Each composed sub-action adds a container resolution + method call overhead. For a workflow with 5 sub-actions: ~0.05ms total. Database operations within each sub-action dominate performance — action composition overhead is irrelevant.

---

## Production Considerations

### Logging in Coordinators

Add logging at the coordinator level to trace workflow execution:

```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        Log::debug('Checkout started', ['cart_id' => $dto->cartId]);
        $order = /* composed actions */;
        Log::info('Checkout completed', ['order_id' => $order->id]);
        return $order;
    }
}
```

### Testing Coordinators

Test the coordinator by mocking sub-actions:

```php
public function test_onboarding_creates_user_and_team_and_sends_email()
{
    $createUser = $this->createMock(CreateUserAction::class);
    $sendEmail = $this->createMock(SendWelcomeEmailAction::class);
    $createTeam = $this->createMock(CreateDefaultTeamAction::class);

    $action = new OnboardUserAction($createUser, $sendEmail, $createTeam);
    // Assert each sub-action is called in sequence
}
```

---

## Common Mistakes

### Coordinator Doing Sub-Action Work
Why it happens: The coordinator contains logic that belongs in a sub-action because "it's just a few lines." Why it's harmful: The coordinator is no longer pure coordination — it mixes levels of abstraction. Better approach: Extract every distinct operation to its own action class.

### Shared Mutable State Between Actions
Why it happens: Using a shared context object or class property to pass data between composed actions. Why it's harmful: Hidden coupling — changing one action's data expectations breaks downstream actions. Better approach: Pass data explicitly through method parameters and return values.

### Ignoring Error Handling at Composition Level
Why it happens: Assuming sub-actions always succeed or that the caller will handle errors. Why it's harmful: A failure in sub-action 3 leaves sub-actions 1-2 committed, causing partial state. Better approach: Use transactions in the coordinator or add compensating actions.

---

## Failure Modes

### Deep Composition Without Error Recovery
A 6-level deep composition where any sub-action failure leaves the system in an inconsistent state. The coordinator has no rollback logic for steps 1-4 when step 5 fails. Mitigate with database transactions at the coordinator level.

### Composition Without Reusability
Sub-actions are written specifically for one coordinator and cannot be called independently. The composition provides no reuse benefit — it's just a monolithic action split into files. Each sub-action should be independently testable and callable.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream's `CreateTeam` action composes multiple sub-operations: creating the team, attaching the owner, and initializing team settings. The composition is contained in a single action class.

### E-Commerce Platforms
Production e-commerce platforms use action composition extensively — a checkout action composes validation, inventory, payment, order creation, and notification actions.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — Single action class patterns
- Service Container — Dependency resolution for composed actions

### Related Topics
- Transactional Actions — Transaction boundaries in composed workflows
- Service Orchestration — Service-level coordination (alternative to action composition)

### Advanced Follow-up Topics
- Saga Pattern — Long-running transaction composition with compensating actions
- Pipeline Pattern — Middleware-style action processing

---

## Research Notes

### Source Analysis
- Jetstream: Composed actions for team management workflows
- E-commerce codebases: Checkout workflows composed from 5-10 sub-actions
- Functional programming: Function composition principles applied to action classes

### Key Insight
Action composition is the primary mechanism for building complex workflows from simple, testable units. The key discipline is ensuring each sub-action is independently useful — if the only caller of a sub-action is the coordinator, the sub-action may not justify its own class.

### Version-Specific Notes
- PHP 8.0+: Constructor promotion makes action composition DI declarations minimal
- No Laravel version-specific changes to composition patterns
