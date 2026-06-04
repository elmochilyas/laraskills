---
## Rule Name
Use FastEmbed for Laravel Integration

## Category
Framework Usage

## Rule
Prefer FastEmbed (ONNX-optimized) for local embedding generation in Laravel; run as a separate Python microservice.

## Reason
FastEmbed provides the best PHP-friendly integration path via Qdrant, with ONNX optimization enabling CPU-based inference without GPU requirements.

## Bad Example
```php
// Blocking shell_exec to Python — unreliable
$embedding = json_decode(shell_exec("python3 embed.py '$text'"));
```

## Good Example
```php
// HTTP call to FastEmbed microservice
$response = Http::post('http://fastembed:8000/embed', ['text' => $text]);
$embedding = $response->json('embedding');
```

## Exceptions
Small-scale prototyping where shell commands are acceptable temporarily.

## Consequences Of Violation
Unreliable embedding pipeline, process management issues, and difficult debugging.

---
## Rule Name
Quantize Models for Faster Inference

## Category
Performance

## Rule
Always use ONNX quantized embedding models for local inference to improve throughput 2-4x.

## Reason
Quantized models reduce model size and inference time with minimal quality loss (<1% for most benchmarks).

## Bad Example
```bash
# Using full-precision model — slow CPU inference
model = BAAI/bge-small-en
```

## Good Example
```bash
# Using quantized model — 3x faster
model = BAAI/bge-small-en-quantized
```

## Exceptions
Applications where maximum embedding quality is critical and GPU is available.

## Consequences Of Violation
Unnecessarily slow embedding generation, longer batch processing times, and higher CPU utilization.

---
## Rule Name
Cache Local Embeddings

## Category
Performance

## Rule
Always cache locally generated embeddings by content hash to avoid redundant inference.

## Reason
Local embedding inference consumes CPU resources. Caching eliminates redundant computation for repeated or identical content.

## Bad Example
```php
// Re-computing embedding for same text
$embedding = $fastEmbedService->embed($text);
$embedding = $fastEmbedService->embed($text); // Same computation again
```

## Good Example
```php
$hash = md5($text);
$embedding = Cache::remember("embedding:$hash", 86400 * 30, function () use ($text) {
    return $fastEmbedService->embed($text);
});
```

## Exceptions
One-time batch jobs with no repeated content.

## Consequences Of Violation
Wasted CPU cycles, slower indexing, and increased inference infrastructure costs.

---
## Rule Name
Benchmark Local vs API Embedding Quality

## Category
Design

## Rule
Always benchmark local embedding quality against an API baseline using your specific data before committing to local-only.

## Reason
Local models generally have lower quality than API models. Without benchmarking, you may deploy degraded semantic search.

## Bad Example
```bash
# Switching to local embeddings without validation
# Assumption quality is "good enough"
```

## Good Example
```php
// Compare recall@10 between API and local embeddings
$apiRecall = $evaluator->recallAtK($testQueries, 'api');
$localRecall = $evaluator->recallAtK($testQueries, 'local');
// Only switch if acceptable
```

## Exceptions
Privacy-mandated deployments where API calls are prohibited regardless of quality.

## Consequences Of Violation
Degraded search quality, lower user engagement, and undetected retrieval regression.
