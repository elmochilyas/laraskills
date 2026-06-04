# Scoped Bindings

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Scoped Bindings
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

Scoped bindings automatically validate that a child route parameter belongs to its parent by resolving the child through the parent's Eloquent relationship. When enabled for a nested route like `/users/{user}/posts/{post}`, scoped binding ensures Post belongs to User — if Post 999 belongs to User 2 but the URL specifies User 1, the route returns 404 instead of resolving Post 999.

The engineering significance of scoped bindings is that they are a security feature, not merely a convenience. Without scoped bindings, every nested resource controller must manually verify parent-child relationships in every method — a repetitive, error-prone task that is frequently forgotten in production code. Stephen Rees-Carter's "Securing Laravel" analysis identifies missing scoped bindings as a top-3 data leakage vulnerability in multi-tenant Laravel applications.

Scoped binding works by inferring the parent-child relationship from parameter ORDER in the URI, not from explicit declarations. The first parameter is the parent, the second is the child. The child is resolved by calling `resolveChildRouteBinding()` on the resolved parent model, which queries through the parent's Eloquent relationship method.

---

## Core Concepts

### Scope Binding Flag
`Route::scopeBindings()` enables scoped binding on a route or route group. `Route::withoutScopedBindings()` explicitly disables it. The flag is stored in the route's action array as `scope_bindings`.

State machine for scoped binding behavior:
- `scope_bindings = true` → Scoped binding IS enforced
- `scope_bindings = false` (default) → Scoped binding is NOT enforced, UNLESS the child parameter has a custom binding field (inline `{post:slug}`)
- Parent-child resolution depends on parameter position, not explicit relationship naming

### Automatic Scoping with Custom Keys
When a nested route uses inline binding field syntax (`/users/{user}/posts/{post:slug}`), scoped binding is AUTOMATICALLY enabled for that parameter — even without `->scopeBindings()`. The presence of a binding field on the child parameter triggers scoped resolution.

This is because custom keys imply non-trivial binding logic, and the framework assumes that if you're customizing the child's key, you want the parent-child validation.

### Resource Scoping
`Route::resource('users.posts', PostController::class)->scoped()` enables scoped bindings for all routes in the resource. It accepts an array to customize the binding fields:
```php
Route::resource('users.posts', PostController::class)
    ->scoped(['post' => 'slug']);
```
This sets `{post:slug}` on all routes in the resource.

### Parent Detection Logic
`Route::parentOfParameter($parameterName)` returns the previous parameter in the route's parameter list. For `/users/{user}/posts/{post}`:
- `parentOfParameter('post')` returns `{user}`
- `parentOfParameter('user')` returns `null`

The parent is determined purely by position, not by any semantic analysis of model relationships.

---

## Mental Models

### Scoped Binding as Route-Level Authorization
Without scoped bindings, `/organizations/1/users/999` resolves User 999 regardless of whether they belong to Organization 1. With scoped bindings, the route returns 404 if User 999 is not in Organization 1. This is authorization at the routing layer — the route itself validates the parent-child relationship before the controller is ever reached.

### Parameter ORDER as Relationship Declaration
The ordering of parameters in the URI IS the relationship declaration. First parameter = parent, second parameter = child. `/categories/{category}/products/{product}` declares that Product belongs to Category, regardless of whether the models actually have that relationship defined. If the relationship doesn't exist on the model, scoped binding throws an error when it tries to call `$category->products()`.

### Default-Off Security
Scoped binding is OFF by default because:
1. Most routes are not nested (no parent-child relationship to validate)
2. The default assumption is that each parameter is independently resolvable
3. Enabling scoping by default would break existing routes that don't define relationships

This means security-conscious developers must explicitly opt in to scoped binding on every nested route — a source of frequent oversights.

---

## Internal Mechanics

### Scoped Binding Resolution Flow

```
ImplicitRouteBinding::resolveForRoute($container, $route)
  ├── For each UrlRoutable parameter:
  │     ├── $parameterName = parameter name
  │     ├── $value = $route->parameter($parameterName)
  │     ├── $field = $route->bindingFieldFor($parameterName)
  │     ├── $parent = $route->parentOfParameter($parameterName)
  │     │
  │     ├── if $parent exists AND parent IS UrlRoutable AND:
  │     │     (route->enforcesScopedBindings() OR $field !== null):
  │     │     └── $parentInstance = $route->parameter($parent->name)
  │     │     └── $model = $parentInstance->resolveChildRouteBinding(
  │     │              $parameterName, $value, $field
  │     │          )
  │     │
  │     └── else:
  │           └── $model = $modelInstance->resolveRouteBinding($value, $field)
  │
  └── Set each resolved model on route parameter
```

### resolveChildRouteBinding on Model

