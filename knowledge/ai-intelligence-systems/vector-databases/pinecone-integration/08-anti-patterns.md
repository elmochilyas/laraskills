# ECC Anti-Patterns — Pinecone Integration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Pinecone Integration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. One Index Per Tenant — Index Count Limits Hit Quickly
2. No Metadata Filtering — Vector-Only Search Without Metadata Scoping
3. Not Using Namespaces for Multi-Tenancy
4. Embedding Dimension Mismatch Between Index and Model
5. No Pod Type Sizing for Workload

---

## Repository-Wide Anti-Patterns

- Pinecone index not monitored for pod utilization
- No backup strategy for Pinecone index data

---

## Anti-Pattern 1: One Index Per Tenant

### Category
Architecture

### Description
Creating a separate Pinecone index for each tenant — hits index count limits, increases management overhead.

### Preferred Alternative
Use Pinecone namespaces within a single index for tenant isolation.

### Detection Checklist
- [ ] Per-tenant indexes
- [ ] Index count approaching limit
- [ ] Namespace feature unused

---

## Anti-Pattern 2: No Metadata Filtering

### Category
Reliability

### Description
Vector search without metadata filtering — returns results from all tenants and document types.

### Preferred Alternative
Apply metadata filters (tenant_id, document_type, access_level) in every Pinecone query.

### Detection Checklist
- [ ] No metadata filter on queries
- [ ] Cross-tenant results
- [ ] Unfiltered vector search
