## Prefer only() Over except() For Route Filtering
---
## Category
Design
---
## Rule
Always use only() to whitelist actions for partial resource routes; never use except() for route filtering.
---
## Reason
only() self-documents exactly which actions the controller supports. except() requires readers to know the full default set and mentally subtract excluded actions.
---
## Bad Example
`php
Route::apiResource('photos', PhotoController::class)->except(['create', 'edit', 'destroy']);
`
---
## Good Example
`php
Route::apiResource('photos', PhotoController::class)->only(['index', 'store', 'show', 'update']);
`
---
## Exceptions
When adding a new action to an existing except() list is the minimal diff (team convention). Prefer only() for new declarations.
---
## Consequences Of Violation
Ambiguous route contract; reader must know default actions to understand what's registered; risk of unintended new actions on Laravel upgrade.

## Register Custom Routes Before Resource Routes
---
## Category
Reliability
---
## Rule
Always register custom non-CRUD routes (search, restore, archive) BEFORE the resource route declaration; never place them after.
---
## Reason
Laravel matches routes sequentially. A wildcard route {photo} in the resource declaration will capture /search if the resource is registered first, causing a 404 or incorrect model binding.
---
## Bad Example
`php
Route::apiResource('photos', PhotoController::class);
Route::get('/photos/search', [PhotoController::class, 'search']); // /photos/search captured by {photo} wildcard
`
---
## Good Example
`php
Route::get('/photos/search', [PhotoController::class, 'search'])->name('photos.search');
Route::apiResource('photos', PhotoController::class);
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Custom routes return 404; wildcard model binding resolves "search" as a model ID; difficult to diagnose without routing knowledge.

## Remove Controller Methods Excluded By only()
---
## Category
Maintainability
---
## Rule
Always remove controller methods that are excluded by only(), except(), or piResource(); never leave unreachable methods in the class.
---
## Reason
Unreachable methods are dead code that confuses maintainers, linters, and tools that analyze class interfaces. They also suggest the controller does things it doesn't.
---
## Bad Example
`php
// Route: Route::apiResource('photos', PhotoController::class)->only(['index', 'show']);
class PhotoController extends Controller { public function index() {} public function store() {} public function show() {} public function update() {} public function destroy() {} } // store/update/destroy unreachable
`
---
## Good Example
`php
// Route: Route::apiResource('photos', PhotoController::class)->only(['index', 'show']);
class PhotoController extends Controller { public function index() {} public function show() {} } // Only index/show implemented
`
---
## Exceptions
When the methods are part of a shared interface or contract required by the framework. Add @codeCoverageIgnore annotation instead.
---
## Consequences Of Violation
Dead code that deceives maintainers; wasted test effort on unreachable methods; confusion during refactoring.

## Use Route::apiResource()->only() For APIs
---
## Category
Framework Usage
---
## Rule
Always use Route::apiResource()->only() for partial API resources; never use Route::resource()->only() which still registers the create and edit route infrastructure.
---
## Reason
Route::apiResource() drops the view-related create/edit actions before only() filters further. This ensures no HTML-view infrastructure leaks into the API endpoint.
---
## Bad Example
`php
Route::resource('photos', PhotoController::class)->only(['index', 'show']); // Still carries create/edit infrastructure in route definitions
`
---
## Good Example
`php
Route::apiResource('photos', PhotoController::class)->only(['index', 'show']); // Clean read-only API resource
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Route definition includes create/edit even if filtered; possible upgrade path where apiResource behavior differs.

## Use ->name() For Custom Route Naming
---
## Category
Maintainability
---
## Rule
Always use ->name() on custom routes to follow the resource naming convention (photos.search); never leave custom routes without explicit names.
---
## Reason
Consistent naming lets developers predict route names across the codebase. oute('photos.search') is discoverable while an unnamed route is invisible to the naming scheme.
---
## Bad Example
`php
Route::get('/photos/search', [PhotoController::class, 'search']); // No route name
`
---
## Good Example
`php
Route::get('/photos/search', [PhotoController::class, 'search'])->name('photos.search');
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Route name collisions with resource routes; oute() helper cannot reference the custom action; inconsistent naming.
