# Anti-Patterns: Action Class Logic

## God Action
**Description:** A single action class handling all operations for a resource — create, update, delete, archive, export. Named something like `OrderAction` or `UserAction`.
**Why it happens:** Developers treat actions like mini-controllers, grouping related operations out of habit.
**Consequences:** Violates SRP; class grows large; individual operations are coupled.
**Better approach:** One class per business operation. `CreateOrderAction`, `UpdateOrderAction`, `DeleteOrderAction`.

## Request-Hungry Action
**Description:** Action class that type-hints Illuminate\Http\Request in its __invoke method.
**Why it happens:** Convenience during refactoring — move controller code to action without cleaning up parameters.
**Consequences:** Action is coupled to HTTP; cannot be called from queue, CLI, or tests without faking a request.
**Better approach:** Accept DTOs or individual typed parameters. Actions operate on data, not HTTP.

## Silent Action
**Description:** Action that returns void for operations where callers need to know result.
**Why it happens:** Developers think "the action does its job" without considering callers.
**Consequences:** Callers can't determine if the operation succeeded; error conditions produce silent failures.
**Better approach:** Return typed values. Throw domain exceptions for business logic failures.

## Constructor Side Effects
**Description:** Action constructor that makes database queries, API calls, or performs business logic.
**Why it happens:** Developers think "initialize everything in the constructor."
**Consequences:** Action can't be instantiated for testing or alternative usage without triggering side effects.
**Better approach:** Constructor assigns dependencies only. All logic lives in __invoke.

## Action Calling Action Directly
**Description:** An action class that directly instantiates and calls another action class instead of going through composition or the container.
**Why it happens:** Convenience — it works, so developers don't see the problem.
**Consequences:** Tight coupling between actions; difficult to mock in tests.
**Better approach:** Inject action dependencies via constructor. Let the container resolve the chain.
