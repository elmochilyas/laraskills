## Enforce Maximum Controller File Length
---
## Category
Maintainability
---
## Rule
Always enforce a maximum file length of 200 lines per controller file; never allow controllers to exceed this limit without an exemption annotation.
---
## Reason
Controllers exceeding 200 lines typically violate single-responsibility and accumulate multiple concerns. A hard limit forces decomposition into services, actions, or form requests.
---
## Bad Example
`php
// 350-line controller with index, store, show, update, destroy + search, restore, archive, bulkDelete methods
class PhotoController extends Controller { /* 350 lines */ }
`
---
## Good Example
`php
// 85-line controller delegating to action classes and form requests
class PhotoController extends Controller { public function index(Photo ) { return PhotoResource::collection(Photo::paginate()); } /* 85 lines total */ }
`
---
## Exceptions
Legitimate edge cases may use // @no-limit with a documented justification. Re-evaluate quarterly.
---
## Consequences Of Violation
Hard-to-navigate controllers; hidden business logic; increased bug introduction rate; code review bottlenecks.

## Enforce Maximum Method Length
---
## Category
Maintainability
---
## Rule
Always enforce a maximum of 15 lines per controller method; never allow methods to exceed this limit without extraction.
---
## Reason
Methods longer than 15 lines typically mix multiple concerns (validation, business logic, response construction). Short methods are self-documenting and testable.
---
## Bad Example
`php
public function store(Request ) {  = [...];  = [...];  = ->validate(, );  = new Photo(); ->title = ['title']; ->processImage(['image']); ->assignTags(['tags']); ->processThumbnails(); ->sendNotifications(); ->save(); return response()->json(); }
`
---
## Good Example
`php
public function store(StorePhotoRequest ) { return (new PhotoResource(->createPhoto->execute(->validated())))->response()->setStatusCode(201); }
`
---
## Exceptions
Constructor methods and configuration-heavy methods may exceed 15 lines with documented rationale.
---
## Consequences Of Violation
Methods that are hard to read, test, and debug; hidden business logic; increased cyclomatic complexity.

## Limit Public Methods Per Controller
---
## Category
Maintainability
---
## Rule
Never define more than seven public methods in a single resource controller.
---
## Reason
The resource controller contract defines exactly seven actions. Additional public methods indicate non-resource functionality that belongs in separate invokable controllers.
---
## Bad Example
`php
class PhotoController extends Controller { public function index() {} public function create() {} public function store() {} public function show() {} public function edit() {} public function update() {} public function destroy() {} public function search() {} public function restore() {} public function bulkDelete() {} }
`
---
## Good Example
`php
class PhotoController extends Controller { public function index() {} public function create() {} public function store() {} public function show() {} public function edit() {} public function update() {} public function destroy() {} }
// SearchPhotosController, RestorePhotoController, BulkDeletePhotosController as separate invokable controllers
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Controller violates single-responsibility; oversized class file; difficult to test; non-resource actions hidden inside a resource controller.

## Count Logical Lines Excluding Comments
---
## Category
Maintainability
---
## Rule
Always count logical lines of code excluding blank lines and comments when enforcing line limits; never penalize documentation.
---
## Reason
Docblock-heavy or well-commented controllers should not trigger false positives. Counting logical lines ensures the metric measures code, not documentation.
---
## Bad Example
`php
// CI script checking total lines including 40 lines of docblocks — penalizes well-documented controllers
`
---
## Good Example
`php
// CI script checking lines excluding blank lines and comments
// PowerShell: (Get-Content  | Where-Object {  -match '\S' -and  -notmatch '^\s*(\/\/|#|/\*)' }).Count
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
False positives on well-documented controllers; team incentivized to remove documentation to pass CI; inaccurate code size metrics.

## Enforce Cyclomatic Complexity Limit Per Method
---
## Category
Maintainability
---
## Rule
Always enforce a maximum cyclomatic complexity of seven per controller method; never allow methods with higher complexity without extraction.
---
## Reason
High cyclomatic complexity indicates multiple branching paths that are hard to test comprehensively. Each path represents a separate test case.
---
## Bad Example
`php
public function index(Request ) {  = Photo::query(); if (->status) { ->where('status', ->status); } if (->tag) { ->whereHas('tags', fn() => ...); } if (->date_from && ->date_to) { ... } if (->sort) { ... } if (->include) { ... } if (->page_size) { ... } return PhotoResource::collection(->paginate()); }
`
---
## Good Example
`php
public function index(PhotoIndexRequest ) { return PhotoResource::collection(->listPhotos->execute(->validated())); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Untested code paths; methods that are hard to reason about; high bug density in complex conditionals.

## Run Limit Checks In CI
---
## Category
Reliability
---
## Rule
Always run controller code limit checks in CI as a pre-merge gate; never rely solely on manual code review for enforcement.
---
## Reason
Automated enforcement is objective and consistent. Manual review misses violations under time pressure and varies by reviewer.
---
## Bad Example
`php
// No CI check — "we'll catch it in code review" — but review misses a 400-line controller
`
---
## Good Example
`php
// CI pipeline step: phpstan analyse --level max app/Http/Controllers
// Custom PHPStan rule exits non-zero if any controller exceeds 200 lines
`
---
## Exceptions
Prototypes and early-stage projects may skip CI enforcement while stabilizing.
---
## Consequences Of Violation
Limits degrade over time as new code is added; controllers grow unchecked; enforcement becomes a point of contention rather than an objective standard.
