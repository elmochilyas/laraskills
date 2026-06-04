# Action Classes

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-15-action-classes
**Difficulty:** Intermediate
**Category:** Architectural Pattern
**Last Updated:** 2026-06-04

## Overview

Action classes are invocable, single-method classes that encapsulate isolated business operations. They follow the Single Action Principle: one class, one public `__invoke()` method, one responsibility.

Action classes exist to fill the gap between inline controller logic and full Use Case classes. Not every operation warrants the architectural overhead of a Use Case — some operations are simple enough that a full orchestration class with DTOs, repositories, and transaction management is over-engineering. Action classes provide a lightweight alternative: a single method call that does one thing and does it well.

Engineers should care because Action classes solve the problem of controller bloat without requiring the full Clean Architecture stack. An Action class is the minimal unit of controller thinning — extract the operation from the controller, make it testable, and enable direct route binding. For teams adopting Laravel's invocable controller pattern, Action classes are the natural evolution.

## Core Concepts

**Invocation Contract:** Action classes implement `__invoke()` as their single public method. This enables direct routing — `Route::post('/coupon/validate', ValidateCouponAction::class)` — and makes the class callable anywhere in the application.

**Single Responsibility:** An Action does exactly one thing: `GenerateReceiptPdf`, `CalculateShippingCost`, `ValidateCouponCode`. If the class name uses "and" (`ValidateAndApplyCoupon`), it's two Actions in one.

**Statelessness:** Action classes have no mutable state. All dependencies are injected via constructor. All operation-specific data arrives via `__invoke()` parameters. This makes Actions safe for Octane and predictable in tests.

**Lightweight Dependencies:** Actions typically have 1-3 constructor dependencies. A repository, a service, or a gateway — not the full orchestrator set that a Use Case would require.

**Direct Route Binding:** Laravel's container can resolve Action classes directly from routes. This eliminates the controller entirely for Action-backed endpoints.

## When To Use

- Single, isolated operations that don't require multi-step orchestration
- Operations with 1-3 dependencies
- Controller methods that need extraction but don't warrant a full Service or Use Case
- Operations that benefit from direct route binding (`Route::post('/', MyAction::class)`)
- Validation, calculation, or transformation logic that should be independently testable
- Teams adopting invocable controllers as a pattern

## When NOT To Use

- Multi-step orchestrations involving multiple domain objects — use a Use Case
- Operations requiring multiple related public methods — use a Service
- Simple one-liner operations — inline closure or direct delegation suffices
- Operations needing state between invocations — Actions are stateless by design
- CRUD operations that map directly to Eloquent methods — the Action adds no value

## Best Practices

**Declare Actions as `final`:** Action classes should be `final` to prevent extension. If you need to override behavior, use composition — create a new Action or inject a different dependency.

**Use Constructor Property Promotion:** PHP 8 constructor promotion keeps Action classes compact. All dependencies declared in the constructor, all operation data in the method.

**Keep Actions Small:** An Action should rarely exceed 30 lines. If the `__invoke()` method grows beyond 15-20 lines, consider if the operation has become complex enough for a Use Case.

**Route Directly When Possible:** Use `Route::post('/path', MyAction::class)` instead of controller-based routing. This makes the route-action relationship explicit.

**Return Meaningful Results:** Actions should return a result — a DTO, a value, or at minimum a boolean. Void-returning Actions make testing difficult and hide failure states.

**Test the `__invoke()` Method Directly:** Actions are the easiest class to unit test in all of Laravel. Create the instance with mocked dependencies, call `__invoke()`, assert on the return value.

## Architecture Guidelines

**Layer Placement:** Action classes belong in the Application layer, typically at `app/Actions/`. They sit between controllers and domain objects.

**Dependency Direction:** Actions depend on services, repositories, and domain objects. They must not depend on HTTP-specific classes (Request, Response).

**Relationship to Controllers:** Actions can replace controllers entirely for single-operation endpoints via direct route binding. For endpoints with multiple operations, the controller delegates to an Action for each operation.

**Relationship to Use Cases:** Actions are lightweight Use Cases. The distinction is one of complexity — Actions for isolated operations, Use Cases for multi-step orchestration. Both patterns are valid; choose based on the operation's complexity.

**Octane Compatibility:** Actions are inherently Octane-safe because they are stateless. All dependencies are injected services; all operation data is method-local. No mutable properties, no request-scoped state.

## Performance Considerations

- Action class dispatch via `__invoke()` is one PHP method call — negligible overhead
- Stateless Actions can be registered as singletons in the container for reuse across requests
- Octane workers safely share Action instances since Actions carry no mutable state
- No performance penalty from Action encapsulation; the overhead is purely organizational
- Direct route binding eliminates controller dispatch overhead entirely

## Security Considerations

- Authorization should be handled at the route level (middleware) or called within the Action
- Actions should not handle authentication — they receive already-authenticated context
- Input validation must be completed before the Action receives data (Form Request or DTO validation)
- Actions should not log sensitive input data
- Actions in long-running processes must not cache user-specific data in properties

