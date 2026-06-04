| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Singleton Resource Controllers |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Resource Controller Pattern, Route Model Binding Basics |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Singleton resources represent domain concepts with exactly one instance per parent context — a user's profile, an application's settings, a team's avatar. Laravel's `Route::singleton()` registers a controller with a reduced method set (`show`, `edit`, `update`, `destroy`) operating on an implicitly resolved instance without an explicit ID parameter. URLs shorten from `/users/{user}/profile/{profile}` to `/users/{user}/profile`. The framework resolves the singleton via the parent model's relationship method, eliminating redundant identifiers.

## Core Concepts

- **No ID Parameter**: Singleton routes omit `{resource}` from the URI — the resource is singular by definition.
- **Reduced Method Set**: `show`, `edit`, `update`, `destroy`. No `index` (only one instance), no `store` (implicitly created), no `create` (always exists).
- **Creatable Singleton**: The `->creatable()` option adds `create` and `store` routes for resources that may not exist yet.
- **Nested Singleton Resolution**: The singleton resolves relative to its parent via a relationship method — `$parent->profile()` for a `profile` singleton.
- **Intent Signaling**: Using `singleton()` communicates a one-to-one domain constraint that `resource()` with `only()` cannot express.

## When To Use

- One-to-one relationships: user profile, team settings, application configuration.
- Any resource where creating a second instance for the same parent is invalid.
- Resources that always exist after parent creation (profile always exists after user registration).
- Creatable singletons: draft records, onboarding state, resources created on first access.

## When NOT To Use

- One-to-many relationships (user has many posts) — use standard resource controllers.
- Resources where the "one instance" rule may change (user might have multiple profiles later).
- Resources that require an index endpoint (even if the collection rarely has more than one item).
- Global singletons without a parent context — use simple routes or invokable controllers instead.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Use `Route::singleton()` instead of `Route::resource(...)->only(...)` | Singleton routes omit the `{id}` parameter entirely; `only()` cannot achieve this URL structure |
| Align relationship method names with the singleton resource name | Laravel resolves the singleton by calling `$parent->{resourceName}()` — mismatch causes resolution failure |
| Eager-load singleton relationship when listing parents | Prevents N+1 queries when accessing singletons in a loop across parent collection |
| Only use `creatable` when the resource may not exist | Most singletons exist after parent creation; unnecessary `creatable` adds unused routes |
| Create singleton via lifecycle hook when parent is created | Eliminates missing-instance errors and null-checking in controllers |

## Architecture Guidelines

- Place singleton controllers alongside resource controllers in the directory structure.
- Singleton controllers receive the parent model as a route parameter, not the singleton itself.
- For nested singletons, pass the parent to views and let the view resolve the singleton relationship.
- When the singleton doesn't exist on a non-creatable route, return 404 explicitly or let model-not-found exceptions render.
- Document singleton relationships in the API style guide: "All one-to-one resources use singleton routing."

## Performance Considerations

- Singleton resolution triggers one Eloquent query on the parent relationship per request.
- N+1 hazard: iterating parent collection and accessing singleton in each iteration triggers O(n) queries.
- Use `->with('profile')` on the parent query to eager-load the singleton relationship.
- No performance difference vs `resource()` with `only()` — the benefit is URL structure and intent, not speed.

## Security Considerations

- Singleton resolution is scoped to the parent relationship — test that User A cannot access User B's singleton.
- Creatable singleton routes require authorization: not every parent should be able to create a singleton.
- Static resolution (`Profile::first()`) rather than scoped resolution leaks data across parents.
- Always verify parent-child ownership in policies, even with singleton routes.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Treating singletons as regular resources with `Route::resource()->only()` | Unaware that `Route::singleton()` exists | URLs include unnecessary `/{profile}` parameter | Use `Route::singleton()` for genuinely one-to-one resources |
| Relationship method name mismatch | Relationship named `settings()` but singleton named `profile` | Resolution fails with 500 error | Align relationship names with singleton resource name |
| Using singleton for one-to-many resources | Misunderstanding the boundedness of the domain concept | API breaks when domain allows multiple instances | Use standard resource controllers unless one-to-one is guaranteed |
| Missing eager load on parent listing | Accessing singleton in a loop | N+1 query explosion | Always use `->with('singleton')` on parent queries |

## Anti-Patterns

- **Singleton for globally unique resources without a parent**: A "site settings" resource that is truly global should be an invokable controller, not a singleton.
- **Non-creatable singleton with no lifecycle hook**: Controller throws 404 on every access because the singleton was never created during parent registration.
- **Singleton controller with `index` method**: By definition there is only one instance; an index endpoint is meaningless.
- **Casting non-singleton relationships as singletons for URL aesthetics**: If the domain allows multiple, use a resource controller.

## Examples

- **Basic singleton route**: `Route::singleton('profile', ProfileController::class);`
- **Creatable singleton route**: `Route::singleton('profile', ProfileController::class)->creatable();`
- **Singleton controller**: `class ProfileController extends Controller { public function show(User $user) { return $user->profile; } public function update(User $user, Request $request) { $user->profile->update($request->validated()); } }`
- **Nested singleton registration**: `Route::singleton('profile', ProfileController::class)->creatable();` inside `Route::group(['prefix' => 'users/{user}'])` or as `Route::resource('users.profile', ...)` using the dot-notation.

## Related Topics

- Resource Controller Pattern — The standard seven-method pattern that singleton controllers extend
- Nested Resources & Shallow Nesting — Parent-child route scoping that complements singleton routing
- API Resource Controllers — API-specific resource registration without create/edit views
- Controller Dependency Injection — Injecting services into singleton controllers

## AI Agent Notes

- Generate singleton controllers with `Route::singleton()` not `Route::resource()`.
- Ensure parent-child relationship exists on the parent model for singleton resolution.
- Add `->creatable()` only when the resource may not exist on access.
- Eager-load the singleton relationship in parent queries to prevent N+1.
- Type-hint the parent model (not the singleton) in controller method signatures.

## Verification

- [ ] `Route::singleton()` used instead of `Route::resource()->only()`
- [ ] URLs do NOT contain `{profile}` or similar ID parameters
- [ ] Relationship method on parent matches singleton resource name
- [ ] Parent model eager-loads the singleton when listing parents
- [ ] Authorization verified: user cannot access another user's singleton
- [ ] Lifecycle hook creates the singleton if non-creatable route is used
