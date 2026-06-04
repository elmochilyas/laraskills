# Anti-Patterns: Resourceful Routing

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing System |
| Knowledge Unit | Resourceful Routing |
| Difficulty | Foundation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Using `Route::resource()` for JSON API Endpoints | Architecture | Medium |
| 2 | Deep Nesting Without Shallow | Maintainability | High |
| 3 | Using `resource()` for Non-CRUD Resources | Architecture | Medium |
| 4 | Mixing Custom and Resource Routes Without Separation | Maintainability | Medium |
| 5 | Resource Name Collision Across Groups | Reliability | Medium |

---

## Anti-Pattern 1: Using `Route::resource()` for JSON API Endpoints

### Category
Architecture

### Description
Using `Route::resource()` (which generates 7 routes including `create` and `edit`) for JSON API endpoints where `create` and `edit` form-serving routes have no meaning. This registers two dead routes per resource that always return 404 or error.

### Why It Happens
`Route::resource()` is the most visible and commonly demonstrated routing method in Laravel tutorials. Developers default to it without knowing about `Route::apiResource()`. The extra `create` and `edit` routes are harmless in development — they just return 404 — but they pollute the route list and documentation.

### Warning Signs
- `Route::resource()` is used in `routes/api.php`
- Running `php artisan route:list` shows `create` and `edit` routes in the API route list
- API documentation includes `GET /api/photos/create` and `GET /api/photos/{photo}/edit` endpoints
- The `create` and `edit` controller methods return 404 or throw `MethodNotAllowedHttpException`
- No HTML forms are ever served from API routes

### Why Harmful
Each resource registers 2 unused routes that pollute the route table, API documentation, and consumer expectations. API consumers see `create` and `edit` endpoints and may try to use them for form data (expecting HTML forms). The unused routes also consume URI namespace — the `create` and `edit` path segments are reserved and cannot be used as resource identifiers.

### Real-World Consequences
- `Route::resource('photos', PhotoController::class)` in `api.php`
- Route list shows 7 routes, including `GET /photos/create` and `GET /photos/edit`
- API consumer discovers `/photos/create` in route list and sends POST with JSON
- Gets 404 — frustration about "missing endpoint"
- Consumer reads Laravel docs, finds `create` is for HTML forms
- Developer explains: "We use apiResource, not resource — those routes shouldn't exist"
- Fix: change to `Route::apiResource('photos', ...)` — 5 routes, no confusion

### Preferred Alternative
Use `Route::apiResource()` for all JSON API endpoints. Reserve `Route::resource()` for HTML-serving web routes.

```php
// Wrong: 7 routes including unused create/edit
Route::resource('photos', PhotoController::class);

// Correct: 5 API-appropriate routes
Route::apiResource('photos', PhotoController::class);

// For multiple resources
Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
    'users' => UserController::class,
]);
```

### Refactoring Strategy
1. Audit all `Route::resource()` calls in API route files
2. Replace with `Route::apiResource()`
3. Remove `create` and `edit` methods from controllers (if they exist)
4. Update any tests that reference the removed routes
5. Verify route list shows only 5 API-appropriate routes per resource

### Detection Checklist
- [ ] API route files use `Route::apiResource()`, not `Route::resource()`
- [ ] No `create` or `edit` routes in API route list
- [ ] API documentation does not include form-serving endpoints
- [ ] Controller methods for `create` and `edit` are removed
- [ ] API consumers are not confused by HTML-only endpoints

### Related Rules/Skills/Trees
- Rule: Use `Route::apiResource()` for JSON APIs, not `Route::resource()`
- Rule: `create` and `edit` routes are HTML-form endpoints — meaningless in APIs
- Related KU: Route Groups, API Resource Routes

---

## Anti-Pattern 2: Deep Nesting Without Shallow

### Category
Maintainability

### Description
Nesting resources 3+ levels deep using `Route::resource('parent.child.grandchild', ...)` without enabling `->shallow()`. URLs become excessively long, fragile, and difficult to work with: `/projects/{project}/tasks/{task}/subtasks/{subtask}/comments/{comment}`.

### Why It Happens
Resource nesting maps naturally to database relationships. A project has tasks, tasks have subtasks, subtasks have comments. Each level of nesting seems justified. Shallow nesting is opt-in (not the default), so developers don't know about it or forget to enable it.

