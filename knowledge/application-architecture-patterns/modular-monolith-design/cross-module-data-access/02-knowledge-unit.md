# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Cross-module data access: query patterns without JOINs
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

In a modular monolith, cross-module data access via SQL JOINs is forbidden. Module A cannot directly query Module B's database tables. Instead, Module A must obtain Module B's data through Module B's service interface (synchronous) or by subscribing to Module B's events (asynchronous, cached data). This constraint is fundamental to module isolation—direct database access across modules creates tighter coupling than code imports because it's harder to detect, refactor, and extract.

---

# Core Concepts

**Forbidden pattern:** `Order::join('inventory_products', ...)` — Order module querying the Inventory module's tables.

**Allowed patterns:**
- Service call: `$this->inventory->checkStock($productIds)` — Inventory service returns stock data.
- Event subscription: Module B caches data from Module A's events for local querying.
- Data duplication: Module B maintains its own copy of Module A's relevant data.

---

# Mental Models

**The "Internal API Only" model:** Every module is accessed through its contracts, never through its database. If the data isn't available through the contract API, either add a new contract method or rethink the architecture.

**The "Data as Implementation Detail" model:** A module's database schema is a private implementation detail. It can change without notice. Other modules that query it directly are dependent on a private detail.

**The "Join as Coupling" model:** A JOIN between module tables is the strongest form of coupling. It couples table structure, index strategy, and schema evolution across modules.

---

# Internal Mechanics

**Pattern 1: Aggregated service query**
```php
// Catalog module aggregates data via contract call
class ProductController {
    public function __construct(
        private PricingService $pricing,  // Contract
    ) {}
    public function show(Product $product): array {
        $price = $this->pricing->getPrice($product->id);
        return ['product' => $product, 'price' => $price];
    }
}
```

**Pattern 2: Cached event data**
```php
// Catalog module maintains cached stock data
class InventoryListener {
    public function handle(StockUpdated $event): void {
        Cache::put("stock_{$event->productId}", $event->newLevel, 3600);
    }
}
```

**Pattern 3: Materialized view** (database-level denormalization maintained by events)
```php
// When Billing creates an invoice, Payment creates a local payment snapshot
class PaymentProjector {
    public function onInvoiceCreated(InvoiceCreated $event): void {
        PaymentSummary::create([
            'invoice_id' => $event->invoiceId,
            'total' => $event->total,
            'status' => 'pending',
        ]);
    }
}
```

---

# Patterns

**CQRS as cross-module pattern:** Module A owns writes. Module B maintains a read-optimized copy of Module A's data, updated via events.

**Data duplication via projectors:** Modules maintain local projections of cross-module data. This is acceptable because the projection is eventually consistent and module-owned.

**Aggregate queries via domain services:** Cross-module queries go through a domain service that coordinates calls to multiple module contracts. The result is assembled in application code, not in SQL.

---

# Architectural Decisions

**Use service calls when:** Data must be current (real-time). The consumer waits for the provider to respond.

**Use cached event data when:** Stale data is acceptable (eventual consistency). The consumer reads from cache that's updated by events.

**Use local projection when:** A module needs frequent access to another module's data. Maintaining a local copy avoids repeated contract calls.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| True module isolation | No cross-module JOINs means application-level assembly | More application code, less SQL |
| Independent schema evolution | Data duplication across modules | Each module's copy may drift |
| Extraction readiness preserved | Performance overhead of application-level joins | N+1 across module boundaries |
| Schema changes don't break other modules | Learning curve for team | Must unlearn "just add a JOIN" habit |

---

# Performance Considerations

Application-level assembly (calling multiple services and combining results) is slower than a single SQL JOIN. The difference is typically 5-50ms per operation. For read-heavy UIs that need real-time cross-module data, consider local projections updated via events.

---

# Production Considerations

Monitor cross-module service call latency. High latency suggests a local projection is needed. Monitor projection freshness—stale projections cause data inconsistencies.

---

# Common Mistakes

**Direct JOINs:** The most common violation. A single `->join('other_module_tables', ...)` in a query defeats module isolation.

**Shared database user:** When all modules connect with the same database user that has access to all tables, nothing prevents cross-module queries.

**Data through Eloquent relationships:** Defining a `belongsTo` relationship on a model that references another module's table. This creates implicit cross-module data access.

---

# Failure Modes

**Inconsistent projections:** Module B's local copy of Module A's data becomes stale because events weren't processed. This causes data inconsistency bugs that are hard to diagnose.

**Cross-module N+1:** Service A calls Service B for each item in a list. This creates N+1 query behavior at the application level. Mitigate with batch endpoints or local projections.

---

# Ecosystem Usage

The `Modulate` package includes `modulate:lint` that detects cross-module Eloquent queries. PHPStan rules can flag JOINs referencing tables owned by other modules.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-06 Sync inter-module comm | MMD-07 Async inter-module comm | DBC-07 Cross-context queries |
| MMD-08 Shared kernel | CPC-08 CQRS pattern | DBC-12 Eventual consistency |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
