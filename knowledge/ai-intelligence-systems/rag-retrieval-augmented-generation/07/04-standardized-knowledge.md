---
id: ku-07
title: "RAG Security & Data Governance"
subdomain: "retrieval-augmented-generation"
ku-type: "governance"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/retrieval-augmented-generation/ku-07/04-standardized-knowledge.md"
---

# RAG Security & Data Governance

## Overview

RAG security and data governance covers the controls, policies, and practices for safely managing data in a RAG system — from document ingestion through retrieval to generation. Because RAG systems combine a knowledge base (potentially containing sensitive information) with an LLM, the attack surface is broader than either component alone: documents can be poisoned, retrieval can expose unauthorized content, and the LLM can leak information from retrieved context.

## Core Concepts

- **Document-Level Access Control:** Restricting which documents (and which chunks) a user can retrieve based on their permissions.
- **Index Security:** Protecting the vector index from unauthorized access, modification, or extraction.
- **Retrieval Authorization:** Checking user permissions against document access control lists (ACLs) during retrieval.
- **Context-Level Filtering:** Removing sensitive content from retrieved context before injection (even if the user has access to the document).
- **Document Provenance:** Tracking the source, ingestion date, and integrity of each document in the knowledge base.
- **Index Poisoning:** An attacker injecting malicious documents into the knowledge base that, when retrieved, influence LLM outputs.
- **Retrieval Audit Trail:** Logging which documents were retrieved for which queries, by which users.
- **Data Retention:** Policies for how long documents and their embeddings are retained, and how deletion propagates.

## When To Use

- Any RAG system with sensitive or confidential documents.
- Multi-tenant RAG systems where tenants must not see each other's data.
- Applications subject to compliance requirements (GDPR, HIPAA, SOC2, ITAR).
- Systems where document sources are untrusted (user uploads, web scraping).

## When NOT To Use

- RAG systems over publicly available, non-sensitive documents (documentation, public wikis).
- Internal tools where all users have access to all documents.

## Best Practices

- **Implement document-level ACLs.** Every document and chunk should have access control metadata (allowed roles, users, or groups).
- **Filter retrieval results by permissions.** Before returning search results, filter out documents the user doesn't have access to.
- **Validate all ingested documents.** Check for malicious content (injection, malware) before indexing.
- **Use content-addressed storage.** Hash document content to detect tampering and ensure integrity.
- **Audit all retrievals.** Log which documents were retrieved, by whom, and for which query.
- **Support document deletion and re-indexing.** When a document is deleted, its chunks must be removed from the index.

## Architecture Guidelines

- Store ACL metadata alongside each chunk in the vector database (as payload/filter fields).
- Implement a **retrieval authorization layer** that runs after vector search but before context formatting.
- Use **tenant-isolated indexes** for multi-tenant systems (separate vector DB collection per tenant) rather than row-level filtering.
- For document ingestion, implement a **validation pipeline** that checks content safety, format validity, and metadata completeness.
- Use an **event-driven architecture** for document changes: document updated → re-chunk → re-embed → update index.
- For Laravel, use **policies and gates** for document-level access control, propagated to the retrieval layer.

## Performance Considerations

- ACL filtering adds 5-20ms per query (applying permission filters to search results).
- Tenant-isolated indexes are faster than row-level filtering for multi-tenant systems (no filter logic overhead).
- Document validation on ingestion adds 100-500ms per document. Run in background queue jobs.
- Audit logging should be async (queue) to avoid adding latency to the retrieval path.
- Index updates (re-indexing after document changes): use differential indexing (only update affected chunks).

## Security Considerations

- **Index poisoning detection:** Monitor for anomalies in retrieval patterns (sudden appearance of documents with suspicious content).
- **Retrieval side-channel:** An attacker may infer document existence through retrieval timing or result counts. Use consistent response times.
- **Embedding reversal:** Embeddings can partially reveal document content. Consider this when indexing highly sensitive data.
- **Cross-tenant leakage:** Ensure vector index isolation between tenants. A query bug should not expose tenant B's documents to tenant A.
- **Deletion propagation:** When a document is deleted, its embeddings must also be deleted. Implement cascade delete.
- **Backup security:** Vector database backups contain all document embeddings. Encrypt backups at rest.

