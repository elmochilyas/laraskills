# Rule: Always pair Strangler Fig with an Anti-Corruption Layer
---
## Category
Architecture
---
## Rule
When using Strangler Fig to replace legacy functionality, always pair it with an Anti-Corruption Layer to translate between legacy and new domain models.
---
## Reason
Strangler Fig alone replaces functionality but passes legacy data structures through. Without ACL, the new system inherits the legacy model's problems — wrong terminology, bad schema design, and awkward concepts.
---
## Bad Example
```php
// Strangler Fig without ACL — passes legacy data structures
class OrderController
{
    public function store(Request $request): JsonResponse
    {
        if (Feature::active('new_ordering')) {
            return app(NewOrderController::class)->store($request);
            // New system receives legacy-formatted data
        }
        return app(LegacyOrderController::class)->store($request);
    }
}
```
---
## Good Example
```php
// Strangler Fig with ACL
class OrderController
{
    public function __construct(
        private LegacyToNewOrderTranslator $translator
    ) {}

    public function store(Request $request): JsonResponse
    {
        if (Feature::active('new_ordering')) {
            $newOrderData = $this->translator->toNewOrder($request->all());
            return app(NewOrderController::class)->store($newOrderData);
        }
        return app(LegacyOrderController::class)->store($request->all());
    }
}
```
---
## Exceptions
When legacy data structures already match the new domain model perfectly (rare).
---
## Consequences Of Violation
New system inherits legacy model problems; legacy schema thinking persists.

# Rule: Use feature-flag based routing for Strangler Fig migration
---
## Category
Architecture
---
## Rule
Route traffic between legacy and new systems using feature flags, enabling per-feature, incremental migration with rollback capability.
---
## Reason
Feature flags allow granular control over which features go to the new system. Each feature can be independently tested, verified, and rolled back if issues arise.
---
## Bad Example
```php
// All-or-nothing routing — no rollback
if (app()->environment('production')) {
    return app(NewController::class)->handle($request);
}
```
---
## Good Example
```php
// Feature-flag based routing
class OrderController
{
    public function store(Request $request): JsonResponse
    {
        if (Feature::active('new_order_creation') && $this->isEligible($request)) {
            try {
                return app(NewOrderController::class)->store($request);
            } catch (NewSystemException $e) {
                Log::warning('New order system failed, falling back to legacy');
                return app(LegacyOrderController::class)->store($request);
            }
        }
        return app(LegacyOrderController::class)->store($request);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Cannot roll back individual features; migration failures affect all users.

# Rule: Implement write-through and read-through during migration
---
## Category
Reliability
---
## Rule
During legacy migration, write data to both systems (legacy + new) and read from the new system, verifying correctness without user-facing impact.
---
## Reason
Write-through ensures data is available in the new system before reads are switched. Any discrepancies can be detected and fixed before users notice.
---
## Bad Example
```php
// Cut over without data validation
// Writes go to new system only
// If new system has bugs, all new data is corrupt
```
---
## Good Example
```php
// Write-through during migration
class DualWriteOrderService
{
    public function __construct(
        private LegacyOrderService $legacy,
        private NewOrderService $new,
        private OrderReconciliationService $reconciler
    ) {}

    public function createOrder(array $data): OrderResult
    {
        $legacyResult = $this->legacy->createOrder($data);
        $newResult = $this->new->createOrder($data);
        $this->reconciler->verify($legacyResult, $newResult);
        return $newResult;
    }
}
```
---
## Exceptions
When the legacy system is read-only and cannot accept writes.
---
## Consequences Of Violation
Data inconsistency between systems; potential data loss if new system fails.

# Rule: Never attempt a full legacy system rewrite
---
## Category
Architecture
---
## Rule
Do not attempt to replace an entire legacy system in a single rewrite effort.
---
## Reason
Full rewrites have a high failure rate. The legacy system embodies years of bug fixes and edge case handling. A rewrite inevitably misses many of these, resulting in a system that is worse than the original.
---
## Bad Example
```php
// Full rewrite attempt
// "We'll rewrite the entire legacy system in 6 months"
// 6 months later: over budget, missing features, buggy
```
---
## Good Example
```php
// Incremental Strangler Fig — feature by feature
// Month 1-2: Replace order creation
// Month 3-4: Replace order status updates
// Month 5-6: Replace order cancellation
// Month 7: Decommission legacy system
```
---
## Exceptions
When the legacy system is very small (<10 pages, <5 endpoints) and the domain is well-understood.
---
## Consequences Of Violation
High risk of failure; budget overruns; team burnout; legacy system remains indefinitely.

# Rule: Ensure the ACL translates both directions
---
## Category
Design
---
## Rule
When the new context sends data back to the legacy system, implement bidirectional translation in the ACL.
---
## Reason
Single-direction ACL protects reads but not writes. If the new context creates data that must be stored in the legacy system, outbound translation is required to maintain model integrity.
---
## Bad Example
```php
// Only inbound translation
class LegacyOrderTranslator
{
    public function toNewOrder(array $legacyData): NewOrder { /* ... */ }
    // No toLegacy method
}
```
---
## Good Example
```php
// Bidirectional ACL
class LegacyOrderTranslator
{
    public function toNewOrder(array $legacyData): NewOrder { /* inbound */ }
    public function toLegacyFormat(NewOrder $order): array { /* outbound */ }
}
```
---
## Exceptions
Read-only legacy systems where the new context never writes back.
---
## Consequences Of Violation
Writes bypass model integrity; legacy system receives unconverted data.

# Rule: Build the ACL in the new context's boundary
---
## Category
Architecture
---
## Rule
Place the Anti-Corruption Layer within the new context's codebase, not in the legacy system.
---
## Reason
The new context must protect its own model integrity. Placing ACL in the legacy system would require modifying the legacy system, which is often impossible or risky.
---
## Bad Example
```php
// ACL placed in legacy system — requires modifying legacy
class LegacySystem
{
    public function getDataInNewFormat(): array { /* translation in legacy */ }
}
```
---
## Good Example
```php
// ACL lives in the new context
namespace App\Domains\Billing\AntiCorruption;

