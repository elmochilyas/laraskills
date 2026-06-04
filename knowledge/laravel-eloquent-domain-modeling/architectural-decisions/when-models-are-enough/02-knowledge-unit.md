# When Models Are Enough

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Eloquent models are sufficient — and preferable — when the operation stays within the boundary of a single aggregate. Putting logic directly on the model (as methods, accessors, mutators, or scopes) keeps the domain visible, reduces indirection, and avoids premature abstraction. The rule is: if the operation reads or mutates that model's own state (and optionally touches immediate relations as owned sub-entities), it belongs on the model.

## Core Concepts
- **Within-aggregate operation:** Logic that only references properties and methods of a single aggregate root and its owned children.
- **Model method:** A public method on an Eloquent model class that performs domain logic using $this->attribute.
- **Active Record domain logic:** Domain logic that lives alongside persistence concerns in the same class.
- **Anemic domain model:** A model class with only properties and getters/setters — all logic lives in services.

## Mental Models
- **The Swiss Army Knife on Your Belt:** The model is the tool you reach for first. It's right there. Don't walk to the toolbox (action classes) for a simple cut.
- **The Organism, Not the Ecosystem:** The model is one organism. Actions are the ecosystem coordinator. If you're operating on one cell, stay in the cell.
- **The Bouncer Rule:** If the operation only touches what the model owns (its attributes, its pivot data, its direct owned relationships), the model can handle it.

## Internal Mechanics
Eloquent provides built-in hooks for within-aggregate logic:
- **Accessors:** getNameAttribute() — compute derived values.
- **Mutators:** setPasswordAttribute() — transform on assignment.
- **Local scopes:** scopeActive() — reusable query filters.
- **Model methods:** $invoice->markAsPaid() — state-changing operations.
- **Custom casts:** protected  = ['status' => OrderStatus::class] — value object mapping.

## Patterns
- **Explicit State Methods:** pprove(), eject(), rchive(), markAsPaid() on the model.
- **Derived Property Accessors:** getTotalAttribute() for computed values.
- **Self-Validation Methods:** isValidForPayment(): bool on the model.
- **Status Machine:** Enum cast on a status column with transition guard methods.

## Architectural Decisions
- Put the method on the model if it only reads or writes $this attributes.
- Put the method on the model if it touches owned relationships (hasMany, morphMany) within the same aggregate boundary.
- Put the method on the model if the operation has a single obvious return (e.g., a boolean, the model itself, a computed value).
- Extract to an action only when the operation requires outside coordination.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Low indirection — logic is where data lives | Model class grows larger over time | Split by responsibility or use traits/modules |
| No extra files — faster onboarding | Can mix persistence and domain logic in one class | Discipline required for clean method boundaries |
| Leverages Eloquent's built-in hooks (accessors, mutators) | Harder to unit-test if DB is coupled | Use model factories and RefreshDatabase |
| Follows Active Record convention — Laravel convention | May encourage fat models | Set team guidelines: 200-300 lines max per model |
| Reduces ceremony for simple operations | Not reusable across different contexts | Extract shared logic to traits or value objects |

## Performance Considerations
- Model methods don't add extra PHP classes to load — trivial benefit.
- Accessors run on every read — cache computed values with $appends carefully or use a cached property.
- Mutators run on every write — expensive transformations (hashing, API calls) should be extracted to actions/jobs.

## Production Considerations
- **Testing:** Test model methods with model factories, not mocks. Invoice::factory()->make(['status' => 'pending']) then $invoice->markAsPaid().
- **Serialization:** Accessors affect JSON/array serialization — be deliberate with $appends.
- **Query scopes:** Use local scopes for reusable query logic; avoid global scopes unless there's a universal constraint (soft deletes, tenant ID).

## Common Mistakes
- Creating an action class for a one-line state change like $order->markAsPaid().
- Putting HTTP or storage concerns (dispatch a job, send an email) inside a model method.
- Making models anemic — no business logic at all — then putting it all in actions.
- Mixing query builder concerns with domain logic (e.g., $this->where(...)->update(...) inside a model method without respecting state).

## Failure Modes
- **God Model:** The model grows beyond 500+ lines with unrelated methods. Mitigate by extracting interfaces, traits, or value object classes.
- **Tight Coupling:** A model method calls external services (Mail, Queue) making testing hard. Mitigate by keeping model methods pure — raise events instead for side effects.
- **State Leak:** A model method changes another model's state directly. Mitigate by enforcing aggregate boundaries — write methods only touch $this and owned relations.
- **Missing Transaction Safety:** A model method calls $this->save() but other operations in the caller may fail. Mitigate by letting the controller/action manage the transaction.

## Ecosystem Usage
- **Laravel Cashier:** The User model's subscription() method returns a subscription relationship — domain logic on the model.
- **Laravel Spark:** The Team model has ddUser(), emoveUser(), hasPermission() methods.
- **spatie/laravel-model-states:** Adds state machine methods directly on Eloquent models.
- **bensampo/laravel-enum:** Used with model casts to provide type-safe enum methods on attributes.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [When to Use Actions](../when-to-use-actions/02-knowledge-unit.md) — Direct counterpart; comparison for decision-making.
- [Action Class Patterns](../action-class-patterns/02-knowledge-unit.md) — What to extract to when the model isn't enough.
- [Eloquent as Adapter](../eloquent-as-adapter/02-knowledge-unit.md) — Alternative perspective: model as infrastructure, not domain.

### Advanced Follow-up Topics

## Research Notes
- **Martin Fowler:** Anemic Domain Model anti-pattern — models should not be property bags.
- **Taylor Otwell:** Laravel convention encourages model methods for domain logic; framework examples use this pattern extensively.
- **Sandi Metz (POODR):** "Put behavior where the data lives." Applied to Eloquent, that means on the model.
- **Laravel docs:** Accessors, mutators, scopes — the framework explicitly builds this pattern into its API design.