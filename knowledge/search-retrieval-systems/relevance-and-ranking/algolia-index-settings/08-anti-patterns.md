| Metadata | |
|---|---|
| KU ID | K019 |
| Subdomain | relevance-and-ranking |
| Topic | Algolia Index Settings via Scout Config |
| Source | Algolia Docs / Scout |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-AIS-01 | Managing Index Settings via Dashboard Only | Maintainability |
| AP-AIS-02 | Misordered searchableAttributes | Design |
| AP-AIS-03 | Missing attributesForFaceting Declaration | Architecture |
| AP-AIS-04 | Sorting Without Replica Indexes | Architecture |
| AP-AIS-05 | Settings Changes Without Re-Importing | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-08: Managing search configuration outside version control (`algolia-index-settings/04-standardized-knowledge.md:11`)
- RAP-SEARCH-09: Using Scout `where()` without declaring filterable attributes (`algolia-index-settings/05-rules.md:70`)

---

### AP-AIS-01: Managing Index Settings via Dashboard Only

**Category:** Maintainability

**Description:** Configuring Algolia index settings through the Algolia dashboard without storing them in `config/scout.php`, losing version control and reproducibility.

**Why It Happens:** Dashboard UI is convenient for exploration. Teams may not know Scout supports code-based index settings.

**Warning Signs:**
- No `index-settings` key in `config/scout.php`
- Configuration drift between environments (dev/staging/prod)
- Settings lost when environment is reset

**Why Harmful:** Dashboard-only configuration cannot be version-controlled, reviewed in PRs, or deployed via CI/CD. Settings drift between environments, causing inconsistent search behavior.

**Consequences:**
- Hard to reproduce index settings in new environments
- Accidental configuration changes without audit trail
- Deployments that break search due to missing settings

**Alternative:** Define all Algolia index settings in `config/scout.php` under the `algolia.index-settings` key.

**Refactoring Strategy:**
1. Export current Algolia index settings from dashboard
2. Map them to `config/scout.php` under the correct model class
3. Remove dashboard-only configuration
4. Add CI check that index settings match `scout.php` configuration
5. Document settings change process (code change, not dashboard)

**Detection Checklist:**
- [ ] All settings defined in `config/scout.php`
- [ ] No settings-only-configured-in-dashboard
- [ ] CI validates settings match configuration
- [ ] PR approval required for settings changes

**Related Rules/Skills/Trees:**
- Rule: Version-Control Index Settings in scout.php (`algolia-index-settings/05-rules.md:1`)
- Skill: Configure and Implement Algolia Index Settings (`algolia-index-settings/06-skills.md:1`)

---

### AP-AIS-02: Misordered searchableAttributes

**Category:** Design

**Description:** Ordering Algolia `searchableAttributes` with less important fields first, diluting the ranking impact of important fields like title.

**Why It Happens:** Fields added in arbitrary order. No awareness that Algolia uses field order to determine ranking importance.

**Warning Signs:**
- `title` listed after `description` or `tags` in searchableAttributes
- Title matches score lower than body matches
- Top results show body matches over title matches

**Why Harmful:** Algolia ranks matches in earlier `searchableAttributes` higher. Putting `title` last means a body match can outrank a title match for the same query.

**Consequences:**
- Less relevant top results
- Users see less specific matches
- Lower CTR for important queries

**Alternative:** Order `searchableAttributes` with the most important fields first (title, brand, then less important fields).

**Refactoring Strategy:**
1. Audit current `searchableAttributes` order in `config/scout.php`
2. Reorder with `title` first, then meaningful identifiers, then supporting fields
3. Deploy settings change and re-import
4. Verify title matches now rank higher than description matches
5. A/B test CTR change

**Detection Checklist:**
- [ ] `searchableAttributes` ordered by importance (title first)
- [ ] Title matches rank higher than body matches
- [ ] Field order reflects business relevance priority

**Related Rules/Skills/Trees:**
- Rule: Order searchableAttributes by Importance (`algolia-index-settings/05-rules.md:41`)
- Decision Tree: Relevance Tuning Strategy (`algolia-index-settings/07-decision-trees.md:20`)

---

### AP-AIS-03: Missing attributesForFaceting Declaration

**Category:** Architecture

**Description:** Using Scout's `where()` method to filter on attributes that are not declared in Algolia's `attributesForFaceting`, causing silent filter failure.

**Why It Happens:** Easy to add a `where()` clause without remembering to update the engine configuration. Scout doesn't warn about undeclared filter attributes.

**Warning Signs:**
- `Product::search($query)->where('field', 'value')` returns unfiltered results
- No error or warning from Scout or Algolia
- Users see products from all categories when filtering by category