class LegacyOrderAdapter implements OrderProvider
{
    public function __construct(
        private LegacyApiClient $client,
        private LegacyOrderTranslator $translator
    ) {}

    public function getOrder(int $id): Order
    {
        $legacyData = $this->client->call('GetOrder', ['OrderID' => $id]);
        return $this->translator->toNewOrder($legacyData);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Legacy system must be modified; risk of breaking existing functionality.

# Rule: Never import legacy system classes directly into the new context
---
## Category
Code Organization
---
## Rule
Enforce that no legacy system class, model, or DTO is imported directly in the new context's domain layer — all interaction goes through the ACL.
---
## Reason
Direct legacy imports create implicit coupling. Changes to the legacy system's API break the new context immediately, defeating the purpose of the Strangler Fig migration.
---
## Bad Example
```php
// Direct import of legacy classes in new context
use LegacyApp\Models\Order; // BAD
class NewOrderService
{
    public function process(int $orderId): void
    {
        $order = Order::find($orderId); // coupled to legacy schema
    }
}
```
---
## Good Example
```php
// Only ACL touches legacy classes
namespace App\Domains\Billing\AntiCorruption;
use LegacyApp\Models\LegacyOrder; // allowed only in ACL

class LegacyOrderAdapter implements OrderProvider
{
    public function getOrder(int $id): Order
    {
        $legacyOrder = LegacyOrder::find($id);
        return $this->translator->toNewOrder($legacyOrder->toArray());
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
New context coupled to legacy schema; replacing legacy system requires changing every consumer.

# Rule: Include compensating rollback logic in the migration plan
---
## Category
Reliability
---
## Rule
Always include a rollback plan for each migration step. If the new system fails, traffic can be routed back to the legacy system.
---
## Reason
Without a rollback plan, a failed migration blocks all feature delivery. Users are stuck on a broken system until the issue is fixed.
---
## Bad Example
```php
// No rollback — once migrated, cannot go back
// New system has a critical bug
// Cannot revert because legacy tables were dropped
```
---
## Good Example
```php
// Rollback plan built into migration
class OrderMigrationStep
{
    public function migrate(): void
    {
        Feature::enableForPercentage('new_order_creation', 1);
        $errorRate = $this->monitor->getErrorRate('new_order_creation');

        if ($errorRate > 0.01) {
            $this->rollback();
            return;
        }
        Feature::enableForPercentage('new_order_creation', 25);
    }

    public function rollback(): void
    {
        Feature::disable('new_order_creation');
        $this->reconciler->fixDiscrepancies();
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Failed migration with no recovery path; users stuck on broken system.

# Rule: Monitor the migration process with key metrics
---
## Category
Reliability
---
## Rule
Monitor key metrics during legacy migration: error rate in new system, data consistency checks, latency comparison, and user impact.
---
## Reason
Without monitoring, migration issues are only discovered when users report problems. Active monitoring enables early detection and rollback before widespread impact.
---
## Bad Example
```php
// No migration monitoring
// Migration completed on Friday
// Monday: hundreds of support tickets about missing orders
// Migration had been silently corrupting data for 3 days
```
---
## Good Example
```php
// Migration monitoring
class MigrationMonitor
{
    public function check(): MigrationHealth
    {
        return new MigrationHealth(
            newSystemErrorRate: $this->metrics->getErrorRate('new_orders'),
            legacyComparison: $this->reconciler->compareLast1000Orders(),
            latencyP95: $this->metrics->getLatencyP95('new_orders'),
            rollbackReady: $this->rollbackPlan->isReady(),
        );
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent data corruption; extended user-facing issues; delayed incident response.
