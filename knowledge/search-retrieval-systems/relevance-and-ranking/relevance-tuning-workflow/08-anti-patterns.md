# ECC Anti-Patterns — Relevance Tuning Workflow
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Relevance and Ranking | Knowledge Unit | Relevance Tuning Workflow | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Tuning Without a Baseline Test Set
2. Skipping Data Quality Before Ranking Tuning
3. Making Multiple Changes Simultaneously
4. Undocumented Tuning Changes
5. Deploying Unvalidated Tuning Directly to Production
---
## Repository-Wide Anti-Patterns
- Treating relevance tuning as a one-time activity rather than continuous iteration
- Tuning for edge cases before addressing common query patterns
- Ignoring monitoring and alerting for ranking regressions
---
## Anti-Pattern 1: Tuning Without a Baseline Test Set
### Category
Testing | Process
### Description
Starting relevance tuning without a curated set of representative queries with expected results, making all tuning decisions subjective and unmeasurable.
### Why It Happens
Teams rush to improve search results and skip the upfront work of creating a test set. They believe they can "feel" whether results improved.
### Warning Signs
- Tuning decisions based on "this looks better" rather than metrics
- No documented test queries
- Unable to reproduce previous search quality
- Tuning changes reverted without measurement
### Why Harmful
Without a baseline, there is no objective way to measure improvement or regression. Teams make changes that feel right but may actually degrade relevance.
### Consequences
- Unreproducible tuning changes
- Subjective evaluation that varies between team members
- Inability to detect regressions after deployment
- Wasted effort on changes without measurable impact
### Alternative
Always create a baseline test set of 50-100 representative queries with expected top-3 results before any tuning.
### Refactoring Strategy
1. Gather search analytics to identify most common queries
2. Create 50-100 queries covering navigational, informational, and transactional intents
3. Document expected top-3 results for each query
4. Establish baseline NDCG, MRR, and CTR metrics
5. Only begin tuning after baseline is established
### Detection Checklist
- [ ] Query test set exists with 50+ queries
- [ ] Expected results documented for each query
- [ ] Baseline metrics computed and recorded
- [ ] Tuning changes reference baseline comparison
### Related Rules/Skills/Trees
- Rule: Create Query Test Set Before Tuning
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Skipping Data Quality Before Ranking Tuning
### Category
Data Quality | Process
### Description
Jumping to complex ranking rules without first ensuring data quality, masking underlying data issues with over-engineered ranking.
### Why It Happens
Data quality work is unglamorous and time-consuming. Ranking configuration feels like a technical solution, while data fixes feel like janitor work.
### Warning Signs
- Complex ranking rules with many conditions
- Fields with missing values or inconsistent data
- Custom ranking rules compensating for missing data
- Ranking configuration changes without data cleanup
### Why Harmful
No amount of ranking tuning can fix bad data. Ranking rules applied to missing or incorrect data amplify the problems and create unpredictable results.
### Consequences
- Ranking rules that work unreliably due to inconsistent data
- Increased complexity that's hard to maintain
- Masked data quality issues that affect other features
- Effort wasted on complex rules that data cleanup would solve
### Alternative
Establish data quality checks and cleanup processes before tuning ranking. Data quality is the highest-impact tuning lever.
### Refactoring Strategy
1. Audit data quality: completeness, consistency, accuracy
2. Fix data quality issues (missing titles, wrong categories, duplicates)
3. Establish data quality monitoring
4. Only then begin field weight and ranking rule tuning
5. Follow the tuning hierarchy: data quality first
### Detection Checklist
- [ ] Data quality audit performed
- [ ] Missing/incorrect fields identified and corrected
- [ ] Data quality monitoring in place
- [ ] Tuning hierarchy followed (data before ranking rules)
### Related Rules/Skills/Trees
- Rule: Tune in Order of Impact
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 3: Making Multiple Changes Simultaneously
### Category
Process | Testing
### Description
Changing multiple ranking parameters at once, making it impossible to isolate which change caused improvement or regression.
### Why It Happens
Impatience. Developers make several changes in one deployment because each seems small and harmless individually.
### Warning Signs
- Deployment notes say "various ranking tweaks"
- Unable to identify which change caused a metric change
- Tuning sessions with 5+ parameter changes
- Reverting one change requires reverting all
### Why Harmful
When results improve or degrade, you cannot attribute the change to any single parameter. Knowledge about what works is lost. Good changes may be reverted with bad ones.
### Consequences
- Inability to learn which tuning levers are effective
- Risk of deploying harmful changes masked by beneficial ones
- Difficulty debugging ranking regressions
- Wasted tuning effort with no reproducible knowledge
### Alternative
Make one change at a time, measure impact, document the result, then proceed to the next change.
### Refactoring Strategy
1. Prioritize tuning changes by expected impact
2. Apply one change in a dedicated deployment
3. Measure before/after metrics for that single change
4. Document the change, rationale, and impact
5. Proceed to next change only after evaluation
### Detection Checklist
- [ ] Each deployment contains a single tuning change
- [ ] Before/after metrics recorded for each change
- [ ] Change rationale documented
- [ ] Revert plan documented for each change
### Related Rules/Skills/Trees
- Rule: Document Every Tuning Change
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Undocumented Tuning Changes
### Category
Maintainability | Process
### Description
Making ranking configuration changes without documenting why, what was changed, or what impact was observed, creating unreproducible tuning knowledge.
### Why It Happens
Developers assume they will remember the rationale. Documentation feels like overhead that slows down the tuning iteration cycle.
### Warning Signs
- Ranking configuration with no comments
- "Why did we set this weight to 3?" — no one knows
- New team members cannot understand ranking decisions
- Previous tuning changes are re-visited unnecessarily
### Why Harmful
Undocumented tuning is unreproducible. Team members leave, context is lost, and the same tuning mistakes are repeated. Ranking configuration becomes tribal knowledge.
### Consequences
- Knowledge loss when team members change
- Repeated tuning of the same parameters
- Inability to explain ranking decisions to stakeholders
- Difficulty onboarding new developers to search features
### Alternative
Document each tuning change with timestamp, reason, what was changed, and measured impact.
### Refactoring Strategy
1. Create a changelog file for ranking configuration
2. For each tuning change, record date, person, change, reason, impact
3. Add inline comments to ranking configuration
4. Review undocumented configuration and reconstruct rationale
5. Make documentation part of the definition of done for tuning
### Detection Checklist
- [ ] Ranking configuration has inline comments
- [ ] Changelog exists for all tuning changes
- [ ] Each entry has date, reason, change, impact
- [ ] New team members can understand ranking rationale
### Related Rules/Skills/Trees
- Rule: Document Every Tuning Change
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Deploying Unvalidated Tuning Directly to Production
### Category
Reliability | Operations
### Description
Pushing ranking changes directly to production without offline evaluation or A/B testing, risking user-facing search degradation.
### Why It Happens
Teams lack staging environments with representative data. Direct deployment is faster than setting up evaluation pipelines.
### Warning Signs
- Ranking changes deployed without offline evaluation
- No A/B testing infrastructure for search
- Production search quality notices after deployments
- Stakeholders complain about search quality changes
### Why Harmful
Ranking changes that seem beneficial in development may perform poorly on real user queries and data distributions. Production users experience the degradation first.
### Consequences
- User-facing search quality degradation
- Lost revenue or engagement from poor search results
- Time pressure to hotfix or revert
- Erosion of user trust in search functionality
### Alternative
Evaluate tuning changes offline first using the query test set, then A/B test significant changes in production.
### Refactoring Strategy
1. Create offline evaluation pipeline using query test set
2. Evaluate all tuning changes against baseline before deployment
3. Set up A/B testing for significant ranking changes
4. Deploy changes gradually (canary or percentage rollout)
5. Monitor search metrics for regression after deployment
### Detection Checklist
- [ ] Offline evaluation performed before production deployment
- [ ] A/B testing infrastructure available
- [ ] Monitoring detects ranking regressions automatically
- [ ] Rollback plan documented for each tuning change
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Decision: Cross-Encoder Reranking Strategy
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
