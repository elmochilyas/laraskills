| Metadata | |
|---|---|
| KU ID | K049 |
| Subdomain | hybrid-search |
| Topic | Qdrant Hybrid Queries |
| Source | Qdrant Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-QHQ-01 | Missing Dense or Sparse Named Vector in Collection | Architecture |
| AP-QHQ-02 | External Sparse Vector Generation | Architecture |
| AP-QHQ-03 | Deploying Hybrid Without Fusion Balance Testing | Testing |
| AP-QHQ-04 | Assuming Payload Filtering Works Identically with Hybrid | Testing |
| AP-QHQ-05 | Using Qdrant Hybrid Without Existing Qdrant Investment | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-05: Tuning fusion parameters without per-content-type analysis (`meilisearch-hybrid-search/04-standardized-knowledge.md:39`)

---

### AP-QHQ-01: Missing Dense or Sparse Named Vector in Collection

**Category:** Architecture

**Description:** Creating a Qdrant collection with only one named vector type when hybrid search requires both `dense` and `sparse` named vectors.

**Why It Happens:** Developers familiar with Qdrant for dense-only search create collections using existing patterns. Hybrid search requires both named vectors — an easy oversight.

**Warning Signs:**
- Collection has only `vectors_config` (dense), no `sparse_vectors_config`
- Hybrid query returns error about missing vector configuration
- Only one retrieval path available in search results

**Why Harmful:** Hybrid queries fail at runtime because the collection schema lacks one required vector type. Requires collection recreation (and re-indexing) to fix.

**Consequences:**
- Hybrid search non-functional after deployment
- Emergency data migration and re-indexing
- Application errors visible to users

**Alternative:** Always configure both `dense` (`VectorParams`) and `sparse` (`SparseVectorParams`) named vectors in the collection creation call.

**Refactoring Strategy:**
1. Export existing point data from Qdrant collection
2. Drop and recreate collection with both `dense` and `sparse` named vectors
3. Re-index all points with both vector types
4. Verify hybrid queries work with `fusion="rrf"`
5. Add collection schema validation to deployment pipeline

**Detection Checklist:**
- [ ] Collection has both `dense` and `sparse` named vectors
- [ ] Hybrid queries execute without vector configuration errors
- [ ] Both retrieval paths return results

