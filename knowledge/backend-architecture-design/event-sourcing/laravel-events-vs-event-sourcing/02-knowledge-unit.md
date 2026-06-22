# Metadata

Domain: Backend Architecture Design
Subdomain: Event Sourcing
Knowledge Unit: Laravel events are not event sourcing
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Laravel events (illuminate/events) are a decoupling and side-effect mechanism — they are not event sourcing. Event sourcing requires an append-only event store, aggregates, projections, snapshots, and replay capability. Confusing Laravel events with event sourcing leads to incorrect architectural claims about rebuilding state or replaying history.
