# ECC Anti-Patterns — RAG Security & Access Control

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Security & Access Control |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Document-Level Access Control — All Users See All Documents
2. Access Control at Application Layer Only — Vector Index Exposes All Data
3. Embedding Sensitive Documents Without Encryption
4. No Audit Logging on Retrieved Documents
5. Shared Vector Index for Multi-Tenant Without Tenant Isolation

---

## Repository-Wide Anti-Patterns

- Retrieval results not filtered by user permission before LLM injection
- No data retention policy on indexed documents

---

## Anti-Pattern 1: No Document-Level Access Control

### Category
Security

### Description
All users retrieve from same vector index — no per-document access filtering.

### Preferred Alternative
Implement access control via metadata filtering. Add `user_id`, `role`, or `permission_group` to chunk metadata and filter at retrieval time.

### Detection Checklist
- [ ] No access control on documents
- [ ] All documents visible to all users
- [ ] No user-specific filtering

---

## Anti-Pattern 2: Access Control at Application Layer Only

### Category
Security

### Description
Vector index contains all documents, application filters results post-retrieval — sensitive docs may appear in search results before filtering.

### Preferred Alternative
Apply access control filters at the database query level, before vector search. Use `where('access_level', '<=', $userLevel)` combined with vector clause.

### Detection Checklist
- [ ] Post-retrieval access filtering
- [ ] Sensitive docs visible pre-filter
- [ ] No query-level access control
