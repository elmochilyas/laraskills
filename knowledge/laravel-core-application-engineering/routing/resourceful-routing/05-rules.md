## Use apiResource for API Route Files

Always use `Route::apiResource()` instead of `Route::resource()` in API route files.

---

## Category

Framework Usage

---

## Rule

In `routes/api.php` or any API-specific route file, use `Route::apiResource()` to register resourceful routes. Only use `Route::resource()` in web route files.

---

## Reason

`apiResource` generates only the 5 API-appropriate routes (index, store, show, update, destroy) and omits the create and edit routes that return HTML forms. Using `resource` for APIs generates unnecessary routes that return 404 and confuses the API surface.

---

## Bad Example

```php
// routes/api.php
Route::resource('users', UserController::class);
// Generates create/edit routes that return 404 for API
```

---

## Good Example

```php
// routes/api.php
Route::apiResource('users', UserController::class);
// Only index, store, show, update, destroy
```

---

## Exceptions

If the API returns HTML responses (unusual but possible with Inertia-like approaches), use `Route::resource()`.

---

## Consequences Of Violation

Dead routes in the API surface; unnecessary 404 responses for create/edit URIs; confusion about which endpoints are actually available.

---

## Use only() or except() to Limit Resource Actions

Always use `->only()` or `->except()` to explicitly declare which resource actions are available.

---

## Category

Security

---

## Rule

When registering a resource route, chain `->only(['index', 'show'])` or `->except(['create', 'edit'])` to limit the generated routes. Do not register a resource without specifying the intended subset of actions.

---

## Reason

Unrestricted resource routes register all 7 (or 5) actions, even if the controller lacks corresponding methods or the business logic doesn't support those operations. Explicit route lists prevent unused actions from being accidentally routable and document which operations the resource supports.

---

## Bad Example

```php
Route::apiResource('users', UserController::class);
// All 5 API routes registered — but maybe only index and show exist
```

---

## Good Example

```php
Route::apiResource('users', UserController::class)
    ->only(['index', 'show']);
// Only index and show — clear intent, reduced attack surface
```

---

## Exceptions

For resources that genuinely implement all standard actions, explicit `only()` is not required but is still recommended for documentation. At minimum, use the unmodified `apiResource` (which already omits create/edit for APIs).

---

## Consequences Of Violation

Exposed endpoints for non-existent controller methods (throws `MethodNotFoundException`); increased attack surface; confusing API documentation.

---

## Use Shallow Nesting Beyond Two Levels

Apply `->shallow()` to nested resources that go 2+ levels deep.

---

## Category

Design

---

## Rule

When nesting resources 2 or more levels deep (e.g., `posts.comments.replies`), use `->shallow()` so that routes for uniquely identified child resources do not include the parent IDs.

---

## Reason

Deeply nested URIs (e.g., `/posts/1/comments/2/replies/3/edit`) are unwieldy and redundant. Once a child resource is uniquely identified by its own ID, the parent IDs provide no additional routing value. Shallow nesting produces cleaner URIs (e.g., `/replies/3/edit`).

---

## Bad Example

```php
Route::resource('posts.comments.replies', ReplyController::class);
// Generates: posts/{post}/comments/{comment}/replies/{reply}
```

---

## Good Example

```php
Route::resource('posts.comments', CommentController::class)->shallow();
// Creates:      posts/{post}/comments (index/create/store)
// Shallow:      /comments/{comment}   (show/edit/update/destroy)
```

---

## Exceptions

Keep shallow nesting when the child resource cannot exist without the parent context and the parent ID is needed for authorization or scoping at the route level.

---

## Consequences Of Violation

Excessively long URIs; redundant parameters in routes; poor API consumer experience.

---

## Limit Nesting to Two Levels

Do not nest resources more than 2 levels deep.

---

## Category

Architecture

---

## Rule

Keep resource nesting to a maximum of 2 levels (e.g., `posts.comments`). Do not define 3+ level nesting like `posts.comments.replies`.

---

## Reason

Deep nesting creates unwieldy URIs, complex controllers that must resolve multiple parent contexts, and brittle route definitions. Resources deeper than 2 levels can usually be accessed via shallow routes or dedicated top-level endpoints.

---

## Bad Example

```php
Route::resource('teams.projects.tasks.comments', CommentController::class);
// 4 levels deep — unwieldy URIs, complex controller logic
```

---

## Good Example

```php
// Max 2 levels
Route::resource('projects.tasks', TaskController::class)->shallow();
// Comments accessed via shallow route
Route::apiResource('comments', CommentController::class);
```

---

## Exceptions

In rare cases where deep nesting accurately models a strict hierarchy and the parent context is truly required for child resolution, 3 levels may be acceptable. Never exceed 3 levels.

---

## Consequences Of Violation

Extremely long URIs; complex controller nesting resolution; poor API consumer experience; brittle route definitions.

---

## Use Plural Resource Names

Always use plural resource names in `Route::resource()` calls.

---

## Category

Maintainability

---

## Rule

Register resources using plural nouns: `Route::resource('users', ...)`, not `Route::resource('user', ...)`.

---

## Reason

Plural resource names are the RESTful convention. They produce standard URI patterns (`/users`, `/users/{user}`) and route names (`users.index`, `users.show`). Inconsistent plural/singular naming creates a confusing API surface and breaks consumer expectations.

---

## Bad Example

```php
Route::resource('user', UserController::class);
// URIs: /user, /user/{user} — non-standard
// Names: user.index, user.show
```

---

## Good Example

```php
Route::resource('users', UserController::class);
// URIs: /users, /users/{user}
// Names: users.index, users.show
```

---

## Exceptions

Singular names may be appropriate for singleton resources (use `Route::singleton()` instead of `Route::resource()`). For standard resources, always use plural.

---

## Consequences Of Violation

Inconsistent API surface; consumer confusion; non-standard RESTful patterns.

---

## Add Custom Actions Outside Resource Definitions

Define non-standard route actions separately from the `Route::resource()` call.

---

## Category

Code Organization

---

## Rule

Do not mix custom action routes inside a resource definition. Place custom routes before or after the resource registration, using an explicit `Route::get()` or `Route::post()`.

---

## Reason

Mixing custom actions inside resource definitions violates RESTful conventions, obscures the route organization, and makes it unclear which actions are standard CRUD and which are custom.

---

## Bad Example

```php
// Custom action buried inside resource thinking
Route::resource('users', UserController::class);
// Where does users.restore or users.export go?
// Developer might be tempted to add non-standard methods
```

---

## Good Example

```php
// Custom action explicitly separate from resource
Route::post('/users/{user}/restore', [UserController::class, 'restore'])
    ->name('users.restore');

Route::apiResource('users', UserController::class)
    ->only(['index', 'show', 'update', 'destroy']);
```

---

## Exceptions

No common exceptions. Custom actions should always be explicit route definitions, not resource modifications.

---

## Consequences Of Violation

Confusing route organization; non-RESTful API design; difficulty finding custom action routes.
