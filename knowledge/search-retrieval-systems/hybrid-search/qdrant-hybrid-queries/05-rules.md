---
## Rule Name
Configure Dense and Sparse Named Vectors

## Category
Architecture

## Rule
Always configure both `dense` and `sparse` named vectors in the Qdrant collection for native hybrid search.

## Reason
Qdrant hybrid search requires two named vector fields. Without both, the hybrid API returns an error.

## Bad Example
```python
# Only dense vector configured — hybrid queries fail
client.create_collection("products", vectors_config=VectorParams(size=1536, distance=Distance.COSINE))
```

## Good Example
```python
client.create_collection(
    "products",
    vectors_config={
        "dense": VectorParams(size=1536, distance=Distance.COSINE),
        "sparse": SparseVectorParams()
    }
)
```

## Exceptions
Using Qdrant for dense-only or sparse-only search, not hybrid.

## Consequences Of Violation
Hybrid queries fail at runtime with missing vector configuration.

---
## Rule Name
Generate Sparse Vectors Internally

## Category
Architecture

## Rule
Use Qdrant's built-in sparse vector extraction from text rather than external sparse embedding models.

## Reason
Qdrant handles sparse vector generation internally, reducing infrastructure dependencies and external API calls.

## Bad Example
```python
# External sparse vector generation — extra dependency
sparse_vector = external_sparse_model.encode(text)
```

## Good Example
```python
# Qdrant generates sparse vector internally from text
# No external sparse model needed
```

## Exceptions
Applications needing specific sparse embedding models (SPLADE, SPLINE) for higher quality.

## Consequences Of Violation
Extra infrastructure and API dependencies without leveraging Qdrant's built-in capability.

---
## Rule Name
Test Fusion Balance Between Dense and Sparse

## Category
Testing

## Rule
Always test the contribution balance between dense and sparse paths in hybrid queries.

## Reason
One path may dominate fusion results if its recall is consistently better or worse. Balance ensures both paths contribute meaningfully.

## Bad Example
```bash
# Assuming 50-50 contribution — one path may dominate
```

## Good Example
```python
hybrid_results = client.query_points(collection, query=[dense_vector, sparse_vector], prefetch=[...], fusion="rrf")
# Check: what fraction of top-20 came from dense vs sparse?
analyze_contributions(hybrid_results)
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Hybrid search effectively operates as single-path search if one path dominates.

---
## Rule Name
Verify Payload Filtering with Hybrid Queries

## Category
Testing

## Rule
Always verify that payload (metadata) filtering works correctly alongside hybrid queries.

## Reason
Payload filtering applied to dense + sparse combined results may behave differently than filtering individual paths.

## Bad Example
```python
# Assuming filter works identically with hybrid — not verified
```

## Good Example
```python
hybrid_results = client.query_points(
    collection, query=[dense_vec, sparse_vec], fusion="rrf",
    filter=Filter(must=[FieldCondition(key="category", match=MatchValue(value="electronics"))])
)
assert len(hybrid_results) > 0  # Verify filter + hybrid work together
```

## Exceptions
Collections without any metadata filters.

## Consequences Of Violation
Filtered hybrid queries returning incorrect results or errors.
