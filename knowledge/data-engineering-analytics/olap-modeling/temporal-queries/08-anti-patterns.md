# Anti-Patterns: Event Sourcing Temporal Queries

## Metadata

| | |
|---|---|
| **KU ID** | K029 |
| **Subdomain** | Read Models & CQRS for Analytics |
| **Topic** | Temporal Queries |
| **Complexity** | Expert |
| **Maturity** | Emerging |
| **Domain** | Data Engineering & Analytics |
| **Subdomain Path** | 05-olap-modeling/read-models |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Temporal Queries on Non-Temporal Data | Design | Critical |
| 2 | On-Demand Replay for Every Dashboard Request | Performance | High |
| 3 | Full Event Retention Without Compaction | Operations | High |
| 4 | No Snapshots | Performance | Critical |
| 5 | Mutable Event Store | Reliability | Critical |

## Repository-Wide Anti-Patterns

- **Pseudo-Temporal-Queries**: Running `SELECT * FROM users WHERE created_at <= '2024-01-01'` and calling it a temporal query
- **Replay-Every-Dashboard**: Calling aggregate replay for every row in a dashboard table
- **Events-Forever**: Keeping every event forever with no retention or compaction policy

---

## 1. Temporal Queries on Non-Temporal Data

**Category:** Design

**Description:** Running `SELECT * FROM users WHERE created_at <= '2024-01-01'` and calling it a temporal query — showing current attribute values, not state-as-of-that-date.

**Why It Happens:** Developers think filtering by `created_at` gives them historical state. They do not understand that current attribute values are not the same as historical attribute values.

**Warning Signs:**
- "Temporal query" implemented as a simple WHERE clause on `created_at`
- User emails, tiers, or addresses shown as they are now for past dates
- Reports that contradict what was true at the time
- No event sourcing or temporal database features used

**Why Harmful:** This is not a temporal query. It returns current attribute values for rows that existed on that date — not the state as it existed on that date. A user whose email changed on March 1 will show the March email for a January query. Reports are silently wrong.

**Consequences:**
- Historical reports show current (wrong) attribute values
- Business decisions based on incorrect data
- Users trust reports that are fundamentally wrong
- False confidence in "temporal" capabilities

**Alternative:** True temporal queries require event sourcing or temporal database features (bitemporal tables, system-versioned tables).

**Refactoring Strategy:**
1. Identify all "temporal" queries that use simple WHERE clauses
2. Determine if true temporal accuracy is needed for each
3. Implement event sourcing or system-versioned tables
4. Label query accuracy: "as of" vs "current state"

**Detection Checklist:**
- [ ] Is the query returning state-as-of-that-date or current-state?
- [ ] Are dimension attributes historically accurate in results?
- [ ] Is event sourcing or temporal storage used?
- [ ] Are reports labeled with their temporal accuracy?

**Related Rules/Skills/Trees:**
- Rule: Temporal Queries Require Event Sourcing (`04-standardized-knowledge.md:35-37`)

---

## 2. On-Demand Replay for Every Dashboard Request

**Category:** Performance

**Description:** Calling aggregate replay (`OrderAggregate::retrieve($id, asOf: $date)`) for every row in a dashboard table, causing 100+ replays per page load.

**Why It Happens:** Developers build a generic temporal query service and use it for all dashboard needs without considering the performance cost.

**Warning Signs:**
- Dashboard page makes 50+ temporal query calls
- Page load time > 10 seconds
- Each call replays events from snapshots
- No caching or pre-computation of dashboard data

**Why Harmful:** Each replay call processes events. A dashboard with 100 rows requires 100 replays, taking 10+ seconds to load. The dashboard is unusable, and the event store is hammered with replay queries.

**Consequences:**
- Dashboard page load times measured in tens of seconds
- Event store overwhelmed by replay requests
- User frustration and abandonment
- High server load from repeated replays

**Alternative:** Pre-compute daily PIT snapshots for dashboard queries. Use versioned projections for continuous temporal data.

**Refactoring Strategy:**
1. Identify dashboard queries using on-demand replay
2. Create nightly job that pre-computes daily state
3. Replace replay calls with daily PIT table queries
4. Monitor page load improvement

**Detection Checklist:**
- [ ] Do dashboard queries use on-demand replay?
- [ ] Are there pre-computed daily snapshots?
- [ ] Is dashboard page load time under 2 seconds?
- [ ] Is the event store monitored for replay load?

**Related Rules/Skills/Trees:**
- Rule: Pre-Compute Daily PIT Snapshots (`04-standardized-knowledge.md:37-38`)

---

## 3. Full Event Retention Without Compaction

