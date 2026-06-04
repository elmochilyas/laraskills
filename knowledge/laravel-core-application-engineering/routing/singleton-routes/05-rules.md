## Prefer Singleton Over Resource with only()

Use `Route::singleton('profile', ...)` instead of `Route::resource('profile', ...)->only([...])` for singular resources.

---

## Category

Framework Usage

---

## Rule

When a resource has at most one instance per parent context (profile, avatar, settings), use `Route::singleton()`. Do not use `Route::resource()->only()` for singular resources.

---

## Reason

Singleton routes explicitly communicate the resource's singular nature. They eliminate the unused `{profile}` parameter from the URI (since there is no ID) and generate only the relevant routes (show, edit, update, destroy).

---

## Bad Example

```php
Route::resource('profile', ProfileController::class)
    ->only(['show', 'edit', 'update', 'destroy']);
// URI includes /profile/{profile} — but there's no profile ID
```

---

## Good Example

```php
Route::singleton('profile', ProfileController::class);
// URI is /profile — clean, no unnecessary parameter
```

---

## Exceptions

If the singular resource needs an index route (which singleton routes do not generate), use `Route::resource()->only()` instead.

---

## Consequences Of Violation

URI includes an unused `{profile}` parameter; developer confusion about which profile ID to provide; non-standard RESTful routing.

---

## Use creatable() When the Resource May Not Exist

Add `->creatable()` when the singleton resource may not exist initially and needs user-initiated creation.

---

## Category

Design

---

## Rule

Chain `->creatable()` on a singleton route when the resource can be created by the user (not auto-created on first access). Use plain `Route::singleton()` only when the resource always exists.

---

## Reason

Without `creatable()`, there is no way to create the singleton resource. The show route returns 404 for non-existent resources with no create flow. `creatable()` adds the create and store routes, providing the full lifecycle.

---

## Bad Example

```php
Route::singleton('avatar', AvatarController::class);
// No create/store routes — user cannot upload an avatar
// if one doesn't already exist
```

---

## Good Example

```php
Route::singleton('avatar', AvatarController::class)->creatable();
// Adds: GET /avatar/create, POST /avatar
// User can create an avatar if one doesn't exist
```

---

## Exceptions

If the singleton resource is always created as a side effect of another action (e.g., profile created automatically when user registers), `creatable()` is not needed.

---

## Consequences Of Violation

Users cannot create the singleton resource; the only way to get a non-null resource is through side effects; confusing 404 when accessing show without a created resource.

---

## Do Not Use Singleton for Non-Singular Resources

Do not use `Route::singleton()` for resources that can have multiple instances.

---

## Category

Framework Usage

---

## Rule

Only use `Route::singleton()` for resources where at most one instance exists per parent context. Use `Route::resource()` for resources that can have multiple instances.

---

## Reason

Singleton routes generate URIs without an identifier parameter because the resource is implied. Using them for multi-instance resources forces unnatural routing where an identifier is needed but the URI cannot express it, confusing API consumers and breaking RESTful conventions.

---

## Bad Example

```php
// Team can have multiple members — not a singleton
Route::singleton('team.member', MemberController::class);
// URI: teams/{team}/member — which member?
```

---

## Good Example

```php
Route::resource('team.members', MemberController::class);
// URI: teams/{team}/members/{member} — explicit member ID
```

---

## Exceptions

No common exceptions. The singular vs plural distinction is fundamental to RESTful routing.

---

## Consequences Of Violation

Impossible to identify which instance the route refers to; forced workarounds like query parameters for instance identity; API consumer confusion.
