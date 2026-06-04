---
## Rule Name
Start with Serverless Pinecone

## Category
Architecture

## Rule
Use Pinecone serverless indexes for variable workloads and pod-based for predictable high-volume traffic.

## Reason
Serverless auto-scales and charges per query — ideal for variable or unknown workloads. Pod-based provides consistent latency for provisioned capacity.

## Bad Example
```python
# Pod-based for unknown workload — waste or constraints
client.create_index('products', dimension=1536, metric='cosine', pod_type='p1', replicas=2)
```

## Good Example
```python
# Serverless for variable workload
client.create_serverless_index('products', dimension=1536, metric='cosine')
```

## Exceptions
Predictable high-volume workloads where pod-based pricing is more cost-effective.

## Consequences Of Violation
Overpaying for idle capacity or hitting scaling limits during traffic spikes.

---
## Rule Name
Match Index Metric to Embedding Model

## Category
Design

## Rule
Always create the Pinecone index with the distance metric that matches your embedding model's training.

## Reason
Mismatched metrics cause semantically incorrect search results. Most text models use cosine.

## Bad Example
```python
# Euclidean for cosine-trained embeddings
client.create_index('products', dimension=1536, metric='euclidean')
```

## Good Example
```python
client.create_index('products', dimension=1536, metric='cosine')
```

## Exceptions
Embedding models documented to use dot product or Euclidean distance.

## Consequences Of Violation
Incorrect similarity ranking and reduced search quality.

---
## Rule Name
Use Metadata Filtering for Structured Queries

## Category
Framework Usage

## Rule
Always include relevant metadata fields during vector upsert in Pinecone for structured filtering.

## Reason
Metadata filtering during ANN search is more efficient than post-filter pruning. Without metadata, all filtering must happen in application code.

## Bad Example
```python
# No metadata — can't filter in query
client.upsert(index='products', vectors=[{'id': '1', 'values': [...]}])
```

## Good Example
```python
client.upsert(index='products', vectors=[{
    'id': '1',
    'values': [...],
    'metadata': {'category': 'electronics', 'price': 29.99}
}])
```

## Exceptions
Applications requiring no structured filtering on vector search.

## Consequences Of Violation
Inefficient post-filtering in application code and inability to use Pinecone's filter-integrated ANN.

---
## Rule Name
Monitor Pinecone Costs

## Category
Scalability

## Rule
Always set up cost monitoring and usage alerts for Pinecone serverless indexes.

## Reason
Serverless pricing scales with query volume. Without monitoring, traffic growth causes unexpected bills.

## Bad Example
```bash
# No cost monitoring
# Viral traffic -> unexpected charges
```

## Good Example
```bash
# Configure budget alerts in Pinecone dashboard
# Monitor query volume weekly
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected infrastructure bills and budget overruns.

---
## Rule Name
Cache Frequently Queried Results

## Category
Performance

## Rule
Always cache frequently executed vector search queries to reduce Pinecone costs and improve latency.

## Reason
Pinecone charges per query. Caching reduces costs and provides sub-millisecond responses for repeated queries.

## Bad Example
```php
// Every request queries Pinecone — even for identical queries
$results = $pinecone->query($vector, topK: 10);
```

## Good Example
```php
$cacheKey = 'search:' . md5(json_encode($vector));
$results = Cache::remember($cacheKey, 300, function () use ($vector) {
    return $pinecone->query($vector, topK: 10);
});
```

## Exceptions
Real-time search requiring absolutely fresh results.

## Consequences Of Violation
Unnecessary query costs for repeated searches and higher average latency.
