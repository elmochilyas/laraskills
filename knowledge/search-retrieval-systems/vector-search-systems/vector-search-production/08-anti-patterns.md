# Anti-Patterns: Vector Search Production

## Metadata

| | |
|---|---|
| **KU ID** | ku-16 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Vector Search Production |
| **Source** | Industry |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Self-Hosting Without Operational Capacity | Architecture | Medium |
| 2 | Under-Sized RAM for HNSW | Scalability | High |
| 3 | No Index Refresh Strategy | Reliability | Medium |
| 4 | Vector-Only Backups Without Source Data | Reliability | High |

## Repository-Wide Anti-Patterns

- **DIY Vector Infrastructure**: Self-hosting vector databases without dedicated ops resources
- **HNSW Memory Blindness**: Calculating RAM for vectors only, ignoring 1.5-2× index overhead
- **Rebuild-Never Mindset**: Creating ANN indexes at deploy and never refreshing them
- **Vector Backup Without Source**: Backing up vectors but not source text, making model upgrades impossible

---

## 1. Self-Hosting Without Operational Capacity

**Category:** Architecture

**Description:** Self-hosting a vector database (Qdrant, Milvus) in production without the operational expertise or capacity to manage it properly.

**Why It Happens:** Self-hosting seems cost-effective. Teams underestimate the operational burden of backups, scaling, monitoring, and disaster recovery.

**Warning Signs:**
- No dedicated infrastructure engineer for vector DB
- Manual backup/restore processes
- No runbooks for vector DB operations
- Frequent scaling or performance incidents

**Why Harmful:** Self-hosted vector databases require ongoing operations: index rebuilds, backup verification, scaling, monitoring, and incident response. Without capacity, these tasks are deferred, leading to data loss or outages.

**Consequences:**
- Data loss from incomplete backups
- Production outages from scaling issues
- No disaster recovery capability
- Developer time diverted to ops

**Alternative:** Use managed services (Pinecone, Qdrant Cloud, pgvector on RDS) for production.

**Refactoring Strategy:**
1. Migrate to managed vector service
2. Document migration, test rollback
3. Decommission self-hosted infrastructure

**Detection Checklist:**
- [ ] Is the team sized for self-hosted operations?
- [ ] Are runbooks documented?
- [ ] Are backups verified?

**Related Rules/Skills/Trees:**
- Rule: Use Managed Services for Production Deployments (`05-rules.md:1-32`)

---

## 2. Under-Sized RAM for HNSW

**Category:** Scalability

**Description:** Provisioning a database host with only enough RAM for raw vector storage, ignoring HNSW index overhead.

**Why It Happens:** `rows × dims × 4 bytes` calculation is common. HNSW's additional memory for graph structures is not included.

**Warning Signs:**
- RAM = raw vector size
- OOM during index builds
- Memory pressure under query load

**Why Harmful:** HNSW builds a navigable graph that uses 50-100% additional memory. Under-provisioned hosts OOM.

**Consequences:**
- Production OOM crashes
- Emergency host migration

**Alternative:** Provision 1.5-2× raw vector size for HNSW.

**Refactoring Strategy:**
1. Calculate required RAM: vectors × 2 × safety_margin
2. Resize host or enable quantization
3. Monitor memory under load

**Detection Checklist:**
- [ ] Is RAM sized for HNSW overhead?
- [ ] Is memory utilization monitored?

**Related Rules/Skills/Trees:**
- Rule: Plan RAM Sizing for Vectors Plus Index Overhead (`05-rules.md:34-63`)

---

## 3. No Index Refresh Strategy

**Category:** Reliability

**Description:** Creating ANN indexes at initial deployment and never rebuilding them, allowing recall quality to degrade gradually.

**Why It Happens:** Indexes continue to return results, so degradation is invisible without monitoring.

**Warning Signs:**
- Index built during initial import, never since
- Dataset has grown 20%+ since last index build
- Search quality has declined gradually

**Why Harmful:** HNSW and IVFFlat indexes degrade with data mutations. Recall drops by 5-15% over months without rebuild.

**Consequences:**
- Gradual undetected search quality loss
- Users notice search "isn't as good as before"

**Alternative:** Define and execute a periodic index rebuild strategy (weekly/monthly based on data change rate).

**Refactoring Strategy:**
1. Benchmark current recall
2. Schedule index rebuild (weekly/monthly)
3. Verify recall improvement after rebuild

**Detection Checklist:**
- [ ] Is there a documented index refresh schedule?
- [ ] Is recall monitored over time?

**Related Rules/Skills/Trees:**
- Rule: Establish an Index Refresh Strategy (`05-rules.md:65-96`)

---

## 4. Vector-Only Backups Without Source Data

**Category:** Reliability

**Description:** Backing up vector data but not the source text content from which embeddings were generated.

**Why It Happens:** Vector backups are obvious (back up the database). Source text is often in the same database but may not be included in selective backups.

**Warning Signs:**
- Backup includes vector columns but not source text
- Source text is in a separate database not backed up together
- Disaster recovery plan relies on vectors only

**Why Harmful:** Vectors are tied to a specific embedding model version. If the model changes (deprecation, upgrade, provider switch), old vectors become incompatible. Without source text, you cannot regenerate embeddings for the new model.

**Consequences:**
- Inability to upgrade embedding models
- Data loss if model provider changes
- DR plan incomplete

**Alternative:** Always backup source text alongside vectors. Source text allows regeneration with any embedding model.

**Refactoring Strategy:**
1. Ensure source text is included in all backups
2. Test DR: restore vectors, regenerate embeddings from source
3. Document the source-as-truth strategy

**Detection Checklist:**
- [ ] Are source texts backed up alongside vectors?
- [ ] Can embeddings be regenerated from source after model change?
- [ ] Is the DR plan tested?

**Related Rules/Skills/Trees:**
- Rule: Backup Source Data for Embedding Regeneration (`05-rules.md:98-128`)
