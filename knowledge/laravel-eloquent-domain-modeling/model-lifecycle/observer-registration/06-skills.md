# Skill: Register Observers with #[ObservedBy] Attributes

## Purpose

Register observer classes on Eloquent models using the `#[ObservedBy]` PHP 8 attribute, ensuring registration is visible directly on the model class and not hidden in service providers.

## When To Use

- Adding a new observer to a model (default approach)
- Auditing current observer registrations
- Migrating from `Model::observe()` in service providers to attribute-based registration

## When NOT To Use

- Observer registration is conditional on environment, configuration, or feature flags
- Third-party package that cannot modify the model class

## Prerequisites

- PHP 8.0 or higher
- Laravel 8.x or higher
- Observer class exists

## Inputs

- Model class name
- Observer class name(s)

## Workflow

1. Create the observer class in `app/Observers/`:
   ```
   namespace App\Observers
   
   class OrderCacheObserver
   {
       public function saved(Order $order): void
       {
           Cache::forget("order:{$order->id}")
       }
   }
   ```
2. Add the `#[ObservedBy]` attribute above the model class:
   ```
   use Illuminate\Database\Eloquent\Attributes\ObservedBy
   
   #[ObservedBy(OrderCacheObserver::class)]
   class Order extends Model {}
   ```
3. Stack multiple `#[ObservedBy]` attributes for multiple observers:
   ```
   #[ObservedBy(OrderCacheObserver::class)]
   #[ObservedBy(OrderAuditObserver::class)]
   class Order extends Model {}
   ```
4. Remove any duplicate `Model::observe()` calls from service providers
5. Order `#[ObservedBy]` attributes by dependency (if one observer depends on another's output)
6. Keep observer filenames consistent with class names in `app/Observers/`

## Validation Checklist

- [ ] All unconditional observers are registered via `#[ObservedBy]`
- [ ] No duplicate registrations (both attribute and service provider for the same observer)
- [ ] Multiple observers use stacked attributes (one per attribute), not arrays
- [ ] `#[ObservedBy]` attributes are ordered by dependency when applicable
- [ ] Observer file names match class names and are in `app/Observers/`
- [ ] Conditional registrations use `Model::observe()` in a dedicated service provider

## Common Failures

- **Duplicate registration**: Both `#[ObservedBy(OrderCacheObserver::class)]` on the model and `Order::observe(OrderCacheObserver::class)` in a service provider. The observer fires twice. Remove the service provider call.
- **Missing import**: `#[ObservedBy]` without `use Illuminate\Database\Eloquent\Attributes\ObservedBy`. Add the import statement.
- **Array of observers**: `#[ObservedBy([Observer1::class, Observer2::class])]` — use stacked attributes instead, one per observer.
- **Conditional in attribute**: Attribute registration is unconditional. For conditional registration, use `Model::observe()` in a service provider.

## Decision Points

- **#[ObservedBy] vs Model::observe()**: Use `#[ObservedBy]` as the default. Use `Model::observe()` only when the registration must be conditional on runtime state.
- **Multiple attributes vs single with array**: Always use stacked attributes. Each observer gets its own `#[ObservedBy]` for independent add/remove/reorder.

## Performance Considerations

- Attribute-based registration is resolved at class-load time — no runtime overhead
- Observer method dispatch adds negligible overhead per event

## Security Considerations

- Observer registration determines which code runs on model lifecycle events — audit registrations during code review
- Ensure observers cannot be accidentally registered via both attribute and service provider (duplicate side effects)

## Related Rules

- Rule 1: Default to `#[ObservedBy]` Attribute for Observer Registration
- Rule 2: Use `Model::observe()` Only for Conditional Registration
- Rule 3: Group All `observe()` Calls in One Service Provider
- Rule 4: Register Multiple Observers With Multiple `#[ObservedBy]` Attributes
- Rule 7: Do Not Register the Same Observer Multiple Times on the Same Model

## Related Skills

- Observer Pattern for Lifecycle Hooks
- Attribute Registration for PHP 8 Attributes
- Observer Anti-Patterns for Design

## Success Criteria

- All unconditional observers are registered via `#[ObservedBy]` on the model
- No duplicate observer registrations exist
- Conditional observers use `Model::observe()` in a single service provider
- Observer registration is fully discoverable from the model class
- Observer files follow consistent naming and location conventions
