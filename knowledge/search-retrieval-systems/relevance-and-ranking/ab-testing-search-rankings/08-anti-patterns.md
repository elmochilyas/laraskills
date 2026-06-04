| Metadata | |
|---|---|
| KU ID | ku-12 |
| Subdomain | relevance-and-ranking |
| Topic | A/B Testing Search Rankings |
| Source | Industry |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-ABT-01 | Skipping Offline Evaluation Before A/B Test | Testing |
| AP-ABT-02 | Post-Hoc Metric Selection | Testing |
| AP-ABT-03 | Insufficient Sample Size | Testing |
| AP-ABT-04 | Running A/B Test on Trivial Changes | Design |
| AP-ABT-05 | Ending Test Too Early | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-06: Deploying ranking changes without offline validation (`ab-testing-search-rankings/04-standardized-knowledge.md:37`)
- RAP-SEARCH-07: Making ranking decisions without pre-defined success metrics (`ab-testing-search-rankings/05-rules.md:36`)

---

### AP-ABT-01: Skipping Offline Evaluation Before A/B Test

**Category:** Testing

**Description:** Deploying ranking changes directly to an A/B test with live traffic without first validating the change through offline evaluation (NDCG/MRR on a test set).

**Why It Happens:** Teams are eager to test with real users. Offline evaluation setup requires labeled data that may not exist.

**Warning Signs:**
- Ranking changes deployed to A/B test without offline metrics
- No labeled test set exists for offline evaluation
- Users exposed to ranking changes that could be obviously worse

**Why Harmful:** Offline evaluation is fast, cheap, and identifies regressions without impacting users. Skipping it exposes users to potentially degraded search while the A/B test runs.

**Consequences:**
- Users experience worse search during A/B test
- Negative business impact (lower conversion, engagement)
- Wasted A/B test cycle on changes that offline eval would have rejected

**Alternative:** Build a labeled test set and run offline evaluation (NDCG, MRR) before any A/B test. Only proceed if offline metrics improve.

**Refactoring Strategy:**
1. Collect search logs with user interaction data for 2-4 weeks
2. Create labeled test set with relevance judgments (implicit from clicks or explicit)
3. Implement offline evaluation harness (NDCG@10, MRR)
4. Run baseline metrics on current ranking
5. Run proposed ranking through same evaluation
6. Only proceed to A/B test if metrics improve

**Detection Checklist:**
- [ ] Labeled test set exists
- [ ] Offline evaluation harness implemented
- [ ] Baseline metrics documented
- [ ] Proposed change shows offline improvement before A/B test

