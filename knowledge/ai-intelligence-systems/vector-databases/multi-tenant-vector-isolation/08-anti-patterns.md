# ECC Anti-Patterns — Multi-Tenant Vector Isolation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Multi-Tenant Vector Isolation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Separate Index Per Tenant — Resource Waste
2. Single Index Without Tenant Metadata Filter
3. No Tenant ID in Chunk Metadata
4. Tenant Removal Leaves Orphan Vectors
5. Shared HNSW Index — Tenant A Data in Tenant B's Results

---

## Repository-Wide Anti-Patterns

- No tenant isolation testing — cross-tenant data leakage undetected
- Tenant deletion cascades slowly without cleanup confirmation

---

## Anti-Pattern 1: Separate Index Per Tenant

### Category
Performance

### Description
Creating a dedicated index/collection per tenant — hits resource limits, increases cost.

### Preferred Alternative
Single index with tenant metadata filtering. Use namespaces (Pinecone) or payload filters (Qdrant).

### Detection Checklist
- [ ] Per-tenant indexes
- [ ] Index count limits reached
- [ ] Namespace/payload filtering unused

---

## Anti-Pattern 2: Single Index Without Metadata Filter

### Category
Security

### Description
Single index with no tenant ID in metadata — every query returns results from all tenants.

### Preferred Alternative
Include `tenant_id` in every vector's metadata. Filter by tenant_id on every query.

### Detection Checklist
- [ ] No tenant_id in metadata
- [ ] Cross-tenant results returned
- [ ] Data leakage between tenants
