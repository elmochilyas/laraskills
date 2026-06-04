## Sync Documents via Queued Jobs, Never in Web Requests

---
## Category
Performance | Scalability

---
## Rule
Dispatch all document synchronization operations (chunk → embed → insert) to the queue; never sync documents in the web request path.

---
## Reason
Embedding generation takes 50-200ms and vector DB inserts add more latency. Running sync synchronously blocks the HTTP response, causing poor user experience and exhausting worker pool for large documents.

---
## Bad Example
```php
class DocumentController {
    public function store(Request $request): Response {
        $doc = Document::create($request->validated());
        // Syncs in web request — blocks for seconds
        $this->syncService->syncDocument($doc);
        return response()->json($doc, 201);
    }
}
```

---
## Good Example
```php
class DocumentController {
    public function store(Request $request): Response {
        $doc = Document::create($request->validated());
        dispatch(new SyncDocumentJob($doc)); // Async
        return response()->json($doc, 201);
    }
}

class SyncDocumentJob implements ShouldQueue {
    public function handle(DocumentSyncService $sync): void {
        $sync->syncDocument($this->document);
    }
}
```

---
## Exceptions
Small documents with fast embedding (<50ms) in low-traffic internal tools may sync synchronously.

---
## Consequences Of Violation
Slow HTTP responses, worker pool blocking, request timeouts for large documents, poor user experience.

---

## Handle Document Updates as Full Re-Sync

---
## Category
Reliability | Maintainability

---
## Rule
When a document is updated, delete all existing vectors for that document and re-chunk, re-embed, and re-insert; never patch vectors in place.

---
## Reason
Document updates may change content, chunk boundaries, or metadata. Patching vectors without re-chunking leaves stale or orphaned chunks in the index that reference outdated content.

---
## Bad Example
```php
// Updates vector without re-chunking — stale data
public function updateDocument(Document $doc): void {
    $vector = $this->embedder->embed($doc->content);
    $this->vectorStore->update('documents', $doc->id, $vector);
    // Old chunks from previous version remain
}
```

---
## Good Example
```php
public function syncDocument(Document $document): void {
    // 1. Delete existing vectors for this document
    $this->vectorStore->delete('documents', [
        'document_id' => $document->id,
    ]);

    // 2. Re-chunk from updated content
    $chunks = $this->chunker->chunk($document->content, [
        'document_id' => $document->id,
    ]);

    // 3. Re-embed and re-insert
    foreach (array_chunk($chunks, 100) as $batch) {
        $vectors = $this->embedder->embedMany(
            array_map(fn($c) => $c->content, $batch)
        );
        $this->vectorStore->insert('documents', $vectors, ...);
    }
}
```

---
## Exceptions
Metadata-only updates (access control labels, tags) that do not affect content may update metadata without re-embedding.

---
## Consequences Of Violation
Stale chunks retrieved for updated documents, conflicting versions of the same document in results, user confusion.

---

## Propagate Document Deletion to the Vector Index

---
## Category
Security | Maintainability

---
## Rule
Remove an document's vectors from the vector index when the source document is deleted; never allow orphaned vectors to persist.

---
## Reason
Orphaned vectors continue to be retrieved and presented to users after the source document is deleted, violating data retention policies and surfacing removed content.

---
## Bad Example
```php
// Document deleted from primary DB but vectors remain in index
public function destroy(string $id): void {
    Document::findOrFail($id)->delete();
    // Vectors not removed — orphaned
}
```

---
## Good Example
```php
public function destroy(string $id): void {
    DB::transaction(function () use ($id) {
        Document::findOrFail($id)->delete();
        dispatch(new RemoveDocumentVectorsJob($id));
    });
}

class RemoveDocumentVectorsJob implements ShouldQueue {
    public function handle(VectorStore $store): void {
        $store->delete('documents', ['document_id' => $this->documentId]);
    }
}
```

---
## Exceptions
Soft-deleted documents that may be restored should be marked inactive in the vector index rather than deleted.

---
## Consequences Of Violation
Deleted content remains searchable, data retention violations, GDPR non-compliance.

---

## Implement a Sync State Tracker

---
## Category
Maintainability | Observability

---
## Rule
Track which documents are indexed, their vector version, and last sync timestamp in a sync state table; never operate sync without visibility into what is indexed.

---
## Reason
Without sync state, you cannot detect sync failures, know which documents are pending indexing, or recover from errors. A sync tracker provides the foundation for reconciliation and debugging.

---
## Bad Example
```php
// No sync state — impossible to know what's indexed
dispatch(new SyncDocumentJob($doc));
```

---
## Good Example
```php
Schema::create('document_sync_states', function (Blueprint $table) {
    $table->foreignId('document_id')->constrained()->unique();
    $table->string('vector_version', 32); // Hash of chunking+embedding config
    $table->timestamp('last_synced_at')->nullable();
    $table->timestamp('last_failed_at')->nullable();
    $table->string('last_error')->nullable();
    $table->integer('retry_count')->default(0);
    $table->timestamps();
});

class SyncDocumentJob implements ShouldQueue {
    public function handle(DocumentSyncService $sync): void {
        try {
            $sync->syncDocument($this->document);
            DocumentSyncState::updateOrCreate(
                ['document_id' => $this->document->id],
                ['last_synced_at' => now(), 'last_error' => null, 'retry_count' => 0],
            );
        } catch (\Exception $e) {
            DocumentSyncState::updateOrCreate(
                ['document_id' => $this->document->id],
                ['last_failed_at' => now(), 'last_error' => $e->getMessage()],
            )->increment('retry_count');
            throw $e;
        }
    }
}
```

---
## Exceptions
Static document collections that never change may not need a sync tracker.

---
## Consequences Of Violation
Undetected sync failures, documents missing from search without alerting, inability to recover from partial sync errors.

---

## Run Periodic Reconciliation

---
## Category
Maintainability | Reliability

---
## Rule
Schedule a periodic reconciliation job that compares the primary database with the vector index and fixes discrepancies; never assume sync is always correct.

---
## Reason
Sync errors accumulate over time — queue jobs fail, documents are missed, deletions are not propagated. Reconciliation catches and fixes these discrepancies before they impact users.

---
## Bad Example
```php
// No reconciliation — sync errors accumulate silently
```

---
## Good Example
```php
$schedule->call(function () {
    $documentIds = Document::pluck('id');
    $indexedIds = $this->vectorStore->listDocumentIds('documents');

    $missing = $documentIds->diff($indexedIds);
    $orphaned = $indexedIds->diff($documentIds);

    foreach ($missing as $id) {
        dispatch(new SyncDocumentJob(Document::find($id)));
    }

    foreach ($orphaned as $id) {
        $this->vectorStore->delete('documents', ['document_id' => $id]);
    }

    Log::info('Reconciliation complete', [
        'missing' => $missing->count(),
        'orphaned' => $orphaned->count(),
    ]);
})->weekly();
```

---
## Exceptions
Static, never-changing document collections may skip reconciliation.

---
## Consequences Of Violation
Growing drift between source documents and search index, documents missing from or incorrectly present in search results.
