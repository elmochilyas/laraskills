| Metadata | |
|---|---|
| KU ID | ku-08 |
| Subdomain | relevance-and-ranking |
| Topic | Faceted Search |
| Source | Algolia / Meilisearch / Typesense Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-FS-01 | Undeclared Filterable Attributes | Architecture |
| AP-FS-02 | Showing Too Many Facet Values | UX |
| AP-FS-03 | Misordered Facets | UX |
| AP-FS-04 | Static Facet Counts Without Dynamic Updates | UX |
| AP-FS-05 | Over-Declaring High-Cardinality Facets | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-09: Using Scout `where()` without declaring filterable attributes (`algolia-index-settings/05-rules.md:70`)
- RAP-SEARCH-11: Displaying excessive facet values without truncation (`faceted-search/05-rules.md:39`)

---

### AP-FS-01: Undeclared Filterable Attributes

**Category:** Architecture

**Description:** Using Scout's `where()` method to filter on attributes that are not declared as filterable in the search engine configuration, causing silent filter failure.

**Why It Happens:** Adding `where()` clauses without updating engine configuration. Scout doesn't validate that filterable attributes are declared.

**Warning Signs:**
- `Model::search($query)->where('field', 'value')` returns unfiltered results
- No error message from engine or Scout
- Users see results from all categories when filtering by category

**Why Harmful:** Meilisearch, Algolia, and Typesense silently ignore filters on undeclared attributes. Users see unfiltered results and assume filtering is broken, leading to abandonment.

**Consequences:**
- Facet filtering appears broken to users
- Debugging time wasted on "why isn't filtering working"
- Negative user experience with search

**Alternative:** Declare all filterable attributes in engine settings before using them in `where()` calls.

**Refactoring Strategy:**
1. Scan codebase for all `where()` calls on search queries
2. Compare against declared filterable attributes in engine config
3. Add missing attributes to engine configuration
4. Re-import indexes to apply new settings
5. Add CI check that all `where()` fields are declared filterable

**Detection Checklist:**
- [ ] All `where()` fields declared as filterable
- [ ] `where()` returns correctly filtered results
- [ ] CI validates filterable attribute declarations
- [ ] No silent filter failures

