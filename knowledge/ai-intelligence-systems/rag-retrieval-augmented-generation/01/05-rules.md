## Separate Indexing and Query Pipelines

---
## Category
Architecture | Performance

---
## Rule
Implement indexing (chunk → embed → store) as an async queued job and query (embed → search → format → generate) as a synchronous service; never mix indexing and query logic in the same code path.

---
## Reason
Indexing is throughput-sensitive (process millions of documents) and can take hours. Query must be fast (<500ms) for user-facing responses. Mixing them prevents independent scaling and optimization.

---
## Bad Example
```php
class RAGController {
    public function query(Request $request): Response {
        // Indexing happens inline — slow for users
        $this->indexDocument($request->input('new_doc'));
        // Query logic
        $results = $this->search($request->input('q'));
    }
}
```

---
## Good Example
```php
// Indexing — async queue job
class IndexDocumentJob implements ShouldQueue {
    public function handle(): void {
        $chunks = $this->chunker->chunk($this->document);
        $embeddings = $this->embedder->embedMany($chunks);
        $this->vectorStore->store($embeddings);
    }
}

// Query — synchronous service
class RAGQueryService {
    public function query(string $query, int $topK = 5): RAGContext {
        $vector = $this->embedder->embed($query);
        $results = $this->vectorStore->search($vector, $topK);
        return $this->formatter->format($results);
    }
}
```

---
## Exceptions
Development environments with tiny document sets may run indexing synchronously for simplicity.

---
## Consequences Of Violation
Slow query responses, inability to scale indexing independently, indexing failures impact user-facing queries.

---

## Use the Same Embedding Model for Indexing and Querying

---
## Category
Reliability

---
## Rule
Use the exact same embedding model for both document indexing and query embedding; never mix different embedding models in the same pipeline.

---
## Reason
Different embedding models produce vectors in incompatible spaces. A query vector from model A cannot meaningfully compare with document vectors from model B — retrieval quality will be near random.

---
## Bad Example
```php
// Indexing with one model
$docVectors = $openAIEmbedder->embedMany($chunks);
// Querying with a different model
$queryVector = $localBgeEmbedder->embed($query);
// Vectors are in incompatible spaces
```

---
## Good Example
```php
class RAGService {
    public function __construct(
        private EmbeddingService $embedder, // Single model for both
    ) {}

    public function index(Document $doc): void {
        $vectors = $this->embedder->embedMany($doc->chunks);
        $this->vectorStore->store($vectors);
    }

    public function query(string $query): RAGContext {
        $vector = $this->embedder->embed($query); // Same model
        return $this->vectorStore->search($vector);
    }
}
```

---
## Exceptions
When migrating between embedding models, both old and new models must be available until all documents are re-indexed with the new model.

---
## Consequences Of Violation
Near-random retrieval quality, silent degradation with no obvious error message, wasted costs.

---

## Implement Hybrid Search for Better Recall

---
## Category
Performance | Reliability

---
## Rule
Combine vector similarity search with keyword search (BM25) in a hybrid retrieval strategy; never rely solely on vector search for queries involving proper nouns, exact matches, or code.

---
## Reason
Vector search captures semantic meaning but struggles with exact keyword matches, proper nouns, product codes, and rare terms. Hybrid search combines the strengths of both approaches for significantly better recall.

---
## Bad Example
```php
public function search(string $query, int $topK = 5): array {
    $vector = $this->embedder->embed($query);
    return $this->vectorStore->search($vector, $topK);
    // Misses exact matches on product codes, names, IDs
}
```

---
## Good Example
```php
public function search(string $query, int $topK = 5): array {
    $vector = $this->embedder->embed($query);
    $vectorResults = $this->vectorStore->search($vector, $topK);

    $keywordResults = $this->fullTextSearch->search($query, $topK);

    return $this->fusionRanker->reciprocalRankFusion(
        $vectorResults,
        $keywordResults,
        $topK,
    );
}
```

---
## Exceptions
Applications where all queries are semantic (no proper nouns, codes, or exact matches) may use vector-only search.

---
## Consequences Of Violation
Poor recall for queries with proper nouns, codes, or exact terms; users unable to find specific documents.

---

## Implement Document-Level Access Control

---
## Category
Security

---
## Rule
Filter retrieved documents by user permissions at the database level during search; never retrieve all documents and filter post-hoc.

---
## Reason
Post-retrieval filtering wastes resources on unauthorized documents and creates a timing side-channel that can leak document existence. Database-level filtering ensures users only see authorized content.

---
## Bad Example
```php
public function search(string $query, User $user): array {
    $allResults = $this->vectorStore->search($query, 100);
    // Post-retrieval filtering — wastes resources, timing side-channel
    return array_filter($allResults, fn($doc) =>
        $user->can('view', $doc)
    );
}
```

