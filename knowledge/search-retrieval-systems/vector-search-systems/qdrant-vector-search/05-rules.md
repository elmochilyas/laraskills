---
## Rule Name
Configure HNSW Parameters for Dataset Size

## Category
Performance

## Rule
Always tune Qdrant HNSW parameters (`m`, `ef_construct`, `ef_search`) based on your dataset size and recall requirements.

## Reason
Default parameters are conservative. Tuning improves recall/latency tradeoff significantly for your specific workload.

## Bad Example
```python
# Default parameters — may be suboptimal
client.create_collection("products", vectors_config=VectorParams(size=1536, distance=Distance.COSINE))
```

## Good Example
```python
client.create_collection(
    "products",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    hnsw_config=HnswConfigDiff(m=16, ef_construct=200)
)
# Query with tuned ef_search
client.search(collection_name="products", query_vector=vector, search_params=SearchParams(hnsw_ef=256))
```

## Exceptions
Small datasets (<100K vectors) where defaults provide sufficient quality.

## Consequences Of Violation
Suboptimal query performance — either slower than necessary or lower recall than achievable.

---
## Rule Name
Use Payload Filtering for Efficient Metadata Search

## Category
Performance

## Rule
Always use Qdrant's payload filtering for metadata constraints instead of post-filtering results in application code.

## Reason
Qdrant applies filters during HNSW traversal (filter-integrated ANN). Post-filtering requires retrieving more candidates and wastes resources on discarded results.

## Bad Example
```python
# Post-filtering — inefficient
results = client.search(collection_name="products", query_vector=vector, limit=100)
filtered = [r for r in results if r.payload.get('category') == 'electronics']
```

## Good Example
```python
# Filtered ANN — efficient
results = client.search(
    collection_name="products",
    query_vector=vector,
    query_filter=Filter(must=[FieldCondition(key="category", match=MatchValue(value="electronics"))]),
    limit=10
)
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Wasted resources on retrieving then discarding irrelevant results, and potential for missing relevant filtered results.

---
## Rule Name
Enable Quantization for Large Datasets

## Category
Performance

## Rule
Enable Qdrant quantization for any dataset exceeding 1M vectors to manage memory footprint.

## Reason
Qdrant stores vectors in memory. Without quantization, large datasets exceed available RAM, causing swapping or OOM.

## Bad Example
```python
# No quantization — 10M vectors may exceed RAM
client.create_collection("products", vectors_config=VectorParams(size=1536, distance=Distance.COSINE))
```

## Good Example
```python
client.create_collection(
    "products",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    quantization_config=ScalarQuantization(scalar=ScalarQuantizationConfig(type="int8"))
)
```

## Exceptions
Small datasets (<1M vectors) that fit in memory without compression.

## Consequences Of Violation
OOM crashes, swapping, and degraded query performance.

---
## Rule Name
Keep Payload Lean

## Category
Performance

## Rule
Store only metadata needed for filtering in Qdrant payload; avoid storing large text content.

## Reason
Large payloads increase index size, slow down segment optimization, and increase network transfer time.

## Bad Example
```python
# Storing full document text in payload
point = {"id": 1, "vector": [...], "payload": {"content": "5000 word document..."}}
```

## Good Example
```python
# Store only filterable metadata
point = {"id": 1, "vector": [...], "payload": {"category": "electronics", "price": 29.99, "doc_id": 42}}
# Document content stored in database, not vector store
```

## Exceptions
Applications where payload retrieval reduces total infrastructure complexity.

## Consequences Of Violation
Slower queries, larger index sizes, and higher memory usage.
