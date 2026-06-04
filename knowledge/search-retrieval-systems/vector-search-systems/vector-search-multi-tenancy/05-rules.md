---
## Rule Name
Prefer Shared Collection with tenant_id Filter

## Category
Design

## Rule
Use a shared collection/index with tenant_id filtering for most multi-tenant vector search implementations.

## Reason
Shared + filtering balances cost and isolation for most SaaS apps. Per-tenant collections don't scale beyond hundreds of tenants.

## Bad Example
```php
// Per-tenant collection — doesn't scale
foreach ($tenants as $tenant) {
    $pinecone->createIndex("tenant-$tenant->id", ...);
}
```

## Good Example
```php
// Shared index with tenant_id namespace
$results = $pinecone->index('products')->query(
    vector: $vector,
    filter: ['tenant_id' => $tenantId],
    namespace: "tenant-$tenantId"
);
```

## Exceptions
Compliance/regulatory requirements demanding physical data separation.

## Consequences Of Violation
Excessive collection count, management overhead, and scaling limits with many tenants.

---
## Rule Name
Enforce Tenant ID Filter on Every Query

## Category
Security

## Rule
Always include the tenant_id filter on every vector search query; never run unfiltered queries in a multi-tenant environment.

## Reason
Without a tenant filter, vector search returns results from all tenants, leaking sensitive cross-tenant data.

## Bad Example
```php
// No tenant filter — returns all tenants' data
$results = Document::nearestNeighbors($vector, 10)->get();
```

## Good Example
```php
// Tenant filter always applied
$results = Document::where('tenant_id', $currentTenantId)
    ->nearestNeighbors($vector, 10)
    ->get();
```

## Exceptions
Single-tenant applications where tenant isolation isn't needed.

## Consequences Of Violation
Cross-tenant data leakage, privacy violations, and potential compliance breaches.

---
## Rule Name
Index tenant_id for Fast Pre-Filtering

## Category
Performance

## Rule
Always create an index on the tenant_id field to ensure fast pre-filtering in vector search queries.

## Reason
Without an index, tenant filtering requires scanning the entire dataset, degrading query performance significantly.

## Bad Example
```php
// No tenant_id index — slow queries
DB::statement('ALTER TABLE documents ADD COLUMN tenant_id BIGINT');
```

## Good Example
```php
DB::statement('ALTER TABLE documents ADD COLUMN tenant_id BIGINT');
DB::statement('CREATE INDEX idx_documents_tenant ON documents (tenant_id)');
```

## Exceptions
Extremely small datasets (<10K vectors per tenant) where full scan is acceptable.

## Consequences Of Violation
Tenant-filtered vector searches are slow, degrading all user-facing queries.

---
## Rule Name
Monitor Tenant Data Balance

## Category
Scalability

## Rule
Always monitor the distribution of data volume across tenants to detect unbalanced growth.

## Reason
One tenant with 10x more data than others can degrade search performance for all tenants in shared collections.

## Bad Example
```bash
# No monitoring — unaware of one tenant growing 100x
```

## Good Example
```php
$tenantSizes = DB::table('documents')
    ->select('tenant_id', DB::raw('COUNT(*) as count'))
    ->groupBy('tenant_id')
    ->orderBy('count', 'desc')
    ->get();
// Alert if any tenant exceeds 20% of total
```
## Exceptions
Applications where tenant data sizes are guaranteed uniform.

## Consequences Of Violation
Performance degradation for all tenants when one tenant dominates the data distribution.
