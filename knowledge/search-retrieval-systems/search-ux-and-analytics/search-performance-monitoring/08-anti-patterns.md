# ECC Anti-Patterns — Search Performance Monitoring
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Performance Monitoring | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Monitoring Only Average Latency
2. No Error Rate Alerting
3. Ignoring Index Lag
4. No SLO Definition for Search Performance
5. Reactive Monitoring Without Proactive Alerting
---
## Repository-Wide Anti-Patterns
- Monitoring search engine but not the indexing pipeline
- No correlation between search performance and user behavior metrics
- Dashboard without action triggers or runbooks
---
## Anti-Pattern 1: Monitoring Only Average Latency
### Category
Performance | Data Quality
### Description
Tracking only average search latency while ignoring percentile distributions, missing tail latency problems that affect user experience.
### Why It Happens
Average latency is the default metric in most monitoring tools. Percentiles require additional configuration.
### Warning Signs
- Dashboard shows only "Average Latency: 45ms"
- No P95 or P99 metrics visible
- Users complain about slow search but average looks fine
- Latency spikes invisible in average-only monitoring
### Why Harmful
Average latency hides the experience of the slowest users. P95/P99 latency directly impacts user satisfaction and abandonment. A small percentage of slow queries affects user retention disproportionately.
### Consequences
- Search seems fast on dashboards but slow to users
- Tail latency issues go undetected
- User complaints are the first signal of degradation
- Wrong optimization priorities (optimizing average, ignoring tail)
### Alternative
Monitor P50, P95, and P99 latency. Set SLOs on P95, not average.
### Refactoring Strategy
1. Configure percentile calculation in monitoring (Telescope, Datadog, Grafana)
2. Add P50, P95, P99 latency panels to dashboard
3. Set P95 latency SLO (e.g., P95 < 200ms)
4. Set P99 latency alert threshold
5. Deprecate average-only latency reporting
### Detection Checklist
- [ ] P50, P95, P99 latency monitored
- [ ] Dashboard shows latency percentiles
- [ ] P95 SLO defined and tracked
- [ ] P99 alert threshold configured
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: No Error Rate Alerting
### Category
Reliability | Operations
### Description
Not monitoring or alerting on search query error rates, allowing search failures to go undetected until users complain.
### Why It Happens
Search is assumed to be reliable. Error rate monitoring is set up for the main application but not specifically for search.
### Warning Signs
- Search error rate unknown or not tracked
- Search errors discovered from user support tickets
- No alert for search engine connectivity issues
- "Search is down" team notification mechanism
### Why Harmful
Search errors directly impact users. Without error rate monitoring, you don't know if search is working until someone reports it. This can mean hours of downtime without detection.
### Consequences
- Extended search downtime
- User frustration from unhandled errors
- Revenue loss from broken search
- Fire drills instead of proactive response
### Alternative
Monitor search API error rate. Alert when > 1% of queries return errors.
### Refactoring Strategy
1. Add error tracking to search service (try/catch, count errors)
2. Calculate error rate = errors / total queries
3. Set alert threshold > 1% error rate
4. Configure alert notification (Slack, PagerDuty, email)
5. Create runbook for common search error scenarios
### Detection Checklist
- [ ] Error rate tracked for search queries
- [ ] Alert threshold configured (>1%)
- [ ] Alert notification active
- [ ] Runbook created for search errors
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Ignoring Index Lag
### Category
Data Quality | Operations
### Description
Not monitoring the time between database writes and search index availability, allowing stale search results to persist without detection.
### Why It Happens
Index lag is not a standard monitoring metric. Teams monitor query performance but not indexing freshness.
### Warning Signs
- New records not appearing in search for minutes/hours
- Users report "I just added this and it's not in search"
- Indexing pipeline issues discovered from user reports
- No metric for "time since last successful index"
### Why Harmful
Stale search results erode user trust. Users expect immediate discoverability of new content. Index lag that goes undetected means search is always behind reality.
### Consequences
- Users can't find recently added content
- Trust in search accuracy erodes
- Content teams frustrated by delayed indexing
- Indexing pipeline issues persist without detection
### Alternative
Monitor index lag: time between record creation/update and search index update. Alert when lag exceeds acceptable threshold.
### Refactoring Strategy
1. Add timestamp tracking: record last indexed time per model
2. Calculate index lag = current time - last successful index time
3. Set acceptable lag threshold (e.g., < 5 minutes)
4. Alert when lag exceeds threshold
5. Monitor indexing queue depth and processing rate
### Detection Checklist
- [ ] Index lag monitored
- [ ] Acceptable lag threshold defined
- [ ] Alert configured for lag threshold breach
- [ ] Indexing queue monitored
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: No SLO Definition for Search Performance
### Category
Process | Operations
### Description
Operating search without defined Service Level Objectives (SLOs) for latency, availability, or error rate, making it impossible to know when performance is acceptable.
### Why It Happens
SLO definition requires understanding of business requirements and technical capabilities. It's often deferred.
### Warning Signs
- No documented performance targets for search
- "Search is slow" means different things to different people
- Cannot determine if search is meeting expectations
- No data to support infrastructure investment decisions
### Why Harmful
Without SLOs, performance is subjective. You cannot objectively say whether search is "fast enough." Degradation is noticed only when it becomes obvious. Investment decisions lack data support.
### Consequences
- Subjective performance assessments
- Inconsistent user expectations
- Hard to justify infrastructure spending
- Slippery slope of gradual degradation
### Alternative
Define SLOs for key search metrics: P95 latency, error rate, availability, index lag.
### Refactoring Strategy
1. Define P95 latency SLO (e.g., < 200ms)
2. Define error rate SLO (> 99.9% success)
3. Define availability SLO (> 99.9% uptime)
4. Define index lag SLO (< 5 minutes)
5. Track SLO compliance and report monthly
### Detection Checklist
- [ ] SLOs defined for key search metrics
- [ ] SLO compliance tracked
- [ ] SLO breaches trigger review
- [ ] SLOs reviewed and updated quarterly
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Reactive Monitoring Without Proactive Alerting
### Category
Operations | Reliability
### Description
Relying on dashboard review to detect search issues instead of proactive threshold-based alerting, leading to delayed issue discovery.
### Why It Happens
Alert configuration requires effort and knowledge of thresholds. Dashboards are easier to set up.
### Warning Signs
- Search issues discovered from user complaints, not alerts
- Team "monitors" search by checking dashboard occasionally
- No alert rules configured for search metrics
- Runbooks not prepared for common failures
### Why Harmful
Dashboards require human attention. Between human reviews, search may be degraded for hours. Users experience the issue long before the team notices.
### Consequences
- Extended periods of poor search performance
- Reactive firefighting instead of proactive management
- User trust damaged before team becomes aware
- Higher impact from issues that could be caught early
### Alternative
Set up proactive threshold-based alerts for all critical search metrics with runbooks.
### Refactoring Strategy
1. Define alert thresholds for: latency P95 > 200ms, error rate > 1%, index lag > 5 min
2. Configure alerts in monitoring system
3. Create runbooks for each alert type
4. Test alert channels (Slack, PagerDuty)
5. Review alert effectiveness quarterly
### Detection Checklist
- [ ] Proactive alerts configured for search metrics
- [ ] Alert thresholds defined and tuned
- [ ] Runbooks exist for common alerts
- [ ] Alerts tested and functioning
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
