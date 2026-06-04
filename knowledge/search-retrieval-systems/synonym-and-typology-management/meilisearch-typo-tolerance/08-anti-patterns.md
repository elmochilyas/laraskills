# ECC Anti-Patterns — Meilisearch Typo Tolerance
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Synonym and Typology Management | Knowledge Unit | Meilisearch Typo Tolerance | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Disabling Typo Tolerance Globally
2. Not Disabling Typo Tolerance on Identifier Fields
3. Overly Aggressive Typo Thresholds
4. Not Syncing Typo Settings via scout:sync-index-settings
5. Ignoring Language-Specific Configuration
---
## Repository-Wide Anti-Patterns
- Applying same typo tolerance settings across all environments without testing
- Not using disableOnWords for brand names that should match exactly
- Forgetting that typo tolerance affects scoring (exact matches rank higher)
---
## Anti-Pattern 1: Disabling Typo Tolerance Globally
### Category
User Experience | Data Quality
### Description
Turning off typo tolerance for all fields, forcing exact-match search that fails on any user misspelling.
### Why It Happens
Developers want precise search results and disable typo tolerance, not realizing the severe degradation in user experience.
### Warning Signs
- Typo tolerance disabled in configuration
- Users must type exact spelling to find results
- High zero-result rate from common misspellings
- Search feels strict and unforgiving
### Why Harmful
Without typo tolerance, even a single character misspelling returns zero results. Most users make typos, especially on mobile. The search becomes unusable for real-world usage.
### Consequences
- Extreme zero-result rates from minor typos
- Mobile users severely affected
- Search perceived as broken or low quality
- Users go elsewhere rather than retype correctly
### Alternative
Keep typo tolerance enabled with default thresholds. Disable only on specific fields requiring exact matches.
### Refactoring Strategy
1. Re-enable typo tolerance globally
2. Keep default minWordSizeForTypos (1 typo at 5 chars, 2 typos at 9 chars)
3. Add specific fields to disableOnAttributes for exact-match needs
4. Test common misspellings are now handled
5. Monitor zero-result rate reduction
### Detection Checklist
- [ ] Typo tolerance enabled
- [ ] Zero-result rate decreased after re-enabling
- [ ] Exact-match fields handled via disableOnAttributes
- [ ] Mobile search experience improved
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Not Disabling Typo Tolerance on Identifier Fields
### Category
Data Quality | Accuracy
### Description
Leaving typo tolerance enabled on identifier fields (SKUs, order numbers, serial codes), causing incorrect matches for exact identifiers.
### Why It Happens
Default configuration enables typo tolerance on all fields. Developers don't configure per-field exceptions.
### Warning Signs
- SKU "ABC-123" matches "ABD-124" due to typo tolerance
- Product code searches return wrong products
- Exact code lookup fails because tolerance matches similar codes
- No disableOnAttributes configured
### Why Harmful
Typo tolerance on identifiers causes false matches. A search for a specific SKU may return a different product because the engine "corrected" the code. This breaks inventory lookups and order management.
### Consequences
- Wrong products shown for SKU searches
- Inventory management errors
- Customer service cannot find exact orders
- Trust in search precision destroyed
### Alternative
Disable typo tolerance on identifier fields via `disableOnAttributes`.
### Refactoring Strategy
1. Identify all identifier/code fields (SKU, serial_number, order_id)
2. Add to `disableOnAttributes` in typo tolerance config
3. Sync settings via `scout:sync-index-settings`
4. Test exact identifier searches return only exact matches
5. Verify general text fields still have typo tolerance
### Detection Checklist
- [ ] disableOnAttributes configured for identifier fields
- [ ] SKU searches return exact matches only
- [ ] General text fields still have typo tolerance
- [ ] Settings synced to production
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Overly Aggressive Typo Thresholds
### Category
Accuracy | User Experience
### Description
Setting high typo counts for short words, causing excessive false positives where very different words match due to typo tolerance.
### Why It Happens
Developers increase typo tolerance to improve recall without considering the precision tradeoff for short words.
### Warning Signs
- 3-letter words with 2 typos match completely different words
- "Cat" matches "dog" through typo tolerance
- Very short queries return imprecise results
- Typo tolerance causing more false positives than true corrections
### Why Harmful
High typo tolerance on short words makes search imprecise. Users see results for completely different terms because the engine found a 2-character-away match.
### Consequences
- Low precision for short queries
- Users see irrelevant results
- Trust in search accuracy reduced
- Hard to reason about matching behavior
### Alternative
Use default thresholds or stricter settings for short words. Only increase typo tolerance for long words.
### Refactoring Strategy
1. Reset to default minWordSizeForTypos (1: 5, 2: 9)
2. If needed, increase only the threshold for 2 typos to longer words
3. Test short query precision
4. Test long query recall
5. Adjust incrementally based on analytics
### Detection Checklist
- [ ] Typo thresholds appropriate for word length
- [ ] Short words have lower tolerance
- [ ] Long words have appropriate tolerance
- [ ] Precision monitored for short queries
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: Not Syncing Typo Settings via scout:sync-index-settings
### Category
Operations | Reliability
### Description
Configuring typo tolerance in the Meilisearch dashboard or API but not syncing settings via Scout, causing settings to be lost on re-index or environment rebuild.
### Why It Happens
Developers configure settings directly in the Meilisearch UI for quick changes and don't update the Scout configuration file.
### Warning Signs
- Typo settings configured in Meilisearch UI but not in scout config
- Settings lost after `scout:sync-index-settings`
- Different settings between environments
- Settings drift over time
### Why Harmful
Settings made directly in the engine UI are not captured in version control. They can be lost during deployments, re-indexing, or environment rebuilds. Environment drift causes inconsistent behavior.
### Consequences
- Settings lost on re-index
- Production vs development inconsistency
- No audit trail for typo configuration changes
- Manual re-application needed after deployments
### Alternative
Configure typo tolerance in Scout's config file and sync via `scout:sync-index-settings`.
### Refactoring Strategy
1. Export current typo tolerance settings from Meilisearch
2. Add to Scout index configuration in `config/scout.php`
3. Run `scout:sync-index-settings` to apply
4. Verify settings match between config and engine
5. Document that UI changes should also be made in config
### Detection Checklist
- [ ] Typo settings configured in scout config file
- [ ] scout:sync-index-settings run after config changes
- [ ] Settings consistent across environments
- [ ] Version-controlled configuration
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Ignoring Language-Specific Configuration
### Category
Data Quality | Accuracy
### Description
Using English-default typo tolerance thresholds for non-English content, causing poor handling of shorter/longer words in other languages.
### Why It Happens
Default thresholds (5/9 for minWordSizeForTypos) are based on English word lengths. Developers don't adjust for other languages.
### Warning Signs
- Non-English content with default English thresholds
- Short words in other languages (Chinese, German compounds) handled poorly
- Non-English queries have higher zero-result rate
- Language-specific settings not explored
### Why Harmful
Languages have different word length distributions. German has longer compound words. Chinese has shorter word units. English defaults don't fit, causing either too much or too little typo tolerance.
### Consequences
- Poor search quality for non-English content
- Different user experience for international users
- Higher zero-result rates for non-English queries
- Compounded errors with stemming/segmentation
### Alternative
Adjust minWordSizeForTypos thresholds based on the language and content characteristics.
### Refactoring Strategy
1. Analyze non-English query word length distribution
2. Adjust thresholds: lower for languages with shorter words, higher for longer
3. Test with representative non-English queries
4. Consider separate indexes with different typo settings per language
5. Monitor non-English search metrics separately
### Detection Checklist
- [ ] Language-specific thresholds configured
- [ ] Non-English query performance analyzed
- [ ] Thresholds adjusted for language characteristics
- [ ] Non-English search metrics monitored
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
