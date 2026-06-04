---
## Rule Name
Always Cache Generated Embeddings

## Category
Performance

## Rule
Always cache every generated embedding by content hash; never re-embed the same text.

## Reason
Embedding generation is computationally expensive and incurs API costs. Caching eliminates redundant calls and reduces latency by orders of magnitude.

## Bad Example
```php
$embedding = OpenAI::embeddings()->create([
    'input' => $text,
    'model' => 'text-embedding-3-small',
])->embeddings[0]->embedding;
// No cache — re-embeds on every request
```

## Good Example
```php
$hash = md5($text);
$embedding = Cache::remember("embedding:$hash", 86400 * 30, function () use ($text) {
    return OpenAI::embeddings()->create([
        'input' => $text,
        'model' => 'text-embedding-3-small',
    ])->embeddings[0]->embedding;
});
```

## Exceptions
One-time embedding jobs with no repeated content.

## Consequences Of Violation
Unnecessary API costs, higher latency for repeated content, and unnecessary load on embedding infrastructure.

---
## Rule Name
Include Model and Dimensionality in Cache Key

## Category
Maintainability

## Rule
Always include the embedding model name and dimensionality in the cache key, not just the input text.

## Reason
Different models produce different vectors for the same text. Using only text hash as the key causes silent cache collisions when models change.

## Bad Example
```php
$hash = md5($text); // Missing model info
$key = "embedding:$hash";
```

## Good Example
```php
$hash = md5($text . '|text-embedding-3-small|1536');
$key = "embedding:$hash";
```

## Exceptions
When only one embedding model is ever used and never changed.

## Consequences Of Violation
Silent cache hits returning embeddings from a different model, causing incorrect similarity search results.

---
## Rule Name
Use Redis for Query-Time Cache

## Category
Performance

## Rule
Use Redis for embedding cache when embeddings are read at query time; use database for persistent cache that survives restarts.

## Reason
Redis provides sub-millisecond reads critical for query-time performance. Databases survive cache flushes and provide durability.

## Bad Example
```php
// Using filesystem for query-time cache
Cache::store('file')->remember("embedding:$hash", $ttl, $callback);
// Slow disk I/O on every query
```

## Good Example
```php
Cache::store('redis')->remember("embedding:$hash", $ttl, $callback);
```

## Exceptions
Low-traffic applications where filesystem latency is acceptable.

## Consequences Of Violation
Increased query latency and degraded user search experience.

---
## Rule Name
Invalidate Cache When Source Content Changes

## Category
Maintainability

## Rule
Always clear or update the embedding cache when the source text content changes.

## Reason
Stale embeddings cause vector search to return irrelevant results based on outdated content.

## Bad Example
```php
public function update(Request $request, Post $post)
{
    $post->update($request->validated());
    // No cache invalidation — old embedding still in cache
}
```

## Good Example
```php
public function update(Request $request, Post $post)
{
    $post->update($request->validated());
    Cache::forget('embedding:' . md5($post->getOriginal('content')));
}
```

## Exceptions
Immutable content that never changes after creation.

## Consequences Of Violation
Vector search returns results based on outdated content, degrading retrieval quality.
