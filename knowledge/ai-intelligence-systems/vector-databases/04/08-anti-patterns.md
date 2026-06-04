# ECC Anti-Patterns — Vector Storage & Backup

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Vector Storage & Backup |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Backup of Vector Index — Index Corruption = Full Re-Embed
2. Storing Vectors Only in Vector DB — No Source Document Backup
3. Not Planning for Re-Index Downtime
4. No Rollback Plan for Failed Re-Embedding
5. Storing Full Vectors When Binary Quantization Suffices

---

## Repository-Wide Anti-Patterns

- Embedding API costs for re-index not budgeted
- No DR plan for vector DB region outage

---

## Anti-Pattern 1: No Vector Index Backup

### Category
Reliability

### Description
No backup of vector index — if corrupted, must re-embed all documents from scratch.

### Preferred Alternative
Regularly backup vector index. Store source documents separately so re-indexing is possible.

### Detection Checklist
- [ ] No vector index backup
- [ ] Full re-embed required on corruption
- [ ] No DR plan

---

## Anti-Pattern 2: Not Planning for Re-Index Downtime

### Category
Reliability

### Description
Embedding model upgrade or API deprecation requires full re-index — no plan for downtime during rebuild.

### Preferred Alternative
Build new index in parallel. Swap indexes when ready. Blue-green deployment for vector indexes.

### Detection Checklist
- [ ] No parallel index build
- [ ] Downtime during re-index
- [ ] No rollback plan
