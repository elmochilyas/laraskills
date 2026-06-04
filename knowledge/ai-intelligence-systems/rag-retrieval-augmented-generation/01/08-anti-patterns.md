# ECC Anti-Patterns — RAG Knowledge Unit 01

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Grounding — LLM Answers from Training Data, Not Retrieved Docs
2. Retrieving Without Context Injection — Data Retrieved but Never Used
3. No Citation in Responses — Can't Verify LLM Claims
4. Indexing Without Metadata — Can't Filter or Scope
5. No Re-Ranking — Top-K Results Include Irrelevant Matches

---

## Repository-Wide Anti-Patterns

- RAG pipeline not monitored — retrieval quality unknown
- Embeddings never updated after initial ingestion

---

## Anti-Pattern 1: No Grounding

### Category
Reliability

### Description
Retrieved documents not injected into LLM prompt — LLM answers from training data, not the provided documents.

### Preferred Alternative
Inject retrieved chunks into agent instructions as grounding context. The LLM must answer based on provided context.

### Detection Checklist
- [ ] Retrieved data not in LLM prompt
- [ ] LLM answers from training data
- [ ] No grounding mechanism

---

## Anti-Pattern 2: No Citations in Responses

### Category
Reliability

### Description
LLM returns answers without citing which retrieved document supports each claim.

### Preferred Alternative
Instruct the LLM to cite source documents. Include chunk metadata (document ID, section, page) in citations.

### Detection Checklist
- [ ] Answers without citations
- [ ] Cannot verify claims
- [ ] No chunk metadata in context
