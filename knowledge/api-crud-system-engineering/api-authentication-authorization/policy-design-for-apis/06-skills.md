# Skill: Design API Policy Authorization

## Purpose
Create Laravel Policies per model for API resource authorization with `view`, `create`, `update`, `delete` methods, register with model, and apply via `Gate` or `authorize()` in controllers.

## When To Use
- Model-level authorization on API endpoints
- CRUD operations requiring ownership checks
- Role/permission-based resource access

## When NOT To Use
- Simple role-based access without model checks — use middleware or gates
- Actions not tied to a model — use Gates or `authorize()` without Policy

## Prerequisites
- Laravel authorization system
- User roles/permissions

## Inputs
- Model authorization rules per action
- User roles and permissions

## Workflow
1. Generate Policy per resource: `php artisan make:policy PostPolicy --model=Post`
2. Define action methods: `viewAny(User $user)`, `view(User $user, Post $post)`, `create(User $user)`, `update(User $user, Post $post)`, `delete(User $user, Post $post)`
3. Implement ownership check: `return $user->id === $post->user_id`
4. Register Policy with model in `AuthServiceProvider::$policies`
5. Authorize in controller: `$this->authorize('update', $post)` — called before business logic
6. Authorize in resource endpoints: `$this->authorize('viewAny', Post::class)` for index
7. Use `Gate::before()` for super-admin bypass — always return true for admins
8. Return ownership check results — never throw from Policy, let framework handle 403
9. Test each Policy method — authorization for owned, non-owned, and unauthenticated
10. Use Policy auto-discovery when controller and Policy follow naming conventions

## Validation Checklist
- [ ] Policy generated per model
- [ ] Policy methods defined for all CRUD actions
- [ ] Ownership check implemented for user-owned resources
- [ ] Policy registered in AuthServiceProvider
- [ ] Controller methods authorized with `$this->authorize()`
- [ ] Super-admin gateway via `Gate::before()`
- [ ] Policy returns boolean, never throws
- [ ] Every Policy method tested (owned, not-owned, unauthenticated)
- [ ] Auto-discovery working or policies registered
- [ ] Policy applicable to nested resource authorization

## Common Failures
- `$this->authorize()` called after business logic — operation runs before authorization
- Policy not registered — `$this->authorize()` silently passes for certain actions
- Ownership check not included — any authenticated user can modify any resource
- No `viewAny` method — index endpoint unauthorized by default (returns false)
- Super-admin bypass not implemented — admins blocked by ownership checks
- Policy returns void (throws manually) instead of boolean — inconsistent with framework expectations

## Decision Points
- Policy method granularity — separate per action vs combined (view/viewAny)
- Gate::before vs role check in each method — Gate::before for all admin, method check for granular roles
- Auto-discovery vs manual registration — auto-discovery for convention, manual for explicit

## Performance Considerations
- Policy resolution is cached per request — one-time lookup
- Ownership check adds one query if user-model relationship not loaded — eager-load if checking in loop
- Gate::before runs on every policy check — keep it simple (one boolean check)

## Security Considerations
- Policy methods return false not exception — prevents information about why access was denied
- `viewAny` controls list endpoint access — unauthorized users see no records
- Soft-delete resources — `forceDelete` requires separate policy method
- Policy must receive the correct model instance — use route model binding

## Related Rules
- Generate Policy Per Resource Model
- Define Methods For All CRUD Actions
- Implement Ownership Check In update and delete
- Register Policy In AuthServiceProvider
- Authorize In Controller Before Business Logic
- Test Each Policy Method Independently

## Related Skills
- API Resource Controllers — for policy integration
- Token Ability Design — for token-scoped authorization
- Action Class Design — for action-level authorization
- Sanctum Token Auth — for token-based auth with policies

## Success Criteria
- Each model has a Policy covering all CRUD actions
- Ownership checks prevent unauthorized modification
- Index endpoint uses `viewAny` to control list access
- Super-admin bypass works via `Gate::before()`
- Policy tested for owned, non-owned, and unauthenticated scenarios
- Controller authorization runs before any business logic
