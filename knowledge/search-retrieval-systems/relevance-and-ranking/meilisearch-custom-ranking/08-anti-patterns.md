| Metadata | |
|---|---|
| KU ID | K031 |
| Subdomain | relevance-and-ranking |
| Topic | Meilisearch Custom Ranking Rules |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-MCR-01 | Custom Ranking Before Default Rules | Design |
| AP-MCR-02 | Custom Ranking on Non-Numeric Attributes | Design |
| AP-MCR-03 | Overpowering Text Relevance with Business Signals | Performance |
| AP-MCR-04 | Custom Ranking Without Testing | Testing |
| AP-MCR-05 | Too Many Custom Ranking Rules | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-13: Custom ranking rules diluting text relevance (`meilisearch-custom-ranking/04-standardized-knowledge.md:40`)
- RAP-SEARCH-14: Using non-numeric attributes for custom ranking (`meilisearch-custom-ranking/05-rules.md:34`)

---

### AP-MCR-01: Custom Ranking Before Default Rules

**Category:** Design

**Description:** Placing custom ranking rules (popularity, recency) before Meilisearch's default text relevance rules in the ranking rule order.

**Why It Happens:** Over-prioritizing business metrics. Not understanding that earlier rules have more influence.

**Warning Signs:**
- `popularity:desc` appears before `words` in ranking rules
- Popular but textually irrelevant results at top of search
- Text matches diluted by business signals

**Why Harmful:** Earlier ranking rules have more influence. Custom ranking before default rules means business signals override text relevance, pushing away precise matches.

**Consequences:**
- Users see popular but irrelevant results
- Lower satisfaction for specific queries
- Text search quality degraded

**Alternative:** Append custom ranking rules after all seven default text rules.

**Refactoring Strategy:**
1. Audit current ranking rule order
2. Move all custom rules after `exactness`
3. Benchmark NDCG before and after reorder
4. Verify text relevance restored

**Detection Checklist:**
- [ ] Custom rules after default rules
- [ ] Default order: words, typo, proximity, attribute, sort, exactness
- [ ] Text relevance not diluted

