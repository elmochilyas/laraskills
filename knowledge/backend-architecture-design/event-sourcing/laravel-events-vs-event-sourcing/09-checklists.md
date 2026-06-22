# Metadata

**Domain:** Backend Architecture Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Laravel Events vs Event Sourcing
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] Terminology is precise: "audit log" vs "event sourcing" vs "domain events" vs "lifecycle hooks"
- [ ] Laravel events used only for side-effect decoupling, not for state derivation
- [ ] `$dispatchesEvents` used only for lifecycle hooks, not domain events
- [ ] Audit logs named as "audit log" or "model_events" — not "event_store"
- [ ] Domain events dispatched explicitly in business logic, not via model hooks
- [ ] Event sourcing claims backed by: event store, aggregates, projections, snapshots, versioning, replay
- [ ] No claims about "replaying events to rebuild state" unless event sourcing infrastructure exists
- [ ] Event sourcing only adopted when concrete requirements demand it

---

# Architecture Checklist

- [ ] Laravel events: used for decoupling side effects (email, cache, search index, webhooks)
- [ ] Domain events: dispatched explicitly in actions/services at business boundaries
- [ ] Model lifecycle hooks: used for persistence concerns only (slug generation, UUIDs, cache invalidation)
- [ ] Audit log: separate table for debugging/compliance, not a source of truth
- [ ] Event sourcing (if used): append-only event store, aggregates, projectors, snapshots, versioning
- [ ] Event store immutability enforced at database and application level
- [ ] Compensating events used for corrections, never mutation of recorded events

---

# Implementation Checklist

- [ ] Domain events use `SerializesModels` to store model references safely
- [ ] Domain events dispatched after transaction commit when they trigger queued listeners
- [ ] Model observers limited to cache invalidation, slug generation, audit recording
- [ ] Audit log records old_values and new_values for diff visibility
- [ ] Event sourcing aggregate applies events sequentially with `apply*` methods
- [ ] Event sourcing projections use incremental processing (not full rebuild every time)
- [ ] Event sourcing snapshots stored every N events for replay performance

---

# Testing Checklist

- [ ] Domain events fire when business action completes
- [ ] Domain events do NOT fire during seeding or factory creation
- [ ] Model observers do NOT dispatch business-level domain events
- [ ] Audit log records all state changes with correct old/new values
- [ ] Event sourcing: aggregate state correctly rebuilt from event stream
- [ ] Event sourcing: projection correctly reflects events after processing
- [ ] Event sourcing: compensating event correctly adjusts aggregate state
- [ ] Event sourcing: event store rejects UPDATE and DELETE operations

---

# Production Readiness Checklist

- [ ] Architecture documentation clearly distinguishes domain events from event sourcing
- [ ] Onboarding documentation includes terminology guide for new engineers
- [ ] Event store (if used) has partitioning/archiving strategy for growth management
- [ ] Snapshot frequency configured based on aggregate event volume
- [ ] Projection rebuild time benchmarked and documented
- [ ] GDPR right-to-erasure process documented for immutable event stores
- [ ] Monitoring: alert on event store growth exceeding plan
- [ ] Monitoring: alert on projection rebuild failures

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: terminology precision, correct pattern usage
- [ ] Security requirements satisfied: event immutability, PII minimal in events, audit trail integrity
- [ ] Performance requirements satisfied: lightweight events, incremental projections, snapshot strategy
- [ ] Testing requirements satisfied: correct dispatch boundaries, immutability enforcement, replay verification
- [ ] Anti-pattern checks passed: no "event sourcing" mislabeling, no domain events via lifecycle hooks
- [ ] Production readiness verified: documentation, growth strategy, erasure process

---

# Related References

- AAP-LAP-001 (After-Commit Events & Jobs) — Proper dispatch timing for domain events
- Laravel Docs: Events — `illuminate/events` fire-and-forget system
- spatie/laravel-event-sourcing — Real event sourcing for Laravel
- AAP-SAAS-004 (Webhook Audit & Replay) — Audit log pattern (not event sourcing)
