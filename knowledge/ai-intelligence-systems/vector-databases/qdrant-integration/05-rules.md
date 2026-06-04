## Batch Upsert Points (100-500 per Request)
---
## Category
Performance
---
## Rule
Batch Qdrant point upserts in groups of 100-500 per HTTP request; never upsert points one at a time.
---
## Reason
Individual HTTP requests for each point add massive overhead (connection setup, request serialization, TLS handshake). Batching reduces the number of HTTP calls by 100-500x, improving throughput proportionally.
---
## Bad Example
```php
foreach ($points as $point) {
    $client->upsert('collection', [$point]); // One HTTP call per point
}
```
---
## Good Example
```php
foreach (array_chunk($points, 200) as $batch) {
    $client->upsert('collection', $batch); // 200 points per HTTP call
}
```
---
## Exceptions
Real-time single-point insertion from user activity (e.g., logging a single interaction) may insert individually if batching adds unacceptable delay.
---
## Consequences Of Violation
Extremely slow ingestion (100x slower), HTTP connection churn, API rate limit exhaustion.

## Configure HNSW Index Parameters for Your Data
---
## Category
Performance
---
## Rule
Set Qdrant HNSW index parameters (`m`, `ef_construct`) explicitly based on your data dimensionality and recall requirements; never rely solely on defaults.
---
## Reason
Default HNSW parameters may not be optimal for your vector dimensionality or dataset size. For high-dimensional vectors (1536+), increasing `m` improves recall. For large datasets (>1M), `ef_construct` affects build quality. Explicit configuration ensures predictable performance.
---
## Bad Example
```php
$client->createCollection('documents', [
    'vectors' => ['size' => 1536, 'distance' => 'Cosine'],
    // HNSW parameters left at defaults
]);
```
---
## Good Example
```php
$client->createCollection('documents', [
    'vectors' => ['size' => 1536, 'distance' => 'Cosine'],
    'hnsw_config' => [
        'm' => 32,           // Higher for high-dim vectors
        'ef_construct' => 128, // Higher for better recall
    ],
]);
```
---
## Exceptions
Small datasets (<100K vectors) with low-dimensional embeddings (<512) may perform well with defaults.
---
## Consequences Of Violation
Suboptimal recall, slower queries than necessary, memory waste from oversized index.

## Use Qdrant Only When pgvector is Insufficient
---
## Category
Architecture
---
## Rule
Choose Qdrant over pgvector only when pgvector's scale limit (~50M vectors) is reached or when PostgreSQL is not part of the technology stack.
---
## Reason
Qdrant introduces a separate infrastructure service with its own operational requirements (Docker, configuration, backups, monitoring). For the vast majority of Laravel applications (95%+), pgvector on existing PostgreSQL handles the scale without additional infrastructure.
---
## Bad Example
```php
// Choosing Qdrant for a new project with existing PostgreSQL
'vector_store' => 'qdrant', // Adds unnecessary infrastructure complexity
```
---
## Good Example
```php
// pgvector first; only migrate to Qdrant when scale demands it
'vector_store' => 'pgvector',
// Re-evaluate at 10M+ vectors
```
---
## Exceptions
Projects using MongoDB (no PostgreSQL) or those expecting >50M vectors from day one may choose Qdrant initially.
---
## Consequences Of Violation
Unnecessary infrastructure overhead, additional operational burden, increased deployment complexity.
