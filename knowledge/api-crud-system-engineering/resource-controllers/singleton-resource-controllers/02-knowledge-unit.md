# Singleton Resource Controllers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Singleton Resource Controllers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Singleton resources represent domain concepts where only one instance exists per parent context—a user's profile, an application's settings, a team's avatar. Laravel's `Route::singleton()` registers a controller with a reduced set of methods (`show`, `edit`, `update`, `destroy`) that operate on a single, implicitly resolved instance without requiring an explicit ID parameter in the URL.

This pattern simplifies URLs from `/users/{user}/profile/{profile}` to `/users/{user}/profile` by eliminating the redundant identifier. The framework automatically resolves the singleton instance, typically through a `child` method on the parent model or by applying scoped route model binding with a custom key.

---

## Core Concepts

- **No ID Parameter**: Singleton resource routes do not include `{resource}` in the URI. The resource is singular by definition.
- **Reduced Method Set**: `show`, `edit`, `update`, `destroy`. No `index` (there is only one), no `store` (it is implicitly created), no `create` (it always exists).
- **Creatable Singletons**: `Route::singleton()` accepts a `creatable` option that adds `create` and `store` routes for resources that may not exist yet.
- **Nested Singleton Resolution**: The singleton is resolved relative to its parent, typically via a `profile()` relationship method on the parent.

---

## Mental Models

- **One-to-One REST**: The singleton pattern maps to a one-to-one database relationship. The child always exists (or can be created).
- **Implicit Scoping**: Think of the singleton as being automatically scoped to the parent—no global lookups, always contextual.
- **No Index, No Collection**: Because there is only one, there is no list endpoint. The API surface is minimal by design.

---

## Internal Mechanics

`Route::singleton()` is implemented in `Illuminate\Routing\Router` and uses a dedicated registrar, `SingletonResourceRegistrar` (part of the `ResourceRegistrar` family). The registrar registers routes without a parameterized URI for the singleton resource.

**Standard singleton routes** (non-creatable):

| Verb | URI | Action | Route Name |
|------|-----|--------|------------|
| GET | `/users/{user}/profile` | show | users.profile.show |
| GET | `/users/{user}/profile/edit` | edit | users.profile.edit |
| PUT/PATCH | `/users/{user}/profile` | update | users.profile.update |
| DELETE | `/users/{user}/profile` | destroy | users.profile.destroy |

**Additional routes with `creatable`:**

| Verb | URI | Action | Route Name |
|------|-----|--------|------------|
| GET | `/users/{user}/profile/create` | create | users.profile.create |
| POST | `/users/{user}/profile` | store | users.profile.store |

---

## Patterns

- **Basic Singleton**:
  ```php
  Route::singleton('profile', ProfileController::class);
  ```
- **Creatable Singleton**:
  ```php
  Route::singleton('profile', ProfileController::class)->creatable();
  ```
- **Nested Singleton with Dependency Resolution**:
  ```php
  class ProfileController extends Controller
  {
      public function show(User $user)
      {
          return view('profile.show', ['profile' => $user->profile]);
      }

      public function update(User $user, Request $request)
      {
          $user->profile->update($request->validated());
          return redirect()->route('users.profile.show', $user);
      }
  }
  ```

---

## Architectural Decisions

- **Why a separate `Route::singleton()` instead of `Route::resource()` with `only`?** Intent-signaling and URL structure: singleton routes lack the `{resource}` parameter entirely, which `only()` cannot achieve.
- **Why `creatable` as an option instead of always included?** Most singletons (profiles, settings) always exist after account creation. Adding `store`/`create` only when needed avoids unnecessary routes.
- **Why no `index` on singletons?** By definition, there is only one instance per parent. An index endpoint would be meaningless.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Cleaner URLs without redundant IDs | Must ensure the singleton always exists or handle missing state | Adds null-checking in controller methods |
| Explicitly communicates one-to-one relationship | Team must understand the singleton concept | Training cost for developers unfamiliar with pattern |
| Less route registration code | Increased magic for singleton instance resolution | Debugging is harder when resolution fails |

