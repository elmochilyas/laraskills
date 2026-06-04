# Action Class Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Action Class Patterns |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Action classes encapsulate single use-case operations as invocable, stateless PHP classes. They replace inline controller logic with a testable, single-responsibility boundary for cross-aggregate operations. The pattern provides a named, explicit entry point for every use case in the system, making orchestration visible and testable without coupling to HTTP concerns.

## Core Concepts

- **Single Invocable**: The `__invoke` magic method makes the action callable as a function, enabling direct route-to-action binding
- **Constructor Injection**: Dependencies are injected via constructor — never resolved inside the method body
- **Statelessness**: Actions hold no mutable state between invocations; each call is independent
- **Typed Results**: Actions return typed DTOs, models, or void — never `mixed` or raw arrays
- **Transaction Boundary**: Heavy actions wrap logic in `DB::transaction()` for atomicity

## When To Use

- The operation coordinates two or more aggregate roots
- The operation must succeed or fail atomically across multiple models
- The operation involves external side-effects (email, queue, API call)
- You need a named, testable entry point for a use case
- The logic would otherwise live in a fat controller or CLI command

## When NOT To Use

- The operation only reads or mutates a single model's own state (use a model method)
- The operation is a trivial CRUD save (3 lines in a controller)
- The only purpose is to make the controller thin — extract only when orchestration exists

## Best Practices

- **One action per use case**: Each action has exactly one reason to change. This ensures actions stay under 100 lines and remain testable in isolation.
- **Constructor injection only**: Using `app()` or `resolve()` inside the method body creates hidden dependencies that can't be mocked in tests and couples the action to the container at runtime.
- **Return typed results**: Typed DTOs or model instances make the contract explicit and enable static analysis. `mixed` return types hide the action's outcome.
- **Dispatch events after commit**: Using `DB::afterCommit()` ensures domain events only fire if the transaction succeeds, preventing inconsistent state.
- **Keep under 100 lines**: If an action exceeds 100 lines, it likely coordinates too much. Extract sub-operations into child actions or model methods.

## Architecture Guidelines

- Place actions in `App\Actions\{Domain}\{Verb}{Entity}Action.php`
- Name actions by what they do: `PayInvoiceAction`, `CancelSubscriptionAction`
- Actions should not extend a base class unless necessary (framework-agnostic)
- Sub-action composition is valid: `PlaceOrderAction` calls `GenerateShipmentAction`
- For queued actions, serialize only model keys — re-fetch in `handle()`

## Performance Considerations

- Action class resolution is negligible — one PHP object per request
- Queued actions must serialize minimal data (model keys, DTO), not full model instances
- Transaction time: Keep DB work short; move I/O outside the transaction

## Security Considerations

- Authorization checks should happen at the action boundary, not inside model methods
- Never pass raw request input to actions — validate with FormRequest first
- Log action entry/exit with correlation IDs for audit trails

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| `app()` inside action method | Convenience over discipline | Untestable hidden dependency | Constructor injection |
| Mutable action state | Reusing instance for multiple calls | Cross-request contamination | Stateless design, fresh resolution |
| Generic `array` return | Laziness or uncertainty | No contract for callers | Typed DTO or model return |
| Mixing sync + queue | Same action used both ways | Unexpected behavior in queue context | Separate sync vs queued actions |
| Base Action inheritance | "Framework" thinking | Tight coupling to base class | Plain PHP class with constructor injection |

## Anti-Patterns

- **God Action**: A single action handles multiple use-cases with `if/else` branching. One action per use case.
- **Action-as-Controller**: Action returns HTTP responses or handles request objects. Actions orchestrate; controllers handle HTTP.
- **Anemic Action**: Action contains all logic while models become property bags. Push domain logic down to models.
- **Action Proliferation**: 100+ trivial actions for simple CRUD. Use model methods for simple saves.

## Examples

```php
// Basic action with transaction and sub-action composition
class PayInvoiceAction
{
    public function __construct(
        private SendInvoiceReceiptAction $sendReceipt,
    ) {}

    public function __invoke(Invoice $invoice, PayInvoiceData $data): Payment
    {
        return DB::transaction(function () use ($invoice, $data) {
            $payment = $invoice->recordPayment(
                amount: $data->amount,
                method: $data->method
            );
            $this->sendReceipt->forPayment($payment);
            return $payment;
        });
    }
}
```

```php
// Queued action with model key serialization
class ProcessInvoiceAction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(
        private int $invoiceId,
        private array $payload,
    ) {}

    public function handle(): void
    {
        $invoice = Invoice::findOrFail($this->invoiceId);
        // processing logic
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | When to Use Actions |
| Closely Related | When Models Are Enough |
| Closely Related | Write Model Separation |
| Advanced | Framework Decoupling |

## AI Agent Notes

- When generating actions, always inject dependencies via constructor, never use `app()` inside methods
- Default to `__invoke` for single-entry-point actions; use `handle` for multi-method actions
- Always wrap cross-aggregate operations in `DB::transaction()`

## Verification

- [ ] Action is invocable (`__invoke` or `handle`)
- [ ] All dependencies are constructor-injected
- [ ] No `app()` or `resolve()` calls inside the method body
- [ ] Action returns typed result or void
- [ ] Action is tested with at least one outcome assertion
