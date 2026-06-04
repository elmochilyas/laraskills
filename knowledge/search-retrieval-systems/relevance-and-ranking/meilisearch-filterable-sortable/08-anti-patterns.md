| Metadata | |
|---|---|
| KU ID | K024 |
| Subdomain | relevance-and-ranking |
| Topic | Meilisearch Filterable / Sortable Attributes |
| Source | Meilisearch Docs / Scout |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-MFS-01 | Undeclared Filterable Attributes | Architecture |
| AP-MFS-02 | Declaring Unnecessary Attributes | Performance |
| AP-MFS-03 | String-Typed Numeric Sortable Attributes | Design |
| AP-MFS-04 | Not Re-Importing After Settings Change | Testing |
| AP-MFS-05 | Post-Query Filtering Instead of Declared Filters | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-09: Using Scout `where()` without declaring filterable attributes (`algolia-index-settings/05-rules.md:70`)
- RAP-SEARCH-15: Declaring excessive filterable attributes increasing index bloat (`meilisearch-filterable-sortable/04-standardized-knowledge.md:36`)

---

### AP-MFS-01: Undeclared Filterable Attributes

**Category:** Architecture

**Description:** Using Scout's `where()` on Meilisearch fields not declared in `filterableAttributes`, resulting in silent filter failure.

**Why It Happens:** Adding `where()` clauses without updating engine config. Scout doesn't validate against engine settings.

**Warning Signs:**
- `Product::search($query)->where('field', 'value')` returns unfiltered results
- No error from Meilisearch
- Filtered search shows results from all categories

**Why Harmful:** Meilisearch silently ignores filters on undeclared attributes. Users see unfiltered results.

**Consequences:**
- Filter feature appears broken
- Users abandon search refinement
- Debugging time wasted on silent failure

**Alternative:** Declare all filterable fields in `config/scout.php` before using in `where()`.

**Refactoring Strategy:**
1. Scan codebase for all `where()` calls
2. Add missing fields to `filterableAttributes`
3. Re-import Meilisearch index
4. Verify `where()` returns filtered results

**Detection Checklist:**
- [ ] All `where()` fields in `filterableAttributes`
- [ ] `where()` returns filtered results
- [ ] CI validates filterable declarations

