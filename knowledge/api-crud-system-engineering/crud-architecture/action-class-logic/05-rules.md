# Rules: Action Class Logic

## Rule: Create Action Classes Per Single Responsibility
- **Condition:** When extracting business logic from controllers
- **Action:** Create one action class per single business operation. Name by operation: `CreateOrderAction`, `UpdateUserProfileAction`.
- **Consequence:** Each action has a clear, single responsibility; SRP is enforced at the class level.
- **Enforcement:** Architecture tests flag action classes with more than one public method (excluding __construct).

## Rule: Use Invokable Classes for Action Pattern
- **Condition:** When designing action classes
- **Action:** Implement `__invoke()` as the single entry point. Register in container for auto-resolution. Call via `Container::getInstance()->call($actionClass)`.
- **Consequence:** Actions are callable as functions; composition is straightforward.
- **Enforcement:** Code review ensures invokable pattern for single-operation classes.

## Rule: Inject Dependencies via Constructor
- **Condition:** When an action needs external services
- **Action:** Declare dependencies in the constructor. Type-hint interfaces where possible. Never use `app()` inside action methods.
- **Consequence:** Dependencies are explicit, testable, and replaceable.
- **Enforcement:** PHPStan detects `app()` calls in action classes.

## Rule: Accept Typed Parameters Not Request Objects
- **Condition:** When defining action method signatures
- **Action:** Accept DTOs or individually typed parameters. Never type-hint the HTTP Request class.
- **Consequence:** Actions are decoupled from HTTP; callable from queue, CLI, and tests.
- **Enforcement:** PHPStan flags Request type-hints in action __invoke signatures.

## Rule: Return Typed Values For Predictability
- **Condition:** When implementing action logic
- **Action:** Declare return types on __invoke(). Return Model, DTO, bool, or void. Throw domain exceptions for failures.
- **Consequence:** Callers know what to expect; type safety prevents silent failures.
- **Enforcement:** PHPStan requires return type declarations on action methods.

## Rule: Fire Domain Events Within Actions
- **Condition:** When an action completes an operation with side effects
- **Action:** Dispatch domain events at the end of the action method. Handle side effects (email, cache, logging) in event listeners.
- **Consequence:** Actions remain focused on the primary operation; side effects are decoupled.
- **Enforcement:** Review ensures side effects are dispatched as events, not inlined in actions.
