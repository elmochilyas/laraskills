# Knowledge Unit: Data Synchronization

## Metadata

- **ID:** ku-04
- **Subdomain:** Vector Databases
- **Slug:** data-synchronization
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Data synchronization keeps the vector database in sync with the source document store. When documents are added, updated, or deleted in the primary database, the changes must propagate to the vector database â€” re-chunking, re-embedding, and updating the index. This is an operational challenge because vector databases and primary databases have different data models and consistency guarantees. In the Laravel AI ecosystem, synchronization is implemented using queued jobs, events, and reconciliation processes.

## Core Concepts

- **Source of Truth:** The primary database (PostgreSQL, MySQL, document store) is the authoritative data source. The vector database is a derived index.
- **Event-Driven Sync:** Using database events (`created`, `updated`, `deleted`) to trigger vector index updates.
- **Batch Sync:** Periodic full or incremental sync of all changed documents since the last sync.
- **Change Data Capture (CDC):** Streaming database changes (via binary log, WAL, or webhooks) to the vector indexing pipeline.
- **Soft Delete vs. Hard Delete:** How document deletion is handled â€” soft delete marks as inactive, hard delete removes vectors from the index.
- **Reconciliation:** A periodic process that compares the primary database and vector database to detect and fix inconsistencies.
- **Backfill:** The initial sync of all existing documents into a new vector index. Requires careful orchestration for large datasets.
- **Stale Index Detection:** Identifying when the vector index is out of sync with the source (by comparing update timestamps).

## Mental Models

- **Source of Truth:** The primary database (PostgreSQL, MySQL, document store) is the authoritative data source. The vector database is a derived index.
- **Event-Driven Sync:** Using database events (`created`, `updated`, `deleted`) to trigger vector index updates.
- **Batch Sync:** Periodic full or incremental sync of all changed documents since the last sync.


## Internal Mechanics

The internal mechanics of Data Synchronization follow established patterns within the Vector Databases domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use events for real-time sync.** Laravel model events (`created`, `updated`, `deleted`) broadcast to the indexing queue.
- **Batch sync for resilience.** Processing changes in batches (100-1000 documents) is more efficient than single-document updates.
- **Implement idempotent sync.** Re-running a sync job should produce the same result â€” upsert vectors, don't duplicate.
- **Set up periodic reconciliation.** A weekly job that compares document IDs in the primary DB vs. vector DB and fixes discrepancies.
- **Handle document updates gracefully.** Updated documents need re-chunking, re-embedding, and re-indexing. Don't just search-and-replace.
- **Log sync operations.** Track what was synced, when, and whether it succeeded. Critical for debugging sync issues.

## Patterns

- **Use events for real-time sync.** Laravel model events (`created`, `updated`, `deleted`) broadcast to the indexing queue.
- **Batch sync for resilience.** Processing changes in batches (100-1000 documents) is more efficient than single-document updates.
- **Implement idempotent sync.** Re-running a sync job should produce the same result â€” upsert vectors, don't duplicate.
- **Set up periodic reconciliation.** A weekly job that compares document IDs in the primary DB vs. vector DB and fixes discrepancies.
- **Handle document updates gracefully.** Updated documents need re-chunking, re-embedding, and re-indexing. Don't just search-and-replace.
- **Log sync operations.** Track what was synced, when, and whether it succeeded. Critical for debugging sync issues.

## Architectural Decisions

- Implement sync via a **sync service** that orchestrates the indexing pipeline: fetch document â†’ chunk â†’ embed â†’ upsert to vector DB.
- Use **queued jobs** for sync operations â€” never sync documents in the web request path.
- Implement a **sync state table** in the primary database â€” tracks which documents are indexed, their vector version, and last sync timestamp.
- For large-scale backfill, use a **dedicated backfill command** that processes documents in batches with progress tracking.
- Use **eventual consistency** â€” accept that the vector index may be slightly behind the primary database. Define acceptable lag (e.g., <60 seconds).
- For Laravel, use the **queue system** (Redis, SQS) for sync jobs and **model observers** to trigger sync on model changes.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Sync latency: event-driven sync completes in 1-10 seconds (embedding + indexing time).
- Batch sync throughput: 100-500 documents/minute for embedding + indexing (depends on embedding model and vector DB insert speed).
- Backfill speed: 10K-100K documents/hour for large-scale backfills.
- Index rebuild: rebuilding a 1M vector index takes 1-10 minutes (depends on index type and hardware).
- Sync operations should be **non-blocking** â€” the application continues serving requests while sync is in progress.

