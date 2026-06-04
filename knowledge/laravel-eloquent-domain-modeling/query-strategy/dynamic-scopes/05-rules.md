# Phase 5: Rules — Dynamic Scopes

## Rule 1: Always Whitelist Dynamic Scope Names from User Input
---
## Category
Security
---
## Rule
Never pass user input directly as a scope method name. Always validate dynamic scope names against an explicit whitelist array before dispatching the call.
---
## Reason
Dynamic scope dispatch (`$query->{$userInput}()`) can call ANY public method on the builder, including non-scope methods that may modify internal state, execute queries, or access restricted data. A whitelist is the only defense against arbitrary method invocation.
---
## Bad Example
```php
// Arbitrary method invocation — user can call any public method on Builder
$value = $request->input('scope');
$users = User::{$value}()->get();
```
---
## Good Example
```php
$scopeName = $request->input('scope');
$whitelist = ['active', 'verified', 'recent'];

if (in_array($scopeName, $whitelist, true)) {
    $users = User::{$scopeName}()->get();
} else {
    abort(422, "Invalid scope: {$scopeName}");
}
```
---
## Exceptions
No common exceptions. Whitelisting is mandatory whenever scope names originate from external input.
---
## Consequences Of Violation
Critical remote code execution vulnerability via arbitrary method invocation; data exfiltration through unexpected method calls; complete application compromise.

## Rule 2: Limit Parameterized Scopes to 3 Parameters Maximum
---
## Category
Design
---
## Rule
Design parameterized scopes with 3 or fewer parameters. Extract scopes requiring more than 3 parameters into dedicated query objects or filter strategy classes.
---
## Reason
Scopes with 4+ parameters violate single responsibility and become untestable combinatorial nightmares. Each additional parameter multiplies the possible query outcomes, making the scope impossible to reason about.
---
## Bad Example
```php
public function scopeFilter(Builder $q, $type, $status, $from, $to, $sort, $dir, $limit): Builder
{
    // 7 parameters — impossible to test all combinations
}
```
---
## Good Example
```php
public function scopeOfType(Builder $q, string $type): Builder
public function scopeWithStatus(Builder $q, ?string $status): Builder
public function scopeDateRange(Builder $q, ?Carbon $from, ?Carbon $to): Builder
// Compose at call site
User::ofType('premium')->withStatus('active')->dateRange($from, $to)->get();
```
---
## Exceptions
Scopes with a single array parameter that contains multiple filter values (e.g., `scopeSearch(Builder $q, array $filters)`). The array is considered one parameter.
---
## Consequences Of Violation
Unmaintainable scopes with exponential testing requirements; high defect rates; difficulty understanding what each parameter does at the call site.

## Rule 3: Explicitly Chain Scopes for Business-Logic Queries; Reserve Dynamic Dispatch for Infrastructure
---
## Category
Code Organization
---
## Rule
Use explicit scope chaining (`User::active()->verified()->get()`) for all business-logic queries. Restrict dynamic scope dispatch to generic infrastructure code (filter systems, API query builders, admin panels).
---
## Reason
Explicit chains are statically analyzable, navigable by IDEs, and self-documenting. Dynamic dispatch hides which scopes are applied, making the code impossible to analyze statically. Business logic needs clarity; infrastructure code needs flexibility.
---
## Bad Example
```php
// Business logic hidden behind dynamic dispatch
class UserController {
    public function index() {
        $query = User::query();
        $scopes = ['active', 'verified'];
        foreach ($scopes as $scope) {
            $query->{$scope}();
        }
        return $query->get();
    }
}
```
---
## Good Example
```php
// Business logic explicit and readable
class UserController {
    public function index() {
        return User::active()->verified()->get();
    }
}
```
---
## Exceptions
Generic admin panel code that dynamically applies scopes based on user-selected filters in a UI. The infrastructure layer is the correct place for dynamic dispatch.
---
## Consequences Of Violation
Code that is impossible to navigate statically; IDE unable to trace scope application; reduced readability; increased cognitive load for team members.

## Rule 4: Validate Scope Parameters Before Passing Them to Parameterized Scopes
---
## Category
Security
---
## Rule
Validate and sanitize all values passed to parameterized scopes, especially when the values originate from user input, request parameters, or external APIs.
---
## Reason
Parameterized scopes are methods that execute database constraints with the provided values. Unvalidated input bypasses controller validation and can pass unexpected types (null, array, object) or malicious values (SQL fragments in LIKE clauses) directly to the query builder.
---
## Bad Example
```php
// User input passed directly — status could be anything
User::ofType($request->input('type'))->get();
```
---
## Good Example
```php
$type = $request->input('type');
if (!in_array($type, ['premium', 'basic', 'enterprise'], true)) {
    abort(422, 'Invalid type');
}
User::ofType($type)->get();
```
---
## Exceptions
Scope parameters that have already been validated by FormRequest rules or have strict type hints and no SQL involvement (e.g., `scopeById(Builder $q, int $id)` where ID is already validated).
---
## Consequences Of Violation
SQL injection through raw fragments in LIKE or WHERE IN clauses; type errors causing 500 errors; unexpected query behavior from unvalidated value ranges.

## Rule 5: Reject Unknown Scope Names with a Clear Error Message
---
## Category
Maintainability
---
## Rule
Always handle the "unknown scope" case in dynamic dispatch paths with a clear error message. Never silently ignore an unrecognized scope name.
---
## Reason
Silently ignoring unknown scopes hides configuration errors and typos. An admin clicking "filter by type" that silently does nothing will assume the system is broken, not that the scope name is misspelled.
---
## Bad Example
```php
$scopeName = $request->input('filter');
if (in_array($scopeName, $whitelist, true)) {
    $query->{$scopeName}($request->input('value'));
}
// Unknown scope silently ignored — no feedback
```
---
## Good Example
```php
$scopeName = $request->input('filter');
if (!in_array($scopeName, $whitelist, true)) {
    throw new InvalidArgumentException("Unknown filter scope: {$scopeName}");
}
$query->{$scopeName}($request->input('value'));
```
---
## Exceptions
API endpoints where only specified filters are recognized and extra parameters are ignored by design. In that case, log the unknown scope for monitoring.
---
## Consequences Of Violation
Silent failures that are hard to debug; users frustrated by filters that "sometimes work"; configuration drift where scopes are renamed but callers are not updated.

## Rule 6: Avoid Dynamic Dispatch for Code Requiring Static Analysis or IDE Navigation
---
## Category
Maintainability
---
## Rule
Do not use dynamic scope dispatch in code paths where static analysis, IDE navigation, or automated refactoring is expected. Use dynamic dispatch only in generic/tooling code.
---
## Reason
Dynamic method calls (`$query->{$name}()`) are invisible to static analysis tools, IDE "Find Usages" features, and automated refactors. Renaming a scope requires searching for string references, not just refactoring the method name.
---
## Bad Example
```php
// IDE cannot find usages of 'active' scope
$filters = ['active', 'verified', 'recent'];
foreach ($filters as $filter) {
    $query->{$filter}();
}
```
---
## Good Example
```php
// IDE navigates directly to scope definitions
$query->active()->verified()->recent();
```
---
## Exceptions
Generic filter systems, admin panel builders, and API query string parsers are the legitimate home for dynamic dispatch. Keep it isolated here.
---
## Consequences Of Violation
Inability to safely rename scopes; missed usages during refactoring; low confidence in code changes; increased maintenance cost.
