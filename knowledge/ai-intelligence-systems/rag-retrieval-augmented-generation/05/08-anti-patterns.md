# ECC Anti-Patterns — RAG Ingestion Pipeline

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Ingestion Pipeline |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Synchronous Ingestion of Large Documents — Blocks Worker
2. No Idempotency — Re-ingesting Document Creates Duplicates
3. Ingestion Without Error Handling — One Bad Document Fails All
4. No Incremental Ingestion — Full Re-Index on Every Run
5. No Validation of Ingested Content

---

## Repository-Wide Anti-Patterns

- Ingestion pipeline not observable — no progress tracking
- Ingestion without deduplication by document hash

---

## Anti-Pattern 1: Synchronous Ingestion of Large Documents

### Category
Performance

### Description
Processing 100+ page documents synchronously in HTTP request — blocks worker for seconds.

### Preferred Alternative
Queue ingestion jobs. Process one document per job with progress tracking.

### Detection Checklist
- [ ] Synchronous document ingestion
- [ ] HTTP request blocked during processing
- [ ] No queue for large documents

---

## Anti-Pattern 2: No Idempotency

### Category
Reliability

### Description
Re-running ingestion creates duplicate chunks — same content embedded and stored multiple times.

### Preferred Alternative
Implement idempotency via document hash. Skip unchanged documents. Update changed documents.

### Detection Checklist
- [ ] Duplicate chunks on re-ingest
- [ ] No document hash tracking
- [ ] Full re-index without dedup