---
## Good Example
```php
public function search(string $query, User $user): array {
    $vector = $this->embedder->embed($query);
    return $this->vectorStore->search(
        vector: $query,
        topK: 10,
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
Unauthorized data exposure, cross-tenant data leakage, compliance violations, timing side-channels.

---

## Sanitize Retrieved Documents for Injection

---
## Category
Security

---
## Rule
Sanitize retrieved document content for prompt injection patterns before injecting into the LLM context; never inject raw document content into prompts.

---
## Reason
Documents in the knowledge base may contain prompt injection payloads (intentionally or unintentionally). If injected directly into the LLM context, these payloads can override system instructions, exfiltrate data, or produce harmful outputs.

---
## Bad Example
```php
public function formatContext(array $documents): string {
    $context = '';
    foreach ($documents as $doc) {
        $context .= $doc->content; // Raw content — potential injection
    }
    return $context;
}
```

---
## Good Example
```php
public function formatContext(array $documents): string {
    $context = '';
    foreach ($documents as $i => $doc) {
        $sanitized = $this->injectionDetector->sanitize($doc->content);
        $context .= "<document index=\"{$i}\">\n{$sanitized}\n</document>\n";
    }
    return $context;
}

class InjectionDetector {
    public function sanitize(string $content): string {
        // Strip common injection patterns
        $content = preg_replace('/ignore\s+(all\s+)?previous\s+instructions/i', '', $content);
        $content = preg_replace('/you\s+are\s+(now|an?\s+)/i', '', $content);
        return htmlspecialchars($content, ENT_QUOTES | ENT_SUBSTR, 'UTF-8');
    }
}
```

---
## Exceptions
Trusted, curated document corpora with strict editorial control may skip sanitization.

---
## Consequences Of Violation
Prompt injection via document content, model instruction override, data exfiltration, harmful outputs.

---

## Set a Context Token Budget

---
## Category
Performance | Cost

---
## Rule
Allocate a specific token budget for retrieved context (typically 30-70% of the context window) and enforce truncation when exceeded; never let retrieved documents consume the entire context window.

---
## Reason
Retrieved documents that consume the entire context window leave no room for conversation history, system instructions, or the model's response. A controlled budget ensures balanced context allocation.

---
## Bad Example
```php
public function formatContext(array $documents): string {
    return collect($documents)
        ->pluck('content')
        ->implode("\n\n");
    // May exceed context window — no budget enforcement
}
```

---
## Good Example
```php
class ContextFormatter {
    public function __construct(
        private int $maxContextTokens = 3000,
    ) {}

    public function format(array $documents): string {
        $context = '';
        $remaining = $this->maxContextTokens;

        foreach ($documents as $i => $doc) {
            $formatted = $this->wrapDocument($doc, $i + 1);
            $tokens = $this->countTokens($formatted);
            if ($tokens > $remaining) break;
            $context .= $formatted . "\n\n";
            $remaining -= $tokens;
        }

        return trim($context);
    }
}
```

---
## Exceptions
When the model has a very large context window (200K tokens) and the task requires many documents, the budget may be adjusted but must always reserve room for the response.

---
## Consequences Of Violation
Context window overflow errors, truncated responses, no room for conversation history, increased costs.

---

## Track Retrieval Quality Over Time

---
## Category
Maintainability | Reliability

---
## Rule
Establish a test collection of query-relevant document pairs and run automated retrieval quality evaluations (precision, recall, MRR) on every pipeline change; never deploy retrieval changes without measuring impact.

---
## Reason
Retrieval quality degrades silently as the corpus grows, embedding models change, or chunking strategies evolve. Without automated evaluation, degradation goes unnoticed until users complain about poor answers.

---
## Bad Example
```php
// Deploying chunking changes without measurement
public function changeChunkingStrategy(string $strategy): void {
    $this->chunker = new $strategy();
    // No evaluation — quality may have degraded
}
```

---
## Good Example
```php
class RetrievalQualityGate {
    public function __construct(
        private RetrievalEvaluator $evaluator,
        private array $testQueries,
    ) {}

    public function check(RetrievalPipeline $pipeline): bool {
        $result = $this->evaluator->evaluate($pipeline, $this->testQueries);
        $this->logger->info('Retrieval quality check', [
            'precision@5' => $result->avgPrecisionAt5,
            'recall@5' => $result->avgRecallAt5,
            'mrr' => $result->avgMrr,
        ]);
        return $result->avgRecallAt5 >= 0.8; // Quality gate
    }
}
```

---
## Exceptions
Prototype RAG systems with no production users may defer quality evaluation.

---
## Consequences Of Violation
Silent retrieval degradation, declining answer quality, user frustration, inability to measure improvement.