**Related Rules/Skills/Trees:**
- Rule: Declare All Facetable Attributes in Engine Config (`faceted-search/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`faceted-search/07-decision-trees.md:20`)

---

### AP-FS-02: Showing Too Many Facet Values

**Category:** UX

**Description:** Displaying all facet values (e.g., 50+ brands) without limiting to top values, overwhelming users with too many choices.

**Why It Happens:** Simple iteration over facet results. No awareness that long facet lists harm usability.

**Warning Signs:**
- Facet list scrolls beyond screen height
- Users rarely scroll past first 5-10 facet values
- Engagement with lower-ranked facet values is near zero

**Why Harmful:** Users scan facets top-to-bottom. Long lists obscure the most popular choices. Users miss relevant filters because they don't scroll through hundreds of values.

**Consequences:**
- Reduced facet usage
- Lower user satisfaction with search refinement
- Abandonment of faceted navigation

**Alternative:** Display top 5-10 facet values by count, with "Show more" link to expand.

**Refactoring Strategy:**
1. Identify facet attributes with high cardinality (10+ values)
2. Limit display to top 10 values by count
3. Add "Show all X values" toggle for remaining values
4. Add facet search for very high-cardinality facets (100+ values)
5. Measure facet interaction after change

**Detection Checklist:**
- [ ] Facet values limited to top 10 (or validated limit)
- [ ] "Show more" pattern for additional values
- [ ] High-cardinality facets have search capability
- [ ] Facet interaction metrics improved

**Related Rules/Skills/Trees:**
- Rule: Limit Visible Facet Values (`faceted-search/05-rules.md:39`)
- Rule: Limit Visible Facets to Top Values (`faceted-search-implementation/05-rules.md:39`)

---

### AP-FS-03: Misordered Facets

**Category:** UX

**Description:** Displaying facet attributes in arbitrary order (alphabetical, declaration order) rather than by user importance.

**Why It Happens:** Default order from engine is used. No thought given to what users need first.

**Warning Signs:**
- Less important facets (color, size) shown before important ones (category, price)
- Users scroll past multiple facets to find commonly used filters
- Facet engagement lower on first-position facets

**Why Harmful:** Users scan left-to-right, top-to-bottom. Important facets below the fold get less engagement. Users may not realize filtering options exist for critical attributes.

**Consequences:**
- Lower facet usage for important attributes
- Users miss key filtering options
- Reduced search refinement

**Alternative:** Order facets by user importance: category first, then price, brand, then other attributes.

**Refactoring Strategy:**
1. Analyze facet usage data (which facets are used most frequently)
2. Order facets by usage frequency
3. Place most-used facets first (category, price)
4. Place least-used facets last
5. A/B test UX impact of new ordering

**Detection Checklist:**
- [ ] Facet order based on user importance/usage
- [ ] Most important facets visible above the fold
- [ ] Facet ordering consistent across application
- [ ] Usage data validates ordering

**Related Rules/Skills/Trees:**
- Rule: Order Facets by Importance (`faceted-search/05-rules.md:76`)
- Skill: Configure and Implement Faceted Search (`faceted-search/06-skills.md:1`)

---

### AP-FS-04: Static Facet Counts Without Dynamic Updates

**Category:** UX

**Description:** Showing facet counts from the initial search without updating them when the user applies filters, displaying misleading counts.

**Why It Happens:** Client-side caching of initial facet data. No re-query when filters change. Simpler implementation.

**Warning Signs:**
- Facet counts don't change when filters are applied
- Users click facet values that show counts but return 0 results
- Facet counts become increasingly inaccurate as more filters are added

**Why Harmful:** Static counts mislead users. A facet showing "Electronics (50)" might actually have 10 results after applying other filters. Users click expecting results and find none.

**Consequences:**
- Users frustrated by non-existent results
- Loss of trust in facet counts
- Abandonment of faceted navigation

**Alternative:** Re-query search with current filters applied to get accurate facet counts.

**Refactoring Strategy:**
1. Re-query search engine whenever filter selection changes
2. Pass all active filters in the facet count query
3. Update UI with new counts
4. Debounce rapid filter changes to avoid excessive queries
5. Test with multiple filters applied

**Detection Checklist:**
- [ ] Facet counts update when filters change
- [ ] No facet shows count > actual results after filtering
- [ ] Debounce implemented for rapid filter changes
- [ ] Users can see accurate counts at each step

**Related Rules/Skills/Trees:**
- Rule: Implement Dynamic Facet Count Updates (`faceted-search-implementation/05-rules.md:75`)
- Skill: Configure and Implement Faceted Search (`faceted-search/06-skills.md:1`)

---

### AP-FS-05: Over-Declaring High-Cardinality Facets

**Category:** Performance

**Description:** Declaring high-cardinality fields (user IDs, order numbers, timestamps) as filterable facets without considering performance impact.

**Why It Happens:** All filterable fields declared uniformly. No distinction between low and high cardinality attributes.

**Warning Signs:**
- Field with 1M+ unique values declared as filterable
- Index build time significantly increased
- Facet count computation slow for high-cardinality fields
- Engine storage increased noticeably

**Why Harmful:** High-cardinality facets generate millions of unique value-count pairs. This increases index size, slows indexing, and may not provide useful user-facing filters.

**Consequences:**
- Slower index builds and updates
- Increased storage costs
- No user benefit (users don't filter by user IDs)

**Alternative:** Only declare fields with limited distinct values (<1000) as filterable facets. Use other mechanisms for high-cardinality filtering.

**Refactoring Strategy:**
1. Audit all declared filterable attributes
2. Identify high-cardinality attributes (>1000 unique values)
3. Remove non-useful high-cardinality facets from filterable attributes
4. For legitimate high-cardinality filtering, use engine-specific features (Meilisearch filterable with `attributesToSearchOn`)
5. Re-index and benchmark performance improvement

**Detection Checklist:**
- [ ] Filterable attributes have reasonable cardinality
- [ ] No useless high-cardinality facets declared
- [ ] Index build time acceptable
- [ ] Facet count computation performant

**Related Rules/Skills/Trees:**
- Rule: Declare All Facetable Attributes in Engine Config (`faceted-search/05-rules.md:1`)
- Skill: Optimize and Monitor Faceted Search Production Search (`faceted-search/06-skills.md:81`)
