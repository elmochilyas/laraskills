---
## Rule Name
Configure Both Sparse and Dense Fields

## Category
Architecture

## Rule
Always configure both sparse_vector and dense_vector fields in the Milvus collection for hybrid search.

## Reason
Milvus hybrid search requires both field types. Missing one causes hybrid query failures.

## Bad Example
```python
# Only dense vector — hybrid queries won't work
collection = Collection("products", schema=CollectionSchema(fields=[dense_field, id_field, text_field]))
```

## Good Example
```python
dense_field = FieldSchema(name="dense_vector", dtype=DataType.FLOAT_VECTOR, dim=1536)
sparse_field = FieldSchema(name="sparse_vector", dtype=DataType.SPARSE_FLOAT_VECTOR)
collection = Collection("products", schema=CollectionSchema(fields=[id_field, text_field, dense_field, sparse_field]))
```

## Exceptions
Using Milvus for dense-only or sparse-only search, not hybrid.

## Consequences Of Violation
Hybrid queries fail at runtime because the sparse field is missing from the schema.

---
## Rule Name
Generate Sparse Vectors Internally

## Category
Architecture

## Rule
Use Milvus's built-in BM25 sparse vector generation rather than external embedding services.

## Reason
Milvus handles BM25 sparse vector generation internally from raw text, eliminating external API calls and simplifying the pipeline.

## Bad Example
```python
# External BM25 generation — extra complexity
sparse_vector = external_bm25_model.encode(text)
```

## Good Example
```python
# Milvus generates BM25 sparse vector from text
# Pass raw text during indexing — Milvus handles the rest
```

## Exceptions
Applications needing non-BM25 sparse vector models (SPLADE, SPLINE).

## Consequences Of Violation
Unnecessary external dependencies and network calls for sparse vector generation.

---
## Rule Name
Benchmark Individual Path Recall Before Fusing

## Category
Testing

## Rule
Always benchmark dense-only and sparse-only recall independently before evaluating hybrid fusion.

## Reason
Fusion cannot fix a fundamentally broken retrieval path. Optimizing each path first ensures hybrid quality reflects fusion benefit, not path weakness.

## Bad Example
```python
# Tuning fusion without checking individual paths
# One path may have terrible recall — fusion can't fix it
```

## Good Example
```python
dense_recall = benchmark_dense_only()
sparse_recall = benchmark_sparse_only()
if sparse_recall < 0.7:
    improve_sparse_indexing()
hybrid_recall = benchmark_hybrid()
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Poor hybrid results attributed to fusion, when the real problem is a weak individual retrieval path.
