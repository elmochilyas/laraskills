# ECC Anti-Patterns — Algolia Setup
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Algolia | Knowledge Unit | Algolia Setup | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Budget Cap Leading to Cost Surprises
2. Using Algolia for Low-Traffic Internal Tools
3. Exposing Admin API Key in Frontend
4. Ignoring Index Settings in Code (Dashboard-Only Config)
5. Using Algolia as Primary Data Store
---
## Repository-Wide Anti-Patterns
- Not setting billing alerts or budget caps
- Dashboard-only configuration that isn't version-controlled
- Using Admin API key in client-side code
---
## Anti-Pattern 1: No Budget Cap Leading to Cost Surprises
### Category
Cost | Operations
### Description
Using Algolia without setting a budget cap or billing alert, exposing the application to unexpectedly high costs from traffic spikes, crawl bots, or runaway queries.
### Why It Happens
Algolia's self-service signup has no mandatory spending limit. Teams deploy without configuring budget controls.
### Warning Signs
- Monthly Algolia bill 5-10x higher than expected
- No billing alerts configured in Algolia dashboard
- No usage monitoring or cost tracking
- Traffic spikes cause proportional cost spikes
- Algolia bill exceeds cloud infrastructure costs
### Why Harmful
Algolia charges per search request and per record. A traffic surge from a marketing campaign or DDoS can generate thousands of dollars in unexpected charges in hours. Without budget caps, there's no automatic stop.
### Consequences
- $10K+ unexpected Algolia bills from traffic spikes
- Finance team scrambling to approve over-budget charges
- Forced emergency migration to cheaper engine to reduce costs
- Reputation damage if service is cut off for non-payment
### Alternative
Always set budget caps and billing alerts in Algolia dashboard. Monitor usage monthly and set automated scaling limits.
### Refactoring Strategy
1. Log into Algolia dashboard, set billing alert at 80% of monthly budget
2. Configure operation limits per index (max search requests per hour)
3. Set up cost monitoring dashboard
4. Implement rate limiting on search endpoints to cap query volume
5. Review Algolia costs monthly as part of financial review
### Detection Checklist
- [ ] Budget cap configured in Algolia dashboard
- [ ] Billing alert at 80% threshold
- [ ] Cost monitoring in place
- [ ] Rate limiting on search endpoints
- [ ] Monthly cost review scheduled
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Using Algolia for Low-Traffic Internal Tools
### Category
Cost | Design
### Description
Using Algolia (a premium managed search service) for an internal admin tool with <10K records and <1000 searches/month, where the database engine or Meilisearch would be equally effective at zero or minimal cost.
### Why It Happens
Teams standardize on Algolia across all applications. The search abstraction makes it easy to configure, so they use it everywhere without cost-benefit analysis.
### Warning Signs
- Internal-only tools with Algolia integration
- Very small datasets (<10K records) on Algolia
- Monthly Algolia cost per tool > $50 for minimal usage
- No cost-benefit analysis before choosing Algolia
- Simpler search needs: no faceting, no analytics required
### Why Harmful
Algolia charges based on usage. An internal tool with 10K records and 1000 searches/month still pays minimum fees. The database engine provides comparable performance for these use cases at no additional cost.
### Consequences
- Unnecessary monthly costs for small projects
- Budget wasted on premium search for simple needs
- Ops team managing Algolia API keys for trivial tools
### Alternative
Use the database engine for internal tools and small applications. Reserve Algolia for customer-facing search at scale.
### Refactoring Strategy
1. Evaluate internal tool search requirements
2. Switch to database engine if dataset <50K records
3. Create FULLTEXT indexes for text search
4. Test search quality meets requirements
5. Decommission Algolia index for internal tools
### Detection Checklist
- [ ] Engine choice justified by cost-benefit analysis
- [ ] Internal tools use appropriate engine (database/Meilisearch)
- [ ] Algolia used only for customer-facing search at scale
- [ ] Monthly Algolia cost aligned with value delivered
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Exposing Admin API Key in Frontend
### Category
Security
### Description
Using Algolia's Admin API Key in client-side JavaScript or mobile apps, granting full administrative access to anyone who inspects the network traffic or source code.
### Why It Happens
Developers copy the Admin API Key from the dashboard and paste it into frontend instant search configuration, not realizing the difference between Admin and Search-Only keys.
### Warning Signs
- Admin API Key visible in browser network requests
- JavaScript instant search configuration contains Admin API Key
- Frontend can create, modify, or delete indexes
- No Search-Only API Key created in Algolia dashboard
### Why Harmful
Anyone with the Admin API Key can read, modify, or delete all search indexes, change index settings, and access billing information. This is a complete account compromise.
### Consequences
- All indexed data accessible to attackers
- Index deletion: permanent data loss
- Account takeover: billing changes, user modifications
- Compliance violation from exposed credentials
### Alternative
Always use Search-Only API Key in frontend code. Restrict it to search-only operations on specific indexes.
### Refactoring Strategy
1. Generate a Search-Only API Key in Algolia dashboard (restricted to search)
2. Replace Admin API Key in frontend with Search-Only Key
3. Verify Admin API Key only exists in server-side .env
4. Test that frontend can only perform search operations
5. Rotate the compromised Admin API Key
### Detection Checklist
- [ ] Search-Only API Key used in frontend
- [ ] Admin API Key only in server-side .env
- [ ] Frontend cannot perform admin operations
- [ ] API keys restricted to specific indexes
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Ignoring Index Settings in Code
### Category
Maintainability | Reliability
### Description
Configuring Algolia index settings (searchable attributes, ranking rules, facet attributes) exclusively through the Algolia dashboard instead of version-controlled configuration files.
### Why It Happens
The dashboard is visual and immediate. Developers configure settings there during development and forget to move them to code.
### Warning Signs
- No index-settings in config/scout.php for Algolia
- Algolia dashboard has custom settings not reflected in code
- scout:sync-index-settings would override dashboard settings
- Fresh Algolia index requires manual dashboard configuration
- Settings differ between environments due to manual configuration
### Why Harmful
Dashboard settings are not version-controlled, not reviewed in PRs, and not reproducible. A fresh deployment or index rebuild loses all dashboard configuration.
### Consequences
- Settings lost on index rebuild or new environment
- No audit trail for configuration changes
- Environment drift: staging works, production doesn't
- Manual setup required for each new environment
### Alternative
Define all index settings in `config/scout.php` and apply via `scout:sync-index-settings`.
### Refactoring Strategy
1. Export current Algolia dashboard settings to config/scout.php
2. Remove dashboard-only configuration
3. Add scout:sync-index-settings to deployment pipeline
4. Verify settings match across environments
5. Document that all settings changes go through code, not dashboard
### Detection Checklist
- [ ] All index settings version-controlled in scout.php
- [ ] scout:sync-index-settings reproduces all dashboard settings
- [ ] No dashboard-only configuration
- [ ] Fresh index fully configured by deployment pipeline
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Using Algolia as Primary Data Store
### Category
Architecture | Reliability
### Description
Storing data exclusively in Algolia and treating it as the primary data store, relying on Algolia for data persistence without a source-of-truth database.
### Why It Happens
Algolia's instant search and fast reads make it tempting to use as a primary data source. Developers skip the database and read/write directly to Algolia.
### Warning Signs
- No primary database (MySQL/PostgreSQL) for indexed data
- CRUD operations go directly to Algolia API
- Data exists only in Algolia, not recoverable from database
- Application reads product/user data exclusively from search index
- No data migration path away from Algolia
### Why Harmful
Algolia is a search index, not a transactional database. It lacks ACID transactions, relational integrity, and data durability guarantees. It's also the most expensive data store option — a vendor lock-in risk.
### Consequences
- Permanent data loss if Algolia account is compromised or deleted
- Inability to perform relational queries
- High exit cost: can't migrate away from Algolia without data loss
- Increased costs from using search index as primary datastore
### Alternative
Always maintain source data in a primary database. Use Algolia exclusively as a search index synchronized via Scout.
### Refactoring Strategy
1. Export data from Algolia to primary database
2. Set up Scout to sync from database to Algolia
3. Update application reads to use Eloquent for data retrieval
4. Keep Algolia for search queries only
5. Implement data recovery runbook using database backups
### Detection Checklist
- [ ] Primary database is the source of truth
- [ ] Algolia used only for search, not primary data access
- [ ] Data can be recovered from database if Algolia is lost
- [ ] No CRUD operations depend solely on Algolia
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