## Common Mistakes

**Too Many Dependencies:** An Action with 6+ constructor parameters.

**Why developers make it:** The Action started simple but grew. New dependencies were added without considering extraction.

**Consequences:** Difficult testing. Many mocked dependencies. The Action has become a Use Case in disguise.

**Better approach:** When an Action needs 4+ dependencies, promote it to a Use Case with proper DTOs and transaction management.

**Stateful Actions:** Assigning values to properties within `__invoke()` for later use.

**Why developers make it:** Convenience — storing intermediate results in properties seems natural.

**Consequences:** Action fails on second invocation. Octane workers produce wrong results. Tests are order-dependent.

**Better approach:** Use local variables for all intermediate state. Never assign `$this->property` inside `__invoke()`.

**Actions Too Simple:** An Action that merely calls one method on one dependency.

**Why developers make it:** Strict pattern adherence without evaluating whether the Action provides value.

**Consequences:** Proliferation of trivial Action classes that obscure the meaningful ones.

**Better approach:** Use an inline closure or direct controller delegation for operations that are a single method call.

**Actions Too Complex:** An Action that accumulates helper methods and private logic.

**Why developers make it:** The operation is genuinely complex, but the developer resists promoting to Use Case.

**Consequences:** The Action becomes a mini-Use Case without the architectural benefits (DTOs, explicit transaction management, port injection).

**Better approach:** Promote to a Use Case when the Action exceeds 30 lines or needs private helper methods.

**Missing Return Value:** Actions that return void, hiding success or failure.

**Why developers make it:** The Action performs a side effect and "doesn't need to return anything."

**Consequences:** Callers cannot distinguish success from failure without exceptions. Testing requires mocking side effects to verify execution.

**Better approach:** Always return a meaningful result. At minimum return a boolean. Better yet, return a typed result DTO.

## Anti-Patterns

**God Action:** An Action that grows to handle multiple scenarios through conditional logic. Symptoms: `if/else` chains based on input type, multiple private helper methods, exceeding 50 lines. Refactor by splitting into multiple Action classes or promoting to a Use Case.

**Action as Service:** An Action that accumulates multiple public methods over time. The class name includes "Action" but it has `create()`, `update()`, and `delete()` methods. Rename to Service and allow multiple methods, or split into individual Actions.

**Action with Request Dependency:** An Action accepting `Illuminate\Http\Request` in `__invoke()`. This couples the Action to HTTP, preventing CLI, queue, and test reuse. Inject a DTO instead.

**Side-Effect-Only Action:** An Action that performs side effects and returns nothing. The caller cannot determine success. Always return a result.

**Action in Domain Layer:** Placing Action classes in the Domain layer. Actions are application concerns — they orchestrate, they don't implement business rules. Keep them in `app/Actions/`.

## Examples

### Basic Action Class
```php
final readonly class ValidateCouponAction
{
    public function __construct(
        private CouponRepository $coupons,
    ) {}

    public function __invoke(string $code, int $customerId): CouponValidationResult
    {
        $coupon = $this->coupons->findActive($code);

        if ($coupon === null) {
            return CouponValidationResult::invalid('Coupon not found or expired');
        }

        if (!$coupon->isValidFor($customerId)) {
            return CouponValidationResult::invalid('Coupon not applicable');
        }

        return CouponValidationResult::valid(
            discount: $coupon->discount(),
            code: $coupon->code(),
        );
    }
}
```

### Route Binding
```php
// web.php
Route::post('/coupon/validate', ValidateCouponAction::class);

// Equivalent to:
Route::post('/coupon/validate', function (ValidateCouponAction $action) {
    return $action(request()->input('code'), auth()->id());
});
```

### Action with DTO
```php
final readonly class GenerateReceiptPdfAction
{
    public function __construct(
        private ReceiptGenerator $generator,
        private StorageService $storage,
    ) {}

    public function __invoke(GenerateReceiptInput $input): ReceiptResult
    {
        $pdf = $this->generator->generate(
            orderId: $input->orderId,
            template: $input->template,
        );

        $path = $this->storage->store(
            contents: $pdf,
            filename: "receipt-{$input->orderId}.pdf",
        );

        return new ReceiptResult(path: $path, size: strlen($pdf));
    }
}
```

## Related Topics

**Prerequisites:**
- PHP `__invoke()` magic method
- Laravel Route-to-Class Binding
- Controller Thinning Principles (SLP-03)

**Closely Related:**
- Use Case Classes (LAP-11) — full orchestration pattern
- Service Classes (SLP-01) — multi-method operation grouping
- DTO Design (LAP-14) — input/output contracts for Actions

**Advanced Follow-Up:**
- Action Naming Conventions
- Action Testing Strategies
- Action vs Service vs Use Case Decision Framework

**Cross-Domain Connections:**
- Octane Compatibility — stateless Action design
- Single Action Controllers — Laravel's invocable controller pattern
- Command Bus Pattern — Actions as command handlers
