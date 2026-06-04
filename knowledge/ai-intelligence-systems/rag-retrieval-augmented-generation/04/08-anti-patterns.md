# ECC Anti-Patterns — RAG Evaluation & Metrics

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Evaluation & Metrics |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No RAG Evaluation — Quality Unknown
2. Evaluating Only Retrieval (Recall@K), Not Generation (Answer Correctness)
3. Manual Evaluation on a Few Examples — Not Representative
4. No Regression Testing — RAG Changes Break Previously Working Queries
5. Not Evaluating with Real User Queries

---

## Repository-Wide Anti-Patterns

- No baseline metrics before optimizing RAG pipeline
- Evaluation dataset not versioned

---

## Anti-Pattern 1: No RAG Evaluation

### Category
Reliability

### Description
RAG pipeline deployed without any metrics on retrieval quality or answer correctness.

### Preferred Alternative
Implement evaluation: create test dataset of query+expected-document pairs. Measure recall@K, MRR, answer correctness.

### Detection Checklist
- [ ] No RAG metrics
- [ ] Quality unknown
- [ ] Cannot detect regressions

---

## Anti-Pattern 2: Evaluating Only Retrieval, Not Generation

### Category
Testing

### Description
Measuring retrieval recall but not whether the LLM correctly uses retrieved context.

### Preferred Alternative
Evaluate both: retrieval metrics (recall@K) and generation metrics (answer correctness, citation accuracy).

### Detection Checklist
- [ ] Only retrieval metrics
- [ ] LLM may ignore retrieved context
- [ ] Answer quality unknown
