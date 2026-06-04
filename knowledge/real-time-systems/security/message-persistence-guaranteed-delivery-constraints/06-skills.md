# Skill: Handle Broadcast Message Persistence and Delivery Constraints

## Purpose
Understand and work around Laravel broadcasting's fire-and-forget delivery semantics by implementing client-side missed event recovery, deduplication, and API fallbacks.

## When To Use
- Understanding delivery semantics for any broadcasting implementation
- Designing real-time features where occasional message loss is acceptable
- Building chat applications or notification systems needing reliability
- Documenting the real-time delivery contract for the application

## When NOT To Use
- Assuming broadcast is reliable for authoritative data delivery
- Replacing REST API state management with broadcast events

## Prerequisites
- Broadcasting configured with queue worker
- Client-side EventSource or Echo connection
- API endpoint for missed event recovery

## Inputs
- Event unique IDs for deduplication
- Missed events API endpoint (REST)
- Event history storage (database, TTL-based)
- Delivery guarantee documentation

## Workflow
1. Accept fire-and-forget as the default delivery model
2. Include unique, monotonically increasing event IDs in all broadcast payloads
3. Implement client-side deduplication using event IDs
4. Create a REST API endpoint for fetching missed events since a given event ID
5. On client reconnection, fetch missed events and apply them
6. Set TTL-based pruning on stored event history (e.g., 5 minutes)
7. Implement REST API fallback for critical data (never rely solely on broadcast)
8. Document delivery guarantees (or lack thereof) in the application's real-time contract

## Validation Checklist
- [ ] Fire-and-forget semantics understood and documented
- [ ] Client implements "fetch missed events" on reconnection
- [ ] Unique event IDs used in broadcast payloads (UUID or monotonically incrementing)
- [ ] Client-side deduplication implemented
- [ ] Event history TTL configured (pruning old events)
- [ ] REST API fallback exists for critical data
- [ ] Delivery guarantees documented in real-time contract

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Users miss critical updates during disconnect | Broadcast used as sole delivery | Add REST API fallback + missed event replay |
| Duplicate notifications on reconnect | No event IDs or deduplication | Include UUID event IDs + client-side dedup |
| Event history grows unbounded | No TTL-based pruning | Set TTL on stored broadcast events |
| Frontend devs assume reliable delivery | No documented guarantees | Document fire-and-forget semantics in contract |

## Decision Points
- **Event ID strategy**: UUID for global uniqueness; monotonically incrementing integer for ordered replay
- **Replay window**: 5 minutes for live context; longer if compliance requires audit trail
- **Storage medium**: Database for queryable history; Redis for short-lived cache with automatic TTL

## Performance/Security Considerations
- Fire-and-forget latency: ~5-20ms total (queue + pub/sub + WebSocket)
- Persistent delivery adds 5-50ms per event for database write
- Event history storage grows linearly — implement TTL-based pruning
- Event history must have access controls matching the channel's authorization

## Related Rules (from 05-rules.md)
- Never Assume Broadcast Delivery Is Reliable
- Always Implement "Fetch Missed Events" on Client Reconnection
- Always Use Unique Event IDs for Client-Side Deduplication
- Always Set TTL on Event History
- Always Document Delivery Guarantees in the Real-Time Contract

## Related Skills
- Set Up Real-Time Notifications with Broadcast + Database
- Reconnect and Mitigate Reconnection Storms for Reverb

## Success Criteria
- Clients that disconnect and reconnect receive missed events via API replay
- Duplicate events are deduplicated on the client side
- Event history storage has bounded growth via TTL pruning
- Critical data has a REST API fallback beyond broadcast
- Delivery guarantees are documented and understood by the team
