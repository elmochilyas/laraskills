# Architectural Decision Rules: Action Class Patterns

---

## Rule 1: Prefer `__invoke` for single-entry-point actions
---
## Category
Code Organization
---
## Rule
Prefer `__invoke` as the sole public method when an action has exactly one entry point. Use a named method (`handle`, `execute`) only when the action needs multiple public methods or implements a framework contract like `ShouldQueue`.
---
## Reason
`__invoke` enables direct route-to-action binding (`Route::post('/pay', PayInvoiceAction::class)`) and signals clearly that the class has a single responsibility. Named methods on single-purpose classes are redundant ceremony.
---
## Bad Example
```php
class PayInvoiceAction
{
    public function execute(Invoice $invoice, PayInvoiceData $data): Payment
    {
        // single operation
    }
}
// Route: Route::post('/pay', [PayInvoiceAction::class, 'execute'])
```
---
## Good Example
```php
class PayInvoiceAction
{
    public function __invoke(Invoice $invoice, PayInvoiceData $data): Payment
    {
        // single operation
    }
}
// Route: Route::post('/pay', PayInvoiceAction::class)
```
---
## Exceptions
When the action implements `ShouldQueue` and needs `handle()` as the queue entry point. When the action has multiple public methods for related sub-operations.
---
## Consequences Of Violation
Unnecessary method naming ceremony; missed opportunity for cleaner route binding; reduced readability for single-purpose classes.

---

## Rule 2: Never use `app()` or `resolve()` inside action methods
---
## Category
Maintainability
---
## Rule
Never resolve dependencies inside an action method body using `app()`, `resolve()`, or `make()`. Inject all dependencies through the constructor.
---
## Reason
Container calls inside method bodies create hidden dependencies that cannot be mocked or substituted in tests. The class signature no longer documents its actual requirements, making the action harder to understand and test.
---
## Bad Example
```php
class ProcessRefundAction
{
    public function __invoke(Refund $refund): void
    {
        $gateway = app(PaymentGateway::class);
        $gateway->refund($refund);
    }
}
```
---
## Good Example
```php
class ProcessRefundAction
{
    public function __construct(
        private PaymentGateway $gateway,
    ) {}

    public function __invoke(Refund $refund): void
    {
        $this->gateway->refund($refund);
    }
}
```
---
## Exceptions
When the dependency is conditionally resolved based on a runtime value that cannot be known at construction time, use a factory pattern injected via constructor instead.
---
## Consequences Of Violation
Untestable action code; hidden coupling to the service container; test doubles cannot replace the resolved dependency; PHPStan cannot detect missing dependencies.

---

## Rule 3: Always wrap cross-aggregate operations in `DB::transaction()`
---
## Category
Reliability
---
## Rule
Always wrap operations that modify two or more aggregate roots in `DB::transaction()` to ensure atomicity.
---
## Reason
Cross-aggregate operations risk partial writes if an exception occurs mid-way. Without a transaction, some models may be persisted while others remain unchanged, leaving the system in an inconsistent state.
---
## Bad Example
```php
class PlaceOrderAction
{
    public function __invoke(Order $order, Cart $cart): void
    {
        $order->markAsPlaced();
        $cart->clear();
        // If clear() fails, order is placed but cart still has items
    }
}
```
---
## Good Example
```php
class PlaceOrderAction
{
    public function __invoke(Order $order, Cart $cart): void
    {
        DB::transaction(function () use ($order, $cart) {
            $order->markAsPlaced();
            $cart->clear();
        });
    }
}
```
---
## Exceptions
Read-only operations. Single-model mutations where the model's `save()` is the only write. Long-running operations that would hold the transaction open — use a queue instead.
---
## Consequences Of Violation
Partial writes causing data inconsistency; unrecoverable state where some aggregates reflect the operation and others do not; silent data corruption that may surface days later.

---

## Rule 4: Return typed results from actions, never `mixed` or raw arrays
---
## Category
Maintainability
---
## Rule
Always declare an explicit return type on action methods: a DTO, a Model instance, `void`, or `bool`. Never use `mixed` or return raw arrays without a documented contract.
---
## Reason
Typed return values make the action's contract explicit to callers and enable static analysis to catch usage errors. `mixed` hides the action's outcome and forces every caller to guess what shape the return value has.
---
## Bad Example
```php
class CalculateTotalsAction
{
    public function __invoke(Order $order): array
    {
        return [
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
        ];
    }
}
```
---
## Good Example
```php
class CalculateTotalsAction
{
    public function __invoke(Order $order): OrderTotals
    {
        return new OrderTotals(
            subtotal: $order->subtotal,
            tax: $order->tax,
            total: $order->total,
        );
    }
}
```
---
## Exceptions
When returning a collection of models from a query action, return `Collection` or `LengthAwarePaginator` as appropriate.
---
## Consequences Of Violation
Callers cannot statically determine what the action returns; runtime errors when array keys change; increased testing burden to document contracts implicitly.

