# ECC Anti-Patterns — Algolia Scout Driver
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Algolia | Knowledge Unit | Algolia Scout Driver | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Cost Monitoring on Algolia Scout Queries
2. Not Configuring Index Settings in scout.php
3. Exposing Admin API Key in Frontend
4. Using Algolia Without Analytics Integration
5. Relying on Default Relevance Without Tuning
---
## Repository-Wide Anti-Patterns
- Not version-controlling Algolia index settings
- Ignoring Algolia's cost-per-operation model in query design
- Missing SCOUT_IDENTIFY for user-level analytics
---
## Anti-Pattern 1: No Cost Monitoring on Algolia Scout Queries
### Category
Cost | Operations
### Description
Using Algolia via Scout without monitoring the number of search operations, records, and API calls, leading to unexpected monthly costs from unbounded query volume.
### Why It Happens
Scout abstracts the engine — developers don't think about per-operation costs. They don't monitor Algolia's price meter.
### Warning Signs
- No Algolia operation count tracking
- Monthly Algolia cost significantly exceeds estimate
- Search-as-you-type fires API calls on every keystroke
- No rate limiting on search endpoints
- scout:import runs frequently, generating many operations
### Why Harmful
Algolia charges per search request and per record. Without monitoring, a search-as-you-type implementation can generate 10x more queries than expected. scout:import on large datasets generates thousands of operations.
### Consequences
- Unexpected $1000+ bills from unmonitored usage
- Emergency throttling of search queries
- Budget overruns from "free" prototyping
### Alternative
Monitor Algolia operation counts, set budget caps, and optimize Scout usage to minimize operations.
### Refactoring Strategy
1. Enable Algolia billing alerts at 80% budget threshold
2. Add rate limiting to search endpoints
3. Debounce search-as-you-type to reduce query volume
4. Optimize scout:import frequency (use queue, avoid unnecessary re-indexes)
5. Track operations per search endpoint in application monitoring
### Detection Checklist
- [ ] Algolia billing alerts configured
- [ ] Rate limiting on search endpoints
- [ ] Search-as-you-type debounced
- [ ] scout:import frequency optimized
- [ ] Monthly operations tracked and reviewed
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Not Configuring Index Settings in scout.php
### Category
Maintainability | Reliability
### Description
Using Algolia's Scout driver without configuring index settings (searchableAttributes, attributesForFaceting, customRanking) in the version-controlled config file.
### Why It Happens
Scout works without explicit index settings. Developers configure searchableAttributes and faceting through the Algolia dashboard.
### Warning Signs
- No algolia.index-settings in config/scout.php
- Algolia dashboard has custom settings not in code
- scout:sync-index-settings never run
- Index config differs between environments
### Why Harmful
Dashboard settings are lost on index rebuild. Environment configuration drifts. Code review cannot catch index config changes.
### Consequences
- Settings lost on index reset or migration
- Inconsistent behavior between environments
- No audit trail for configuration changes
### Alternative
Define all index settings in config/scout.php under algolia.index-settings and sync via scout:sync-index-settings.
### Refactoring Strategy
1. Document current Algolia dashboard settings
2. Move to config/scout.php under index-settings key
3. Run scout:sync-index-settings to apply
4. Add sync to deployment pipeline
5. Remove dashboard-only configuration practices
### Detection Checklist
- [ ] Index settings in scout.php config
- [ ] scout:sync-index-settings in deploy pipeline
- [ ] Config matches dashboard settings
- [ ] Settings version-controlled
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Exposing Admin API Key in Frontend
### Category
Security
### Description
Using Algolia's Admin API Key in instant-search frontend code instead of the Search-Only API Key, compromising full account access.
### Why It Happens
Instant search tutorials often use the Admin Key for simplicity. Developers copy-paste without understanding the security implications.
### Warning Signs
- Admin API Key in JavaScript instant search config
- Frontend can perform write operations to Algolia
- Network tab shows Admin Key in search requests
- No Search-Only API Key generated
### Why Harmful
Anyone with the Admin Key can manage indexes, retrieve all data, modify settings, and access billing. This is a critical security vulnerability.
### Consequences
- Data exfiltration from search index
- Index deletion or corruption
- Account takeover
- Compliance breach from credential exposure
### Alternative
Always use Search-Only API Key (restricted to search queries on specific indexes) in frontend code.
### Refactoring Strategy
1. Generate Search-Only API Key with query-only access
2. Replace Admin Key in frontend with Search-Only Key
3. Restrict Search-Only Key to required indexes and operations
4. Verify Admin Key not exposed anywhere client-side
5. Rotate Admin Key
### Detection Checklist
- [ ] Search-Only API Key used in frontend
- [ ] Admin Key server-side only
- [ ] Frontend cannot perform write operations
- [ ] API keys audited for least privilege
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Using Algolia Without Analytics Integration
### Category
Maintainability | Design
### Description
Using Algolia as a Scout driver but not integrating the built-in analytics (SCOUT_IDENTIFY, click tracking), missing Algolia's key differentiation from lower-cost alternatives.
### Why It Happens
Developers configure basic Scout connectivity but don't explore Algolia-specific features like analytics.
### Warning Signs
- No SCOUT_IDENTIFY in application code
- Algolia analytics dashboard shows no usage data
- No click tracking on search results
- Team has no visibility into search behavior
- Paying Algolia premium for basic search only
### Why Harmful
Algolia's analytics provide insights into what users search for, what they click, and how to improve relevance. Without analytics, teams operate search blindly and can't optimize.
### Consequences
- Blind to search quality and user behavior
- Can't identify irrelevant results
- Missing A/B testing capability
- Paying premium price for basic search features
### Alternative
Integrate SCOUT_IDENTIFY and click tracking to leverage Algolia's analytics capabilities.
### Refactoring Strategy
1. Add `Scout::identify($user)` before search in controllers
2. Implement click tracking using Algolia's insights API
3. Configure Algolia analytics dashboard
4. Review search analytics weekly
5. Use insights to tune ranking and relevance
### Detection Checklist
- [ ] SCOUT_IDENTIFY implemented
- [ ] Click tracking active
- [ ] Analytics dashboard shows data
- [ ] Search improvements driven by analytics insights
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Relying on Default Relevance Without Tuning
### Category
Performance | Design
### Description
Using Algolia's default searchable attributes and ranking rules without tuning for specific business needs, accepting suboptimal search relevance.
### Why It Happens
Algolia's defaults are good. Developers assume the defaults are optimal and don't invest time in tuning.
### Warning Signs
- searchableAttributes uses default (all attributes)
- No customRanking configured
- No attributesForFaceting set
- Search results not ordered by business relevance
- No ranking strategy documented
### Why Harmful
Default relevance ranks all attributes equally. Business-critical fields (title, name) don't get priority over less important fields (description, body). Search results aren't ordered by what matters to the business.
### Consequences
- Important results buried below less relevant matches
- Poor search UX: users must scroll to find key results
- Competitors with tuned search provide better experience
### Alternative
Configure searchableAttributes with priority ordering, set customRanking for business-specific sorting, and use attributesForFaceting for faceted search.
### Refactoring Strategy
1. Define field importance: title > name > description > body
2. Set searchableAttributes in order of priority
3. Add customRanking for business metrics (popularity, sales, date)
4. Configure attributesForFaceting for filterable fields
5. Run scout:sync-index-settings to apply
6. A/B test ranking changes using Algolia's A/B testing
### Detection Checklist
- [ ] searchableAttributes ordered by importance
- [ ] customRanking configured for business needs
- [ ] attributesForFaceting defined
- [ ] Default rankings not used in production
- [ ] Relevance tuned and A/B tested
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