**Category:** Operations

**Description:** Keeping every event forever "just in case" without a retention policy, causing the event store to grow to terabytes.

**Why It Happens:** Fear of losing data. "Events are the source of truth, so we must keep them all forever."

**Warning Signs:**
- Event store size grows without bound
- No TTL or retention policy on events
- Snapshot creation takes hours because it must scan full history
- Storage costs for the event store are significant

**Why Harmful:** The event store grows to terabytes. Temporal queries become slow even with snapshots because snapshot creation over full history takes hours. Storage costs increase linearly. Backup and restore times become impractical.

**Consequences:**
- Unbounded storage growth and cost
- Slow snapshot creation from scanning full history
- Long backup and restore times
- Event store becomes a liability instead of an asset

**Alternative:** Define a retention policy: keep full events for 90 days, daily snapshots for 3 years, yearly snapshots beyond.

**Refactoring Strategy:**
1. Define and document the event retention policy
2. Implement a scheduled job that archives/prunes old events
3. Ensure snapshots cover the retention period
4. Monitor event store growth and retention compliance

**Detection Checklist:**
- [ ] Is there a documented event retention policy?
- [ ] Are old events archived or pruned on schedule?
- [ ] Is snapshot creation time within acceptable limits?
- [ ] Is event store growth monitored?

**Related Rules/Skills/Trees:**
- Rule: Define Retention Policy (Events: 90 Days, Snapshots: 3 Years) (`04-standardized-knowledge.md:38`)

---

## 4. No Snapshots

**Category:** Performance

**Description:** Temporal queries replay from the beginning of time for every request without snapshot optimization.

**Why It Happens:** Snapshots require additional infrastructure (scheduled jobs, storage). Developers skip them in the initial implementation and never add them.

**Warning Signs:**
- No snapshot table or creation logic
- Temporal queries process 10,000+ events per request
- Query time increases linearly with event store age
- After 6 months, temporal queries timeout

**Why Harmful:** Replaying from the beginning of time gets slower as the event store grows. Six months in, a temporal query on a high-volume aggregate takes 30+ seconds. The system becomes unusable for any temporal query.

**Consequences:**
- Temporal queries time out on high-volume aggregates
- System becomes less useful over time
- Emergency addition of snapshots under pressure
- Lost trust in the event-sourced system

**Alternative:** Create snapshots at regular intervals (every 100 events per aggregate) from day one.

**Refactoring Strategy:**
1. Implement snapshot creation logic
2. Process historical aggregates to create initial snapshots
3. Schedule regular snapshot creation
4. Update temporal queries to use snapshots
5. Verify replay never exceeds 1000 events

**Detection Checklist:**
- [ ] Are snapshots created at regular intervals?
- [ ] Do temporal queries use snapshots?
- [ ] Is replay bounded to < 1000 events per query?
- [ ] Are snapshot creation times monitored?

**Related Rules/Skills/Trees:**
- Rule: Use Periodic Snapshots to Bound Replay (`04-standardized-knowledge.md:35-36`)

---

## 5. Mutable Event Store

**Category:** Reliability

**Description:** Events are deleted or updated in the `stored_events` table, compromising audit integrity and temporal query accuracy.

**Why It Happens:** Developers treat the event store like a regular database table. A bug or operational need triggers a manual SQL UPDATE or DELETE.

**Warning Signs:**
- Manual `UPDATE` or `DELETE` statements run on `stored_events`
- Events have been modified after creation
- Temporal queries produce different results than expected
- Audit trail cannot be trusted

**Why Harmful:** Events are meant to be immutable. Modifying them destroys the integrity of the event store. Temporal queries that replay modified events reconstruct incorrect state. Audit trail is compromised — you can no longer trust that the event store reflects what actually happened.

**Consequences:**
- Temporal queries produce wrong results
- Audit integrity is compromised
- Cannot trust any downstream read model
- Requires full rebuild from backup to recover

**Alternative:** Events are immutable. Corrections are new events (e.g., `EmailAddressCorrected`). Never DELETE or UPDATE stored events.

**Refactoring Strategy:**
1. Restore the event store from backup
2. Implement application-layer protection (read-only database user for event store)
3. Add CI checks that prevent event modification in code
4. Document that events are immutable

**Detection Checklist:**
- [ ] Has the event store been modified after creation?
- [ ] Is the event store accessible for direct modification?
- [ ] Are there guards preventing event mutation?
- [ ] Is event immutability documented and enforced?

**Related Rules/Skills/Trees:**
- Rule: Events Are Immutable — Corrections Are New Events (`04-standardized-knowledge.md:39-40`)
