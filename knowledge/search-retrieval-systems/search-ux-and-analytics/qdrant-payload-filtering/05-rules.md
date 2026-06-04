---
## Rule Name
Store Filterable Metadata in Point Payload

## Category
Architecture

## Rule
Always store filterable metadata (category, status, tenant_id) as Qdrant point payload during upsert.

## Reason
Qdrant payload filters during HNSW traversal. Metadata must be stored as payload — it cannot be added after insertion.

## Bad Example
```python
# No payload — cannot filter
client.upsert(collection, points=[PointStruct(id=1, vector=[...])])
```

## Good Example
```python
client.upsert(collection, points=[PointStruct(
    id=1,
    vector=[...],
    payload={"category": "electronics", "price": 29.99, "in_stock": True}
)])
```

## Exceptions
Collections requiring no metadata filtering.

## Consequences Of Violation
Inability to filter by metadata — requires re-indexing to add payload.

---
## Rule Name
Create Payload Indexes on Filtered Fields

## Category
Performance

## Rule
Always create Qdrant payload indexes on frequently filtered fields.

## Reason
Without payload indexes, filtered ANN requires scanning all points' payloads, negating the performance benefit of filtered HNSW.

## Bad Example
```python
# No payload index — slow filtered queries
client.search(collection, query_vector=vec, query_filter=Filter(...))
```

## Good Example
```python
client.create_payload_index(collection, field_name="category", field_type=PayloadSchemaType.KEYWORD)
client.create_payload_index(collection, field_name="price", field_type=PayloadSchemaType.FLOAT)
```

## Exceptions
Very small collections (<10K points) where payload scan is acceptable.

## Consequences Of Violation
Slow filtered vector queries defeating the purpose of filter-integrated ANN.

---
## Rule Name
Keep Payload Lean

## Category
Performance

## Rule
Store only metadata needed for filtering in payload; avoid large text content.

## Reason
Large payloads increase index size, slow segment optimization, and increase network transfer.

## Bad Example
```python
point = {"id": 1, "vector": [...], "payload": {"full_text": "5000 word document..."}}
```

## Good Example
```python
point = {"id": 1, "vector": [...], "payload": {"category": "electronics", "doc_id": 42}}
# Full text stored in primary database, not vector store
```

## Exceptions
Applications where payload retrieval reduces total infrastructure complexity.

## Consequences Of Violation
Larger index sizes, slower performance, and higher memory usage.
