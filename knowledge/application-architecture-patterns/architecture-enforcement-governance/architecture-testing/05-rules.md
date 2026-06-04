# Rule: Encode Architectural Rules As Automated Pest Architecture Tests
---
## Category
Architecture | Testing
---
## Rule
Always encode every architectural rule as an automated Pest architecture test rather than relying solely on documentation or manual code review.
---
## Reason
Documentation-only rules are never read and never enforced. Violations accumulate silently until the architecture is unrecognizable. Automated tests catch violations on every CI run.
---
## Bad Example
Architecture rules exist only in a `docs/architecture.md` file with no corresponding tests. Developers are expected to "follow the rules" during code review.
---
## Good Example
```php
test('Controllers may only depend on Services')
    ->expect('App\Http\Controllers')
    ->not->toUse('App\Models')
    ->ignoring('App\Http\Controllers\Shared');
```
---
## Exceptions
None for any rule that is stable and agreed upon. Transient rules that will be removed soon may be documented-only.
---
## Consequences Of Violation
Silent architecture erosion. New developers learn incorrect patterns. Codebase becomes untangled over time.

---
# Rule: Run Architecture Tests On Every PR As A Pre-Merge Gate
---
## Category
Architecture | Testing | Reliability
---
## Rule
Always run architecture tests in CI on every pull request and configure CI to block merges on architecture test failures.
---
## Reason
Architecture tests that are not enforced in CI become optional and are eventually ignored. The only way to merge a violation is to change the rule, which forces conscious architecture decisions.
---
## Bad Example
Architecture tests exist locally but are not in the CI pipeline. Developers forget to run them before merging. Violations reach the main branch.
---
## Good Example
```yaml
# .github/workflows/architecture.yml
name: Architecture Tests
on: [pull_request]
jobs:
  arch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: composer install
      - run: vendor/bin/pest --arch
    # Required check in branch protection rules
```
---
## Exceptions
Prototype codebases where architecture is intentionally fluid and expected to change rapidly.
---
## Consequences Of Violation
Violations reach the main branch. Architecture tests lose credibility as a gate. The team stops trusting the enforcement system.

---
# Rule: Define All Architecture Tests In The `tests/Architecture/` Directory
---
## Category
Code Organization | Maintainability
---
## Rule
Keep all architecture tests in a single `tests/Architecture/` directory rather than scattering them across feature test directories.
---
## Reason
A single directory makes architecture rules visible to the entire team. Anyone can open the directory to understand the project's architectural constraints without hunting through feature tests.
---
## Bad Example
Architecture assertions are mixed into feature tests: `tests/Feature/OrderTest.php` contains `expect('App\Models')->not->toUse('App\Http\Controllers')`.
---
## Good Example
```php
// tests/Architecture/LayerRules.php
test('Services may not depend on Controllers')
    ->expect('App\Services')
    ->not->toUse('App\Http\Controllers');

test('Repositories must implement RepositoryInterface')
    ->expect('App\Repositories')
    ->toImplement('App\Contracts\RepositoryInterface');
```
---
## Exceptions
None. All architecture rules live in `tests/Architecture/`. Feature tests remain focused on behavior.
---
## Consequences Of Violation
Architecture rules are invisible to the team. New developers cannot discover them. Rules are duplicated or contradicted across test files.

---
# Rule: Enforce Dependency Direction Between Layers
---
## Category
Architecture | Code Organization
---
## Rule
Always enforce layer dependency direction with architecture tests: Controllers may call Services, Services may call Repositories. Never allow reverse dependencies.
---
## Reason
Layer dependency rules prevent tight coupling between architectural layers. When Services depend on Controllers, the layer boundary is meaningless and the codebase becomes a big ball of mud.
---
## Bad Example
```php
// In a Service class
use App\Http\Controllers\OrderController;

class OrderService
{
    public function process(Order $order): void
    {
        (new OrderController)->index(); // Service calling Controller — illegal
    }
}
```
---
## Good Example
```php
test('Services must not depend on Controllers')
    ->expect('App\Services')
    ->not->toUse('App\Http\Controllers');
```
---
## Exceptions
Shared utility classes or cross-cutting concerns (logging, caching) that are explicitly ignored via `->ignoring()`.
---
## Consequences Of Violation
Circular dependencies between layers. Code becomes tightly coupled and impossible to test in isolation. Refactoring one layer requires changes in all layers.

---
# Rule: Enforce Bounded Context Isolation
---
## Category
Architecture | Scalability
---
## Rule
Always enforce bounded context isolation with architecture tests: code in one context must not import from another context unless explicitly allowed by the dependency map.
---
## Reason
Bounded contexts are the primary decomposition mechanism. Unauthorized cross-context imports create hidden coupling that makes independent deployment, testing, and team ownership impossible.
---
## Bad Example
```php
// In App\Modules\Checkout\Services\CheckoutService.php
use App\Modules\Inventory\Models\Product; // Checkout importing from Inventory — not allowed

class CheckoutService
{
    public function calculate(Product $product): float { /* ... */ }
}
```
---
## Good Example
```php
test('Checkout may only import from Shared and Billing')
    ->expect('App\Modules\Checkout')
    ->not->toUse('App\Modules\Inventory')
    ->not->toUse('App\Modules\Shipping');
```
---
## Exceptions
All contexts may import from the Shared kernel. The shared kernel is gated to only contain common types and contracts.
---
## Consequences Of Violation
Hidden coupling between contexts. Teams cannot deploy independently. A change in one context breaks another context unexpectedly.

