# Action Composition — Rules

## Rule 1: Coordinator Delegates All Business Logic
---
## Category
Architecture
---
## Rule
Never implement business logic, validation, or data transformation inside a coordinator action; it must only sequence and delegate to sub-actions.
---
## Reason
The coordinator's sole responsibility is workflow orchestration. Adding inline logic violates single responsibility and makes sub-actions untestable in isolation.
---
## Bad Example
```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = Cart::find($dto->cartId); // ❌ Logic belongs in sub-action
        if ($cart->total < 0) {
            throw new \DomainException('Invalid cart');
        }
        return $this->createOrder->execute($cart);
    }
}
```
---
## Good Example
```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        return $this->createOrder->execute($cart, $payment);
    }
}
```
---
## Exceptions
Simple data transformation between sub-action outputs (mapping one DTO to another) is acceptable in the coordinator.
---
## Consequences Of Violation
Bloated coordinator, untestable sub-actions, business logic hidden in orchestration layer.
</rule>

## Rule 2: Limit Composition Depth to 3-4 Levels
---
## Category
Maintainability
---
## Rule
Never compose actions beyond 3-4 levels of nesting; extract to a service or state machine when depth exceeds this limit.
---
## Reason
Deep composition chains become impossible to follow during debugging, error propagation becomes unpredictable, and test setup requires excessive mocking.
---
## Bad Example
```php
// 6-level deep composition — impossible to trace
$result = $this->step1
    ->execute($this->step1a
        ->execute($this->step1b
            ->execute($this->step1c
                ->execute($dto))));
```
---
## Good Example
```php
// 3 levels — coordinator calls sub-actions, each sub-action may call helpers
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        return $this->createOrder->execute($cart, $payment);
    }
}
```
---
## Exceptions
No common exceptions. Deep composition is always a design smell that should be addressed immediately.
---
## Consequences Of Violation
Untestable workflows, debugging nightmares, high cognitive load for new team members.
</rule>

## Rule 3: Pass Context Through Method Parameters Only
---
## Category
Architecture
---
## Rule
Never use shared mutable state, class properties, or context objects to pass data between composed actions.
---
## Reason
Shared state creates hidden coupling between actions, breaks test isolation, and makes the execution order-dependent. Method parameters make data flow explicit.
---
## Bad Example
```php
class CheckoutAction
{
    private array $context = [];

    public function execute(CheckoutDto $dto): Order
    {
        $this->context['cart'] = $this->validateCart->execute($dto->cartId); // ❌ Shared state
        $this->context['payment'] = $this->processPayment->execute($dto->payment);
        return $this->createOrder->execute();
    }
}
```
---
## Good Example
```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        return $this->createOrder->execute($cart, $payment);
    }
}
```
---
## Exceptions
No common exceptions. Method parameters are always preferred over shared context objects.
---
## Consequences Of Violation
Order-dependent execution, tests that pass in isolation but fail in sequence, debugging impossibility when context is modified unexpectedly.
</rule>

## Rule 4: Ensure Each Sub-Action Is Independently Testable
---
## Category
Testing
---
## Rule
Every sub-action must be testable in isolation without the coordinator, with its own DTO input, return value, and defined behavior.
---
## Reason
Sub-actions that only exist for one coordinator and cannot be tested independently indicate a design problem — the sub-action should be merged into the coordinator or doesn't justify its own class.
---
## Bad Example
```php
class SendWelcomeEmailAction
{
    public function __construct(
        private CreateUserAction $createUser, // ❌ Depends on unrelated action
    ) {}
}
```
---
## Good Example
```php
class SendWelcomeEmailAction
{
    public function __construct(
        private UserMailer $mailer,
    ) {}

    public function execute(UserDto $user): void
    {
        $this->mailer->sendWelcome($user);
    }
}
// Testable with a mocked mailer, no coordinator needed
```
---
## Exceptions
No common exceptions. Every sub-action must justify its existence through independent utility.
---
## Consequences Of Violation
Fragile test suites, tightly coupled sub-actions, fear of changing one sub-action because it breaks others.
</rule>

## Rule 5: Add Error Handling at the Coordinator Level
---
## Category
Reliability
---
## Rule
Always implement error handling, rollback, or compensating actions in the coordinator for the composed workflow, not in individual sub-actions.
---
## Reason
Sub-actions handle their own domain errors. The coordinator handles workflow-level failures — when step 2 fails after step 1 succeeded, the coordinator must decide what to roll back.
---
## Bad Example
```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        $order = $this->createOrder->execute($cart, $payment);
        $this->sendConfirmation->execute($order);
        return $order;
        // No error handling — failure at sendConfirmation leaves committed order
    }
}
```
---
## Good Example
```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $cart = $this->validateCart->execute($dto->cartId);
            $payment = $this->processPayment->execute($dto->payment, $cart->total);
            $order = $this->createOrder->execute($cart, $payment);
            $this->sendConfirmation->execute($order);
            return $order;
        });
    }
}
```
---
## Exceptions
Read-only compositions (aggregating data from multiple sources) do not need transaction-level error handling.
---
## Consequences Of Violation
Partial workflow commits, data inconsistency, manual data repair operations after production failures.
</rule>

## Rule 6: Test Coordinators with Mocked Sub-Actions
---
## Category
Testing
---
## Rule
Test coordinator workflows by mocking all sub-actions and asserting call sequence and data passing; do not test sub-action logic again at the coordinator level.
---
## Reason
Coordinator tests should verify orchestration (correct sequence, correct data passed), not re-test sub-action behavior. Mocking isolates the coordinator's coordination logic.
---
## Bad Example
```php
public function test_checkout_creates_order(): void
{
    // ❌ Testing full integration — coordinator + all sub-actions
    $action = app(CheckoutAction::class);
    $result = $action->execute($dto);
    $this->assertDatabaseHas('orders', [/* ... */]);
}
```
---
## Good Example
```php
public function test_checkout_sequences_sub_actions(): void
{
    $cart = new CartDto(/* ... */);
    $this->validateCartMock->expects($this->once())
        ->method('execute')
        ->willReturn($cart);
    $this->processPaymentMock->expects($this->once())
        ->method('execute')
        ->with($this->paymentDto, $cart->total)
        ->willReturn(new PaymentResult(/* ... */));
    $this->createOrderMock->expects($this->once())
        ->method('execute')
        ->willReturn(new Order(/* ... */));

    $result = $this->coordinator->execute($dto);
}
```
---
## Exceptions
No common exceptions. Sub-action logic must be tested in its own test suite.
---
## Consequences Of Violation
Slow integration tests that don't isolate failures, tests that break when unrelated sub-actions change, no clear test ownership.
</rule>