## Production Considerations

- **Sync pipeline security:** The sync service has access to all documents. Ensure it runs with appropriate permissions.
- **Document access control during sync:** Sync ACL metadata alongside document content. Don't sync documents without access control labels.
- **Sync auditing:** Log all sync operations â€” who/what triggered the sync, what was synced, whether it succeeded.
- **Rollback capability:** If a batch sync introduces bad data, be able to roll back to the previous index state.
- **Index snapshot before sync:** For destructive operations (re-indexing), snapshot the current index first.

## Common Mistakes

- Syncing documents in the web request path â€” blocks the response until embedding and indexing complete.
- Not handling document updates â€” re-inserting the new vectors without deleting the old ones (duplicates).
- Not handling document deletions â€” deleted documents remain in the vector index and continue to be retrieved.
- No reconciliation â€” sync errors accumulate over time, and the index drifts from the source of truth.
- Full re-index on every change â€” inefficient for large datasets. Use incremental sync.
- Not versioning vector data â€” when the chunking or embedding strategy changes, old vectors become stale.

## Failure Modes

- **Sync-or-Die:** Treating sync failures as critical errors that stop the application. Sync failures should be logged and retried.
- **No Sync State:** Having no way to know which documents are indexed and which are pending. Implement a sync tracking table.
- **Manual Sync Only:** Relying on developers to manually trigger re-indexing. Automate sync with events and cron.
- **One-Way Sync Only:** Syncing creates to the vector DB but not deletes. Implement soft-delete reconciliation.
- **Sync Sprawl:** Multiple sync pipelines that don't coordinate. Centralize sync orchestration in a single service.

## Ecosystem Usage

### Document Sync Service
```php
class DocumentSyncService {
    public function __construct(
        private EmbeddingService $embeddings,
        private VectorStore $vectorStore,
        private ChunkingStrategy $chunker,
    ) {}

    public function syncDocument(Document $document): void {
        // 1. Chunk
        $chunks = $this->chunker->chunk($document->content, [
            'document_id' => $document->id,
            'title' => $document->title,
            'source' => $document->source,
            'updated_at' => $document->updated_at->toIso8601String(),
        ]);

        // 2. Delete existing vectors for this document
        $this->vectorStore->delete('documents', [
            'document_id' => $document->id,
        ]);

        // 3. Embed and insert in batches
        foreach (array_chunk($chunks, 100) as $batch) {
            $vectors = $this->embeddings->embedMany(
                array_map(fn($c) => $c->content, $batch)
            );

            $points = [];
            foreach ($batch as $i => $chunk) {
                $points[] = new VectorPoint(
                    id: $chunk->chunkId,
                    vector: $vectors[$i],
                    metadata: $chunk->metadata,
                );
            }

            $this->vectorStore->insert('documents', $points);
        }

        // 4. Mark document as synced
        $document->markAsSynced();
    }

    public function deleteDocument(string $documentId): void {
        $this->vectorStore->delete('documents', [
            'document_id' => $documentId,
        ]);
    }
}
```

### Model Observer for Auto-Sync
```php
class DocumentObserver {
    public function __construct(private DocumentSyncService $sync) {}

    public function created(Document $document): void {
        dispatch(fn() => $this->sync->syncDocument($document));
    }

    public function updated(Document $document): void {
        if ($document->wasChanged('content')) {
            dispatch(fn() => $this->sync->syncDocument($document));
        }
    }

    public function deleted(Document $document): void {
        dispatch(fn() => $this->sync->deleteDocument($document->id));
    }
}
```

## Related Knowledge Units

- ku-01 (Vector Database Fundamentals): Foundation for sync.
- ku-05 (Performance & Scaling): Sync throughput optimization.
- retrieval-augmented-generation/ku-01: RAG indexing pipeline.
- retrieval-augmented-generation/ku-06: Multi-modal document sync.
- ai-safety-security/ku-04: Data privacy in sync operations.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

