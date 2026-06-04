## Always Use Route::apiResource() In api.php
---
## Category
Framework Usage
---
## Rule
Always use Route::apiResource() in outes/api.php; never use Route::resource() for API endpoints.
---
## Reason
Route::resource() registers create and edit routes that return HTML views, which are dead routes in API-only applications. piResource() registers only the five JSON-appropriate actions.
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
When building a hybrid application that serves both JSON and server-rendered HTML from the same controller. Use separate controllers instead.
---
## Consequences Of Violation
Two dead routes registered per resource; route table bloat; create/edit endpoints return HTML to JSON clients; oute:list shows routes that should not exist.

## Never Return Views From API Controllers
---
## Category
Architecture
---
## Rule
Never return iew(), edirect(), or HTML responses from API resource controller actions.
---
## Reason
API controllers serve JSON clients. Returning views forces clients to parse HTML, breaks integration contracts, and violates the separation between web and API concerns.
---
## Bad Example
`php
public function index() { return view('photos.index', ['photos' => Photo::all()]); }
`
---
## Good Example
`php
public function index() { return PhotoResource::collection(Photo::paginate()); }
`
---
## Exceptions
No common exceptions. If HTML responses are needed, use a separate web controller.
---
## Consequences Of Violation
JSON clients receive unparseable HTML; API consumers cannot integrate; SPA applications break silently.

## Always Return 204 From Destroy
---
## Category
Design
---
## Rule
Always return esponse()->noContent() from the destroy action.
---
## Reason
REST convention specifies that DELETE returns 204 No Content with no response body. A 200 with null body is ambiguous — clients cannot distinguish "deleted" from "fetched with no data."
---
## Bad Example
`php
public function destroy(Photo ) { ->delete(); return response()->json(['deleted' => true]); }
`
---
## Good Example
`php
public function destroy(Photo ) { ->delete(); return response()->noContent(); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients receive ambiguous 200 responses; inconsistent with REST semantics; API consumers cannot programmatically determine deletion success from the status code alone.

## Return 201 With Resource On Store
---
## Category
Design
---
## Rule
Always return HTTP 201 with the created Eloquent API resource from the store action.
---
## Reason
Clients need the created resource's ID and attributes for immediate use. A default 200 response does not distinguish "created" from "fetched" — the 201 status code is the semantic signal.
---
## Bad Example
`php
public function store(StorePhotoRequest ) {  = Photo::create(->validated()); return response()->json(); }
`
---
## Good Example
`php
public function store(StorePhotoRequest ) {  = Photo::create(->validated()); return (new PhotoResource())->response()->setStatusCode(201); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients cannot differentiate resource creation from retrieval; API consumers must inspect response body to determine action outcome; integration contracts are underspecified.

## Always Wrap Responses In API Resources
---
## Category
Security
---
## Rule
Always wrap Eloquent models in API resource classes before returning from controller actions; never return raw models.
---
## Reason
Raw model returns expose all attributes including sensitive fields. API resources provide an explicit allowlist of exposed attributes and consistent JSON structure.
---
## Bad Example
`php
public function show(Photo ) { return ; }
`
---
## Good Example
`php
public function show(Photo ) { return new PhotoResource(); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Sensitive data leakage; inconsistent JSON structure; breaking changes when model attributes are added or renamed; security audit failures.

## Always Use Form Requests For Validation
---
## Category
Architecture
---
## Rule
Always type-hint a dedicated form request class on store and update action signatures; never use $request->all() or inline $request->validate() in API resource controllers.
---
## Reason
Form requests encapsulate validation rules and authorization checks in dedicated testable classes. Inline validation mixes concerns and cannot be reused or unit-tested independently.
---
## Bad Example
`php
public function store(Request ) {  = ->validate(['title' => 'required']); Photo::create(); }
`
---
## Good Example
`php
public function store(StorePhotoRequest ) { Photo::create(->validated()); }
`
---
## Exceptions
Read-only actions (index, show) that accept no user input do not require form requests.
---
## Consequences Of Violation
Validation logic duplicated across controllers; untestable validation rules; authorization checks buried in method bodies; increased controller line count.

## Register API Controllers In routes/api.php Only
---
## Category
Code Organization
---
## Rule
Always register API resource controllers in outes/api.php, never in outes/web.php.
---
## Reason
outes/api.php applies the pi middleware group (throttling, JSON error handling). Registering in web.php applies session-based auth and cookie management inappropriate for stateless API endpoints.
---
## Bad Example
`php
// routes/web.php
Route::apiResource('photos', PhotoController::class);
`
---
## Good Example
`php
// routes/api.php
Route::apiResource('photos', PhotoController::class);
`
---
## Exceptions
When building a hybrid SPA backend that uses Sanctum SPA authentication with the web middleware and needs the same controller.
---
## Consequences Of Violation
Session-based auth enforced on stateless endpoints; unexpected cookie behavior; CSRF token requirements on API routes.
