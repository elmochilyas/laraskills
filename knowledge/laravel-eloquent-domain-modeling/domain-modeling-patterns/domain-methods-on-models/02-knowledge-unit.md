# Domain Methods on Models

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Domain methods transform anemic Eloquent models into expressive domain objects by naming behavior in the ubiquitous language. Instead of `$order->update(['status' => 'paid'])`, domain methods enable `$order->markAsPaid()`. This KU covers patterns for designing, implementing, and enforcing behavior methods that capture domain intent.

## Core Concepts
- **Behavior Method:** A public method on a model that encapsulates a domain operation (e.g., `publish()`, `archive()`, `refund()`).
- **Ubiquitous Language:** Domain terminology used consistently in code, methods, and conversations with stakeholders.
- **Command-Query Separation:** Methods either return data (queries) or mutate state (commands), rarely both.
- **Self-Encapsulation:** A method accesses its own state through accessors/mutators, preserving invariants.
- **Fluent API:** Method chaining through `return $this` for expressive call sequences.

## Mental Models
- **"Tell, Don't Ask":** Tell the model to perform an operation rather than asking for its data and performing the operation externally.
- **"The Method Tells the Story":** Reading `$invoice->send()`, `$subscription->cancel()`, `$user->deactivate()` reveals the domain without digging into implementation.
- **"Guard at the Gate":** Each domain method checks preconditions at entry and enforces postconditions at exit.

## Internal Mechanics
Eloquent models are regular PHP classes; domain methods use all standard PHP features:
- Calling other model methods or accessors (`$this->isActive()`)
- Modifying attributes via `$this->attribute = value` or `$this->fill([...])`
- Calling `$this->save()` to persist after mutation
- Throwing domain-specific exceptions on invariant violation
- Dispatching events via `$this->save()` event hooks or explicit `Event::dispatch()`

The pattern does not require base class overrides; it relies on disciplined class design.

## Patterns
- **Guard Clause Pattern:** Check preconditions at the top of the method and throw immediately.
- **Execute-Then-Persist:** Perform mutation logic, then call `$this->save()` once.
- **Return Self for Chaining:** `return $this` enables fluent call sequences.
- **State Enum Methods:** Methods like `markAsShipped()` transition an enum-typed status column.
- **Boolean Check Methods:** `isPublished()`, `hasExpired()`, `canBeCancelled()` for querying domain state.
- **Before/After Hooks:** Private `beforeX()` / `afterX()` methods that domain methods call for separation of concerns.

## Architectural Decisions
- Determine naming convention: verb-based (`publish()`) vs noun-based (`setPublished()`). Prefer verbs.
- Decide on exception types: generic `\Exception`, domain-specific `\DomainException`, or custom classes.
- Choose whether domain methods call `save()` internally or the caller manages persistence.
- Establish method granularity: one method per atomic domain operation.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Self-documenting intent | More code than direct attribute mutation | Maintainability payoff from readability |
| Enforces invariants in one place | May encourage fat models with too many methods | Extract related methods into traits |
| Reduces duplication across controllers | Callers must know which method to call | Debug IDE autocomplete or static analysis |
| Natural test boundaries | Testing persistence coupling | Use model factories with specific states |

## Performance Considerations
- Avoid loading large relationships inside domain methods unless necessary; use lazy loading markers.
- When a domain method triggers cascading saves, wrap in `DB::transaction()` at the caller level.
- Batch domain method calls (e.g., processing a CSV) should consider deferring `save()` to the end.

## Production Considerations
- Log every domain method call with input parameters for audit trail (monitor verbosity in high-throughput paths).
- Use domain methods as hook points for metrics (Prometheus counters on `order.paid`, `user.registered`).
- Ensure domain methods are idempotent or guarded against double-execution when appropriate.
- Write integration tests for each domain method against a real (or in-memory) database.

## Common Mistakes
- Adding public setters (`setStatusAttribute`) that bypass domain methods
- Making domain methods too granular (callers must orchestrate three methods for one business operation)
- Mixing query methods (`isActive()`) with command methods (`activate()`) in confusing ways
- Forgetting to call `save()` inside the domain method, leading to silent data loss
- Returning different types from domain methods inconsistently

## Failure Modes
- **Side-Effect Abuse:** Domain methods that send emails, call APIs, or dispatch jobs inline. Extract those effects to event listeners or queued handlers.
- **Missing Transaction Boundary:** When a domain method calls `save()` on multiple models, partial failures corrupt state. Use `DB::transaction()`.
- **Bypassed Methods:** External code calls `$model->update([...])` and skips invariant enforcement. Consider `$guarded` or `$model->save()` hooks to detect direct writes.

## Ecosystem Usage
- Laravel Spark uses domain methods like `Team::newSubscription()` on billable models
- `spatie/laravel-model-states` formalizes state-transition methods
- OSS like `reinink/advanced-eloquent` demonstrates rich domain methods
- Common pattern in first-party Laravel docs (e.g., `$user->notify()` on the `Notifiable` trait)

## Related Knowledge Units

### Prerequisites
- active-record-domain-layer — the Active Record pattern as the foundation for domain behavior
- Eloquent Accessors & Mutators — attribute transformation and encapsulation on models
- PHP OOP Method Design — method signatures, return types, exception handling

### Related Topics
- active-record-domain-layer
- state-pattern-fundamentals
- aggregate-boundaries

### Advanced Follow-up Topics
- transition-guards
- aggregate-roots

## Research Notes
- Martin Fowler: "Tell, Don't Ask" principle from *Refactoring* (1999)
- Evans: "Intention-Revealing Interfaces" in *DDD* (2003)
- Laravel community: debate between "fat models" and "actions/services" ongoing
- PHP static analysis (PHPStan level 8+) helps enforce domain method signature contracts
