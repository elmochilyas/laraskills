# Anti-Patterns: CQRS Read Model / Projector Pattern for Analytics

## Metadata

| | |
|---|---|
| **KU ID** | K008 |
| **Subdomain** | Read Models & CQRS for Analytics |
| **Topic** | CQRS Read Model / Projector Pattern |
| **Complexity** | Intermediate |
| **Maturity** | Growing |
| **Domain** | Data Engineering & Analytics |
| **Subdomain Path** | 05-olap-modeling/read-models |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Direct Operational Table Queries for Dashboards | Architecture | High |
| 2 | Fat Projectors Updating Every Read Model | Maintainability | High |
| 3 | No Replay Testing | Reliability | Critical |
| 4 | Updating Read Models Synchronously | Performance | High |
| 5 | Non-Idempotent Projectors | Reliability | Critical |

## Repository-Wide Anti-Patterns

- **Direct-OLTP-Query**: Running `SELECT SUM(revenue) FROM orders WHERE ...` directly on the operational table for every dashboard load
- **Fat-Projector**: A single `AllAnalyticsProjector` updating 15 different read models
- **No-Replay-Test**: Writing projectors without ever testing replay against production data

---

## 1. Direct Operational Table Queries for Dashboards

**Category:** Architecture

**Description:** Running analytical queries (`SELECT SUM(revenue) FROM orders WHERE ...`) directly on the operational OLTP table for every dashboard load.

**Why It Happens:** Simple and fast to implement initially. The operational table already has the data.

**Warning Signs:**
- Dashboard queries run on `public.orders`, `public.users`
- No dedicated analytics tables or read models
- Dashboard queries slow as operational data grows
- ETL pipeline does not exist

**Why Harmful:** The operational table has indexes optimized for transactional queries, not analytical aggregations. As the table grows, dashboard queries slow down and eventually impact order processing. Full-table scans for analytical queries block transaction commits, causing application performance degradation.

**Consequences:**
- Dashboard queries slow as data grows
- Operational query performance degrades from analytical contention
- Application performance affected by dashboard traffic
- Development of proper read model is delayed

**Alternative:** Create dedicated read model tables (star schemas, aggregated summaries) that are updated asynchronously from events.

**Refactoring Strategy:**
1. Identify dashboard queries running on operational tables
2. Design read model tables optimized for those queries
3. Implement projectors to update read models from events
4. Route dashboard queries to read models
5. Drop direct operational table access from dashboards

**Detection Checklist:**
- [ ] Do dashboards query operational tables directly?
- [ ] Are there dedicated read model tables?
- [ ] Are projectors updating read models?
- [ ] Is operational database CPU/IO impacted by dashboard queries?

**Related Rules/Skills/Trees:**
- Rule: Analytics Is a Read Model, Not a Direct Query (`04-standardized-knowledge.md:12-14`)

---

## 2. Fat Projectors Updating Every Read Model

**Category:** Maintainability

**Description:** A single `AllAnalyticsProjector` that updates 15 different read models from every event.

**Why It Happens:** Convenience — one class handles all projection logic. It seems simpler than 15 separate classes.

**Warning Signs:**
- A single projector class handles multiple read models
- Changing one read model's logic requires modifying the shared projector
- Replaying one read model requires running all projections
- The projector class is hundreds of lines long

**Why Harmful:** Any change to any read model logic requires modifying the same file. Replaying all read models requires running one projector that updates everything, which takes hours. One projector class is tightly coupled — a bug in one projection blocks updates to all read models.

**Consequences:**
- Hard to change individual read model logic
- Replay takes hours instead of minutes
- Coupled failures — one bug breaks all read models
- Large, unmaintainable projector class

**Alternative:** Use one projector class per read model. Each is independent, testable, and replayable individually.

**Refactoring Strategy:**
1. Identify each read model updated by the fat projector
2. Create dedicated projector classes per read model
3. Move event handling logic from the fat projector to individual projectors
4. Register each projector independently
5. Remove the fat projector

**Detection Checklist:**
- [ ] Is there a single projector updating multiple read models?
- [ ] Can individual read models be replayed independently?
- [ ] Does a bug in one projection block others?
- [ ] Are projectors independently testable?

**Related Rules/Skills/Trees:**
- Rule: One Projector Class Per Read Model (`04-standardized-knowledge.md:36`)

---

## 3. No Replay Testing

**Category:** Reliability

