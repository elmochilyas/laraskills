# Decomposition: Collaborative Editing Yjs Crdt

## Topic Overview
Conflict-free Replicated Data Types (CRDTs) enable real-time collaborative editing without a central authority for conflict resolution. Yjs is the leading JavaScript CRDT library, processing 26K-156K operations per second for text editing with efficient binary encoding. Automerge 2.0 (with Rust core) handles 260K keystrokes in ~600ms. CRDTs work by giving every character a unique ID and structuring operations so that concurrent edits converge deterministically regardless of application order....

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
collaborative-editing/K22-collaborative-editing-yjs-crdt/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Collaborative Editing Yjs Crdt
- **Purpose:** Conflict-free Replicated Data Types (CRDTs) enable real-time collaborative editing without a central authority for conflict resolution. Yjs is the leading JavaScript CRDT library, processing 26K-156K operations per second for text editing with efficient binary encoding. Automerge 2.0 (with Rust core) handles 260K keystrokes in ~600ms. CRDTs work by giving every character a unique ID and structuring operations so that concurrent edits converge deterministically regardless of application order....
- **Difficulty:** Advanced
- **Dependencies:
  - K23: Operational Transform Theory
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K31: Client Events (Whisper, Typing Indicators)
  - K33: Dedicated Reverb Fleet Architecture

## Dependency Graph
**Depends on:**
  - K23: Operational Transform Theory
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K31: Client Events (Whisper, Typing Indicators)
  - K33: Dedicated Reverb Fleet Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **CRDT document per resource**: One `Y.Doc` per editing session (e.g., per document, per note, per ticket)**Network provider abstraction**: `y-websocket` for real-time multiplayer, `y-indexeddb` for offline persistence, `y-webrtc` for peer-to-peer**Editor bindings**: Yjs provides bindings for ProseMirror, TipTap, Quill, Monaco, CodeMirror, and Slate**Awareness protocol**: Cursor positions, selections, and user presence sent via separate WebSocket channel (not CRDT state)**Document persistence**: Server stores snapshots + update log; cold-start loads latest snapshot and replays unapplied updates**y-websocket relay as sync server**: A Node.js WebSocket server (not PHP/Laravel) handles Yjs synchronization**Laravel as API/persistence layer**: Laravel manages document metadata, permissions, and history API; Yjs handles real-time sync**Binary encoding**: Yjs uses efficient binary encoding for CRDT updates (smaller than JSON-based approaches)**Periodic garbage collection**: Yjs GC compacts tombstones when all peers have acknowledged the deletion**CRDT memory overhead**: Tombstones accumulate; a 100KB visible document may use 3MB in memory (Yjs). GC mitigates but adds complexity**Specialized sync server required**: y-websocket is a separate Node.js server—Laravel broadcasting alone cannot handle CRDT sync**Rich-text formatting conflicts**: Plain-text CRDTs don't handle overlapping bold/italic ranges correctly; Peritext-style approaches needed**Library lock-in**: Yjs has a specific data model and sync protocol; switching to Automerge requires rewrite**Offline sync complexity**: Long offline periods may require full document re-sync if server GC removes tombstones the client depends onYjs processes 26K-156K ops/sec for text; Automerge 2.0 processes 260K keystrokes in 600msCRDT state grows with tombstones; enable Yjs GC and run compaction during low activityUpdate batching: buffer client operations for 50-100ms before sending (reduces WebSocket message count)Snapshot compression: periodic snapshots reduce cold-start time from replaying all historyAwareness data (cursor positions) is ephemeral; no persistence neededDeploy y-websocket as a separate service (Node.js) alongside LaravelConfigure sticky sessions on the y-websocket load balancer (each connection sticks to one relay instance)Implement document persistence: store snapshots in database/S3, incremental updates in Redis/DBSet up garbage collection schedule: low-traffic windows for compactionMonitor tombstone ratio: >10x visible characters indicates GC should runHandle stale clients: force full snapshot re-sync if client version is too far behindImplement presence awareness via y-websocket's awareness protocol (cursors, selections, online status)Test with realistic concurrent editing scenarios (2+ users editing same region)Expecting Laravel broadcasting to handle CRDT sync (it's only the transport layer; CRDT requires Yjs/Automerge logic)Not implementing garbage collection (document state grows unbounded, memory exhaustion)Using index-based cursor positions (indices change as other users edit; use character IDs)Sending individual keystrokes as separate WebSocket messages (batch with debounce)Assuming rich-text CRDT is solved (overlapping formatting marks are still an active research area)Not testing with three or more simultaneous editors (most bugs appear at >2 concurrent users)**Document state divergence**: Undetected CRDT merge bug causes different clients to see different state**GC horizon violation**: Client offline too long; GC removes tombstones the client references; merge fails**Relay server crash**: y-websocket instance dies; all connected editors desync until reconnect**Memory exhaustion**: Large document with many tombstones exceeds browser memory limit**Binding synchronization error**: Editor binding loses sync with Yjs document; UI shows different state than CRDTTipTap + Yjs: rich-text collaborative editing in Laravel projectsLiveblocks: managed Yjs backend as a serviceHocuspocus: self-hosted Yjs server with persistence APIAppFlowy: open-source Notion alternative using CRDTsLinear, Notion, Figma all use CRDT variants for real-time collaborationK23: Operational Transform TheoryK18: WebSocket vs SSE vs Polling Decision FrameworkK31: Client Events (Whisper, Typing Indicators)K33: Dedicated Reverb Fleet Architecture

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