---
# Rule: Enforce Naming Convention Rules With Architecture Tests
---
## Category
Architecture | Maintainability
---
## Rule
Always enforce naming conventions with architecture tests: controllers must end with `Controller`, services with `Service`, commands with `Command`, etc.
---
## Reason
Consistent naming makes the codebase navigable. When conventions are not enforced, classes with incorrect names escape notice and confuse developers searching for patterns.
---
## Bad Example
A class named `OrderHandler` in `App\Http\Controllers` — does not end with `Controller`. It passes code review because reviewers assume it is a service.
---
## Good Example
```php
test('all controllers must end with Controller')
    ->expect('App\Http\Controllers')
    ->toHaveSuffix('Controller');

test('all services must end with Service')
    ->expect('App\Services')
    ->toHaveSuffix('Service');
```
---
## Exceptions
Abstract base classes or traits in a namespace that follow a different naming convention. Use `->ignoring()` for documented exceptions.
---
## Consequences Of Violation
Inconsistent naming creates confusion. Developers waste time searching for classes. Automated tooling (IDE navigation, autoloading) becomes less reliable.

---
# Rule: Start With Strict Rules And Loosen With `->ignoring()`
---
## Category
Architecture | Maintainability
---
## Rule
Always start with the strictest possible architecture rule and use `->ignoring()` for legitimate exceptions rather than writing permissive rules from the start.
---
## Reason
It is easier to relax a strict rule than to tighten a loose one. Relaxing via `->ignoring()` documents each exception explicitly. Tightening a loose rule requires finding all existing violations first.
---
## Bad Example
```php
// Permissive from the start — misses violations
test('Services should generally not use Models directly')
    ->expect('App\Services')
    ->not->toUse('App\Models');
```
---
## Good Example
```php
// Strict + explicit exceptions
test('Services must not use Models directly')
    ->expect('App\Services')
    ->not->toUse('App\Models')
    ->ignoring('App\Services\Shared\DataMapper');
```
---
## Exceptions
When the rule itself is experimental and the team expects to change it significantly within days.
---
## Consequences Of Violation
Permissive rules allow violations that should be caught. Engineers are unaware that a pattern is disallowed because no explicit exception was ever needed.

---
# Rule: Prefer Pest Architecture Tests Over Custom PHPStan Rules
---
## Category
Architecture | Maintainability
---
## Rule
Prefer Pest architecture tests for structural and import rules. Use custom PHPStan rules only for constraints that Pest's architecture testing cannot express (type-level constraints, method call analysis).
---
## Reason
Pest architecture tests are simpler to write, more readable, and sufficient for most import rules. Custom PHPStan rules require deeper expertise and are harder to maintain. Using both mechanisms for the same rule adds maintenance burden without value.
---
## Bad Example
```php
// Custom PHPStan rule for a simple namespace check
class NoModelInControllerRule implements Rule
{
    public function processNode(Node $node): array
    {
        // 50+ lines of boilerplate for what Pest does in 3 lines
    }
}
```
---
## Good Example
```php
// Pest architecture test — 3 lines
test('Controllers must not use Models')
    ->expect('App\Http\Controllers')
    ->not->toUse('App\Models');
```
---
## Exceptions
Pest architecture tests cannot check method return types, method calls, or class inheritance that crosses file boundaries. Use PHPStan rules for these.
---
## Consequences Of Violation
Unnecessary maintenance burden. Custom PHPStan rules that duplicate Pest tests add complexity without additional enforcement.

---
# Rule: Review The Architecture Test Exception List Periodically
---
## Category
Maintainability
---
## Rule
Review the `->ignoring()` list in architecture tests every quarter to remove exceptions that are no longer needed.
---
## Reason
Exceptions accumulate over time. A class that was legitimately ignored six months ago may no longer exist or may have been refactored. Stale exceptions hide new violations that should be caught.
---
## Bad Example
An `->ignoring('App\Legacy\OldMapper')` exists in the exception list. The class was deleted three months ago but the exception remains. A new class `App\Legacy\NewViolation` is added under the same namespace.
---
## Good Example
```php
// Reviewed and trimmed quarterly
test('Services must not use Models')
    ->expect('App\Services')
    ->not->toUse('App\Models')
    ->ignoring('App\Services\Shared\DataMapper'); // Confirmed still needed: 2026-06-02
```
---
## Exceptions
None. The review cadence may be extended (e.g., bi-annual) for very stable codebases with infrequent changes.
---
## Consequences Of Violation
Stale exceptions accumulate, reducing the effectiveness of the architecture test suite. Violations that should be caught pass through silently.

---
# Rule: Never Use Architecture Tests For Runtime Behavior Or Performance Constraints
---
## Category
Architecture | Testing
---
## Rule
Never use architecture tests to verify runtime behavior, performance constraints, or business logic. Use integration tests, unit tests, or load tests instead.
---
## Reason
Architecture tests inspect code structure (imports, namespaces, inheritance) not runtime behavior. Using them for runtime concerns gives false confidence — a passing architecture test does not mean the code works correctly.
---
## Bad Example
```php
// Architecture test checking business logic — wrong tool
test('Order total calculation is correct')
    ->expect('App\Services\OrderService')
    ->toHaveMethod('calculateTotal');
```
---
## Good Example
```php
// Architecture test checks structure
test('OrderService is in the Services namespace')
    ->expect('App\Services\OrderService')
    ->toHaveNamespace('App\Services');

// Separate unit test checks behavior
test('OrderService calculates total correctly')
    ->assertSame(100.0, $service->calculateTotal($order));
```
---
## Exceptions
None. Use the correct test type for the concern being verified.
---
## Consequences Of Violation
False confidence in test coverage. Architecture tests pass but the application is broken. Violations are hidden because the wrong tool is used.
