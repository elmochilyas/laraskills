# Anti-Patterns: Vector Search Metadata Filtering

## Metadata

| | |
|---|---|
| **KU ID** | ku-12 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Vector Search Metadata Filtering |
| **Source** | pgvector / Qdrant / Pinecone docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Post-Filtering (Vector Search Then PHP Filter) | Performance | High |
| 2 | No Index on Filterable Metadata Fields | Performance | Medium |
| 3 | No Iterative Search for Strict Filters | Reliability | Medium |
| 4 | Ignoring Filtered ANN Support | Performance | High |

## Repository-Wide Anti-Patterns

- **Post-Filter Habit**: Running unfiltered ANN then filtering in PHP, the easiest but worst-performing approach
- **Unindexed Filters**: Filtering by metadata fields without database indexes, causing full scans
- **Hard-Filter-No-Fallback**: Applying strict filters that may return zero results without fallback

---

## 1. Post-Filtering (Vector Search Then PHP Filter)

**Category:** Performance

**Description:** Executing vector search without metadata filters, fetching many results, then discarding non-matching results in application code.

**Why It Happens:** Simplest implementation — filter out irrelevant results in PHP after vector search. Developers don't realize the performance impact until scale.

**Warning Signs:**
- `Model::nearestNeighbors($vec, 1000)` followed by PHP `->filter()`
- Large LIMIT values to compensate for post-filter pruning
- Low percentage of fetched results survive filtering

**Why Harmful:** Post-filtering requires fetching 10-50× more results than needed. Wasted network transfer, database I/O, and PHP processing.

**Consequences:**
- 10-50× higher latency than filtered ANN
- Wasted database resources

**Alternative:** Move filters into the database query (WHERE clause or vector store filter parameter).

**Refactoring Strategy:**
1. Move filters from PHP to SQL WHERE or vector store filter
2. Reduce LIMIT to desired top-K
3. Benchmark latency improvement

**Detection Checklist:**
- [ ] Are filters in the database query (not PHP)?
- [ ] Is post-filtering eliminated?

**Related Rules/Skills/Trees:**
- Rule: Prefer Pre-Filtering Over Post-Filtering (`05-rules.md:1-34`)
- Rule: Choose Filtered ANN Over Post-Filtering When Possible (`05-rules.md:111-142`)

---

## 2. No Index on Filterable Metadata Fields

**Category:** Performance

**Description:** Filtering vector search by metadata fields without creating B-tree indexes on those fields.

**Why It Happens:** Developers add metadata filters to queries but forget to create indexes. The query works but scans the entire table.

**Warning Signs:**
- `WHERE` clauses on columns without indexes
- Sequential scans on filter columns
- Filter performance degrades as data grows

**Why Harmful:** Without indexes, pre-filtering is as slow as post-filtering — both require full scans.

**Consequences:**
- Pre-filtering provides no performance benefit
- Slow filtered queries

**Alternative:** Create B-tree or GIN indexes on all filterable metadata columns.

**Refactoring Strategy:**
1. Identify filterable columns without indexes
2. Create appropriate indexes
3. Verify query plan shows index usage

**Detection Checklist:**
- [ ] Are all filterable metadata columns indexed?
- [ ] Do query plans show index usage?

**Related Rules/Skills/Trees:**
- Rule: Index All Filterable Metadata Fields (`05-rules.md:36-66`)

---

## 3. No Iterative Search for Strict Filters

**Category:** Reliability

**Description:** Applying strict metadata filters without fallback when the filter eliminates all results, returning empty search results.

**Why It Happens:** Single-query approach: apply filter, vector search, return results. If filter is too strict, no results.

**Warning Signs:**
- Strict filters return empty results
- Users see "no results" for searches with filters
- No cascading filter relaxation

**Why Harmful:** Overly strict filters cause empty search results, frustrating users who may not understand why.

**Consequences:**
- User frustration from empty results
- Lost conversions (e-commerce filters too strict)

**Alternative:** Implement iterative search: start with strict filter, progressively relax until enough results found.

**Refactoring Strategy:**
1. Define cascading filter levels (strict, moderate, loose, none)
2. Query at strict level first
3. If insufficient results, relax filter
4. Return results with earliest matching filter level

**Detection Checklist:**
- [ ] Is iterative search implemented for strict filters?
- [ ] Are empty search results rate-limited?

**Related Rules/Skills/Trees:**
- Rule: Implement Iterative Search with Gradual Filter Relaxation (`05-rules.md:68-109`)
