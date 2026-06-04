## Always Set `minSimilarity` Threshold
---
## Category
Reliability
---
## Rule
Always set a `minSimilarity` threshold on `whereVectorSimilarTo` queries; never retrieve vectors without a relevance floor.
---
## Reason
Without a `minSimilarity` threshold, vector search returns the top-K results regardless of relevance. Irrelevant chunks pollute the LLM's context, degrading response quality and wasting tokens. A threshold (recommended: 0.7-0.8) ensures only meaningfully similar content reaches the LLM.
---
## Bad Example
```php
$chunks = DocumentChunk::query()
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->limit(5)
    ->get(); // No similarity threshold — may return irrelevant results
```
---
## Good Example
```php
$chunks = DocumentChunk::query()
    ->whereVectorSimilarTo('embedding', $embedding, 'cosine', 0.75)
    ->limit(10)
    ->get();
```
---
## Exceptions
Applications where "something is better than nothing" (e.g., content recommendation) may use a lower threshold (0.5) with a fallback to keyword search.
---
## Consequences Of Violation
Irrelevant context in LLM prompts, degraded response quality, wasted tokens on useless content.

## Run Document Ingestion as Queued Job
---
## Category
Performance
---
## Rule
Always process document ingestion (chunking + embedding generation) via queued jobs; never perform embedding generation during the HTTP request lifecycle.
---
## Reason
Embedding generation requires an HTTP call to the embedding provider, taking 100-500ms per batch. Chunking complex documents adds further latency. Performing ingestion synchronously blocks the user's HTTP request, degrading UX and risking timeout.
---
## Bad Example
```php
// Controller performs embedding inline — blocks request
public function store(Request $request): RedirectResponse {
    $doc = Document::create($request->validated());
    $doc->embedding = Str::toEmbeddings($doc->content)->first();
    $doc->save();
    return redirect()->back();
}
```
---
## Good Example
```php
// Controller dispatches job — returns immediately
public function store(Request $request): RedirectResponse {
    $doc = Document::create($request->validated());
    ProcessDocument::dispatch($doc->id);
    return redirect()->back()->with('status', 'Processing...');
}
```
---
## Exceptions
Small documents (<100 words) with local embedding models (Ollama, <10ms) may embed synchronously if the latency is acceptable.
---
## Consequences Of Violation
Slow page loads, HTTP timeouts on large documents, poor user experience, queue bypass anti-pattern.

## Implement Per-User Scoping on Vector Queries
---
## Category
Security
---
## Rule
Always combine `whereVectorSimilarTo` with a `where('tenant_id', ...)` or equivalent scope filter; never execute vector search without tenant isolation.
---
## Reason
In a multi-tenant system, vector search without a tenant filter returns results from all tenants. The vector index is shared; without a WHERE clause, the HNSW graph may surface cross-tenant matches. Always filter at query time.
---
## Bad Example
```php
$results = DocumentChunk::query()
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->limit(5)
    ->get(); // No tenant filter — cross-tenant leakage
```
---
## Good Example
```php
$results = DocumentChunk::query()
    ->where('tenant_id', auth()->user()->tenant_id)
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->limit(5)
    ->get();
```
---
## Exceptions
Single-tenant applications or public-facing search where all content is shared may omit the tenant filter.
---
## Consequences Of Violation
Cross-tenant data leakage, compliance violations (GDPR, HIPAA), security incident.

## Handle Empty Retrieval Results Gracefully
---
## Category
Reliability
---
## Rule
When vector search returns no results above the `minSimilarity` threshold, instruct the agent to respond with "I don't know" or fetch from a fallback source; never leave context empty without guidance.
---
## Reason
An empty context window means the LLM has no grounding data and will hallucinate an answer. Explicit instructions to acknowledge uncertainty prevent hallucination and maintain user trust.
---
## Bad Example
```php
$context = $this->search($query);
// If context is empty, LLM hallucinates from training data
$response = $agent->prompt("Context: {$context}\n\nQuery: {$query}");
```
---
## Good Example
```php
$context = $this->search($query);
$instructions = $context
    ? "Answer based only on this context: {$context}"
    : "No relevant documents found. Say 'I cannot find an answer in our knowledge base.'";
$response = $agent->prompt("{$instructions}\n\nUser query: {$query}");
```
---
## Exceptions
When the agent is designed to combine RAG with general knowledge (e.g., creative writing), empty retrieval may still allow general responses.
---
## Consequences Of Violation
Hallucinated answers, user trust erosion, compliance issues for regulated domains.
