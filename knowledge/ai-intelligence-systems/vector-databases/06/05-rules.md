## Abstract Provider-Specific Code Behind an Interface

---
## Category
Architecture | Maintainability

---
## Rule
Implement all vector database operations behind a provider-agnostic `VectorStore` interface; never expose provider-specific SDK types or APIs in application code.

---
## Reason
Provider-specific code scattered through the application makes migration expensive and risky. An abstraction layer allows switching providers (pgvector → Qdrant → Pinecone) by changing a single adapter implementation.

---
## Bad Example
```php
class SearchService {
    public function search(array $vector): array {
        return Pinecone::query($vector)->topK(10)->get();
        // Tightly coupled to Pinecone SDK
    }
}
```

---
## Good Example
```php
interface VectorStore {
    public function search(VectorQuery $query): SearchResult;
    public function insert(string $collection, array $vectors, array $metadata = []): void;
    public function delete(string $collection, array $ids): void;
}

class PineconeAdapter implements VectorStore { /* ... */ }
class QdrantAdapter implements VectorStore { /* ... */ }
class PgVectorAdapter implements VectorStore { /* ... */ }

class SearchService {
    public function __construct(private VectorStore $store) {} // Provider-agnostic
}
```

---
## Exceptions
Single-provider applications never expected to switch may use the provider SDK directly for simplicity.

---
## Consequences Of Violation
Provider lock-in, expensive migration, codebase coupled to vendor-specific APIs.

---

## Evaluate Providers with Your Data

---
## Category
Decision | Reliability

---
## Rule
Benchmark vector database providers with your actual vector dimensions, dataset size, and query patterns before selecting; never choose based on vendor benchmarks alone.

---
## Reason
Vendor benchmarks use optimal conditions that may not match your data. Real-world performance depends on dimension count, vector distribution, filter patterns, and query concurrency. Testing with your data reveals the true cost and performance.

---
## Bad Example
```php
// Chose Pinecone based on benchmarks — now costs are 3x budget
```

---
## Good Example
```php
class ProviderBenchmark {
    public function evaluate(VectorStore $store, TestSuite $suite): array {
        $startTime = microtime(true);
        foreach ($suite->queries as $query) {
            $store->search($query);
        }
        $avgLatency = (microtime(true) - $startTime) / count($suite->queries) * 1000;

        return [
            'p50_latency' => $avgLatency,
            'throughput_qps' => $this->measureThroughput($store, $suite),
            'recall_at_10' => $this->measureRecall($store, $suite),
        ];
    }
}

// Test with actual production data shape:
$results = [];
foreach ($this->candidates as $name => $store) {
    $results[$name] = $this->benchmark->evaluate($store, $this->testSuite);
}
```

---
## Exceptions
Prototype systems may choose a default provider (pgvector) and evaluate alternatives later.

---
## Consequences Of Violation
Unexpected costs, performance surprises, missing features discovered post-migration, vendor lock-in.

---

## Use Dual-Write Pattern for Migration

---
## Category
Reliability | Scalability

---
## Rule
During provider migration, write to both the old and new vector databases simultaneously until cutover; never cut over in a single step.

---
## Reason
Single-step cutover risks extended downtime if the new provider has issues (performance, consistency, configuration errors). Dual-write allows rolling back instantly and validates the new provider with live traffic.

---
## Bad Example
```php
// Single-step cutover — any issue causes downtime
VectorStore::swap(old: $pinecone, new: $qdrant);
```

---
## Good Example
```php
class MigrationManager {
    public function __construct(
        private VectorStore $primary,   // Existing provider
        private VectorStore $secondary, // New provider
    ) {}

    public function dualWrite(string $collection, array $vectors, array $metadata): void {
        $this->primary->insert($collection, $vectors, $metadata);
        try {
            $this->secondary->insert($collection, $vectors, $metadata);
        } catch (\Exception $e) {
            Log::error('Dual write failed', ['error' => $e->getMessage()]);
            // Don't fail the primary write
        }
    }

    public function cutover(): void {
        // 1. Validate secondary has caught up
        // 2. Route reads to secondary, keep writing to both
        // 3. Monitor for issues during observation period
        // 4. If stable, stop dual-write to primary
    }

    public function rollback(): void {
        // Switch reads back to primary
        // Secondary becomes validation-only
    }
}
```

