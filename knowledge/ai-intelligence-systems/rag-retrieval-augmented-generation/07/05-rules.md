## Implement Document-Level Access Control at Retrieval Time

---
## Category
Security

---
## Rule
Filter vector search results by user permissions at the database query level; never retrieve all documents and filter post-retrieval.

---
## Reason
Post-retrieval filtering wastes resources on unauthorized documents, creates timing side-channels that leak document existence, and risks exposing sensitive content through response metadata.

---
## Bad Example
```php
public function search(string $query, User $user): array {
    $allResults = $this->vectorStore->search($query, 100);
    // Post-filter — timing side-channel leaks document existence
    return array_filter($allResults, fn($doc) =>
        $user->can('view', $doc)
    );
}
```

---
## Good Example
```php
public function search(string $query, User $user, int $topK = 5): array {
    $vector = $this->embedder->embed($query);
    return $this->vectorStore->search(
        vector: $vector,
        topK: $topK,
        filter: [
            'allowed_roles' => ['$in' => $user->roles],
            'tenant_id' => $user->tenant_id,
        ],
    );
}
```

---
## Exceptions
Public knowledge bases with no access restrictions may skip access control filtering.

---
## Consequences Of Violation
Unauthorized data exposure, cross-tenant leakage, compliance violations, timing-based reconnaissance.

---

## Validate Ingested Documents Before Indexing

---
## Category
Security

---
## Rule
Run every ingested document through a validation pipeline (injection detection, content safety, metadata completeness) before chunking and embedding; never index unvalidated documents.

---
## Reason
Unvalidated documents may contain prompt injection payloads, malicious content, or incomplete metadata. Index poisoning can compromise the entire RAG system by injecting harmful content that is retrieved and presented to users.

---
## Bad Example
```php
public function ingest(string $content, array $metadata): void {
    $chunks = $this->chunker->chunk($content, $metadata);
    $vectors = $this->embedder->embedMany($chunks);
    $this->vectorStore->store($vectors);
    // No validation — index poisoning risk
}
```

---
## Good Example
```php
class DocumentIngestionPipeline {
    public function ingest(string $content, array $metadata): void {
        // Validation pipeline
        if ($this->injectionDetector->detect($content)) {
            throw new DocumentRejectedException('Injection patterns detected');
        }
        if ($this->contentModerator->isHarmful($content)) {
            throw new DocumentRejectedException('Prohibited content');
        }
        if (empty($metadata['allowed_roles'])) {
            throw new DocumentRejectedException('Missing access control metadata');
        }

        // Safe to index
        $chunks = $this->chunker->chunk($content, $metadata);
        $vectors = $this->embedder->embedMany($chunks);
        $this->vectorStore->store($vectors);
    }
}
```

---
## Exceptions
Trusted, curated document corpora with strict editorial control may skip validation.

---
## Consequences Of Violation
Index poisoning, LLM output manipulation via injected documents, harmful content served to users.

---

## Use Tenant-Isolated Indexes for Multi-Tenant Systems

---
## Category
Security | Scalability

---
## Rule
Use separate vector database collections or indexes per tenant; never share a single index across tenants with row-level access control.

---
## Reason
Row-level filters can fail due to bugs, misconfiguration, or query optimizer issues, causing cross-tenant data leakage. Isolated indexes provide a hard security boundary that cannot be bypassed.

---
## Bad Example
```php
// Single shared index — one filter bug exposes all tenants
$this->vectorStore->search($query, 10, ['tenant_id' => $tenantId]);
```

---
## Good Example
```php
class TenantAwareVectorStore {
    public function search(string $tenantId, array $queryVector, int $topK = 5): array {
        $collection = "documents_{$tenantId}"; // Isolated per tenant
        return $this->vectorStore->collection($collection)->search($queryVector, $topK);
    }
}

// Usage per-tenant:
$results = $this->store->search($request->tenant()->id, $vector, 5);
```

---
## Exceptions
Single-tenant applications do not need tenant isolation.

---
## Consequences Of Violation
Cross-tenant data leakage, compliance violations, catastrophic data exposure from a single filter bug.

---

