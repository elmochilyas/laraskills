| Metadata | |
|---|---|
| KU ID | ku-05 |
| Subdomain | relevance-and-ranking |
| Topic | Personalized Ranking |
| Source | Industry |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-PR-01 | User Embeddings Before Signal Boosting | Design |
| AP-PR-02 | No Cold Start Fallback | Reliability |
| AP-PR-03 | Deploying Personalization Without A/B Test | Testing |
| AP-PR-04 | Ignoring Privacy Regulations | Security |
| AP-PR-05 | Personalization on Anonymous Users | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-16: Deploying personalization without fallback for new users (`personalized-ranking/05-rules.md:37`)
- RAP-SEARCH-17: Implementing ML-based personalization before simpler boosting (`personalized-ranking/04-standardized-knowledge.md:36`)

---

### AP-PR-01: User Embeddings Before Signal Boosting

**Category:** Design

**Description:** Implementing complex user embedding models for personalization before trying simpler signal boosting (preferred categories, brand affinity).

**Why It Happens:** Preference for ML solutions. Underestimating how well simple boosting works.

**Warning Signs:**
- User embedding pipeline implemented as first personalization approach
- No signal boosting code exists
- ML infrastructure for user embeddings before simple features

**Why Harmful:** Signal boosting is simpler, cheaper, and often sufficient. User embeddings require ML infrastructure and training data.

**Consequences:**
- Unnecessary ML complexity
- Months of development for marginal gain
- Ongoing embedding maintenance

