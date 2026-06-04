# Rule: Default To Strict Import Allowlists Per Bounded Context
---
## Category
Architecture | Scalability
---
## Rule
Start every bounded context with an empty import allowlist. Add allowed dependencies explicitly as the need arises. Never start with a permissive allowlist.
---
## Reason
A strict default prevents accidental coupling from day one. Every import from a new context requires a deliberate decision and documentation. Permissive defaults allow coupling to grow unnoticed until it becomes expensive to untangle.
---
## Bad Example
Context A is created without an allowlist. Developers import freely from Context B, C, and D. Six months later, Context A has implicit dependencies on all three and cannot be extracted independently.
---
## Good Example
```php
test('Checkout context imports only from allowed contexts')
    ->expect('App\Modules\Checkout')
    ->not->toUse('App\Modules\Inventory')
    ->not->toUse('App\Modules\Shipping')
    ->not->toUse('App\Modules\Notifications');
// Checkout IS allowed to use Shared and Billing
```
---
## Exceptions
The Shared kernel is the only universal allowlist. All contexts may import from Shared.
---
## Consequences Of Violation
Accidental cross-context coupling accumulates silently. Contexts become tightly coupled and cannot be developed, tested, or deployed independently.

---
# Rule: Use Pest Architecture Tests For Import Rules
---
## Category
Architecture | Maintainability
---
## Rule
Always encode the dependency map as Pest architecture tests rather than using custom scripts, configuration files, or manual documentation.
---
## Reason
Pest architecture tests are executable, readable, and automatically verified in CI. Configuration files and scripts are additional tooling to maintain. Executable documentation never goes out of sync with the codebase.
---
## Bad Example
The dependency map is documented in a spreadsheet. No one updates it when new contexts are added. Developers reference the spreadsheet and follow outdated rules.
---
## Good Example
```php
test('Inventory must not import from Checkout')
    ->expect('App\Modules\Inventory')
    ->not->toUse('App\Modules\Checkout');

test('Shipping must not import from Inventory')
    ->expect('App\Modules\Shipping')
    ->not->toUse('App\Modules\Inventory');
```
---
## Exceptions
None. Pest architecture tests are the standard mechanism for import rule enforcement.
---
## Consequences Of Violation
The dependency map and the actual codebase diverge. Developers have no single source of truth for import rules.

---
# Rule: Detect Transitive Dependencies
---
## Category
Architecture | Scalability
---
## Rule
Always detect and flag transitive dependencies: if Context A imports from Context B which imports from Context C, Context A effectively depends on Context C and the detection system must flag this.
---
## Reason
Direct import detection alone is insufficient. Transitive dependencies create the same coupling as direct ones but are invisible to simple checks. A change in Context C can break A even though A never directly imports from C.
---
## Bad Example
Context A (Checkout) directly imports from Context B (Billing). Context B imports from Context C (FraudDetection). Context A now depends on FraudDetection but has no direct import and no test checks this.
---
## Good Example
```php
test('Checkout has no transitive dependency on FraudDetection')
    ->expect('App\Modules\Checkout')
    ->not->toUse('App\Modules\FraudDetection')
    ->ignoring('App\Modules\Billing'); // Billing is an allowed direct dep
```
---
## Exceptions
The Shared kernel and framework-level dependencies (Laravel core, Symfony components) are not subject to transitive dependency checks.
---
## Consequences Of Violation
Hidden coupling across the dependency chain. A change in a deeply nested context breaks an upstream context without any direct import being flagged.

---
# Rule: Run Import Violation Detection In CI As A Pre-Merge Gate
---
## Category
Architecture | Reliability
---
## Rule
Always run import violation detection in CI and configure CI to block merges on import violations. Never rely on developer discipline or IDE warnings alone.
---
## Reason
IDE warnings are ignored or dismissed. Local tests are not always run. Only CI enforcement guarantees that every commit is checked. Without a hard gate, import violations reach the main branch.
---
## Bad Example
Import rules exist as Pest tests but are not in the CI pipeline. A developer commits an unauthorized import because they forgot to run tests locally.
---
## Good Example
```yaml
jobs:
  import-check:
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --filter='import'
```
---
## Exceptions
Prototype branches where architecture is intentionally fluid. Production branches and main branch must always be gated.
---
## Consequences Of Violation
Unauthorized imports reach production. Context boundaries are eroded. The dependency map becomes inaccurate.

