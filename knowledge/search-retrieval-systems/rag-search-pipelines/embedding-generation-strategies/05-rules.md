---
## Rule Name
Cache All Embeddings by Content Hash

## Category
Performance

## Rule
Always cache generated embeddings by MD5 hash of the input text.

## Reason
Re-embedding identical text wastes API calls and adds latency. Content-hash caching eliminates redundant generation entirely.

## Bad Example
```php
// No caching — regenerates embedding every time
$embedding = OpenAI::embeddings()->create(['input' => $text]);
```

## Good Example
```php
$hash = md5($text);
$embedding = Cache::rememberForever("embedding:$hash", function () use ($text) {
    return OpenAI::embeddings()->create(['input' => $text])->embeddings[0]->embedding;
});
```

## Exceptions
One-time bulk jobs where content is never repeated.

## Consequences Of Violation
Unnecessary API costs and latency from re-embedding the same content.

---
## Rule Name
Use the Smallest Effective Model

## Category
Performance

## Rule
Start with `text-embedding-3-small` (1536 dims) and only use larger models if quality testing shows improvement.

## Reason
Smaller models are faster, cheaper, and sufficient for most use cases. Larger models (3-large, 3072 dims) increase cost and storage without guaranteed improvement.

## Bad Example
```php
// Using largest model unnecessarily
'input' => $text, 'model' => 'text-embedding-3-large'
```

## Good Example
```php
// Start with small model — sufficient for most
'input' => $text, 'model' => 'text-embedding-3-small'

// Only upgrade after quality benchmarks show improvement
// if (benchmarkQuality('large') > benchmarkQuality('small') + threshold)
```

## Exceptions
Domain-specific retrieval where smaller model recall is insufficient.

## Consequences Of Violation
Higher costs and latency without measurable retrieval quality improvement.

---
## Rule Name
Batch Embedding API Calls

## Category
Performance

## Rule
Always batch multiple text inputs into a single embedding API call for efficiency.

## Reason
Embedding APIs support batch inputs at the same cost and similar latency as a single input. Batching 20 texts is ~5x faster than 20 individual calls.

## Bad Example
```php
foreach ($chunks as $chunk) {
    $embeddings[] = OpenAI::embeddings()->create(['input' => $chunk])->embeddings[0]->embedding;
    // 20 API calls for 20 chunks
}
```

## Good Example
```php
$response = OpenAI::embeddings()->create([
    'model' => 'text-embedding-3-small',
    'input' => array_column($chunks, 'content'),
]);
// 1 API call for 20 chunks
```

## Exceptions
Real-time single-query embedding where there is no batch to process.

## Consequences Of Violation
N redundant API calls instead of 1, multiplying latency and the risk of rate limits.
