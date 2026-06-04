# Observer pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Behavioral Patterns
- **Knowledge Unit:** Observer
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand event-driven architecture basics
- [ ] Know Laravel event system (Events, Listeners, Subscribers)
- [ ] Familiar with Eloquent model events (creating, created, etc.)

## Implementation Checklist
- [ ] Events defined for meaningful business occurrences
- [ ] Listeners contain single responsibility (one action per listener)
- [ ] Heavy I/O in listeners dispatched to queue (ShouldQueue)
- [ ] Event payload contains only necessary data (not entire objects)
- [ ] Listeners registered in `EventServiceProvider`
- [ ] Model events used for cross-cutting concerns (logging, cache invalidation)

## Verification Checklist
- [ ] Synchronous listeners don't block response time with heavy I/O
- [ ] Listeners don't modify same data as originating event (circular events)
- [ ] Listener exceptions handled (don't crash the main process)
- [ ] Event/listener count manageable (not too many, hard to reason about)
- [ ] Event payloads serializable for queue dispatch

## Security Checklist
- [ ] Events don't expose sensitive data to unauthorized listeners
- [ ] Event payloads don't leak internal identifiers
- [ ] Listener authorization checked if needed
- [ ] Queued events don't expose sensitive data in queue payload

## Performance Checklist
- [ ] Synchronous listeners block main process until complete
- [ ] Queue listeners: dispatch adds ~1-5ms for serialization + dispatch
- [ ] Too many listeners per event increases response time
- [ ] Memory: each event carries payload; large payloads with many listeners consume memory

## Production Readiness Checklist
- [ ] Critical listeners tested (events → expected side effects)
- [ ] Queued listeners monitored (processing time, failure rate)
- [ ] Event flow documented for complex workflows
- [ ] `ShouldDispatchAfterCommit` used for transactional integrity

## Common Mistakes to Avoid
- [ ] Synchronous listener doing heavy I/O (blocks response time)
- [ ] Listener modifying same data the event originated from (conflicts, circular events)
- [ ] Not handling listener exceptions (unhandled exception crashes request)
- [ ] Too many events/listeners (application becomes hard to reason about)
- [ ] Event payload containing entire objects (serialization issues, coupling)
