# Action Class Patterns

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Action classes in Laravel are single-responsibility, invocable classes that encapsulate a use case. The dominant pattern is a class with __invoke or handle, constructor-injected dependencies, and a DTO for input. Actions can be sync (transactional), queued (via Illuminate\Bus\Queueable or spatie's queueable-action), or event-emitting. This KU details the mechanical patterns for constructing, organizing, and testing action classes.

## Core Concepts
- **Single Invocable:** The __invoke magic method makes the class callable as a function.
- **Constructor Injection:** Dependencies (models, services, repositories) injected via the constructor.
- **Explicit Dependencies Only:** Actions should not inherit from a base class unless necessary.
- **Statelessness:** An action class holds no mutable state between invocations.
- **Return Value:** Actions should return typed result objects, not mixed arrays.

## Mental Models
- **The Transaction Shell:** Think of the action as a transaction shell — it opens, delegates, and closes. The shell itself holds minimal logic.
- **The Vending Machine:** Input goes in (DTO), action processes (internal mechanics), result comes out. The machine has no memory of the last purchase.
- **The Micro-Orchestra Conductor:** Each section (model) plays its part; the conductor (action) has the score but doesn't play any instrument.

## Internal Mechanics
1. **Invocation:** $action->__invoke() or pp(Action::class)().
2. **Transaction:** Heavy actions wrapped in DB::transaction().
3. **Event Dispatch:** After successful persistence, domain events are dispatched.
4. **Result Return:** A DTO, the affected model, or oid.
5. **Error Handling:** Domain exceptions for business rule violations; generic exceptions for infrastructure failures.

## Patterns
- **Action + DTO:** Accept a typed DTO parameter, not loose arguments.
- **Action + Form Request:** Form request validates and transforms input; action receives clean data.
- **Transactional Action:** DB::transaction(fn () => ->execute(...)).
- **Queued Action:** Use Illuminate\Bus\Queueable trait or spatie/laravel-queueable-action.
- **Event-Firing Action:** Collect domain events, dispatch after DB::transaction commits.
- **Sub-Action Composition:** An action delegates sub-steps to other actions (e.g., PlaceOrderAction calls GenerateShipmentAction).

## Architectural Decisions
- Use __invoke for single-use-case actions (most common).
- Use named methods (handle, execute) for actions with multiple public entry points.
- Always inject dependencies via constructor — never use pp() inside the method.
- Return typed result objects or DTOs for testability.
- Keep action files under 100 lines; extract sub-actions if they grow larger.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Highly testable — inject mocks easily | Extra file per use case increases project size | Use automatic wiring; namespace consistently |
| Named use cases serve as documentation | Can encourage anemic models if logic isn't pushed down | Code review: "Does this belong on the model?" |
| Easy to queue or retry | Over-abstracting trivial CRUD adds friction | Don't use actions for simple model saves |
| Thin controllers, fat use-cases | Learning curve for new Laravel devs | Pair with clear README and team conventions |
| Dependency injection via container | Action classes can become god classes | One action per use case; split when >100 lines |

## Performance Considerations
- Action classes are resolved once per request (singleton or fresh) — negligible overhead.
- Queued actions should serialize only the necessary data (model keys, DTO), not full model instances.
- Transaction time: Keep database work inside transactions short; move I/O outside.

## Production Considerations
- **Logging:** Log action entry/exit with the action class name and a UUID for tracing.
- **Monitoring:** Track action execution time and failure rates in your observability system.
- **Retry/Idempotency:** Design actions to be idempotent if dispatched to a queue.
- **Authorization:** Check authorization inside the action or via middleware before the action is invoked.

## Common Mistakes
- Using pp() or esolve() inside the action method instead of constructor injection.
- Making actions mutable — storing state on $this->property between invocations.
- Returning generic rray types instead of typed DTOs.
- Not handling exceptions — letting PDO exceptions bubble up as 500s.
- Mixing sync and queued behavior in the same action.
- Inheriting from a base Action class that adds unnecessary coupling.

## Failure Modes
- **God Action:** Single action handles multiple use-cases with conditional logic. Mitigate: one class per use case.
- **Transactional Outbox Failure:** Event dispatched before transaction commits, causing inconsistent state. Mitigate: dispatch events after commit via DB::afterCommit() or dispatchIfCommit().
- **Serialization Bloat:** Queued action serializes full model, increasing Redis/storage load. Mitigate: serialize only the model key and re-fetch in handle.
- **Action Proliferation:** 100+ tiny actions that each do trivial work. Mitigate: use model methods for simple operations.

## Ecosystem Usage
- **Laravel Jetstream:** App\Actions\Jetstream\CreateTeam, AddTeamMember, RemoveTeamMember.
- **Laravel Fortify:** CreateNewUser, ResetUserPassword, UpdateUserProfileInformation.
- **Laravel Horizon:** Config and metric actions in the Horizon codebase.
- **spatie/laravel-queueable-action:** Community package for making actions both synchronous and queueable.
- **lorisleiva/laravel-actions:** Package for action-as-controller, action-as-job, action-as-listener patterns.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [When to Use Actions](../when-to-use-actions/02-knowledge-unit.md) — Covers the decision of when to extract.
- [When Models Are Enough](../when-models-are-enough/02-knowledge-unit.md) — The alternative to actions.
- [Write Model Separation](../write-model-separation/02-knowledge-unit.md) — Actions naturally evolve into command handlers.
- [Framework Decoupling](../framework-decoupling/02-knowledge-unit.md) — How to make actions framework-agnostic.

### Advanced Follow-up Topics

## Research Notes
- **Laravel docs:** Service Container, Service Providers — actions rely on auto-wiring.
- **spatie/guidelines:** 10-15 line action methods, single responsibility.
- **lorisleiva/laravel-actions:** Experimented with single-class multi-role actions (controller + job + listener).
- **Martin Fowler:** Service Layer — actions are the Laravel idiomatic Service Layer.