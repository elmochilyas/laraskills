## Implement HTTP Retry Logic for Pinecone Calls
---
## Category
Reliability
---
## Rule
Wrap all Pinecone HTTP API calls in retry logic with exponential backoff; never assume Pinecone calls always succeed on the first attempt.
---
## Reason
Pinecone is a fully managed SaaS service subject to transient errors: 429 rate limits, 503 service unavailability, and network timeouts. Without retry logic, transient failures cause silent search failures or timeout errors in the application.
---
## Bad Example
```php
$response = Http::withToken($apiKey)
    ->post('https://{index}.svc.pinecone.io/query', $payload);
$vectors = $response->json(); // No retry — transient failure surfaces to user
```
---
## Good Example
```php
$response = retry(3, function () use ($apiKey, $payload) {
    return Http::withToken($apiKey)
        ->timeout(10)
        ->post('https://{index}.svc.pinecone.io/query', $payload)
        ->throw();
}, 200); // 200ms delay between retries
```
---
## Exceptions
Non-critical background sync jobs may skip retry and rely on the next sync cycle.
---
## Consequences Of Violation
Transient Pinecone errors cause user-facing failures, degraded search reliability, support tickets for intermittent search issues.

## Use Namespaces for Multi-Tenant Isolation
---
## Category
Security
---
## Rule
Use Pinecone namespaces to isolate tenant vectors within a shared index; add `namespace` parameter to every query and upsert.
---
## Reason
Pinecone indexes are shared across tenants by default. Without namespaces, a query returns vectors from all tenants. Namespaces provide logical isolation within a single index, preventing cross-tenant data leakage without separate indexes per tenant.
---
## Bad Example
```php
// Query without namespace — returns all tenants' vectors
$response = Http::withToken($apiKey)
    ->post('https://{index}.svc.pinecone.io/query', [
        'vector' => $embedding,
        'topK' => 10,
    ]);
```
---
## Good Example
```php
$response = Http::withToken($apiKey)
    ->post('https://{index}.svc.pinecone.io/query', [
        'vector' => $embedding,
        'topK' => 10,
        'namespace' => "tenant_{$tenantId}",
    ]);
```
---
## Exceptions
Single-tenant applications where all vectors belong to one entity may skip namespace isolation.
---
## Consequences Of Violation
Cross-tenant data leakage in search results, compliance violations, security incident.

## Build a Custom PHP Wrapper for Testability
---
## Category
Testing
---
## Rule
Create a `PineconeService` class wrapping all Pinecone HTTP calls; inject this service (or a mock) into consumers instead of calling `Http::pinecone()` directly.
---
## Reason
Pinecone has no official PHP SDK. Direct HTTP calls scattered across the codebase are untestable without network access. A wrapper class with an interface enables dependency injection, mock-based testing, and centralized configuration and error handling.
---
## Bad Example
```php
// Direct HTTP call in controller — untestable
$response = Http::withToken($apiKey)->post('...', $payload);
```
---
## Good Example
```php
interface VectorStoreService {
    public function upsert(string $namespace, array $vectors): void;
    public function query(string $namespace, array $embedding, int $topK): array;
}

class PineconeService implements VectorStoreService { /* HTTP calls here */ }

// In tests:
$pinecone = Mockery::mock(VectorStoreService::class);
$pinecone->shouldReceive('query')->once()->andReturn([...]);
```
---
## Exceptions
Single-file scripts or one-off data migration commands may call Pinecone directly if testing is not required.
---
## Consequences Of Violation
Untestable search code, refactoring difficulty, scattered error handling, no centralized retry logic.