---

## Performance Considerations

- Singleton resolution typically triggers an Eloquent query on the relationship. Ensure the relationship is eager-loaded when the parent model is retrieved.
- N+1 hazard: listing parents and accessing singletons in a loop triggers relationship queries. Use `->with('profile')` on the parent query.
- No performance difference versus a resource controller with `only()` — the difference is entirely in URL structure and intent.

---

## Production Considerations

- Always eager-load the singleton relationship when listing parent resources to avoid N+1 queries.
- Implement a `hasSingleton()` check or use `optional()` in Blade views when the singleton may not exist.
- Use `creatable` only when the resource legitimately may not exist (e.g., a user's "draft profile").
- Consider an observer or lifecycle hook that creates the singleton when the parent is created to avoid missing-instance errors.

---

## Common Mistakes

- **Treating singletons as regular resources**: Wrapping singleton routes with `Route::resource()` and an `only` filter, resulting in URLs with unnecessary `/{profile}`.
  - *Why it happens:* Lack of awareness that `Route::singleton()` exists.
  - *Why it's harmful:* Bloated URLs, confusing route patterns.
  - *Better approach:* Use `Route::singleton()` for genuinely one-to-one resources.

- **Forgetting relationship method naming**: Laravel resolves the singleton by calling `$parent->{resourceName}()`. If the relationship is named differently, resolution fails.
  - *Why it happens:* The relationship name must match the singleton resource name.
  - *Why it's harmful:* 500 errors or incorrect model resolution.
  - *Better approach:* Align relationship method names with the singleton resource name or use explicit binding.

- **Using singleton when the resource could be a collection**: A user may have multiple addresses, but using singleton because "they usually have one."
  - *Why it happens:* Misunderstanding the boundedness of the domain concept.
  - *Why it's harmful:* API breaks when domain rules change (user allowed multiple profiles).
  - *Better approach:* Use standard resource controllers unless the one-to-one constraint is guaranteed by the domain.

---

## Failure Modes

- **Missing singleton instance on non-creatable route**: `show` fires but the singleton does not exist. *Detection:* 404 or model-not-found exception. *Mitigation:* Use `creatable` or ensure a lifecycle hook creates the singleton.

- **Static `Profile::first()` resolution instead of scoped resolution**: The singleton resolves globally rather than scoped to the parent. *Detection:* User A sees User B's profile. *Mitigation:* Always scope resolution through the parent relationship; test with multiple parents.

- **Route collision with parent resource**: A singleton named the same as a nested resource route parameter. *Detection:* Routes resolve to the wrong controller. *Mitigation:* Check `php artisan route:list` for conflicts; use unique names.

---

## Ecosystem Usage

- **Laravel Jetstream**: Uses singleton resources for user profile management routes.
- **Spatie Laravel Permissions**: Team settings often use a singleton pattern for role configuration per team.
- **Laravel Spark**: Billing portal uses singleton-like patterns for subscription management (one subscription per team).

---

## Related Knowledge Units

### Prerequisites
- Resource Controller Pattern
- Route Model Binding Basics

### Related Topics
- Nested Resources & Shallow Nesting
- API Resource Controllers

### Advanced Follow-up Topics
- Controller Dependency Injection
- Controller Middleware Assignment

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\SingletonResourceRegistrar` — singleton route registration
- `Illuminate\Routing\Router::singleton()` — entry point

### Key Insight
The singleton pattern is a URL convention, not a data constraint. The database still requires a `where` clause or relationship call; the route layer simply omits the `{id}` parameter.

### Version-Specific Notes
- Introduced in Laravel 9.
- Unchanged in Laravel 10 and 11.
- The `creatable` option was stabilized in Laravel 9.20+.
