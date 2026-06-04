## Use SQLite-vec for Development Only
---
## Category
Architecture
---
## Rule
Use SQLite-vec exclusively for local development, CI testing, and prototyping; always switch to pgvector or a dedicated vector database for production.
---
## Reason
SQLite-vec lacks HNSW indexes (uses brute-force kNN), ACID guarantees for concurrent AI workloads, horizontal scaling, and production operational features. Query performance degrades quadratically with vector count — unusable above ~100K vectors for interactive use.
---
## Bad Example
```php
// config/rag.php — using SQLite-vec in production
'default' => env('VECTOR_STORE', 'sqlite-vec'),
```
---
## Good Example
```php
// config/rag.php — env-switched
'default' => env('VECTOR_STORE', 
    app()->environment('production') ? 'pgvector' : 'sqlite-vec'
),
```
---
## Exceptions
Single-user local applications (personal knowledge base, desktop app) that run entirely offline may use SQLite-vec as the permanent store.
---
## Consequences Of Violation
Brute-force search at scale causes timeouts, write contention under concurrent load, data corruption risk, production outages.

## Write Vector Search Code Against a Driver Abstraction
---
## Category
Maintainability
---
## Rule
Implement a `VectorStoreInterface` and write all vector operations against the interface; never write driver-specific code that couples to SQLite-vec or pgvector directly.
---
## Reason
The whole point of SQLite-vec is dev/prod parity — same code, different backend. If you write pgvector-specific SQL in development, SQLite-vec compatibility is lost. A driver abstraction ensures the code works with both backends without modification.
---
## Bad Example
```php
// pgvector-specific syntax — won't work with SQLite-vec
DB::select("SELECT * FROM chunks ORDER BY embedding <=> ? LIMIT 10", [$embedding]);
```
---
## Good Example
```php
// Interface-based — driver handles the syntax differences
interface VectorStoreInterface {
    public function similaritySearch(string $embedding, int $limit, float $minScore): array;
}
// Both SQLiteVecDriver and PgvectorDriver implement the same interface
```
---
## Exceptions
One-off scripts or migrations that run only on a specific backend may use driver-specific syntax if documented.
---
## Consequences Of Violation
Development code doesn't work in production, driver switching requires code changes, defeats the purpose of SQLite-vec.