### Warning Signs
- URLs with 4+ path segments: `/a/{a}/b/{b}/c/{c}/d/{d}`
- Route parameters include deeply nested parent IDs that are never used in the controller
- Controller methods receive 4+ route parameters but only use 1-2
- Route caching has difficulty with deeply nested parameter resolution
- Frontend routers and API clients struggle with long, complex URL construction

### Why Harmful
Deeply nested URLs are fragile — changing any parent's key format breaks the child's URL. They are hard to read: `/projects/42/tasks/5/subtasks/12/comments/7`. They expose the full hierarchical structure in the URL, which is unnecessary when the child has a globally unique identifier. Controller methods receive many route parameters they never use, creating confusion about which parameters are actually needed.

### Real-World Consequences
- Route: `Route::resource('projects.tasks.subtasks.comments', CommentController::class)`
- URL: `/projects/42/tasks/5/subtasks/12/comments/7`
- `CommentController::show($projectId, $taskId, $subtaskId, $commentId)`
- Only `$commentId` is used — all 3 parent IDs are ignored
- Refactoring: project ID format changes from integer to UUID
- All deeply nested URLs break; need to update all routes
- Fix: `->shallow()` → URL becomes `/comments/7` for show/edit/update/destroy

### Preferred Alternative
Enable shallow nesting for nested resources, especially beyond 2 levels. Only include parent context for routes that actually need it (index, create, store).

```php
// Wrong: full nesting — deeply nested URLs
Route::resource('projects.tasks.subtasks.comments', CommentController::class);
// URL: /projects/{project}/tasks/{task}/subtasks/{subtask}/comments/{comment}

// Correct: shallow nesting — child routes omit parent context
Route::resource('projects.tasks.subtasks.comments', CommentController::class)
    ->shallow();
// URL: /projects/{project}/tasks/{task}/subtasks/{subtask}/comments (index, create, store)
// URL: /comments/{comment} (show, edit, update, destroy) — MUCH cleaner

// Alternative: limit nesting to 2 levels maximum
Route::resource('projects.tasks', TaskController::class);
// Avoid adding subtasks and comments as nested resources
```

### Refactoring Strategy
1. Identify nested resources beyond 2 levels deep
2. Add `->shallow()` to reduce URL depth
3. Update controller methods to remove unused parent parameters
4. Update tests for the new, shorter URLs
5. Set a team standard: maximum 2 levels of nesting, shallow for everything deeper

### Detection Checklist
- [ ] No nested resources beyond 2 levels without `->shallow()`
- [ ] URLs are concise and readable
- [ ] Controller methods only receive parameters they actually use
- [ ] Child resources with global unique identifiers use shallow nesting
- [ ] Parent context is only included where necessary (index, create, store)

### Related Rules/Skills/Trees
- Rule: Use shallow nesting for resources beyond 2 levels
- Rule: Deeply nested URLs are fragile and expose unnecessary hierarchy
- Related KU: Nested Resources, Route Model Binding

---

## Anti-Pattern 3: Using `resource()` for Non-CRUD Resources

### Category
Architecture

### Description
Using `Route::resource()` for entities that do not represent full CRUD lifecycles — read-only resources (only index/show), write-only logs (only store), or resources that have custom operations instead of standard CRUD.

### Why It Happens
`Route::resource()` is convenient — one call for all routes. Developers use it for every resource without considering whether the full CRUD lifecycle is meaningful. A "resource" in the API sense does not always map to the 7-route convention.

### Warning Signs
- Read-only resources use `Route::resource()` without `->only(['index', 'show'])`
- Append-only resources (logs, events) use `Route::resource()` without `->only(['store'])`
- Controller has empty or `abort(404)` methods for unused resource actions
- Tests are written for routes that should not exist (testing 404 for create on a read-only resource)
- Route list shows routes for actions that are not supported

### Why Harmful
Unused routes clutter the route table and create a misleading API surface. Consumers see endpoints in the route list and assume they are functional. Empty or error-returning controller methods are dead code that must be maintained. The resource declaration implies full CRUD support, but the actual implementation is partial — violating the principle of least surprise.

