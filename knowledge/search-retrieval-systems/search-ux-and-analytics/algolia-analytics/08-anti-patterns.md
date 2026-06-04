# ECC Anti-Patterns — Algolia Analytics
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Algolia Analytics | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Enabling Click Analytics
2. Skipping SCOUT_IDENTIFY Configuration
3. Ignoring Zero-Result Query Analysis
4. Reviewing Analytics Irregularly
5. Not Tracking Conversion Events
---
## Repository-Wide Anti-Patterns
- Enabling analytics on some search queries but not others
- Not acting on analytics insights
- Storing analytics data in application database that Algolia already tracks
---
## Anti-Pattern 1: Not Enabling Click Analytics
### Category
Data Quality | User Experience
### Description
Failing to set `clickAnalytics: true` in search queries, losing all click-through and position data from Algolia's analytics.
### Why It Happens
Click analytics requires explicit parameter configuration in Scout callbacks. Developers are unaware of the flag or consider it non-essential.
### Warning Signs
- Click analytics tab in Algolia dashboard shows no data
- Click position data not available for analysis
- `clickAnalytics` parameter not found in search query code
- CTR reports show zero clicks across all queries
### Why Harmful
Without click analytics, you lose visibility into which results users actually click, at which positions, and whether search quality translates to user engagement.
### Consequences
- Inability to measure search relevance via CTR
- No data for click modeling or ranking optimization
- Missing signal for A/B test evaluation
- Zero-result queries not identifiable
### Alternative
Always set `clickAnalytics: true` via Scout callback in every search query.
### Refactoring Strategy
1. Add `clickAnalytics: true` to Scout callback in all search queries
2. Verify data appears in Algolia analytics dashboard
3. Set up weekly analytics review process
4. Create CTR baseline metrics
### Detection Checklist
- [ ] clickAnalytics set to true in all search queries
- [ ] Click data visible in Algolia dashboard
- [ ] CTR baseline established
- [ ] Click position data available
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Skipping SCOUT_IDENTIFY Configuration
### Category
Data Quality | Privacy
### Description
Not configuring `SCOUT_IDENTIFY` in the .env, losing user-level attribution for search analytics events.
### Why It Happens
SCOUT_IDENTIFY is an optional Scout configuration. Developers skip it because it seems unrelated to core search functionality.
### Warning Signs
- All search events attributed to anonymous users
- Unable to segment analytics by user type or behavior
- No user identification in Algolia analytics dashboard
- SCOUT_IDENTIFY not set in .env file
### Why Harmful
Without user identification, you cannot analyze search behavior by user segments, personalize search based on user history, or correlate search with user actions.
### Consequences
- Lost ability to personalize search based on user history
- Cannot segment analytics by user type
- Missed insight into power user vs new user search patterns
- Harder to debug search issues for specific users
### Alternative
Configure `SCOUT_IDENTIFY=true` in .env to automatically link searches to authenticated users.
### Refactoring Strategy
1. Set `SCOUT_IDENTIFY=true` in .env
2. Verify user identification in Algolia dashboard
3. Test with different user roles to confirm correct attribution
4. Review analytics segmented by user type
### Detection Checklist
- [ ] SCOUT_IDENTIFY configured in .env
- [ ] User identification verified in analytics
- [ ] Different user roles correctly attributed
- [ ] Privacy regulations confirmed for user tracking
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Ignoring Zero-Result Query Analysis
### Category
User Experience | Data Quality
### Description
Not reviewing or acting on zero-result queries logged by analytics, missing critical content gap and search quality signals.
### Why It Happens
Teams focus on queries that return results. Zero-result queries are considered edge cases that require manual intervention.
### Warning Signs
- Zero-result queries never reviewed
- Same zero-result queries appearing month after month
- No process for filling content gaps identified by zero-result queries
- Users abandon search after repeated zero-result experiences
### Why Harmful
Every zero-result query is a missed opportunity. Users who get no results are likely to leave. Recurring zero-result queries indicate content gaps that hurt the business.
### Consequences
- Lost traffic and potential conversions
- Persistent poor search experience for specific queries
- Content gaps remain unfilled
- Negative search quality perception
### Alternative
Regularly review zero-result queries in analytics and create a process for addressing them (redirects, content creation, synonym configuration).
### Refactoring Strategy
1. Export zero-result queries from Algolia analytics weekly
2. Categorize queries: typos, content gaps, obscure terms
3. Add synonyms for typos and alternate terms
4. Create content or landing pages for common content gaps
5. Monitor zero-result query rate as a KPI
### Detection Checklist
- [ ] Zero-result queries reviewed weekly
- [ ] Process for addressing each category defined
- [ ] Synonym updates made for common typos
- [ ] Zero-result rate tracked as KPI
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
---
## Anti-Pattern 4: Reviewing Analytics Irregularly
### Category
Process | Maintenance
### Description
Checking Algolia analytics sporadically or only when search issues are reported, losing the ability to identify trends and address problems proactively.
### Why It Happens
Analytics review feels like extra work without immediate payoff. Teams check only when stakeholders report search problems.
### Warning Signs
- Analytics dashboard accessed weekly
- Search quality issues discovered from user complaints first
- No regular analytics review on the team schedule
- Trends in query behavior not tracked
### Why Harmful
Without regular review, search quality degrades silently. Content gaps persist. Seasonal query patterns are missed. When problems are noticed, they've already impacted users for weeks.
### Consequences
- Proactive search quality management impossible
- Degradation detected by user complaints, not metrics
- Seasonal trends missed
- Harder to correlate search changes with user behavior
### Alternative
Schedule weekly analytics review with a structured checklist and documented actions.
### Refactoring Strategy
1. Schedule recurring weekly analytics review
2. Create a checklist: top queries, zero-result rate, CTR trends, new queries
3. Document actions taken from each review
4. Set up alerts for significant metric changes
5. Review impact of search changes in next review
### Detection Checklist
- [ ] Weekly analytics review scheduled
- [ ] Review checklist documented
- [ ] Actions tracked and followed up
- [ ] Alerts configured for metric changes
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Tracking Conversion Events
### Category
Data Quality | Business Intelligence
### Description
Not defining or tracking conversion events in Algolia analytics, missing the connection between search and business outcomes.
### Why It Happens
Conversion tracking requires frontend event sending via Algolia's insights library or backend API. Teams don't prioritize this integration.
### Warning Signs
- No conversion data in Algolia analytics
- Unable to measure search contribution to revenue
- "Searches that led to purchases" report shows no data
- No insights library integrated in frontend
### Why Harmful
Without conversion tracking, search is a cost center with unquantified business value. You cannot prove search ROI or justify investment in search improvements.
### Consequences
- Unable to measure search ROI
- No data to prioritize search improvements by business impact
- Missed insight into high-value search queries
- Harder to secure budget for search optimization
### Alternative
Integrate Algolia's insights library on the frontend or use the backend conversion API to track key conversion events.
### Refactoring Strategy
1. Define key conversion events (purchase, signup, add-to-cart)
2. Integrate Algolia insights library on frontend
3. Implement search metadata (query ID) passing to conversion events
4. Verify conversion data in Algolia dashboard
5. Create reports linking search queries to conversions
### Detection Checklist
- [ ] Conversion events defined
- [ ] Insights library integrated on frontend
- [ ] Search metadata passed with conversion events
- [ ] Conversion data visible in Algolia dashboard
- [ ] Search-to-revenue reports available
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
