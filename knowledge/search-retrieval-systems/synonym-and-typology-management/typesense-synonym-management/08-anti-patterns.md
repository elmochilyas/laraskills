# ECC Anti-Patterns — Typesense Synonym Management
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Synonym and Typology Management | Knowledge Unit | Typesense Synonym Management | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Expecting Scout to Manage Synonyms Automatically
2. Managing Synonyms Without Version Control
3. Creating Chains with Circular Expansion
4. Using Wrong Synonym Type (one_way vs multi_way)
5. Deploying Synonym Changes Without Testing
---
## Repository-Wide Anti-Patterns
- Not backing up synonym configurations before making changes
- Mixing synonym management approaches across environments
- Using multi_way when one_way better represents the relationship
---
## Anti-Pattern 1: Expecting Scout to Manage Synonyms Automatically
### Category
Architecture | Reliability
### Description
Assuming Scout's `scout:sync-index-settings` will handle Typesense synonym management, when Scout has no synonym API abstraction.
### Why It Happens
Scout abstracts Meilisearch settings well. Developers assume the same for Typesense without checking documentation.
### Warning Signs
- Synonyms not appearing after `scout:sync-index-settings`
- Scout configuration has no synonym section
- Symon management code absent from application
- Typesense API never called for synonym management
### Why Harmful
Synonyms are never created. The feature silently doesn't work. Users search with no synonym expansion, missing relevant results that depend on synonym matching.
### Consequences
- Synonym-dependent results missing from search
- Users miss relevant content due to terminology mismatch
- Team unaware that synonyms aren't implemented
- Debugging time wasted on Scout configuration that can't work
### Alternative
Manage Typesense synonyms via direct API calls using a dedicated service class.
### Refactoring Strategy
1. Create TypesenseSynonymService class wrapping the Typesense synonym API
2. Implement CRUD operations for synonym resources
3. Call service on deployment or via Artisan command
4. Document that Scout does not manage Typesense synonyms
5. Store synonym configurations in version-controlled JSON files
### Detection Checklist
- [ ] Scout synonym management verified as unsupported
- [ ] Direct Typesense API used for synonyms
- [ ] Dedicated synonym service class implemented
- [ ] Synonym deployment process documented
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Managing Synonyms Without Version Control
### Category
Maintainability | Operations
### Description
Creating and modifying synonyms only through the Typesense API or dashboard without storing configurations in version control.
### Why It Happens
Synonyms seem like runtime configuration rather than application code.
### Warning Signs
- Synonym configurations exist only in Typesense
- No JSON files or database records for synonyms
- Cannot rollback synonym changes
- No audit trail for synonym modifications
### Why Harmful
Without version control, synonym changes are unrecoverable. If the Typesense collection is rebuilt, all synonyms are lost. No record of what changed or why.
### Consequences
- Synonym loss on collection rebuild
- No rollback capability for bad synonym changes
- No audit trail for compliance or debugging
- Manual re-creation of synonym sets from memory
### Alternative
Store synonym configurations as version-controlled JSON files. Apply via deployment scripts.
### Refactoring Strategy
1. Export current synonyms from Typesense to JSON
2. Add JSON files to version control
3. Create Artisan command to apply synonyms from JSON
4. Integrate synonym deployment into CI/CD pipeline
5. Document process for synonym changes (edit JSON → commit → deploy)
### Detection Checklist
- [ ] Synonym configurations in version control
- [ ] Artisan command for applying synonyms
- [ ] CI/CD integration for synonym deployment
- [ ] Synonym change history in git
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Creating Chains with Circular Expansion
### Category
Data Quality | Accuracy
### Description
Creating synonym chains where A → B, B → C, resulting in A expanding to C indirectly and causing unpredictable matching.
### Why It Happens
Each synonym mapping seems correct individually, but the combined effect creates unintended transitive expansion.
### Warning Signs
- Multiple one-way synonyms that form chains
- Equivalence unintended: A matched to C through B
- Search results include documents that mention neither original term
- Hard to trace why certain results match
### Why Harmful
Synonym chains create transitive expansion that's hard to predict. A search for "shoe" may match documents about "accessories" through a chain of synonyms, degrading precision.
### Consequences
- Unpredictable query expansion
- Reduced search precision
- Hard to debug matching behavior
- Synonym set becomes untrustworthy
### Alternative
Keep synonym mappings flat. Avoid transitive relationships. Use independent synonym groups.
### Refactoring Strategy
1. Export and review synonym graph structure
2. Identify transitive relationships
3. Flatten chains into direct mappings
4. Test each synonym group independently
5. Implement validation to prevent new chains
### Detection Checklist
- [ ] Synonym chains identified and flattened
- [ ] No transitive expansion in synonym sets
- [ ] Each synonym group tested independently
- [ ] Validation prevents new chains
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Using Wrong Synonym Type (one_way vs multi_way)
### Category
Data Quality | Accuracy
### Description
Using `multi_way` for directional mappings or `one_way` for bidirectional equivalences, causing incorrect query expansion.
### Why It Happens
The difference between bidirectional and directional synonyms is not obvious. Developers default to one type for all mappings.
### Warning Signs
- All synonyms use `multi_way` regardless of relationship
- Searching for a specific brand returns competitor products
- One-way relationships where users expect bidirectional matching
- No thought given to synonym directionality
### Why Harmful
Wrong synonym type causes either over-expansion (`multi_way` for directional) or under-expansion (`one_way` for bidirectional). Users either see irrelevant matches or miss relevant ones.
### Consequences
- Incorrect matching direction for terminology
- Competitor brands showing for brand-name searches
- Users cannot find content using alternative terminology
- Search quality degraded by wrong synonym semantics
### Alternative
Use `multi_way` for genuine bidirectional equivalences. Use `one_way` when the mapping is directional (brand → model, but not model → brand).
### Refactoring Strategy
1. Review each synonym group for directional correctness
2. Convert true equivalences to multi_way
3. Convert directional mappings to one_way
4. Test both directions for each synonym group
5. Document synonym type decision for each group
### Detection Checklist
- [ ] Each synonym group has correct type
- [ ] multi_way used for bidirectional equivalences
- [ ] one_way used for directional mappings
- [ ] Both directions tested for each synonym
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Deploying Synonym Changes Without Testing
### Category
Reliability | Process
### Description
Pushing synonym changes directly to production without testing their impact on search results with representative queries.
### Why It Happens
Synonym changes are perceived as low-risk configuration updates.
### Warning Signs
- Synonym changes deployed without review
- No test queries to validate synonym effect
- Production search behavior changes unexpectedly after synonym updates
- Users report new irrelevant results after synonym changes
### Why Harmful
An incorrect synonym mapping can significantly degrade search quality. A wrongly applied `multi_way` synonym can double the result set with irrelevant matches affecting all users.
### Consequences
- Production search quality degraded
- Users affected before detection
- Emergency rollback required
- Team becomes hesitant to update synonyms
### Alternative
Test synonym changes against a query test set in staging or development before production deployment.
### Refactoring Strategy
1. Create test queries that should be affected by the synonym change
2. Test expected behavior in development/staging
3. Verify no unexpected side effects on other queries
4. Deploy to production with monitoring
5. Monitor zero-result rate and CTR after deployment
### Detection Checklist
- [ ] Synonym changes tested before production
- [ ] Test queries defined for affected searches
- [ ] Staging/development testing done
- [ ] Production monitoring after deployment
### Related Rules/Skills/Trees
- Rule: Create Query Test Set Before Tuning
- Decision: Relevance Tuning Strategy
