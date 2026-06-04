# Rule: Document all cross-context relationships in a context map
---
## Category
Architecture
---
## Rule
Always document a context map showing relationship types between every pair of bounded contexts that interact.
---
## Reason
Undocumented relationships lead to inconsistent integration patterns. When developers don't know whether two contexts use Open Host Service, Shared Kernel, or Separate Ways, they make ad-hoc integration decisions that degrade architecture over time.
---
## Bad Example
```php
// No context map — relationships are tribal knowledge
// New developer guesses "Shared Kernel" for an integration that should be "Customer-Supplier"
```
---
## Good Example
```php
// Context map as documented structure
class ContextMap
{
    public array $relationships = [
        'Identity→Billing'   => RelationshipType::CUSTOMER_SUPPLIER,
        'Billing→Inventory'  => RelationshipType::ANTI_CORRUPTION_LAYER,
        'Billing→Reporting'  => RelationshipType::OPEN_HOST_SERVICE,
        'Catalog→Pricing'    => RelationshipType::SEPARATE_WAYS,
    ];
}
```
---
## Exceptions
Single-context applications — no relationships to map.
---
## Consequences Of Violation
Inconsistent integration patterns, hidden coupling, inability to reason about cross-context impacts.

# Rule: Prefer Open Host Service for stable upstream APIs
---
## Category
Architecture
---
## Rule
When a context provides data to multiple downstream consumers, use Open Host Service (published contract) rather than direct model access.
---
## Reason
A published API decouples upstream implementation from downstream consumers. Upstream can change its internal model as long as the published contract remains stable.
---
## Bad Example
```php
// Upstream context exposes internal Eloquent models directly
public function getOrders(): Collection
{
    return Order::where('status', 'active')->get(); // internal model leaked
}
```
---
## Good Example
```php
// Upstream publishes a clear contract via a service
interface BillingServiceInterface
{
    /** @return array<ActiveOrderDto> */
    public function getActiveOrders(): array;
}

class BillingService implements BillingServiceInterface
{
    public function getActiveOrders(): array
    {
        return Order::where('status', 'active')
            ->get()
            ->map(fn ($o) => new ActiveOrderDto(
                id: $o->id,
                total: $o->total,
                currency: $o->currency
            ))
            ->toArray();
    }
}
```
---
## Exceptions
When there is exactly one downstream consumer and the coupling risk is acceptable.
---
## Consequences Of Violation
Upstream model changes break downstream consumers; context independence is lost.

# Rule: Use Anti-Corruption Layer for integrating with divergent models
---
## Category
Architecture
---
## Rule
When integrating with a context whose domain model significantly differs from yours, use Anti-Corruption Layer (translation) rather than Conformist or direct model access.
---
## Reason
ACL protects your context's model integrity. Conformist forces your model to adopt the upstream's concepts, corrupting your domain language with foreign semantics.
---
## Bad Example
```php
// Context A directly uses Context B's model — Conformist relationship
use App\Domains\Legacy\Models\Order; // A adopts B's schema
$legacyOrder = Order::find($id);
$total = $legacyOrder->order_total_amount; // B's naming convention leaks in
```
---
## Good Example
```php
// ACL translates from B's model to A's model
class LegacyOrderTranslator
{
    public function toDomainOrder(LegacyOrder $legacy): DomainOrder
    {
        return new DomainOrder(
            id: $legacy->order_id,
            total: Money::fromCents($legacy->order_total_amount * 100),
            status: OrderStatus::fromLegacyCode($legacy->order_status_code)
        );
    }
}
```
---
## Exceptions
When the external model closely matches your context's model and changes infrequently.
---
## Consequences Of Violation
Your domain model adopts foreign semantics, making future extraction or migration harder.

# Rule: Avoid defaulting to Shared Kernel relationship
---
## Category
Architecture
---
## Rule
Do not default cross-context relationships to Shared Kernel; use Shared Kernel only when the shared code is stable, minimal, and used by three or more contexts.
---
## Reason
Shared Kernel creates tight coupling between contexts. Every item in Shared Kernel requires coordinated changes. Defaulting to Shared Kernel makes the architecture fragile and difficult to evolve.
---
## Bad Example
```php
// Defaulting two contexts to share a large kernel
class Shared
{
    // 30+ shared classes, including business logic
    public function calculateDiscount(): float { /* ... */ }
}
```
---
## Good Example
```php
// Shared Kernel is minimal and explicit
class Shared
{
    // Only stable value objects and interfaces
}
// Contexts use ACL or OHS for most cross-context communication
```
---
## Exceptions
When the shared code is extremely stable (e.g., ISO currency codes) and unlikely to change differently per context.
---
## Consequences Of Violation
Hidden coupling between contexts; coordinated deployment required; context evolution blocked.

