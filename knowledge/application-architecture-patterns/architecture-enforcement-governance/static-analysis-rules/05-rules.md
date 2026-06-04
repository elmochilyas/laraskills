# Rule: Default To Pest Architecture Tests Over Custom PHPStan Rules
---
## Category
Architecture | Maintainability
---
## Rule
Prefer Pest architecture tests for structural and import constraints. Use custom PHPStan rules only for constraints that Pest's architecture testing cannot express.
---
## Reason
Pest architecture tests are simpler to write, more readable, and sufficient for most import and namespace rules. Custom PHPStan rules introduce maintenance overhead, require deeper expertise, and are harder to debug.
---
## Bad Example
```php
// Custom PHPStan rule for a simple namespace import check
class NoServiceInControllerRule implements Rule
{
    public function getNodeType(): string
    {
        return Node\Expr\New_::class;
    }
    public function processNode(Node $node): array
    {
        // 40+ lines for what Pest does in 3
    }
}
```
---
## Good Example
```php
test('Controllers must not instantiate Services directly')
    ->expect('App\Http\Controllers')
    ->not->toUse('App\Services');
```
---
## Exceptions
Constraints that require AST-level analysis: checking method return types, verifying method calls, or enforcing interface implementation requirements that cross file boundaries.
---
## Consequences Of Violation
Unnecessary maintenance burden. PHPStan rules that duplicate Pest tests add complexity without enforcement value.

---
# Rule: Never Duplicate Rules Across Pest And PHPStan
---
## Category
Architecture | Maintainability
---
## Rule
Never enforce the same architectural constraint in both a Pest architecture test and a custom PHPStan rule. Choose one enforcement mechanism per rule.
---
## Reason
Duplicate rules must be kept in sync. When the rule changes, both implementations must be updated. If one is missed, the inconsistency creates confusion about which rule is authoritative.
---
## Bad Example
Pest test checks `Services must not use Models` and a custom PHPStan rule also checks the same constraint. The exception list is updated in the Pest test but not in PHPStan, causing false positives.
---
## Good Example
```php
// Pest covers structural import rules
test('Services must not use Models')
    ->expect('App\Services')
    ->not->toUse('App\Models');

// PHPStan covers what Pest cannot: method return types
// No overlap between the two mechanisms
```
---
## Exceptions
None. Choose Pest for structural rules, PHPStan for type-level rules. Never both.
---
## Consequences Of Violation
Inconsistent enforcement. One rule is updated, the other is not. Developers lose trust in both mechanisms.

---
# Rule: Use Static Analysis For Type-Level Architecture Constraints
---
## Category
Architecture
---
## Rule
Use static analysis (PHPStan custom rules) for type-level architecture constraints: method return types, parameter types, interface implementation, and forbidden method calls. Do not use it for namespace import rules.
---
## Reason
Static analysis understands the type system at the AST level. It can verify that a repository returns `Collection` not `Eloquent\Collection`, or that a service method accepts a DTO not an Eloquent model. These are harder to express in structural tests.
---
## Bad Example
```php
class OrderService
{
    public function process(): Eloquent\Collection // Should return Collection
    {
        return Order::all();
    }
}
// Pest cannot easily check return types
```
---
## Good Example
```php
// PHPStan custom rule checking return type
class ServiceMustReturnCollectionRule implements Rule
{
    public function processNode(Node $node): array
    {
        // Verifies all public methods in App\Services return
        // Illuminate\Support\Collection, not Eloquent models
    }
}
```
---
## Exceptions
None. This is the primary use case for custom PHPStan rules.
---
## Consequences Of Violation
Type-level violations go undetected. Eloquent models leak from repositories into services. Bounded context boundaries are crossed through type usage rather than imports.

---
# Rule: Integrate Custom PHPStan Rules Into CI
---
## Category
Architecture | Reliability
---
## Rule
Always run custom PHPStan architecture rules in CI as part of the static analysis step. Never rely on local-only execution of custom rules.
---
## Reason
Custom PHPStan rules that are only run locally are eventually forgotten. New developers may not know they exist. Without CI enforcement, violations are only caught when someone happens to run the analysis.
---
## Bad Example
Custom PHPStan rules are documented in the README but not configured in the CI pipeline. Developers run `vendor/bin/phpstan` locally only when they remember to.
---
## Good Example
```yaml
jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - run: composer install
      - run: vendor/bin/phpstan analyse --level=max --configuration=phpstan.arch.neon
```
---
## Exceptions
None. All custom rules that are worth writing are worth enforcing in CI.
---
## Consequences Of Violation
Custom rules are ignored. Violations accumulate. The effort of writing the rules is wasted.

