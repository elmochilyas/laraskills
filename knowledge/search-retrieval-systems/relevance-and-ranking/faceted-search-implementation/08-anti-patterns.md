| Metadata | |
|---|---|
| KU ID | K066 |
| Subdomain | relevance-and-ranking |
| Topic | Faceted Search Implementation |
| Source | Algolia / Meilisearch / Industry |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-FSI-01 | Facet Attributes Not Declared Before Indexing | Architecture |
| AP-FSI-02 | No Limit on Visible Facet Values | UX |
| AP-FSI-03 | Static Facet Counts | UX |
| AP-FSI-04 | No Facet Search for High-Cardinality Values | UX |
| AP-FSI-05 | Faceting on Non-Indexed Fields | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-09: Using Scout `where()` without declaring filterable attributes (`algolia-index-settings/05-rules.md:70`)
- RAP-SEARCH-11: Displaying excessive facet values without truncation (`faceted-search/05-rules.md:39`)

---

### AP-FSI-01: Facet Attributes Not Declared Before Indexing

**Category:** Architecture

**Description:** Attempting to use facet features on attributes not declared in the search engine configuration before indexing, resulting in silent failures.

**Why It Happens:** Adding facet requirements during frontend development without updating backend engine configuration.

**Warning Signs:**
- Facet counts not returned for a declared attribute
- `where()` filtering on undeclared attribute returns unfiltered results
- No error logged — silent failure

**Why Harmful:** Search engines require facet attributes to be declared in configuration before indexing. Post-hoc declarations require re-indexing. Silent failures mean developers may not know facets are broken.

**Consequences:**
- Facet displays show no counts
- Filter features appear broken
- Users cannot refine search results

**Alternative:** Declare all facetable attributes in engine configuration before initial indexing. Add CI check to validate.

**Refactoring Strategy:**
1. Audit all facets used in the UI
2. Compare against engine configuration
3. Add missing attributes to `filterableAttributes` / `attributesForFaceting`
4. Re-index data
5. Verify facet counts appear in search results
6. Add CI check that facet UI components correspond to configured attributes

**Detection Checklist:**
- [ ] All UI facet attributes declared in engine config
- [ ] Re-indexing performed after config change
- [ ] Facet counts returned for all facet attributes
- [ ] CI validates facet configuration

