# Route Model Binding — Implicit

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Route Model Binding — Implicit
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-01

---

## Executive Summary

Implicit route model binding is Laravel's convention-based system for automatically resolving Eloquent models from route parameters. When a controller method type-hints a model class and the route parameter name matches the parameter name, the framework automatically queries the database, resolves the matching model, and injects it into the controller — requiring zero explicit binding code.

The engineering significance of implicit binding is its dual nature: it is simultaneously the most convenient framework feature and the most dangerous security boundary. In single-database applications where all models are accessible from all tenants, implicit binding works transparently because there is no tenant isolation to breach. In multi-tenant applications, implicit binding can become a data leakage vector — a user changes `{post}` from `42` to `43` and accesses another tenant's content if no tenant-scoping mechanism is in place.

The resolution behavior has evolved significantly. Laravel 11 introduced `preventModelParameterMismatch()` which throws an exception when the route parameter name doesn't match the controller parameter name — a common source of silent binding failures. Scoped bindings for nested resources were refined multiple times across Laravel 9-12 to fix edge cases, and soft-delete binding support was formalized.

---

## Core Concepts

### Convention-Based Resolution
Implicit binding resolves a route segment to an Eloquent model when three conditions are met:
1. The route contains a parameter: `/users/{user}`
2. The controller method has a type-hinted parameter: `User $user`
3. The parameter names match: `{user}` → `$user`

When these conditions hold, the framework calls `Model::resolveRouteBinding($value)` which executes `Model::where($field, $value)->firstOrFail()`.

### UrlRoutable Contract
Eloquent models implicitly implement `Illuminate\Contracts\Routing\UrlRoutable`, which defines:
- `getRouteKey()` — Returns the value used in URLs (`$this->getKey()` by default, typically `$this->id`)
- `getRouteKeyName()` — Returns the column name (`$this->getKeyName()` by default)
- `resolveRouteBinding($value, $field = null)` — Default: `where($field ?? $this->getRouteKeyName(), $value)->firstOrFail()`
- `resolveChildRouteBinding($childType, $value, $field)` — Resolves through a parent relationship
- `resolveRouteBindingQuery($query, $value, $field)` — Customize the query before execution

### Resolution Pass Order
Implicit binding runs as the SECOND pass in `SubstituteBindings` middleware:
1. `Router::substituteBindings()` — Explicit bindings (Route::model(), Route::bind())
2. `Router::substituteImplicitBindings()` — Implicit bindings (type-hinted models + enums)

This ordering means explicit bindings take priority — if both an explicit and implicit binding exist for the same parameter, the explicit binding runs first and the implicit binding has no parameter left to resolve.

### Two-Pass Internal Resolution
`ImplicitRouteBinding::resolveForRoute()` performs two internal passes:
1. **Enum pass** — `resolveBackedEnumsForRoute()`: Resolves backed enums from route parameters
2. **Model pass** — Iterates signature parameters, resolves `UrlRoutable` subclasses

Enums are resolved before models to prevent enum route parameters from conflicting with model parameters that share the same name.

### Soft Delete Handling
If a route has `withTrashed()` and the model uses `SoftDeletes`, implicit binding calls `resolveSoftDeletableRouteBinding()` which uses `->withTrashed()->first()` instead of the standard query. This is determined by checking the model's trait list via `class_uses_recursive()`.

---

## Mental Models

### Name-Based Convention
The binding convention is name-based: `{user}` matches `$user` matches `User::class`. The framework assumes the parameter name is the snake_case version of the model's class name. This convention works for simple cases but breaks down when route parameters have non-obvious names or when a controller method has multiple parameters of the same type.

### Model as Parameter Decoder
Implicit binding treats the model as a translator from a primitive value (string/integer from URL) to a rich domain object. The controller never sees the raw `$id` — it receives the fully-loaded model. This eliminates the `findOrFail()` call that would otherwise appear at the start of every controller method.

