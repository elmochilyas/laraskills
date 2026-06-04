# Rules: COS-03 — PSR-4 Autoloading for Custom Directories

## R01: Run `composer dump-autoload` After Every PSR-4 Mapping Change
---
## Category
Framework Usage
---
## Rule
Always run `composer dump-autoload` after modifying the `autoload` section of `composer.json`.
---
## Reason
Composer caches the autoloader configuration. New or modified PSR-4 entries are not picked up until regeneration occurs. Skipping this step produces "class not found" errors for classes in newly mapped directories.
---
## Bad Example
```json
// composer.json updated with new PSR-4 entry
// Developer forgets to run composer dump-autoload
// New domain classes throw ClassNotFoundException
```
---
## Good Example
```json
// After editing composer.json:
// $ composer dump-autoload
// Generating optimized autoload files
```
---
## Exceptions
No common exceptions — always regenerate after mapping changes.
---
## Consequences Of Violation
Intermittent "class not found" errors. CI failures. Developer confusion and wasted debugging time.
---

## R02: Never Create Overlapping PSR-4 Roots
---
## Category
Code Organization
---
## Rule
Avoid PSR-4 entries whose namespace prefixes could resolve the same class file.
---
## Reason
Two PSR-4 roots matching the same namespace cause undefined autoloading behavior — Composer may resolve to either root, making class resolution unpredictable between environments.
---
## Bad Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "App\\Domains\\": "app/Domains/"
    }
  }
}
// App\Domains\Billing\Invoice resolves to both app/Domains/Billing/Invoice.php (matching App\Domains\)
// AND app/Domains/Billing/Invoice.php via App\ prefix — overlap!
```
---
## Good Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Domains\\": "domains/"
    }
  }
}
// No overlap — App\ always under app/, Domains\ always under domains/
```
---
## Exceptions
When the overlapping prefix is explicitly intended to override (rare, requires documented rationale).
---
## Consequences Of Violation
Unpredictable class resolution. Production-only bugs that are impossible to reproduce locally.
---

## R03: Keep Namespace Case Consistent with Directory Case
---
## Category
Reliability
---
## Rule
Match namespace PascalCase exactly to directory PascalCase, including all subdirectory segments.
---
## Reason
PSR-4 is case-sensitive. Development on Windows/macOS (case-insensitive filesystems) masks mismatches that break on Linux production. `App\Services\Payment` requires `app/Services/Payment/`, not `app/services/payment/`.
---
## Bad Example
```php
// File: app/services/payment/StripeService.php
namespace App\Services\Payment;
// Works on Windows (case-insensitive), fails on Linux — directory is 'services', not 'Services'
```
---
## Good Example
```php
// File: app/Services/Payment/StripeService.php
namespace App\Services\Payment;
// Matches case exactly on all filesystems
```
---
## Exceptions
No common exceptions — case sensitivity applies universally on production Linux servers.
---
## Consequences Of Violation
Class not found errors in production only. Emergency debugging during deployment. Hotfix reverts.
---

## R04: Use `autoload-dev` for Test Infrastructure Separately
---
## Category
Code Organization
---
## Rule
Place test factories, test support classes, and test helpers under `autoload-dev` instead of `autoload` in `composer.json`.
---
## Reason
`autoload-dev` classes are excluded from the production class map. Test infrastructure in `autoload` bloats the production autoloader and may expose test-only classes to production code.
---
## Bad Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Database\\Factories\\": "database/factories/"
    }
  }
}
// Factories are production-available but should be test-only
```
---
## Good Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Database\\Factories\\": "database/factories/",
      "Database\\Seeders\\": "database/seeders/",
      "Tests\\": "tests/"
    }
  }
}
```
---
## Exceptions
Projects where database factories are used in production seeders via dedicated deployment commands.
---
## Consequences Of Violation
Unnecessary production class map size. Risk of test-only code being accidentally used in production.
---

