## Limit Constructor Dependencies To Four
---
## Category
Maintainability
---
## Rule
Never inject more than four dependencies into a controller constructor; split the controller or group related dependencies into service classes if exceeded.
---
## Reason
More than four constructor parameters indicates the controller coordinates too many responsibilities. Each dependency is a separate concern the controller manages.
---
## Bad Example
`php
class PhotoController extends Controller { public function __construct(private PhotoRepo , private ImageProcessor , private TagService , private Mailer , private Logger , private Cache , private Metrics ) {} }
`
---
## Good Example
`php
class PhotoController extends Controller { public function __construct(private CreatePhotoAction , private ListPhotosAction , private DeletePhotoAction ) {} }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Constructor hard to read; tests require excessive mocking; controller violates single-responsibility principle.

## Never Inject Request In Constructor
---
## Category
Architecture
---
## Rule
Never inject Illuminate\Http\Request or its subclasses in a controller constructor; always use method injection for request objects.
---
## Reason
The Request object is not fully initialized at constructor time — middleware, route parameters, and uploaded files are not yet available. Method injection guarantees a fully populated Request.
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
Empty request properties; uploaded files unavailable; route parameters missing; inconsistent behavior between cached and non-cached routes.

## Use Constructor Promotion For Injections
---
## Category
Design
---
## Rule
Always use PHP 8 constructor promotion syntax with private readonly for injected dependencies; never assign constructor parameters to properties manually.
---
## Reason
Promotion reduces boilerplate, makes the constructor a single-line declaration of dependencies, and enforces immutability through eadonly.
---
## Bad Example
`php
class PhotoController extends Controller { private CreatePhotoAction ; public function __construct(CreatePhotoAction ) { ->create = ; } }
`
---
## Good Example
`php
class PhotoController extends Controller { public function __construct(private readonly CreatePhotoAction ) {} }
`
---
## Exceptions
Projects on PHP 7.x cannot use promotion. Upgrade to PHP 8+.
---
## Consequences Of Violation
Boilerplate code; mutable properties; reduced readability of dependency manifest.

## Never Use app()->make() In Controller Methods
---
## Category
Architecture
---
## Rule
Never call pp()->make(), esolve(), or pp() inside controller methods to obtain dependencies; always declare them in the constructor.
---
## Reason
Service locator calls hide dependencies from the class signature, making them invisible to readers and untestable without mocking the container.
---
## Bad Example
`php
public function store(Request ) {  = app()->make(CreatePhotoAction::class); return ->execute(->all()); }
`
---
## Good Example
`php
public function __construct(private readonly CreatePhotoAction ) {} public function store(StorePhotoRequest ) { return ->create->execute(->validated()); }
`
---
## Exceptions
When working with dynamic dependencies determined at runtime (e.g., strategy pattern where the implementation depends on request data).
---
## Consequences Of Violation
Hidden dependencies; misleading constructor signature; tests must mock container; service locator anti-pattern.

## Register Interface Bindings In One Service Provider
---
## Category
Code Organization
---
## Rule
Always register all controller-facing interface bindings in a single service provider; never scatter bindings across multiple providers.
---
## Reason
Centralized binding registration makes the dependency graph auditable. Scattered bindings hide wiring decisions across the codebase.
---
## Bad Example
`php
// AppServiceProvider — some bindings
// PhotoServiceProvider — some bindings
// AuthServiceProvider — some bindings
// No single source of truth for what binds to what
`
---
## Good Example
`php
// AppServiceProvider — all controller interface bindings
public function register(): void { ->app->when(PhotoController::class)->needs(PhotoRepoInterface::class)->give(PhotoRepo::class); }
`
---
## Exceptions
Third-party package providers should register their own bindings.
---
## Consequences Of Violation
Difficult to audit dependency wiring; binding collisions between providers; confusion about which binding takes precedence.

## Use Contextual Binding For Different Controller Needs
---
## Category
Design
---
## Rule
Always use pp()->when()->needs()->give() contextual binding when different controllers require different implementations of the same interface.
---
## Reason
Shared interface bindings force all controllers to use the same implementation. Contextual binding lets each controller receive its specific dependency without coupling controllers to concrete classes.
---
## Bad Example
`php
// All controllers get the same PhotoRepo
app()->bind(PhotoRepoInterface::class, PhotoRepo::class);
`
---
## Good Example
`php
app()->when(PhotoController::class)->needs(PhotoRepoInterface::class)->give(PhotoRepo::class);
app()->when(AdminPhotoController::class)->needs(PhotoRepoInterface::class)->give(AdminPhotoRepo::class);
`
---
## Exceptions
When all consumers genuinely need the same implementation, a simple ->bind() suffices.
---
## Consequences Of Violation
Inflexible binding configuration; admin and public controllers forced into same implementation; workarounds via constructor conditionals or service locator.
