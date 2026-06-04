# Skill: Create Single-Concern Observer with #[ObservedBy]

## Purpose

Create a focused observer class that handles exactly one infrastructure concern (cache invalidation, audit logging, or notification dispatch) and register it on the model using the `#[ObservedBy]` attribute.

## When To Use

- Adding a new infrastructure concern that should react to model events
- Splitting an existing large observer into single-responsibility observers
- Registering observers in a discoverable, declarative way

## When NOT To Use

- The observer would have only one method with trivial logic (consider a closure in `booted()`)
- The registration depends on runtime conditions (use `Model::observe()` in a service provider)
- The logic is business logic that should be a domain event listener

## Prerequisites

- Observer class directory exists (`app/Observers/`)
- Model class is ready for registration

## Inputs

- Observer class name (e.g., `OrderCacheObserver`)
- Concern type (cache, audit, sync, notification)
- Model class to observe
- Event methods to implement

## Workflow

1. Create the observer class in `app/Observers/` with a clear naming convention:
   ```
   namespace App\Observers
   
   class OrderCacheObserver
   {
       public function saved(Order $order): void
       {
           Cache::forget("order:{$order->id}")
       }
   
       public function deleted(Order $order): void
       {
           Cache::forget("order:{$order->id}")
       }
   }
   ```
2. Type-hint the specific model class, not `Model`:
   ```
   public function saved(Order $order): void  // Specific, not Model
   ```
3. Keep methods under 5 lines — a single operation per method
4. Inject dependencies via constructor (not facades):
   ```
   public function __construct(
       private readonly CacheManager $cache
   ) {}
   ```
5. Register the observer on the model using `#[ObservedBy]`:
   ```
   #[ObservedBy(OrderCacheObserver::class)]
   class Order extends Model {}
   ```
6. Stack multiple `#[ObservedBy]` attributes for multiple observers:
   ```
   #[ObservedBy(OrderCacheObserver::class)]
   #[ObservedBy(OrderAuditObserver::class)]
   class Order extends Model {}
   ```

## Validation Checklist

- [ ] Observer class follows `{Model}{Concern}Observer` naming convention
- [ ] Observer is in `App\Observers` namespace
- [ ] Methods type-hint the specific model class
- [ ] Methods are under 5 lines (single operation)
- [ ] Dependencies are injected via constructor
- [ ] Observer is registered with `#[ObservedBy]` attribute
- [ ] Multiple observers are stacked with separate `#[ObservedBy]` attributes
- [ ] No business logic in observer methods

## Common Failures

- **Generic Model type-hint**: `public function saved(Model $model)` — hides which model the observer handles. Use the specific model class.
- **God observer**: One observer handling cache, audit, and notifications. Split into separate observer classes.
- **Calling observer methods directly**: `(new OrderCacheObserver())->saved($order)` bypasses event dispatch and other observers. Use `$order->save()` instead.
- **Facade dependency**: Using `Cache::` facade instead of constructor injection. Inject `CacheManager` for testability.

## Decision Points

- **Observer vs closure**: Use an observer class when the concern has multiple event methods (e.g., both `saved` and `deleted`). Use a closure in `booted()` for a single, simple event handler.
- **#[ObservedBy] vs Model::observe()**: Use `#[ObservedBy]` for unconditional registration. Use `Model::observe()` only when registration depends on runtime conditions.

## Performance Considerations

- Each observer adds a method call per event — negligible
- Keep methods fast (cache forget, job dispatch, log write) — no expensive synchronous work

## Security Considerations

- Observers can trigger side effects on any model operation — ensure they don't leak data or perform unauthorized actions

## Related Rules

- Rule 1: Register Observers With the `#[ObservedBy]` Attribute
- Rule 2: Keep Observer Classes Focused on a Single Infrastructure Concern
- Rule 3: Place Observers in the `App\Observers` Namespace
- Rule 4: Do Not Put Business Logic in Observers — Use Domain Events Instead
- Rule 6: Do Not Call Other Models' Observer Methods Directly
- Rule 7: Type-Hint the Specific Model Class in Observer Methods

## Related Skills

- Observer Registration with #[ObservedBy]
- Observer Anti-Patterns for Design
- Attribute Registration for PHP 8 Attributes

## Success Criteria

- Observer handles exactly one infrastructure concern
- Observer is registered via `#[ObservedBy]` on the model
- Methods are thin (under 5 lines) with injected dependencies
- Business logic is absent from observer methods
- Multiple observers can be added independently per concern
