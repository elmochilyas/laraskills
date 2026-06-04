## Use Invokable Controllers For Single Actions
---
## Category
Architecture
---
## Rule
Always use invokable controllers for single-action endpoints (search, webhooks, exports, dashboards); never add them as extra methods to resource controllers.
---
## Reason
Invokable controllers enforce single responsibility by design. Adding custom actions to resource controllers violates the predictable seven-method contract and hides non-CRUD endpoints.
---
## Bad Example
`php
// Custom action added to resource controller
class PhotoController extends Controller { public function search(SearchRequest ) { ... } public function index() {} public function store() {} ... }
`
---
## Good Example
`php
class SearchPhotosController extends Controller { public function __invoke(SearchRequest ) { ... } }
// Registration: Route::get('/photos/search', SearchPhotosController::class);
`
---
## Exceptions
No common exceptions. Custom actions always belong in separate invokable controllers.
---
## Consequences Of Violation
Resource controller violates single responsibility; non-CRUD endpoints hidden among resource methods; unclear route mapping.

## Keep Invokable Controllers Under 30 Lines
---
## Category
Maintainability
---
## Rule
Always keep invokable controllers under 30 lines; delegate business logic to action classes or services if the __invoke method grows.
---
## Reason
Invokable controllers should be thin HTTP adapters. Fat invokable controllers have the same maintenance problems as fat resource controllers.
---
## Bad Example
`php
class SearchPhotosController extends Controller { public function __invoke(SearchRequest ) {  = Photo::query(); if (...) { ... } if (...) { ... }  = ->get();  = ->filter(...);  = ->sortBy(...);  = ->map(...); return PhotoResource::collection(); } } // 60+ lines
`
---
## Good Example
`php
class SearchPhotosController extends Controller { public function __invoke(SearchRequest ) { return PhotoResource::collection(->searchPhotos->execute(->validated())); } } // 3 lines
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Business logic hidden in controller; untestable without HTTP stack; same maintenance issues as fat resource controllers.

## Never Add A Second Public Method
---
## Category
Architecture
---
## Rule
Never add a second public method to an invokable controller; the class must contain only __invoke.
---
## Reason
An invokable controller with multiple public methods has ambiguous route mapping and violates single responsibility. Convert to a resource controller or split into separate invokable classes.
---
## Bad Example
`php
class PhotoController extends Controller { public function __invoke() { ... } public function search() { ... } } // Ambiguous — which method does the route call?
`
---
## Good Example
`php
class ShowDashboardController extends Controller { public function __invoke() { ... } } // Single method
class SearchPhotosController extends Controller { public function __invoke() { ... } } // Separate class
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Ambiguous route resolution; second method unreachable via default routing; confusion about controller's purpose.

## Use Descriptive Verb-First Naming
---
## Category
Maintainability
---
## Rule
Always name invokable controllers with verb-first descriptive names: SearchPostsController, RestorePhotoController, ExportReportController; never use generic names like PhotoUtilityController.
---
## Reason
Verb-first naming communicates the controller's single purpose at a glance. Generic names obscure what the controller does.
---
## Bad Example
`php
class PhotoController extends Controller { public function __invoke(...) { ... } } // Does not describe the action
`
---
## Good Example
`php
class SearchPhotosController extends Controller { public function __invoke(SearchRequest ) { ... } }
class RestorePhotoController extends Controller { public function __invoke(Photo ) { ... } }
class ExportPhotosController extends Controller { public function __invoke(ExportRequest ) { ... } }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unclear controller purpose; developers must read the implementation to understand what it does; poor discoverability.

## Use Route Caching With Invokable Controllers
---
## Category
Performance
---
## Rule
Always use invokable controllers instead of closure routes when the route should be cached; never use closures for routes in production applications.
---
## Reason
Closures cannot be serialized by php artisan route:cache. Invokable controllers are fully class-based and serializable, allowing full route caching.
---
## Bad Example
`php
Route::get('/photos/search', function (SearchRequest ) { return PhotoResource::collection(Photo::search(->q)->get()); }); // Cannot be route-cached
`
---
## Good Example
`php
Route::get('/photos/search', SearchPhotosController::class); // Fully cacheable
`
---
## Exceptions
Prototype routes during early development may use closures for speed. Convert to invokable controllers before production.
---
## Consequences Of Violation
Route cache cannot serialize closure routes; performance penalty on every request without route caching; caching disabled for all routes if even one closure exists.
