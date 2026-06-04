# Dispatching Domain Events — Decomposition

## Prime Directive
Establish a reliable, testable mechanism for dispatching domain events from Eloquent model operations, ensuring events are fired at the right time with the right payload and are processed appropriately.

## 1. Problem Space Decomposition

### 1.1 Dispatch Timing
- **Concern:** When during the operation should the event fire?
- **Sub-concerns:**
  1. Before DB commit vs after — pre-commit risk of rollback, post-commit risk of data visibility
  2. Should events be fired if the method exits early or throws?
  3. Multiple domain methods in one request — should events accumulate?

### 1.2 Event Payload
- **Concern:** What data the event carries.
- **Sub-concerns:**
  1. Full model vs model ID vs specific values
  2. Serialization strategy for queued listeners
  3. Versioning event payloads as the domain evolves

### 1.3 Dispatch Reliability
- **Concern:** Ensuring events are not lost.
- **Sub-concerns:**
  1. What happens if the queue push fails?
  2. How to handle transactional integrity of mutation + dispatch
  3. Re-delivery and deduplication strategy

### 1.4 Listener Coordination
- **Concern:** How listeners interact with the dispatched events.
- **Sub-concerns:**
  1. Synchronous vs queued: which listeners run when
  2. Listener failure handling and retry
  3. Listener ordering constraints

## 2. Solution Space Decomposition

### 2.1 Dispatch Pattern
- **Decision:** Explicit dispatch vs collected events.
- **Implementation slices:**
  1. Direct `Event::dispatch()` at end of domain method
  2. `$this->recordThat(new Event(...))` — collect, then flush
  3. Post-commit dispatch via `DB::afterCommit()` callback

### 2.2 Payload Design
- **Decision:** What data the event contains.
- **Implementation slices:**
  1. Only aggregate root ID: listener loads its own data
  2. ID + changed attributes: listener has immediate context
  3. Full model snapshot: convenient but risks stale data

### 2.3 Transactional Outbox (if needed)
- **Decision:** Reliability mechanism for critical events.
- **Implementation slices:**
  1. Simpler: dispatch after mutation in transaction
  2. Outbox: write event to DB table in same transaction, worker publishes
  3. Kafka/queue native transactions for high-volume systems

### 2.4 Event Metadata
- **Decision:** Standard fields on every event.
- **Implementation slices:**
  1. `occurredAt` (timestamp)
  2. `causerId` / `causerType` (who triggered)
  3. `correlationId` (trace across services)

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Domain Method | Dispatches domain event as final operation |
| Event Class | Carries payload; uses `Dispatchable` and `SerializesModels` |
| EventServiceProvider | Maps events to listeners (sync or queued) |
| Listener | Handles event; may dispatch new commands or events |
| Queue Worker | Processes queued listeners |
| Transaction | Wraps mutation + dispatch; `afterCommit()` for post-commit execution |
| Logger | Records dispatched events for audit and monitoring |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization