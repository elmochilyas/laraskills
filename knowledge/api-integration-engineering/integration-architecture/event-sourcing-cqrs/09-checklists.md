# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** event-sourcing-cqrs
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Delivery events recorded for each lifecycle stage
- [ ] Event store configured with appropriate storage backend
- [ ] Event versioning implemented from day 1
- [ ] Keep Reactors Asynchronous
- [ ] Record Delivery Attempt Before HTTP Call
- [ ] Test Replay Regularly
- [ ] Use Event Sourcing Only for Critical Webhook Delivery Paths
- [ ] Use Projectors for Read Models, Not Direct Event Store Queries
- [ ] Append-only event stream storage
- [ ] Data changes modeled as events
- [ ] Event versioning supports schema evolution
- [ ] Build projections (read models) for query optimization
- [ ] Handle event versioning for schema evolution
- [ ] Implement snapshotting for performance

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Build projections (read models) for query optimization
- [ ] Handle event versioning for schema evolution
- [ ] Implement snapshotting for performance
- [ ] Model integration data changes as events
- [ ] Monitor event stream size and projection lag
- [ ] Rebuild projections from event stream when needed
- [ ] Store events in append-only event stream
- [ ] Test projection accuracy against event stream
- [ ] Keep Reactors Asynchronous
- [ ] Record Delivery Attempt Before HTTP Call
- [ ] Test Replay Regularly
- [ ] Use Event Sourcing Only for Critical Webhook Delivery Paths

---

# Performance Checklist

- [ ] Event store writes: ~5-15ms per event
- [ ] Full replay: O(n) over all events
- [ ] Projector updates: ~5-20ms per event
- [ ] Reactors execute synchronously; can be queued for async
- [ ] Snapshot-driven replay: O(snapshots + events since last snapshot)

---

# Security Checklist

- [ ] Event store is append-only; use database-level permissions to enforce
- [ ] Implement event store backup and restore procedures
- [ ] Log all replay operations for audit trail of the audit trail
- [ ] Never store raw secrets (API keys, tokens) in event payloads
- [ ] Projectors must handle idempotency for safe replay

---

# Reliability Checklist

- [ ] Business logic in reactors instead of projectors
- [ ] Not versioning events from the start (schema breaks existing projectors)
- [ ] Projectors dependent on external services (replay calls them thousands of times)
- [ ] Storing large webhook payloads in events (separate storage from metadata)
- [ ] Using event sourcing when simple audit log suffices (over-engineering)

---

# Testing Checklist

- [ ] Append-only event stream storage
- [ ] Data changes modeled as events
- [ ] Delivery events recorded for each lifecycle stage
- [ ] Event store configured with appropriate storage backend
- [ ] Event versioning implemented from day 1
- [ ] Event versioning supports schema evolution
- [ ] Projection lag monitored
- [ ] Projection rebuildable from event stream
- [ ] Projectors maintain current delivery status views
- [ ] Reactors handle side effects asynchronously

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Event Sourcing for Every Webhook Regardless of Criticality]
- [ ] [Unversioned Events]
- [ ] [Business Logic in Reactors Instead of Projectors]
- [ ] [Projectors Dependent on External Services]
- [ ] [No Snapshot Strategy for Long-Running Aggregates]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


