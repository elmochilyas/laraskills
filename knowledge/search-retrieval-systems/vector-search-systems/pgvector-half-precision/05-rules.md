---
## Rule Name
Benchmark Accuracy Loss Before Deploying Reduced-Precision Vectors

## Category
Testing

## Rule
Always benchmark recall loss of halfvec, bit, and sparsevec against your float32 baseline before production deployment.

## Reason
Different embedding models and data distributions respond differently to reduced precision. Assumed accuracy loss may be acceptable or catastrophic.

## Bad Example
```bash
# Switching to halfvec without benchmarking
# Unaware of 5% recall loss
```

## Good Example
```python
float_recall = evaluate(float32_vectors)
half_recall = evaluate(halfvec_vectors)
loss = float_recall - half_recall
# 0.3% loss — acceptable
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected search quality degradation and user-facing retrieval problems.

---
## Rule Name
Use halfvec as Default Storage Optimization

## Category
Performance

## Rule
Prefer halfvec (float16) over binary quantization for storage optimization; 50% savings with <1% accuracy loss for most models.

## Reason
halfvec provides the best accuracy-to-compression ratio. Binary quantization (32x) sacrifices significantly more recall.

## Bad Example
```sql
-- Jumping directly to binary quantization
ALTER TABLE items ADD COLUMN binary_embedding bit(1536);
```

## Good Example
```sql
-- Start with halfvec
ALTER TABLE items ADD COLUMN half_embedding halfvec(1536);
-- Only use binary if more compression needed
```

## Exceptions
Datasets exceeding memory limits where only 32x compression (binary) is sufficient.

## Consequences Of Violation
Unnecessary recall loss when 50% compression (halfvec) would have been sufficient.

---
## Rule Name
Consider Re-ranking with Reduced-Precision Vectors

## Category
Architecture

## Rule
Use reduced-precision vectors for ANN search and re-rank with full-precision float32 for final results.

## Reason
Compressed vectors provide fast candidate retrieval; re-ranking with original vectors recovers most accuracy loss.

## Bad Example
```sql
-- direct halfvec search — final results from compressed vectors
SELECT id FROM items ORDER BY half_embedding <=> $query LIMIT 10;
```

## Good Example
```sql
-- halfvec ANN + float32 re-rank
WITH candidates AS (
    SELECT id FROM items ORDER BY half_embedding <=> $query LIMIT 100
)
SELECT id, embedding <=> $query AS distance
FROM items WHERE id IN (SELECT id FROM candidates)
ORDER BY distance LIMIT 10;
```

## Exceptions
When even 2x compression provides sufficient memory savings and recall loss is acceptable.

## Consequences Of Violation
Unnecessary accuracy loss from returning compressed-vector results directly.

---
## Rule Name
Match Distance Function to Vector Type

## Category
Design

## Rule
Always use the correct distance function for each pgvector vector type: cosine for halfvec, Hamming for bit, L2 for sparsevec.

## Reason
Each vector type supports different distance functions. Using an unsupported function causes runtime errors.

## Bad Example
```sql
-- Hamming distance on halfvec — unsupported
SELECT id, half_embedding <-> binary_query FROM items;
```

## Good Example
```sql
-- Cosine for halfvec
SELECT id, half_embedding <=> $query FROM items;

-- Hamming for bit
SELECT id, bit_embedding <-> bit_query FROM items;
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Runtime query errors and application failures.