# Rule: Default to Separate Ways when contexts implement the same concept differently
---
## Category
Architecture
---
## Rule
When two contexts naturally use the same concept with different semantics, use Separate Ways (independent implementations) instead of forcing a shared implementation.
---
## Reason
Forcing a shared implementation of a concept that differs per context creates wrong abstractions. Each context should model the concept in its own language.
---
## Bad Example
```php
// Both Billing and Shipping forced to use the same Address model
use App\Models\Address; // single shared model
// Billing needs billing-specific fields; Shipping needs shipping-specific fields
// All fields end up in one table, both contexts suffer
```
---
## Good Example
```php
// Billing has its own BillingAddress; Shipping has its own ShippingAddress
namespace App\Domains\Billing\Models;
class BillingAddress { /* billing-specific fields */ }

namespace App\Domains\Shipping\Models;
class ShippingAddress { /* shipping-specific fields */ }
```
---
## Exceptions
When the concept is genuinely identical across contexts (e.g., ISO currency codes) and unlikely to diverge.
---
## Consequences Of Violation
Bloated shared models, context coupling, inability to evolve each context's concept independently.

# Rule: Use Customer-Supplier when upstream must accommodate downstream
---
## Category
Architecture
---
## Rule
When a downstream context depends on upstream data and the upstream must accommodate downstream requirements, document the relationship as Customer-Supplier with explicit agreements.
---
## Reason
Customer-Supplier makes the dependency direction explicit. Upstream knows which downstream contexts depend on it and can plan changes without breaking consumers.
---
## Bad Example
```php
// Identity emits UserCreated event but has no record of downstream consumers
// When Identity removes "phone" field, downstream Billing breaks silently
```
---
## Good Example
```php
// Customer-Supplier documented with explicit contract
class IdentityToBillingContract
{
    public array $providedFields = ['user_id', 'email', 'created_at'];
    public array $prohibitedDependencies = ['phone', 'address'];
}
```
---
## Exceptions
When downstream can conform to upstream's model without accommodation (Conformist relationship).
---
## Consequences Of Violation
Upstream changes break downstream unexpectedly; no mechanism for negotiating contract changes.

# Rule: Keep the context map alive — update it when relationships change
---
## Category
Maintainability
---
## Rule
Treat the context map as a living document; update it whenever cross-context relationship types change.
---
## Reason
An outdated context map is worse than no map — it gives false confidence. As contexts evolve, their relationship types change (e.g., Shared Kernel may shrink, ACL may become OHS).
---
## Bad Example
```php
// Context map hasn't been updated in 2 years
// ACL was replaced by Shared Kernel, but map still shows ACL
// Team plans an integration thinking ACL exists
```
---
## Good Example
```php
// Context map is updated as part of architectural reviews
// CI check verifies context map matches actual code structure
class ContextMapVerification
{
    public function verify(): void
    {
        $map = $this->loadMap();
        $actual = $this->detectRelationships();
        $this->assertMatches($map, $actual);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Developers make decisions based on outdated information, leading to architectural drift.

# Rule: Use Partnership for coordinated, interdependent changes only
---
## Category
Architecture
---
## Rule
Use the Partnership relationship type only when two contexts require tight coordination and simultaneous changes by separate teams.
---
## Reason
Partnership implies high coordination overhead. Using it casually creates unnecessary dependencies and meeting overhead. Reserve it for genuinely co-evolving contexts.
---
## Bad Example
```php
// Partnership used for two contexts that rarely change together
// Teams are in daily sync meetings for changes that could be independent
```
---
## Good Example
```php
// Partnership only when changes are genuinely co-dependent
class BillingAndPaymentPartnership
{
    // Used only when Billing and Payment must ship changes simultaneously
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unnecessary coordination overhead for contexts that could evolve independently.

# Rule: Document the context map as code or diagram with rationale
---
## Category
Code Organization
---
## Rule
Store the context map where all developers can see it — either as a diagram in the repository or as documented code — with the rationale for each relationship type.
---
## Reason
Without recorded rationale, developers cannot understand why a particular relationship type was chosen. They may change it without understanding the tradeoffs.
---
## Bad Example
```php
// Context map exists only in someone's head or a wiki nobody reads
```
---
## Good Example
```php
// Context map as documented configuration in the codebase
class ArchitectureContextMap
{
    /**
     * Identity→Billing: Customer-Supplier
     * Rationale: Billing needs user identity data but should not own user schema.
     *
     * Billing→Reporting: Open Host Service
     * Rationale: Reporting needs read-only access to billing data.
     */
    public array $map = [];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Relationship decisions are forgotten or misunderstood, leading to inappropriate integration patterns.

# Rule: Use Conformist only when downstream accepts upstream model without translation
---
## Category
Architecture
---
## Rule
Use Conformist relationship only when the downstream context is content to adopt the upstream's domain model without any translation.
---
## Reason
Conformist creates maximum coupling — downstream's model mirrors upstream. If downstream later needs its own model, the ACL must be retrofitted. Use Conformist only when the cost of translation outweighs the coupling cost.
---
## Bad Example
```php
// Conformist used but downstream has different domain needs
class BillingOrder extends LegacyOrder // Billing forced to use Legacy's model
{
    // Billing's domain concepts don't map cleanly
}
```
---
## Good Example
```php
// Conformist acceptable when upstream model is a perfect fit
class NotificationUser extends IdentityUser
{
    // No translation needed — Notification's needs align with Identity's user model
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Downstream context's model is coupled to upstream's schema; downstream cannot evolve independently.
