# Rule: Split incrementally, never via big-bang rewrite
---
## Category
Architecture
---
## Rule
Extract bounded contexts from a monolithic model one concept at a time, never attempting a full split in a single effort.
---
## Reason
Big-bang splits break the application for weeks or months. Incremental extraction keeps the application running throughout. Each extraction is independently verifiable and reversible.
---
## Bad Example
```php
// Big-bang approach: rewrite entire model in one branch for 3 months
// Single PR: "Split monolithic model into 8 bounded contexts"
// Application broken for entire duration; massive merge conflict risk
```
---
## Good Example
```php
// Incremental extraction — one concept at a time
// Step 1 (Week 1): Extract User → Identity context
// Step 2 (Week 2): Extract Invoice → Billing context
// Each step is independently deployable and reversible
```
---
## Exceptions
When the monolithic model is small (<5 classes) and the team can complete the split in 1-2 days.
---
## Consequences Of Violation
Application broken for extended period; high risk of failure; team morale drops.

# Rule: Use parallel implementation — old and new coexist during migration
---
## Category
Architecture
---
## Rule
Build the new context alongside the old monolithic model. Both coexist until all consumers are migrated.
---
## Reason
Parallel implementation allows zero-downtime migration. Consumers can switch to the new context one by one. If something fails, they can fall back to the old code.
---
## Bad Example
```php
// Delete old code before new context is verified
// Day 1: Delete old User model
// Day 2: New Identity context has a bug
// Day 3: Can't roll back — old code is gone
```
---
## Good Example
```php
// Old model becomes a facade during migration
class User extends Model // Old model kept during migration
{
    public static function find($id): ?self
    {
        $identityUser = app(IdentityServiceInterface::class)->getUser($id);
        return $identityUser ? self::fromIdentityUser($identityUser) : null;
    }
}

// New context is built alongside
// Consumers can use either path during migration
```
---
## Exceptions
Trivial models with no active consumers can be migrated atomically.
---
## Consequences Of Violation
No rollback path; migration failure requires rebuilding old code from version control.

# Rule: Split based on concrete pain, not theoretical purity
---
## Category
Architecture
---
## Rule
Only split a monolithic model when there is measurable pain — frequent bugs, team coordination overhead, conflicting change requests.
---
## Reason
Splitting has real cost: new contracts, migration effort, testing. Doing it for "architectural purity" without concrete pain may not justify the cost.
---
## Bad Example
```php
// Splitting because "it's the right architecture"
// No measurable pain — model is cohesive, single team owns it
// Effort: 4 weeks of extraction
// Benefit: zero (no pain was being experienced)
```
---
## Good Example
```php
// Splitting because of concrete pain
// Problem: Two teams modifying the same Order model
//   - Team A changes Order status flow
//   - Team B changes Order payment logic
//   - Git conflicts weekly; production bugs from conflicting changes
// Resolution: Extract Payment into its own bounded context
```
---
## Exceptions
When the cost of delay exceeds the cost of extraction (e.g., preparing for microservice extraction required by upcoming product launch).
---
## Consequences Of Violation
Splitting effort not justified; team spends weeks on extraction with no user-visible benefit.

# Rule: Keep the old model as a facade during migration
---
## Category
Design
---
## Rule
Convert the old monolithic model into a facade that delegates to the new context(s) until all consumers are migrated.
---
## Reason
A facade keeps existing consumers working without changes. Each consumer can migrate to the new context independently, at its own pace.
---
## Bad Example
```php
// Old code removed — all consumers must change at once
class User extends Model {} // deleted
// 50 controllers now broken — must all be updated in same deployment
```
---
## Good Example
```php
// Old model becomes facade
class User extends Model
{
    private ?IdentityUser $identityUser = null;

    public function getEmailAttribute(): string
    {
        return $this->getIdentityUser()->email;
    }

    private function getIdentityUser(): IdentityUser
    {
        if (! $this->identityUser) {
            $this->identityUser = app(IdentityServiceInterface::class)
                ->getUser($this->id);
        }
        return $this->identityUser;
    }
}

// Consumer A switches to IdentityService directly
// Consumer B still uses User facade — unchanged
// When all consumers migrate, remove User facade
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
All consumers must change simultaneously; high-risk deployment with large blast radius.

# Rule: Extract the most independent concept first
---
## Category
Architecture
---
## Rule
When splitting a monolithic model, extract the concept with the fewest dependencies on other parts of the system first.
---
## Reason
Concepts with fewest dependencies are easiest to extract and validate. Early success builds confidence. The most coupled concepts benefit from the patterns established during earlier extractions.
---
## Bad Example
```php
// Start with the most coupled concept first
// Split Order first (depends on User, Product, Invoice, Payment)
// Too many dependencies to extract cleanly — extraction stalls
```
---
## Good Example
```php
// Start with the most independent concept
// 1. Extract User → Identity (fewest dependencies)
// 2. Extract Product → Catalog (depends on nothing)
// 3. Extract Payment → Billing (depends on Identity)
// 4. Extract Order → Ordering (depends on Catalog, Billing, Identity)
```
---
## Exceptions
When a more dependent concept is causing the most concrete pain and extraction cannot wait.
---
## Consequences Of Violation
First extraction is too complex; team loses confidence; entire split effort stalls.

# Rule: Treat context boundaries as hypotheses — expect to adjust
---
## Category
Architecture
---
## Rule
Approach first-attempt context boundaries as hypotheses that will be revised as understanding deepens.
---
## Reason
Perfect boundaries cannot be identified upfront. Expecting perfection prevents action and causes analysis paralysis. Better to create a reasonable boundary, learn from usage, and adjust.
---
## Bad Example
```php
// Perfectionism — months of analysis without action
// "We need to get the boundaries exactly right before we start coding"
// 3 months later: still debating boundary definitions
```
---
## Good Example
```php
// Boundaries as hypotheses
class ContextBoundaryHypothesis
{
    public function getInitialContexts(): array
    {
        return [
            'identity' => ['User', 'Role'],
            'catalog' => ['Product', 'Category'],
        ];
    }