### Silent Resolution vs Explicit Query
Implicit binding hides the database query from the controller code. The developer writes `User $user` and the framework executes `User::where('id', $value)->firstOrFail()`. The query is invisible — it cannot be optimized, logged, or modified by the controller without moving to explicit binding or using `resolveRouteBindingQuery()` overrides.

---

## Internal Mechanics

### ImplicitRouteBinding::resolveForRoute()

```
resolveForRoute($container, $route)
  ├── resolveBackedEnumsForRoute($route)
  │     ├── Route::signatureParameters(['backedEnum' => true])
  │     ├── For each backed enum parameter:
  │     │     ├── $value = $route->parameter($parameterName)
  │     │     ├── $enumClass::tryFrom($value)
  │     │     └── if null: throw BackedEnumCaseNotFoundException
  │     │     └── else: $route->setParameter($name, $resolvedEnum)
  │     └── Returns early (enums are resolved first)
  │
  ├── resolveForRoute($container, $route)
  │     ├── Route::signatureParameters(['subClass' => UrlRoutable::class])
  │     ├── For each UrlRoutable parameter:
  │     │     ├── $model = $container->make($parameterClass)  // Fresh model instance
  │     │     ├── $value = $route->parameter($parameterName)
  │     │     ├── Check if implicitBinding($parameterName) is enabled
  │     │     ├── $field = $route->bindingFieldFor($parameterName)  // Inline {param:field}
  │     │     ├── if binding not disabled:
  │     │     │     ├── Check parent parameter for scoped binding:
  │     │     │     │     ├── $parent = $route->parentOfParameter($parameterName)
  │     │     │     │     ├── if parent is UrlRoutable AND (scopeBindings OR has bindingField):
  │     │     │     │     │     └── $model = $parent->resolveChildRouteBinding(...)
  │     │     │     │     └── else:
  │     │     │     │           └── $model = $model->resolveRouteBinding($value, $field)
  │     │     │     └── $route->setParameter($name, $model)
  │     └── Return route with resolved parameters
```

### Signature Parameters Reflection
`Route::signatureParameters()` calls `RouteSignatureParameters::fromAction()` which uses PHP's `ReflectionFunction` (for Closures) or `ReflectionMethod` (for controllers) to inspect the route handler's parameter list. The results are NOT cached between requests — reflection runs on every request. However, PHP OpCache may cache the reflection class metadata.

### Model Instance Creation
The container creates a fresh model instance via `Container::make($class)` for every binding resolution. This instance is used only for the `resolveRouteBinding()` call and is discarded. The container-based creation ensures that any model constructor configuration (guarded attributes, appends, hidden) is correctly applied.

---

## Patterns

### Standard Implicit Binding Pattern
```php
// Route: /users/{user}
// Controller: show(User $user) { return $user; }
```
The default pattern — id-based, no customization, works for single-tenant applications.

### Slug-Based Implicit Binding Pattern
```php
// Route: /posts/{post:slug}
// Controller: show(Post $post) { return $post; }
```
Uses inline binding field syntax to change the query column without modifying the model.

### Model-Level Key Customization Pattern
```php
// Model: getRouteKeyName() { return 'uuid'; }
// Route: /users/{user}  →  resolves via uuid
```
The model declares its default route key. All implicit bindings use this field automatically.

### Soft Delete Binding Pattern
```php
// Route: /users/{user}->withTrashed()
// Controller: show(User $user) { ... }
```
Soft-deleted models are resolvable for this specific route.

---

## Architectural Decisions

### Why Explicit Runs Before Implicit
Explicit bindings (`Route::model()`, `Route::bind()`) run first because they often establish context required for implicit resolution. For example, an explicit binding might resolve a tenant or organization that subsequent implicit bindings use as a scoping parent (via scoped bindings). If implicit ran first, it would resolve models without the context the explicit binding provides.

### Why Enums Run Before Models
Backed enum resolution runs before model resolution to prevent parameter name conflicts. If a route has `{category}` and the controller accepts `Category $category` where `Category` is an enum, enum resolution must run first because the framework needs to distinguish between enum parameters and model parameters. The `resolveBackedEnumsForRoute()` pass strips enum parameters before the model pass processes the remaining parameters.

