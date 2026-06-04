# Decomposition: Operational Transform Theory

## Topic Overview
Operational Transformation (OT) is a family of algorithms for real-time collaborative editing that transforms concurrent operations against each other to maintain consistency. OT requires a central server to establish a total ordering of operations. When two users edit the same document simultaneously, each operation is transformed against concurrent operations before application, so both users see the same final result. OT was pioneered in Google Wave and refined for Google Docs. The core re...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
collaborative-editing/K23-operational-transform-theory/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Operational Transform Theory
- **Purpose:** Operational Transformation (OT) is a family of algorithms for real-time collaborative editing that transforms concurrent operations against each other to maintain consistency. OT requires a central server to establish a total ordering of operations. When two users edit the same document simultaneously, each operation is transformed against concurrent operations before application, so both users see the same final result. OT was pioneered in Google Wave and refined for Google Docs. The core re...
- **Difficulty:** Advanced
- **Dependencies:
  - K22: Collaborative Editing with Yjs/CRDT
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K31: Client Events (Whisper, Typing Indicators)

## Dependency Graph
**Depends on:**
  - K22: Collaborative Editing with Yjs/CRDT
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K31: Client Events (Whisper, Typing Indicators)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Central server authority**: All operations pass through a single server that establishes total order**Transform function pairs**: Every operation type needs transform functions against every other type**Operation queue**: Server maintains a queue of concurrent operations for transformation**Periodic snapshots**: Document state snapshots prevent replaying all operations from the beginning**Undo via inverse operations**: Undo generates an inverse operation that is transformed against concurrent edits**Central server required**: Unlike CRDTs, OT cannot function peer-to-peer without a server ordering operations**Server-authoritative state**: The server's document state is the source of truth; clients are views**Transform function complexity**: Adding new operation types (move, format, comment) requires O(n) new transform functions**Transform complexity**: Writing correct transform functions is difficult; subtle bugs cause divergence (OT incompleteness problem)**Server bottleneck**: All operations must go through the server; latency is server round-trip dependent**Poor offline support**: Long offline periods create complex operation queues that are difficult to resolve**Scalability ceiling**: Per-document server process must handle all editing operations; shared-doc editing does not scale horizontally easily**Test complexity**: Property-based testing required to verify convergence properties; unit tests insufficientOT transform functions are typically O(1) per operation pairServer must transform each incoming op against all concurrent ops in the queue; queue length affects latencyGoogle Docs uses custom C++ transform engine for sub-millisecond transformsOperation size (character-level vs. word-level) affects transform frequencyBatch operations (>1 character) reduce total transform countUse a proven OT library (ShareDB, Google Docs OT) rather than implementing custom transformsImplement periodic document snapshots to bound recovery timeMonitor server operation queue depth (indicator of transform backlog)Use property-based testing (QuickCheck, Hypothesis) to verify transform function correctnessImplement operation retry with idempotency for network failuresConsider CRDTs (Yjs) as an alternative for new projects—OT complexity may not be justifiedImplementing OT without property-based testing (transform function bugs are subtle and rare, but catastrophic)Assuming OT works peer-to-peer (it requires a central server for ordering)Not handling undo correctly (naive inverse operations do not account for concurrent edits)Adding new operation types without writing transforms against all existing typesUsing position-based indices that drift as other users edit (transform is designed to fix this, but bugs are common)**Divergence**: Transform function bug causes clients to converge to different states after concurrent edits**Server crash**: All unacknowledged operations lost; clients must re-send after reconnect**Operation queue explosion**: High concurrency on a single document causes large transform queues; latency degrades**Infinite transform loop**: Certain concurrent operation sequences trigger circular transforms (TP2 violation)**Large document startup**: Replaying all operations from the beginning for a new client is slow without snapshotsGoogle Docs (proprietary OT implementation, C++ engine)ShareDB (open-source OT library for JSON documents, Node.js)Apache Wave (formerly Google Wave, the original OT platform)Etherpad (simplified OT for plain text editing)Notion (hybrid: OT for text blocks, CRDT for structure)Linear (hybrid: OT for issue descriptions, CRDT for metadata)K22: Collaborative Editing with Yjs/CRDTK18: WebSocket vs SSE vs Polling Decision FrameworkK31: Client Events (Whisper, Typing Indicators)

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization