---
## Rule Name
Start with Raw SQL for pgvector Integration

## Category
Framework Usage

## Rule
Use raw SQL with Eloquent scopes for pgvector queries before adopting community packages.

## Reason
Raw SQL has zero external dependencies, full control, and no version compatibility risk. Community packages can be adopted when the interface proves stable.

## Bad Example
```php
// Adding community package dependency before proving need
composer require pgvector/pgvector-php
```

## Good Example
```php
// Start with raw SQL in Eloquent scope
public function scopeNearestNeighbors($query, array $vector, int $limit = 10)
{
    $vector = json_encode($vector);
    return $query->selectRaw("*, embedding <=> '$vector' AS distance")
        ->orderByRaw("embedding <=> '$vector'")
        ->limit($limit);
}
```

## Exceptions
Teams already familiar with the community package and its API stability.

## Consequences Of Violation
Unnecessary dependency risk, version conflicts, and reduced flexibility for future changes.

---
## Rule Name
Encapsulate Vector Queries in Eloquent Scopes

## Category
Code Organization

## Rule
Always encapsulate pgvector similarity queries in Eloquent local scopes for reusability and clean code.

## Reason
Raw SQL scattered across controllers is untestable and unreusable. Scopes keep vector logic within the model.

## Bad Example
```php
// Raw SQL in controller
$results = DB::select("SELECT *, embedding <=> ? AS distance FROM documents ORDER BY embedding <=> ? LIMIT 10", [$vec, $vec]);
```

## Good Example
```php
// Reusable scope on model
$results = Document::nearestNeighbors($queryEmbedding, 10)->get();
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Code duplication, difficult testing, and scattered query logic across the codebase.

---
## Rule Name
Create ANN Index for Production Vector Search

## Category
Performance

## Rule
Always create an ANN index (HNSW or IVFFlat) on vector columns for datasets exceeding 10K records.

## Reason
Without an ANN index, vector search performs a full sequential scan — O(n) per query. Indexes enable sub-100ms queries on millions of vectors.

## Bad Example
```sql
-- No index — O(n) scan on every query
SELECT id, embedding <=> '[0.1, 0.2, ...]' AS distance FROM items ORDER BY distance LIMIT 10;
```

## Good Example
```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

## Exceptions
Datasets under 10K records where sequential scan latency is acceptable.

## Consequences Of Violation
Unacceptably slow search queries as dataset grows, leading to timeout errors and poor UX.

---
## Rule Name
Benchmark Performance Impact on Transactional Queries

## Category
Performance

## Rule
Always benchmark the performance impact of pgvector queries on concurrent transactional operations before production.

## Reason
pgvector shares PostgreSQL resources with OLTP queries. Vector search can degrade insert/update performance on the primary database.

## Bad Example
```bash
# Deploying vector search on primary DB without benchmarking
# Production outage from resource contention
```

## Good Example
```bash
# Benchmark with production load:
# - Measure insert latency with and without vector queries
# - Consider read-replica for vector search
```

## Exceptions
Applications running pgvector on dedicated read replicas.

## Consequences Of Violation
Degraded application performance, increased database latency for writes, and potential cascading failures.

---
## Rule Name
Add Vector Column via Migration

## Category
Framework Usage

## Rule
Always add vector columns through Laravel migrations using `$table->vector()` for trackable schema changes.

## Reason
Migrations provide version-controlled, reversible schema changes. Direct SQL execution bypasses deployment tracking and rollback capability.

## Bad Example
```sql
-- Raw SQL executed directly in production
ALTER TABLE documents ADD COLUMN embedding vector(1536);
```

## Good Example
```php
Schema::table('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536);
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Untracked schema changes, inability to roll back, and deployment drift between environments.