### Why a Fresh Model Instance Is Created
`ImplicitRouteBinding` calls `Container::make($class)` to create a model instance for each resolution rather than reusing an existing one. This ensures:
- Each resolution is independent (no shared state from previous requests)
- Model constructor config is always applied
- If the model class is an interface with container binding, that binding is respected

The cost is one model instantiation per bound parameter per request — negligible for typical use.

---

## Tradeoffs

### Implicit vs Explicit Binding

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-config: Add type-hint, get model | Invisible query: Controller doesn't control the query | Cannot add eager loading, withTrashed (implicitly), or custom conditions |
| Convention-based: Works by naming | Silent failure: Parameter name mismatch causes empty model | Laravel 11's `preventModelParameterMismatch()` mitigates this |
| Consistent: Standardized resolution | No per-route customization without explicit binding | Every route for the same model behaves identically |

### Implicit Binding in Multi-Tenant vs Single-Tenant

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single-tenant: Perfectly safe (no tenant isolation needed) | No tenant scope by default | Never a data leakage concern |
| Multi-tenant: Convenient if global scopes are applied | Data leakage if global scopes are missing | User can access another tenant's records via URL manipulation |

---

## Performance Considerations

### Reflection Cost Per Request
Each request with implicit binding calls `Route::signatureParameters()` which reflects on the controller method's parameter list. For a typical controller with 2-3 typed parameters, this adds ~0.5-1ms. The reflection results are not cached between requests.

### Database Query Cost
Each bound model triggers a `where($field, $value)->first()` query. For a page that displays a `{user}` and their `{post}`, this is two queries before the controller code executes. These queries are additive to whatever the controller and view perform.

### Fresh Model Instance Cost
`Container::make(User::class)` creates a new User instance. For simple Eloquent models with no relationships or heavy accessors, this is negligible (~0.1ms). For models with computed attributes, event listeners, or boot methods, the cost is higher (0.5-2ms).

---

## Production Considerations

### Multi-Tenant Scope Verification
In multi-tenant applications, verify that every bound model is scoped to the current tenant. Strategies:
- Global scopes on the model (automatic, works implicitly)
- `resolveRouteBindingQuery()` override that adds tenant scope
- Explicit binding with tenant-aware query
- Scoped bindings for nested resources (validates parent-child relationship)

### Parameter Name Audit
Run `php artisan route:list` and check that every route with implicit binding has matching parameter names. In Laravel 11+, `preventModelParameterMismatch()` catches mismatches at runtime, but auditing before deployment prevents surprise exceptions.

### Eager Loading in Bound Models
Implicit binding resolves the model without relationships. If the controller or view accesses relationships, each one triggers a separate query (N+1). Mitigation:
- Use `whenLoaded()` in API Resources
- Use `with()` on the relationship or move to explicit binding with `->load()`
- Accept the additional queries if they are bounded and rare

---

## Common Mistakes

### Parameter Name Mismatch
Why it happens: Route has `{phoneNumber}` but controller uses `$phone` or `$id`. Why it's harmful: No binding occurs — the controller receives an empty model instance with default attributes. Better approach: Names must match exactly, or enable `preventModelParameterMismatch()` to throw an exception.

### Forgetting the Type Hint
Why it happens: The developer adds the parameter as `$user` without the `User` type hint. Why it's harmful: The framework receives a plain string, not a model. No binding error occurs — the controller receives the raw URL segment. Better approach: Always type-hint route controller parameters.

### N+1 from Serialization
Why it happens: API Resource accesses `$this->author` without `whenLoaded()`. Why it's harmful: The bound model does not load relationships, so accessing `->author` triggers a lazy query during serialization. Better approach: Always use `whenLoaded()` in API Resources for relations on bound models.