---

## Rule 5: Dispatch domain events with `DB::afterCommit()`, not immediately
---
## Category
Reliability
---
## Rule
Use `DB::afterCommit()` to dispatch domain events so they fire only after the current transaction successfully commits. Do not dispatch events inline during a transaction.
---
## Reason
Events dispatched inside an open transaction fire even if the transaction later rolls back, causing side-effects (emails, queue jobs) based on state that was never persisted. `afterCommit()` ensures events are only dispatched on successful commits.
---
## Bad Example
```php
class PayInvoiceAction
{
    public function __invoke(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->markAsPaid();
            event(new InvoicePaid($invoice)); // Fires even if transaction rolls back
        });
    }
}
```
---
## Good Example
```php
class PayInvoiceAction
{
    public function __invoke(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->markAsPaid();
            DB::afterCommit(fn () => event(new InvoicePaid($invoice)));
        });
    }
}
```
---
## Exceptions
Events that must fire regardless of transaction outcome (e.g., audit logs that record the attempt itself).
---
## Consequences Of Violation
Side-effects from rolled-back transactions; phantom emails and queue jobs; difficult-to-debug inconsistencies between sent notifications and actual database state.

---

## Rule 6: Limit actions to one use case and under 100 lines
---
## Category
Maintainability
---
## Rule
Keep each action class to a single use case and a maximum of 100 lines. When an action exceeds this limit, extract sub-operations into child actions or push logic down to model methods.
---
## Reason
Actions beyond 100 lines typically coordinate too much or contain implementation details that belong elsewhere. Single-use-case actions are independently testable, have one reason to change, and remain comprehensible without scrolling.
---
## Bad Example
```php
class ProcessOrderAction
{
    public function __invoke(Order $order): void
    {
        // 150 lines: validates inventory, charges card, creates shipment,
        // sends email, updates analytics, generates invoice, logs audit
    }
}
```
---
## Good Example
```php
class ProcessOrderAction
{
    public function __construct(
        private ChargePaymentAction $chargePayment,
        private GenerateShipmentAction $generateShipment,
        private SendOrderConfirmationAction $sendConfirmation,
    ) {}

    public function __invoke(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->validateInventory();
            $this->chargePayment->forOrder($order);
            $this->generateShipment->forOrder($order);
            $order->markAsPlaced();
        });
        $this->sendConfirmation->forOrder($order);
    }
}
```
---
## Exceptions
Actions containing complex validation or multi-step workflows where each step is already delegated to model methods. In such cases, the 100-line limit can be extended to 150 lines.
---
## Consequences Of Violation
God actions with multiple reasons to change; reduced reusability; difficult testing (more setup needed per test); action becomes a dumping ground for related logic.

---

## Rule 7: Never pass raw request input to actions — use validated DTOs
---
## Category
Security
---
## Rule
Always validate request input in a FormRequest before passing data to an action. Use DTOs or validated arrays — never pass `$request->all()` or the `Request` object itself.
---
## Reason
Actions receiving raw input are coupled to HTTP and cannot be reused from CLI, queues, or tests. Untrusted input reaching an action bypasses validation and enables injection attacks.
---
## Bad Example
```php
class RegisterUserAction
{
    public function __invoke(Request $request): User
    {
        return User::create($request->all());
    }
}
```
---
## Good Example
```php
class RegisterUserAction
{
    public function __invoke(RegisterUserData $data): User
    {
        return User::create([
            'name' => $data->name,
            'email' => $data->email,
        ]);
    }
}
```
---
## Exceptions
Prototyping or spike code where validation is not yet defined. Must be refactored before production deployment.
---
## Consequences Of Violation
Action is unusable outside HTTP context; mass-assignment vulnerabilities; hidden coupling to request structure; cannot test action without faking HTTP request objects.

---

## Rule 8: Use `#[Override]` attribute on action methods that implement interface contracts
---
## Category
Maintainability
---
## Rule
Use the PHP 8.3 `#[Override]` attribute on action methods that override or implement interface methods to make the contract relationship explicit.
---
## Reason
`#[Override]` documents intent and enables static analysis to catch signature drift: if the parent/interface changes and the action method is not updated, PHPStan will flag it. This prevents silent contract violations.
---
## Bad Example
```php
class PayInvoiceAction
{
    public function __invoke(Invoice $invoice): Payment
    {
        // No indication this implements an interface
    }
}
```
---
## Good Example
```php
class PayInvoiceAction implements InvoicePaymentAction
{
    public function __construct(
        private SendInvoiceReceiptAction $sendReceipt,
    ) {}

    #[Override]
    public function __invoke(Invoice $invoice): Payment
    {
        return $this->sendReceipt->forPayment($payment);
    }
}
```
---
## Exceptions
When the action does not implement an interface or extend a parent class.
---
## Consequences Of Violation
Interface changes silently break the action; refactoring tools cannot trace overridden methods; contract drift goes undetected until runtime.
