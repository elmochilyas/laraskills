## Use Constructor Injection For Shared Dependencies
---
## Category
Architecture
---
## Rule
Always use constructor injection for dependencies used in three or more controller methods; use method injection only for action-specific dependencies.
---
## Reason
Constructor injection provides a single resolved instance and keeps method signatures lean. Repeating the same dependency across multiple method signatures is redundant and adds re-resolution overhead.
---
## Bad Example
`php
class PhotoController extends Controller { public function index(PhotoService ) { ... } public function store(StorePhotoRequest , PhotoService ) { ... } public function show(Photo , PhotoService ) { ... } }
`
---
## Good Example
`php
class PhotoController extends Controller { public function __construct(private readonly PhotoService ) {} public function index() { ... } public function store(StorePhotoRequest ) { ... } public function show(Photo ) { ... } }
`
---
## Exceptions
Dependencies used in exactly two methods may use either approach based on team convention.
---
## Consequences Of Violation
Cluttered method signatures; redundant parameter lists; harder to read; re-resolution overhead on every method call.

## Never Inject Request In Constructor
---
## Category
Architecture
---
## Rule
Never inject Illuminate\Http\Request in a controller constructor; always use method injection for request objects.
---
## Reason
The Request object is not fully initialized at constructor time — middleware, route parameters, and uploaded files are not yet available.
---
## Bad Example
`php
class PhotoController extends Controller { public function __construct(private Request ) {} }
`
---
## Good Example
`php
class PhotoController extends Controller { public function store(StorePhotoRequest ) { ... } }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Empty request properties; unavailable uploaded files; missing route parameters; inconsistent behavior across cached and non-cached routes.

## Maintain Consistent Parameter Order
---
## Category
Maintainability
---
## Rule
Always order method parameters in this sequence: form request first, then route model bindings, then injected services; never mix them arbitrarily.
---
## Reason
A consistent parameter order lets developers predict the signature of any controller method without reading documentation. It also matches Laravel's own resolution priority.
---
## Bad Example
`php
public function store(Photo , StorePhotoRequest , PhotoService ) { ... }
`
---
## Good Example
`php
public function store(StorePhotoRequest , Photo , PhotoService ) { ... }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Confusing method signatures; increased cognitive load when reading unfamiliar controllers; inconsistent team patterns.

## Type-Hint All Injectable Parameters
---
## Category
Reliability
---
## Rule
Always type-hint all injectable parameters in controller methods; untyped parameters receive route values instead.
---
## Reason
Laravel differentiates injectable services from route parameters by type-hint. An untyped parameter receives the route segment value, not the container-resolved service.
---
## Bad Example
`php
public function show(Photo , ) { ->info('viewed'); ... } //  receives route value not Logger
`
---
## Good Example
`php
public function show(Photo , LoggerInterface ) { ->info('viewed'); ... }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Route parameter value injected instead of service; type errors at runtime; silent bugs that are hard to diagnose.

## Use Method Injection For Single-Use Services
---
## Category
Design
---
## Rule
Always use method injection for services used by only one controller action; avoid cluttering the constructor with single-use dependencies.
---
## Reason
Constructor injection for every possible dependency leads to constructor explosion. Method injection keeps the constructor focused on truly shared dependencies.
---
## Bad Example
`php
class PhotoController extends Controller { public function __construct(private PhotoService , private ExportService , private SearchService , private CacheService ) {} public function export() { return ->export->run(); } public function search(SearchRequest ) { return ->search->query(->validated()); } }
`
---
## Good Example
`php
class PhotoController extends Controller { public function __construct(private readonly PhotoService ) {} public function export(ExportService ) { return ->run(); } public function search(SearchRequest , SearchService ) { return ->query(->validated()); } }
`
---
## Exceptions
No common exceptions. If a dependency later becomes used in multiple methods, migrate it to the constructor.
---
## Consequences Of Violation
Constructor explosion; hard-to-read dependency manifest; tests mock dependencies the test doesn't need; reduced readability.