Parent model's `resolveChildRouteBinding($childType, $value, $field)`:
1. Determine relationship method: `$this->childRouteBindingRelationshipName($childType)` — returns the plural camelCase name (e.g., `'posts'` for child type `'post'`)
2. Call `$this->{$relationship}()` to get the relationship query
3. Call `resolveRouteBindingQuery()` on the related model with `$value` and `$field`
4. Execute `first()` — if null, `resolveChildRouteBinding` returns null (triggering 404)

The `childRouteBindingRelationshipName()` method converts the child type to plural camelCase: `'post'` → `'posts'`, `'category'` → `'categories'`. For irregular plurals, override this method.

### Soft-Delete Scoped Resolution
If the child model uses `SoftDeletes` and the route has `withTrashed()` enabled, scoped resolution calls `resolveSoftDeletableChildRouteBinding()`:
```php
$parent->{$relationship}()->withTrashed()->where($field, $value)->first();
```

---

## Patterns

### Explicit Route Group Scoping
```php
Route::prefix('organizations/{organization}')->group(function () {
    Route::scopeBindings()->group(function () {
        Route::resource('users', OrganizationUserController::class);
        Route::resource('settings', OrganizationSettingController::class);
    });
});
```
All nested routes under `organizations/{organization}` are scoped.

### Resource-Level Scoping with Custom Keys
```php
Route::resource('categories.products', ProductController::class)
    ->scoped(['product' => 'sku']);
```
Uses `{product:sku}` for the nested parameter, automatically scoping through the category relationship.

### Manual Route Scoping
```php
Route::get('/categories/{category}/products/{product:slug}', [ProductController::class, 'show'])
    ->scopeBindings();
```
Explicit scoping on a single route with custom binding field.

### Relationship Name Customization
```php
class Category extends Model
{
    public function childRouteBindingRelationshipName($childType)
    {
        return match ($childType) {
            'product' => 'activeProducts',
            default => parent::childRouteBindingRelationshipName($childType),
        };
    }
}
```
Override the relationship name when the model's relationship doesn't match the default naming convention.

---

## Architectural Decisions

### Why Parameter Position, Not Relationship Declaration
Scoped binding infers parent-child from parameter ORDER rather than requiring explicit relationship declarations in route definitions. This decision prioritizes conciseness (no additional route configuration) at the cost of fragility (parameter order changes break the scope relationship without explicit error).

### Why Scoping Is Off by Default
Scoped binding is off by default for backward compatibility. Enabling it by default would break every existing nested route where the parent-child relationship was not validated. The framework chooses explicit opt-in over silent behavior changes.

### Why Custom Keys Auto-Enable Scoping
When a child parameter uses inline binding field syntax (`{post:slug}`), scoped binding is automatically enabled because:
1. Custom keys indicate deliberate route design — the developer is already thinking about binding behavior
2. Non-scoped custom key binding could resolve a child that doesn't belong to the parent, creating a security gap
3. The binding field syntax suggests a well-designed URL hierarchy that expects parent-child validation

---

## Tradeoffs

### Scoped vs Unscoped Binding

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Scoped: Automatic parent-child validation | Requires Eloquent relationship on parent model | Missing relationship → resolution failure |
| Scoped: No manual verification in controllers | Additional query through parent relationship | Slightly more DB queries per request |
| Unscoped: Simple, always resolves by primary key | Risk of cross-parent data access | Every controller must manually verify parent-child |

### Automatic Scoping (Custom Keys) vs Explicit Scoping

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto: No extra flag needed | Inconsistent behavior — depends on route syntax | Some routes scoped, others not — easy to miss |
| Explicit: Clear intent, consistent behavior | Extra `->scopeBindings()` call everywhere | Verbose but safe |

---

## Performance Considerations

### Additional Query via Relationship
Scoped binding adds one query through the parent's relationship: `$parent->children()->where('slug', $value)->first()`. This is equivalent to the standard binding query but scoped through the relationship constraint. The additional cost is the relationship constraint clause — negligible for most queries.

### Relationship Method Resolution
Each scoped binding calls the parent's relationship method to get the relationship query builder. For simple `hasMany`/`belongsTo` relationships, this is a cached relation instance. For complex polymorphic or nested relationships, this may trigger additional query building.

### N+1 Avoidance
Scoped binding does NOT eager load the resolved model's relationships. If the controller accesses `$post->author`, it triggers a separate query. This is consistent with standard binding behavior.

---

## Production Considerations

### Multi-Tenant Scope Verification
In multi-tenant applications, scoped bindings should be enabled on ALL nested routes as a security baseline. Stephen Rees-Carter recommends:
```php
Route::scopeBindings()->group(function () {
    // ALL nested routes
});
```
This ensures no nested route can accidentally access data outside the parent scope.

