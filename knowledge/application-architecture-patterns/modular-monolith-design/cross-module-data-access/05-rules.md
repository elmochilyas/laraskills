# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Cross-module data access: query patterns without JOINs
Knowledge Unit ID: MMD-10
Difficulty Level: Advanced
Last Updated: 2026-06-02

---
## Rule Name
Never JOIN across module database tables
---
## Category
Architecture
---
## Rule
Never write SQL JOINs, Eloquent relationships, or raw database queries that span tables owned by different modules. Cross-module data access must go through the module's contract interface, not through the database.
---
## Reason
A JOIN between module tables creates the strongest form of coupling — it couples table structure, index strategy, query patterns, and schema evolution between modules. A schema change in Module B's table breaks Module A's query.
---
## Bad Example
```php
// Cross-module JOIN — forbidden
Invoice::query()
    ->join('catalog_products', 'invoices.product_id', '=', 'catalog_products.id')
    ->where('catalog_products.category', 'electronics')
    ->get();
// Invoice (Billing) JOINS catalog_products (Catalog) — schema coupling
```
---
## Good Example
```php
// Use service contract instead
$products = $this->catalogContract->getProductsByCategory('electronics');
$invoices = $this->billingContract->getInvoicesForProducts($products);
// Results assembled in application code, not SQL
```
---
## Exceptions
No common exceptions. Cross-module JOINs are never acceptable in a modular monolith.
---
## Consequences Of Violation
Schema evolution coupling; index strategy coupling; module extraction requires query untangling; module boundaries become meaningless.

---
## Rule Name
Never define Eloquent relationships across module boundaries
---
## Category
Architecture
---
## Rule
Do not define Eloquent relationships (`belongsTo`, `hasMany`, `belongsToMany`) on models that reference another module's table.
---
## Reason
Eloquent relationships create implicit cross-module data access that looks like a simple property access but generates database queries across module boundaries. They also couple schema structures between modules.
---
## Bad Example
```php
// Modules/Billing/Models/Invoice.php
class Invoice extends Model
{
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            \Modules\Catalog\Models\Product::class, // Cross-module relationship
            'billing_invoice_products',
        );
    }
}

// Any code: $invoice->products — implicit cross-module query
```
---
## Good Example
```php
// Modules/Billing/Models/Invoice.php
class Invoice extends Model
{
    // No cross-module relationships
    // Store product IDs as JSON or pivot within module
}

// Access products through contract
$products = $this->catalogContract->getProducts($invoice->productIds);
```
---
## Exceptions
Cross-module relationships through the shared kernel (pivot tables owned by no module) are not allowed either. Every pivot table must be owned by a module.
---
## Consequences Of Violation
Implicit cross-module queries; lazy loading N+1 problems that cross module boundaries; schema coupling between modules.

---
## Rule Name
Use service calls for real-time cross-module data
---
## Category
Architecture
---
## Rule
When a module needs current data from another module, call the providing module's service contract. This guarantees data freshness and maintains module isolation.
---
## Reason
Service calls via contracts are the only way to get real-time cross-module data without violating module boundaries. They guarantee data freshness and preserve the provider's control over its schema.
---
## Bad Example
```php
// Direct database query for real-time data
$stock = DB::table('inventory_products')
    ->whereIn('id', $productIds)
    ->pluck('stock', 'id');
// Inventory schema is now implicitly coupled to caller
```
---
## Good Example
```php
// Service call — fresh data, no coupling
interface InventoryContract
{
    /** @return array<int, int> productId => stock level */
    public function checkStock(array $productIds): array;
}

// In consumer:
$stock = $this->inventoryContract->checkStock($productIds);
```
---
## Exceptions
No common exceptions. Service calls are the only acceptable mechanism for real-time cross-module data.
---
## Consequences Of Violation
Schema coupling between modules; provider cannot evolve schema independently; extraction requires replacing direct queries with contract calls.

---
## Rule Name
Use event projections for frequent cross-module reads
---
## Category
Performance
---
## Rule
When a module frequently reads data from another module, build a local read-optimized projection (cache table or Redis) updated via the provider's events. Accept eventual consistency for performance.
---
## Reason
Calling a service contract for every read (especially in list views) creates N+1 cross-module calls. A local projection avoids this by storing denormalized data updated asynchronously via events.
---
## Bad Example
```php
// Service call on every order list item
foreach ($orders as $order) {
    // N calls to Catalog service
    $productNames[] = $this->catalogContract->getProductName($order->productId);
}
// 100 orders = 100 service calls
```
---
## Good Example
```php
// Local projection table updated via events
// Modules/Orders/database/migrations/create_product_projections_table.php
// Modules/Orders/Listeners/ProductUpdated.php — updates local copy
// Modules/Orders/Models/ProductProjection.php — local read model

// Read from local projection — no cross-module calls
$productNames = ProductProjection::whereIn('id', $productIds)
    ->pluck('name', 'id');
```
---
## Exceptions
When the data must always be real-time (cannot accept eventual consistency), use service calls but batch requests to minimize roundtrips.
---
## Consequences Of Violation
N+1 cross-module service calls create performance problems; high latency on list views; user-facing slowdowns.

