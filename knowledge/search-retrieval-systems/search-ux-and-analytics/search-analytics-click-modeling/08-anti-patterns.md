# ECC Anti-Patterns — Search Analytics & Click Modeling
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Analytics & Click Modeling | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Logging Every Search Query
2. Ignoring Zero-Result Rate
3. No Position-Normalized Click Analysis
4. Not Tracking Search-to-Conversion Funnel
5. Analytics Without Regular Reporting
---
## Repository-Wide Anti-Patterns
- Logging queries without context (filters, user, session)
- Privacy compliance gaps in search tracking
- Acting on analytics without statistical significance
---
## Anti-Pattern 1: Not Logging Every Search Query
### Category
Data Quality | Process
### Description
Not recording search queries to a persistent store, losing all data needed for search quality analysis and improvement.
### Why It Happens
Analytics logging feels like overhead. Teams rely only on search engine dashboards which lack historical or detailed data.
### Warning Signs
- No database table for search query logs
- Cannot answer "what are the top 10 failing searches?"
- No query trend data over time
- Search quality improvements based on anecdotal evidence
### Why Harmful
Without query logs, you have no data to improve search. You can't identify failing queries, track trends, measure improvement, or justify search investments.
### Consequences
- Search improvements are guesswork
- Same failing queries never identified
- No baseline to measure improvement against
- Cannot prioritize content gap filling
### Alternative
Log every search query with context (query text, filters, results, user, timestamp).
### Refactoring Strategy
1. Create search_logs table (query, filters, result_ids, user_id, timestamp)
2. Add logging middleware or service layer
3. Log every query before returning results
4. Build reporting dashboard on log data
5. Establish regular analytics review
### Detection Checklist
- [ ] Every search query logged
- [ ] Logs include query, filters, results, user, timestamp
- [ ] Log storage capacity planned
- [ ] Analytics review process established
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Ignoring Zero-Result Rate
### Category
User Experience | Data Quality
### Description
Not tracking the percentage of searches that return zero results, missing the most actionable signal for search quality improvement.
### Why It Happens
Teams track metrics they can improve (CTR, conversion) and overlook negative signals.
### Warning Signs
- Zero-result rate unknown
- No dashboard for zero-result queries
- Users frequently hit empty search pages
- Content gaps never identified or filled
### Why Harmful
Zero-result queries are the clearest signal of search quality failure. Every zero-result query is a user who didn't find what they needed. Ignoring this metric means ignoring the most impactful improvement opportunity.
### Consequences
- Persistent user frustration from failed searches
- Lost revenue from unfulfilled searches
- Content gaps that never get addressed
- Negative perception of search quality
### Alternative
Track zero-result rate as a primary search KPI. Target <5%. Review zero-result queries weekly.
### Refactoring Strategy
1. Add zero-result tracking to analytics
2. Calculate zero-result rate = zero-result queries / total queries
3. Set target: zero-result rate < 5%
4. Review top zero-result queries weekly
5. Create action items for content gap filling
### Detection Checklist
- [ ] Zero-result rate tracked
- [ ] Target set (<5%)
- [ ] Weekly review of zero-result queries
- [ ] Content gap process established
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
---
## Anti-Pattern 3: No Position-Normalized Click Analysis
### Category
Data Quality | Accuracy
### Description
Analyzing raw CTR without normalizing for result position, drawing incorrect conclusions about result relevance based on position bias.
### Why It Happens
Raw CTR is simple to calculate and seems intuitive. Position normalization requires more sophisticated analysis.
### Warning Signs
- CTR reported as average across all positions
- Position 1 results always have highest CTR (expected)
- Position bias not accounted for in relevance analysis
- Click model not implemented
### Why Harmful
Position 1 results always get more clicks regardless of relevance. Raw CTR tells you about position, not relevance. You may optimize for position-biased CTR instead of actual relevance.
### Consequences
- Misleading CTR-based relevance conclusions
- Ranking optimized for position bias, not relevance
- Lower positions with high relevance not identified
- Inability to distinguish position effect from relevance
### Alternative
Use position-based examination model or cascade model to infer relevance from click data.
### Refactoring Strategy
1. Implement position-based click model (expected clicks per position)
2. Calculate normalized CTR: actual clicks / expected clicks per position
3. Use normalized CTR for relevance analysis
4. Cascade model for query sessions with multiple results clicked
5. Compare normalized CTR with offline relevance metrics
### Detection Checklist
- [ ] Position-normalized CTR implemented
- [ ] Expected clicks per position calculated
- [ ] Raw CTR not used for relevance conclusions
- [ ] Click model documented
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: Not Tracking Search-to-Conversion Funnel
### Category
Business Intelligence | Process
### Description
Not linking search queries to downstream conversion events (purchases, signups), missing the connection between search and business outcomes.
### Why It Happens
Conversion tracking requires integrating search analytics with business analytics systems.
### Warning Signs
- Cannot answer "what searches lead to purchases?"
- Search treated as cost center with unquantified ROI
- No search-to-conversion funnel in analytics
- Conversion attribution not linked to search session
### Why Harmful
Without conversion data, search is a cost with unproven value. You cannot prioritize search improvements by business impact or justify search investment.
### Consequences
- Unable to prove search ROI
- Search budget harder to justify
- Improvements not prioritized by revenue impact
- Missed insight into high-value search queries
### Alternative
Track search-to-conversion funnel: search session → result click → product page → conversion.
### Refactoring Strategy
1. Add session ID or search ID to analytics events
2. Track conversion events with search attribution
3. Calculate search-to-conversion rate
4. Report searches that lead to most conversions
5. Track search-assisted conversion value
### Detection Checklist
- [ ] Search-to-conversion funnel implemented
- [ ] Search attribution on conversion events
- [ ] Search conversion rate tracked
- [ ] Search-influenced revenue reported
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Analytics Without Regular Reporting
### Category
Process | Maintainability
### Description
Collecting search analytics data without establishing regular reporting cadence, letting valuable data sit unused.
### Why It Happens
Initial analytics setup is completed but no ongoing reporting process is established.
### Warning Signs
- Analytics data collected but not reviewed
- No weekly/monthly search quality report
- Teams unaware of search metric trends
- Search issues discovered from user complaints, not data
### Why Harmful
Data without action is waste. Analytics that aren't reviewed regularly cannot inform decisions or drive improvement. Trending data is most valuable when tracked over time.
### Consequences
- Collected data never used for improvements
- Search degradation goes unnoticed for weeks
- No institutional knowledge of search performance trends
- Missed opportunities to act on emerging patterns
### Alternative
Establish weekly analytics reporting with a structured review and action process.
### Refactoring Strategy
1. Create weekly search analytics report template
2. Include: top queries, zero-result rate, CTR trends, conversion rate
3. Schedule weekly review meeting or async review
4. Document actions taken from each review
5. Track metric trends over time
### Detection Checklist
- [ ] Weekly analytics report created
- [ ] Report template includes key metrics
- [ ] Review process established
- [ ] Actions tracked from reviews
- [ ] Metric trends visible over time
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
