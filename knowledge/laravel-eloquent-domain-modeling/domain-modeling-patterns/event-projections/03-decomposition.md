# Event Projections — Decomposition

## Prime Directive
Build and maintain read-optimized projections from domain events that serve specific query use cases with acceptable staleness and reliable replay capability.

## 1. Problem Space Decomposition

### 1.1 Read Model Identification
- **Concern:** Which read models benefit from projection.
- **Sub-concerns:**
  1. Query patterns that are slow or complex against the write model
  2. Queries that join across multiple aggregates
  3. Reporting and analytics that aggregate large datasets
  4. Dashboards and UIs requiring specific data shapes

### 1.2 Projection Derivation
- **Concern:** How events map to projection updates.
- **Sub-concerns:**
  1. Which event types affect which projections
  2. State machine for projection rows (insert, update, delete)
  3. Handling event ordering within the same projection

### 1.3 Consistency & Latency
- **Concern:** How current the projection must be.
- **Sub-concerns:**
  1. Strong consistency vs eventual consistency requirements
  2. Acceptable staleness window per projection
  3. User-facing inconsistency handling (refresh prompts, stale indicators)

### 1.4 Replay & Recovery
- **Concern:** Rebuilding projections from event history.
- **Sub-concerns:**
  1. Idempotent upsert logic
  2. Replay ordering guarantees
  3. Replay time budget and progress tracking

## 2. Solution Space Decomposition

### 2.1 Projector Structure
- **Decision:** Organization of projector classes.
- **Implementation slices:**
  1. One projector per event per table
  2. One projector per table handling multiple events
  3. Hierarchical projectors (base + specialized)

### 2.2 Projection Storage
- **Decision:** Where and how projections are stored.
- **Implementation slices:**
  1. Same database, different table (simple)
  2. Same database, different schema/prefix
  3. Separate database or read replica

### 2.3 Sync vs Async
- **Decision:** When each projection updates.
- **Implementation slices:**
  1. Synchronous (same transaction/request) for critical reads
  2. Immediate queue (after commit, before response) for user-facing
  3. Deferred batch (cron/scheduled) for analytics

### 2.4 Replay Command
- **Decision:** How to support rebuilds.
- **Implementation slices:**
  1. Truncate + replay all events
  2. Reset to specific point-in-time and replay from there
  3. Swap-table strategy for zero-downtime rebuilds

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Domain Event | Input source for projector logic |
| Projector | Listens to events, updates projection table |
| Projection Table | Read-optimized table for specific queries |
| Controller/API | Queries projection table for read responses |
| Artisan Command | `projector:rebuild` triggers replay |
| Event Store | Source of events for replay (if event-sourced) |
| Queue Worker | Processes async event listeners for projections |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization