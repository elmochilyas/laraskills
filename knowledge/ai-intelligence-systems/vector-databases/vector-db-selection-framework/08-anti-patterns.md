# ECC Anti-Patterns — Vector Database Selection Framework

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Vector Database Selection Framework |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Choosing Vector DB Without Scale Considerations
2. pgvector for Sub-Millisecond Latency Requirements
3. Dedicated Vector DB for <10K Vectors
4. No Hybrid Search Support Requirements Check
5. Choosing Based on Hype Not Workload

---

## Anti-Pattern 1: Choosing Without Scale Considerations

### Category
Architecture

### Description
Selecting a vector database without projecting vector count growth over 12–24 months.

### Preferred Alternative
Benchmark candidates at expected scale. Factor in vector dimensions, query QPS, and latency requirements.

### Detection Checklist
- [ ] No scale projection
- [ ] Vector DB fails at production volume
- [ ] Migration needed mid-project

---

## Anti-Pattern 2: pgvector for Sub-Millisecond Latency

### Category
Architecture

### Description
Using pgvector when workload requires <5ms p99 latency at >1000 QPS — dedicated vector DB needed.

### Preferred Alternative
Use pgvector for integrated workloads (<100 QPS, >50ms OK). Dedicated DB (Pinecone, Qdrant) for high-throughput, low-latency.

### Detection Checklist
- [ ] Sub-ms latency required
- [ ] High QPS with pgvector
- [ ] pgvector latency exceeds requirements
