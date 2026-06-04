# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Multi-tenancy considerations in modular monolith
Knowledge Unit ID: MMD-14
Difficulty Level: Expert
Last Updated: 2026-06-02

---
## Rule Name
Centralize tenant resolution infrastructure, decentralize tenancy strategy per module
---
## Category
Architecture
---
## Rule
Provide a shared tenant resolution service that resolves the current tenant identity. Each module independently declares and implements its preferred tenancy isolation strategy (database-per-tenant, schema-per-tenant, or column-based).
---
## Reason
Sharing tenant resolution infrastructure avoids duplication. Decentralizing the strategy allows each module to choose the isolation level appropriate to its data sensitivity and performance requirements.
---
## Bad Example
```php
// One tenancy strategy forced on all modules
// "All modules use column-based tenancy"
// Reporting module doesn't need tenant isolation for aggregated data
// But Billing compliance requires database-per-tenant
// Single strategy fails both needs
```
---
## Good Example
```php
// Central tenant resolution (shared)
interface TenantResolver
{
    public function current(): Tenant;
}

// Per-module tenancy strategy (decentralized)
// Billing module config: "tenancy.strategy" => "database_per_tenant"
// Catalog module config: "tenancy.strategy" => "column_based"
// Reporting module config: "tenancy.strategy" => "none" (shared data)
```
---
## Exceptions
Small multi-tenant applications (under 10 tenants) may benefit from a single consistent strategy for operational simplicity.
---
## Consequences Of Violation
Overly restrictive tenancy for modules that don't need it (cost, complexity); or insufficient isolation for compliance-required modules.

---
## Rule Name
Never store tenant context on singleton services
---
## Category
Performance
---
## Rule
Do not store tenant context as state on services registered as singletons in the container. Octane persists singletons across requests, so tenant context stored on a singleton leaks to subsequent requests from different tenants.
---
## Reason
Octane reuses container instances across requests. A singleton that stores the current tenant causes Tenant A's data to be served to Tenant B's request — a cross-tenant data leak bug that is hard to diagnose.
---
## Bad Example
```php
// Singleton service storing tenant context — unsafe under Octane
class TenantContext
{
    private static ?Tenant $current = null;

    public function set(Tenant $tenant): void
    {
        self::$current = $tenant; // Persists across requests in Octane!
    }

    public function current(): Tenant
    {
        return self::$current;
    }
}
```
---
## Good Example
```php
// Tenant context passed per-request, not stored on singletons
class TenantAwareService
{
    public function process(int $tenantId, array $data): void
    {
        // Tenant ID received as parameter — no singleton storage
        $this->repository->scopeToTenant($tenantId)->save($data);
    }
}

// Or use Laravel's contextual binding for per-request resolution
```
---
## Exceptions
Traditional PHP-FPM deployments (not Octane) may use singleton-stored tenant context, but the pattern is fragile if the deployment model changes later.
---
## Consequences Of Violation
Cross-tenant data leaks under Octane; hardest-to-debug bug class in multi-tenant systems; security compliance violations.

---
## Rule Name
Pass tenant context through all cross-module contract calls
---
## Category
Architecture
---
## Rule
Require tenant context (tenant ID or Tenant DTO) as a parameter in every contract method that operates on tenant-scoped data. The callee uses this context to scope its queries.
---
## Reason
When Module A calls Module B's contract, Module B needs to know which tenant to scope data to. Without explicit tenant context, Module B cannot scope its queries, risking cross-tenant data access.
---
## Bad Example
```php
// No tenant context in contract call
interface OrderContract
{
    public function getOrders(): array; // Which tenant?!
    // Called without tenant context — cannot scope queries
}
```
---
## Good Example
```php
// Tenant context required in all contract methods
interface OrderContract
{
    public function getOrders(int $tenantId): array; // Scope to tenant
    public function createOrder(int $tenantId, CreateOrderDTO $dto): OrderDTO;
}

// Caller passes tenant context
$orders = $this->orderContract->getOrders(currentTenantId());
```
---
## Exceptions
Cross-tenant modules (audit logs, system-wide reporting) that explicitly operate outside tenant boundaries may skip tenant context in their methods. Document this.
---
## Consequences Of Violation
Cross-tenant data leaks; contract implementations cannot scope queries; security vulnerabilities.

