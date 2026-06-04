# ECC Anti-Patterns — Search A/B Testing
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search A/B Testing | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. A/B Testing Without Offline Evaluation First
2. Insufficient Test Duration or Sample Size
3. Not Defining a Primary Metric
4. User Bucketing Inconsistency
5. Ignoring Statistical Significance
---
## Repository-Wide Anti-Patterns
- Running too many simultaneous tests without overlap analysis
- Not monitoring guardrail metrics during tests
- P-hacking: stopping test when result "looks significant"
---
## Anti-Pattern 1: A/B Testing Without Offline Evaluation First
### Category
Process | Efficiency
### Description
Jumping directly to production A/B testing without first validating the change through offline evaluation against a query test set.
### Why It Happens
Teams are eager to see real-user impact. Offline evaluation feels like an unnecessary intermediate step.
### Warning Signs
- Every search change goes directly to A/B test
- No query test set exists for offline evaluation
- A/B test results frequently show no significant difference
- High cost of running A/B tests for changes that offline eval would reject
### Why Harmful
A/B testing requires engineering setup, traffic allocation, and statistical analysis. Running tests for changes that offline evaluation would have rejected wastes weeks of time and resources.
### Consequences
- Slow iteration cycle waiting for A/B test completion
- Expensive testing of changes that offline eval would filter
- Team demoralization from frequent "no significant difference" results
- Production risk from unvalidated-in-offline changes
### Alternative
Run offline evaluation against a query test set first. Only A/B test changes that show measurable improvement offline.
### Refactoring Strategy
1. Create query test set with expected results
2. Establish evaluation script measuring NDCG/MRR
3. Evaluate proposed change offline before A/B test
4. Only proceed to A/B test if offline metrics improve
5. Track offline-to-online correlation
### Detection Checklist
- [ ] Offline evaluation performed before A/B tests
- [ ] Query test set exists
- [ ] Offline improvement demonstrated
- [ ] Offline-to-online correlation tracked
### Related Rules/Skills/Trees
- Rule: Create Query Test Set Before Tuning
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Insufficient Test Duration or Sample Size
### Category
Data Quality | Process
### Description
Running A/B tests for too short a duration or with insufficient sample size to achieve statistical significance, producing unreliable results.
### Why It Happens
Teams are impatient to deploy changes or don't understand statistical power analysis.
### Warning Signs
- Test duration less than 1 week
- No sample size calculation performed before test
- Test stopped as soon as "looks significant" (before planned end)
- Weekday-only testing without weekend data
### Why Harmful
Short tests miss weekly usage patterns (weekend shopping, weekday work). Insufficient sample size means results are not statistically reliable. Early stopping inflates false positive rates.
### Consequences
- Decision to deploy based on unreliable data
- False positives: deploying changes that don't actually help
- False negatives: rejecting good changes due to insufficient power
- Wasted effort from unreliable test conclusions
### Alternative
Run tests for minimum 1-2 weeks with sufficient sample size calculated via power analysis.
### Refactoring Strategy
1. Perform power analysis before test to determine sample size
2. Set minimum test duration of 1 week (2 weeks preferred)
3. Define stopping rule: do not stop before planned end date
4. Include all days of the week in the test period
5. Validate results with confidence intervals
### Detection Checklist
- [ ] Sample size calculated via power analysis
- [ ] Minimum 1 week test duration
- [ ] Test not stopped early for significance
- [ ] Confidence intervals used for decision
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
---
## Anti-Pattern 3: Not Defining a Primary Metric
### Category
Process | Data Quality
### Description
Running A/B tests without a pre-defined primary success metric, allowing subjective interpretation of results.
### Why It Happens
Teams track multiple metrics and pick the one that looks best after the test ends.
### Warning Signs
- Multiple metrics reported without stating which is primary
- "We saw improvement in X metric" (cherry-picking)
- No primary metric documented in test plan
- Test decisions based on anecdotal evidence
### Why Harmful
Without a pre-defined primary metric, you can always find some metric that improved by chance. This invalidates the statistical rigor of the test and leads to false conclusions.
### Consequences
- Biased decision-making from cherry-picked metrics
- Deployment of changes that don't actually improve the user experience
- Inability to learn what really works from tests
- Reduced trust in A/B testing process
### Alternative
Define a single primary metric before the test starts. Secondary metrics are for monitoring side effects only.
### Refactoring Strategy
1. Choose one primary metric (CTR, conversion rate, zero-result rate)
2. Define what constitutes a meaningful improvement (e.g., +5% CTR)
3. Document primary metric and threshold in test plan
4. Monitor secondary metrics for harmful side effects
5. Make deployment decision based only on primary metric
### Detection Checklist
- [ ] Primary metric defined before test
- [ ] Meaningful improvement threshold set
- [ ] Test plan documents primary metric
- [ ] Decision based only on primary metric
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: User Bucketing Inconsistency
### Category
Data Quality | Reliability
### Description
Assigning users to test groups inconsistently (same user in both control and variant), invalidating the test through user allocation corruption.
### Why It Happens
Bucketing by session or cookie without persistent user ID causes the same user to see different variants on different visits.
### Warning Signs
- Same user occasionally sees different variant
- User hash function not deterministic
- Bucketing by session ID instead of user ID
- Test conditions vary for the same user across devices
### Why Harmful
Inconsistent bucketing corrupts the independence assumption. Users who see both variants cannot be reliably attributed. Results become noisy and unreliable.
### Consequences
- Statistical noise obscures real effects
- Diluted treatment effect from mixed-exposure users
- Invalid hypothesis test results
- Inability to attribute user behavior to specific variant
### Alternative
Bucket users consistently by a stable user ID hash. Use the same bucket assignment across sessions.
### Refactoring Strategy
1. Determine stable user identifier (user ID, hashed email)
2. Implement consistent hash-based bucketing
3. Store bucket assignment for user session lifetime
4. Test: same user across devices gets same variant
5. Verify bucket assignment invariants
### Detection Checklist
- [ ] Stable user identifier used for bucketing
- [ ] Consistent hash function implemented
- [ ] Same user always gets same variant
- [ ] Bucket assignment tested across sessions
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Ignoring Statistical Significance
### Category
Data Quality | Process
### Description
Making deployment decisions based on observed metric differences without checking statistical significance, treating noise as signal.
### Why It Happens
Teams don't have statistical expertise or use A/B testing platforms that automatically handle significance.
### Warning Signs
- "CTR improved by 2%" without p-value or confidence interval
- No statistical test applied to results
- Small sample sizes treated as conclusive
- Confident deployment decisions based on tiny metric changes
### Why Harmful
Without statistical significance testing, you cannot distinguish real improvements from random noise. Small metric changes (1-3%) are often just natural variance.
### Consequences
- Deployment of changes that don't actually improve metrics
- Good changes rejected because random noise masked the signal
- Team confidence in A/B testing undermined
- Wasted engineering effort on random metric fluctuations
### Alternative
Apply statistical significance testing (p-value < 0.05) and report confidence intervals before making decisions.
### Refactoring Strategy
1. Choose appropriate statistical test (t-test, chi-squared)
2. Calculate and report p-value for primary metric
3. Report 95% confidence intervals for metric change
4. Only deploy if p-value < 0.05 and effect exceeds minimum threshold
5. Consider Bayesian approaches for more intuitive interpretation
### Detection Checklist
- [ ] Statistical significance testing applied
- [ ] P-value reported for primary metric
- [ ] Confidence intervals included
- [ ] Deployment decision based on significance
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
