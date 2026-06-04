# Skill: Apply Event Sourcing and CQRS to Integration Data Flows

## Purpose
Use event sourcing and CQRS patterns for API integration data flows, storing external API changes as event streams and serving read-optimized projections.

## When To Use
- Complex integration data flows requiring audit trails
- Multiple consumers needing different views of same integration data
- Rebuilding state from historical API events
- Compliance and audit requirements for integration data

## When NOT To Use
- Simple CRUD integrations (overkill)
- Low-volume, non-critical integrations

## Prerequisites
- Event store (database or dedicated store)
- Projection mechanism

## Workflow
1. Model integration data changes as events
2. Store events in append-only event stream
3. Build projections (read models) for query optimization
4. Rebuild projections from event stream when needed
5. Handle event versioning for schema evolution
6. Implement snapshotting for performance
7. Test projection accuracy against event stream
8. Monitor event stream size and projection lag

## Validation Checklist
- [ ] Data changes modeled as events
- [ ] Append-only event stream storage
- [ ] Read models projected from events
- [ ] Projection rebuildable from event stream
- [ ] Event versioning supports schema evolution
- [ ] Snapshots for performance optimization
- [ ] Projection lag monitored
