# Phase 5: Rules — Controller Inheritance

## Limit Inheritance Depth To Two Levels
---
## Category
Maintainability
---
## Rule
Never exceed two levels of controller inheritance (Base → Version). Avoid chains like Base → V1 → V1_1 → V2.
---
## Reason
Each inheritance level adds cognitive load and makes it harder to trace which method is actually called at runtime.
---
## Bad Example
```php
class V2Controller extends V1Controller {} // inherits from V1, not Base
```
---
## Good Example
```php
class V2PostController extends BaseController {} // direct inheritance from Base
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Accidental regressions from deep inheritance chains; debugging hell trying to trace method resolution.
---

## Mark Security Methods As `final` In Base Controller
---
## Category
Security
---
## Rule
Always mark authentication, authorization, throttle, and audit methods as `final` in the base controller to prevent version-level override.
---
## Reason
A version controller overriding `authorize()` can accidentally bypass security checks, creating a vulnerability.
---
## Bad Example
```php
class BaseController { public function authorizeResource(): void { /* auth */ } }
class V2Controller extends BaseController { public function authorizeResource(): void {} } // bypass
```
---
## Good Example
```php
class BaseController { final public function authorizeResource(): void { /* auth */ } }
```
---
## Exceptions
When a newer version intentionally changes auth scope (requires architecture review).
---
## Consequences Of Violation
Authentication bypass in specific versions; silent security regression undetected by audits.
---

## Use `#[Override]` Attribute For All Overridden Methods
---
## Category
Maintainability
---
## Rule
Always use the PHP 8.3+ `#[Override]` attribute on every method that overrides a base class method in version controllers.
---
## Reason
The attribute tells the compiler to verify the parent method signature matches, catching accidental signature drift.
---
## Bad Example
```php
class V2Controller extends BaseController { public function index(Request $request): array {} } // renamed param silently stops overriding
```
---
## Good Example
```php
class V2Controller extends BaseController { #[Override] public function index(): array {} }
```
---
## Exceptions
Projects locked to PHP < 8.3 (upgrade instead).
---
## Consequences Of Violation
Method signature drift silently breaks inheritance — base method runs instead of override.
---

## Extract Cross-Cutting Concerns To Traits
---
## Category
Code Organization
---
## Rule
Always extract cross-cutting version logic (audit logging, cache headers, rate limiting) into traits rather than adding methods to the base controller.
---
## Reason
Traits are composable and version controllers can opt in without polluting the base controller.
---
## Bad Example
```php
class BaseController { public function logAudit(): void {} public function addCacheHeaders(): void {} } // god base
```
---
## Good Example
```php
trait AuditsRequests { public function logAudit(): void {} }
trait AddsCacheHeaders { public function addCacheHeaders(): void {} }
class V2Controller extends BaseController { use AuditsRequests, AddsCacheHeaders; }
```
---
## Exceptions
When every single version uses exactly the same cross-cutting logic — then move to base.
---
## Consequences Of Violation
Base controller bloats into a god object; version controllers inherit methods they don't use.
---

## Keep Base Controller Lean
---
## Category
Maintainability
---
## Rule
Never add methods to the base controller that are used by fewer than 50% of version controllers.
---
## Reason
A base controller with version-specific methods violates LSP and creates dead code for versions that don't use those methods.
---
## Bad Example
```php
class BaseController { public function v2CursorPaginate() {} } // only V2 uses it
```
---
## Good Example
```php
class BaseController { protected function paginate($query): array {} } // all versions use
// V2-specific logic in V2 controller or trait
```
---
## Exceptions
Methods that represent the default implementation that most versions override.
---
## Consequences Of Violation
Dead code accumulation; confusion about which methods are "safe" to override.
---

## Test Base Controller Once, Override Tests For Versions
---
## Category
Testing
---
## Rule
Write tests for the base controller behavior once, then write additional tests only for methods that version controllers override.
---
## Reason
Duplicating base controller tests across every version creates brittle test suites that break on every base change.
---
## Bad Example
```php
// V1 and V2 both test base behavior identically
```
---
## Good Example
```php
class PostControllerTest extends TestCase { public function test_pagination_limit() {} } // tests base
class V2PostControllerTest extends PostControllerTest { public function test_cursor_pagination() {} } // tests override only
```
---
## Exceptions
When version controllers override security logic — test the overridden security path explicitly.
---
## Consequences Of Violation
Brittle test suite; false negatives when base behavior changes; reduced developer velocity.
---

## Avoid Shared Mutable State In Base Properties
---
## Category
Reliability
---
## Rule
Never share mutable state properties in the base controller that version controllers can modify.
---
## Reason
A version controller modifying a base property affects the next request from a different version, causing race-condition bugs.
---
## Bad Example
```php
class BaseController { protected int $pageSize = 20; } // mutable shared state
class V1Controller extends BaseController { public function index() { $this->pageSize = 50; /* mutates for all */ } }
```
---
## Good Example
```php
class BaseController { protected function getPageSize(): int { return 20; } } // immutable accessor
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Hard-to-reproduce race-condition bugs where one version's mutation affects another version's behavior.
---

## Monitor Override Ratio For Refactoring Signal
---
## Category
Maintainability
---
## Rule
When more than 60% of base controller methods are overridden in version controllers, refactor to composition or a strategy pattern.
---
## Reason
High override ratio means the base controller captures no meaningful shared behavior — inheritance becomes ceremony.
---
## Bad Example
```php
// 8 of 10 base methods overridden in V2 — inheritance adds no value
```
---
## Good Example
```php
// 2 of 10 base methods overridden — inheritance captures real shared behavior
```
---
## Exceptions
When the overridden methods are thin adapters that delegate back to shared logic.
---
## Consequences Of Violation
Inheritance overhead without benefit; developers must understand the entire base to write version code.
