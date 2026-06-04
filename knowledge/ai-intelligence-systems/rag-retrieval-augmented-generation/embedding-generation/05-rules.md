## Pin Embedding Model Version in Config
---
## Category
Maintainability
---
## Rule
Specify the exact embedding model version (e.g., `text-embedding-3-small-0125`) in configuration; never use a bare model name that could resolve to different versions.
---
## Reason
If the provider updates the model to a new version with different output dimensions or embedding characteristics, all existing vector indexes become incompatible. Pinning the version ensures reproducibility and prevents silent index corruption.
---
## Bad Example
```php
// config/ai.php
'embedding_model' => 'text-embedding-3-small', // Ambiguous — could change
```
---
## Good Example
```php
// config/ai.php
'embedding_model' => 'text-embedding-3-small-0125', // Pinned to specific version
```
---
## Exceptions
Development environments may use flexible model names for experimentation; pin before promoting to production.
---
## Consequences Of Violation
Silent dimension changes invalidate all existing vectors, emergency re-embedding required, retrieval quality collapses.

## Never Mix Embedding Models in the Same Index
---
## Category
Reliability
---
## Rule
Use exactly one embedding model per vector index or column; never store vectors from different models in the same HNSW index.
---
## Reason
Vectors from different embedding models have different dimensionalities and semantic distributions. Cosine similarity between vectors from different models is meaningless — it does not measure semantic similarity. Mixing produces garbage rankings.
---
## Bad Example
```php
// Document A embedded with OpenAI, Document B with Cohere — same column
$docA->embedding = Str::toEmbeddings($docA->content, 'openai')->first();
$docB->embedding = Str::toEmbeddings($docB->content, 'cohere')->first();
// Searches against this column return garbage
```
---
## Good Example
```php
// All documents use the same model
$embedding = Str::toEmbeddings($content, 'openai')->first();
$doc->embedding = $embedding;
```
---
## Exceptions
Research or A/B testing scenarios may create separate index columns for each model and never query them together.
---
## Consequences Of Violation
Retrieval returns meaningless results, RAG quality collapse, undiagnosable relevance failures.

## Cache Embeddings by Content Hash
---
## Category
Performance
---
## Rule
Cache embedding vectors by MD5/SHA256 hash of the source text; skip re-embedding for unchanged content.
---
## Reason
Embedding generation is an API call with cost and latency. For content that doesn't change between ingestion runs (static documentation, reference material), caching eliminates redundant API calls and reduces ingestion time by 60-80%.
---
## Bad Example
```php
public function embed(string $text): array {
    return Str::toEmbeddings($text)->first(); // API call every time
}
```
---
## Good Example
```php
public function embed(string $text): array {
    $hash = md5($text);
    return Cache::remember("embedding:{$hash}", 86400, function () use ($text) {
        return Str::toEmbeddings($text)->first();
    });
}
```
---
## Exceptions
Frequently changing content (daily-updated news articles) may benefit from shorter cache TTLs or no caching.
---
## Consequences Of Violation
Unnecessary embedding API costs, increased ingestion latency, redundant processing.

## Normalize Vectors Before Storage
---
## Category
Performance
---
## Rule
Normalize embedding vectors to unit length before storing in the database; never store unnormalized vectors when using cosine similarity.
---
## Reason
Cosine similarity on unnormalized vectors returns incorrect ranking — the magnitude of the vector affects the similarity score. Normalization ensures that only the direction (semantic content) matters, producing correct similarity comparisons.
---
## Bad Example
```php
$doc->embedding = Str::toEmbeddings($text)->first();
$doc->save(); // Stored unnormalized
```
---
## Good Example
```php
$vector = Str::toEmbeddings($text)->first();
$magnitude = sqrt(array_sum(array_map(fn($v) => $v ** 2, $vector)));
$doc->embedding = array_map(fn($v) => $v / $magnitude, $vector);
$doc->save(); // Stored normalized
```
---
## Exceptions
When using L2 distance (Euclidean) instead of cosine similarity, normalization is not required.
---
## Consequences Of Violation
Incorrect similarity rankings, poor retrieval quality, intermittent relevance issues that are hard to diagnose.
