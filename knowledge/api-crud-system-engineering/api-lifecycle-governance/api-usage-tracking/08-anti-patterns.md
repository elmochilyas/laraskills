# Anti-Patterns: API Usage Tracking

## AP-1: Synchronous Usage Tracking on Request Path
**Category**: Performance

**Description**: Writing usage events to the database synchronously during the HTTP request lifecycle. Every API request is blocked while the usage event is written, adding latency and creating backpressure during traffic spikes.

**Warning Signs**:
- Usage event written with `UsageEvent::create()` or `DB::insert()` in middleware
- Request latency increases proportionally to database write time
- Database contention increases under load
- API response times degrade during traffic spikes
- Database becomes bottleneck for request throughput

**Harms**:
- Added latency on every API request (typically 10-100ms)
- Database contention under high traffic
- API response times degrade during spikes
- Backpressure can cause cascading failures
- Usage tracking becomes a performance liability

**Real-World Consequence**: A Laravel middleware writes usage events synchronously: `UsageEvent::create([...])`. Under normal load (100 req/s), this adds 20ms per request. At peak (1000 req/s), the database write queue grows to 2000ms. API p95 latency increases from 100ms to 2100ms. Consumers start timing out and retrying, creating a feedback loop.

**Preferred Alternative**: Emit usage events asynchronously via Redis Stream or queue. Generate the event in middleware, push to a buffer, and return immediately. Process events in the background.

**Refactoring Strategy**: Replace synchronous DB write with `Redis::xadd('usage_events', '*', $event)`, create a worker to consume the stream and write to TimescaleDB, add pipeline lag monitoring, verify API latency is unaffected by usage tracking.

**Detection Checklist**:
- `[ ]` Are usage events written synchronously?
- `[ ]` Does request latency include usage tracking time?
- `[ ]` Is there database contention from usage writes?
- `[ ]` Is usage tracking on an async pipeline?

**Related**: 05-rules.md (Rule 1: Never Block the Request Path for Usage Tracking), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: No Event Enrichment at Write Time
**Category**: Performance

**Description**: Storing only foreign key IDs in usage events and joining against reference tables at query time. Every dashboard and billing query must join across millions of events, making queries impractically slow.

**Warning Signs**:
- Usage event stores only `consumer_id` (no tier, company, billing plan)
- Dashboard queries join usage_events with consumers, companies, and billing_plans
- Query times increase as event count grows
- Aggregation jobs timeout or take hours
- Developers complain about slow reporting queries

**Harms**:
- Dashboard queries take minutes instead of seconds
- Aggregation jobs timeout or exceed scheduled windows
- Real-time usage dashboard impossible
- Billing reports delayed
- Query complexity grows with event volume

**Real-World Consequence**: A usage event stores only `{ consumer_id: 42, endpoint: "/users", method: "GET" }`. The monthly billing query joins usage_events (50M rows) with consumers, companies, and billing_plans tables. The query takes 45 minutes, exceeding the 30-minute aggregation window. Billings are generated with yesterday's data, causing revenue recognition delays.

**Preferred Alternative**: Enrich usage events with consumer metadata (tier, company ID, billing plan) at event creation time. Store denormalized data so queries don't need joins.

**Refactoring Strategy**: Add enrichment step to event pipeline (fetch consumer metadata at write time), store denormalized fields in event schema, remove joins from dashboard queries, verify query performance improvement.

**Detection Checklist**:
- `[ ]` Are usage events enriched with consumer metadata at write time?
- `[ ]` Do dashboard queries include joins to reference tables?
- `[ ]` Are aggregation jobs timing out or running long?
- `[ ]` Is event schema denormalized for query performance?

**Related**: 05-rules.md (Rule 2: Enrich Events at Write Time), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Storing Raw Events Indefinitely
**Category**: Scalability

**Description**: Keeping all raw usage events indefinitely without retention limits. Storage costs grow unbounded with traffic volume, and the vast majority of raw events are never queried after the first few days.

**Warning Signs**:
- No data retention policy for usage events
- Raw event storage grows without bound
- Storage costs increase linearly with time
- Old events are never purged
- Database performance degrades as table grows
- No differentiation between raw events, hourly aggregates, and daily aggregates