---
# Rule: Use Namespace-Based Import Detection
---
## Category
Architecture
---
## Rule
Always detect import violations by matching the namespace of the imported class against the dependency map. Detect violations at the namespace level, not the class level.
---
## Reason
Classes within a bounded context share a namespace prefix (e.g., `App\Modules\Checkout`). Namespace-based detection automatically covers all classes in a context without needing to enumerate each class individually.
---
## Bad Example
```php
// Class-level detection — misses new classes in the same namespace
test('No import from Inventory')
    ->expect('App\Modules\Checkout')
    ->not->toUse('App\Modules\Inventory\Models\Product');
// Does not catch: use App\Modules\Inventory\Models\Inventory;
```
---
## Good Example
```php
// Namespace-level detection — catches all classes in the namespace
test('Checkout must not import from Inventory')
    ->expect('App\Modules\Checkout')
    ->not->toUse('App\Modules\Inventory');
// Catches any class under App\Modules\Inventory
```
---
## Exceptions
None. Namespace-level detection is the correct approach for bounded context import rules.
---
## Consequences Of Violation
Import violations are missed because new classes in a forbidden namespace are not explicitly listed in the rule.

---
# Rule: Treat The Shared Kernel As The Only Universal Allowlist
---
## Category
Architecture | Scalability
---
## Rule
Only allow all bounded contexts to import from the Shared kernel without restriction. All other cross-context imports must be explicitly declared.
---
## Reason
The Shared kernel contains common types, contracts, and utilities that every context needs. If imports from Shared are restricted, contexts will duplicate types. However, Shared must be gated — only common, non-domain-specific code belongs there.
---
## Bad Example
Each context has its own `OrderStatus` enum because no one is sure if importing from Shared is allowed. The same enum is defined in 5 places with subtle differences.
---
## Good Example
```php
// Shared kernel — allowed by all contexts
test('Shared kernel contains only common types')
    ->expect('App\Shared')
    ->toOnlyUse('App\Shared')
    ->ignoring('Illuminate\Support', 'Carbon');

// Shared must not import from any bounded context
test('Shared must not depend on bounded contexts')
    ->expect('App\Shared')
    ->not->toUse('App\Modules');
```
---
## Exceptions
None. The Shared kernel is the only universal dependency. All other cross-context imports must be explicitly allowed.
---
## Consequences Of Violation
Context-specific code leaks into Shared. Shared becomes a dumping ground. Contexts start depending on Shared types that are actually context-specific, creating hidden coupling.

---
# Rule: Maintain A Documented Dependency Map
---
## Category
Architecture | Maintainability
---
## Rule
Maintain a dependency map — a matrix of allowed imports between all bounded contexts — as a documented artifact that is both human-readable and encoded in architecture tests.
---
## Reason
Without a visible dependency map, developers guess which contexts they can import from. The map provides a quick reference for the team and serves as the source of truth for import rules.
---
## Bad Example
Import rules exist only in test files. A developer wants to know if Checkout can import from Shipping. They must search through test files or ask a teammate.
---
## Good Example
```markdown
# docs/dependency-map.md
| Context | Shared | Billing | Checkout | Inventory |
|---|---|---|---|---|
| Shared | — | ✓ | ✓ | ✓ |
| Billing | ✓ | — | ✓ | ✗ |
| Checkout | ✓ | ✓ | — | ✗ |
| Inventory | ✓ | ✗ | ✗ | — |
```
```php
// tests/Architecture/ImportRules.php
test('Checkout may only import from Shared and Billing')
    ->expect('App\Modules\Checkout')
    ->not->toUse('App\Modules\Inventory');
```
---
## Exceptions
Projects with only 2-3 contexts where the dependency rules are simple and well-known to the entire team.
---
## Consequences Of Violation
Developers introduce unauthorized imports by mistake. The team has no shared reference for allowed dependencies. Import rules drift from the actual codebase.

---
# Rule: Provide IDE Integration For Real-Time Import Violation Feedback
---
## Category
Architecture | Developer Experience
---
## Rule
Configure IDE tooling (PHPStan IDE integration or a custom plugin) to flag import violations in real time as the developer types, not just in CI.
---
## Reason
CI feedback takes minutes. IDE feedback takes milliseconds. Real-time feedback prevents violations before they are committed, reducing CI failures and rework.
---
## Bad Example
A developer commits an unauthorized import. CI fails after 3 minutes. The developer fixes the import and re-pushes. Each iteration costs minutes of CI time and context switching.
---
## Good Example
PHPStan runs in the IDE with the same custom import rules. The developer sees a red underline under the unauthorized `use` statement before they even save the file.
---
## Exceptions
Team members who do not use PHPStan-compatible IDEs. CI enforcement still catches violations for these team members.
---
## Consequences Of Violation
More CI iterations per PR. Developers spend time waiting for CI to tell them what the IDE could have shown instantly.