**Related Rules/Skills/Trees:**
- Rule: Declare Filterable Attributes Before Indexing (`meilisearch-filterable-sortable/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`meilisearch-filterable-sortable/07-decision-trees.md:20`)

---

### AP-MFS-02: Declaring Unnecessary Attributes

**Category:** Performance

**Description:** Declaring many filterable/sortable attributes that are never used in queries, increasing index size and slowing updates.

**Why It Happens:** Copying all model attributes into filterable/sortable config. Not being selective.

**Warning Signs:**
- 20+ `filterableAttributes` declared
- Most fields never used in `where()` or facet queries
- Index build time high

**Why Harmful:** Each declared attribute increases index size and slows index updates, especially during large imports.

**Consequences:**
- Larger index size
- Slower index updates
- No benefit for unused declarations

**Alternative:** Declare only attributes actually used in filtering and sorting.

**Refactoring Strategy:**
1. Identify all `filterableAttributes` and `sortableAttributes`
2. Cross-reference with actual `where()` and `orderBy()` usage
3. Remove unused attributes
4. Re-import and measure index size improvement

**Detection Checklist:**
- [ ] Only necessary attributes declared
- [ ] No unused attributes in config
- [ ] Index size acceptable

**Related Rules/Skills/Trees:**
- Rule: Declare Only Necessary Attributes (`meilisearch-filterable-sortable/05-rules.md:39`)
- Skill: Configure and Implement Meilisearch Filterable Sortable (`meilisearch-filterable-sortable/06-skills.md:1`)

---

### AP-MFS-03: String-Typed Numeric Sortable Attributes

**Category:** Design

**Description:** Declaring numeric fields (price, quantity) as sortable when they are stored as strings, causing incorrect alphabetical sort order.

**Why It Happens:** Model attributes stored as strings in database. No type casting to numeric for sortable fields.

**Warning Signs:**
- `price:asc` sorts 100 before 20 (alphabetical)
- Sort order doesn't match numerical expectation
- Price field stored as string in model

**Why Harmful:** Alphabetical sort of numeric-as-string produces incorrect ordering: "100" < "20" < "9.99".

**Consequences:**
- Sorting by price, quantity, or rating gives wrong results
- Users confused by incorrect sort order

**Alternative:** Ensure numeric sortable attributes are cast to float/int in the Eloquent model.

**Refactoring Strategy:**
1. Identify all `sortableAttributes` that are numeric
2. Add type casts in Eloquent model: `protected $casts = ['price' => 'float']`
3. Re-import Meilisearch index
4. Verify correct sort order

**Detection Checklist:**
- [ ] Numeric sortable attributes cast to float/int
- [ ] Sorting produces correct numerical order
- [ ] Model casts include all sortable numeric fields

**Related Rules/Skills/Trees:**
- Rule: Use Numeric Types for Sorting (`meilisearch-filterable-sortable/05-rules.md:70`)
- Decision Tree: Relevance Tuning Strategy (`meilisearch-filterable-sortable/07-decision-trees.md:20`)

---

### AP-MFS-04: Not Re-Importing After Settings Change

**Category:** Testing

**Description:** Updating `filterableAttributes` or `sortableAttributes` in config without re-importing the Meilisearch index, so changes don't take effect.

**Why It Happens:** Assuming config changes apply immediately. Not running `scout:import` after settings update.

**Warning Signs:**
- Settings updated in config but filtering still doesn't work
- `filterableAttributes` change not reflected in engine
- Old settings still active after config change

**Why Harmful:** Meilisearch applies settings during index creation/import. Config-only changes have no effect on existing indexes.

**Consequences:**
- Developers think they fixed filtering but it's still broken
- Wasted debugging
- Users continue seeing broken search

**Alternative:** Run `php artisan scout:sync-index-settings` after settings changes; re-import for attribute additions.

**Refactoring Strategy:**
1. After config change, run `php artisan scout:sync-index-settings`
2. If adding new filterable/sortable fields, re-import: `php artisan scout:import "App\Models\Product"`
3. Verify settings applied in Meilisearch dashboard
4. Document settings change procedure

**Detection Checklist:**
- [ ] `scout:sync-index-settings` run after config change
- [ ] Settings verified in Meilisearch dashboard
- [ ] Re-import performed for attribute additions
- [ ] Settings change procedure documented

**Related Rules/Skills/Trees:**
- Rule: Declare Filterable Attributes Before Indexing (`meilisearch-filterable-sortable/05-rules.md:1`)
- Skill: Configure and Implement Meilisearch Filterable Sortable (`meilisearch-filterable-sortable/06-skills.md:1`)

---

### AP-MFS-05: Post-Query Filtering Instead of Declared Filters

**Category:** Performance

**Description:** Retrieving all search results and filtering in PHP/application code instead of declaring filterable attributes and using Meilisearch's native filtering.

**Why It Happens:** Not knowing about or not configuring `filterableAttributes`. Relying on application-level filtering.

**Warning Signs:**
- `Product::search($query)->get()` followed by `->filter()` in PHP
- No `where()` in search query but post-filtering after retrieval
- Large result sets retrieved then reduced

**Why Harmful:** Post-query filtering retrieves much larger result sets (hundreds) and discards most, wasting bandwidth and memory.

**Consequences:**
- Higher memory usage
- Slower search responses
- More load on search engine

**Alternative:** Declare filterable attributes and use Scout's `where()` for engine-level filtering.

**Refactoring Strategy:**
1. Add all filtered fields to `filterableAttributes` in config
2. Replace post-query `->filter()` with Scout's `->where()`
3. Re-import index
4. Verify filtered results match post-query approach
5. Measure latency and memory improvement

**Detection Checklist:**
- [ ] All filters use Scout `where()`
- [ ] No post-query filtering for simple attribute conditions
- [ ] Engine handles filtering, not application code

**Related Rules/Skills/Trees:**
- Rule: Declare Filterable Attributes Before Indexing (`meilisearch-filterable-sortable/05-rules.md:1`)
- Skill: Optimize and Monitor Meilisearch Filterable Sortable Production Search (`meilisearch-filterable-sortable/06-skills.md:81`)
