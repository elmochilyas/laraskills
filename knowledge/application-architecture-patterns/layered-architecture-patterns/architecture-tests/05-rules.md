# Rules for Architecture tests to enforce layer boundaries

## Write Architecture Tests Before They're Needed
---
## Category
Testing | Architecture
---
## Rule
Write architecture tests BEFORE violations appear in the codebase; do not wait for architecture drift to accumulate before adding enforcement.
---
## Reason
Adding arch tests after violations exist requires baselining — you must either fix all existing violations or create a baseline file that allows them. Both approaches are harder than starting enforcement clean from the beginning.
---
## Bad Example
Architecture tests added 18 months into the project. Twenty-three classes in Domain import Laravel classes. The team must either fix all 23 (unlikely under deadlines) or create a complex baseline.
---
## Good Example
```php
// Day 1 of layered architecture — enforcement before any violations
arch('domain')->expect('App\Domain')->toOnlyUse([]);
arch('application')->expect('App\Application')->toOnlyUse(['App\Domain']);
```
---
## Exceptions
Existing codebases migrating to layered architecture should baseline current violations and only fail on new ones.
---
## Consequences Of Violation
Violations accumulate; baselining becomes harder; enforcement deferred indefinitely.

## Use Dependency Whitelist, Not Blacklist
---
## Category
Testing | Maintainability
---
## Rule
Whitelist allowed dependencies per layer rather than blacklisting forbidden ones; a whitelist is stricter and more maintainable.
---
## Reason
Blacklists must anticipate every forbidden dependency — miss one and the violation passes. Whitelists specify exactly what each layer may use; everything else is automatically forbidden. Whitelists are also more maintainable as the codebase grows.
---
## Bad Example
```php
arch('domain')->not->toUse(['Illuminate\Http\Request', 'Illuminate\Support\Facades\DB']);
// Misses Illuminate\Support\Facades\Cache, Illuminate\Database\Eloquent\Model, etc.
// Every new forbidden import requires updating the test
```
---
## Good Example
```php
arch('domain')->toOnlyUse([]); // Nothing allowed — automatically strict
arch('application')->toOnlyUse(['App\Domain']);
arch('infrastructure')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Database']);
```
---
## Exceptions
Legacy codebases with many existing dependencies may start with a blacklist and gradually migrate to a whitelist as violations are fixed.
---
## Consequences Of Violation
Missed violations from unknown forbidden dependencies; test maintenance burden as new forbidden imports are discovered.

## Baseline Existing Violations for Legacy Code
---
## Category
Testing | Maintainability
---
## Rule
When adding architecture tests to an existing codebase, baseline current violations so CI fails only on NEW violations; progressively reduce the baseline over time.
---
## Reason
Requiring all existing violations to be fixed before CI passes blocks architecture test adoption. A baseline allows incremental improvement — the team fixes violations at their own pace while preventing new ones.
---
## Bad Example
Architecture test added with no baseline. CI fails with 47 existing violations. The team disables the test ("we'll fix it later") and it never gets re-enabled.
---
## Good Example
```php
// Baseline file: tests/Architecture/.baseline
// Lists 47 existing violations — CI only fails on violations NOT in this list
// Sprint goal: reduce baseline by 5 violations per sprint
```
---
## Exceptions
Greenfield projects with no legacy code should not use a baseline — enforce strictly from day one.
---
## Consequences Of Violation
Architecture tests disabled; legacy violations never fixed; enforcement never adopted.

## Run Arch Tests in CI as Blocking Check
---
## Category
Testing | Reliability
---
## Rule
Architecture tests MUST run in CI as a blocking check; do not make them advisory or informational-only.
---
## Reason
Architecture tests that don't block merges become optional discipline. When under deadline pressure, developers will ignore non-blocking warnings. Blocking checks at merge time are the only reliable enforcement mechanism.
---
## Bad Example
Architecture tests exist but only run on developer machines. "We'll check them manually during code review." Under deadline pressure, no one runs them. Violations accumulate.
---
## Good Example
```yaml
# .github/workflows/ci.yml
- name: Run architecture tests
  run: php artisan test --arch
```
---
## Exceptions
During the initial migration phase with a baseline, relaxed enforcement may be temporarily acceptable — but the goal should be strict blocking enforcement.
---
## Consequences Of Violation
Architecture tests not run; violations merged; enforcement aspirational rather than actual.

