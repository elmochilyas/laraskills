## Use URL Prefix Versioning
---
## Category
Architecture
---
## Rule
Always use URL prefix versioning (/v1/, /v2/) for API controllers; never use header-based or content-negotiation versioning as the primary mechanism.
---
## Reason
URL prefix versioning is explicit, cacheable, testable with standard HTTP tools, and debuggable in logs. Header-based versioning complicates caching, debugging, and client implementation.
---
## Bad Example
`php
// routes/api.php — version determined by Accept header
Route::apiResource('photos', PhotoController::class);
`
---
## Good Example
`php
// routes/api.php
Route::prefix('v1')->group(base_path('routes/api/v1.php'));
Route::prefix('v2')->group(base_path('routes/api/v2.php'));
`
---
## Exceptions
When client-driven content negotiation is required by specification (e.g., some REST API standards).
---
## Consequences Of Violation
Caching infrastructure cannot differentiate versions; debugging requires inspecting headers; client implementation is more complex; logs lack version context.

## Duplicate Controllers By Default, Inherit For Minor Changes
---
## Category
Maintainability
---
## Rule
Always duplicate V2 controllers from V1 as a starting point; use inheritance only for minor overrides where the change is isolated to one method.
---
## Reason
Full duplication prevents accidental V1 regressions from shared inheritance. When V2 changes global behavior (e.g., authentication), the V1-controller copy remains untouched.
---
## Bad Example
`php
class V2PhotoController extends V1PhotoController { public function index() { return V2Resource::collection(...); } }
// Now V1 behavior changes if V2 modifies parent constructor or shared logic
`
---
## Good Example
`php
class V2PhotoController extends Controller { // Fresh copy; no inheritance from V1
  public function index() { return V2Resource::collection(...); }
  public function store(StorePhotoRequest ) { ... }
  // All methods defined explicitly
}
`
---
## Exceptions
When the change is truly isolated to a single method and the V1 controller is stable with no planned changes.
---
## Consequences Of Violation
Changes intended for V2 silently break V1 endpoints; regressions undetected until production; debugging effort wasted on shared inheritance chains.

## Run Versioned Test Suites Independently
---
## Category
Testing
---
## Rule
Always run V1 and V2 test suites as separate CI jobs; never interleave version tests in a single suite.
---
## Reason
Separate CI jobs provide clear pass/fail status per version. A V2 change that breaks V1 tests fails the V1 job, making the regression immediately visible.
---
## Bad Example
`php
// Single test suite containing both V1 and V2 tests
class PhotoControllerTest extends TestCase { public function test_v1_index() { ... } public function test_v2_index() { ... } }
`
---
## Good Example
`php
// phpunit.xml with separate suites
// <testsuite name="V1"><directory>tests/Feature/Api/V1</directory></testsuite>
// <testsuite name="V2"><directory>tests/Feature/Api/V2</directory></testsuite>
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
CI green despite V2 breaking V1; regression detection delayed; no version-specific build artifacts.

## Pin V1 Controllers To V1-Specific Service Bindings
---
## Category
Reliability
---
## Rule
Always use contextual binding to pin V1 controllers to V1-specific service implementations; never share mutable service instances between versions.
---
## Reason
Shared services modified for V2 behavior silently break V1 endpoints. Pinning each version to dedicated bindings ensures version isolation.
---
## Bad Example
`php
// Both versions share the same service binding
app()->bind(PhotoService::class, DefaultPhotoService::class);
`
---
## Good Example
`php
app()->when(V1\PhotoController::class)->needs(PhotoService::class)->give(V1\PhotoService::class);
app()->when(V2\PhotoController::class)->needs(PhotoService::class)->give(V2\PhotoService::class);
`
---
## Exceptions
Immutable services (value objects, pure utility classes) may be shared safely.
---
## Consequences Of Violation
V2 changes silently break V1; production incidents traced to shared service modifications; rollback complexity increased.

## Add Deprecation And Sunset Headers
---
## Category
Design
---
## Rule
Always add Deprecation and Sunset headers to responses from deprecated API versions; never remove a version silently.
---
## Reason
Deprecation headers give clients explicit notice of planned removal. Silent removal breaks clients with no migration window.
---
## Bad Example
`php
// V1 controller — no deprecation headers; clients have no notice
public function index() { return V1Resource::collection(Photo::paginate()); }
`
---
## Good Example
`php
// V1 middleware that adds deprecation headers
public function index() { return V1Resource::collection(Photo::paginate())
  ->header('Deprecation', 'true')
  ->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT'); }
`
---
## Exceptions
Internal-only APIs with synchronous migration capability may skip deprecation headers.
---
## Consequences Of Violation
Clients break without warning; support burden from unreported deprecations; emergency client migrations.

## Maintain Implementation Parity Across Versions
---
## Category
Reliability
---
## Rule
Always ensure V2 controllers implement every endpoint that V1 provides; never ship V2 with missing endpoints.
---
## Reason
Clients cannot selectively use V2 for some endpoints and V1 for others without custom proxy logic. Missing endpoints force clients to maintain dual integration.
---
## Bad Example
`php
// V1PhotoController has all 5 apiResource methods
// V2PhotoController implements only index() and show() — store/update/destroy are 404
`
---
## Good Example
`php
// V2PhotoController implements all 5 apiResource methods
// Use PHPStan or a contract test to enforce: "V2 must implement all V1 actions"
`
---
## Exceptions
When an endpoint is intentionally removed in the new version and the removal is documented in the changelog with migration guidance.
---
## Consequences Of Violation
Clients cannot fully migrate to V2; support burden from 404 errors on missing endpoints; incomplete migration documentation.