**Harms**:
- Unbounded storage costs (terabytes after years)
- Query performance degrades on ever-growing tables
- Compliance risks from indefinite PII retention
- Infrastructure cost outpaces value of stored data
- Backup/restore times become impractical

**Real-World Consequence**: An API tracks 500M events per month. After 3 years, the usage_events table contains 18 billion rows, consuming 10 TB of storage. Monthly storage costs are $5,000. Queries against raw events take hours. 99.9% of queries use aggregated data (hourly/daily), but all raw events are retained "just in case."

**Preferred Alternative**: Define and enforce data retention policies: 90 days for raw events, 1 year for hourly aggregations, 2 years for daily aggregations. Purge data automatically.

**Refactoring Strategy**: Add scheduled purge job for raw events older than 90 days, create hourly and daily aggregation tables, migrate dashboard queries to use aggregation tables, set up hard-delete for purged data, document retention policy.

**Detection Checklist**:
- `[ ]` Is there a data retention policy for usage events?
- `[ ]` Are raw events purged after a defined period?
- `[ ]` Are dashboards querying aggregated or raw data?
- `[ ]` Is storage cost growing linearly with time?

**Related**: 05-rules.md (Rule 4: Set Clear Data Retention Policies), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-4: 100% Tracking of Read Requests
**Category**: Scalability

**Description**: Tracking every read request (GET, HEAD) at the same detail and rate as mutation requests. Reads typically outnumber writes 10:1, multiplying storage and processing costs without billing benefit.

**Warning Signs**:
- All GET and HEAD requests are tracked at 100% rate
- Read events dominate the event pipeline (80-90% of total events)
- Storage costs are driven primarily by read events
- No differentiation between read and write tracking
- Analytics team has more data than they can analyze

**Harms**:
- 10x unnecessary storage costs
- Event pipeline overloaded with low-value data
- Processing costs dominated by read events
- Analytics noise from excessive read data
- Infrastructure costs not aligned with business value

**Real-World Consequence**: An API has 10,000 req/s — 9,000 reads and 1,000 writes. Tracking all at 100% generates 10,000 events/second. If reads were sampled at 5%, the event volume drops to 1,450 events/second — an 85% reduction in storage and processing costs. The billing data (writes) is still 100% accurate.

**Preferred Alternative**: Track 100% of mutation requests for billing accuracy. Sample read-only endpoints at 1-10% for analytics purposes only.

**Refactoring Strategy**: Implement sampling logic in usage tracking middleware, set read sampling rate based on endpoint volume (1% for high-volume, 10% for low-volume), verify billing accuracy is unaffected, monitor storage cost reduction.

**Detection Checklist**:
- `[ ]` Are all read requests tracked at 100%?
- `[ ]` What is the read-to-write ratio?
- `[ ]` Could read tracking be sampled without business impact?
- `[ ]` Is storage cost driven by read events?

**Related**: 05-rules.md (Rule 3: Track 100% of Writes, Sample Reads), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: No Consumer-Facing Usage Dashboard
**Category**: Maintainability

**Description**: Keeping API usage data visible only to internal teams without providing consumers with their own usage dashboard. Consumers contact support for basic usage questions — "How many requests have I made?" — increasing support burden and delaying integration.

**Warning Signs**:
- Usage data available only in internal dashboards
- Support tickets asking "how many requests have I used?"
- Consumers cannot check their own quota status
- No API endpoint for consumer usage data
- Consumers ask about usage during onboarding

**Harms**:
- High support ticket volume for usage questions
- Consumers cannot plan capacity proactively
- Integration delayed while consumers wait for usage info
- Consumers surprised by quota exhaustion (blocked operations)
- No self-service for usage monitoring

**Real-World Consequence**: A consumer integration is rate limited at 95% of monthly quota. They don't know their usage because there's no dashboard. They continue operating normally. At 100%, their requests are rejected. They file a support ticket asking why their API stopped working. The support team spends 20 minutes explaining quota limits. This cycle repeats monthly.

**Preferred Alternative**: Provide consumers with a real-time usage dashboard showing request counts, rate limit status, and quota consumption. Expose a `/usage` API endpoint for programmatic access.

