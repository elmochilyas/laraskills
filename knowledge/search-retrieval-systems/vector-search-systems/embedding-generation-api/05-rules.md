---
## Rule Name
Cache All Embeddings

## Category
Performance

## Rule
Always cache every embedding generated from API calls using a content hash key.

## Reason
API embeddings incur per-token costs. Without caching, repeated queries for the same text waste budget and add latency.

## Bad Example
```php
$embedding = OpenAI::embeddings()->create([
    'model' => 'text-embedding-3-small',
    'input' => $text,
]);
// No caching — same text embedded again later
```

## Good Example
```php
$hash = md5($text . '|text-embedding-3-small|1536');
$embedding = Cache::rememberForever("embedding:$hash", function () use ($text) {
    return OpenAI::embeddings()->create([
        'model' => 'text-embedding-3-small',
        'input' => $text,
    ])->embeddings[0]->embedding;
});
```

## Exceptions
One-time batch indexing jobs with no repeated content.

## Consequences Of Violation
Unnecessary API costs accumulating to significant monthly expenses and increased latency.

---
## Rule Name
Use Smallest Effective Model

## Category
Scalability

## Rule
Always start with the smallest effective embedding model (`text-embedding-3-small`) and only upgrade if quality benchmarks show improvement.

## Reason
Larger models increase cost (6x for `large` vs `small`), storage, and query latency without proportional quality gains for most use cases.

## Bad Example
```php
// Using largest model by default
'model' => 'text-embedding-3-large', // 3072 dims, 6x cost
```

## Good Example
```php
'model' => 'text-embedding-3-small', // 1536 dims, sufficient for most
```

## Exceptions
Applications where embedding quality benchmarks show statistically significant improvement with larger models.

## Consequences Of Violation
Unnecessary cost scaling (6x per request), larger vector index storage, and slower queries.

---
## Rule Name
Batch API Calls for Bulk Processing

## Category
Performance

## Rule
Always batch multiple texts into a single API embedding call when processing documents in bulk.

## Reason
API providers charge per token and have per-request overhead. Batching reduces cost and improves throughput significantly.

## Bad Example
```php
foreach ($documents as $doc) {
    $embedding = OpenAI::embeddings()->create([
        'input' => $doc->content,
        'model' => 'text-embedding-3-small',
    ]);
    // One API call per document — slow and expensive
}
```

## Good Example
```php
$texts = $documents->pluck('content')->toArray();
$response = OpenAI::embeddings()->create([
    'input' => $texts,
    'model' => 'text-embedding-3-small',
]);
// Single API call for all documents
```

## Exceptions
Real-time embedding for a single query at a time.

## Consequences Of Violation
Higher API costs (per-request overhead) and slower bulk indexing throughput.

---
## Rule Name
Implement Rate Limiting with Exponential Backoff

## Category
Reliability

## Rule
Always implement retry logic with exponential backoff for API embedding calls to handle 429 rate limit responses.

## Reason
API providers enforce rate limits. Without retry logic, rate-limited requests silently fail, causing indexing gaps.

## Bad Example
```php
try {
    $response = OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small']);
} catch (\Exception $e) {
    // Silently fail — embedding lost
}
```

## Good Example
```php
$response = retry(3, function () use ($text) {
    return OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small']);
}, 1000); // 1s, 2s, 4s backoff
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Incomplete vector indexes, missing embeddings for some documents, and silent quality degradation.

---
## Rule Name
Monitor API Costs

## Category
Scalability

## Rule
Always set up cost monitoring and usage alerts at the embedding provider dashboard.

## Reason
API embedding costs scale linearly with volume. Without monitoring, gradual growth goes unnoticed until the monthly bill arrives.

## Bad Example
```bash
# No cost monitoring configured
# Indexing 1M documents produces unexpected bill
```

## Good Example
```bash
# Configure in OpenAI dashboard:
# Usage alert at $100/month
# Monthly budget notification
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected infrastructure costs and budget overruns.
