| Metadata | |
|---|---|
| KU ID | K022 |
| Subdomain | relevance-and-ranking |
| Topic | Algolia A/B Testing |
| Source | Algolia Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-AAB-01 | Testing Multiple Changes Simultaneously | Testing |
| AP-AAB-02 | Running Tests Under One Week | Testing |
| AP-AAB-03 | Starting Test Without Primary Metric | Testing |
| AP-AAB-04 | A/B Testing with Insufficient Traffic | Testing |
| AP-AAB-05 | Ignoring Secondary Metrics | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-06: Deploying ranking changes without offline validation (`ab-testing-search-rankings/04-standardized-knowledge.md:37`)
- RAP-SEARCH-07: Making ranking decisions without pre-defined success metrics (`ab-testing-search-rankings/05-rules.md:36`)

---

### AP-AAB-01: Testing Multiple Changes Simultaneously

**Category:** Testing

**Description:** Creating an Algolia A/B test with multiple configuration changes between control and variant, making it impossible to attribute metric changes to a specific change.

**Why It Happens:** Convenience — deploying a "bundle" of changes in one test. Lack of understanding that A/B testing requires single-variable isolation.

**Warning Signs:**
- Variant differs from control in multiple settings (ranking, searchableAttributes, facets)
- Test results show improvement but team cannot identify which change caused it
- Multiple configuration files compared in one test

**Why Harmful:** If multiple changes are tested together and metrics improve, you don't know which change(s) caused the improvement (or if some changes hurt and others helped). This prevents iterative optimization.

**Consequences:**
- Inconclusive results — unknown which change to keep
- Risk of deploying harmful changes masked by beneficial ones
- Wasted test — need to re-test individual changes

**Alternative:** Test one configuration change per A/B test. Run sequential tests for each change.

**Refactoring Strategy:**
1. Break planned changes into individual A/B tests
2. Create prioritized testing roadmap
3. Deploy each change as its own A/B test
4. Only combine changes after each is individually validated
5. Document which specific configuration differs between control and variant

**Detection Checklist:**
- [ ] Only one configuration difference between control and variant
- [ ] Ability to attribute metric change to specific change
- [ ] Test plan documents exact difference
- [ ] Multiple changes tested sequentially, not simultaneously

