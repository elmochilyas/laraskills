# ECC Anti-Patterns — Meilisearch Synonym Management
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Synonym and Typology Management | Knowledge Unit | Meilisearch Synonym Management | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Creating Circular Synonym Chains
2. Over-Expansion with Broad Synonyms
3. Not Auditing Synonym Sets Regularly
4. Not Testing Synonyms Before Deployment
5. Relying on Synonyms Instead of Data Quality
---
## Repository-Wide Anti-Patterns
- Managing synonyms through the UI only without version control
- Using one-way synonyms when bidirectional is appropriate
- Not documenting rationale for each synonym mapping
---
## Anti-Pattern 1: Creating Circular Synonym Chains
### Category
Data Quality | Accuracy
### Description
Creating synonyms that form a cycle (A ↔ B, B ↔ C, C ↔ A), causing unpredictable query expansion and degraded relevance.
### Why It Happens
Developers add synonyms incrementally without considering the graph structure of the complete set.
### Warning Signs
- Synonyms defined as A↔B, B↔C, C↔A
- Search queries match too many unrelated documents
- Synonym expansion hard to predict or debug
- No visualization or audit of synonym graph
### Why Harmful
Circular synonym graphs cause every term to expand to every other term. Searching for "shoe" may match documents that mention only "boot" through a chain. The result set becomes imprecise and hard to reason about.
### Consequences
- Unpredictable search result expansion
- Reduced precision from circular matching
- Hard to debug why certain results appear
- Synonym graph becomes unmanageable
### Alternative
Keep synonym graphs acyclic. Use one-way synonyms for directional mappings.
### Refactoring Strategy
1. Export current synonym set
2. Analyze for circular relationships
3. Break cycles by removing one direction or choosing one-way
4. Test each synonym group for expected expansion
5. Implement validation to prevent new cycles
### Detection Checklist
- [ ] Synonym graph analyzed for cycles
- [ ] No circular synonym relationships
- [ ] One-way vs bidirectional choices intentional
- [ ] Cycle prevention validation in place
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Over-Expansion with Broad Synonyms
### Category
Accuracy | Data Quality
### Description
Creating very broad synonym groups that match too many documents, reducing search precision and returning irrelevant results.
### Why It Happens
Teams add synonyms to improve recall without considering precision impact. More synonyms seems better.
### Warning Signs
- Synonym groups with 10+ terms
- Searches return too many loosely related results
- Precision metrics declining after synonym additions
- Users frustrated by irrelevant results in search
### Why Harmful
Broad synonym expansion matches many documents that are only peripherally related. Users get a high-recall, low-precision experience where specific queries return generic results.
### Consequences
- Reduced search precision
- Users must scroll through irrelevant results
- Trust in search eroded by poor matching accuracy
- Hard to undo broad synonyms without impact analysis
### Alternative
Keep synonym groups small (2-4 terms). Prefer precision over recall. Use one-way synonyms for narrower mappings.
### Refactoring Strategy
1. Review synonym groups with 5+ terms
2. Split into smaller, more precise groups
3. Prefer one-way for directional mappings
4. Test precision before and after changes
5. Add synonym group size limit policy
### Detection Checklist
- [ ] Synonym groups limited to 2-4 terms
- [ ] Precision measured before and after synonym changes
- [ ] Broad synonym groups reviewed and split
- [ ] Synonym size policy documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Auditing Synonym Sets Regularly
### Category
Maintainability | Data Quality
### Description
Setting up synonyms once and never reviewing them, allowing outdated, incorrect, or unused mappings to persist indefinitely.
### Why It Happens
Synonym management is a one-time setup task. Ongoing maintenance isn't assigned.
### Warning Signs
- Synonyms unchanged since initial setup months/years ago
- Product terminology changed but synonyms not updated
- Obsolete product names still mapped as synonyms
- No review process for synonym sets
### Why Harmful
Outdated synonyms map discontinued products, old brand names, or incorrect terminology. Users searching for current terms get results matching obsolete content.
### Consequences
- Search results include discontinued/outdated matches
- Product launches create new terminology not in synonyms
- Accumulated synonym rot degrades search quality
- Audit requires significant effort if done rarely
### Alternative
Schedule quarterly synonym audits. Review against query logs and product catalog changes.
### Refactoring Strategy
1. Schedule quarterly synonym review
2. Export current synonym set for review
3. Cross-reference with current product catalog and terminology
4. Remove outdated mappings
5. Add new mappings based on recent zero-result queries
6. Document audit findings and changes
### Detection Checklist
- [ ] Synonym audit scheduled (quarterly)
- [ ] Audit process documented
- [ ] Outdated mappings removed regularly
- [ ] New mappings added based on data
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Not Testing Synonyms Before Deployment
### Category
Reliability | Process
### Description
Deploying synonym changes directly to production without testing with representative queries, risking imprecise or broken search.
### Why It Happens
Synonym changes seem low-risk. Testing requires a staging environment with representative data.
### Warning Signs
- Synonym changes deployed straight to production
- No synonym test queries defined
- Production search quality issues after synonym updates
- Users report unexpected results after synonym changes
### Why Harmful
An incorrect synonym can dramatically expand or alter search results. A one-way synonym where bidirectional was needed can hide content. These issues affect all users until reverted.
### Consequences
- Production search quality degraded by synonym changes
- Users see unexpected results for hours/days
- Hotfix required to revert synonym changes
- Team loses confidence in making synonym updates
### Alternative
Test synonym changes against a query test set in a staging environment before production deployment.
### Refactoring Strategy
1. Create test queries that should be affected by the synonym change
2. Test expected result changes in staging
3. Verify no unexpected side effects
4. Deploy to production with monitoring
5. Monitor CTR and zero-result rate after deployment
### Detection Checklist
- [ ] Synonym changes tested before production
- [ ] Test queries defined for affected searches
- [ ] Staging environment with representative data
- [ ] Production monitoring after synonym changes
### Related Rules/Skills/Trees
- Rule: Create Query Test Set Before Tuning
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Relying on Synonyms Instead of Data Quality
### Category
Data Quality | Process
### Description
Using synonyms to compensate for poor data quality (missing titles, wrong categories) instead of fixing the underlying data.
### Why It Happens
Adding a synonym is easier than fixing data quality issues. Synonyms seem like a quick solution.
### Warning Signs
- Many synonyms mapping terminology that should be in content
- Synonyms used to match content that missing fields should cover
- Data quality issues persist while synonym set grows
- Synonym set size correlates with data quality problems
### Why Harmful
Synonyms mask data quality issues instead of fixing them. The data remains incorrect, affecting all features (not just search). The synonym set grows unmanageably large trying to cover every data gap.
### Consequences
- Bloated synonym sets hard to maintain
- Data quality issues never addressed
- Other features also affected by poor data
- Synonyms become a crutch for systemic data problems
### Alternative
Fix data quality issues at the source. Use synonyms only for genuine terminology variation, not data quality compensation.
### Refactoring Strategy
1. Audit data quality (missing titles, wrong categories)
2. Fix root data quality issues
3. Remove synonyms that existed only to compensate for data gaps
4. Monitor synonym usage: are they helping real terminology variation?
5. Establish data quality monitoring to prevent future issues
### Detection Checklist
- [ ] Data quality issues identified and fixed
- [ ] Synonyms reviewed for data-compensation mappings
- [ ] Compensating synonyms removed
- [ ] Data quality monitoring established
### Related Rules/Skills/Trees
- Rule: Tune in Order of Impact
- Decision: Relevance Tuning Strategy
