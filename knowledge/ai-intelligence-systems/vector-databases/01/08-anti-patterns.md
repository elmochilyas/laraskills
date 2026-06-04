# ECC Anti-Patterns — Vector Database Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Vector DB Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Choosing Vector DB Without Understanding Distances
2. Cosine Distance for Normalized Vectors — Unnecessary Computation
3. No Dimensionality Reduction — Full Dimension Search Slows Queries
4. Ignoring Vector Quantization for Large Datasets
5. No Benchmarking Before Production Deployment

---

## Repository-Wide Anti-Patterns

- Vector dimensions not matched between embedding model and index
- No monitoring of vector index size vs. RAM

---

## Anti-Pattern 1: Choosing Distance Without Understanding

### Category
Performance

### Description
Using cosine distance when vectors are already normalized — cosine = inner product, but with extra normalization step.

### Preferred Alternative
Use inner product for normalized vectors. Use cosine when vectors are not normalized.

### Detection Checklist
- [ ] Cosine on normalized vectors
- [ ] Unnecessary normalization step
- [ ] Performance wasted

---

## Anti-Pattern 2: No Benchmarking Before Production

### Category
Reliability

### Description
Deploying vector DB without benchmarking latency, recall, and QPS at expected scale.

### Preferred Alternative
Benchmark: insert target vector count, measure recall@10 at varying ef values, p50/p99 latencies.

### Detection Checklist
- [ ] No vector DB benchmarks
- [ ] Production performance unknown
- [ ] Surprise latency at scale
