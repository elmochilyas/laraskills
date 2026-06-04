---
## Rule Name
Normalize Embeddings for Consistent Similarity

## Category
Maintainability

## Rule
Always verify or normalize embeddings to unit length before computing cosine similarity.

## Reason
Most embedding models produce normalized vectors, but not all. Unnormalized vectors produce incorrect cosine similarity values and inconsistent rankings.

## Bad Example
```php
$similarity = cosineSimilarity($queryEmbedding, $docEmbedding);
// Vectors may not be normalized — similarity value unreliable
```

## Good Example
```php
function normalize(array $v): array {
    $norm = sqrt(array_sum(array_map(fn($x) => $x * $x, $v)));
    return $norm > 0 ? array_map(fn($x) => $x / $norm, $v) : $v;
}
$qNorm = normalize($queryEmbedding);
$dNorm = normalize($docEmbedding);
$similarity = dotProduct($qNorm, $dNorm);  // equivalent to cosine on unit vectors
```

## Exceptions
Embedding models verifiably known to always output normalized vectors.

## Consequences Of Violation
Incorrect similarity scores and suboptimal vector search rankings.

---
## Rule Name
Match Distance Metric to Embedding Model

## Category
Design

## Rule
Always use the distance metric that matches your embedding model's training configuration.

## Reason
Embedding models are trained with specific distance metrics. Using a mismatched metric reduces retrieval accuracy.

## Bad Example
```php
// Cosine for OpenAI (correct) — but model may use dot product
Document::nearestNeighbors($vector)->get();  // Default may be wrong
```

## Good Example
```php
// Check model docs for recommended metric
// OpenAI text-embedding-3-small: cosine is recommended
Document::nearestNeighbors($vector, 'cosine')->get();
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Reduced retrieval accuracy and inconsistent semantic matching.

---
## Rule Name
Use Cosine Similarity as Default

## Category
Design

## Rule
Use cosine similarity as the default vector distance metric unless the embedding model documentation specifies otherwise.

## Reason
Most modern embedding models (OpenAI, Cohere, Sentence Transformers) are trained with cosine similarity and produce normalized vectors.

## Bad Example
```php
$results = $vectorStore->search($vector, 'l2');
// L2 may produce different rankings than cosine for semantic search
```

## Good Example
```php
$results = $vectorStore->search($vector, 'cosine');
// Cosine matches how most embedding models were trained
```

## Exceptions
Models documented to use dot product (many Sentence-BERT models) or Euclidean distance.

## Consequences Of Violation
Suboptimal semantic rankings — vector distances don't reflect intended conceptual similarity.
