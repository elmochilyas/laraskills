# ECC Anti-Patterns — Typesense Typo Tolerance
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Synonym and Typology Management | Knowledge Unit | Typesense Typo Tolerance | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. One-Size-Fits-All Typo Settings for All Fields
2. Not Disabling Typo Tolerance on Identifier Fields
3. Post-Hoc Configuration After Collection Creation
4. Deploying Typo Changes Without Testing
5. Relying on Scout to Configure Typo Settings
---
## Repository-Wide Anti-Patterns
- Setting num_typos too high for short fields causing false positives
- Not documenting typo settings per collection
- Applying same settings across indexes with different characteristics
---
## Anti-Pattern 1: One-Size-Fits-All Typo Settings for All Fields
### Category
Data Quality | Accuracy
### Description
Applying the same typo tolerance configuration to all fields regardless of their content type, missing the opportunity for per-field optimization.
### Why It Happens
Default configuration is applied globally. Developers don't configure per-field overrides.
### Warning Signs
- Same num_typos for description and SKU fields
- No per-field typo tolerance configuration
- Identifier fields corrected as if they were natural text
- Short fields over-corrected, long fields under-corrected
### Why Harmful
Different field types need different typo tolerance. Identifiers need exact matching. Short names need less tolerance than long descriptions. One-size-fits-all either over-corrects identifiers or under-corrects descriptions.
### Consequences
- False matches on identifier fields
- Poor fuzzy matching on long text fields
- Imprecise search results
- User trust eroded from incorrect matches
### Alternative
Configure per-field typo tolerance: disable on identifiers, enable on text fields, adjust thresholds per field type.
### Refactoring Strategy
1. Classify fields by type: identifiers, short text, long text
2. Disable typo tolerance on identifier fields
3. Keep default tolerance on short text fields
4. Enable higher tolerance on long text fields
5. Test per-field behavior with representative queries
### Detection Checklist
- [ ] Per-field typo tolerance configured
- [ ] Identifiers have typo tolerance disabled
- [ ] Short fields have appropriate tolerance
- [ ] Long fields have adequate tolerance
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Not Disabling Typo Tolerance on Identifier Fields
### Category
Data Quality | Accuracy
### Description
Leaving typo tolerance enabled on product codes, SKUs, order numbers, and other identifier fields, causing incorrect matches for exact identifiers.
### Why It Happens
Default configuration applies typo tolerance to all string fields. Developers don't configure field-level exceptions.
### Warning Signs
- SKU "ABC-123" matches "ABD-124"
- Product code searches return wrong products
- Exact lookup features broken by fuzzy matching
- Identifier fields not in per-field typo config
### Why Harmful
Typo tolerance on identifier fields causes false matches. Users searching for a specific SKU may get a different product. This breaks inventory, order management, and customer service workflows.
### Consequences
- Wrong products for exact SKU searches
- Inventory lookup errors
- Customer service unable to find orders
- Trust in search precision destroyed
### Alternative
Disable typo tolerance on all identifier and code fields in the collection schema.
### Refactoring Strategy
1. Identify all identifier fields in collection schema
2. Set `"typo_tolerance": {"enabled": false}` for each identifier field
3. Note: schema changes may require collection re-creation for Typesense
4. Test exact identifier searches
5. Verify text fields still have typo tolerance
### Detection Checklist
- [ ] Identifier fields have typo tolerance disabled
- [ ] Exact SKU searches return exact matches
- [ ] Text fields still have typo tolerance enabled
- [ ] Schema changes applied correctly
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Post-Hoc Configuration After Collection Creation
### Category
Operations | Maintainability
### Description
Realizing typo tolerance settings need adjustment after the Typesense collection is already created and populated, requiring costly collection re-creation.
### Why It Happens
Typesense typo settings are defined at schema creation time. Teams don't plan ahead for typo configuration.
### Warning Signs
- Typo settings configured as an afterthought
- Collection already populated when typo changes needed
- Changes require creating new collection and re-indexing
- Typo settings locked into existing schema
### Why Harmful
Typesense requires collection re-creation to change typo tolerance settings. This is a costly operation requiring re-indexing all data, causing downtime or dual-write complexity.
### Consequences
- Expensive schema changes to fix typo configuration
- Re-indexing time and resource consumption
- Potential downtime during migration
- Avoidance of needed typo adjustments due to cost
### Alternative
Plan typo tolerance configuration at schema design time. Test with sample data before creating the production collection.
### Refactoring Strategy
1. Define typo tolerance requirements before collection creation
2. Create test collection with sample data
3. Test per-field typo tolerance settings
4. Finalize schema before production collection creation
5. Document typo settings as part of collection schema
### Detection Checklist
- [ ] Typo tolerance planned before collection creation
- [ ] Test collection used to validate settings
- [ ] Settings finalized before production creation
- [ ] Schema includes documented typo configuration
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Deploying Typo Changes Without Testing
### Category
Reliability | Process
### Description
Changing typo tolerance settings and deploying without testing the impact on search results, risking unintended matching behavior.
### Why It Happens
Typo tolerance seems like a minor setting. Teams don't treat it as a critical search parameter.
### Warning Signs
- Typo changes deployed directly to production
- No test queries to validate typo tolerance changes
- Unexpected search behavior after typo changes
- Users report new irrelevant or missing results
### Why Harmful
Typo tolerance changes can significantly alter search behavior. Increasing tolerance may cause false matches. Decreasing it may cause zero results for legitimate queries. Both degrade user experience.
### Consequences
- Production search quality degraded by typo changes
- Users affected by unexpected matching changes
- Emergency reversion required
- Team loses confidence in making typo adjustments
### Alternative
Test typo tolerance changes against a query test set before deploying to production.
### Refactoring Strategy
1. Create test queries for each typo tolerance scenario
2. Test changes in development/staging with sample data
3. Compare results before and after changes
4. Deploy to production with monitoring
5. Monitor zero-result rate and CTR after deployment
### Detection Checklist
- [ ] Typo changes tested before production
- [ ] Test queries defined for affected scenarios
- [ ] Before/after results compared
- [ ] Production monitoring after changes
### Related Rules/Skills/Trees
- Rule: Create Query Test Set Before Tuning
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Relying on Scout to Configure Typo Settings
### Category
Architecture | Reliability
### Description
Assuming Scout provides an abstraction for Typesense's per-field typo tolerance settings, when Scout's abstraction is minimal.
### Why It Happens
Scout abstracts Meilisearch settings well. Developers assume the same for Typesense.
### Warning Signs
- Scout configuration file lacks per-field typo settings
- Trying to configure typo via Scout callbacks without success
- Typesense schema created without typo configuration
- Documentation says Scout has limited Typesense abstraction
### Why Harmful
When Scout cannot configure typo settings, they remain at defaults. Per-field typo tolerance is never applied, causing the same issues as the one-size-fits-all anti-pattern.
### Consequences
- Per-field typo tolerance never configured
- Default settings applied to all fields
- Identifier fields over-corrected
- Text fields under-corrected
### Alternative
Configure Typesense typo tolerance directly via schema definitions or Scout callback API, not through Scout's settings abstraction.
### Refactoring Strategy
1. Use Scout's callback API to pass schema settings including typo tolerance
2. Or create collection directly via Typesense SDK with typo configuration
3. Verify per-field settings in Typesense collection
4. Document the approach for future reference
5. Remove reliance on Scout for typo configuration
### Detection Checklist
- [ ] Typo tolerance configured via Typesense API or callback
- [ ] Per-field settings verified in collection
- [ ] Scout's limited abstraction acknowledged
- [ ] Configuration approach documented
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
- Decision: Relevance Tuning Strategy
