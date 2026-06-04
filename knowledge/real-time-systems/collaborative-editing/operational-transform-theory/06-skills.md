# Skill: Understand Operational Transform Theory for Collaborative Editing

## Purpose
Understand OT theory, architecture, and implementation patterns to evaluate or maintain OT-based collaborative editing systems.

## When To Use
- Maintaining existing OT-based systems (ShareDB, Google Docs-style)
- Evaluating OT vs CRDT for a collaborative editing project
- Understanding legacy collaborative editing infrastructure
- Learning collaborative editing fundamentals for academic or research purposes

## When NOT To Use
- Starting a new collaborative editing project (use CRDTs/Yjs instead)
- Peer-to-peer or offline-first architectures (OT requires a central server)
- Rich text applications with complex formatting (CRDTs are simpler)

## Prerequisites
- Understanding of collaborative editing concepts
- Familiarity with text editing data models (position-based indices)
- Server-side programming experience for operation ordering

## Inputs
- Document data model (sequence of characters or rich text operations)
- Operation type definitions (insert, delete, format, etc.)
- Central server infrastructure (Node.js recommended for ShareDB)
- Client-server communication channel (WebSocket)

## Workflow
1. Define the set of operation types (insert, delete, format per character)
2. Implement or use an existing OT library (ShareDB, Google Docs OT)
3. Deploy a central server to establish total ordering of operations
4. Implement transform functions for every pair of operation types
5. Verify correctness with property-based testing
6. Configure periodic snapshot storage to bound recovery time
7. Set up monitoring for operation queue depth
8. Implement inverse operations for undo/redo support
9. Add rate limiting on operation submission
10. Test with concurrent editors and verify convergence

## Validation Checklist
- [ ] Transform functions implemented for all operation type pairs
- [ ] Property-based testing (QuickCheck/Hypothesis) validates convergence
- [ ] Central server deployed for operation ordering
- [ ] Periodic document snapshots configured (e.g., every 60s)
- [ ] Operation queue depth monitored
- [ ] Rate limiting on operation submission configured
- [ ] Undo/redo handles inverse operations correctly
- [ ] Concurrent edits converge to the same document state

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Document state diverges across clients | Missing or incorrect transform functions | Run property-based tests |
| Slow recovery after server restart | No periodic snapshots | Implement snapshots at regular intervals |
| Growing latency for edits | Operation queue depth increasing | Scale server or batch operations |
| New operation type causes corruption | Missing transforms against existing types | Add transforms for all existing types |
| Undo operation corrupts document | Undo not transformed against concurrent edits | Implement inverse operation transformation |

## Decision Points
- **OT vs CRDT**: OT for centralized server-authoritative systems; CRDTs for offline-first, peer-to-peer, or new projects
- **Custom vs library**: Always use proven libraries (ShareDB, Google Docs OT) — custom OT is high-risk
- **Snapshot frequency**: Every 60s for active documents; adjust based on operation volume and recovery requirements

## Performance/Security Considerations
- OT transforms are O(1) per operation pair but O(n) per incoming operation against concurrent queue
- Operation batching reduces total transform count
- Validate all operations server-side before transformation and broadcast
- Rate limiting prevents DoS via transform queue explosion
- Google Docs uses custom C++ transform engine for sub-millisecond transforms

## Related Rules (from 05-rules.md)
- Never Implement Custom OT Transform Functions Without Property-Based Testing
- Always Use Proven OT Libraries Instead of Custom Implementations
- Never Assume OT Works Without a Central Server
- Always Implement Periodic Snapshots
- Always Monitor OT Operation Queue Depth
- Never Add New Operation Types Without Corresponding Transforms

## Related Skills
- Integrate Yjs/CRDT for Collaborative Editing with Laravel
- Use Client Events for Whisper and Typing Indicators

## Success Criteria
- All concurrent edit operations converge to identical document state across clients
- Recovery from server restart completes within bounded time (due to snapshots)
- Operation queue depth stays within acceptable limits under normal load
- New operation types (if added) have transforms against all existing types
