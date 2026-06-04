---
## Rule Name
Start Simple: API Embeddings + pgvector

## Category
Architecture

## Rule
Begin vector search implementation with API embeddings (OpenAI) and pgvector vector store before considering alternatives.

## Reason
This combination requires zero infrastructure beyond existing PostgreSQL, has well-documented APIs, and supports most use cases.

## Bad Example
```bash
# Starting with complex multi-engine setup
# Qdrant + FastEmbed + cross-encoder — before proving need
```

## Good Example
```php
// OpenAI embeddings + pgvector
$embedding = OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small']);
Document::nearestNeighbors($embedding, 10)->get();
```

## Exceptions
Existing integration with other vector stores or embedding providers.

## Consequences Of Violation
Premature complexity and unnecessary infrastructure before validating the approach.

---
## Rule Name
Cache All Embeddings

## Category
Performance

## Rule
Always cache embeddings by content hash to reduce API costs and latency.

## Reason
Embedding generation is the most expensive part of the vector search pipeline. Caching eliminates redundant calls.

## Bad Example
```php
$embedding = OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small']);
// No caching — regenerates on repeated queries
```

## Good Example
```php
$hash = md5($text);
$embedding = Cache::rememberForever("embedding:$hash", function () use ($text) {
    return OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small'])->embeddings[0]->embedding;
});
```

## Exceptions
One-time batch jobs with no repeated content.

## Consequences Of Violation
Unnecessary API costs and higher latency for repeated content.

---
## Rule Name
Use Queues for Bulk Embedding

## Category
Architecture

## Rule
Always process bulk embedding generation via Laravel queues, not in the HTTP request cycle.

## Reason
Embedding generation takes 50-200ms per call. Processing hundreds of documents synchronously would cause request timeouts.

## Bad Example
```php
// Synchronous embedding in controller — blocks HTTP response
foreach ($documents as $doc) {
    $doc->embedding = $api->embed($doc->content);
    $doc->save();
}
```

## Good Example
```php
// Dispatch queue job
ProcessDocumentEmbedding::dispatch($document);
```

## Exceptions
Real-time embedding for a single user query.

## Consequences Of Violation
HTTP request timeouts and poor user experience during indexing.

---
## Rule Name
Monitor API Costs from Day One

## Category
Scalability

## Rule
Always set up API cost monitoring for embedding providers before processing any significant volume.

## Reason
Embedding API costs scale with text volume. Without monitoring, costs grow unnoticed until billing surprises.

## Bad Example
```bash
# No cost monitoring
# Indexing 500K documents -> unexpected bill
```

## Good Example
```bash
# Configure OpenAI spending limits
# Set alert at $50/month
```

## Exceptions
Applications using only local/gratis embedding models.

## Consequences Of Violation
Unexpected API costs and budget overruns.
