---
## Rule Name
Match Distance Function to Embedding Model's Training Metric

## Category
Design

## Rule
Always use the distance function that matches your embedding model's training objective; use cosine distance as default for text embeddings.

## Reason
Using a mismatched distance function (e.g., L2 on a cosine-trained model) reduces retrieval accuracy significantly.

## Bad Example
```sql
-- Using L2 on OpenAI embeddings (cosine-trained)
SELECT id, embedding <-> '[0.1, 0.2, ...]' AS distance FROM items ORDER BY distance;
```

## Good Example
```sql
-- Using cosine (matching OpenAI training)
SELECT id, embedding <=> '[0.1, 0.2, ...]' AS distance FROM items ORDER BY distance;
```

## Exceptions
When benchmarking proves an alternative distance function performs better on your specific data.

## Consequences Of Violation
Suboptimal retrieval accuracy, reduced search quality, and degraded user experience.

---
## Rule Name
Use Cosine Distance as Default for Text Embeddings

## Category
Design

## Rule
Use cosine distance (`<=>`) as the default distance metric for text embedding models.

## Reason
Most modern text embedding models (OpenAI, BGE, E5, Cohere, sentence-transformers) are trained with cosine similarity.

## Bad Example
```sql
-- Inner product as default
SELECT id, embedding <#> '[0.1, 0.2, ...]' AS similarity FROM items ORDER BY similarity DESC;
```

## Good Example
```sql
-- Cosine as default
SELECT id, embedding <=> '[0.1, 0.2, ...]' AS distance FROM items ORDER BY distance;
```

## Exceptions
Embedding models explicitly documented to use dot product (Word2Vec, GloVe, some recommendation models).

## Consequences Of Violation
Reduced semantic search quality and inconsistent behavior across different embedding models.

---
## Rule Name
Create Index with Matching Operator Class

## Category
Performance

## Rule
Always create the ANN index with the operator class that matches the distance function used in queries.

## Reason
pgvector ANN indexes are operator-class-specific. A cosine index cannot serve L2 queries efficiently.

## Bad Example
```sql
-- Cosine index created
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);

-- But querying with L2 — index not used
SELECT id, embedding <-> '[0.1, ...]' AS distance FROM items ORDER BY distance;
```

## Good Example
```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);
-- Query with matching operator
SELECT id, embedding <=> '[0.1, ...]' AS distance FROM items ORDER BY distance;
```

## Exceptions
No common exceptions.

## Consequences Of Violation
ANN indexes are not used for queries, falling back to slow exact search (full table scan).

---
## Rule Name
Use L2 for Normalized Embeddings

## Category
Performance

## Rule
Use L2 distance for normalized vectors (unit length) since L2 and cosine produce the same ordering but L2 is faster to compute.

## Reason
For normalized vectors, cosine similarity and L2 distance order results identically, but L2 computation requires fewer operations.

## Bad Example
```sql
-- Cosine on normalized vectors — same ordering, slower compute
SELECT id, embedding <=> '[0.1, ...]' AS distance FROM items ORDER BY distance;
```

## Good Example
```sql
-- L2 on normalized vectors — same ordering, faster
SELECT id, embedding <-> '[0.1, ...]' AS distance FROM items ORDER BY distance;
```

## Exceptions
When code clarity prefers using cosine explicitly despite equivalent ordering.

## Consequences Of Violation
Slightly higher query latency (marginal on small datasets, measurable at scale).

---
## Rule Name
Benchmark Alternative Distance Functions

## Category
Testing

## Rule
Always benchmark multiple distance functions with your specific data and queries before settling on one.

## Reason
Different embedding models and data distributions may perform differently with different distance metrics. Default assumptions may be suboptimal.

## Bad Example
```bash
# Assuming cosine is best without testing
# May miss better results from L2 or inner product
```

## Good Example
```python
metrics = {'cosine': 0.85, 'l2': 0.83, 'ip': 0.81}
# cosine wins for this dataset
selected = max(metrics, key=metrics.get)
```

## Exceptions
Established embedding models with well-documented distance metric.

## Consequences Of Violation
Suboptimal retrieval accuracy from using a non-optimal distance function for the specific data.
