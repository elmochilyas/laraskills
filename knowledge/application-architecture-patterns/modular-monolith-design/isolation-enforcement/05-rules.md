# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module isolation enforcement: linting and CI rules
Knowledge Unit ID: MMD-12
Difficulty Level: Advanced
Last Updated: 2026-06-02

---
## Rule Name
Enforce module isolation from day one
---
## Category
Architecture
---
## Rule
Set up PHPStan custom rules, Pest architecture tests, and CI checks for module isolation before the second module is created. Start strict and relax if needed — introducing enforcement after violations exist is harder.
---
## Reason
It's easier to start strict and relax than to introduce enforcement later, which requires fixing existing violations. Without enforcement, module boundaries degrade within months.
---
## Bad Example
```php
// No enforcement for first 6 months
// "We'll add it when we have 3 modules"
// 6 months later: 150+ existing cross-module imports
// Adding enforcement now requires fixing all 150 violations
```
---
## Good Example
```php
// Day 1: PHPStan rule — only Contracts/ imported across modules
// Day 1: Pest test — no cross-module model usage
// Day 1: CI step — dependency graph validation
// When second module is created, enforcement is already in place
```
---
## Exceptions
Single-module applications do not need enforcement until a second module is introduced.
---
## Consequences Of Violation
Cross-module imports accumulate; enforcement introduction requires massive refactoring; team gives up on enforcement.

---
## Rule Name
Make enforcement a required (not optional) CI check
---
## Category
Reliability
---
## Rule
Module isolation enforcement must be a required CI step that blocks PR merges. If the step is allowed to fail, it will always fail and be ignored.
---
## Reason
Optional enforcement is not enforcement. When enforcement is allowed to fail, developers skip fixing violations. Within months, the entire enforcement system is ignored.
---
## Bad Example
```php
// CI step is informational — not blocking
- name: Check Module Isolation
  run: php artisan module:check-isolation
  continue-on-error: true // "We'll fix violations later"
  // Later never comes — violations grow unchecked
```
---
## Good Example
```php
// CI step is required — blocks PR merge
- name: Check Module Isolation
  run: php artisan module:check-isolation
  // Failure = PR blocked
  // Violations must be fixed before merge
```
---
## Exceptions
During the initial enforcement introduction on an existing codebase, create a baseline and only block NEW violations. The baseline must shrink over time.
---
## Consequences Of Violation
Enforcement system ignored; violations grow unchecked; module isolation is aspirational, not real.

---
## Rule Name
Baseline existing violations when introducing enforcement to legacy code
---
## Category
Maintainability
---
## Rule
When introducing enforcement to an existing codebase with existing violations, create a baseline of current issues. Only block NEW violations, and require the baseline to shrink over time.
---
## Reason
Blocking all existing violations at once makes enforcement infeasible — too many issues to fix. A baseline allows incremental improvement while preventing new violations.
---
## Bad Example
```php
// New enforcement applied to all code at once
// 200 existing violations — PRs blocked
// Team disables enforcement entirely
```
---
## Good Example
```php
// Create baseline of 200 existing violations
// New enforcement only blocks NEW violations
// Each sprint: fix 10 baseline violations
// Baseline shrinks: 200 -> 190 -> 180 -> ...
// Trend line is tracked and visible
```
---
## Exceptions
No common exceptions. Baselines are the standard approach for introducing enforcement to existing codebases.
---
## Consequences Of Violation
Enforcement rejected as too strict; team bypasses or disables it; existing violations never get fixed.

---
## Rule Name
Enforce contract-only cross-module imports
---
## Category
Code Organization
---
## Rule
Modules may only import classes from other modules' `Contracts/` namespaces. Any import from `Services/`, `Models/`, or other internal directories must be flagged by static analysis.
---
## Reason
The Contracts/ directory is the only public API of a module. Internal classes are implementation details — importing them defeats module isolation and prevents independent evolution.
---
## Bad Example
```php
// Cross-module import of internal class — should be blocked
use Modules\Billing\Services\InvoiceCalculator; // Services/ is internal
use Modules\Billing\Models\Invoice; // Models/ is internal
```
---
## Good Example
```php
// Cross-module import of contracts only — allowed
use Modules\Billing\Contracts\InvoiceContract; // Contracts/ is public API
use Modules\Billing\Contracts\DTOs\InvoiceDTO; // DTOs at contract level

// Internal classes stay within the module
// PHPStan rule: deny import from non-Contracts namespaces
```
---
## Exceptions
Shared kernel imports (Shared/\*) are allowed by all modules. Module-to-shared-kernel is not cross-module.
---
## Consequences Of Violation
Module isolation defeated; internal refactoring breaks consumers; extraction requires untangling implementation imports.