### Missing Relationship Detection
If a parent model doesn't have the expected relationship method, `resolveChildRouteBinding()` calls `$parent->{$method}()`, which throws a `BadMethodCallException` at resolution time. This is a development-time failure that should be caught during route testing.

### Relationship Name Mismatch
The default relationship name conversion (`post` → `posts`) assumes standard pluralization. For irregular plurals or custom relationship names, override `childRouteBindingRelationshipName()` on the parent model.

---

## Common Mistakes

### Not Using Scoped Bindings on Nested Routes
Why it happens: Scoped binding is off by default and requires explicit opt-in. Why it's harmful: A user can access `/organizations/1/users/999` and retrieve User 999 even if they belong to Organization 2. This is a data leakage vulnerability. Better approach: Enable `->scopeBindings()` on every nested resource.

### Assuming Relationship Name Matches Parameter Name
Why it happens: The default naming convention suggests `{post}` → `posts()` relationship. Why it's harmful: If the parent uses `articles()` for the relationship, scoped binding calls `$category->posts()` which doesn't exist. Better approach: Override `childRouteBindingRelationshipName()` to match the actual relationship name.

### Deep Nesting Without Scoping at Each Level
Why it happens: Developer enables scoping on the outermost level but assumes it cascades. Why it's harmful: Each nesting level must independently scope its parent-child relationship. `/a/{a}/b/{b}/c/{c}` needs scoping at `b→a` AND `c→b`. Better approach: Enable scoping at the group level for nested routes.

### Expecting Scoped Binding Without Relationship
Why it happens: Using `->scopeBindings()` on a route where the parent doesn't have the expected relationship. Why it's harmful: Resolution fails with `BadMethodCallException`. Better approach: Ensure the parent model has the correct relationship before enabling scoped bindings.

---

## Failure Modes

### Parent Not Resolved Before Child
If the parent parameter fails to resolve (model not found), the child scoped binding cannot execute because `$parent` is null. The route returns 404 with the parent's "not found" error, not the child's. This is correct behavior but can be confusing when debugging: the error message refers to the parent model, not the child.

### Irregular Plural Relationship Name
Parameter `{child}` infers relationship name `children()`. If the model uses `kids()`, the scoped resolution fails. Error: "Method Model::children does not exist." Override `childRouteBindingRelationshipName()` to fix.

### Scoped Binding Disabled for Specific Route
`Route::withoutScopedBindings()` disables scoping on a route where the parent group has `scopeBindings()` enabled. If the disabled route accesses data across parent boundaries, it creates a security gap that is invisible during group-level review.

---

## Ecosystem Usage

### Laravel Framework
Laravel doesn't use scoped bindings in its first-party route definitions. Framework routes are flat (not nested).

### Jetstream
Jetstream uses scoped bindings implicitly for team-related routes. Team member management routes validate that the user belongs to the team through the relationship.

### Spatie Packages
Spatie packages avoid nested route parameters. They use flat route structures where scoped binding is unnecessary.

### Monica CRM
Monica's nested routes for contacts, activities, and journals do NOT use scoped bindings. They rely on global scopes for account isolation instead.

---

## Related Knowledge Units

### Prerequisites
- Route Model Binding Implicit — The base mechanism that scoped binding overrides for child parameters
- Custom Route Keys — Inline syntax that triggers automatic scoped binding

### Related Topics
- Resourceful Routing — `->scoped()` method on nested resources
- Route Groups — `->scopeBindings()` at the group level

### Advanced Follow-up Topics
- Route Caching — How scoped binding flags are serialized in cached routes
- Security & Identity Engineering — Authorization patterns for multi-tenant data access

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ImplicitRouteBinding.php` — `resolveForRoute()` scoping logic
- `Illuminate\Routing\Route.php` — `parentOfParameter()`, `scopeBindings()`, `withoutScopedBindings()`, `bindingFieldFor()`
- `Illuminate\Database\Eloquent\Model.php` — `resolveChildRouteBinding()`, `childRouteBindingRelationshipName()`, `resolveSoftDeletableChildRouteBinding()`
- `Illuminate\Routing\PendingResourceRegistration.php` — `scoped()` resource method

### Key Insight
Scoped binding is the only security boundary that applies at the routing layer rather than the controller or policy layer. This makes it unique in Laravel's authorization model: it prevents unauthorized data access before any application code runs. Missing scoped bindings cannot be caught by controller-level authorization tests because the controller never receives the cross-parent model.

### Version-Specific Notes
- Scoped binding behavior is consistent across Laravel 8-13
- `childRouteBindingRelationshipName()` added in Laravel 9 for relationship name override
- `withTrashed()` + scoped binding support added in Laravel 10
- Custom keys auto-enabling scoped binding was refined in Laravel 11
