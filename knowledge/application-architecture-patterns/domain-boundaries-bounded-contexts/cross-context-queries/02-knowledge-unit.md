# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Cross-context queries without database JOINs
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Cross-context queries that join tables from different bounded contexts are forbidden. The patterns that replace JOINs are: application-level aggregation (call service A, call service B, combine), event-synchronized local projections (maintain a local copy of cross-context data), and CQRS read models (a third model that combines data from multiple contexts). Each pattern trades query simplicity for context independence.

---

# Core Concepts

**Forbidden:** `SELECT * FROM billing_invoices JOIN catalog_products ON ...`
**Allowed:** Service call to Billing → service call to Catalog → combine in application code.

---

# Mental Models

**The "No Shortcuts" model:** Context boundaries apply to queries too. The JOIN is faster to write but destroys context independence. The extra code is the price of decoupling.

**The "Application-Level JOIN" model:** Instead of the database joining tables, your application code joins the results. It's a for-loop, not a JOIN clause.

---

# Internal Mechanics

**Application-level aggregation:**
```php
class OrderSummaryService {
    public function __construct(
        private OrderRepository $orders,        // Own context
        private BillingService $billing,        // Cross-context via contract
        private CatalogService $catalog,        // Cross-context via contract
    ) {}

    public function getDetailedOrder(string $orderId): OrderDetailDto {
        $order = $this->orders->find($orderId);
        $payment = $this->billing->getPayment($order->paymentId);
        $product = $this->catalog->getProduct($order->productId);
        return new OrderDetailDto($order, $payment, $product);
    }
}
```

---

# Patterns

**Local projection (event-synchronized):** Each context maintains a local copy of cross-context data, updated via events. This enables local queries without cross-context calls.

**CQRS read model:** A dedicated read model that combines data from multiple contexts. The read model is maintained by event listeners and is optimized for query performance.

**Caching via event subscription:** Cross-context data is cached and invalidated via events:
```php
class ProductCacheListener {
    public function handle(ProductUpdated $event): void {
        Cache::forget("product_{$event->productId}");
    }
}
```

---

# Architectural Decisions

**Use application-level aggregation for:** Simple cross-context data needs, low query volume, and when real-time accuracy is required.

**Use local projections for:** Frequent cross-context queries, high performance requirements, and when eventual consistency is acceptable.

---

# Tradeoffs

| Pattern | Consistency | Performance | Complexity |
|---|---|---|---|
| App-level aggregation | Strong | Slower (N service calls) | Low |
| Local projection | Eventual | Fast (local query) | Medium |
| CQRS read model | Eventual | Fastest | High |

---

# Common Mistakes

**Direct JOIN anyway:** The most common violation. A single `->join('other_context_tables', ...)` in a query defeats context isolation.

**N+1 across contexts:** Service call per item in a loop: `foreach ($orders as $order) { $billing->getPayment($order->paymentId); }`. Use batch endpoints.

**Stale local projections:** A local cache that's not invalidated when source data changes. Returns stale data silently.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-05 Model ownership | MMD-10 Cross-module data access | DBC-12 Eventual consistency |
| DBC-06 Schema per context | CPC-08 CQRS pattern | DBC-11 Multi-context transactions |

---

## Performance Considerations

Identifying bounded context boundaries adds negligible performance overhead at runtime. The cost is at design time: event storming sessions, context mapping workshops, and documentation. Once boundaries are identified, the performance characteristics depend on the communication pattern between contexts. Synchronous calls between contexts add network latency if services are separated. In a modular monolith, context boundaries add no runtime cost.

---

## Production Considerations

Bounded contexts must be enforced in production through CI checks (architecture tests, import rules). Without enforcement, boundaries degrade: cross-context direct model access creeps in, shared database tables emerge, and the bounded context becomes a folder boundary in name only. Production monitoring should track cross-context call volume and latency (if using service-level boundaries). Team ownership should align with context boundaries in production incident response.

---

## Failure Modes

**Leaky context boundary:** Other contexts directly access Eloquent models or database tables owned by a different context. The boundary exists in folder structure but not in runtime enforcement.

**Wrong boundary identification:** Splitting a domain where the concepts are tightly coupled causes transaction and consistency problems. The overhead of coordinating across the boundary exceeds the benefit of separation.

**Boundary erosion over time:** As the codebase evolves, changes naturally blur context boundaries. Regular architecture reviews and automated enforcement are required to maintain integrity.

---

## Ecosystem Usage

Event Storming (Alberto Brandolini) is the most popular technique for bounded context identification. The Context Mapper DSL provides tooling for context mapping. In the Laravel ecosystem, nwidart/laravel-modules and domain-based directory organization are the primary implementation approaches. Eric Evans Domain-Driven Design (2003) remains the definitive reference. Vaughn Vernons Implementing Domain-Driven Design provides practical implementation guidance.

---

## Research Notes

Research in 2025-2026 shows continued adoption of strategic DDD patterns in Laravel. The community consensus favors starting with coarse context boundaries and splitting later over premature fine-grained separation. The bounded context heuristic (language divergence, team alignment, data lifecycle) remains the standard identification approach. Anti-Corruption Layers are increasingly recognized as essential for legacy Laravel application integration.