---
## Rule Name
Test tenant isolation comprehensively
---
## Category
Testing
---
## Rule
Write automated tests that verify Tenant A cannot access Tenant B's data. Test at the contract level, repository level, and API level. Make tenant isolation failure a critical bug class.
---
## Reason
Cross-tenant data leaks are the most critical multi-tenancy bug class. Automated tests are the only reliable way to prevent them. Manual testing cannot cover all query paths.
---
## Bad Example
```php
// No tenant isolation tests
// "We trust the tenant scoping middleware"
// One missing ->where('tenant_id', ...) causes cross-tenant data leak
```
---
## Good Example
```php
test('tenant A cannot see tenant B invoices', function () {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $invoiceA = Invoice::factory()->for($tenantA)->create();
    $invoiceB = Invoice::factory()->for($tenantB)->create();

    // Authenticate as tenant A
    $this->actingAsTenant($tenantA);

    // Request tenant B's invoice
    $response = $this->get("/api/invoices/{$invoiceB->id}");

    // Should fail — tenant A cannot access tenant B's data
    $response->assertStatus(404);
});
```
---
## Exceptions
No common exceptions. Tenant isolation tests are mandatory for multi-tenant systems.
---
## Consequences Of Violation
Cross-tenant data leaks in production; security and compliance violations (GDPR, SOC2); catastrophic trust loss.

---
## Rule Name
Declare tenancy strategy per module explicitly
---
## Category
Architecture
---
## Rule
Each module must declare its tenancy strategy in its configuration: `database_per_tenant`, `schema_per_tenant`, `column_based`, or `none`. Document the rationale for the choice.
---
## Reason
Explicit strategy declaration makes tenancy behavior predictable and auditable. Without it, developers must read the module's code to understand how tenant isolation works.
---
## Bad Example
```php
// No explicit tenancy strategy
// Developers must grep for ->where('tenant_id') to guess the strategy
```
---
## Good Example
```php
// Modules/Billing/config/config.php
return [
    'tenancy' => [
        'strategy' => 'database_per_tenant',
        'rationale' => 'PCI compliance requires full database isolation for billing data',
    ],
];

// Modules/Catalog/config/config.php
return [
    'tenancy' => [
        'strategy' => 'column_based',
        'rationale' => 'Catalog data is not sensitive; column scoping is sufficient',
    ],
];
```
---
## Exceptions
Single-tenant modules that genuinely store no tenant-specific data may declare `strategy => 'none'`.
---
## Consequences Of Violation
Tenancy behavior is discoverable only through code reading; incorrect assumptions about isolation level; compliance gaps.

---
## Rule Name
Include tenant scoping in all query paths
---
## Category
Security
---
## Rule
Every database query in a tenant-scoped module must include a WHERE clause scoping to the current tenant. Use global scopes, repository patterns, or explicit scoping — but never omit tenant filtering.
---
## Reason
A single query without tenant scoping leaks all tenants' data. The most common multi-tenancy vulnerability is a new query added without tenant scoping.
---
## Bad Example
```php
// No tenant scoping — leaks all tenants' data
class InvoiceController
{
    public function index(): JsonResponse
    {
        return Invoice::all(); // Returns invoices for ALL tenants!
    }
}
```
---
## Good Example
```php
// Multiple enforcement layers

// 1. Global scope (automatic)
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('tenant_id', tenantId());
    }
}

// 2. Repository pattern (explicit)
class InvoiceRepository
{
    public function getAll(int $tenantId): Collection
    {
        return Invoice::where('tenant_id', $tenantId)->get();
    }
}

// 3. Architectural test (enforcement)
test('all queries include tenant scoping')
    ->assertEachQueryHasTenantScope();
```
---
## Exceptions
Cross-tenant queries (audit logs, administrative reports) should explicitly bypass tenant scoping and be reviewed separately.
---
## Consequences Of Violation
Cross-tenant data leaks; compliance violations; catastrophic security incident.

---
## Rule Name
Index tenant columns properly for performance
---
## Category
Performance
---
## Rule
Always index the `tenant_id` column (or equivalent) in column-based tenancy tables. For large tables, consider partitioning by tenant ID.
---
## Reason
Every query in a column-based tenancy module filters by `tenant_id`. Without an index, queries perform full table scans. As tenant count and data volume grow, this becomes a performance disaster.
---
## Bad Example
```php
Schema::create('orders_orders', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    // No index on tenant_id — full table scans on every query
});
```
---
## Good Example
```php
Schema::create('orders_orders', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->index('tenant_id'); // Essential for tenant-scoped queries

    // For very large tables:
    // $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    // Consider composite indexes for common query patterns:
    // $table->index(['tenant_id', 'created_at']);
});
```
---
## Exceptions
Very small tables (<1,000 rows per tenant) may not benefit significantly from the index, but the index should still exist for correctness.
---
## Consequences Of Violation
Performance degradation as data grows; slow queries under multi-tenant workloads; database CPU saturation.