## Common Mistakes

- Not implementing document-level access control — every user can retrieve every document.
- Relying on the LLM to enforce access control — the LLM may ignore access control instructions.
- Not validating user-uploaded documents — an attacker uploads a document with injection payloads.
- Indexing sensitive documents without PII redaction — embeddings may leak PII.
- Not handling document deletion — deleted documents remain in the index and continue to be retrieved.
- No audit trail — when a user accesses sensitive information, there's no record.

## Anti-Patterns

- **Post-Retrieval Filtering:** Retrieving all documents and filtering by access after retrieval. Pre-filter at the database level.
- **LLM-as-Authorization:** Relying on the LLM to decide which documents to return based on user permissions. The LLM may be incorrect.
- **Shared Index, Shared Risk:** Using a single vector index for all tenants without isolation. One tenant's documents leak to another.
- **No Input Validation:** Allowing any document to be ingested without safety checks. Index poisoning is a real threat.
- **Orphaned Indexes:** Documents deleted from the source but still in the vector index. Implement garbage collection.

## Examples

### Access-Controlled Retrieval
```php
class SecureRAGService {
    public function query(string $query, User $user, int $topK = 5): RAGContext {
        $queryVector = $this->embeddings->embed($query);

        // Search with access control filter
        $results = $this->vectorStore->search(
            vector: $queryVector,
            topK: $topK * 2, // Retrieve extra for post-filtering
            filter: ['allowed_roles' => ['$in' => $user->roles]],
        );

        // Post-filter: only return documents the user can access
        $accessibleResults = array_filter($results, fn($doc) =>
            $user->can('view', $doc->documentId)
        );

        // Audit
        $this->auditLogger->logRetrieval(
            userId: $user->id,
            query: $query,
            retrievedDocs: array_map(fn($d) => $d->documentId, $accessibleResults),
        );

        $context = $this->formatter->format(array_slice($accessibleResults, 0, $topK));
        return new RAGContext(documents: $accessibleResults, context: $context);
    }
}
```

### Document Validation Pipeline
```php
class DocumentValidationPipeline {
    public function validate(string $content, array $metadata): void {
        // Check for prompt injection patterns
        if ($this->injectionDetector->detect($content)) {
            throw new DocumentRejectedException('Document contains prompt injection patterns');
        }

        // Check content safety
        if ($this->contentModerator->isHarmful($content)) {
            throw new DocumentRejectedException('Document contains prohibited content');
        }

        // Validate metadata
        if (empty($metadata['allowed_roles'])) {
            throw new DocumentRejectedException('Document must specify access control rules');
        }

        // PII scan
        if ($this->piiDetector->hasPii($content)) {
            $this->logger->warning('Document contains PII', ['metadata' => $metadata]);
        }
    }
}
```

## Related Topics

- ku-01 (RAG Architecture Fundamentals): Security in the RAG pipeline.
- ku-04 (Context Injection & Prompt Design): Sanitizing context for security.
- ai-safety-security/ku-01: Prompt injection prevention for RAG.
- ai-safety-security/ku-04: PII protection in RAG pipelines.
- vector-database-integration/ku-04: Secure vector storage.

## AI Agent Notes

- When asked to secure a RAG system, first identify: data sensitivity, access control requirements, and compliance obligations.
- For RAG security incidents, check: document ACL configuration, ingestion validation, retrieval audit logs, and index isolation.
- Prefer reading the security configuration (ACLs, validation rules) before the retrieval implementation.
- When generating secure RAG code, include: access-controlled retrieval, document validation, audit logging, and deletion propagation.

## Verification

- [ ] Document-level access control is enforced at retrieval time (not post-retrieval).
- [ ] Ingested documents are validated for injection patterns, content safety, and metadata completeness.
- [ ] PII redaction is applied to documents before indexing.
- [ ] Retrieval operations are audited (who retrieved what and when).
- [ ] Document deletion propagates to the vector index (chunks removed).
- [ ] Multi-tenant systems use tenant-isolated indexes.
- [ ] Vector DB backups are encrypted at rest.
