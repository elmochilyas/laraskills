## Install the Vector Extension Before Migrations
---
## Category
Framework Usage
---
## Rule
Run `CREATE EXTENSION vector;` before running any migration that defines vector columns; verify the extension is installed in the migration's `up()` method.
---
## Reason
Migration commands that use `$table->vector('embedding', 1536)` fail if the `vector` extension is not loaded. PostgreSQL returns an error because the `vector` type doesn't exist. Checking extension existence in the migration provides a clear failure message.
---
## Bad Example
```php
// Migration fails with cryptic error if extension not installed
Schema::create('document_chunks', function (Blueprint $table) {
    $table->vector('embedding', 1536);
});
```
---
## Good Example
```php
public function up(): void {
    DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
    Schema::create('document_chunks', function (Blueprint $table) {
        $table->vector('embedding', 1536);
    });
}
```
---
## Exceptions
Managed PostgreSQL services (Supabase, RDS) may have pgvector pre-installed; confirm before adding the statement.
---
## Consequences Of Violation
Migration failures during deployment, blocked deployments, developer confusion.

## Build HNSW Index After Bulk Data Load
---
## Category
Performance
---
## Rule
Drop the HNSW index before bulk loading vectors, then rebuild it after the load completes; never update the index incrementally during bulk ingestion.
---
## Reason
HNSW index build time scales with the number of incremental updates. Dropping the index, bulk-loading all data, and rebuilding once is significantly faster (hours vs. tens of hours) and produces a better-quality index.
---
## Bad Example
```php
// Index maintained incrementally during bulk load — very slow
Chunk::insert($batch); // Index updated on every insert
```
---
## Good Example
```php
DB::statement('DROP INDEX IF EXISTS chunks_embedding_idx');
Chunk::insert($batch1);
Chunk::insert($batch2);
// ... all batches loaded
DB::statement('CREATE INDEX chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops)');
```
---
## Exceptions
Continuous ingestion pipelines (new documents arriving throughout the day) must maintain the index incrementally; schedule periodic rebuild during low-traffic windows.
---
## Consequences Of Violation
Extremely slow bulk ingestion, index fragmentation, prolonged deployment times.

## Specify Embedding Dimensions in Migration
---
## Category
Framework Usage | Maintainability
---
## Rule
Always specify the dimensions parameter when defining a vector column; never omit it.
---
## Reason
Different embedding models produce different vector dimensions (768, 1024, 1536, 3076). Without explicit dimensions, you cannot verify that stored embeddings match the intended model. Dimension mismatch produces silent errors or crashes.
---
## Bad Example
```php
Schema::create('documents', function (Blueprint $table) {
    $table->vector('embedding'); // Dimensions unspecified
});
```
---
## Good Example
```php
Schema::create('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536); // Matches OpenAI text-embedding-3-small
});
```
---
## Exceptions
None. Always specify dimensions to ensure model consistency.
---
## Consequences Of Violation
Silent dimension mismatch, inability to store vectors from specified model, runtime errors.
