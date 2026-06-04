---
## Rule Name
Use Raw SQL for pgvector Queries in Laravel

## Category
Framework Usage

## Rule
Use raw SQL (DB::select or Eloquent scopes) for pgvector queries since Scout does not natively support vector search operators.

## Reason
Scout's search() method does not support vector distance operators. Raw SQL is the only reliable integration path.

## Bad Example
```php
// Scout doesn't support vector search — will fail
Product::search($query)->get();
```

## Good Example
```php
// Raw SQL in Eloquent scope
public function scopeNearestNeighbors($query, array $vector, int $limit = 10)
{
    $vector = json_encode($vector);
    return $query->selectRaw("*, embedding <=> '$vector' AS distance")
        ->orderByRaw("embedding <=> '$vector'")
        ->limit($limit);
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Broken search implementation if Scout-specific vector features are assumed to work.

---
## Rule Name
Add ANN Index for Production

## Category
Performance

## Rule
Always create an ANN index (HNSW preferred) on vector columns before serving production traffic.

## Reason
Without an ANN index, vector search performs a full sequential scan, which becomes prohibitively slow as the dataset grows past 10K records.

## Bad Example
```php
// No index — O(n) scan on every query
$results = Document::nearestNeighbors($vector, 10)->get();
```

## Good Example
```sql
-- Migration: add HNSW index
DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)');
```

## Exceptions
Datasets under 10K records where sequential scan latency is acceptable.

## Consequences Of Violation
Unacceptably slow search queries leading to timeouts and poor UX.

---
## Rule Name
Enable pgvector Extension via Migration

## Category
Framework Usage

## Rule
Always enable the pgvector extension through a Laravel migration with `CREATE EXTENSION IF NOT EXISTS vector`.

## Reason
Migration-based extension creation is version-controlled and repeatable across environments.

## Bad Example
```sql
-- Manual SQL execution on each environment
CREATE EXTENSION vector;
```

## Good Example
```php
public function up()
{
    DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
}
```

## Exceptions
Managed PostgreSQL providers (Supabase, RDS) with pre-installed extensions.

## Consequences Of Violation
Extension missing in some environments, causing query failures on deployment.

---
## Rule Name
Mix Scout for Keyword and Raw SQL for Vector

## Category
Architecture

## Rule
Use Scout for keyword/full-text search and raw SQL for vector similarity when both are needed.

## Reason
Scout excels at keyword search with where clauses and pagination. Vector search requires pgvector operators that Scout doesn't support.

## Bad Example
```php
// Trying to force vector search through Scout
Product::search($query)->vectorSearch($vector)->get();
// Doesn't exist
```

## Good Example
```php
// Scout for keyword
$keywordResults = Product::search($query)->take(100)->keys();
// Raw SQL for vector
$vectorResults = Document::nearestNeighbors($vector, 100)->pluck('id');
// Fuse with RRF
$fused = rrfFusion($keywordResults, $vectorResults);
```

## Exceptions
Applications using only vector search or only keyword search.

## Consequences Of Violation
Forcing one tool for both tasks leads to incomplete or broken implementation.
