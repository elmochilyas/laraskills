# ECC Anti-Patterns — Typesense Dynamic Search Parameters
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Relevance and Ranking | Knowledge Unit | Typesense Dynamic Search Parameters | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Hardcoding Parameters in Controllers Instead of Abstraction
2. Ignoring query_by Field Order Importance
3. One-Size-Fits-All Typo Tolerance
4. Tuning max_candidates Without Latency Monitoring
5. Inconsistent Parameter Passing Through Scout
---
## Repository-Wide Anti-Patterns
- Mixing Typesense-specific logic with application business logic
- Not documenting per-query parameter overrides
- Copying parameter configurations across queries without understanding
---
## Anti-Pattern 1: Hardcoding Parameters in Controllers Instead of Abstraction
### Category
Maintainability | Architecture
### Description
Embedding Typesense-specific search parameters directly in controllers or route handlers instead of abstracting them in dedicated service classes.
### Why It Happens
Quick prototyping that becomes permanent. Developers add Scout callbacks with Typesense params directly where queries are made.
### Warning Signs
- Scout callback closures with Typesense params in controllers
- Duplicated parameter logic across multiple controllers
- No centralized search parameter configuration
- Changing parameters requires modifying multiple files
### Why Harmful
Search parameters become scattered across the codebase. Changing typo tolerance or field weights requires hunting through every controller that performs a search.
### Consequences
- Inconsistent search behavior across the application
- High maintenance cost for parameter changes
- Difficult to onboard new developers to search configuration
- Easy to miss parameter updates during refactoring
### Alternative
Abstract Typesense search parameters into dedicated service classes or search profiles.
### Refactoring Strategy
1. Create a SearchProfile or SearchConfig service class
2. Define default parameter configurations per search context
3. Replace inline Scout callbacks with service class calls
4. Centralize all Typesense parameter definitions
5. Add parameter validation in the service class
### Detection Checklist
- [ ] No Typesense parameters in controllers
- [ ] Search parameters centralized in service classes
- [ ] Parameter changes affect one file only
- [ ] Search behavior consistent across the application
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Ignoring query_by Field Order Importance
### Category
Data Quality | Accuracy
### Description
Setting query_by fields in random or alphabetical order instead of intentionally ordering by field importance, causing less important fields to dominate search.
### Why It Happens
Developers add all searchable fields to query_by without considering that Typesense uses field order to determine priority.
### Warning Signs
- query_by field order matches database column order
- Description/tags matches before title matches
- Important fields buried after less important ones
- Search results prioritize body content over titles
### Why Harmful
Typesense treats the first field in query_by as most important. Random ordering means body content or tags may get equal or higher priority than titles, degrading result quality.
### Consequences
- Poor search relevance due to wrong field priority
- Titles don't match before descriptions
- Users see less relevant results first
- Re-indexing needed if field order is changed in schema
### Alternative
Order query_by fields by descending importance: title first, then key metadata, then body content last.
### Refactoring Strategy
1. Audit current query_by field order
2. Determine correct field priority based on business requirements
3. Reorder fields: most important first, least important last
4. Adjust query_by_weights to fine-tune field importance
5. Test with representative queries to verify improvement
### Detection Checklist
- [ ] query_by fields ordered by importance
- [ ] Title/name fields first in query_by
- [ ] query_by_weights match field importance
- [ ] Search results prioritize important fields
### Related Rules/Skills/Trees
- Rule: Tune in Order of Impact
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: One-Size-Fits-All Typo Tolerance
### Category
Data Quality | User Experience
### Description
Setting the same num_typos value for all fields, including fields where typo tolerance is inappropriate such as SKUs, codes, or IDs.
### Why It Happens
It's simpler to set a global typo tolerance. Developers don't consider per-field typo tolerance needs.
### Warning Signs
- Same num_typos for SKU/ID fields as for description fields
- SKU searches return wrong products due to typo correction
- Exact code searches fail because typos are auto-corrected
- Users can't search by exact product codes
### Why Harmful
Typo tolerance on identifier fields causes false matches. SKU searches return the wrong product because the engine "corrected" the SKU to a similar one.
### Consequences
- E-commerce users see wrong products from SKU searches
- Internal tools can't find exact records
- Trust in search degraded for precise lookups
- Schema changes and re-indexing needed to fix
### Alternative
Set num_typos=0 for identifier/code fields and num_typos=1-2 for text content fields.
### Refactoring Strategy
1. Classify fields by type: identifiers, codes, text content
2. Set num_typos=0 for identifiers and codes
3. Set num_typos=1-2 for text and description fields
4. Test exact searches on identifier fields
5. Verify typo correction still works for content fields
### Detection Checklist
- [ ] num_typos configured per field, not globally
- [ ] Identifiers have num_typos=0
- [ ] Text content has appropriate num_typos
- [ ] Exact code searches work correctly
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: Tuning max_candidates Without Latency Monitoring
### Category
Performance | Operations
### Description
Increasing max_candidates to improve recall without monitoring the impact on query latency, causing slow search performance.
### Why It Happens
max_candidates sounds like a harmless tuning parameter. Developers increase it to improve recall without realizing the performance cost.
### Warning Signs
- Search latency increased after max_candidates change
- No latency monitoring before/after parameter changes
- max_candidates set to very high values (10000+)
- Performance metrics unavailable for search queries
### Why Harmful
Higher max_candidates means more candidates to evaluate, directly increasing query latency. Without performance monitoring, the degradation goes unnoticed until users complain.
### Consequences
- Slow search experience for users
- Increased server load from query processing
- Timeouts on complex queries
- Scaling costs rise due to higher resource usage
### Alternative
Monitor query latency before and after max_candidates changes. Start with default and increase incrementally while measuring impact.
### Refactoring Strategy
1. Establish baseline query latency metrics
2. Increase max_candidates from default incrementally
3. Measure latency at each step
4. Find the sweet spot between recall and performance
5. Set up ongoing latency monitoring for search queries
### Detection Checklist
- [ ] Query latency monitored
- [ ] max_candidates tuned with latency data
- [ ] Latency baseline before changes
- [ ] Performance regression alerts configured
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Inconsistent Parameter Passing Through Scout
### Category
Maintainability | Reliability
### Description
Passing Typesense parameters inconsistently through Scout's callback API in different parts of the application, leading to unpredictable search behavior.
### Why It Happens
Scout's callback API is flexible. Different developers adopt different patterns for passing parameters without team conventions.
### Warning Signs
- Some searches use Scout callbacks, others use model-level config
- Same query in different contexts produces different results
- Mixed approaches: fluent API, raw callbacks, model scopes
- No team convention for parameter passing
### Why Harmful
Inconsistent parameter passing means the same search may behave differently depending on where in the codebase it's executed. Debugging requires tracing through multiple patterns.
### Consequences
- Unpredictable search behavior across the application
- Difficult debugging due to inconsistent patterns
- Team confusion about correct parameter passing approach
- Higher risk of production search bugs
### Alternative
Establish a team convention for passing Typesense parameters through Scout, preferably via a centralized service class.
### Refactoring Strategy
1. Define a single pattern for Scout parameter passing (service class)
2. Audit all existing parameter passing patterns
3. Refactor all searches to use the standardized pattern
4. Add documentation and team guidelines
5. Review new searches for pattern compliance
### Detection Checklist
- [ ] Single consistent pattern for Scout parameter passing
- [ ] Centralized service class used for search parameters
- [ ] No inline Scout callbacks in controllers
- [ ] Team convention documented and followed
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Custom Engine Development
