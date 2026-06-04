# When to Use Actions

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Action classes (also called service/use-case classes) house cross-aggregate operations that span multiple models or external systems. They replace fat controller/command handler logic with a dedicated, testable, single-responsibility class. The decision to extract an action hinges on whether the operation coordinates multiple domain objects, manages a transaction boundary, or orchestrates infrastructure side-effects.

## Core Concepts
- **Action class:** A stateless, invocable PHP class that encapsulates a single use-case operation.
- **Cross-aggregate operation:** An operation that touches more than one aggregate root (e.g., placing an order deducts inventory and creates a shipment).
- **Within-aggregate logic:** Pure model methods that operate on one aggregate's own state.
- **Transaction boundary:** The scope across which database transactions must be atomic.
- **Orchestration vs. implementation:** Actions orchestrate; models implement domain logic.

## Mental Models
- **The Conductor & Orchestra:** The action is the conductor; individual models are musicians. Each musician (model) plays their part; the conductor (action) ensures they play together.
- **The Faucet Model:** Actions are the faucet handle — they turn the flow on/off, but the water (domain logic) comes through the pipes (models). Don't put the pipes inside the handle.
- **Transaction Wallet:** Think of the action as a wallet that holds the transaction. It opens, coordinates, and then commits or rolls back everything inside.

## Internal Mechanics
Action classes typically follow this structure:
1. Constructor injection of dependencies (models, services, repositories).
2. A public `__invoke` or `handle` method that accepts the input (DTO, request data, parameters).
3. Sequential calls to aggregate methods, each performing within-aggregate logic.
4. Optional domain event dispatching after successful execution.
5. Return of result DTO or the primary affected model.

## Patterns
- **Single Action Controller:** Route → `__invoke` action class directly, bypassing traditional controller classes.
- **Action + DTO Pattern:** Accept a typed Data Transfer Object instead of loose parameters.
- **Transactional Action:** Wrap the entire `handle` body in `DB::transaction()`.
- **Event-Emitting Action:** Collect and dispatch domain events after commit.

## Architectural Decisions
- Use an action when the operation coordinates two or more aggregates.
- Use an action when the operation must succeed or fail atomically across multiple models.
- Use an action when you need to conditionally call different model methods based on business rules that don't belong to any single model.
- Use an action when the operation involves external side-effects (email, queue, API call).
- Use an action when you want a clear, named, testable entry point for a use case.
- Stay on the model when the method only reads or mutates that model's own state without coordination.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single-responsibility, easy to test | Additional class per use case can multiply files | Action count grows with use-cases, not entities |
| Clear transaction boundary | Risk of anemic domain if models are stripped of all logic | Must discipline teams to push logic down to models |
| Named use-cases serve as documentation | Accidental complexity if overused for trivial CRUD | Prefer model methods for simple operations |
| Easy to swap database implementation | Tight coupling to Laravel services if not abstracted | Inject interfaces in constructor; resolve from container |
| Promotes thin controllers | Can become god classes if all cross-aggregate logic goes into one action | One action per use-case enforces separation |

## Performance Considerations
- Action classes themselves add negligible overhead — they are plain PHP objects resolved once from the container.
- Chained model calls inside an action can cause N+1 queries if lazy-loading is triggered. Eager-load required relations before entering the action.
- Wrapping in `DB::transaction()` is safe for moderate-sized operations; very long-running actions should chunk or queue.

## Production Considerations
- **Logging:** Log action entry and exit with correlation IDs for debugging.
- **Retries:** For actions that call external APIs, consider idempotency keys and job-based retry.
- **Authorization:** Place authorization gates/resource checks inside the action or as a middleware layer before the action.
- **Validation:** Input validation should happen before the action (Form Request). The action receives validated data.
- **Queuing:** If an action is slow, dispatch it as a job instead of running synchronously.

## Common Mistakes
- Putting raw query logic or complex conditional branching in the action instead of on the model.
- Making actions too granular (one per line of model code) or too coarse (one action handles ten unrelated operations).
- Mixing input validation, authorization, and orchestration in the same action.
- Returning `$this` from actions for method chaining — prefer immutable result objects.
- Using actions for simple CRUD that could be three lines in a controller.

## Failure Modes
- **Anemic Action Pattern:** Actions contain all logic; models become property bags. Mitigate by enforcing code review and using static analysis (e.g., PHPStan level 6+).
- **Orchestration Sprawl:** A single action grows to 200+ lines coordinating dozens of models. Mitigate by extracting sub-operations into private methods or child actions.
- **Action-as-Controller:** Actions are used as fat controllers with HTTP concerns. Mitigate by keeping HTTP logic (response format, status codes) in controllers/HTTP layer.
- **Missing Transaction Scope:** Partial writes when action fails mid-way. Mitigate by enforcing `DB::transaction()` wrapping as a pattern.

## Ecosystem Usage
- **Laravel Spark:** Uses action classes for billing operations (create subscription, invoice customer).
- **Laravel Jetstream:** Uses actions for team creation, user deletion, membership management.
- **Laravel Cashier (Stripe/Paddle):** Actions provide clear use-case boundaries for subscription lifecycle.
- **spatie/laravel-queueable-action:** Community package for making actions dispatchable to queues while preserving transaction behavior.

## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [When Models Are Enough](../when-models-are-enough/02-knowledge-unit.md) — Direct counterpart; the two form a decision pair.
- [Action Class Patterns](../action-class-patterns/02-knowledge-unit.md) — Deep-dive on action implementation mechanics.
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — Overlaps when actions cross storage boundaries.
- [Write Model Separation](../write-model-separation/02-knowledge-unit.md) — Actions are natural homes for command handler logic.

### Advanced Follow-up Topics

## Research Notes
- **Martin Fowler:** Service Layer pattern — actions are the Laravel equivalent of a Service Layer.
- **Vaughn Vernon (DDD):** Application Services (actions) orchestrate domain logic but never contain it.
- **Laracon talks (2020-2024):** Multiple speakers (Freek Van der Herten, Mohamed Said) advocated action classes for testability.
- **spatie/domain-oriented-laravel:** Their "Domain" directory structure places Actions in `Domain/Teams/Actions/`.
