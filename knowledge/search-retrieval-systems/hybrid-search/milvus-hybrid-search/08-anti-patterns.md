| Metadata | |
|---|---|
| KU ID | K060 |
| Subdomain | hybrid-search |
| Topic | Milvus Hybrid Search |
| Source | Milvus Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-MHS-01 | Missing Sparse Vector Field in Collection Schema | Architecture |
| AP-MHS-02 | External Sparse Vector Generation | Architecture |
| AP-MHS-03 | Tuning Fusion Without Individual Path Baselines | Testing |
| AP-MHS-04 | Using Milvus Hybrid Without Existing Milvus Investment | Design |
| AP-MHS-05 | Ignoring Storage Impact of Dual Vector Indexing | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)

---

### AP-MHS-01: Missing Sparse Vector Field in Collection Schema

**Category:** Architecture

**Description:** Creating a Milvus collection with only a dense vector field for hybrid search, causing hybrid queries to fail at runtime.

**Why It Happens:** Developers familiar with Milvus for dense-only search create collections using existing patterns. Hybrid search requires both `dense_vector` and `sparse_vector` fields — an easy oversight.

**Warning Signs:**
- Collection schema has one vector field type only
- Hybrid queries throw field-not-found errors
- `collection.hybrid_search()` fails with schema validation error

**Why Harmful:** Hybrid queries fail immediately because the sparse field is missing. Requires schema migration (which may mean re-indexing all data) to fix.

**Consequences:**
- Hybrid search non-functional after deployment
- Emergency schema migration with downtime
- Full re-indexing of all documents

**Alternative:** Always define both `SPARSE_FLOAT_VECTOR` and `FLOAT_VECTOR` fields in collection schema when hybrid search is planned.

**Refactoring Strategy:**
1. Export existing collection data
2. Drop and recreate collection with both `dense_vector` and `sparse_vector` fields
3. Re-index all documents
4. Verify hybrid queries work with both field types present
5. Add schema validation check to CI/deployment pipeline

**Detection Checklist:**
- [ ] Collection schema includes both dense and sparse vector fields
- [ ] Hybrid queries execute without field errors
- [ ] Schema checked in CI before deployment

