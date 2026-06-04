| Metadata | |
|---|---|
| KU ID | K030 |
| Subdomain | relevance-and-ranking |
| Topic | Meilisearch Ranking Rules |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-MRR-01 | Reordering Default Ranking Rules | Design |
| AP-MRR-02 | Custom Ranking Before Default Rules | Design |
| AP-MRR-03 | Deploying Rule Changes Without Testing | Testing |
| AP-MRR-04 | Removing Default Rules Without Justification | Design |
| AP-MRR-05 | Ignoring Rule Interaction Effects | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-13: Custom ranking rules diluting text relevance (`meilisearch-custom-ranking/04-standardized-knowledge.md:40`)
- RAP-SEARCH-06: Deploying ranking changes without offline validation (`ab-testing-search-rankings/04-standardized-knowledge.md:37`)

---

### AP-MRR-01: Reordering Default Ranking Rules

**Category:** Design

**Description:** Changing the order of Meilisearch's default seven ranking rules without data-driven justification.

**Why It Happens:** Belief that a different order could improve results. Underestimating how carefully the defaults are tuned.

**Warning Signs:**
- `rankingRules` replaces default order with custom order
- No benchmark data comparing new order to default
- Reverted to defaults after discovering degradation

**Why Harmful:** Default rules are ordered by Meilisearch based on extensive testing for general-purpose search. Reordering predictably degrades relevance.

**Consequences:**
- Search quality regression
- Hard-to-debug relevance issues
- Time wasted on arbitrary reordering

**Alternative:** Keep default rule order. Add custom rules after defaults.

**Refactoring Strategy:**
1. Revert to default ranking rule order
2. Benchmark NDCG with default vs custom order
3. If custom order was worse (likely), document and keep defaults
4. If custom order is better (rare), document benchmark as justification

**Detection Checklist:**
- [ ] Default rule order preserved
- [ ] Custom rules appended, not interleaved
- [ ] Any reordering justified by benchmark data

**Related Rules/Skills/Trees:**
- Rule: Keep Default Ranking Rule Order (`meilisearch-ranking-rules/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`meilisearch-ranking-rules/07-decision-trees.md:20`)

---

### AP-MRR-02: Custom Ranking Before Default Rules

**Category:** Design

**Description:** Placing custom ranking rules before the default text relevance rules, overriding keyword matching with business signals.

**Why It Happens:** Business stakeholders push for popular items first. Not understanding rule order precedence.

**Warning Signs:**
- `popularity:desc` before `words` in ranking rules
- Popular items dominate regardless of query relevance
- Text matching appears broken

**Why Harmful:** Earlier rules have more influence. Custom ranking before default rules means business signals override text relevance.

**Consequences:**
- Users can't find specific items by search
- Search behaves more like category browsing
- Reduced user satisfaction

**Alternative:** Append custom ranking rules after all default text rules.

**Refactoring Strategy:**
1. Move all custom rules after `exactness`
2. Verify text relevance is restored
3. Benchmark NDCG before and after fix

**Detection Checklist:**
- [ ] Custom rules after default rules
- [ ] Text relevance not overridden
- [ ] NDCG benchmarked

**Related Rules/Skills/Trees:**
- Rule: Add Custom Ranking After Default Rules (`meilisearch-ranking-rules/05-rules.md:40`)
- Rule: Place Custom Ranking After Default Rules (`meilisearch-custom-ranking/05-rules.md:1`)

---

### AP-MRR-03: Deploying Rule Changes Without Testing

**Category:** Testing

**Description:** Changing ranking rules in production without benchmarking or A/B testing the impact.

**Why It Happens:** Underestimating the impact of rule changes. No testing infrastructure.

**Warning Signs:**
- Ranking rules changed in production deploy
- No before/after quality comparison
- Search quality regression reported by users

**Why Harmful:** Ranking rule changes have unpredictable effects. Without testing, degradation reaches users.

**Consequences:**
- Users experience worse search
- Emergency rollback needed
- Lost trust in search functionality

**Alternative:** Test all ranking rule changes offline before production deployment.

**Refactoring Strategy:**
1. Create query test set
2. Measure baseline NDCG
3. Apply rule change in test environment
4. Measure NDCG with new rules
5. Only deploy if NDCG doesn't degrade
6. A/B test significant changes

**Detection Checklist:**
- [ ] Offline testing before production deploy
- [ ] NDCG change documented
- [ ] A/B test for significant changes
- [ ] Rollback plan in place

**Related Rules/Skills/Trees:**
- Rule: Test Rule Changes Before Production (`meilisearch-ranking-rules/05-rules.md:74`)
- Skill: Configure and Implement Meilisearch Ranking Rules (`meilisearch-ranking-rules/06-skills.md:1`)

---

### AP-MRR-04: Removing Default Rules Without Justification

**Category:** Design

**Description:** Removing or disabling default ranking rules (proximity, typo, exactness) without understanding what they do.

**Why It Happens:** Assuming fewer rules = simpler = better. Not understanding each rule's contribution.

**Warning Signs:**
- Fewer than 7 default rules in `rankingRules`
- No documentation on why rules were removed
- Reduced search quality

**Why Harmful:** Each default rule serves a purpose for general search quality. Removing any can degrade specific aspects of relevance.

**Consequences:**
- Degraded relevance in specific areas (typo handling, exact match boosting)
- Hard to diagnose why search feels "off"
- Users notice worse results

**Alternative:** Keep all default rules. Only remove if benchmarked and justified.

**Refactoring Strategy:**
1. Restore all default ranking rules
2. Benchmark quality
3. If removing a specific rule is desired, test with and without
4. Document why rule was removed if justified

**Detection Checklist:**
- [ ] All default rules present
- [ ] Any removed rules have documented justification
- [ ] Baseline quality restored

**Related Rules/Skills/Trees:**
- Rule: Keep Default Ranking Rule Order (`meilisearch-ranking-rules/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`meilisearch-ranking-rules/07-decision-trees.md:20`)

---

### AP-MRR-05: Ignoring Rule Interaction Effects

**Category:** Testing

**Description:** Changing multiple ranking rules at once without understanding how they interact, producing unpredictable ranking behavior.

**Why It Happens:** Multiple changes bundled in one deployment. Not testing rule combinations.

**Warning Signs:**
- Multiple rules changed simultaneously
- Ranking behavior unpredictable
- Cannot attribute quality change to specific rule

**Why Harmful:** Ranking rules interact non-linearly. Adding custom ranking while reordering defaults produces combined effects that are hard to diagnose.

**Consequences:**
- Unpredictable search behavior
- Hard to debug and rollback
- Inconclusive A/B tests

**Alternative:** Change one rule at a time, test each change independently.

**Refactoring Strategy:**
1. Revert all ranking rule changes
2. Apply changes one at a time
3. Test quality after each change
4. Document each change's impact

**Detection Checklist:**
- [ ] Each rule change isolated
- [ ] Quality impact measured per change
- [ ] Rule interactions documented
- [ ] No bundled rule changes

**Related Rules/Skills/Trees:**
- Rule: Test Rule Changes Before Production (`meilisearch-ranking-rules/05-rules.md:74`)
- Skill: Configure and Implement Meilisearch Ranking Rules (`meilisearch-ranking-rules/06-skills.md:1`)