**Related Rules/Skills/Trees:**
- Rule: Run Offline Evaluation First (`ab-testing-search-rankings/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`ab-testing-search-rankings/07-decision-trees.md:20`)

---

### AP-ABT-02: Post-Hoc Metric Selection

**Category:** Testing

**Description:** Deciding which metric determines test success after seeing the results, rather than defining the primary metric before the test starts.

**Why It Happens:** Multiple metrics are tracked; the one that showed improvement is naturally favored. This is confirmation bias in action.

**Warning Signs:**
- Test results reported with "we saw improvement in X" where X was not pre-defined
- Different stakeholders interpret results based on different metrics
- No pre-test documentation of primary metric

**Why Harmful:** Post-hoc metric selection makes any result a "success" — you can always find some metric that improved. This invalidates the statistical validity of the test.

**Consequences:**
- False positives deployed as improvements
- Inability to learn from tests (all tests appear successful)
- Erosion of trust in A/B testing process

**Alternative:** Document the primary metric, minimum detectable effect, and secondary metrics before the test starts. Evaluate against pre-defined criteria only.

**Refactoring Strategy:**
1. Create test plan template with required fields: primary metric, secondary metrics, minimum effect
2. Require test plan sign-off before test starts
3. After test concludes, evaluate primary metric first
4. Report secondary metrics as supporting data, not primary conclusions
5. Archive test plans for audit

**Detection Checklist:**
- [ ] Primary metric documented before test start
- [ ] Secondary metrics documented before test start
- [ ] Minimum detectable effect specified
- [ ] Post-hoc metric selection not used in decision

**Related Rules/Skills/Trees:**
- Rule: Define Primary Metric Before Testing (`ab-testing-search-rankings/05-rules.md:36`)
- Rule: Define Primary Success Metric Before Starting (`algolia-ab-testing/05-rules.md:64`)

---

### AP-ABT-03: Insufficient Sample Size

**Category:** Testing

**Description:** Starting an A/B test without calculating the required sample size, resulting in inconclusive results that cannot reach statistical significance.

**Why It Happens:** Lack of statistical training. Teams start tests and hope they will produce clear results.

**Warning Signs:**
- Test runs for weeks without reaching significance
- Results fluctuate between "variant wins" and "control wins" day to day
- Team declares "trend" without statistical significance

**Why Harmful:** A test with insufficient sample size can never produce conclusive results. The time and traffic spent are wasted because the test cannot distinguish between real improvement and random variation.

**Consequences:**
- Weeks of wasted test time
- Inability to make data-driven ranking decisions
- False confidence from non-significant "trends"

**Alternative:** Calculate required sample size using power analysis before starting. Extend duration or accept larger minimum detectable effect if traffic is insufficient.

**Refactoring Strategy:**
1. Estimate baseline metric (e.g., current CTR)
2. Choose minimum detectable effect (e.g., 5% relative improvement)
3. Use power analysis calculator to determine required sample size
4. Estimate time to reach sample size based on current traffic
5. If sample size unachievable, use offline evaluation instead
6. If achievable, set test duration accordingly

**Detection Checklist:**
- [ ] Required sample size calculated before test
- [ ] Test duration set based on sample size calculation
- [ ] Results evaluated only at pre-calculated sample size
- [ ] No early stopping at lower sample size

**Related Rules/Skills/Trees:**
- Rule: Calculate Required Sample Size Upfront (`ab-testing-search-rankings/05-rules.md:70`)
- Rule: Ensure Minimum Traffic for Statistical Validity (`algolia-ab-testing/05-rules.md:95`)

---

### AP-ABT-04: Running A/B Test on Trivial Changes

**Category:** Design

**Description:** Running full A/B tests on minor ranking changes unlikely to produce measurable business impact.

**Why It Happens:** Testing culture without prioritization. Teams test every change regardless of expected impact.

**Warning Signs:**
- A/B tests running on very minor setting changes
- Results consistently show "no significant difference"
- Test setup overhead exceeds value of potential insight

**Why Harmful:** A/B tests consume time (1-4 weeks), traffic (splitting users), and analysis effort. Testing trivial changes wastes resources that could be spent on higher-impact experiments.

**Consequences:**
- Slow iteration cycle (tests queue up)
- Fatigue with A/B testing process
- Resources diverted from meaningful improvements

**Alternative:** Use offline evaluation for minor changes. Reserve A/B tests for changes expected to have meaningful business impact.

**Refactoring Strategy:**
1. Categorize changes by expected impact (low/medium/high)
2. Use offline evaluation for low-impact changes
3. Use A/B test only for medium/high-impact changes
4. Require justification that expected effect exceeds minimum detectable effect
5. Track A/B test value vs setup cost

**Detection Checklist:**
- [ ] Change categorized by expected impact
- [ ] Expected effect exceeds minimum detectable effect
- [ ] Offline evaluation sufficient for low-impact changes
- [ ] A/B test reserved for meaningful changes

**Related Rules/Skills/Trees:**
- Rule: Run Offline Evaluation First (`ab-testing-search-rankings/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`ab-testing-search-rankings/07-decision-trees.md:20`)

---

### AP-ABT-05: Ending Test Too Early

**Category:** Testing

**Description:** Stopping an A/B test as soon as results show statistical significance, without accounting for peeking bias and weekly patterns.

**Why It Happens:** Excitement to deploy a winning variant. Early "significance" is often spurious due to multiple testing over time.

**Warning Signs:**
- Test stopped within first 2 days due to "significant" results
- Results reversed after continuing the test
- No correction for multiple testing (peeking)

**Why Harmful:** Early stopping inflates false positive rates. Results that appear significant after a few days often reverse after capturing a full weekly cycle.

**Consequences:**
- Deploying variants that are no better or worse than control
- Reduced trust in A/B testing process
- Wasted effort on reverting deployed changes

**Alternative:** Pre-determine test duration based on sample size calculation. Do not stop tests early regardless of interim results.

**Refactoring Strategy:**
1. Calculate required sample size and expected duration before test starts
2. Set a minimum test duration (1-2 weeks minimum)
3. Do not check results during the test (or use sequential testing methods)
4. Only evaluate after the pre-determined duration and sample size are reached
5. If results are borderline, extend the test rather than stopping early

**Detection Checklist:**
- [ ] Minimum test duration set before test starts
- [ ] Results not peeked at during test
- [ ] Sample size reached before evaluation
- [ ] No early stopping without statistical correction

**Related Rules/Skills/Trees:**
- Rule: Calculate Required Sample Size Upfront (`ab-testing-search-rankings/05-rules.md:70`)
- Skill: Configure and Implement Ab Testing Search Rankings (`ab-testing-search-rankings/06-skills.md:1`)