---
# Rule: Use `spaze/phpstan-disallowed-calls` For Forbidden Classes And Methods
---
## Category
Architecture | Security
---
## Rule
Use the `spaze/phpstan-disallowed-calls` package to enforce disallowed calls to specific classes, methods, or functions rather than writing custom PHPStan rules for each one.
---
## Reason
The package provides a declarative configuration for forbidding calls, eliminating the need to write and maintain custom PHPStan rules for simple disallowed-call scenarios. It supports calls, static calls, method calls, and attribute usage.
---
## Bad Example
```php
// Custom rule to forbid a single method call
class NoDdCallRule implements Rule
{
    public function processNode(Node $node): array
    {
        // 30+ lines of boilerplate for one forbidden call
    }
}
```
---
## Good Example
```yaml
# phpstan.neon
parameters:
    disallowedMethodCalls:
        -
            method: 'App\Legacy\OldService::process()'
            message: 'Use NewService instead'
```
---
## Exceptions
Forbidden calls that require dynamic logic (e.g., "forbid a method unless called from a specific namespace") may still require custom rules.
---
## Consequences Of Violation
Boilerplate code in custom rules. Higher maintenance cost. Developers may avoid adding new disallowed calls due to the effort of writing a rule.

---
# Rule: Check Patterns, Not Specific Class Names, In Custom Rules
---
## Category
Architecture | Maintainability
---
## Rule
Write custom PHPStan rules that check architectural patterns (namespace, interface implementation, return type) rather than specific class names or method signatures.
---
## Reason
Rules that reference specific class names break when classes are renamed or moved. Pattern-based rules continue to work across refactoring and require no maintenance when individual classes change.
---
## Bad Example
```php
// Rule checks a specific class — breaks if renamed
class CheckSpecificServiceRule implements Rule
{
    private const FORBIDDEN = 'App\OldOrderProcessor';
}
```
---
## Good Example
```php
// Rule checks namespace pattern — survives renaming
class NoLegacyNamespaceRule implements Rule
{
    public function processNode(Node $node): array
    {
        if ($node->usesNamespace('App\Legacy')) {
            return ['Legacy namespace usage is forbidden'];
        }
    }
}
```
---
## Exceptions
When a specific class is deliberately deprecated and all usages must be eliminated (e.g., `Debugbar::` in production code).
---
## Consequences Of Violation
Custom rules break during refactoring. Developers spend time fixing rules instead of working on features. Rules are eventually removed rather than maintained.

---
# Rule: Configure Larastan For Framework-Specific Architecture Checks
---
## Category
Architecture | Framework Usage
---
## Rule
Always configure Larastan in `phpstan.neon` to enable framework-specific checks for Eloquent, routes, facades, and other Laravel constructs.
---
## Reason
Larastan understands Laravel's magic methods, facade resolution, and Eloquent query builder. Without it, static analysis misses common Laravel-specific violations such as missing model properties or incorrect route names.
---
## Bad Example
PHPStan is configured without Larastan. A service calls `User::where('email', $email)->first()` — PHPStan cannot verify that `email` is a valid column because it does not understand Eloquent.
---
## Good Example
```yaml
# phpstan.neon
includes:
    - vendor/larastan/larastan/extension.neon
parameters:
    larastan:
        models:
            - App\Models
```
---
## Exceptions
Non-Laravel projects or projects that do not use Eloquent.
---
## Consequences Of Violation
False negatives in static analysis. Eloquent misuse and missing model properties are not detected until runtime.

---
# Rule: Keep Custom PHPStan Rules Focused On High-Value Constraints
---
## Category
Architecture | Maintainability
---
## Rule
Limit custom PHPStan rules to high-value architectural constraints that cannot be expressed in Pest architecture tests. Avoid writing rules for low-value or cosmetic concerns.
---
## Reason
Each custom PHPStan rule adds CI time, maintenance burden, and cognitive load. Low-value rules (e.g., "variables must be named in camelCase") are better handled by linters or PHP CS Fixer.
---
## Bad Example
```php
// Custom rule for a stylistic concern — better handled by a linter
class VariableNamingRule implements Rule { /* 40 lines */ }
```
---
## Good Example
```php
// High-value architectural rules only
class RepositoryMustReturnCollectionRule implements Rule { /* ... */ }
class ServiceMustNotEmitQueryRule implements Rule { /* ... */ }
class ControllerMustNotInjectModelRule implements Rule { /* ... */ }
```
---
## Exceptions
None. Linters and code style fixers exist for cosmetic rules. Reserve PHPStan rules for architecture.
---
## Consequences Of Violation
CI static analysis time increases. Custom rules are harder to maintain. The team experiences rule fatigue and ignores violations.
