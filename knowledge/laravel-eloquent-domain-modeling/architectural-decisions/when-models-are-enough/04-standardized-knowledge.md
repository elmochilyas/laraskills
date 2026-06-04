# When Models Are Enough

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When Models Are Enough |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Eloquent models are sufficient — and preferable — when the operation stays within the boundary of a single aggregate. Putting logic directly on the model (as methods, accessors, mutators, or scopes) keeps the domain visible, reduces indirection, and avoids premature abstraction. The rule: if the operation reads or mutates that model's own state (and optionally touches immediate owned relations), it belongs on the model.

## Core Concepts

- **Within-aggregate operation**: Logic that only references properties and methods of a single aggregate root and its owned children
- **Model method**: A public method on an Eloquent model performing domain logic using `$this->attribute`
- **Active Record domain logic**: Domain logic living alongside persistence in the same class — the Laravel convention
- **Anemic domain model**: A model class with only properties and getters/setters, all logic in services

## When To Use

- The operation only reads or writes `$this` attributes
- The operation touches owned relationships (hasMany, morphMany) within the same aggregate boundary
- The operation has a single obvious return (boolean, the model itself, a computed value)
- The operation expresses a domain concept (markAsPaid, isOverdue, hasExpired)

## When NOT To Use

- The operation coordinates two or more aggregate roots
- The operation requires external side-effects (email, API calls, queue dispatch)
- The model would exceed 200-300 lines of domain logic
- The same logic is needed in multiple different contexts that don't share the model

## Best Practices

- **Keep model methods pure**: Model methods should only reference `$this` attributes and owned relations. Calling `Mail::to()`, `dispatch()`, or external services inside a model method creates hidden dependencies and breaks testability.
- **Raise events for side effects**: If a model method needs to trigger side effects, dispatch an event rather than calling the external service directly. This keeps the model focused on domain logic.
- **Stay under ~300 lines per model**: When a model exceeds this, extract related groups of methods into traits (using the `boot{TraitName}` convention) or split into value objects.
- **Use explicit state methods**: `markAsPaid()`, `archive()`, `approve()` instead of `$model->update(['status' => 'paid'])`. Explicit methods document the domain and provide a single point of change.

## Architecture Guidelines

- Accessors and mutators for computed/transformed values
- Local scopes for reusable query filters
- Model methods for state-changing operations
- Custom casts for value object mapping
- Let controllers/actions manage the transaction; model methods call `$this->save()` within their logic

## Performance Considerations

- Accessors run on every read — cache computed values via `shouldCache` on `Attribute::make`
- Mutators run on every write — expensive transformations (hashing, API calls) should be extracted to actions/jobs
- Model methods don't add extra PHP classes to load — trivial benefit over actions

## Security Considerations

- Model methods should not call external services or dispatch jobs (creates hidden side effects)
- Never pass raw request data directly to model methods — validate first
- Mass-assignable attributes should still be guarded; model methods should use explicit assignment

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Action class for one-line state change | Over-engineering | Extra file with no benefit | Use model method |
| HTTP/storage concerns in model methods | Convenience | Hidden side effects, hard to test | Extract to events or actions |
| Anemic models with no logic | Misunderstanding Active Record | All logic in services, models are bags | Push domain logic to models |
| Mixing query builder with domain methods | Confusion of concerns | Non-obvious state changes | Keep query logic in scopes, domain in methods |

## Anti-Patterns

- **God Model**: Model grows beyond 500+ lines with unrelated methods. Extract interfaces, traits, or value objects.
- **Tight Coupling**: Model method calls external services (Mail, Queue). Keep model methods pure; raise events for side effects.
- **State Leak**: Model method changes another model's state directly. Enforce aggregate boundaries — write methods only touch `$this` and owned relations.
- **Missing Transaction Safety**: Model method calls `$this->save()` but caller may fail. Let the controller/action manage the transaction boundary.

## Examples

```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = InvoiceStatus::Paid;
        $this->paid_at = now();
        $this->save();
    }

    public function isOverdue(): bool
    {
        return $this->status === InvoiceStatus::Sent
            && $this->due_at->isPast();
    }
}

// Usage — thin controller
class InvoiceController
{
    public function pay(PayRequest $request, Invoice $invoice)
    {
        $invoice->markAsPaid();
        return redirect()->back();
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | When to Use Actions |
| Closely Related | Action Class Patterns |
| Closely Related | Eloquent as Adapter |

## AI Agent Notes

- Model methods should only reference `$this` attributes and owned relations
- No model method should call `Mail::to()`, `dispatch()`, or other external services
- Test model methods with model factories, not mocks
- Model class should stay under ~300 lines

## Verification

- [ ] Every model method only references `$this` attributes and owned relations
- [ ] No model method calls `Mail::to()`, `dispatch()`, or other external services
- [ ] Model methods have test coverage with model factories (no mocks)
- [ ] Model class stays under ~300 lines; related groups extracted to traits
- [ ] No model method writes to a different model's table directly