**Related Rules/Skills/Trees:**
- Rule: Place Custom Ranking After Default Rules (`meilisearch-custom-ranking/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`meilisearch-custom-ranking/07-decision-trees.md:20`)

---

### AP-MCR-02: Custom Ranking on Non-Numeric Attributes

**Category:** Design

**Description:** Configuring custom ranking rules on string or boolean attributes, which Meilisearch silently ignores for numeric-only ranking.

**Why It Happens:** Assuming any attribute type works. Not reading Meilisearch's numeric-only requirement.

**Warning Signs:**
- `name:asc` or `in_stock:desc` in custom ranking rules
- Custom ranking rule appears configured but has no effect
- Sorting by non-numeric field doesn't change results

**Why Harmful:** Meilisearch silently ignores non-numeric custom ranking rules. Developers think ranking is tuned when nothing happens.

**Consequences:**
- Wasted configuration effort
- Business signals not applied
- Search quality below expectations

**Alternative:** Only use numeric attributes (int, float, timestamp) for custom ranking.

**Refactoring Strategy:**
1. Audit custom ranking rules for non-numeric attributes
2. Replace with numeric equivalents (popularity score, timestamp, price)
3. Verify custom ranking has visible effect
4. Remove non-functional rules

**Detection Checklist:**
- [ ] All custom ranking attributes are numeric
- [ ] Custom ranking has observable effect on results
- [ ] No silent failures from non-numeric rules

**Related Rules/Skills/Trees:**
- Rule: Use Numeric Attributes Only (`meilisearch-custom-ranking/05-rules.md:34`)
- Skill: Configure and Implement Meilisearch Custom Ranking Rules (`meilisearch-custom-ranking/06-skills.md:1`)

---

### AP-MCR-03: Overpowering Text Relevance with Business Signals

**Category:** Performance

**Description:** Using very strong custom ranking weights that cause business signals to dominate text relevance, burying precise matches.

**Why It Happens:** Over-optimizing for business metrics (popularity, margin) at the expense of search quality.

**Warning Signs:**
- Popular items always at top regardless of query match
- Textually irrelevant results rank above precise matches
- CTR improved but user satisfaction declined

**Why Harmful:** Users who search for specific items can't find them because popular items dominate. Trust in search erodes.

**Consequences:**
- Users think search is broken for specific queries
- Reduced user engagement
- Support tickets about missing results

**Alternative:** Test that custom ranking doesn't degrade NDCG for text relevance benchmarks.

**Refactoring Strategy:**
1. Measure NDCG without custom ranking
2. Add custom ranking and re-measure
3. If NDCG drops >2%, reduce custom ranking influence
4. Consider moving custom rules after sort/exactness

**Detection Checklist:**
- [ ] NDCG measured with and without custom ranking
- [ ] Text relevance not significantly degraded
- [ ] Business signals complement, not override, text relevance

**Related Rules/Skills/Trees:**
- Rule: Test Custom Ranking Impact on Text Relevance (`meilisearch-custom-ranking/05-rules.md:69`)
- Decision Tree: Relevance Tuning Strategy (`meilisearch-custom-ranking/07-decision-trees.md:20`)

---

### AP-MCR-04: Custom Ranking Without Testing

**Category:** Testing

**Description:** Deploying custom ranking rules to production without testing their impact on search quality.

**Why It Happens:** Pressure to include business signals. No benchmark infrastructure.

**Warning Signs:**
- Custom ranking added but impact not measured
- No before/after quality comparison
- Business metrics improved but search quality may have degraded

**Why Harmful:** Custom ranking can silently degrade text relevance. Without testing, degradation goes unnoticed.

**Consequences:**
- Undetected search quality regression
- Users frustrated but not reporting (they switch away)
- Revenue loss from frustrated users

**Alternative:** Benchmark search quality before and after custom ranking changes.

**Refactoring Strategy:**
1. Create test query set with relevance judgments
2. Measure NDCG without custom ranking
3. Add custom ranking and re-measure
4. Deploy only if NDCG doesn't degrade
5. Run A/B test for significant changes

**Detection Checklist:**
- [ ] Custom ranking impact measured
- [ ] No NDCG degradation
- [ ] A/B test for significant changes
- [ ] Monitoring in place for regression

**Related Rules/Skills/Trees:**
- Rule: Test Custom Ranking Impact on Text Relevance (`meilisearch-custom-ranking/05-rules.md:69`)
- Skill: Optimize and Monitor Meilisearch Custom Ranking Rules Production Search (`meilisearch-custom-ranking/06-skills.md:81`)

---

### AP-MCR-05: Too Many Custom Ranking Rules

**Category:** Performance

**Description:** Adding many custom ranking rules (5+) that interact in complex, hard-to-debug ways with diminishing returns.

**Why It Happens:** Adding more business signals without evaluating whether each adds value.

**Warning Signs:**
- 5+ custom ranking rules configured
- Ranking behavior hard to explain
- Rules interact in unexpected ways

**Why Harmful:** Each additional rule adds complexity. Multiple rules can conflict, producing unpredictable rankings. Incremental benefit of each new rule diminishes.

**Consequences:**
- Unpredictable ranking
- Hard to debug
- Marginal benefit from additional rules

**Alternative:** Limit to 2-3 most impactful custom ranking rules. Remove rules that don't measurably improve quality.

**Refactoring Strategy:**
1. List all custom ranking rules
2. Remove one rule at a time and measure NDCG impact
3. Keep only rules that improve NDCG
4. Document remaining rules and their contribution
5. Add rule in future only if gain > impact of adding it

**Detection Checklist:**
- [ ] Custom ranking rules ≤ 3
- [ ] Each rule justifies its existence
- [ ] Ranking behavior predictable and debuggable

**Related Rules/Skills/Trees:**
- Rule: Place Custom Ranking After Default Rules (`meilisearch-custom-ranking/05-rules.md:1`)
- Skill: Configure and Implement Meilisearch Custom Ranking Rules (`meilisearch-custom-ranking/06-skills.md:1`)