---
## Exceptions
Non-critical systems where brief downtime is acceptable may skip dual-write.

---
## Consequences Of Violation
Extended downtime during migration issues, data loss risk, no simple rollback path.

---

## Plan a Tested Rollback Procedure

---
## Category
Reliability

---
## Rule
Document and test a rollback procedure before starting any vector database migration; never migrate without a tested fallback plan.

---
## Reason
Migrations can fail due to data incompatibility, performance regressions, or feature gaps. A tested rollback procedure ensures the system can be restored quickly without panic.

---
## Bad Example
```php
// No rollback plan — if the migration fails, the team figures it out under pressure
```

---
## Good Example
```php
class MigrationRollback {
    public function rollback(): void {
        // 1. Stop dual-write to new provider
        config(['vector.default' => 'old_provider']);

        // 2. Rebuild any data written only to new provider
        $unsyncedDocs = DocumentSyncState::where('synced_after', $this->cutoverTime)->get();
        foreach ($unsyncedDocs as $doc) {
            dispatch(new SyncDocumentJob($doc->document));
        }

        // 3. Verify old provider data integrity
        assert($this->verifyIntegrity($this->oldProvider));

        // 4. Log and alert
        Log::warning('Migration rollback completed', [
            'cutover_time' => $this->cutoverTime,
            'rebuilt_docs' => $unsyncedDocs->count(),
        ]);
    }
}
```

---
## Exceptions
Non-critical internal tools may skip formal rollback procedures.

---
## Consequences Of Violation
Extended migration failures, data loss, team scrambling under pressure, extended downtime.

---

## Track Embedding Model Version

---
## Category
Maintainability | Reliability

---
## Rule
Store the embedding model version alongside vectors and re-index when the model changes; never switch embedding models without re-indexing.

---
## Reason
Different embedding model versions produce vectors in different spaces. Mixing old and new model vectors in the same index makes comparisons meaningless — retrieval quality degrades to near random.

---
## Bad Example
```php
// Changed from text-embedding-ada-002 to text-embedding-3-small
// Old and new vectors coexist in the same index — retrieval is broken
```

---
## Good Example
```php
class EmbeddingVersionManager {
    public function __construct(
        private string $currentModel = 'text-embedding-3-small-002',
    ) {}

    public function needsReindex(Document $doc): bool {
        return $doc->embedding_model !== $this->currentModel;
    }

    public function reindexAll(): void {
        $oldVersion = DocumentSyncState::where('embedding_model', '!=', $this->currentModel)->first();
        if ($oldVersion) {
            Log::info('Re-indexing for embedding model change', [
                'old_model' => $oldVersion->embedding_model,
                'new_model' => $this->currentModel,
            ]);

            Document::chunk(100, fn($docs) => dispatch(new ReindexBatchJob($docs)));
        }
    }
}
```

---
## Exceptions
When using the same embedding model version throughout the system's lifetime, version tracking is not needed.

---
## Consequences Of Violation
Silent retrieval degradation, mixed incompatible vectors, near-random search results.

---

## Don't Dismiss pgvector Prematurely

---
## Category
Architecture | Reliability

---
## Rule
Consider pgvector as the default vector database for Laravel applications before evaluating managed providers; never assume a dedicated vector DB is required.

---
## Reason
pgvector runs inside PostgreSQL — zero additional infrastructure, transactional consistency with document data, SQL integration, and no network hop. For many Laravel deployments, pgvector's performance (50 QPS at 1M vectors) is sufficient and the operational simplicity outweighs the QPS advantage of dedicated providers.

---
## Bad Example
```php
// Added Qdrant as a separate service before evaluating pgvector
// Now managing two databases instead of one
```

---
## Good Example
```php
// Start with pgvector — no extra infrastructure
Schema::create('document_vectors', function (Blueprint $table) {
    $table->id();
    $table->foreignId('document_id')->constrained();
    $table->vector('embedding', 1536);
    $table->timestamps();
});

DB::statement('CREATE INDEX ON document_vectors USING hnsw (embedding vector_cosine_ops)');

// Only migrate to dedicated vector DB when pgvector limits are hit
```

---
## Exceptions
Applications requiring >500 QPS, multi-region replication, or managed vector DB compliance certifications may need a dedicated provider from the start.

---
## Consequences Of Violation
Unnecessary infrastructure complexity, higher operational costs, additional latency from network hops to a separate service.
