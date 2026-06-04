## Always Apply Tenant Filter on Vector Queries
---
## Category
Security
---
## Rule
Every vector query in a multi-tenant system must include a `WHERE tenant_id = ?` filter or equivalent namespace isolation; never execute a vector search without tenant-scoping.
---
## Reason
Without a tenant filter, vector search returns results from all tenants. The shared HNSW index doesn't enforce tenant boundaries — cross-tenant matches can be returned. A missing filter is the most common and critical data leakage vulnerability in RAG systems.
---
## Bad Example
```php
class DocumentSearch {
    public function search(string $query): Collection {
        $embedding = Str::toEmbeddings($query)->first();
        return DocumentChunk::query()
            ->orderByVectorSimilarTo('embedding', $embedding)
            ->limit(10)
            ->get(); // No tenant filter — cross-tenant data leakage
    }
}
```
---
## Good Example
```php
class DocumentSearch {
    public function search(string $query, int $tenantId): Collection {
        $embedding = Str::toEmbeddings($query)->first();
        return DocumentChunk::query()
            ->where('tenant_id', $tenantId)
            ->orderByVectorSimilarTo('embedding', $embedding)
            ->limit(10)
            ->get();
    }
}
```
---
## Exceptions
Public-facing search where all content is intentionally shared (documentation, knowledge base) may omit tenant filtering.
---
## Consequences Of Violation
Cross-tenant data leakage, compliance violations (GDPR, HIPAA), security incident, customer data exposure.

## Never Pass Tenant ID via LLM Arguments
---
## Category
Security
---
## Rule
Inject tenant context into tools and agents via constructor injection, never via LLM-provided arguments or prompt input.
---
## Reason
If the LLM controls the tenant ID, prompt injection can trick the agent into accessing another tenant's data. Constructor injection sets the scope at instantiation time, before the LLM has any influence. This is the fundamental security boundary for tenant isolation.
---
## Bad Example
```php
class SearchTool extends Tool {
    // Tenant ID comes from the LLM — injection target
    public function handle(int $tenantId, string $query): array { /* ... */ }
}
```
---
## Good Example
```php
class SearchTool extends Tool {
    public function __construct(private int $tenantId) {}
    // Tenant ID is fixed at construction — LLM cannot influence it
    public function handle(string $query): array {
        return DocumentChunk::where('tenant_id', $this->tenantId)
            ->whereVectorSimilarTo('embedding', Str::toEmbeddings($query)->first())
            ->limit(10)
            ->get();
    }
}
```
---
## Exceptions
None. This is a hard security rule with no reasonable exception in multi-tenant systems.
---
## Consequences Of Violation
Trivial prompt injection bypasses tenant isolation, mass data exfiltration, catastrophic security breach.

## Test Cross-Tenant Leakage with Penetration Tests
---
## Category
Security | Testing
---
## Rule
Write automated tests that attempt to search other tenants' vectors; explicitly verify that tenant isolation is enforced.
---
## Reason
Tenant isolation is the most critical security property of a multi-tenant RAG system. Proving it works requires intentional attempts to violate it. Automated penetration tests catch regressions when code changes accidentally remove filters.
---
## Bad Example
```php
// Only tests happy path within same tenant
public function test_search_returns_results(): void {
    $results = $search->search('query', tenantId: 1);
    $this->assertCount(10, $results);
}
```
---
## Good Example
```php
public function test_cross_tenant_isolation(): void {
    // Tenant 1 searches — should only return tenant 1's vectors
    $results = $search->search('query', tenantId: 1);
    foreach ($results as $result) {
        $this->assertEquals(1, $result->tenant_id, 'Cross-tenant leakage detected');
    }
}
```
---
## Exceptions
Single-tenant applications may skip these tests entirely.
---
## Consequences Of Violation
Undetected data leakage reaches production, compliance audit finds violation, legal liability.