## Propagate Document Deletion to Vector Index

---
## Category
Maintainability | Security

---
## Rule
Remove all chunks and embeddings for a document when it is deleted from the source; never leave orphaned chunks in the vector index.

---
## Reason
Orphaned chunks continue to be retrieved and presented to users after the source document is deleted, creating data retention violations and surfacing outdated or incorrect information.

---
## Bad Example
```php
// Document deleted from database, but chunks remain in vector index
Document::find($id)->delete();
// Embeddings still retrievable — data retention violation
```

---
## Good Example
```php
class DocumentDeletionHandler {
    public function delete(string $documentId): void {
        DB::transaction(function () use ($documentId) {
            // Delete source document
            Document::findOrFail($documentId)->delete();

            // Propagate to vector index
            $this->vectorStore->deleteByFilter([
                'document_id' => $documentId,
            ]);

            // Log for audit
            Log::info('Document deleted with index cleanup', [
                'document_id' => $documentId,
            ]);
        });
    }
}
```

---
## Exceptions
Documents with pending retention holds or legal holds should be archived, not deleted.

---
## Consequences Of Violation
Data retention compliance violations (GDPR right to deletion), stale information presented to users, orphaned storage costs.

---

## Audit All Retrieval Operations

---
## Category
Observability | Security

---
## Rule
Log every retrieval operation with user ID, query, retrieved document IDs, relevance scores, and timestamp; never operate a RAG system without a retrieval audit trail.

---
## Reason
Without audit logs, unauthorized document access, data leakage incidents, and retrieval quality issues cannot be investigated. Audit trails are required for compliance (SOC2, HIPAA) and incident response.

---
## Bad Example
```php
public function query(string $query, User $user): RAGContext {
    $results = $this->search($query, $user);
    return $this->formatter->format($results);
    // No audit trail — invisible retrieval
}
```

---
## Good Example
```php
public function query(string $query, User $user): RAGContext {
    $results = $this->search($query, $user);

    // Async audit logging
    dispatch(function () use ($user, $query, $results) {
        RetrievalAudit::create([
            'user_id' => $user->id,
            'query' => $query,
            'retrieved_document_ids' => array_map(
                fn($d) => $d->documentId, $results
            ),
            'result_count' => count($results),
            'timestamp' => now(),
        ]);
    });

    return $this->formatter->format($results);
}
```

---
## Exceptions
Public knowledge bases with no sensitive data and no compliance requirements may skip audit logging.

---
## Consequences Of Violation
No incident response capability, compliance audit failures, inability to detect unauthorized access patterns.

---

## Apply PII Redaction Before Indexing

---
## Category
Security | Privacy

---
## Rule
Scan documents for PII (emails, SSNs, phone numbers, addresses) and redact or pseudonymize before chunking and embedding; never index documents containing raw PII.

---
## Reason
Embeddings can partially reveal document content. PII indexed in the vector store creates a data exposure risk if the index is compromised, and may violate GDPR/HIPAA compliance.

---
## Bad Example
```php
// Indexes raw content with PII — data exposure risk
$chunks = $this->chunker->chunk($userDocument);
$this->vectorStore->store($this->embedder->embedMany($chunks));
```

---
## Good Example
```php
class PIIRedactionPipeline {
    public function process(Document $doc): Document {
        $patterns = [
            '/\b\d{3}-\d{2}-\d{4}\b/' => '[SSN REDACTED]',          // SSN
            '/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/' => '[EMAIL REDACTED]', // Email
            '/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/' => '[PHONE REDACTED]',  // Phone
        ];

        $redacted = $doc->content;
        foreach ($patterns as $pattern => $replacement) {
            $redacted = preg_replace($pattern, $replacement, $redacted);
        }

        return new Document(content: $redacted, metadata: $doc->metadata);
    }
}

// Usage:
$cleanDoc = $piiPipeline->process($doc);
$this->indexer->index($cleanDoc);
```

---
## Exceptions
Documents from sources that are already PII-free (technical documentation, public articles) may skip redaction.

---
## Consequences Of Violation
PII exposure through embeddings, GDPR/HIPAA compliance violations, data breach liability.
