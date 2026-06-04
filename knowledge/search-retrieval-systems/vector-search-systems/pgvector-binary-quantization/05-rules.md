---
## Rule Name
Always Use Re-Ranking with Binary Quantization

## Category
Performance

## Rule
Always implement re-ranking with original float32 vectors after binary ANN search; never use binary-only search for final results.

## Reason
Binary quantization alone loses significant recall (5-15%). Re-ranking with original float32 vectors recovers most accuracy loss.

## Bad Example
```sql
-- Binary-only search — high recall loss
SELECT id FROM items ORDER BY binary_embedding <=> binary_query LIMIT 10;
```

## Good Example
```sql
-- Binary ANN + float32 re-ranking
WITH candidates AS (
    SELECT id FROM items ORDER BY binary_embedding <=> binary_query LIMIT 100
)
SELECT id, original_embedding <=> $query_vec AS distance
FROM items WHERE id IN (SELECT id FROM candidates)
ORDER BY distance LIMIT 10;
```

## Exceptions
Applications where approximate results with >15% recall loss are acceptable.

## Consequences Of Violation
Significant search quality degradation with missing relevant results.

---
## Rule Name
Test Embedding Models for Binary Suitability

## Category
Testing

## Rule
Always test binary quantization effectiveness with your specific embedding model before production.

## Reason
Not all embedding models produce signed values suitable for binary quantization. Models with all-positive outputs may lose more accuracy.

## Bad Example
```bash
# Deploying binary quantization without testing
# Assumption all models work equally well
```

## Good Example
```python
# Compare float32 recall vs binary+rerank recall
float_recall = evaluate_recall(float32_vectors)
binary_recall = evaluate_recall(binary_vectors)
accept = (float_recall - binary_recall) < 0.02  # <2% loss acceptable
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unacceptable recall loss in production, user complaints about missing search results.

---
## Rule Name
Tune Binary Query Parameters

## Category
Performance

## Rule
Always tune `binary_quantization.ef_search` and `binary_quantization.rescore` parameters for your dataset.

## Reason
Default parameters may not provide optimal recall/latency tradeoff. Tuning adjusts the binary search breadth and re-ranking candidate count.

## Bad Example
```sql
-- Default parameters — may miss optimal tradeoff
SET hnsw.ef_search = 200;
```

## Good Example
```sql
SET hnsw.ef_search = 400;  -- More candidates from binary search
SET binary_quantization.rescore = 50;  -- Re-rank top-50 with float32
```

## Exceptions
Small datasets where defaults already provide acceptable recall.

## Consequences Of Violation
Suboptimal balance between query latency and recall quality.

---
## Rule Name
Consider halfvec Before Binary Quantization

## Category
Design

## Rule
Evaluate halfvec (float16) before binary quantization; halfvec provides 50% storage savings with <1% accuracy loss vs binary's 32x compression with 5-15% loss.

## Reason
If 2x compression is sufficient, halfvec has much better accuracy characteristics while still providing meaningful storage reduction.

## Bad Example
```sql
-- Jumping straight to binary quantization
ALTER TABLE items ADD COLUMN binary_embedding bit(1536);
```

## Good Example
```sql
-- Start with halfvec for 50% savings
ALTER TABLE items ADD COLUMN half_embedding halfvec(1536);
-- Only use binary if more compression needed
```

## Exceptions
Datasets exceeding 10M vectors where only binary's 32x compression provides adequate memory footprint.

## Consequences Of Violation
Unnecessary recall loss if 2x compression (halfvec) would have been sufficient.
