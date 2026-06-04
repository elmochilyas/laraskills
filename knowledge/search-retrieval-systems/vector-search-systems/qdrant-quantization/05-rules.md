---
## Rule Name
Start with Scalar Quantization

## Category
Performance

## Rule
Use scalar quantization (float32 to int8) as the default quantization strategy for Qdrant; it provides 4x memory reduction with minimal recall loss.

## Reason
Scalar quantization offers the best memory-to-recall ratio (4x compression, >98% recall). Product and binary quantization sacrifice more recall.

## Bad Example
```python
# Binary quantization from the start — unnecessary recall loss
quantization_config=models.BinaryQuantization(binary=models.BinaryQuantizationConfig(always_ram=True))
```

## Good Example
```python
# Scalar quantization first — 4x savings, <2% recall loss
quantization_config=models.ScalarQuantization(scalar=models.ScalarQuantizationConfig(type="int8", always_ram=True))
```

## Exceptions
Datasets where 32x compression (binary) or 8x compression (product) is required for memory constraints.

## Consequences Of Violation
Unnecessary recall loss when scalar quantization would have been sufficient.

---
## Rule Name
Enable Rescoring for Quantized Results

## Category
Performance

## Rule
Always enable rescoring when using quantization in Qdrant to recover recall loss.

## Reason
Rescoring re-ranks quantized top-K results using original vectors, recovering most accuracy lost during quantization.

## Bad Example
```python
search_params=models.SearchParams(quantization=models.QuantizationSearchParams(rescore=False))
```

## Good Example
```python
search_params=models.SearchParams(
    quantization=models.QuantizationSearchParams(rescore=True, oversampling=2.0)
)
```

## Exceptions
Latency-critical applications where rescoring overhead is unacceptable and recall loss is acceptable.

## Consequences Of Violation
Lower recall than achievable with minimal latency overhead from rescoring.

---
## Rule Name
Benchmark Quantization Impact Before Production

## Category
Testing

## Rule
Always benchmark recall impact of each quantization strategy with your specific dataset before production.

## Reason
Quantization impact varies by embedding distribution. Assumed recall loss may be higher or lower than actual.

## Bad Example
```bash
# Deploying quantization without benchmarking
# Unaware of 5% recall degradation
```

## Good Example
```python
scalar_recall = benchmark('scalar')
product_recall = benchmark('product')
binary_recall = benchmark('binary')
# Choose strategy with acceptable recall for workload
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected search quality degradation in production.

---
## Rule Name
Use Hybrid Quantization for Cold vs Hot Data

## Category
Architecture

## Rule
Consider hybrid quantization: quantize older/cold vectors and keep recent/hot vectors at full precision.

## Reason
Recent data is queried more frequently. Keeping recent vectors full-precision improves recall for common queries while saving memory on cold data.

## Bad Example
```python
# Same quantization for all data — no distinction
quantization_config=models.ScalarQuantization(scalar=...)
```

## Good Example
```python
# Hot data: full precision
# Cold data: quantized
# Qdrant doesn't support per-point quantization — segment strategy needed
```

## Exceptions
Workloads where all data is queried with equal frequency.

## Consequences Of Violation
Unnecessary recall loss for frequently queried recent data or wasted memory on infrequently queried old data.
