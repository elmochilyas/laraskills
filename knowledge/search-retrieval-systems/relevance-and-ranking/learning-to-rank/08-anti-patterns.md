| Metadata | |
|---|---|
| KU ID | ku-06 |
| Subdomain | relevance-and-ranking |
| Topic | Learning to Rank |
| Source | Academic / Industry |
| Maturity | Mature (ML research) |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-LTR-01 | Implementing LTR Before Exhausting Rules | Architecture |
| AP-LTR-02 | Choosing Complex LTR Approach First | Design |
| AP-LTR-03 | Neglecting Feature Engineering | Design |
| AP-LTR-04 | Not Retraining LTR Models Regularly | Maintainability |
| AP-LTR-05 | LTR on Low-Traffic Search | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-12: Implementing advanced ranking before basic tuning is exhausted (`learning-to-rank/04-standardized-knowledge.md:35`)
- RAP-SEARCH-06: Deploying ranking changes without offline validation (`ab-testing-search-rankings/04-standardized-knowledge.md:37`)

---

### AP-LTR-01: Implementing LTR Before Exhausting Rules

**Category:** Architecture

**Description:** Investing in Learning to Rank infrastructure before fully tuning rules-based ranking (field weights, custom ranking, synonyms, typo tolerance).

**Why It Happens:** Appeal of ML-driven solutions. Underestimating how far rules-based tuning can go.

**Warning Signs:**
- LTR model development started without tuning basic ranking rules
- Rules-based ranking levers not fully explored
- Team cannot quantify why rules are insufficient

**Why Harmful:** LTR requires significant ML infrastructure, labeled data, and ongoing maintenance. Most applications achieve sufficient relevance with rules alone.

**Consequences:**
- Unnecessary ML infrastructure investment
- Months of LTR development when simpler tuning would suffice
- Ongoing LTR maintenance burden

**Alternative:** Exhaust rules-based tuning first. Only consider LTR when improvement from rules has plateaued.

**Refactoring Strategy:**
1. Audit current ranking configuration
2. Tune field weights, custom ranking, typo tolerance, synonyms
3. Measure NDCG after each tuning round
4. If NDCG plateaus below target, evaluate LTR feasibility
5. Document why rules-based tuning was insufficient

**Detection Checklist:**
- [ ] Rules-based tuning fully explored
- [ ] Diminishing returns from rules documented
- [ ] LTR justified with data
- [ ] Team has ML infrastructure for LTR

**Related Rules/Skills/Trees:**
- Rule: Exhaust Rules-Based Ranking Before LTR (`learning-to-rank/05-rules.md:1`)
- Decision Tree: BM25 vs Vector Similarity for Relevance (`learning-to-rank/07-decision-trees.md:79`)

---

### AP-LTR-02: Choosing Complex LTR Approach First

**Category:** Design

**Description:** Starting with listwise LTR or deep learning models when pairwise or pointwise would suffice.

**Why It Happens:** Preference for state-of-the-art methods. Not matching complexity to problem difficulty.

**Warning Signs:**
- Listwise LTR implemented first
- Deep learning ranking model for small dataset
- Simple baseline never evaluated

**Why Harmful:** Complex LTR methods require more data, more tuning, and more compute. Simple methods often perform comparably.

**Consequences:**
- Longer development time
- Overfitting on small datasets
- Higher compute costs

**Alternative:** Start with pairwise LTR (best complexity-effectiveness balance). Only move to listwise if benchmarks justify it.

**Refactoring Strategy:**
1. Implement pairwise LTR baseline
2. Measure NDCG improvement over rules-based ranking
3. If quality sufficient, deploy pairwise model
4. If not, implement listwise and compare against pairwise

**Detection Checklist:**
- [ ] Pairwise LTR baseline implemented
- [ ] Complex LTR justified by pairwise comparison
- [ ] Model complexity matches data and requirements

**Related Rules/Skills/Trees:**
- Rule: Use Pairwise LTR for Most Applications (`learning-to-rank/05-rules.md:37`)
- Decision Tree: Relevance Tuning Strategy (`learning-to-rank/07-decision-trees.md:20`)

---

### AP-LTR-03: Neglecting Feature Engineering

**Category:** Design

