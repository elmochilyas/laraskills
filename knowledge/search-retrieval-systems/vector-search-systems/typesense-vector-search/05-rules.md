---
## Rule Name
Match Distance Metric to Embedding Model

## Category
Design

## Rule
Always use the distance metric that matches your embedding model's training when configuring Typesense vector search.

## Reason
Mismatched metrics produce incorrect similarity rankings. Most text models use cosine.

## Bad Example
```php
// Collection with L2 for cosine-trained embeddings
'vector_config' => ['size' => 1536, 'distance' => 'l2']
```

## Good Example
```php
'vector_config' => ['size' => 1536, 'distance' => 'cosine']
```

## Exceptions
Embedding models documented to use dot product or Euclidean.

## Consequences Of Violation
Incorrect semantic ranking and degraded search quality.

---
## Rule Name
Weight Text vs Vector Relevance

## Category
Performance

## Rule
Always configure the `vector_query` weight parameter to balance keyword and vector contribution in Typesense hybrid queries.

## Reason
Without weighting, text and vector scores may not reflect the desired balance for your content type. Default weights may over-emphasize one path.

## Bad Example
```php
// Default weight — may not be optimal
Product::search($query)->options(['vector_query' => "embedding:([...], k: 10)"]);
```

## Good Example
```php
Product::search($query)->options([
    'vector_query' => "embedding:([...], k: 10, weight: 0.7)",
    'query_by_weights' => '3,1,1'
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal hybrid search where one retrieval path dominates the other.

---
## Rule Name
Generate Embeddings Externally for Typesense

## Category
Architecture

## Rule
Always generate embeddings externally (OpenAI, Cohere, FastEmbed) and pass them to Typesense; Typesense does not generate embeddings internally.

## Reason
Unlike Meilisearch, Typesense does not include built-in embedding generation. Embedding generation must happen in your application pipeline.

## Bad Example
```php
// Expecting Typesense to auto-embed — doesn't work
Product::search($query)->options(['vector_query' => 'auto:true']);
```

## Good Example
```php
// Generate embedding externally
$embedding = OpenAI::embeddings()->create(['input' => $query, 'model' => 'text-embedding-3-small']);
// Pass to Typesense
Product::search($query)->options(['vector_query' => "embedding:($embedding, k: 10)"]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Vector search not working because Typesense has no embedding to search against.

---
## Rule Name
Configure HNSW Parameters via num_vectors

## Category
Performance

## Rule
Always set `num_vectors` in the Typesense vector schema to configure HNSW parameters appropriately for your dataset size.

## Reason
Typesense automatically configures HNSW parameters based on `num_vectors`. Without it, default parameters may be suboptimal.

## Bad Example
```php
'embedding' => ['type' => 'float[]', 'embed' => ['from' => ['q'], 'model_config' => ['model_name' => 'openai/text-embedding-3-small']]]
```

## Good Example
```php
'embedding' => ['type' => 'float[]', 'num_vectors' => 1000000, 'embed' => [...]]
```

## Exceptions
Small datasets where default HNSW parameters are sufficient.

## Consequences Of Violation
Suboptimal ANN search performance — slower queries or lower recall than achievable.
