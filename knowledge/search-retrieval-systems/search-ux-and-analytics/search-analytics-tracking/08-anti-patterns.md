# ECC Anti-Patterns — Search Analytics Tracking
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Analytics Tracking | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Relying Only on Search Engine Built-in Analytics
2. Not Tracking Click Position
3. Ignoring Privacy Compliance in Analytics
4. Logging Queries Without Session Context
5. No Automated Reporting or Alerting
---
## Repository-Wide Anti-Patterns
- Not distinguishing between search engines with different analytics capabilities
- Storing analytics in the same database as transactional data without planning
- Not anonymizing analytics data for long-term storage
---
## Anti-Pattern 1: Relying Only on Search Engine Built-in Analytics
### Category
Data Quality | Reliability
### Description
Depending entirely on the search engine's built-in analytics (Algolia, Meilisearch), losing data if the engine is changed or when built-in analytics are insufficient.
### Why It Happens
Built-in analytics require no setup. Teams use them and assume they're sufficient and permanent.
### Warning Signs
- No custom analytics table
- Analytics data that can't be exported from the search engine
- Changing search engines would lose all historical data
- Engine analytics don't capture custom events
### Why Harmful
Built-in analytics vary widely by engine (Algolia: comprehensive, Typesense: none). Relying on them creates vendor lock-in and data loss risk. You cannot compare analytics across engines.
### Consequences
- Historical analytics data lost when changing engines
- Inconsistent analytics across different search engines
- Missing custom events not captured by engine
- Cannot aggregate analytics across multiple engines
### Alternative
Implement custom analytics logging alongside engine analytics. Use engine analytics for real-time, custom logging for permanent storage.
### Refactoring Strategy
1. Create custom search_logs table for query persistence
2. Log every query with full context independent of search engine
3. Keep engine analytics for real-time dashboards
4. Build custom reports from persistent logs
5. Plan data migration path for engine changes
### Detection Checklist
- [ ] Custom analytics logging implemented
- [ ] Data persists independently of search engine
- [ ] Engine change would not lose analytics history
- [ ] Custom reports built from logs
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Not Tracking Click Position
### Category
Data Quality | Accuracy
### Description
Recording clicks without storing the result position, making position-normalized CTR analysis impossible.
### Why It Happens
Click tracking is implemented simply: just record that a click happened.
### Warning Signs
- Click tracked without position metadata
- Cannot calculate CTR by position
- Position bias not analyzable
- Click data less valuable for relevance inference
### Why Harmful
Without position data, you cannot determine if position 1 gets more clicks because it's more relevant or because it's first. All click analysis lacks the most important contextual variable.
### Consequences
- Inability to analyze position bias
- No position-normalized relevance signals
- Click-based ranking improvement impossible
- Reduced value of click tracking investment
### Alternative
Always record the result position (rank) with each click event.
### Refactoring Strategy
1. Add position field to click tracking data model
2. Include result position in click event payload from frontend
3. Validate position data accuracy
4. Build position-normalized CTR reports
5. Implement position-based examination model
### Detection Checklist
- [ ] Click position recorded with each event
- [ ] Position data verifiable from search results
- [ ] CTR by position reportable
- [ ] Position bias analyzable
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Ignoring Privacy Compliance in Analytics
### Category
Compliance | Security
### Description
Tracking search analytics without considering privacy regulations (GDPR, CCPA), risking compliance violations and user trust.
### Why It Happens
Analytics implementation focuses on data collection, not data governance.
### Warning Signs
- No privacy policy for search analytics
- Personal data stored indefinitely in search logs
- No opt-out mechanism for search tracking
- User consent not obtained for analytics tracking
### Why Harmful
Search analytics often includes user IDs, query text (which may contain personal data), and behavioral data. Storing this without compliance processes risks regulatory fines and user trust erosion.
### Consequences
- GDPR/CCPA compliance violations
- Potential regulatory fines
- User trust damage from unconsented tracking
- Data retention liability
### Alternative
Implement privacy-compliant analytics: anonymize data, provide opt-out, define retention policies.
### Refactoring Strategy
1. Review analytics data for personal information
2. Anonymize or pseudonymize user identifiers after 30 days
3. Implement opt-out mechanism for analytics tracking
4. Define data retention and deletion policies
5. Add privacy notice to search experience
6. Conduct privacy impact assessment
### Detection Checklist
- [ ] Privacy compliance reviewed for analytics
- [ ] Personal data anonymized in long-term storage
- [ ] Opt-out mechanism implemented
- [ ] Data retention policy defined
- [ ] Privacy notice displayed
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Logging Queries Without Session Context
### Category
Data Quality | Accuracy
### Description
Recording individual queries without linking them to search sessions, losing the ability to analyze query sequences and abandonment patterns.
### Why It Happens
Each query is logged independently. Session tracking requires additional implementation.
### Warning Signs
- Query logs have no session ID
- Cannot determine if a search was successful or abandoned
- No query sequence analysis
- Session-level metrics (abandonment rate) unavailable
### Why Harmful
Individual query logs miss the context of the search journey. A query with no clicks may be abandoned-or the user may have found what they needed immediately. You cannot distinguish without session context.
### Consequences
- Inability to calculate query abandonment rate
- No analysis of query refinement patterns
- Cannot identify sessions that ended in conversion
- Lost insight into user search behavior
### Alternative
Assign a session ID to each search session and include it in all query logs.
### Refactoring Strategy
1. Generate session ID on search page load (frontend or backend)
2. Include session ID in all query log entries
3. Track session events: page load, queries, clicks, conversion
4. Calculate session abandonment rate
5. Analyze query refinement sequences within sessions
### Detection Checklist
- [ ] Session ID tracked with queries
- [ ] Session-level metrics calculable
- [ ] Abandonment rate tracked
- [ ] Query refinement patterns analyzable
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: No Automated Reporting or Alerting
### Category
Operations | Process
### Description
Collecting analytics but not setting up automated reports or alerts, requiring manual effort to monitor search quality.
### Why It Happens
Initial setup focuses on data collection. Reporting and alerting are treated as separate concerns to be addressed later.
### Warning Signs
- No automated analytics reports
- Metric changes detected from user complaints
- No alerts for search quality degradation
- Manual report generation required for any analysis
### Why Harmful
Without automated reporting, search quality monitoring is inconsistent and reactive. Degradation is discovered when users complain, not when metrics shift.
### Consequences
- Slow response to search quality issues
- Inconsistent monitoring cadence
- Manual reporting overhead consumes team time
- Metrics reviewed only when there's a "fire"
### Alternative
Set up automated weekly reports and threshold-based alerts for key search metrics.
### Refactoring Strategy
1. Define key metrics and alert thresholds (P95 latency, error rate, zero-result rate)
2. Create automated weekly report (email, Slack, dashboard)
3. Set up alerts for metric threshold breaches
4. Integrate with monitoring tools (Telescope, Grafana)
5. Schedule quarterly review of metric targets
### Detection Checklist
- [ ] Automated weekly report active
- [ ] Alert thresholds defined for key metrics
- [ ] Alerts integrated with notification channels
- [ ] Report and alerts reviewed regularly
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