**Description:** Spending more effort on model architecture selection than on feature engineering for LTR.

**Why It Happens:** Model architecture is more interesting. Features are harder to design.

**Warning Signs:**
- Model tuning iterations > feature engineering iterations
- Feature set is basic (query-doc match only)
- Complex model with few features

**Why Harmful:** Good features consistently outperform model complexity. Weak features limit any model's ceiling.

**Consequences:**
- LTR underperforms despite model complexity
- Hours spent tuning hyperparameters instead of building features
- Missed ranking signals

**Alternative:** Invest in feature engineering: query features, document features, match features, user features.

**Refactoring Strategy:**
1. Audit current feature set
2. Add 3-5 new features per round (click signals, recency, popularity, user preferences)
3. Measure NDCG improvement per feature batch
4. Remove features that don't improve metrics
5. Keep iterating features before considering model changes

**Detection Checklist:**
- [ ] Feature count documented
- [ ] Feature engineering effort > model tuning effort
- [ ] Each feature's impact measured
- [ ] Feature set reviewed regularly

**Related Rules/Skills/Trees:**
- Rule: Feature Engineering Over Model Choice (`learning-to-rank/05-rules.md:68`)
- Decision Tree: Relevance Tuning Strategy (`learning-to-rank/07-decision-trees.md:20`)

---

### AP-LTR-04: Not Retraining LTR Models Regularly

**Category:** Maintainability

**Description:** Training an LTR model once and using it indefinitely without retraining on fresh data.

**Why It Happens:** One-time training is easier. No retraining pipeline established.

**Warning Signs:**
- LTR model last trained months ago
- Model performance metrics declining
- User behavior or content has changed since training

**Why Harmful:** Search patterns, user preferences, and content change over time. An outdated LTR model degrades in quality.

**Consequences:**
- Gradual search quality decline
- Users notice worsening results
- Manual retraining needed in crisis

**Alternative:** Establish a retraining schedule (weekly or monthly) with automated pipeline.

**Refactoring Strategy:**
1. Measure current model NDCG vs baseline
2. If degraded, retrain on recent data
3. Set up automated retraining pipeline (scheduled job)
4. Monitor model quality metrics for degradation
5. Alert if NDCG drops below threshold

**Detection Checklist:**
- [ ] Retraining schedule established
- [ ] Automated pipeline in place
- [ ] Quality metrics monitored
- [ ] Degradation alerts configured

**Related Rules/Skills/Trees:**
- Rule: Use Pairwise LTR for Most Applications (`learning-to-rank/05-rules.md:37`)
- Skill: Optimize and Monitor Learning to Rank Production Search (`learning-to-rank/06-skills.md:81`)

---

### AP-LTR-05: LTR on Low-Traffic Search

**Category:** Design

**Description:** Implementing Learning to Rank for applications with low search traffic (<10,000 queries/day) where insufficient training data exists.

**Why It Happens:** Teams want the best ranking possible. Not understanding LTR's data requirements.

**Warning Signs:**
- Daily query volume < 10,000
- Click logs too sparse for meaningful training
- LTR model doesn't outperform simple ranking rules

**Why Harmful:** LTR requires large amounts of training data (click logs, expert judgments). Low-traffic applications produce insufficient data, leading to underfit models.

**Consequences:**
- LTR model performs no better than rules
- ML infrastructure cost for no benefit
- Complex system without improvement

**Alternative:** Use rules-based ranking for low-traffic applications. Reserve LTR for high-traffic search.

**Refactoring Strategy:**
1. Measure daily search query volume
2. If < 10,000, focus on rules-based tuning
3. If between 10,000-100,000, consider pairwise LTR with regularization
4. If > 100,000, full LTR pipeline with retraining is feasible

**Detection Checklist:**
- [ ] Search traffic volume meets LTR minimum
- [ ] Sufficient training data available
- [ ] Simpler alternatives exhausted
- [ ] LTR improvement validated

**Related Rules/Skills/Trees:**
- Rule: Exhaust Rules-Based Ranking Before LTR (`learning-to-rank/05-rules.md:1`)
- Decision Tree: BM25 vs Vector Similarity for Relevance (`learning-to-rank/07-decision-trees.md:79`)
