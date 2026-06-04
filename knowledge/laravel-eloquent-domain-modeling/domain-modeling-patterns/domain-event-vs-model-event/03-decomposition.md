# Domain Event vs Model Event — Decomposition

## Prime Directive
Establish a clear pattern for using model events (persistence concerns) and domain events (business concerns), ensuring each is applied to its appropriate use case without overlap or confusion.

## 1. Problem Space Decomposition

### 1.1 Event Categorization
- **Concern:** Determining whether a given firing should be a model or domain event.
- **Sub-concerns:**
  1. Does the event carry business meaning or only persistence meaning?
  2. Would the event still be relevant if storage changed (file, API, event store)?
  3. Does a single domain operation map to multiple model events?

### 1.2 Event Firing Point
- **Concern:** Where in the code to dispatch each event type.
- **Sub-concerns:**
  1. Model events: automatic on `save()`/`delete()` — no decision needed
  2. Domain events: must be explicitly dispatched at domain method boundaries
  3. Ensuring domain events fire exactly once per business operation

### 1.3 Listener Assignment
- **Concern:** Which listeners respond to model events vs domain events.
- **Sub-concerns:**
  1. Infrastructure listeners (cache, search, logs) → model events
  2. Business listeners (notifications, workflows, projections) → domain events
  3. Avoiding duplicate processing when both event types fire

### 1.4 Testing Strategy
- **Concern:** Testing events appropriately for each type.
- **Sub-concerns:**
  1. Model events: check that `save()` triggers expected listeners
  2. Domain events: assert dispatch in domain method tests
  3. Integration tests for event listener behavior

## 2. Solution Space Decomposition

### 2.1 Event Definition
- **Decision:** How each event type is defined.
- **Implementation slices:**
  1. Model events: `$dispatchesEvents` property mapping
  2. Domain events: dedicated event classes in `app/Events/Domain/`
  3. Domain event naming: past-tense verb + noun (OrderPlaced, InvoicePaid)

### 2.2 Dispatch Strategy
- **Decision:** When and how each event type fires.
- **Implementation slices:**
  1. Model events: automatic via Eloquent lifecycle (no explicit dispatch)
  2. Domain events: explicit `Event::dispatch()` at end of domain methods
  3. Domain events: `$this->recordThat()` pattern for event-sourced aggregates

### 2.3 Listener Separation
- **Decision:** Which listeners subscribe to which event types.
- **Implementation slices:**
  1. Separate `EventServiceProvider` sections for model vs domain events
  2. Observer classes for model events; listener classes for domain events
  3. Queue policy: model listeners synchronous, domain listeners queued

### 2.4 Prevention of Overlap
- **Decision:** Avoiding duplicate processing.
- **Implementation slices:**
  1. Never dispatch a domain event from a model event listener (prevent accidental double-dispatch)
  2. Use `Model::withoutEvents()` for bulk operations that should not trigger listeners
  3. Idempotency keys on domain event listeners

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Eloquent Model | Fires model events automatically; domain methods dispatch domain events |
| Observer | Listens to model events (cache, logs, search) |
| Event Class | Represents domain event as a dedicated class |
| Listener | Processes domain events (notifications, workflows) |
| Queue | Deferred processing for domain event listeners |
| EventServiceProvider | Registers both model event observers and domain event listeners |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization