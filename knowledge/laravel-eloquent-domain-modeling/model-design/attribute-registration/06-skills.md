# Skill: Register Observers and Scopes Using PHP 8 Attributes

## Purpose

Configure Eloquent model observers, global scopes, custom collections, and custom builders using PHP 8 attributes (`#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`) instead of manual `boot()` method registration.

## When To Use

- Registering observers on Eloquent models
- Adding global scopes to models
- Setting custom collection or builder classes
- All cases where registration is unconditional (not runtime-dependent)

## When NOT To Use

- Registration depends on runtime conditions (environment, feature flags, authenticated user)
- PHP 7 compatibility is required
- The attribute syntax makes the class declaration too crowded (group attributes)

## Prerequisites

- PHP 8.0 or higher
- Laravel 8.x or higher (for `#[ObservedBy]` support)
- Observer, scope, collection, or builder class exists

## Inputs

- Model class name
- Observer class name(s)
- Scope class name(s) (optional)
- Custom collection class name (optional)
- Custom builder class name (optional)

## Workflow

1. Create the observer, scope, collection, or builder class if not already done
2. Add the `#[ObservedBy]` attribute above the model class declaration:
   ```
   use Illuminate\Database\Eloquent\Attributes\ObservedBy
   
   #[ObservedBy(OrderObserver::class)]
   class Order extends Model {}
   ```
3. Stack multiple attributes for multiple registrations:
   ```
   #[ObservedBy(OrderObserver::class)]
   #[ObservedBy(AuditObserver::class)]
   #[ScopedBy(TenantScope::class)]
   #[CollectedBy(OrderCollection::class)]
   #[UseEloquentBuilder(OrderBuilder::class)]
   class Order extends Model {}
   ```
4. Group all attributes in a consistent order above the class declaration
5. Remove any duplicate registrations from service providers or `boot()` methods

## Validation Checklist

- [ ] `#[ObservedBy]` used instead of `Model::observe()` in service providers
- [ ] Multiple attributes are stacked (one per registration), not combined into arrays
- [ ] All attribute registrations are grouped above the class declaration
- [ ] Service provider `observe()` calls are removed for attribute-registered observers
- [ ] Child models do not duplicate parent attribute registrations
- [ ] Runtime-conditional registrations still use `boot()` methods

## Common Failures

- **Missing import**: The attribute class (e.g., `ObservedBy`) must be imported. Add `use Illuminate\Database\Eloquent\Attributes\ObservedBy`.
- **Duplicate registration**: Both `#[ObservedBy]` on the model and `Model::observe()` in a service provider for the same observer. Remove the service provider call.
- **Array argument**: `#[ObservedBy([Observer1::class, Observer2::class])]` is non-standard. Use stacked attributes instead.

## Decision Points

- **Attribute vs boot()**: Use attributes for unconditional, static registration. Use `boot()` when the registration condition is runtime-dependent (e.g., `auth()->check()`).
- **Attribute vs service provider**: Always prefer attributes for discoverability. Use service provider `observe()` only when attributes are not feasible (third-party packages, conditional registration).

## Performance Considerations

- Attributes are resolved at class-load time — no runtime overhead
- Removing `boot()` method calls eliminates unnecessary method execution

## Security Considerations

- Observers registered via attributes have the same security implications as service provider registration

## Related Rules

- Prefer Attributes Over Boot Method Registration
- Stack Multiple Attributes for Multiple Registrations
- Group All Attribute Registrations Together
- Use `#[ScopedBy]` Over `addGlobalScope` in `boot()`
- Keep `boot()` Reserved for Runtime-Conditional Registration

## Related Skills

- Observer Registration with #[ObservedBy]
- Trait Decomposition for Cross-Cutting Concerns
- Base Model Class Configuration

## Success Criteria

- Model registration is fully visible at the class declaration level
- No duplicate observer registrations exist
- Runtime-conditional registrations are clearly distinguished from static ones
- All attributes follow consistent ordering and naming conventions
