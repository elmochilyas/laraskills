# Rules: COS-10 — Team-Scale Strategies (10+ Engineers)

## R01: Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping
---
## Category
Scalability
---
## Rule
Assign each team a distinct namespace root (e.g., `Billing\`, `Catalog\`, `Identity\`) with its own PSR-4 mapping in `composer.json`.
---
## Reason
A shared `App\` namespace at 10+ engineers creates merge conflicts, unclear ownership, and naming collisions. Per-team namespace roots make ownership explicit and allow independent file creation without coordination.
---
## Bad Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/"
    }
  }
}
// 15 engineers, 3 teams — all sharing App\ namespace
// Daily merge conflicts in app/Http/Controllers/
```
---
## Good Example
```json
{
  "autoload": {
    "psr-4": {
      "Billing\\": "domains/billing/src/",
      "Catalog\\": "domains/catalog/src/",
      "Identity\\": "domains/identity/src/",
      "Shared\\": "domains/shared/src/"
    }
  }
}
// Each team owns its namespace — no file conflicts across teams
```
---
## Exceptions
Cross-functional teams where each team touches multiple domains — domain boundaries may not match team structure.
---
## Consequences Of Violation
Frequent merge conflicts. Unclear file ownership. Teams step on each other's changes.
---

## R02: Ensure No Two Teams Ever Modify the Same File for Different Reasons
---
## Category
Scalability
---
## Rule
Structure the codebase so that two teams never need to edit the same file for unrelated features. If they do, split the file or assign ownership.
---
## Reason
Shared files create coordination bottlenecks — every change requires cross-team communication. The "Merged Ownership Rule" (one team per file) eliminates this bottleneck and enables independent deployment.
---
## Bad Example
```php
// routes/api.php — edited by Team Billing AND Team Catalog
// Team Billing adds route, Team Catalog adds route
// Merge conflict on every PR
```
---
## Good Example
```php
// domains/billing/routes/api.php — Team Billing only
// domains/catalog/routes/api.php — Team Catalog only
// No file conflicts across teams
```
---
## Exceptions
Shared infrastructure files (config, framework bootstrap) that change rarely and require cross-team coordination.
---
## Consequences Of Violation
Merge conflicts as a daily occurrence. Deployment blocked by dependencies on other teams.
---

## R03: Use Per-Domain Service Providers for Independent Registration
---
## Category
Scalability
---
## Rule
Each domain registers its own routes, events, commands, and service bindings through a dedicated service provider within that domain.
---
## Reason
A single `AppServiceProvider` registering everything for 3+ domains becomes a bottleneck — every team edits the same file. Per-domain providers enable independent domain lifecycle and clear ownership.
---
## Bad Example
```php
// app/Providers/AppServiceProvider.php — 300 lines of registrations
// Team A edits billing bindings, Team B edits catalog bindings
// Same file, different teams, same merge conflict
```
---
## Good Example
```php
// domains/billing/src/Providers/BillingServiceProvider.php
class BillingServiceProvider extends ServiceProvider {
    public function boot(): void {
        $this->loadRoutesFrom(__DIR__.'/../../routes/api.php');
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }
}
```
---
## Exceptions
Domains with no registrations (models-only domains may not need a provider).
---
## Consequences Of Violation
Merge conflicts on provider file. Domain cannot be registered independently.
---

## R04: Use API-First Internal Communication with Versioned Contracts
---
## Category
Architecture
---
## Rule
Define cross-domain communication through versioned service contracts (interfaces). Never allow direct database access across team boundaries.
---
## Reason
Direct database access across domains creates hidden coupling — a schema change in one domain breaks all consumers. Contracts with explicit versions make dependencies visible and provide a clear migration path for breaking changes.
---
## Bad Example
```php
// Team Billing's service queries Catalog's database directly:
DB::connection('catalog')->table('products')->where(...)
// Catalog changes its schema — Billing breaks silently
```
---
## Good Example
```php
// Contract in shared package:
interface CatalogServiceInterface {
    /** @param array<int> $productIds */
    public function getProducts(array $productIds): Collection;
}
// Billing calls via contract:
$products = $this->catalogService->getProducts($ids);
```
---
## Exceptions
Same-team domains (micro-team within a larger team) may use shared models with documented boundary.
---
## Consequences Of Violation
Hidden coupling. Schema changes in one domain cause unexpected production failures in another.
---

## R05: Establish a Stable Shared Kernel with Explicit Ownership
---
## Category
Scalability
---
## Rule
Assign explicit ownership for the shared kernel namespace. Shared code without an owner becomes unmaintained, untested, and eventually avoided.
---
## Reason
A `Shared/` namespace with no owner is a commons tragedy — everyone contributes, no one maintains. Code quality degrades, tests disappear, and teams stop using shared code because it's unreliable.
---
## Bad Example
```php
// domains/shared/src/ — 50 files, 5 contributors
// No owner — bugs stay open for months
// Teams start duplicating shared code to avoid unreliable utility
```
---
## Good Example
```php
// domains/shared/src/ — owned by Platform Team
// Platform Team reviews all PRs, maintains tests
// Teams trust shared code — it's reliable and maintained
```
---
## Exceptions
Very small teams (3-5 engineers) where shared code ownership is implicit.
---
## Consequences Of Violation
Code duplication as teams stop trusting shared code. Unmaintained shared utilities with known bugs.
---

## R06: Track Merge Conflict Budget — Investigate at 5+ Conflicts/Month
---
## Category
Scalability
---
## Rule
Track monthly merge conflicts across team boundaries. If conflicts exceed 5/month, investigate structural reorganization.
---
## Reason
Merge conflicts are a leading indicator of organizational structure mismatch. Consistent conflicts mean teams touch the same files, which means domain boundaries or file ownership is wrong.
---
## Bad Example
```php
// 12 merge conflicts this month — all in routes/web.php
// Team: "Merge conflicts are normal at this scale"
// Reality: Routes should be split per domain
```
---
## Good Example
```php
// 0-3 conflicts/month — healthy organization
// 5+ conflicts/month — investigate:
// - Which files? (routes? models? config?)
// - Which teams? (boundary issue?)
// - Reorganize to eliminate shared file edits
```
---
## Exceptions
During active cross-team refactoring sprints where elevated conflict rates are expected and temporary.
---
## Consequences Of Violation
Silent productivity erosion. Teams spend 15%+ of time resolving merge conflicts instead of delivering features.
---

## R07: Define Infrastructure Standards with Team-Specific Flexibility
---
## Category
Reliability
---
## Rule
Establish shared infrastructure standards (CI, logging, monitoring, queues) while allowing team-specific choices within those standards.
---
## Reason
Full autonomy leads to operational inconsistency — 3 teams choose 3 different queue backends. Full standardization stifles innovation. A "standards with flexibility" model gives consistency where needed and autonomy where appropriate.
---
## Bad Example
```php
// No standards:
// Team A: RabbitMQ
// Team B: SQS
// Team C: Redis
// DevOps maintains 3 queue systems — operational chaos
```
---
## Good Example
```php
// Standard: "Default queue is Redis, configurable per domain"
// Team A: Redis (default)
// Team B: SQS (explicit exception documented)
// Team C: Redis (default)
// 1 primary system, 1 documented exception
```
---
## Exceptions
No common exceptions — infrastructure inconsistency at scale creates operational incidents.
---
## Consequences Of Violation
Operational complexity. On-call engineers cannot diagnose issues across 3 different stacks. Higher incident resolution time.
---

## R08: Maintain a Team-to-Namespace Mapping Document
---
## Category
Maintainability
---
## Rule
Document which team owns which namespace root, including contact information and service contracts they expose.
---
## Reason
In a multi-team codebase, developers need to know who to contact for namespace-related questions, pull requests, and dependency issues. Without a map, they guess or create coupling unnecessarily.
---
## Bad Example
```php
// No ownership documentation
// Developer needs to change Catalog\Product — who owns it?
// Slacks #general: "Who owns the Catalog domain?" — 30 min delay
```
---
## Good Example
```markdown
// TEAM-MAP.md
// | Namespace | Team | Contact | Dependencies |
// |-----------|------|---------|--------------|
// | Billing\ | Alpha | @billing-team | Shared\ |
// | Catalog\ | Beta | @catalog-team | Shared\ |
// | Identity\ | Alpha | @identity-team | Shared\ |
```
---
## Exceptions
Single-team projects where ownership is self-evident.
---
## Consequences Of Violation
Bottleneck on knowledge holders. Delays in cross-team changes. Unclear who approves PRs for a given namespace.
