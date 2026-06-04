# Decision Trees: Event Sourcing Fundamentals

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Event sourcing fundamentals
- **Knowledge Unit ID:** CPC-09
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Event sourcing vs ORM for entity persistence | Architecture | Persistence strategy selection |
| 2 | Snapshots vs full replay for aggregate loading | Architecture | Aggregate hydration performance |
| 3 | Correction events vs mutation for event fixes | Architecture | Event correction strategy |

---

## Decision 1: Event sourcing vs ORM for entity persistence

### Context
Event sourcing stores state changes as an append-only event log. ORM (Eloquent) stores the current state as a single row. Event sourcing enables complete audit trails and temporal queries but adds significant complexity. ORM is simple but provides no history. The choice depends on whether the entity needs an audit trail, temporal queries, or replayable projections.

### Decision Tree

```
Does the entity need complete history and temporal querying?
├── YES → Consider event sourcing
│   Audit trail required: financial, compliance, legal
│   Temporal queries: "what was the state on June 1?"
│   Rebuildable projections: read models that can be rebuilt from scratch
│   ├── Is the entity complex enough to justify the overhead?
│   │   ├── YES → Use event sourcing
│   │   │   Complete audit trail, temporal queries, replayable projections
│   │   │   Cost: event store setup, snapshot management, projection maintenance
│   │   └── NO → Consider simpler history mechanism
│   │       Eloquent's logging, model events, or a simple audit table
│   │       Partial history without full event sourcing complexity
│   └── Is this a simple CRUD entity?
│       YES → Event sourcing is over-engineering
│       Use ORM (Eloquent) with a separate audit trail if needed
└── NO → Use ORM (Eloquent)
    Simple CRUD doesn't need event sourcing
    Eloquent provides current state, fast reads, simple writes
    If audit trail is needed but temporal queries aren't:
    Consider Eloquent logging or a separate events table
```

### Rationale
Event sourcing is a powerful but expensive pattern. It should be applied selectively to entities that genuinely require its benefits: complete audit trails, temporal queries, and rebuildable projections. Applying event sourcing to every entity ("event sourcing everywhere") adds massive unnecessary complexity. For simple CRUD entities, Eloquent is simpler, faster, and more maintainable. A compromise is Eloquent with a separate audit trail — history tracking without the full event sourcing investment.

### Recommended Default
ORM for most entities; event sourcing only for entities needing audit trails or temporal queries

### Risks
- Event sourcing for everything: massive unnecessary complexity
- ORM without audit trail: no history, can't answer "what changed?"
- Event sourcing without projections: events stored but no read models built

### Related Rules
- Use snapshots for performance (CPC-09/05-rules.md)
- Never modify or delete events (CPC-09/05-rules.md)
- Use event sourcing selectively (CPC-09/05-rules.md)

### Related Skills
- Implement Event Sourcing with Append-Only Event Store (CPC-09/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Implement CQRS (CPC-08/06-skills.md)

---

## Decision 2: Snapshots vs full replay for aggregate loading

### Decision Tree

```
How many events does the aggregate's stream contain?
├── Fewer than 100 events
│   → Full replay from the beginning is acceptable
│   Replaying 50-100 events is fast (milliseconds)
│   No snapshot needed yet
│   But: configure snapshot threshold for when the stream grows
├── Hundreds to thousands of events
│   → Snapshots REQUIRED
│   Replaying 1000+ events on every load is slow
│   When should snapshots be taken?
│   ├── Based on event count (every N events)
│   │   Take snapshot every 50-100 events
│   │   Consistent load time regardless of stream length
│   └── Based on time (every M hours/days)
│       Take snapshot every 24 hours or every N events, whichever comes first
│       Good for aggregates with burst writes
└── Tens of thousands of events
    → Multiple snapshots (snapshot chain)
    Maintain multiple snapshot versions
    Oldest snapshot for DR, latest for daily loading
    Consider archive strategy for old events
```

### Rationale
Without snapshots, event replay time grows linearly with the event stream length. An aggregate with 100,000 events loads slowly on every request. Snapshots store the aggregate's state at a specific point, so only events after the snapshot need replaying. The snapshot threshold is a tuning parameter — too frequent and snapshot storage grows, too infrequent and replays are slow. Start with a snapshot every 100 events or daily, and monitor aggregate load times to tune.

### Recommended Default
Snapshots every 50-100 events (or daily, whichever comes first)

### Risks
- No snapshots: load time grows linearly with stream length
- Too-frequent snapshots: storage overhead from many snapshots
- Snapshot without version tracking: can't know which events are already reflected

### Related Rules
- Use snapshots for performance (CPC-09/05-rules.md)
- Never modify or delete events (CPC-09/05-rules.md)
- Version events in the event store (CPC-09/05-rules.md)

### Related Skills
- Implement Event Sourcing with Append-Only Event Store (CPC-09/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

---

## Decision 3: Correction events vs mutation for event fixes

### Decision Tree

```
A committed event has wrong data — how to fix it?
├── Append a correction event (RECOMMENDED)
│   Events are immutable facts. Append a new event that corrects the record.
│   Example: `OrderTotalCorrected` event after an `OrderPlaced` event with wrong total
│   Pros: audit trail preserved, projections stay consistent, replay produces correct state
│   Cons: consumers must handle correction events
│   └── Does the correction event change the aggregate state?
│       ├── YES → Apply correction event in aggregate replay
│       │   Aggregate's apply method handles the correction
│       └── NO → Correction is metadata-only (e.g., fix a typo in notes)
│           Skip application to aggregate, but keep event in stream
├── Mutate the existing event (ANTI-PATTERN)
│   Modify the payload of a committed event directly
│   Pros: quick fix, no new event type to define
│   Cons: breaks append-only guarantee, projections become inconsistent,
│   audit trail destroyed, replay produces different results
│   NEVER DO THIS — always append a correction event instead
└── Delete the event and reinsert (ANTI-PATTERN)
    Even worse than mutation — rewriting history entirely
    Replay produces different results
    Projections built before deletion are now wrong
    NEVER DO THIS
```

### Rationale
Events are immutable facts. Once committed, they cannot be changed — doing so breaks the fundamental guarantee of event sourcing. A correction event preserves the original fact (the mistake happened) and records the correction (the truth). Projections see both events and can handle them. The audit trail is complete — future replay produces the same correct state. Even though correction events add complexity (consumers must handle them), this cost is far lower than the cost of broken projections and destroyed audit trails from mutation.

### Recommended Default
Always append correction events; never mutate or delete committed events

### Risks
- Mutating events: projections become inconsistent, audit trail destroyed
- Deleting events: non-deterministic replays, broken projections
- Correction event without consumer handling: projection stays wrong
- Correction event without version tracking: order of correction vs other events unclear

### Related Rules
- Never modify or delete events (CPC-09/05-rules.md)
- Version events in the event store (CPC-09/05-rules.md)
- Make projections idempotent (CPC-09/05-rules.md)

### Related Skills
- Implement Event Sourcing with Append-Only Event Store (CPC-09/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