**Description:** Writing projectors without ever testing replay against production-like event data.

**Why It Happens:** Replay is seen as a "one-time operation" that will be done carefully when needed. Developers do not test it proactively.

**Warning Signs:**
- No staging environment with production event copies
- Projector `upsert()` logic not tested with duplicate events
- Replay has never been attempted
- First replay reveals constraint violations and data corruption

**Why Harmful:** The first time replay is needed (after a bug fix or schema change), duplicates, constraint violations, and data corruption are discovered. Production replay is attempted under pressure with no experience, causing extended downtime and potential data loss.

**Consequences:**
- Production replay causes data corruption
- Extended downtime during replay attempts
- Emergency fixes under pressure
- Lost trust in the event-sourced system

**Alternative:** Test replay in staging with a copy of production events. Every projector should be tested with a replay scenario.

**Refactoring Strategy:**
1. Create a staging environment with production event copies
2. Test replay for each projector
3. Verify read model state after replay matches original state
4. Document replay procedures
5. Schedule quarterly replay tests

**Detection Checklist:**
- [ ] Has replay been tested in staging?
- [ ] Are there automated replay tests?
- [ ] Is replay documented?
- [ ] Is there a replay runbook for production?

**Related Rules/Skills/Trees:**
- Rule: Every Projector Should Be Replayable (`04-standardized-knowledge.md:38-39`)

---

## 4. Updating Read Models Synchronously

**Category:** Performance

**Description:** Projector runs in the same HTTP request as the event dispatch, without queueing.

**Why It Happens:** Simplicity — the projector is registered as a sync listener. No queue infrastructure needed.

**Warning Signs:**
- Projector listener is synchronous (not queued)
- HTTP response time includes analytics write time
- A slow analytics projection causes HTTP 500 errors
- `ShouldQueue` interface is not implemented on projectors

**Why Harmful:** A slow analytics write (e.g., an aggregation query) in the HTTP request path blocks the response to the user. Analytics affects the primary application flow. If the analytics database is slow or down, the entire application is down.

**Consequences:**
- Application performance tied to analytics performance
- HTTP request failures from analytics issues
- Cannot scale analytics write independently
- Analytics problems cause customer-facing errors

**Alternative:** Always dispatch event handling to a queue. Use `ShouldQueue` on projectors.

**Refactoring Strategy:**
1. Implement `ShouldQueue` on all projectors
2. Configure a dedicated queue for analytics projections
3. Verify that HTTP responses no longer depend on analytics writes
4. Monitor projection queue lag

**Detection Checklist:**
- [ ] Do all projectors implement `ShouldQueue`?
- [ ] Is there a dedicated analytics queue?
- [ ] Are HTTP responses independent of analytics write speed?
- [ ] Is projection lag monitored?

**Related Rules/Skills/Trees:**
- Rule: Always Queue Projector Execution (`04-standardized-knowledge.md:34-35`)

---

## 5. Non-Idempotent Projectors

**Category:** Reliability

**Description:** Projector calls `insert()` instead of `upsert()` or `updateOrCreate()`, creating duplicate rows on replay.

**Why It Happens:** Developers assume events are processed exactly once. They do not design for replay from the start.

**Warning Signs:**
- Projector uses `insert()` or `create()` for read model updates
- Read model tables lack unique constraints
- Replay creates duplicate rows
- Metrics are inflated after replay

**Why Harmful:** Replaying events (after schema changes, bug fixes, or data corruption) re-processes the same events. A projector that calls `insert()` creates duplicate rows on replay. Each replay doubles the row count, inflating metrics and corrupting data.

**Consequences:**
- Duplicate rows after every replay
- Inflated metrics in dashboards
- Data corruption that requires manual cleanup
- Cannot safely replay events

**Alternative:** Always use `upsert()` with a unique constraint. Design for replay from the start.

**Refactoring Strategy:**
1. Identify projectors using `insert()` or `create()`
2. Add unique constraints to read model tables
3. Replace `insert()` with `upsert()` or `updateOrCreate()`
4. Test replay to verify no duplicates

**Detection Checklist:**
- [ ] Do all projectors use `upsert()` or `updateOrCreate()`?
- [ ] Do all read model tables have unique constraints?
- [ ] Has replay been tested without producing duplicates?
- [ ] Are there unique constraint violation alerts?

**Related Rules/Skills/Trees:**
- Rule: Every Projector Must Be Idempotent (`04-standardized-knowledge.md:35-36`)
