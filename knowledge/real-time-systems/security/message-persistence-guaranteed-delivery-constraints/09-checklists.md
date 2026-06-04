# Metadata

**Domain:** real-time-systems
**Subdomain:** security
**Knowledge Unit:** message-persistence-guaranteed-delivery-constraints
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Client implements "fetch missed events" on reconnection
- [ ] Client-side deduplication implemented
- [ ] Delivery guarantees documented in real-time contract
- [ ] Always Document Delivery Guarantees in the Real-Time Contract
- [ ] Always Implement "Fetch Missed Events" on Client Reconnection
- [ ] Always Set TTL on Event History
- [ ] Always Use Unique Event IDs for Client-Side Deduplication
- [ ] Never Assume Broadcast Delivery Is Reliable
- [ ] Client implements "fetch missed events" on reconnection
- [ ] Client-side deduplication implemented
- [ ] Delivery guarantees documented in real-time contract
- [ ] Accept fire-and-forget as the default delivery model
- [ ] Create a REST API endpoint for fetching missed events since a given event ID
- [ ] Document delivery guarantees (or lack thereof) in the application's real-time contract
- [ ] Clients that disconnect and reconnect receive missed events via API replay
- [ ] Critical data has a REST API fallback beyond broadcast
- [ ] Delivery guarantees are documented and understood by the team

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Accept fire-and-forget as the default delivery model
- [ ] Create a REST API endpoint for fetching missed events since a given event ID
- [ ] Document delivery guarantees (or lack thereof) in the application's real-time contract
- [ ] Implement client-side deduplication using event IDs
- [ ] Implement REST API fallback for critical data (never rely solely on broadcast)
- [ ] Include unique, monotonically increasing event IDs in all broadcast payloads
- [ ] On client reconnection, fetch missed events and apply them
- [ ] Set TTL-based pruning on stored event history (e.g., 5 minutes)
- [ ] Always Document Delivery Guarantees in the Real-Time Contract
- [ ] Always Implement "Fetch Missed Events" on Client Reconnection
- [ ] Always Set TTL on Event History
- [ ] Always Use Unique Event IDs for Client-Side Deduplication

---

# Performance Checklist

- [ ] Event history storage grows linearly with event volume; implement TTL-based pruning
- [ ] Fire-and-forget latency: queue + Redis pub/sub + WebSocket write (~5-20ms total)
- [ ] Persistent delivery: add database/Redis write per event (5-50ms additional) + client replay fetch on reconnect
- [ ] Replay overhead: fetching and re-sending missed events on reconnect adds load proportional to offline duration
- [ ] Fire-and-forget latency: ~5-20ms total (queue + pub/sub + WebSocket)

---

# Security Checklist

- [ ] Client-side deduplication must not be susceptible to ID manipulation
- [ ] Event history stored for replay must have appropriate access controls
- [ ] Unique event IDs prevent replay attacks if combined with proper authentication
- [ ] Event history must have access controls matching the channel's authorization

---

# Reliability Checklist

- [ ] Duplicate notifications on reconnect
- [ ] Event history grows unbounded
- [ ] Frontend devs assume reliable delivery
- [ ] Users miss critical updates during disconnect
- [ ] Always Document Delivery Guarantees in the Real-Time Contract
- [ ] Always Implement "Fetch Missed Events" on Client Reconnection
- [ ] Always Set TTL on Event History
- [ ] Always Use Unique Event IDs for Client-Side Deduplication
- [ ] Never Assume Broadcast Delivery Is Reliable

---

# Testing Checklist

- [ ] Client implements "fetch missed events" on reconnection
- [ ] Clients that disconnect and reconnect receive missed events via API replay
- [ ] Client-side deduplication implemented
- [ ] Critical data has a REST API fallback beyond broadcast
- [ ] Delivery guarantees are documented and understood by the team
- [ ] Delivery guarantees documented in real-time contract
- [ ] Duplicate events are deduplicated on the client side
- [ ] Event history storage has bounded growth via TTL pruning
- [ ] Event history TTL configured
- [ ] Event history TTL configured (pruning old events)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Assuming Reliable Broadcast Delivery (Fire-and-Forget Misunderstanding)]
- [ ] [Broadcast as Sole Delivery Mechanism for Critical Data]
- [ ] [No Missed Event Recovery on Client Reconnection]
- [ ] [No Unique Event IDs for Deduplication]
- [ ] [No Documented Delivery Guarantees]
- [ ] Exactly-once delivery expectations from fire-and-forget systems
- [ ] Ordering guarantees assumed
- [ ] Using broadcast for authoritative state

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