**Refactoring Strategy**: Create a consumer-facing usage endpoint (`GET /usage`), embed usage data in developer portal dashboard, include usage summaries in API responses (quota consumed/remaining), document usage visibility in onboarding.

**Detection Checklist**:
- `[ ]` Can consumers see their own usage data?
- `[ ]` Is there a consumer-facing usage dashboard?
- `[ ]` Are there support tickets about usage/quota questions?
- `[ ]` Is there a `/usage` or similar API endpoint?

**Related**: 05-rules.md (Rule 5: Provide Consumer-Facing Usage Dashboard), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: No Pipeline Lag Monitoring
**Category**: Reliability

**Description**: Running the usage tracking pipeline without monitoring event lag. If the pipeline stops processing (worker crash, Redis failure, database issue), usage data loss goes undetected for hours or days, affecting billing and analytics.

**Warning Signs**:
- No monitoring of usage event pipeline
- No alert for event processing lag
- Usage dashboard shows stale data
- Billing reports are incomplete
- Pipeline failures discovered during billing reconciliation
- Event backlog grows without detection

**Harms**:
- Billing data loss — revenue leakage
- Consumer dashboards display stale data
- Analytics decisions based on incomplete data
- Pipeline issues undetected for hours/days
- Revenue recognition delays

**Real-World Consequence**: A Redis Stream consumer crashes due to a memory leak. The usage event queue grows to 10M unprocessed events over 6 hours. The billing team runs the monthly report and finds 15% of events are missing. No alert fired — the pipeline failure was discovered during manual reconciliation. The company underpays itself by $50,000 due to untracked usage.

**Preferred Alternative**: Monitor usage pipeline event lag (time between event creation and storage). Alert if lag exceeds 60 seconds.

**Refactoring Strategy**: Add lag monitoring to event pipeline, create alert at 60-second threshold, add heartbeat check for event processor health, implement dead-letter queue for failed events, create dashboard showing event throughput and lag.

**Detection Checklist**:
- `[ ]` Is pipeline lag monitored?
- `[ ]` Is there an alert for event processing delays?
- `[ ]` Has pipeline failure ever gone undetected?
- `[ ]` Is there a dashboard showing event throughput and lag?

**Related**: 05-rules.md (Rule 6: Monitor Pipeline Lag), 04-standardized-knowledge.md, 06-skills.md

---

## AP-7: No Anomaly Detection on Consumer Usage
**Category**: Security

**Description**: Not monitoring for unusual usage patterns that deviate from a consumer's baseline. Compromised API keys, misconfigured clients, or abusive traffic go undetected until significant damage is done.

**Warning Signs**:
- No baseline tracking per consumer
- No alerts for usage pattern changes
- Compromised key abuse detected only by consumer complaint
- Traffic spikes attributed to "normal variation" without investigation
- No automated response to anomalous usage

**Harms**:
- Compromised credentials used for extended period
- Abusive traffic consumes resources without detection
- Billing surprises for consumers (unexpected overage charges)
- Security incidents missed until post-mortem
- Data exfiltration via stolen API keys

**Real-World Consequence**: A consumer's API key is leaked in a public GitHub repository. An attacker uses the key at 50x the normal request rate to extract data over 72 hours. No anomaly detection exists. The legitimate consumer discovers the abuse when their monthly bill is 50x normal. Investigation reveals the breach occurred 3 days earlier.

**Preferred Alternative**: Implement automated anomaly detection that alerts when a consumer's usage deviates significantly (3+ standard deviations) from their baseline.

**Refactoring Strategy**: Build per-consumer usage baseline (mean and standard deviation over 7-30 days), implement Z-score or similar anomaly detection, alert on significant deviations, add automated response options (rate limit tightening, key suspension), document anomaly response runbook.

**Detection Checklist**:
- `[ ]` Is there per-consumer usage baseline tracking?
- `[ ]` Are usage anomalies automatically detected?
- `[ ]` Are there alerts for unexpected usage changes?
- `[ ]` Has a security incident been missed due to lack of anomaly detection?

**Related**: 05-rules.md (Rule 7: Detect Anomalies from Consumer Baseline), 04-standardized-knowledge.md, 06-skills.md