### Real-World Consequences
- `Route::resource('reports', ReportController::class)` — reports should be read-only
- Route list shows `store`, `update`, `destroy` for reports
- Consumer sends `POST /reports` with report data — 404 (no store method)
- Consumer sends `DELETE /reports/42` — 405 (no destroy method)
- Support: "Your API documentation shows these routes but they don't work"
- Fix: `->only(['index', 'show'])` — clear contract, no dead routes

### Preferred Alternative
Use `->only()` to explicitly declare which resource actions are supported. For non-standard operations, use explicit route definitions instead of resource routing.

```php
// Wrong: full resource for read-only entity
Route::resource('reports', ReportController::class);
// Has store, update, destroy — all unused

// Correct: explicit read-only resource
Route::apiResource('reports', ReportController::class)
    ->only(['index', 'show']);

// Or: explicit routes for non-standard resources
Route::get('/reports', [ReportController::class, 'index']);
Route::get('/reports/{report}', [ReportController::class, 'show']);

// For append-only resources (logs)
Route::post('/events', [EventController::class, 'store']);
// No resource routing needed — only one action
```

### Refactoring Strategy
1. Audit all `Route::resource()` and `Route::apiResource()` calls
2. For each, determine which of the 7 actions are actually supported
3. Replace with `->only()` listing the supported actions
4. Remove unused controller methods
5. Update tests to match the reduced route set

### Detection Checklist
- [ ] Resource routes only include actions that are actually supported
- [ ] Read-only resources use `->only(['index', 'show'])`
- [ ] No empty or abort-returning controller methods for unused actions
- [ ] Route list accurately reflects the API's capabilities
- [ ] Consumers are not misled by non-functional endpoints

### Related Rules/Skills/Trees
- Rule: Use `->only()` to declare which resource actions are actually supported
- Rule: Resource routes imply full CRUD — don't mislead consumers
- Related KU: Route Definition, API Design

---

## Anti-Pattern 4: Mixing Custom and Resource Routes Without Separation

### Category
Maintainability

### Description
Adding custom non-CRUD routes (like `restore`, `archive`, `bulk-delete`) inside the same resource group definition without clear separation from the standard 7 resource routes. The route file becomes confusing, mixing standard CRUD with custom actions.

### Why It Happens
Developers place custom routes near the resource declaration for organizational convenience. The routes are related to the same entity, so they "belong" together in the file. Without visual separation (comments, spacing), the custom routes blend into the resource definition.

### Warning Signs
- Custom routes are interspersed between `Route::resource()` calls
- No spacing or comments distinguish standard resource routes from custom actions
- Some custom routes have names that mimic resource routes (`photos.restore`)
- The route file has no clear section structure
- New developers cannot tell which routes are auto-generated and which are custom

### Why Harmful
The route file loses its organizational clarity. A developer looking for `restore` must scan through resource declarations to find it. The distinction between standard CRUD (7 conventional actions) and custom operations (team-specific actions) is blurred. This makes code review harder and increases the risk of route naming conflicts.

### Real-World Consequences
```php
// Route file — hard to distinguish resource vs custom
Route::resource('photos', PhotoController::class);
Route::post('photos/{photo}/restore', [PhotoController::class, 'restore']);
Route::apiResource('albums', AlbumController::class);
Route::post('photos/bulk-delete', [PhotoController::class, 'bulkDelete']);
Route::resource('photos.tags', TagController::class);
```
- Developer needs to add a new custom route for photos
- Cannot quickly find where photo custom routes are defined
- Adds the route near the `restore` line, but it's mixed with album routes
- Route file grows unstructured; custom routes are scattered

### Preferred Alternative
Group resource declarations together and custom routes in clearly separated sections.

```php
// Clear separation: resources first
Route::apiResource('photos', PhotoController::class);
Route::apiResource('albums', AlbumController::class);
Route::apiResource('photos.tags', TagController::class)->shallow();

// --- Custom Actions ---

Route::post('photos/{photo}/restore', [PhotoController::class, 'restore'])
    ->name('photos.restore');

Route::post('photos/bulk-delete', [PhotoController::class, 'bulkDelete'])
    ->name('photos.bulk-delete');

// --- Scoped Custom Actions ---

Route::prefix('albums')->name('albums.')->group(function () {
    Route::post('{album}/cover', [AlbumController::class, 'setCover'])
        ->name('set-cover');
});
```