## R05: Avoid Unnecessary Multiple PSR-4 Roots
---
## Category
Code Organization
---
## Rule
Use a single PSR-4 root (`App\` → `app/`) unless separate namespace prefixes provide clear organizational benefit.
---
## Reason
Each additional PSR-4 root increases configuration complexity. A single root with subdirectories is simpler, more predictable, and requires no special documentation for new developers.
---
## Bad Example
```json
{
  "autoload": {
    "psr-4": {
      "Controllers\\": "app/Http/Controllers/",
      "Models\\": "app/Models/",
      "Services\\": "app/Services/"
    }
  }
}
// Three roots where one root (App\ → app/) suffices
```
---
## Good Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/"
    }
  }
}
// Simple, predictable, all classes under App\ namespace
```
---
## Exceptions
Multi-tenant applications, multi-team monorepos, or domain-based structures requiring distinct namespace identities.
---
## Consequences Of Violation
Unnecessary `composer.json` complexity. Team confusion about which root to use for new files.
---

## R06: Keep Custom PSR-4 Mappings Stable After Release
---
## Category
Maintainability
---
## Rule
Do not change custom PSR-4 namespace prefixes after the first major release without a documented migration plan.
---
## Reason
Changing a namespace prefix requires updating every file's `namespace` declaration and every `use` import across the entire codebase. This is a cross-cutting change with high risk of missing references.
---
## Bad Example
```json
// v1.0: "App\\Domains\\": "app/Domains/"
// v2.0: "Domains\\": "src/Domains/"
// Every file needs: namespace App\Domains\Billing → namespace Domains\Billing
```
---
## Good Example
```json
// Choose stable prefix before v1.0
// "Domains\\": "app/Domains/"
// Never change it — add new mappings, don't modify existing ones
```
---
## Exceptions
Major architectural overhaul with dedicated migration sprint and automated refactoring tooling.
---
## Consequences Of Violation
Hundreds of file changes required. High risk of missed `use` statements causing autoload failures.
---

## R07: Document All Custom PSR-4 Mappings in Project README
---
## Category
Maintainability
---
## Rule
Document every custom PSR-4 namespace-to-directory mapping in the project README or ARCHITECTURE.md.
---
## Reason
New developers need to know which namespace prefix maps to which directory to place files correctly and to understand how imports resolve.
---
## Bad Example
```json
// composer.json has 5 custom PSR-4 entries
// No documentation explaining them
// New developer sees "Domains\Billing\Models\Invoice" — where is Domains\?
```
---
## Good Example
```markdown
// ARCHITECTURE.md:
// ## PSR-4 Autoloading
// | Namespace | Directory |
// |-----------|-----------|
// | `App\` | `app/` |
// | `Domains\` | `app/Domains/` |
// | `Modules\` | `modules/` |
```
---
## Exceptions
Projects using only the default single-root mapping (`App\` → `app/`) — this is self-documenting.
---
## Consequences Of Violation
New developers create files in wrong directories. Teams waste time explaining namespace resolution in onboarding.
---

## R08: Use `composer dump-autoload -o` in Production for Optimized Class Maps
---
## Category
Performance
---
## Rule
Always generate an optimized class map in production via `composer dump-autoload -o` or `composer install --optimize-autoloader`.
---
## Reason
Development-mode PSR-4 scans the filesystem for each class. Optimized class maps provide O(1) FQCN-to-path resolution with a static array lookup, eliminating filesystem I/O.
---
## Bad Example
```yaml
deploy:
  script:
    - composer install --no-dev
    # Missing --optimize-autoloader — class map not generated
```
---
## Good Example
```yaml
deploy:
  script:
    - composer install --no-dev --optimize-autoloader
    # Or: composer dump-autoload -o
    - php artisan optimize
```
---
## Exceptions
Development and CI environments where file changes require fresh autoloading.
---
## Consequences Of Violation
10-50ms additional autoloading overhead per class load. Cumulative performance degradation under concurrent requests.