---
## Rule Name
Enforce database table ownership
---
## Category
Architecture
---
## Rule
Create PHPStan rules that detect SQL queries, Eloquent queries, or migration files referencing table prefixes owned by other modules. Flag cross-module table access as enforcement violations.
---
## Reason
Database-level coupling is the most damaging form of module coupling — it couples schema evolution, index strategies, and query patterns. Automated detection prevents this.
---
## Bad Example
```php
// Cross-module table access — should be flagged
DB::table('catalog_products')->where('id', $id)->get();
// Catalog module owns catalog_products — this query is in Inventory
```
---
## Good Example
```php
// Use service contract — no table access
$this->catalogContract->getProduct($id);
// PHPStan rule: DB::table() and Model::query() checked against table prefix registry
```
---
## Exceptions
No common exceptions. Cross-module database access is never acceptable.
---
## Consequences Of Violation
Schema coupling between modules; extraction requires rewriting queries; module boundaries are meaningless at the database level.

---
## Rule Name
Automatically detect and block circular dependencies
---
## Category
Architecture
---
## Rule
Build a CI step that reads all `module.json` files, builds the dependency graph, and fails the build if any cycles are detected. Make this a mandatory check.
---
## Reason
Circular dependencies are the primary symptom of architectural degradation. Manual detection is impossible beyond 5 modules. Automated detection is the only reliable approach.
---
## Bad Example
```php
// Circular dependency exists — nobody notices
// Billing -> Orders -> Inventory -> Billing
// All 3 modules pass code review individually
// No automated detection — cycle discovered during extraction attempt (too late)
```
---
## Good Example
```php
// CI step: module dependency check
// Reads all module.json files
// Builds adjacency matrix
// Runs topological sort
// If no valid topological ordering -> CYCLE DETECTED -> BUILD FAILED
```
---
## Exceptions
No common exceptions. Cycle detection is always required.
---
## Consequences Of Violation
Modules cannot be extracted or tested independently; architectural degradation accelerates; cycle detection becomes harder as modules proliferate.

---
## Rule Name
Whitelist exceptions explicitly with justification
---
## Category
Maintainability
---
## Rule
Allow explicit whitelisting of cross-module imports that are genuinely necessary (rare). Every whitelisted exception must include a written justification and an expiration date.
---
## Reason
Some legitimate cross-module dependencies exist (e.g., a support module extending an admin panel's UI). Without a whitelisting mechanism, enforcement becomes either impossible or too rigid.
---
## Bad Example
```php
// No whitelisting — enforcement is impossible
// Developers disable enforcement entirely to get work done
```
---
## Good Example
```php
// PHPStan whitelist with justification
// config/module-whitelist.php
return [
    'Modules\Support' => [
        'Modules\Admin\Contracts\PanelExtensionContract' => [
            'justification' => 'Support extends Admin panel UI',
            'expires_at' => '2026-12-31',
            'approved_by' => '@architect',
        ],
    ],
];
```
---
## Exceptions
No common exceptions. Every whitelisted exception is a debt that must be tracked.
---
## Consequences Of Violation
No whitelisting leads to enforcement paralysis; team bypasses enforcement; legitimate use cases blocked.

---
## Rule Name
Do not over-rely on directory structure for enforcement
---
## Category
Architecture
---
## Rule
Never assume that directory location prevents imports. Use static analysis, architecture tests, and CI checks — directory structure is not enforcement.
---
## Reason
PHP has no module system. A class in `Modules/Billing/Services/` can import a class from `Modules/Catalog/Models/` without any runtime restriction. Directory structure provides zero protection.
---
## Bad Example
```php
// Assuming directory structure prevents imports
// "Models are in Modules/Catalog/ so Billing can't use them"
// Reality: PHP allows any import from anywhere
```
---
## Good Example
```php
// Directory structure + automated enforcement
// PHPStan rule:
$neonConfig = [
    'parameters' => [
        'forbiddenImports' => [
            'from' => 'Modules\*',
            'to' => 'Modules\*\Models\*',
            'except' => 'Modules\*\Contracts\*',
        ],
    ],
];
// Directory structure is convention; PHPStan rule is enforcement
```
---
## Exceptions
No common exceptions. Directory structure is not enforcement.
---
## Consequences Of Violation
False sense of security; cross-module imports introduced without detection; module isolation is purely cosmetic.