    // Review quarterly — adjust based on pain signals
    public function reviewBoundaries(): array
    {
        return $this->adjustedContexts();
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Analysis paralysis; no action taken; monolithic model remains unsplit.

# Rule: Remove old code after all consumers are fully migrated
---
## Category
Maintainability
---
## Rule
After all consumers have migrated to the new context, delete the old monolithic model and facade code.
---
## Reason
Old code left in place becomes dead code that must be maintained. It confuses new developers and accumulates bit rot. Clean up after full migration.
---
## Bad Example
```php
// Order facade kept for 2 years after all consumers migrated
// Dead code: nobody calls it, but it's still in the codebase
// New developers waste time understanding legacy code paths
```
---
## Good Example
```php
// Step 1: All consumers migrated to new context
// Step 2: Remove old Order facade
// Step 3: Remove old migration code
// Step 4: CI verifies no remaining references to old class

// After cleanup
// Only Ordering\Order and Billing\Payment exist
// Old App\Models\Order is deleted
```
---
## Exceptions
When old code is still referenced in read-only historical data migrations.
---
## Consequences Of Violation
Dead code accumulates; maintenance overhead increases; codebase becomes confusing.

# Rule: Use Strangler Fig pattern for model extraction
---
## Category
Architecture
---
## Rule
Apply the Strangler Fig pattern to incrementally extract model responsibilities from the monolithic model into the new context.
---
## Reason
Strangler Fig allows gradual migration by intercepting specific features and routing them to the new implementation. Each feature is independently migrated, verified, and the old path is removed.
---
## Bad Example
```php
// All-or-nothing: extract entire model at once
// New Ordering context must handle all Order features from day 1
// High complexity, high risk
```
---
## Good Example
```php
// Strangler Fig — feature by feature extraction
// Phase 1: Order creation routed to new context
// Phase 2: Order status updates routed to new context
// Phase 3: Order cancellation routed to new context

class OrderController
{
    public function store(Request $request): JsonResponse
    {
        if (Feature::active('new_ordering_create')) {
            return app(NewOrderController::class)->store($request);
        }
        return app(OldOrderController::class)->store($request);
    }
}
```
---
## Exceptions
Models with trivial functionality can be extracted in a single atomic step.
---
## Consequences Of Violation
High-risk all-or-nothing migration; no incremental verify-and-rollback path.

# Rule: Coordinate schema changes during split to avoid migration conflicts
---
## Category
Reliability
---
## Rule
When splitting a model, plan the database schema migration carefully — old and new tables may coexist, requiring dual-write or migration path strategies.
---
## Reason
The split often requires data to exist in both old and new locations during migration. Without careful schema planning, data can become inconsistent between old and new tables.
---
## Bad Example
```php
// No schema migration plan — data lives in old table only
// New context reads from empty tables
// No dual-write during migration
```
---
## Good Example
```php
// Dual-write strategy during split
class UserMigrationService
{
    public function createUser(array $data): User
    {
        // Write to old table
        $oldUser = OldUser::create($data);

        // Write to new Identity table
        $newUser = IdentityUser::create([
            'old_user_id' => $oldUser->id,
            'email' => $data['email'],
            'name' => $data['name'],
        ]);

        return $oldUser;
    }
}

// After all reads confirmed working from new table:
// - Stop writes to old table
// - Run data reconciliation
// - Drop old table
```
---
## Exceptions
When old and new tables are the same (rename/migration only, no dual-write needed).
---
## Consequences Of Violation
Data inconsistency between old and new stores; silent data loss during migration.
