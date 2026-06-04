---
## Rule Name
Start with Single-Vector Before Multi-Vector

## Category
Design

## Rule
Always implement single-vector per document before considering multi-vector approaches.

## Reason
Multi-vector search increases storage (one vector per chunk), latency (multiple comparisons), and infrastructure complexity. Majority of use cases are served by single-vector.

## Bad Example
```php
// Implementing ColBERT late interaction from the start
$vectors = $colbertModel->encode($document, perSentence: true);
```

## Good Example
```php
// Single embedding first
$vector = $embeddingModel->encode($document);
```

## Exceptions
Applications with long documents spanning multiple distinct topics where benchmarks prove multi-vector improves retrieval.

## Consequences Of Violation
Premature complexity, wasted development effort, and higher infrastructure costs without proven benefit.

---
## Rule Name
Use Qdrant Named Vectors for Multi-Vector

## Category
Framework Usage

## Rule
Use Qdrant's named vectors feature for multi-vector per point when multi-vector is justified.

## Reason
Named vectors provide built-in support for multiple vectors per point with independent search and filtering, avoiding custom implementation.

## Bad Example
```python
# Storing separate points for each vector
client.upsert("products", points=[
    {"id": 1, "vector": title_vector, "payload": {"aspect": "title"}},
    {"id": 1, "vector": desc_vector, "payload": {"aspect": "description"}},
])
```

## Good Example
```python
# Named vectors per point
client.upsert("products", points=[
    {"id": 1, "vector": {"title": [...], "description": [...]}}
])
```

## Exceptions
When not using Qdrant as the vector store.

## Consequences Of Violation
Complex manual mapping between vectors and documents, data duplication, and higher query complexity.

---
## Rule Name
Benchmark Multi-Vector Against Single-Vector Baseline

## Category
Testing

## Rule
Always benchmark multi-vector retrieval metrics against the single-vector baseline before production deployment.

## Reason
Multi-vector adds cost and complexity. Without quantitative proof of improvement, the additional overhead is not justified.

## Bad Example
```bash
# Deploying multi-vector without baseline comparison
# No evidence of improvement
```

## Good Example
```bash
# Compare recall@10:
# Single-vector recall: 0.82
# Multi-vector recall: 0.87 (5.9% improvement)
# Decision: accept if improvement justifies 3x storage cost
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unnecessary storage costs (3-10x), slower queries, and no measurable retrieval improvement.

---
## Rule Name
Plan Storage Requirements for Multi-Vector

## Category
Scalability

## Rule
Always calculate storage requirements for multi-vector before implementation; expect 5-10x the index size of single-vector.

## Reason
Each document stores multiple vectors instead of one. Storage scales linearly with the number of vectors per document, impacting both cost and query performance.

## Bad Example
```bash
# Assuming storage similar to single-vector
# 10M documents x 10 vectors each = 100M vectors
```

## Good Example
```python
storage_multiplier = vectors_per_document  # e.g., 5
estimated_storage = single_vector_storage * storage_multiplier
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Insufficient storage allocation, unexpected infrastructure costs, and performance degradation from index size growth.