**Related Rules/Skills/Trees:**
- Rule: Test One Change at a Time (`algolia-ab-testing/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`algolia-ab-testing/07-decision-trees.md:20`)

---

### AP-AAB-02: Running Tests Under One Week

**Category:** Testing

**Description:** Running an Algolia A/B test for fewer than 7 days, missing weekly usage patterns and producing biased results.

**Why It Happens:** Impatience for results. Pressure to deploy changes. Not accounting for day-of-week search behavior differences.

**Warning Signs:**
- Test duration set to 2-3 days
- Weekend search patterns not captured
- Results differ dramatically when test is extended

**Why Harmful:** Search behavior varies by day of week — weekday (business queries) vs weekend (leisure queries). Short tests miss these patterns and results are not representative.

**Consequences:**
- Deploying a variant that performs worse on weekends
- Biased test results leading to incorrect decisions
- Need to re-run tests after discovering bias

**Alternative:** Run tests for a minimum of 7 days (14 days recommended). Account for day-of-week effects.

**Refactoring Strategy:**
1. Set minimum test duration to 14 days in Algolia dashboard
2. For high-traffic applications, minimum 7 days
3. Capture test start and end dates in documentation
4. If stopped early, document rationale and potential bias
5. Compare weekday vs weekend performance in analysis

**Detection Checklist:**
- [ ] Test duration ≥ 7 days
- [ ] Both weekday and weekend patterns captured
- [ ] No early stopping before minimum duration
- [ ] Duration documented in test plan

**Related Rules/Skills/Trees:**
- Rule: Run Tests Minimum One Week (`algolia-ab-testing/05-rules.md:34`)
- Skill: Configure and Implement Algolia Ab Testing (`algolia-ab-testing/06-skills.md:1`)

---

### AP-AAB-03: Starting Test Without Primary Metric

**Category:** Testing

**Description:** Starting an Algolia A/B test without defining the primary success metric, allowing post-hoc cherry-picking of whichever metric shows improvement.

**Why It Happens:** Not formalizing the test plan. Teams track multiple Algolia analytics metrics and decide which "counts" after seeing results.

**Warning Signs:**
- No primary metric selected in Algolia dashboard
- Test results summarized as "improved in several metrics"
- Different team members cite different metrics as evidence of success

**Why Harmful:** Without a pre-defined primary metric, any result can be declared a success by selecting the metric that happened to improve. This invalidates the test.

**Consequences:**
- False positives deployed
- Inability to compare results across tests
- Erosion of testing credibility

**Alternative:** Select the primary metric (CTR, conversion, or zero-result rate) in Algolia dashboard before starting the test.

**Refactoring Strategy:**
1. Document primary metric before creating the test
2. Configure primary metric in Algolia A/B test settings
3. Define secondary metrics to monitor for side effects
4. After test ends, evaluate primary metric first
5. Secondary metrics inform decision but don't override primary

**Detection Checklist:**
- [ ] Primary metric selected before test start
- [ ] Primary metric configured in Algolia dashboard
- [ ] Secondary metrics documented
- [ ] Decision based on primary metric

**Related Rules/Skills/Trees:**
- Rule: Define Primary Success Metric Before Starting (`algolia-ab-testing/05-rules.md:64`)
- Decision Tree: Relevance Tuning Strategy (`algolia-ab-testing/07-decision-trees.md:20`)

---

### AP-AAB-04: A/B Testing with Insufficient Traffic

**Category:** Testing

**Description:** Running an Algolia A/B test with fewer than 1000 queries per day, where the test lacks statistical power to detect meaningful differences.

**Why It Happens:** Teams want to use A/B testing regardless of traffic volume. Low-traffic sites still need search improvement decisions.

**Warning Signs:**
- Daily query count < 1000
- Test runs for weeks without reaching significance
- Results fluctuate randomly day to day

**Why Harmful:** With low traffic, the test cannot distinguish between a real improvement and random noise. Results are meaningless regardless of duration.

**Consequences:**
- Wasted time waiting for inconclusive results
- False conclusions from noisy data
- Better approach (offline evaluation) not used

**Alternative:** Use offline evaluation (labeled test set, NDCG) instead of A/B testing when traffic is below 1000 queries/day.

**Refactoring Strategy:**
1. Measure daily search query volume
2. If below 1000 queries/day, skip A/B test
3. Implement offline evaluation with labeled test set
4. Use click-through logs to create implicit relevance judgments
5. Evaluate ranking changes offline with NDCG/MRR

**Detection Checklist:**
- [ ] Daily query volume > 1000 before A/B test
- [ ] Offline evaluation used for low-traffic applications
- [ ] No A/B test running with insufficient power

**Related Rules/Skills/Trees:**
- Rule: Ensure Minimum Traffic for Statistical Validity (`algolia-ab-testing/05-rules.md:95`)
- Decision Tree: BM25 vs Vector Similarity for Relevance (`algolia-ab-testing/07-decision-trees.md:79`)

---

### AP-AAB-05: Ignoring Secondary Metrics

**Category:** Testing

**Description:** Only monitoring the primary metric in an A/B test without checking secondary metrics for potential negative side effects.

**Why It Happens:** Focus on the single "success" number. Secondary metrics are available in Algolia dashboard but not reviewed.

**Warning Signs:**
- Only CTR reviewed in test analysis
- Conversion rate or zero-result rate not checked
- Test declared success despite increased zero-result rate

**Why Harmful:** A ranking change that improves CTR but increases zero-result rate or reduces conversion is harmful overall. Primary metric success can mask negative side effects.

**Consequences:**
- Deploying changes that hurt overall business metrics
- Increased bounce rate from zero-result queries
- Revenue decline despite CTR improvement

**Alternative:** Review all Algolia analytics metrics (primary, secondary, zero-result rate, average click position) before declaring a winner.

**Refactoring Strategy:**
1. Document secondary metrics before test (conversion rate, zero-result rate, avg click position)
2. After test, check primary metric first
3. Then verify secondary metrics did not degrade beyond acceptable threshold
4. Only deploy if primary improves AND secondary are not harmed
5. If secondary metrics degrade, reject the variant regardless of primary improvement

**Detection Checklist:**
- [ ] Secondary metrics documented before test
- [ ] All metrics reviewed after test
- [ ] No secondary metric degraded beyond threshold
- [ ] Decision accounts for both primary and secondary metrics

**Related Rules/Skills/Trees:**
- Rule: Define Primary Success Metric Before Starting (`algolia-ab-testing/05-rules.md:64`)
- Skill: Optimize and Monitor Algolia Ab Testing Production Search (`algolia-ab-testing/06-skills.md:81`)
