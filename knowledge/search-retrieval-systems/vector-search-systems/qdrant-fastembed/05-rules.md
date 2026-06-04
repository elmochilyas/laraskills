---
## Rule Name
Run FastEmbed as a Separate Microservice

## Category
Architecture

## Rule
Always run FastEmbed as a separate Python Docker service accessible via HTTP from Laravel; never embed it directly in PHP.

## Reason
FastEmbed is a Python package requiring ONNX Runtime. A sidecar service provides clean separation of concerns and independent scaling.

## Bad Example
```php
// Trying to call Python directly — unreliable
$embedding = shell_exec("python3 -c 'from fastembed import TextEmbedding; ...'");
```

## Good Example
```php
// HTTP call to FastEmbed microservice
$response = Http::timeout(5)->post('http://fastembed:8000/embed', [
    'text' => $text,
    'model' => 'BAAI/bge-small-en'
]);
```

## Exceptions
No common exceptions; this pattern is required for reliable integration.

## Consequences Of Violation
Unreliable embedding pipeline, process management issues, and difficult error handling.

---
## Rule Name
Use Appropriate Model Size for Speed/Quality

## Category
Design

## Rule
Use BAAI/bge-small-en for speed-critical workloads and BAAI/bge-large-en for quality-critical workloads.

## Reason
Model size directly affects inference latency and embedding quality. Choosing appropriately prevents over-engineering or under-performance.

## Bad Example
```python
# Always using large model — unnecessary for most
model = TextEmbedding(model_name="BAAI/bge-large-en")
```

## Good Example
```python
# Start with small, upgrade if quality benchmarks prove improvement
model = TextEmbedding(model_name="BAAI/bge-small-en")
# latency: 5ms, recall: 0.85
# Switch to large if recall < 0.90
```

## Exceptions
Applications where both latency and quality are equally critical.

## Consequences Of Violation
Unnecessary latency and compute cost, or insufficient embedding quality.

---
## Rule Name
Cache Embeddings Aggressively

## Category
Performance

## Rule
Always cache locally generated FastEmbed embeddings by content hash to avoid redundant inference.

## Reason
Local inference consumes CPU resources. Caching eliminates redundant computation for repeated content.

## Bad Example
```php
$embedding = Http::post('http://fastembed:8000/embed', ['text' => $text]);
// No cache — recomputes for same text
```

## Good Example
```php
$hash = md5($text);
$embedding = Cache::remember("embedding:$hash", 86400 * 30, function () use ($text) {
    return Http::post('http://fastembed:8000/embed', ['text' => $text])->json('embedding');
});
```

## Exceptions
One-time batch processing with no repeated content.

## Consequences Of Violation
Wasted CPU cycles on the FastEmbed service and increased indexing time.

---
## Rule Name
Batch Embedding Requests for Throughput

## Category
Performance

## Rule
Always batch multiple texts into a single FastEmbed inference call for bulk processing.

## Reason
Batch inference processes texts more efficiently than individual calls due to model parallelism.

## Bad Example
```php
foreach ($documents as $doc) {
    $embedding = Http::post('http://fastembed:8000/embed', ['text' => $doc->content]);
    // One API call per document — slow
}
```

## Good Example
```php
$texts = $documents->pluck('content')->toArray();
$response = Http::post('http://fastembed:8000/embed-batch', ['texts' => $texts]);
// Single call for all documents
```

## Exceptions
Real-time embedding for a single query at a time.

## Consequences Of Violation
Slower bulk indexing throughput and higher per-embedding latency.