### Not Using Scoped Bindings in Multi-Tenant Apps
Why it happens: Scoped bindings are not enabled by default. Why it's harmful: A user can access `/organizations/1/users/999` and view a user from another organization. Better approach: Enable `->scopeBindings()` on all nested resources.

---

## Failure Modes

### Model Not Found (404)
The most common implicit binding failure — the model doesn't exist for the given key. `resolveRouteBinding()` calls `firstOrFail()` internally, which throws `ModelNotFoundException`. The framework converts this to a 404 response.

### preventModelParameterMismatch (Laravel 11+)
When enabled, throws `PreventModelParameterMismatch` exception if the route parameter name doesn't match the controller parameter name. This is a safety improvement over earlier versions that silently injected empty models.

### Backed Enum Not Found
If a route segment doesn't match any enum case, `tryFrom()` returns null and the framework throws `BackedEnumCaseNotFoundException`, resulting in a 404.

### Soft Delete Resolution on Non-SoftDelete Model
Calling `->withTrashed()` on a route whose model doesn't use the `SoftDeletes` trait has no effect — the query still excludes soft-deleted records. No error is thrown.

---

## Ecosystem Usage

### Laravel Framework
Laravel uses implicit binding internally for notifications, jobs, and event broadcasting. The `UrlRoutable` contract is implemented by Eloquent models and is the foundation for all implicit resolution throughout the framework.

### Spatie Packages
Spatie packages that accept route parameters do NOT rely on implicit binding — they use explicit binding or manual resolution. Packages cannot depend on the application's models following convention.

### Monica CRM
Monica uses implicit binding for contact, activity, and journal routes. It applies global scopes for account-level isolation, making implicit binding safe in its multi-tenant context.

### Jetstream
Jetstream uses implicit binding for team member routes. Team scoping is handled via the controller's authorization check (policies), not at the binding level.

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Basic route parameter concepts
- Service Container Fundamentals — Container resolution for model instantiation

### Related Topics
- Route Model Binding Explicit — Custom resolution logic when implicit is insufficient
- Custom Route Keys — Changing the binding column via inline syntax or model override
- Scoped Bindings — Parent-child validation for nested implicit binding
- Enum Binding — Enum resolution that runs before model binding

### Advanced Follow-up Topics
- Route Caching — How cached routes restore model binding metadata

---

## Research Notes

### Source Analysis
- Laravel core `Illuminate\Routing\ImplicitRouteBinding` class — Two-pass resolution (enums first, models second) prevents parameter name conflicts
- Laravel upgrade guides (9→10→11→12) — Scoped binding refinements and `preventModelParameterMismatch()` introduction in Laravel 11
- Taylor Otwell, Laravel documentation — `resolveRouteBindingQuery()` override pattern for customizing implicit resolution without switching to explicit binding
- Laravel News (Paul Redmond) — Coverage of soft-delete binding and `withTrashed()` implicit support additions
- Stack Overflow / Laracasts — Common failure patterns: parameter name mismatch, missing type hints, multi-tenant data leakage

### Key Insight
Implicit binding's greatest strength — zero-configuration convenience — is also its greatest risk in multi-tenant contexts. The binding is invisible in the controller signature, making data leakage through URL manipulation easy to miss during code review. Global scopes or `resolveRouteBindingQuery()` overrides are necessary security measures that do not break the implicit binding pattern.

### Key Controversy
Some developers argue implicit binding should be disabled in favor of explicit binding for all routes, citing the invisible query problem (controller cannot modify or eager-load on the bound query). The counter-argument is that implicit binding is fine for simple read/show routes, and explicit binding should only be used when the query genuinely needs customization — not as a blanket rule.

### Version-Specific Notes
- Laravel 11: `preventModelParameterMismatch()` — throws exception on parameter name mismatch (opt-in)
- Laravel 10: Scoped binding refinements for nested resources
- Laravel 9: `withTrashed()` implicit support for soft-delete models
- All versions since 5.x: Core resolution behavior unchanged — `resolveRouteBinding()` → `firstOrFail()`