**Alternative:** Start with signal boosting (filter/prefer user's preferred categories, brands). Add user embeddings only if boosting reaches diminishing returns.

**Refactoring Strategy:**
1. Identify user preference signals (purchase history, favorites, clicks)
2. Implement boosting: `->whereIn('category', $user->preferredCategories)`
3. A/B test against non-personalized
4. If boosting insufficient, benchmark user embeddings against boosting

**Detection Checklist:**
- [ ] Signal boosting implemented first
- [ ] Boosting impact measured
- [ ] User embeddings justified by boosting comparison

**Related Rules/Skills/Trees:**
- Rule: Start with Signal Boosting Before User Embeddings (`personalized-ranking/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`personalized-ranking/07-decision-trees.md:20`)

---

### AP-PR-02: No Cold Start Fallback

**Category:** Reliability

**Description:** Applying personalization logic to new users without interaction history, returning empty or poor results.

**Why It Happens:** Personalization applied uniformly. Not checking if user has preference data.

**Warning Signs:**
- New users see empty search results
- `whereIn('category', $user->preferredCategories)` with empty array
- `$user->preferences` is null for new users

**Why Harmful:** New users have no history. Personalization filters on empty preferences return zero results, creating a terrible first impression.

**Consequences:**
- New users abandon the platform
- Negative first experience
- High bounce rate for new users

**Alternative:** Check for user history before applying personalization. Fall back to global ranking for cold start users.

**Refactoring Strategy:**
1. Check `$user->hasHistory()` before personalization
2. If no history, use global (non-personalized) search
3. Log personalization coverage (% of users with history)
4. Monitor new user search experience

**Detection Checklist:**
- [ ] Cold start detection implemented
- [ ] Global search fallback for new users
- [ ] Zero-result rate for new users < 5%
- [ ] Personalization coverage monitored

**Related Rules/Skills/Trees:**
- Rule: Implement Cold Start Fallback (`personalized-ranking/05-rules.md:37`)
- Skill: Configure and Implement Personalized Ranking (`personalized-ranking/06-skills.md:1`)

---

### AP-PR-03: Deploying Personalization Without A/B Test

**Category:** Testing

**Description:** Rolling out personalization to all users without A/B testing its impact on search quality.

**Why It Happens:** Overconfidence in personalization benefits. Not understanding that personalization can harm quality.

**Warning Signs:**
- Personalization deployed to 100% of users immediately
- No control group for comparison
- Cannot measure personalization impact

**Why Harmful:** Personalization can reduce search quality if signals are weak or misleading. Users may see worse results than global ranking.

**Consequences:**
- Degraded search for some or all users
- No data to prove improvement
- Hard to roll back

**Alternative:** A/B test personalization against global ranking with CTR and conversion as metrics.

**Refactoring Strategy:**
1. Set up A/B test: 50% control (global), 50% variant (personalized)
2. Run minimum 1 week
3. Compare CTR, conversion, zero-result rate
4. Only deploy globally if personalized improves metrics
5. If no improvement, revert to global ranking

**Detection Checklist:**
- [ ] A/B test run before global deployment
- [ ] Primary metric defined (CTR or conversion)
- [ ] Personalization shows measurable improvement
- [ ] Rollback plan in place

**Related Rules/Skills/Trees:**
- Rule: A/B Test Personalization Impact (`personalized-ranking/05-rules.md:73`)
- Decision Tree: Relevance Tuning Strategy (`personalized-ranking/07-decision-trees.md:20`)

---

### AP-PR-04: Ignoring Privacy Regulations

**Category:** Security

**Description:** Implementing personalization without considering privacy regulations (GDPR, CCPA) that govern behavioral data usage.

**Why It Happens:** Focus on technical implementation. Legal/compliance requirements overlooked.

**Warning Signs:**
- No privacy notice explaining personalization
- No opt-out mechanism for users
- Behavioral data collected without consent
- Data retention policy not defined

**Why Harmful:** Personalization relies on user behavioral data which is regulated. Violations can result in significant fines and reputation damage.

**Consequences:**
- Regulatory fines (GDPR: up to 4% of revenue)
- Legal liability
- User trust erosion

**Alternative:** Implement privacy-by-design: consent collection, opt-out, data retention limits, and anonymization.

**Refactoring Strategy:**
1. Add privacy notice explaining personalization
2. Implement opt-out mechanism
3. Define and enforce data retention policy
4. Anonymize behavioral data after retention period
5. Document compliance with relevant regulations

**Detection Checklist:**
- [ ] Privacy notice displayed
- [ ] Opt-out mechanism available
- [ ] Data retention policy documented
- [ ] Compliance with GDPR/CCPA verified
- [ ] Legal review completed

**Related Rules/Skills/Trees:**
- Rule: Start with Signal Boosting Before User Embeddings (`personalized-ranking/05-rules.md:1`)
- Skill: Configure and Implement Personalized Ranking (`personalized-ranking/06-skills.md:1`)

---

### AP-PR-05: Personalization on Anonymous Users

**Category:** Design

**Description:** Attempting to personalize search for unauthenticated/anonymous users who have no behavioral data.

**Why It Happens:** Applying personalization logic universally without authentication check.

**Warning Signs:**
- Guest users get personalized search treatment
- Anonymous user preferences always empty
- Search results differ for anonymous vs logged-in without cause

**Why Harmful:** Anonymous users have no history. Personalization applied to empty data either returns nothing or uses default behavior indistinguishable from global ranking.

**Consequences:**
- Wasted personalization processing
- Potential empty results for anonymous users
- No benefit for the complexity added

**Alternative:** Skip personalization for anonymous users. Use global ranking. Only apply personalization for authenticated users with history.

**Refactoring Strategy:**
1. Check authentication status before personalization
2. If anonymous, use global ranking
3. If authenticated with history, use personalization
4. If authenticated without history, use cold start fallback

**Detection Checklist:**
- [ ] Personalization only for authenticated users
- [ ] Anonymous users get global ranking
- [ ] No wasted personalization processing on anonymous
- [ ] Coverage metrics distinguish authenticated vs anonymous

**Related Rules/Skills/Trees:**
- Rule: Implement Cold Start Fallback (`personalized-ranking/05-rules.md:37`)
- Rule: A/B Test Personalization Impact (`personalized-ranking/05-rules.md:73`)