### Refactoring Strategy
1. Group all resource declarations at the top of each route file
2. Add a clear section separator: `// --- Custom Actions ---`
3. Group custom routes by entity under the separator
4. Use route name prefixes for consistency
5. Add organization rule to coding standards: custom routes are separated from resource routes

### Detection Checklist
- [ ] Route file has clear sections: resources, then custom actions
- [ ] Custom routes are visually separated from resource declarations
- [ ] No custom routes are hidden within resource blocks
- [ ] Route naming convention differentiates resource vs custom routes
- [ ] New developers can quickly locate all custom routes for an entity

### Related Rules/Skills/Trees
- Rule: Separate custom routes from resource route declarations
- Rule: Mixed route files lose organizational clarity
- Related KU: Route Groups, Route Organization

---

## Anti-Pattern 5: Resource Name Collision Across Groups

### Category
Reliability

### Description
Using the same resource name in different route groups, causing route name collisions. The later registration silently overwrites the earlier route name in the name list, making `route('photos.show')` generate the wrong URL.

### Why It Happens
Different sections of the application use the same resource names — for example, an admin panel and a public API both have `photos` resources. The route names (`photos.index`, `photos.show`) are the same, and the framework silently overwrites the earlier registration. Routes still match via URI, but named route generation uses the last definition.

### Warning Signs
- Same resource name used in multiple route groups or route files
- `route('photos.show', $photo)` generates a URL pointing to the wrong group (admin vs API)
- Route name collisions are not immediately visible in route files
- Debugging: `php artisan route:list` shows only one entry for the collided name
- Admin-generated URLs point to public pages or vice versa

### Why Harmful
Named routes are the standard way to generate URLs in Laravel applications. When a collision occurs, `route('photos.show', $photo)` silently generates the URL for the wrong route group. An admin panel link to edit a photo generates a public API URL instead. The collision is silent — no error, no warning — just incorrect URLs.

### Real-World Consequences
- Admin group: `Route::resource('photos', Admin\PhotoController::class)` → `admin.photos.show`
- Public group: `Route::resource('photos', PhotoController::class)` → `photos.show`
- Both generate route name `photos.show` — the admin group registers first, the public group overwrites
- `route('photos.show', $photo)` in admin panel generates `/photos/42` (public) instead of `/admin/photos/42`
- Admin links go to public pages — shows wrong layout, no admin controls
- Fix: add name prefix to one group

### Preferred Alternative
Use route name prefixes to differentiate resource names across groups.

```php
// Wrong: same resource name, no name prefix — collision
Route::prefix('admin')->group(function () {
    Route::resource('photos', Admin\PhotoController::class);
    // Route names: photos.index, photos.show, ...
});

Route::prefix('api')->group(function () {
    Route::apiResource('photos', PhotoController::class);
    // Route names: photos.index, photos.show, ... — COLLISION!
});

// Correct: name prefixes differentiate
Route::prefix('admin')->name('admin.')->group(function () {
    Route::resource('photos', Admin\PhotoController::class);
    // Route names: admin.photos.index, admin.photos.show, ...
});

Route::prefix('api')->name('api.')->group(function () {
    Route::apiResource('photos', PhotoController::class);
    // Route names: api.photos.index, api.photos.show, ...
});

// Or use different resource names
Route::prefix('admin')->group(function () {
    Route::resource('admin_photos', Admin\PhotoController::class);
});

Route::prefix('api')->group(function () {
    Route::apiResource('photos', PhotoController::class);
});
```

### Refactoring Strategy
1. Run `php artisan route:list` and check for duplicate route names
2. Add `->name('prefix.')` to route groups with resource name collisions
3. Update all `route()` calls to use the new prefixed names
4. Test that URL generation produces correct URLs for each group
5. Add CI check: duplicate route names should fail the build

### Detection Checklist
- [ ] No duplicate route names across route groups
- [ ] Same resource name in different groups has name prefix differentiation
- [ ] `route()` calls generate correct URLs for each group context
- [ ] Admin-generated URLs point to admin routes, public URLs point to public routes
- [ ] Route list shows unique names for all routes

### Related Rules/Skills/Trees
- Rule: Use name prefixes to prevent resource name collisions across groups
- Rule: Route name collisions silently overwrite — no warning generated
- Related KU: Route Name Generation, Route Groups