---
## Rule Name
Monitor projection freshness
---
## Category
Reliability
---
## Rule
Alert when event projections are stale beyond a defined threshold. Implement monitoring that detects when the local copy has not been updated within the expected window.
---
## Reason
Stale projections cause data inconsistency bugs that are hard to diagnose. When projections don't reflect the current state, users see stale data and reports are wrong.
---
## Bad Example
```php
// No freshness monitoring
$orders = OrderProjection::all(); // Could be 5 minutes stale
// No alert — nobody knows the projection hasn't updated
```
---
## Good Example
```php
// Projection table includes updated_at from event
// Monitoring query:
SELECT COUNT(*) FROM order_projections
WHERE updated_at < NOW() - INTERVAL 5 MINUTE;

// Alert if count > 0 — projections are stale
// Queue health checks ensure event processing isn't backed up
```
---
## Exceptions
Analytical projections used for reports (not user-facing) may have longer staleness thresholds (15-30 minutes).
---
## Consequences Of Violation
Users see stale data; hard-to-diagnose inconsistency bugs; business decisions based on outdated projections.

---
## Rule Name
Enforce cross-module data access with database-level permissions
---
## Category
Security
---
## Rule
Create separate database users for each module (or use schema-level permissions) to prevent cross-module table access at the database level. The application should connect with per-module credentials.
---
## Reason
Code-level enforcement (PHPStan) is necessary but not sufficient. Database-level permissions provide defense-in-depth — even if a developer writes a cross-module query, the database rejects it.
---
## Bad Example
```php
// Single database user with access to all tables
'mysql' => [
    'database' => 'monolith',
    'username' => 'monolith_user', // Can access ALL tables
    'password' => '...',
]
// Nothing prevents cross-module queries at DB level
```
---
## Good Example
```php
// Per-module database users with restricted permissions
// billing_user: can SELECT/INSERT/UPDATE/DELETE on billing_* tables only
// catalog_user: can SELECT/INSERT/UPDATE/DELETE on catalog_* tables only

// Laravel multi-connection config
'modules' => [
    'billing' => [
        'driver' => 'mysql',
        'username' => 'billing_user',
        // ...

    ],
    'catalog' => [
        'driver' => 'mysql',
        'username' => 'catalog_user',
        // ...
    ],
]
```
---
## Exceptions
During transition periods (legacy migration, extraction), shared credentials may be temporarily tolerated. Document with a clear remediation timeline.
---
## Consequences Of Violation
Code-level enforcement is bypassable; accidental cross-module queries succeed silently; defense-in-depth is absent.

---
## Rule Name
Assemble cross-module query results in application code, not SQL
---
## Category
Architecture
---
## Rule
When data from multiple modules is needed for a single response, fetch each module's data through its contract and assemble the result in application code (orchestrator service, controller, or query object).
---
## Reason
SQL-level assembly (JOINs) couples modules at the schema level. Application-level assembly is explicit, testable, and maintains module boundaries.
---
## Bad Example
```php
// SQL assembly across modules
$results = DB::table('billing_invoices')
    ->join('catalog_products', ...)
    ->join('inventory_stock', ...)
    ->select(...)
    ->get();
// Three modules' schemas coupled in one query
```
---
## Good Example
```php
// Application-level assembly
class OrderDashboardQuery
{
    public function __construct(
        protected BillingContract $billing,
        protected CatalogContract $catalog,
        protected InventoryContract $inventory,
    ) {}

    public function get(int $orderId): DashboardDTO
    {
        $invoice = $this->billing->getInvoice($orderId);
        $products = $this->catalog->getProducts($invoice->productIds);
        $stock = $this->inventory->checkStock($invoice->productIds);

        return new DashboardDTO($invoice, $products, $stock);
    }
}
```
---
## Exceptions
No common exceptions. Application-level assembly is the only acceptable cross-module data composition pattern.
---
## Consequences Of Violation
Schema coupling; extraction requires untangling queries; SQL-level assembly not traceable in application monitoring.
