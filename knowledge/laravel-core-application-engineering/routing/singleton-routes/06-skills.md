# Skill: Implement Singleton Routes for Singular Resources

## Purpose

Replace `Route::resource()->only([...])` with `Route::singleton()` for resources that have at most one instance per parent context (profile, avatar, settings), producing cleaner URIs without unnecessary ID parameters and explicitly communicating the resource's singular nature.

## When To Use

- Resources with exactly one instance per parent (profile, avatar, settings)
- Resources with at most one instance (application configuration)
- Resources where ID is implicit (current user's profile)
- Replacing `Route::resource('profile')->only(['show', 'edit', 'update', 'destroy'])`

## When NOT To Use

- Resources that can have multiple instances (use `Route::resource()`)
- Resources where the "current" context is ambiguous
- Resources that need index or listing routes
- Resources that should be creatable by the user without `->creatable()`

## Prerequisites

- Controller with singleton-compatible methods (show, edit, update, destroy)
- Understanding that the URI will have no ID parameter
- Parent context (if nested) must be resolvable

## Inputs

- Singleton resource name (singular noun)
- Controller class with show/edit/update/destroy methods
- Optional: parent resource name for nested singletons

## Workflow

1. Identify resources with at most one instance per parent context
2. Define the singleton route: `Route::singleton('profile', ProfileController::class)`
3. Remove the parameter from the URI — `{profile}` is not needed
4. In the controller, implement `show()`, `edit()`, `update()`, and `destroy()` methods without an ID parameter
5. For nested singletons, use: `Route::singleton('team.profile', ProfileController::class)`
6. If the resource may not exist initially, add `->creatable()`
7. Run `php artisan route:list` to verify URIs have no ID parameter

## Validation Checklist

- [ ] `Route::singleton()` used instead of `Route::resource()->only()`
- [ ] URI does NOT include an ID parameter (`/profile` not `/profile/{profile}`)
- [ ] Controller methods do not expect an ID parameter
- [ ] `creatable()` added if the resource may not exist initially
- [ ] Nested singletons use dot notation for the parent
- [ ] `php artisan route:list` shows singleton actions (show, edit, update, destroy)

## Common Failures

### Using Route::resource for singletons
`Route::resource('profile', ...)` creates `/profile/{profile}` with an unnecessary ID parameter. Use `Route::singleton('profile', ...)` to produce `/profile`.

### Forgetting creatable() for new resources
If the singleton resource doesn't exist initially and there's no create flow, users cannot create it. Add `->creatable()` to provide create/store routes.

### Using singleton for non-singular resources
Using singleton routes for resources that can have multiple instances (team members) creates unnatural routing. Use `Route::resource()` for multi-instance resources.

## Decision Points

### Singleton vs Resource with only()?
Singleton is preferred — it communicates singular intent, eliminates the ID parameter, and generates cleaner URIs.

### creatable() or not?
Add `creatable()` if the user can initiate creation. Omit if the resource is always created as a side effect (e.g., profile auto-created on registration).

## Performance Considerations

Singleton routes generate 4 Route objects (show, edit, update, destroy) — 6 with `creatable()` (adds create, store). Negligible vs resource routes. All singleton routes are preserved in route cache.

## Security Considerations

- Singleton routes have no ID parameter, reducing enumeration risk
- For authenticated resources (current user's profile), ensure the singleton resolves the correct resource for the current user
- Nested singletons should use scoped bindings to ensure the singleton belongs to the parent context

## Related Rules

- Prefer Singleton Over Resource with only()
- Use creatable() When the Resource May Not Exist
- Do Not Use Singleton for Non-Singular Resources

## Related Skills

- Configure Creatable Singleton Resources
- Register Resourceful Routes with Explicit Action Control
- Define Application Routes

## Success Criteria

- Singleton routes produce clean URIs without ID parameters (`/profile`)
- Controller methods work without an ID parameter
- `php artisan route:list` shows only singleton-appropriate actions
- The resource's singular nature is obvious from the route definition

---

# Skill: Configure Creatable Singleton Resources

## Purpose

Add `->creatable()` to singleton routes when the resource may not exist initially and needs user-initiated creation, providing the complete resource lifecycle — create, store, show, edit, update, destroy — while maintaining the ID-less URI pattern.

## When To Use

- Singleton resources that users must create (upload avatar, set up profile)
- Resources that don't auto-create on first access
- Resources that need a creation form and submission endpoint

## When NOT To Use

- Resources that auto-create as a side effect (profile created on registration)
- Resources that always exist (application configuration seeded in database)
- Singleton routes without a creation flow (read-only or always-present)

## Prerequisites

- Singleton route already configured
- Controller has `create()` and `store()` methods in addition to show/edit/update/destroy
- View or form for the create action

## Inputs

- Singleton route definition
- Controller with create/store methods
- Optional: parent resource for nested creatable singletons

## Workflow

1. Define the singleton route: `Route::singleton('avatar', AvatarController::class)`
2. Chain `->creatable()` to add create and store routes: `->creatable()`
3. Add `create()` method to the controller showing the creation form
4. Add `store()` method to the controller handling the creation submission
5. Verify routes with `php artisan route:list` — should show create and store in addition to show/edit/update/destroy
6. Test the full lifecycle: navigate to create form, submit, view the created resource, edit, update, delete

## Validation Checklist

- [ ] `->creatable()` chained on the singleton route
- [ ] Controller has `create()` and `store()` methods
- [ ] `php artisan route:list` shows create and store routes
- [ ] Create form renders correctly
- [ ] Store action creates the resource successfully
- [ ] After creation, show/edit/update/destroy work
- [ ] Duplicate creation attempts are handled (resource already exists)

## Common Failures

### Forgetting creatable()
`Route::singleton('avatar')` without `creatable()` provides no way to create the avatar if one doesn't exist. Users see 404 on show with no creation flow.

### Creating duplicate singletons
Without a check in the controller, users could create multiple instances. The store method should check if a singleton already exists and either redirect or reject.

## Decision Points

### creatable() vs manual create/store routes?
`creatable()` is the canonical approach — it generates standard create/store routes and maintains the singleton pattern. Manual routes may be needed for non-standard creation flows.

## Performance Considerations

Adding `creatable()` generates 2 additional Route objects (create, store). No performance impact beyond standard route registration.

## Security Considerations

- The store method must check if the singleton already exists to prevent duplicate creation
- Authorization must be applied to create/store actions independently of show/edit/update/destroy
- File upload singletons (avatar) need validation and size limits

## Related Rules

- Use creatable() When the Resource May Not Exist
- Prefer Singleton Over Resource with only()
- Do Not Use Singleton for Non-Singular Resources

## Related Skills

- Implement Singleton Routes for Singular Resources
- Register Resourceful Routes with Explicit Action Control
- Define Application Routes

## Success Criteria

- Users can create the singleton resource when it doesn't exist
- After creation, all CRUD operations work on the singleton
- Duplicate creation attempts are gracefully rejected
- `php artisan route:list` shows the complete singleton lifecycle
- The create/store routes follow the same ID-less URI pattern