**Related Rules/Skills/Trees:**
- Rule: Declare Facetable Attributes in Engine Config (`faceted-search-implementation/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`faceted-search-implementation/07-decision-trees.md:20`)

---

### AP-FSI-02: No Limit on Visible Facet Values

**Category:** UX

**Description:** Displaying all values for each facet without truncation, creating long, unusable lists for high-cardinality facets.

**Why It Happens:** Simple `@foreach` loop over all facet values. No thought given to UX limits.

**Warning Signs:**
- Facet lists with 20+ visible values
- Users must scroll to see all facet options
- Engagement drops significantly beyond first 5-10 values

**Why Harmful:** Users scan facets top-to-bottom and rarely scroll through long lists. Excessive values obscure the most popular and useful choices.

**Consequences:**
- Reduced facet interaction
- Users miss relevant filter options
- Overwhelming UX, especially on mobile

**Alternative:** Display top 5-10 facet values by count with "Show more" toggle for remaining values.

**Refactoring Strategy:**
1. Identify facets with >10 values
2. Limit display to top 10 values sorted by count
3. Add "Show all X values" link to expand
4. Track facet value selection to validate top-N accuracy
5. For 100+ values, add facet search input

**Detection Checklist:**
- [ ] Facet values limited to top 10 (or validated limit)
- [ ] "Show more" UX pattern implemented
- [ ] No facet list exceeds usable length
- [ ] facet value selection validates top-N captures majority

**Related Rules/Skills/Trees:**
- Rule: Limit Visible Facets to Top Values (`faceted-search-implementation/05-rules.md:39`)
- Rule: Limit Visible Facet Values (`faceted-search/05-rules.md:39`)

---

### AP-FSI-03: Static Facet Counts

**Category:** UX

**Description:** Facet counts that don't update when users apply filters, showing inaccurate numbers that don't reflect the filtered result set.

**Why It Happens:** Facet counts fetched once with initial search results. No re-query when filter state changes.

**Warning Signs:**
- Facet counts remain identical before and after filter selection
- Users click facet values expecting results but find 0 matches
- Counts show 50+ items for categories that only have 5 after filtering

**Why Harmful:** Inaccurate facet counts mislead users. They click facet values expecting results based on displayed counts, only to find empty result sets.

**Consequences:**
- User frustration and confusion
- Abandonment of faceted navigation
- Loss of trust in search refinement

**Alternative:** Re-fetch facet counts with each filter change, passing all active filters to the query.

**Refactoring Strategy:**
1. Re-query search with active filters whenever filter selection changes
2. Pass all current filters to `where()` and `getFacets()`
3. Update UI with new facet counts
4. Debounce rapid filter changes
5. Handle loading state during count updates

**Detection Checklist:**
- [ ] Facet counts update when filters change
- [ ] Counts accurately reflect filtered result set
- [ ] No misleading "non-zero count, zero results"
- [ ] Debounce implemented for rapid changes

**Related Rules/Skills/Trees:**
- Rule: Implement Dynamic Facet Count Updates (`faceted-search-implementation/05-rules.md:75`)
- Skill: Configure and Implement Faceted Search Implementation (`faceted-search-implementation/06-skills.md:1`)

---

### AP-FSI-04: No Facet Search for High-Cardinality Values

**Category:** UX

**Description:** Not providing search functionality within facets that have high cardinality (100+ values), forcing users to scroll through endless lists.

**Why It Happens:** Same UI treatment for all facets. No differentiation between low and high cardinality.

**Warning Signs:**
- Brand/category facet with 100+ values and no search input
- Users struggle to find specific values in long facet lists
- "Show more" pattern still shows hundreds of values

**Why Harmful:** Users cannot efficiently find specific facet values in long lists. For example, finding a specific brand among 200 brands without searching is impractical.

**Consequences:**
- Users give up on facet refinement
- Specific value filters rarely used
- Poor mobile experience

**Alternative:** Add a text search input above facets with >20 values, allowing users to type to filter facet values.

**Refactoring Strategy:**
1. Identify facets with >20 values
2. Add search input above these facets
3. Filter displayed facet values based on typed query
4. Ensure search within facets doesn't trigger a new search query (client-side filtering)
5. Test with representative high-cardinality facets

**Detection Checklist:**
- [ ] Facet search implemented for high-cardinality facets
- [ ] Search within facets is client-side (no new search query)
- [ ] Users can efficiently find specific values
- [ ] Mobile UX accommodates facet search

**Related Rules/Skills/Trees:**
- Rule: Limit Visible Facets to Top Values (`faceted-search-implementation/05-rules.md:39`)
- Skill: Optimize and Monitor Faceted Search Implementation Production Search (`faceted-search-implementation/06-skills.md:81`)

---

### AP-FSI-05: Faceting on Non-Indexed Fields

**Category:** Performance

**Description:** Computing facets on fields that are not indexed for search, causing significant performance overhead during query time.

**Why It Happens:** All model attributes are assumed to be facetable. Not understanding that non-indexed facet computation requires scanning unoptimized data.

**Warning Signs:**
- Facet queries take significantly longer than non-facet queries
- High database CPU during facet-heavy searches
- Certain facets dramatically increase query latency

**Why Harmful:** Facet computation on non-indexed fields requires scanning all matching documents or database fields, bypassing search engine optimizations.

**Consequences:**
- Slow search responses with faceting
- Increased database load
- Poor user experience

**Alternative:** Only compute facets on indexed, filterable attributes that the search engine has optimized for fast counting.

**Refactoring Strategy:**
1. Identify which facets are causing high latency
2. Ensure these fields are declared as filterable/indexed in the search engine
3. If using pgvector + FTS, ensure facets correspond to database columns with indexes
4. Remove or redesign facets on non-indexed fields
5. Benchmark facet query performance after change

**Detection Checklist:**
- [ ] All facet fields are search-engine-indexed
- [ ] Facet queries have acceptable latency
- [ ] No facet computed on non-indexed data
- [ ] Performance benchmarked with and without facets

**Related Rules/Skills/Trees:**
- Rule: Declare Facetable Attributes in Engine Config (`faceted-search-implementation/05-rules.md:1`)
- Skill: Configure and Implement Faceted Search Implementation (`faceted-search-implementation/06-skills.md:1`)
