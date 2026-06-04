# Anti-Patterns: Qdrant Vector Search

## Metadata

| | |
|---|---|
| **KU ID** | K048 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Qdrant Vector Search |
| **Source** | Qdrant Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Default HNSW Parameters Without Tuning | Performance | Medium |
| 2 | Post-Filtering Instead of Payload Filtering | Performance | High |
| 3 | No Quantization for Large Datasets | Scalability | High |
| 4 | Large Payloads Stored with Vectors | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Qdrant-as-Content-Store**: Storing full document content in Qdrant payload instead of keeping only filterable metadata
- **Post-Filter Habit**: Running unfiltered ANN then filtering results in PHP instead of using Qdrant's filter-integrated ANN
- **Tuning-Free Operations**: Deploying Qdrant with default HNSW parameters and never benchmarking alternatives

---

## 1. Default HNSW Parameters Without Tuning

**Category:** Performance

**Description:** Using Qdrant's default HNSW parameters (`m=16`, `ef_construct=100`, `ef_search=64`) without tuning for the dataset size and recall requirements.

**Why It Happens:** Defaults are conservative and "work out of the box." The parameter tuning guide is in the documentation, but developers deploy with defaults and move on.

**Warning Signs:**
- HNSW parameters not explicitly configured in collection creation
- Query latency acceptable but recall could be higher
- Dataset >1M vectors with default parameters
- No recall vs ef_search benchmark exists

**Why Harmful:** Default HNSW parameters are safe for small to medium datasets but leave recall on the table for larger ones. Increasing ef_search from 64 to 256 often improves recall from 90% to 99% at minimal latency cost.

**Consequences:**
- 5-10% lower recall than achievable
- No documented recall baseline

**Alternative:** Set ef_search per query (256 for high recall, 64 for high throughput). Tune m and ef_construct at collection creation based on dataset size.

**Refactoring Strategy:**
1. Benchmark recall at ef_search 64, 128, 256, 512
2. Set ef_search per query type
3. Verify improvement

**Detection Checklist:**
- [ ] Are HNSW parameters tuned for dataset?
- [ ] Is ef_search set per query?
- [ ] Was recall benchmarked?

**Related Rules/Skills/Trees:**
- Rule: Configure HNSW Parameters for Dataset Size (`05-rules.md:1-36`)

---

## 2. Post-Filtering Instead of Payload Filtering

**Category:** Performance

**Description:** Executing vector search without payload filters, retrieving many results, then filtering by metadata in application code.

**Why It Happens:** Developers implement vector search first (query without filters), add metadata filtering as an afterthought in PHP, and never refactor to use Qdrant's payload filtering.

**Warning Signs:**
- `client.search()` without `query_filter`
- PHP code filters results after retrieval
- Large limit values (500+) to ensure enough post-filtered results

**Why Harmful:** Qdrant's filter-integrated ANN applies payload filters during HNSW traversal, never exploring branches that don't match. Post-filtering retrieves far more results than needed and wastes Qdrant resources.

**Consequences:**
- Higher latency from retrieving then discarding results
- Higher Qdrant resource usage
- Inconsistent result counts

**Alternative:** Include all metadata filters in the `query_filter` parameter.

**Refactoring Strategy:**
1. Move filters from PHP to `query_filter`
2. Reduce query limit to desired top-K
3. Verify latency reduction

**Detection Checklist:**
- [ ] Are all filters in `query_filter` (not PHP)?
- [ ] Is post-filtering eliminated?

**Related Rules/Skills/Trees:**
- Rule: Use Payload Filtering for Efficient Metadata Search (`05-rules.md:38-73`)

---

## 3. No Quantization for Large Datasets

**Category:** Scalability

**Description:** Running Qdrant without quantization on datasets exceeding 1M vectors, causing excessive RAM usage, swapping, or OOM.

**Why It Happens:** Quantization requires explicit configuration. Default collection creation does not include it. The memory impact is not calculated before production.

**Warning Signs:**
- Qdrant process uses >80% of available RAM
- Slow queries from memory pressure
- OOM events correlated with search load
- No quantization configured

**Why Harmful:** Qdrant stores vectors in memory for fast search. 10M vectors × 1536 dims × 4 bytes = 60GB without quantization. Scalar quantization reduces this to 15GB with <2% recall loss.

**Consequences:**
- OOM crashes at production scale
- Swapping causing extreme latency
- Inability to scale dataset

**Alternative:** Enable scalar quantization for datasets >1M vectors.

**Refactoring Strategy:**
1. Enable scalar quantization on collection
2. Reduce memory, verify recall
3. Consider binary if more compression needed

**Detection Checklist:**
- [ ] Is quantization enabled for large datasets?
- [ ] Is memory usage monitored?

**Related Rules/Skills/Trees:**
- Rule: Enable Quantization for Large Datasets (`05-rules.md:75-107`)

---

## 4. Large Payloads Stored with Vectors

**Category:** Performance

**Description:** Storing large text content (full documents, long descriptions) in Qdrant payload fields alongside vectors, bloating index size and slowing queries.

**Why It Happens:** It's convenient to store everything in one place. Qdrant allows arbitrary payload. Developers include full content for display purposes.

**Warning Signs:**
- Payload fields contain document text, HTML, or JSON >1KB
- Qdrant index size is much larger than vector storage would suggest
- Segment optimization takes hours
- Network transfer for search results is high

**Why Harmful:** Large payloads increase index size (more data per point), slow segment optimization (Qdrant merges segments periodically), and increase network transfer time (payload returned with every result).

**Consequences:**
- Larger index sizes requiring more RAM/disk
- Slower segment optimization
- Higher network latency for result transfer

**Alternative:** Store only filterable metadata (IDs, categories, flags). Store full content in primary database, reference by ID.

**Refactoring Strategy:**
1. Identify large payload fields
2. Move to primary database
3. Keep only filterable metadata

**Detection Checklist:**
- [ ] Are payloads limited to filterable metadata?
- [ ] Is document content stored elsewhere?

**Related Rules/Skills/Trees:**
- Rule: Keep Payload Lean (`05-rules.md:109-138`)
