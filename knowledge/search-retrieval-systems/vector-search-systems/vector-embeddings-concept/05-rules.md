---
## Rule Name
Use Normalized Embeddings

## Category
Maintainability

## Rule
Always verify or ensure embeddings are normalized (unit vectors) before use.

## Reason
Normalization ensures consistent distance computation and allows cosine similarity to be equivalent to dot product for faster computation.

## Bad Example
```php
$embedding = $api->embed($text);
// Not verified as normalized — may cause incorrect distances
```

## Good Example
```php
$embedding = $api->embed($text);
$norm = sqrt(array_sum(array_map(fn($v) => $v * $v, $embedding)));
if (abs($norm - 1.0) > 0.001) {
    $embedding = array_map(fn($v) => $v / $norm, $embedding);
}
```

## Exceptions
Embedding models verifiably known to output normalized vectors.

## Consequences Of Violation
Incorrect similarity calculations and suboptimal search rankings.

---
## Rule Name
Match Distance Metric to Embedding Model

## Category
Design

## Rule
Always use the distance metric that matches your embedding model's training.

## Reason
Using a mismatched metric (cosine on dot-product-trained model or vice versa) reduces retrieval accuracy.

## Bad Example
```php
// Using L2 for cosine-trained OpenAI embeddings
$results = $vectorStore->search($vector, metric: 'l2');
```

## Good Example
```php
$results = $vectorStore->search($vector, metric: 'cosine');
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Reduced retrieval accuracy and inconsistent search quality.

---
## Rule Name
Cache All Embeddings

## Category
Performance

## Rule
Always cache embeddings by content hash to avoid redundant generation.

## Reason
Embedding generation is expensive (API cost or compute). Caching eliminates redundant generation for identical or repeated text.

## Bad Example
```php
$embedding = $api->embed($text);
// No caching — regenerates on every call
$embedding = $api->embed($text);
```

## Good Example
```php
$hash = md5($text);
$embedding = Cache::rememberForever("embedding:$hash", fn() => $api->embed($text));
```

## Exceptions
One-time batch processing with no repeated content.

## Consequences Of Violation
Unnecessary cost and latency for repeated embedding generation.
