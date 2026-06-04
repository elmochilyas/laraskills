# Skill: Refactor Business Logic from Observers to Domain Services

## Purpose

Move business rules, domain calculations, and decision logic out of Eloquent observers into dedicated domain service or action classes, making business logic explicit, testable, and discoverable.

## When To Use

- Observer contains conditional business rules (discounts, status transitions, calculations)
- Observer calls domain services directly with conditional logic
- Observer is difficult to test because business logic is embedded in lifecycle hooks

## When NOT To Use

- The logic is purely infrastructural (cache invalidation, audit logging, search indexing)
- The logic is trivial formatting (trimming whitespace, normalizing casing)

## Prerequisites

- Observer class with business logic identified
- Understanding of the domain service boundaries

## Inputs

- Observer class and method containing business logic
- Business logic to extract
- Domain service or action class name

## Workflow

1. Identify all business logic in the observer:
   ```
   class OrderObserver
   {
       public function created(Order $order): void
       {
           // Business logic: apply volume discount
           if ($order->total_cents >= 10000) {
               $order->applyDiscount(0.1)
               $order->save()
           }
           // Infrastructure: invalidate cache
           Cache::forget("order:{$order->id}")
       }
   }
   ```
2. Extract business logic into a domain service or action class:
   ```
   class ApplyVolumeDiscount
   {
       public function execute(Order $order): void
       {
           if ($order->total_cents >= 10000) {
               $order->applyDiscount(0.1)
               $order->save()
           }
       }
   }
   ```
3. Replace the business logic in the observer with a call to the action:
   ```
   public function created(Order $order): void
   {
       // Business logic moved to domain service
       Cache::forget("order:{$order->id}") // Infrastructure stays
   }
   ```
4. Call the domain service explicitly where the business operation occurs:
   ```
   class PlaceOrderController
   {
       public function __invoke(Request $request, ApplyVolumeDiscount $action)
       {
           $order = Order::create($request->validated())
           $action->execute($order)
       }
   }
   ```

## Validation Checklist

- [ ] Observers contain no business rules, domain calculations, or decision logic
- [ ] Business logic is extracted to domain services, action classes, or model methods
- [ ] Observers handle only infrastructure concerns (cache, logs, dispatch jobs)
- [ ] Observer methods are <5 lines each (thin dispatch points)
- [ ] Heavy operations in observers are dispatched as queued jobs
- [ ] Observer dependencies are injected via constructor, not facades
- [ ] No infinite event loops exist (observer saving observed model without suppression)

## Common Failures

- **Convenience-driven logic**: "The observer is right there when the model is saved, so I'll put the discount logic here." Extract to a domain service.
- **God observer**: Single observer handles cache, audit, notifications, and sync. Split into one observer per concern.
- **Synchronous API calls**: Making HTTP calls inside observer methods. Dispatch a queued job instead.
- **Hidden dependencies**: Using `Cache::` facade or `Http::` facade inside observer without constructor injection.

## Decision Points

- **Observer vs service**: Observer = infrastructure concern that always runs. Service = business logic that is explicitly invoked.
- **Single vs multiple observers**: Split into single-concern observers when the observer grows beyond one responsibility.

## Performance Considerations

- Removing business logic from observers makes them faster (sub-millisecond per call)
- Heavy operations should be queued, not executed synchronously in observers

## Security Considerations

- Business logic in observers is invisible at the call site — developers may be unaware of side effects
- Moving logic to explicit services makes the execution path auditable

## Related Rules

- Rule 1: Never Put Business Logic in Observers
- Rule 2: Keep One Observer Per Infrastructure Concern
- Rule 3: Dispatch Jobs for Heavy Operations in Observers
- Rule 4: Use Constructor Injection in Observers
- Rule 6: Do Not Access Relationships in Observers That May Not Be Loaded

## Related Skills

- Observer Pattern for Lifecycle Hooks
- Observer Registration with #[ObservedBy]
- Event Control / Quiet Operations for Suppression

## Success Criteria

- All business logic is removed from observers
- Observers contain only infrastructure code (cache, logs, job dispatch)
- Business logic is testable in isolation via domain service classes
- Each observer is focused on a single concern
- Heavy operations are queued, not executed synchronously
- Dependencies are injected through constructors