**Why Harmful:** Algolia silently ignores filters on undeclared facet attributes. Users see unfiltered results and assume filtering is broken.

**Consequences:**
- Users frustrated by non-functional filters
- Abandonment of search refinement
- Time wasted debugging why filters don't work

**Alternative:** Keep `attributesForFaceting` synchronized with all fields used in `where()` calls. Add CI check to validate.

**Refactoring Strategy:**
1. Identify all `where()` calls across the application
2. Add any missing fields to `attributesForFaceting` in `config/scout.php`
3. Re-import to apply new settings
4. Add unit test that `where()` returns filtered results
5. Add deployment check that ensures `attributesForFaceting` covers all `where()` fields

**Detection Checklist:**
- [ ] All `where()` fields are in `attributesForFaceting`
- [ ] `where()` returns filtered (not unfiltered) results
- [ ] CI validates no undeclared filter attributes
- [ ] New model searchable attributes include facet declarations

**Related Rules/Skills/Trees:**
- Rule: Declare All attributesForFaceting (`algolia-index-settings/05-rules.md:70`)
- Decision Tree: Relevance Tuning Strategy (`algolia-index-settings/07-decision-trees.md:20`)

---

### AP-AIS-04: Sorting Without Replica Indexes

**Category:** Architecture

**Description:** Using `orderBy()` in Scout search queries without configuring corresponding Algolia replica indexes, resulting in unexpected or incorrect sort orders.

**Why It Happens:** Assumption that `orderBy()` works like Eloquent's. Not understanding that Algolia requires dedicated replica indexes for sorting.

**Warning Signs:**
- `Product::search($query)->orderBy('price', 'asc')` returns unexpected order
- Sort request appears to be ignored
- No replica indexes defined in `config/scout.php`

**Why Harmful:** Without replicas, sort requests on non-relevance fields produce undefined behavior. Users see results in incorrect order, making sorting features unreliable.

**Consequences:**
- Users cannot sort products by price or date
- Frustration with broken sort functionality
- Support tickets about search sorting

**Alternative:** Define replica indexes for each required sort order in `config/scout.php`.

**Refactoring Strategy:**
1. Identify all `orderBy()` calls in search queries
2. Create replica indexes in `config/scout.php` for each unique sort order
3. Configure replica ranking for each sort order
4. Re-import to create replica indexes
5. Verify `orderBy()` returns correctly sorted results
6. Remove `orderBy()` calls that don't have replicas

**Detection Checklist:**
- [ ] Replica indexes defined for each sort order
- [ ] `orderBy()` returns correctly ordered results
- [ ] Replicas configured in `config/scout.php`
- [ ] No `orderBy()` without corresponding replica

**Related Rules/Skills/Trees:**
- Rule: Use Replicas for Different Sort Orders (`algolia-index-settings/05-rules.md:100`)
- Skill: Configure and Implement Algolia Index Settings (`algolia-index-settings/06-skills.md:1`)

---

### AP-AIS-05: Settings Changes Without Re-Importing

**Category:** Testing

**Description:** Updating index settings in `config/scout.php` without re-importing data, resulting in settings not being applied to existing indexes.

**Why It Happens:** Developers update settings in configuration but don't run `scout:import` afterward. Settings changes are not retroactive.

**Warning Signs:**
- Settings updated in code but index behavior unchanged
- `php artisan scout:sync-index-settings` not run after settings change
- New documents indexed correctly but old documents use old settings

**Why Harmful:** Settings are applied during index creation or import, not on configuration file change. Without re-importing, settings take effect only for new indexes.

**Consequences:**
- Inconsistent search behavior (new vs old data)
- Confusion about why settings changes didn't take effect
- Wasted debugging time

**Alternative:** Run `php artisan scout:import` or `scout:sync-index-settings` after every settings change.

**Refactoring Strategy:**
1. Add settings change to deployment checklist
2. After updating `config/scout.php`, run `php artisan scout:sync-index-settings`
3. For major settings changes (searchableAttributes reorder), re-import: `php artisan scout:import "App\Models\Product"`
4. Verify settings applied by checking Algolia dashboard
5. Document settings change procedure in runbook

**Detection Checklist:**
- [ ] `scout:sync-index-settings` run after settings change
- [ ] Settings verified in Algolia dashboard after deployment
- [ ] Re-import performed for major settings changes
- [ ] Settings change procedure documented

**Related Rules/Skills/Trees:**
- Rule: Version-Control Index Settings in scout.php (`algolia-index-settings/05-rules.md:1`)
- Skill: Configure and Implement Algolia Index Settings (`algolia-index-settings/06-skills.md:1`)
