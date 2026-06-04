## Always Use Route::resource() Over Manual Routes
---
## Category
Framework Usage
---
## Rule
Always use Route::resource() or Route::apiResource() for CRUD endpoints; never register controller actions manually.
---
## Reason
Resource registration eliminates human error, ensures naming consistency, and provides a self-documenting route list. Manual routes are prone to typos, naming drift, and missed routes.
---
## Bad Example
`php
Route::get('/photos', [PhotoController::class, 'index'])->name('photos.index');
Route::post('/photos', [PhotoController::class, 'store'])->name('photos.store');
Route::get('/photos/{photo}', [PhotoController::class, 'show'])->name('photos.show');
`
---
## Good Example
`php
Route::apiResource('photos', PhotoController::class);
`
---
## Exceptions
Custom non-CRUD actions (search, restore) that don't fit the resource pattern must be registered manually alongside the resource route.
---
## Consequences Of Violation
Inconsistent route naming; missed routes on controller additions; boilerplate code bloat in route files.

## Keep Resource Methods In Standard Order
---
## Category
Maintainability
---
## Rule
Always define resource controller methods in the standard order: index, create, store, show, edit, update, destroy; never reorder them arbitrarily.
---
## Reason
Predictable method ordering lets developers navigate any resource controller without searching for specific methods. It matches the route registration order and the action lifecycle.
---
## Bad Example
`php
class PhotoController extends Controller { public function destroy() {} public function index() {} public function update() {} public function store() {} public function show() {} }
`
---
## Good Example
`php
class PhotoController extends Controller { public function index() {} public function create() {} public function store() {} public function show() {} public function edit() {} public function update() {} public function destroy() {} }
`
---
## Exceptions
API resource controllers omit create and edit. The remaining order is: index, store, show, update, destroy.
---
## Consequences Of Violation
Harder to navigate; team members scan entire file to find specific methods; inconsistent across controllers.

## Never Add Non-Resource Methods To Resource Controllers
---
## Category
Architecture
---
## Rule
Never add methods beyond the seven resource defaults (or five for API) to a resource controller; place custom actions in separate invokable controllers.
---
## Reason
Resource controllers have a well-defined, predictable contract. Adding search, restore, archive, or bulk operations breaks single responsibility and makes the controller's scope ambiguous.
---
## Bad Example
`php
class PhotoController extends Controller { public function index() {} public function store() {} public function show() {} public function update() {} public function destroy() {} public function search() {} public function restore() {} public function bulkDelete() {} }
`
---
## Good Example
`php
class PhotoController extends Controller { public function index() {} public function store() {} public function show() {} public function update() {} public function destroy() {} }
// Separate invokable controllers for custom actions
class SearchPhotosController extends Controller { public function __invoke(SearchRequest ) { ... } }
class RestorePhotoController extends Controller { public function __invoke(Photo ) { ... } }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Bloated controller; violated single-responsibility; non-standard action locations; route registration confusion.

## Use Route Model Binding In Method Signatures
---
## Category
Framework Usage
---
## Rule
Always type-hint the Eloquent model (not the ID) in show, update, and destroy method signatures; never manually fetch models by ID.
---
## Reason
Route model binding automatically resolves the model from the route parameter and returns 404 if not found. Manual resolution duplicates code and risks inconsistent 404 handling.
---
## Bad Example
`php
public function show() {  = Photo::findOrFail(); return new PhotoResource(); }
`
---
## Good Example
`php
public function show(Photo ) { return new PhotoResource(); }
`
---
## Exceptions
When soft-deleted resources must be accessible or when binding resolution logic is non-standard (use Route::bind() instead).
---
## Consequences Of Violation
Boilerplate resolution code in every method; inconsistent 404 responses; forgotten indOrFail returns null to client.

## Use apiResource() For JSON Endpoints
---
## Category
Framework Usage
---
## Rule
Always use Route::apiResource() for JSON API endpoints; never use Route::resource() which includes HTML view routes.
---
## Reason
Route::resource() registers create and edit routes that return views — inappropriate and unused in API-only applications. piResource() registers only the JSON-appropriate actions.
---
## Bad Example
`php
// routes/api.php
Route::resource('photos', PhotoController::class);
`
---
## Good Example
`php
// routes/api.php
Route::apiResource('photos', PhotoController::class);
`
---
## Exceptions
Hybrid applications that serve both JSON and HTML from the same controller may need Route::resource() with separate controllers for web and API.
---
## Consequences Of Violation
Unused view routes registered; route table bloat; create/edit endpoints return HTML to JSON clients; confusion about controller responsibilities.
