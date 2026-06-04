# ECC Anti-Patterns — Algolia Driver Setup & Configuration
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Algolia | Knowledge Unit | Algolia Driver Setup & Configuration | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Exposing Admin API Key in Frontend
2. Dashboard-Only Index Configuration
3. No Budget Cap or Usage Monitoring
4. Not Using Search-Only API Key Separation
5. Skipping Analytics Integration
---
## Repository-Wide Anti-Patterns
- Not separating Admin and Search-Only API keys per environment
- Configuring Algolia through the dashboard instead of version-controlled config
- Not monitoring Algolia operation counts and costs
---
## Anti-Pattern 1: Exposing Admin API Key in Frontend
### Category
Security
### Description
Using the Algolia Admin API Key in frontend JavaScript or mobile apps, giving full account access to anyone who can view network traffic or source code.
### Why It Happens
Developers copy the Admin API Key from the dashboard for instant search setup, not realizing the Search-Only API Key exists.
### Warning Signs
- Admin API Key visible in browser network requests
- Frontend JS contains the application's Admin API Key
- No Search-Only API Key configured
- Frontend can manage indexes and settings
### Why Harmful
Full account compromise: anyone with Admin API Key can read, modify, delete indexes, change settings, and access billing. Data exposure and potential account takeover.
### Consequences
- Complete search index data exposure
- Index deletion and data loss
- Account takeover and billing fraud
- Compliance violation from exposed credentials
### Alternative
Use Search-Only API Key (restricted to search queries) for all frontend code.
### Refactoring Strategy
1. Generate Search-Only API Key in Algolia dashboard
2. Move Admin API Key to server-side .env only
3. Update frontend to use Search-Only Key
4. Rotate compromised Admin API Key
5. Verify frontend can only search, not admin
### Detection Checklist
- [ ] Search-Only API Key in frontend
- [ ] Admin API Key server-side only
- [ ] No admin operations possible from frontend
- [ ] API keys restricted per index
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Dashboard-Only Index Configuration
### Category
Maintainability | Reliability
### Description
Configuring Algolia index settings exclusively through the Algolia dashboard without replicating them in version-controlled configuration files.
### Why It Happens
Dashboard is easier. Teams don't prioritize moving settings to code.
### Warning Signs
- Algolia dashboard has custom settings not in scout.php
- scout:sync-index-settings would change dashboard config
- Staging and production have different settings
- Fresh Algolia index needs manual configuration
- Settings changes not tracked in version control
### Why Harmful
Non-version-controlled configuration causes environment drift, cannot be reviewed in code review, and is lost on index rebuild.
### Consequences
- Inconsistent search behavior across environments
- Settings lost on index rebuild
- No audit trail for config changes
- "Works in staging, broken in prod" scenarios
### Alternative
Define all index settings in config/scout.php under algolia.index-settings and apply via scout:sync-index-settings.
### Refactoring Strategy
1. Document current dashboard settings
2. Replicate in config/scout.php
3. Run scout:sync-index-settings to apply code config
4. Disable dashboard-based configuration changes
5. Add settings sync to deployment pipeline
### Detection Checklist
- [ ] All index settings in version-controlled config
- [ ] scout:sync-index-settings in deploy pipeline
- [ ] Settings consistent across environments
- [ ] No dashboard-only configuration
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: No Budget Cap or Usage Monitoring
### Category
Cost | Operations
### Description
Deploying Algolia without setting budget caps, billing alerts, or usage monitoring, exposing the project to unexpected cost spikes.
### Why It Happens
Teams focus on functionality and ignore cost configuration until the bill arrives.
### Warning Signs
- No billing alerts in Algolia dashboard
- Monthly cost varies wildly without explanation
- No cost tracking or usage dashboard
- Algolia bill exceeds expected budget
- Traffic spikes cause proportional cost spikes
### Why Harmful
Algolia's per-operation pricing means costs scale with usage. A DDoS attack or marketing campaign can generate $10K+ in unexpected charges.
### Consequences
- Unexpected high bills damaging project budget
- Emergency engine migration to cut costs
- Service interruption if account is suspended
### Alternative
Set budget caps, billing alerts, and usage monitoring from day one.
### Refactoring Strategy
1. Set billing alert at 80% of monthly budget in Algolia dashboard
2. Configure operation limits per API key
3. Implement rate limiting on search endpoints
4. Set up cost monitoring dashboard
5. Review Algolia operations monthly
### Detection Checklist
- [ ] Budget cap set in Algolia dashboard
- [ ] Billing alert configured
- [ ] Rate limiting on search endpoints
- [ ] Monthly cost review in place
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Not Using Search-Only API Key Separation
### Category
Security
### Description
Using the same API key for both server-side indexing operations and frontend search requests, unnecessarily exposing write capabilities to the client.
### Why It Happens
Developers use a single API key for simplicity. They don't create separate keys per use case.
### Warning Signs
- Same API key for scout:import and frontend search
- Frontend requests use an API key with write permissions
- No Search-Only API Key created in Algolia dashboard
- API key has all permissions for all indexes
### Why Harmful
If the frontend key is compromised, attackers gain full access to the Algolia account. Least-privilege principle is violated.
### Consequences
- Unauthorized index manipulation from compromised keys
- Data modification or deletion from client-side
- Broader attack surface than necessary
### Alternative
Always use separate API keys: Admin Key for server-side admin operations, Search-Only Key for frontend search requests.
### Refactoring Strategy
1. Create Search-Only API Key in Algolia dashboard (search only, specific indexes)
2. Update frontend to use Search-Only Key
3. Ensure Admin Key is only in server-side .env
4. Rotate any shared keys
5. Verify API key restrictions work as expected
### Detection Checklist
- [ ] Admin Key and Search-Only Key separated
- [ ] Frontend uses Search-Only Key only
- [ ] Search-Only Key restricted to necessary indexes
- [ ] Least-privilege API key model in place
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Skipping Analytics Integration
### Category
Design | Maintainability
### Description
Not integrating Algolia's analytics features (click tracking, search analytics, SCOUT_IDENTIFY), missing Algolia's key differentiator over cheaper alternatives.
### Why It Happens
Developers treat Algolia as a "drop-in replacement" for other engines and don't leverage built-in analytics.
### Warning Signs
- No SCOUT_IDENTIFY calls in application code
- Algolia analytics dashboard shows zero data
- No click tracking on search results
- No A/B testing configured despite using Algolia
- Team can't answer "what are users searching for?"
### Why Harmful
Algolia's analytics are a primary reason to choose it over cheaper options. Without analytics, teams lose visibility into search behavior and cannot optimize relevance. A/B testing and personalization require analytics data.
### Consequences
- Blind to search performance and user behavior
- Cannot A/B test ranking changes
- Personalization features unavailable
- Paying Algolia premium without leveraging its differentiator
### Alternative
Integrate SCOUT_IDENTIFY for user tracking, implement click analytics, and leverage Algolia's analytics dashboard for search optimization.
### Refactoring Strategy
1. Add `Scout::identify($user)` before search queries for user tracking
2. Implement click analytics: track which results users click
3. Configure Algolia analytics dashboard for search insights
4. Set up A/B testing for ranking changes
5. Review analytics weekly to identify search improvements
### Detection Checklist
- [ ] SCOUT_IDENTIFY integrated for user analytics
- [ ] Click tracking on search results
- [ ] Algolia analytics dashboard populated with data
- [ ] A/B testing capability in place
- [ ] Regular analytics review for search optimization
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
