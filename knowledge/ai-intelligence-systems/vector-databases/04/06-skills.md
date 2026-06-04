# Skill: Synchronize Vector Database with Source Document Store

## Purpose
Keep the vector database in sync with the primary document store by propagating document creates, updates, and deletes through the chunking and embedding pipeline using queued jobs, event-driven sync, and periodic reconciliation.

## When To Use
- Any production RAG system where documents change after initial indexing
- Systems with user-generated content that is edited or deleted
- Multi-tenant systems where tenants add/remove documents frequently
- Applications requiring consistency between document content and search results

## When NOT To Use
- Static document collections that never change after initial indexing
- Prototypes where manual re-indexing is acceptable
- Small datasets where full re-index completes in seconds

## Prerequisites
- KU-01 (Vector Database Fundamentals) — understanding of collections and vectors
- KU-02 (Indexing Strategies) — index rebuild requirements for sync frequency
- Chunking strategy configured (document → chunks)
- Embedding service configured and available
- Queue system (Redis, SQS, database) configured for async jobs

## Inputs
- Document events (created, updated, deleted) from model observers
- Document content and metadata to be indexed
- Sync state table schema (document_id, vector_version, last_synced_at)
- Reconciliation schedule configuration
- Chunking and embedding configuration

## Workflow
1. **Set up model observers**: Register Laravel model observers for `created`, `updated`, and `deleted` events on the source document model. For `updated`, only trigger sync when content-relevant fields change (skip metadata-only updates).
2. **Create sync state table**: Create a `document_sync_states` migration with columns: `document_id` (FK, unique), `vector_version` (hash of chunking+embedding config), `last_synced_at`, `last_failed_at`, `last_error`, `retry_count`.
3. **Implement sync jobs**: Create queued jobs for sync operations. Each job should: fetch the document, chunk the content, generate embeddings, delete existing vectors for that document, upsert new vectors, and update sync state on success.
4. **Handle creates**: On document creation, dispatch a `SyncDocumentJob` that chunks the full content, generates embeddings, inserts vectors, and marks the document as synced.
5. **Handle updates**: On document update, dispatch a `SyncDocumentJob` that deletes all existing vectors for that document, re-chunks the updated content, re-embeds, re-inserts. Always do full re-sync, not in-place patches.
6. **Handle deletes**: On document deletion, dispatch a `RemoveDocumentVectorsJob` that deletes vectors by document_id. For soft-deletes, mark vectors as inactive rather than deleting.
7. **Implement backfill command**: Create an Artisan command for initial backfill that processes documents in batches (100-500 per batch) with progress tracking. Use `Document::chunk()` and dispatch jobs for each batch.
8. **Set up reconciliation**: Schedule a weekly or monthly cron job that compares document IDs in the primary database against document IDs in the vector index, dispatches sync for missing documents, and removes orphaned vectors.
9. **Monitor sync health**: Track sync job success/failure rates, sync lag (time between document change and vector update), and reconciliation discrepancy counts. Set alerts for high failure rates.

## Validation Checklist
- [ ] Document changes trigger queued (not synchronous) vector index updates
- [ ] Updated documents are fully re-chunked, re-embedded, and re-inserted (old vectors removed)
- [ ] Deleted documents are removed from the vector index
- [ ] Sync state table exists with document_id, vector_version, last_synced_at
- [ ] Periodic reconciliation runs to fix sync discrepancies
- [ ] Sync failures are logged and retried with appropriate backoff
- [ ] Backfill command exists for initial indexing of existing documents

## Common Failures
- **Duplicate vectors**: On document update, new vectors are inserted without deleting old ones. Fix by always deleting by document_id before re-inserting.
- **Orphaned vectors**: Documents deleted from primary DB remain in vector index. Fix by implementing the delete handler and reconciliation.
- **Sync drift over time**: Errors accumulate silently, causing missing or stale vectors. Fix by running periodic reconciliation (weekly).
- **Queue backpressure**: High document churn overwhelms queue workers. Fix by batching sync operations (100 documents per job) and scaling workers.
- **Embedding model version mismatch**: Vectors from old and new embedding models are incompatible. Fix by storing vector_version and triggering full re-index on model change.

## Decision Points
- **Event-driven vs. batch sync**: Use event-driven for real-time sync (1-10 second lag). Use batch sync for resilience and efficiency with high-throughput systems. Combine both for best results.
- **Soft-delete vs. hard-delete in index**: For documents that may be restored, mark vectors as inactive (add `is_active: false` metadata). For permanently deleted documents, remove vectors entirely.
- **Reconciliation frequency**: Weekly for most systems. Daily for high-churn systems with strict consistency requirements. Monthly for low-churn systems.

## Performance Considerations
- Event-driven sync latency: 1-10 seconds per document (embedding + indexing)
- Batch sync throughput: 100-500 documents/minute
- Backfill speed: 10K-100K documents/hour
- Sync operations should be non-blocking — use queued jobs, never sync in web request path
- Index rebuild on sync: 1-10 minutes for a 1M vector index

## Security Considerations
- Sync pipeline has access to all document content. Ensure it runs with appropriate permissions.
- Sync ACL metadata alongside document content for search-time access control
- Log all sync operations for audit trail (who/what triggered, what was synced, success/failure)
- For destructive sync operations (re-indexing), snapshot the current index first
- Ensure rollback capability if sync introduces bad data

## Related Rules
- Sync Documents via Queued Jobs, Never in Web Requests
- Handle Document Updates as Full Re-Sync
- Propagate Document Deletion to the Vector Index
- Implement a Sync State Tracker
- Run Periodic Reconciliation

## Related Skills
- Skill: Configure and Tune Vector Database Indexes (ku-02)
- Skill: Implement Vector Search with Filtering (ku-03)
- Skill: Scale Vector Database Performance (ku-05)
- Skill: Build a RAG Retrieval Pipeline (rag-01)

## Success Criteria
- Document creates appear in search results within 10 seconds
- Document updates are reflected in search (old content removed, new content indexed) within 10 seconds
- Document deletions remove vectors from search within 10 seconds
- Sync state table accurately reflects sync status for all documents (no null last_synced_at for indexed docs)
- Reconciliation detects and fixes discrepancies within the scheduled window
- Zero duplicate vectors for any document in the index