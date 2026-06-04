---
## Rule Name
Include Metadata During Upsert

## Category
Architecture

## Rule
Always include all filterable metadata alongside vectors during Pinecone upsert.

## Reason
Pinecone applies metadata filters during HNSW traversal. Metadata must be present at upsert time — it cannot be added retrospectively.

## Bad Example
```python
# No metadata — cannot filter
index.upsert(vectors=[("id1", [0.1, 0.2, ...])])
```

## Good Example
```python
index.upsert(vectors=[("id1", [0.1, 0.2, ...], {
    "category": "electronics",
    "price": 29.99,
    "in_stock": True
})])
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Inability to filter by metadata — requires re-indexing to add metadata.

---
## Rule Name
Use $eq for Exact Match Filtering

## Category
Performance

## Rule
Use `$eq` operator for exact metadata matches (category, status, tenant_id) as it is the most efficient Pinecone filter.

## Reason
`$eq` is optimized for exact value lookups. Avoid string operations or `$in` with single values.

## Bad Example
```python
index.query(vector=vec, filter={"category": {"$in": ["electronics"]}}, top_k=10)
```

## Good Example
```python
index.query(vector=vec, filter={"category": {"$eq": "electronics"}}, top_k=10)
```

## Exceptions
Multi-value filters where `$in` with multiple values is necessary.

## Consequences Of Violation
Slightly less efficient filters for single-value lookups.

---
## Rule Name
Combine Namespaces with Metadata Filters

## Category
Architecture

## Rule
Use Pinecone namespaces for top-level tenant isolation and metadata filters for sub-filtering.

## Reason
Namespaces provide logical isolation within an index. Combining with metadata filters reduces filter complexity and improves query performance.

## Bad Example
```python
# Only namespace or only metadata — not using both levels
index.query(vector=vec, filter={"tenant_id": {"$eq": "tenant_42"}})
```

## Good Example
```python
# Namespace for tenant, metadata for sub-filtering
index.query(vector=vec, namespace="tenant_42", filter={"category": {"$eq": "electronics"}})
```

## Exceptions
Single-tenant applications where namespaces aren't needed.

## Consequences Of Violation
Increased filter complexity and slower queries from not using namespace-level partitioning.