**Related Rules/Skills/Trees:**
- Rule: Configure Dense and Sparse Named Vectors (`qdrant-hybrid-queries/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`qdrant-hybrid-queries/07-decision-trees.md:129`)

---

### AP-QHQ-02: External Sparse Vector Generation

**Category:** Architecture

**Description:** Using external services to generate sparse vectors for Qdrant instead of leveraging Qdrant's built-in sparse vector extraction from text.

**Why It Happens:** Teams assume all vector generation requires external services. Qdrant's built-in sparse vector extraction from text is underrecognized.

**Warning Signs:**
- External API calls for sparse vector generation in indexing pipeline
- Extra HTTP dependency for converting text to sparse vectors
- Sparse vector generation service failures blocking indexing

**Why Harmful:** Qdrant can extract sparse vectors internally from raw text. External generation adds API costs, latency, network dependency, and complexity for standard BM25-like sparse vectors.

**Consequences:**
- Additional API costs for sparse vector generation
- Indexing failures when external generation service is down
- Higher latency for index population

**Alternative:** Pass raw text to Qdrant during upsert and let it handle sparse vector extraction internally.

**Refactoring Strategy:**
1. Remove external sparse vector generation code
2. Modify upsert to pass raw text field for sparse extraction
3. Configure Qdrant collection to use built-in sparse vector extractor
4. Verify keyword search quality matches previous external BM25 results
5. Remove external sparse generation service dependency

**Detection Checklist:**
- [ ] Sparse vector extraction handled internally by Qdrant
- [ ] External sparse generation dependency removed
- [ ] Keyword search quality matches or exceeds previous implementation

**Related Rules/Skills/Trees:**
- Rule: Generate Sparse Vectors Internally (`qdrant-hybrid-queries/05-rules.md:38`)
- Decision Tree: Hybrid Search Fusion Strategy (`qdrant-hybrid-queries/07-decision-trees.md:20`)

---

### AP-QHQ-03: Deploying Hybrid Without Fusion Balance Testing

**Category:** Testing

**Description:** Deploying Qdrant hybrid queries without verifying that both dense and sparse paths contribute meaningfully to the fused results.

**Why It Happens:** Focus on whether hybrid "works" (returns results) rather than whether both paths contribute. Assumption that hybrid automatically means balanced.

**Warning Signs:**
- Top-10 results consistently from one path only
- Fusion balance metric never measured
- Changing one path's quality has no visible effect on hybrid results
- One path dominates >90% of top-10 results

**Why Harmful:** If one path dominates, hybrid search effectively operates as single-path search. The second path adds infrastructure cost without benefit.

**Consequences:**
- Wasted infrastructure (dual vector storage for no benefit)
- Missing recall improvements that balanced fusion would provide
- Unnoticed degradation in the dominated path

**Alternative:** Analyze fusion balance by tagging each result with its source path and measuring contribution percentages.

**Refactoring Strategy:**
1. Add source path tagging to Qdrant points or result metadata
2. Run benchmark queries and compute % of top-10 from dense vs sparse
3. If one path dominates (>80%), investigate why:
   - Is the dominated path's vector quality poor?
   - Is the dominant path's RRF contribution overwhelming?
4. Adjust per-vector weights or improve the dominated path's vector quality
5. Re-test until both paths contribute meaningfully (30-70% range)

**Detection Checklist:**
- [ ] Fusion balance metric tracked
- [ ] Both paths contribute to top-10 results
- [ ] Balance documented and monitored

**Related Rules/Skills/Trees:**
- Rule: Test Fusion Balance Between Dense and Sparse (`qdrant-hybrid-queries/05-rules.md:69`)
- Skill: Optimize and Monitor Qdrant Hybrid Queries Production Search (`qdrant-hybrid-queries/06-skills.md:81`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`qdrant-hybrid-queries/07-decision-trees.md:74`)

---

### AP-QHQ-04: Assuming Payload Filtering Works Identically with Hybrid

**Category:** Testing

**Description:** Applying metadata payload filters to hybrid queries without verifying that filtering produces correct results when combined with dense + sparse fusion.

**Why It Happens:** Payload filtering works transparently with single-path Qdrant queries. Teams assume the same behavior with hybrid queries without testing.

**Warning Signs:**
- Payload filters applied to hybrid queries without verification
- Filtered hybrid queries return unexpected result counts
- Filter applied before fusion produces different results than expected

**Why Harmful:** Payload filtering combined with hybrid queries may behave differently than with single-path queries. Filters can exclude results from one path more than the other, skewing fusion balance.

**Consequences:**
- Incorrect filtered search results
- Users seeing results outside their filter criteria
- Hard-to-debug search quality issues

**Alternative:** Always test payload filtering explicitly with hybrid queries. Verify filter + hybrid combinations match expected results.

**Refactoring Strategy:**
1. Create test cases with known filter criteria
2. Run hybrid query with payload filter
3. Verify all returned results match filter criteria
4. Verify result count matches expectations
5. Test edge cases: filters that exclude all dense results, all sparse results, or both
6. Document filter + hybrid behavior in runbook

**Detection Checklist:**
- [ ] Payload filter + hybrid query tested with known data
- [ ] All filtered results match expected criteria
- [ ] Edge cases tested (exclusion of one path by filter)
- [ ] Integration test covers filter + hybrid combinations

**Related Rules/Skills/Trees:**
- Rule: Verify Payload Filtering with Hybrid Queries (`qdrant-hybrid-queries/05-rules.md:100`)
- Skill: Configure and Implement Qdrant Hybrid Queries (`qdrant-hybrid-queries/06-skills.md:1`)

---

### AP-QHQ-05: Using Qdrant Hybrid Without Existing Qdrant Investment

**Category:** Design

**Description:** Adopting Qdrant primarily for its hybrid search capabilities when no prior Qdrant infrastructure exists and simpler alternatives (Meilisearch, pgvector + FTS) would suffice.

**Why It Happens:** Qdrant's single-query hybrid search is attractive. Teams may not fully evaluate setup and operational costs vs simpler alternatives.

**Warning Signs:**
- No existing Qdrant deployment
- Qdrant chosen solely for hybrid search
- Team lacks Qdrant operations experience
- No Scout driver for Qdrant (requires custom integration)

**Why Harmful:** Qdrant adds significant infrastructure (Dedicated server/cluster, monitoring, backups). For teams without existing Qdrant, Meilisearch or pgvector + FTS offers simpler hybrid search with less operational overhead.

**Consequences:**
- Operational overhead of managing Qdrant cluster
- Custom integration work since no Scout driver exists
- Over-engineered for the actual search requirements

**Alternative:** For simple hybrid needs, use Meilisearch native hybrid (has Scout driver, simpler ops). For PostgreSQL-based apps, use pgvector + PostgreSQL FTS (no extra infrastructure).

**Refactoring Strategy:**
1. Document hybrid search requirements (data volume, latency, feature needs)
2. Compare Qdrant hybrid against Meilisearch hybrid and pgvector + FTS
3. If simpler alternative meets requirements, adopt that instead
4. If Qdrant is required (scale, payload filtering, existing infra), proceed with documented justification
5. Build custom Qdrant integration only if simpler options insufficient

**Detection Checklist:**
- [ ] Alternative hybrid solutions evaluated
- [ ] Qdrant chosen over simpler alternatives with documented rationale
- [ ] Team has Qdrant operations runbook if Qdrant is selected

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Level Hybrid When Available (`laravel-hybrid-implementation/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`qdrant-hybrid-queries/07-decision-trees.md:129`)