**Related Rules/Skills/Trees:**
- Rule: Configure Both Sparse and Dense Fields (`milvus-hybrid-search/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`milvus-hybrid-search/07-decision-trees.md:129`)

---

### AP-MHS-02: External Sparse Vector Generation

**Category:** Architecture

**Description:** Using external BM25 or SPLADE services to generate sparse vectors instead of leveraging Milvus's built-in sparse vector generation from raw text.

**Why It Happens:** Teams assume all vector generation requires external services. Milvus's internal BM25 sparse vector generation is not well-known.

**Warning Signs:**
- External API calls for BM25 sparse vector generation
- Extra HTTP dependency in indexing pipeline for sparse vectors
- Sparse vector generation service has its own scaling requirements

**Why Harmful:** Milvus generates BM25 sparse vectors internally from raw text input. External generation adds API costs, latency, network dependency, and complexity with no benefit for standard BM25.

**Consequences:**
- Additional API costs for sparse vector generation
- Indexing failures when external generation service is down
- Higher latency for index population

**Alternative:** Pass raw text to Milvus during indexing and let it generate BM25 sparse vectors internally.

**Refactoring Strategy:**
1. Remove external sparse vector generation code
2. Modify indexing to pass raw text field instead of pre-computed sparse vectors
3. Configure Milvus to generate sparse vectors from text with `"sparse_vector"` field config
4. Verify keyword search quality matches previous external BM25 results
5. Remove external BM25 service dependency

**Detection Checklist:**
- [ ] Sparse vector generation handled internally by Milvus
- [ ] External BM25 service dependency removed
- [ ] Keyword search quality matches or exceeds previous implementation

**Related Rules/Skills/Trees:**
- Rule: Generate Sparse Vectors Internally (`milvus-hybrid-search/05-rules.md:34`)
- Decision Tree: Hybrid Search Fusion Strategy (`milvus-hybrid-search/07-decision-trees.md:20`)

---

### AP-MHS-03: Tuning Fusion Without Individual Path Baselines

**Category:** Testing

**Description:** Tuning RRF parameters or deployment settings for hybrid search without first measuring and optimizing each retrieval path's individual recall.

**Why It Happens:** Focus on the combined result. Teams assume fusion will compensate for individual path weaknesses. Fusion optimization is more intuitive than path-level analysis.

**Warning Signs:**
- RRF k parameter tuned without per-path recall data
- Dense-only and sparse-only recall unknown
- Fusion appears not to improve results; team blames fusion algorithm

**Why Harmful:** If dense or sparse path has poor recall individually, fusion will also produce poor results regardless of RRF tuning. The real problem is the broken path, not the fusion.

**Consequences:**
- Wasted effort tuning fusion parameters
- Undiagnosed path-level issues persist
- False conclusion that Milvus hybrid search "doesn't work well"

**Alternative:** Benchmark each path independently. Fix path-level issues. Then evaluate fusion improvement against both baselines.

**Refactoring Strategy:**
1. Run benchmark suite against dense-only retrieval
2. Run benchmark suite against sparse-only retrieval
3. If sparse recall < 70%, improve indexing (document preprocessing, field mapping)
4. If dense recall < 70%, improve embedding model or chunking strategy
5. Only after both paths meet baseline, measure hybrid and tune RRF k
6. Document per-path and hybrid metrics

**Detection Checklist:**
- [ ] Dense-only recall benchmarked
- [ ] Sparse-only recall benchmarked
- [ ] Each path meets minimum recall threshold before fusion tuning
- [ ] Hybrid improvement measured against both baselines

**Related Rules/Skills/Trees:**
- Rule: Benchmark Individual Path Recall Before Fusing (`milvus-hybrid-search/05-rules.md:65`)
- Decision Tree: Hybrid Search Fusion Strategy (`milvus-hybrid-search/07-decision-trees.md:20`)

---

### AP-MHS-04: Using Milvus Hybrid Without Existing Milvus Investment

**Category:** Design

**Description:** Adopting Milvus hybrid search as the first search solution when no prior Milvus infrastructure exists, ignoring simpler alternatives (Meilisearch hybrid, pgvector + FTS).

**Why It Happens:** Milvus is a capable vector database with hybrid features. Teams may choose it for the combined capability without evaluating total complexity.

**Warning Signs:**
- No existing Milvus deployment
- Milvus chosen solely for hybrid search capability
- Team lacks Milvus operations experience
- No Scout driver for Milvus (requires custom integration)

**Why Harmful:** Milvus adds significant operational overhead (dedicated infrastructure, cluster management, no Scout driver). For teams without existing Milvus, Meilisearch or pgvector offers simpler hybrid search.

**Consequences:**
- High operational overhead for Milvus cluster management
- Custom integration work since no Scout driver exists
- Over-engineered for the actual search requirements

**Alternative:** For simple hybrid needs, use Meilisearch native hybrid (single engine, Scout driver). For PostgreSQL-based apps, use pgvector + PostgreSQL FTS hybrid.

**Refactoring Strategy:**
1. Document search requirements (data volume, query latency, fusion control)
2. Compare Milvus hybrid against Meilisearch hybrid and pgvector + FTS
3. If simpler alternative meets requirements, migrate before heavy Milvus investment
4. If Milvus is required (scale, existing infra), proceed with documented justification
5. Build custom integrations (Scout driver) only if simpler options are insufficient

**Detection Checklist:**
- [ ] Alternative hybrid solutions evaluated
- [ ] Milvus chosen over simpler alternatives with documented rationale
- [ ] Team has Milvus operations runbook if Milvus is selected

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Level Hybrid When Available (`laravel-hybrid-implementation/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`milvus-hybrid-search/07-decision-trees.md:129`)

---

### AP-MHS-05: Ignoring Storage Impact of Dual Vector Indexing

**Category:** Performance

**Description:** Enabling hybrid search in Milvus without accounting for the doubled storage requirements and increased memory usage from maintaining both sparse and dense vector indexes.

**Why It Happens:** Focus on search quality benefits. Storage planning focuses on one vector index; dual indexing is an afterthought.

**Warning Signs:**
- Storage monitoring shows 2x expected growth after enabling hybrid
- Memory usage spikes when both indexes loaded for search
- Index building takes significantly longer than expected
- Milvus nodes running out of disk or memory

**Why Harmful:** Dual vector indexing doubles storage requirements (sparse + dense) and increases memory pressure during search (both indexes loaded simultaneously). Can cause node failures under load.

**Consequences:**
- Disk full errors during indexing
- OOM kills on Milvus query nodes
- Unplanned infrastructure upgrades and costs

**Alternative:** Size infrastructure for 2x storage. Monitor both disk and memory usage. Use quantization on both indexes to reduce footprint.

**Refactoring Strategy:**
1. Measure current storage and memory usage for current index type
2. Estimate additional usage for second index type
3. Compare against available resources
4. If resources insufficient, resize Milvus nodes or enable quantization
5. Set up monitoring alerts at 70% and 85% storage/memory thresholds
6. Document storage requirements in capacity planning

**Detection Checklist:**
- [ ] Storage requirements for dual indexes calculated
- [ ] Disk space monitoring at 70%/85% thresholds
- [ ] Memory monitoring for query nodes
- [ ] Index building time benchmarked and acceptable

**Related Rules/Skills/Trees:**
- Rule: Configure Both Sparse and Dense Fields (`milvus-hybrid-search/05-rules.md:1`)
- Skill: Configure and Implement Milvus Hybrid Search (`milvus-hybrid-search/06-skills.md:1`)