## Combine Pest Arch Tests with PHPStan Rules
---
## Category
Testing | Architecture
---
## Rule
Use Pest architecture tests to check `use` statement violations AND PHPStan custom rules to catch Facade calls and helper functions that don't appear in imports.
---
## Reason
Pest arch tests analyze `use` statements, but Facade calls (`\DB::table()`) access classes globally without an import. PHPStan with custom rules catches these implicit dependencies that arch tests miss.
---
## Bad Example
```php
// This passes Pest arch('domain')->toOnlyUse([]) — no 'use' statement!
class InvoiceService {
    public function cancel(int $id): void {
        \DB::table('invoices')->where('id', $id)->update(['status' => 'cancelled']);
        \Cache::put("invoice.$id.cancelled", true);
    }
}
```
---
## Good Example
```php
// Pest: catches 'use' statement violations
arch('domain')->expect('App\Domain')->not->toUse(['Illuminate\*']);
// PHPStan: catches Facade calls without 'use'
// phpstan.neon: prohibits Facade calls in Domain namespace
```
---
## Exceptions
Projects not using PHPStan may rely solely on Pest arch tests — but recognize that Facade calls will not be caught.
---
## Consequences Of Violation
Facade and helper violations undetected; implicit framework coupling in Domain; false confidence in architecture enforcement.

## Test All Layer Boundaries
---
## Category
Testing | Architecture
---
## Rule
Write architecture tests for EVERY layer boundary (Domain, Application, Infrastructure, Presentation); do not test only the most obvious boundary (Domain isolation).
---
## Reason
Partial enforcement misses violations in secondary boundaries. Application might import Infrastructure, or Presentation might bypass Application and call Infrastructure directly. Each boundary must be independently verified.
---
## Bad Example
```php
arch('domain')->expect('App\Domain')->toOnlyUse([]);
// No tests for Application → Infrastructure or Presentation → Infrastructure violations
```
---
## Good Example
```php
arch('domain')->expect('App\Domain')->toOnlyUse([]);
arch('application')->expect('App\Application')->toOnlyUse(['App\Domain']);
arch('infrastructure')->expect('App\Infrastructure')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Database']);
arch('presentation')->expect('App\Http')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Http']);
```
---
## Exceptions
Projects with only three-layer architecture (no Domain/Application/Infrastructure distinction) may need fewer tests — but the boundaries that exist should all be enforced.
---
## Consequences Of Violation
Hidden violations in secondary boundaries; Application imports Infrastructure; Presentation bypasses Application; architecture degrades partially.

## Keep Architecture Tests Updated
---
## Category
Maintainability | Testing
---
## Rule
Update architecture tests whenever layer boundaries or namespace conventions change; do not let arch tests become stale.
---
## Reason
Architecture test rot is the most common arch test failure pattern. When tests aren't updated with architecture changes, they either fail constantly (and get disabled) or pass when they shouldn't (false confidence).
---
## Bad Example
Namespace changed from `App\Domain` to `App\Domain\Catalog`. Architecture tests still reference `App\Domain`. All Domain classes now bypass the tests. Violations accumulate silently.
---
## Good Example
```php
// Namespace and arch tests defined in one place — change together
const DOMAIN_NAMESPACE = 'App\Domain';
arch('domain')->expect(DOMAIN_NAMESPACE)->toOnlyUse([]);
```
---
## Exceptions
No common exceptions. Stale arch tests are worse than no arch tests.
---
## Consequences Of Violation
False confidence; stale tests pass when violations exist; violations accumulate until architecture is meaningless.

## Avoid Too-Permissive Rules
---
## Category
Testing | Architecture
---
## Rule
Be specific about which `Illuminate\*` classes each layer is allowed to use; do not whitelist all `Illuminate\*` for all layers.
---
## Reason
Whitelisting `Illuminate\*` for all layers allows Domain to import `Illuminate\Support\Facades\DB` or `Illuminate\Database\Eloquent\Model` — both of which are violations that defeat the purpose of architecture enforcement.
---
## Bad Example
```php
arch('domain')->toOnlyUse(['Illuminate\*']); // Allows EVERYTHING from Laravel
// Domain can now import: DB, Eloquent Model, Facades, etc.
```
---
## Good Example
```php
arch('domain')->toOnlyUse([]); // Zero framework imports (strict)
// OR for partial independence:
arch('domain')->toOnlyUse(['Illuminate\Support\Carbon', 'Illuminate\Support\Collection']);
```
---
## Exceptions
The Infrastructure layer may generally use `Illuminate\*` broadly since it is the designated framework-coupling zone.
---
## Consequences Of Violation
Architecture tests pass despite framework coupling in Domain; false security; enforcement is cosmetic.
