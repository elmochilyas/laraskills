# Metadata
Domain: Real-Time Systems
Subdomain: Collaborative Editing
Knowledge Unit: Collaborative Editing with Yjs/CRDT
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Conflict-free Replicated Data Types (CRDTs) enable real-time collaborative editing without a central authority for conflict resolution. Yjs is the leading JavaScript CRDT library, processing 26K-156K operations per second for text editing with efficient binary encoding. Automerge 2.0 (with Rust core) handles 260K keystrokes in ~600ms. CRDTs work by giving every character a unique ID and structuring operations so that concurrent edits converge deterministically regardless of application order. For Laravel applications, CRDT integration requires a dedicated sync server (y-websocket relay) separate from the broadcasting system. Laravel serves as the persistence/API layer while Yjs handles real-time sync. The `y-websocket` provider wraps Yjs documents and synchronizes state across connected clients. Awareness protocol (cursor positions, selections) is handled separately from document state.

## Core Concepts
CRDTs replace Operational Transformation's central coordination with mathematical convergence. Each insert operation carries a unique ID (client + clock) and a reference to the character it was inserted after. Delete operations mark characters as tombstones (not physically removed). The merge rule: apply every operation exactly once, in any order, and all replicas converge to the same state. Yjs implements this with the YATA algorithm. The CRDT document (`Y.Doc`) is the in-memory state; `Y.Text` and `Y.Array` are shared types. Network providers (`y-websocket`, `y-webrtc`) synchronize the document across clients.

## Mental Models
A CRDT document is a collaborative whiteboard where everyone draws simultaneously. Each person's pen has a unique ID. If two people write at the same spot, the order is determined by their pen IDs—not by a central coordinator. The result is deterministic: everyone sees the same final drawing regardless of whose edits arrived first.

## Internal Mechanics
Yjs creates a `Y.Doc` instance per document. When a user types, Yjs generates an update (a binary diff). The update is transmitted to the `y-websocket` relay server via WebSocket. The relay server broadcasts the update to all other connected clients via the same provider. Each client applies the update to its local `Y.Doc`, which emits events for bound editor components (ProseMirror, TipTap, Monaco, Quill) to re-render. The document state is never "stored" in a conventional sense—it's reconstructed from the sequence of updates. For persistence, Yjs snapshots (`Y.encodeStateAsUpdate`) serialize the current state, and the server stores periodic snapshots plus incremental updates.

## Patterns
- **CRDT document per resource**: One `Y.Doc` per editing session (e.g., per document, per note, per ticket)
- **Network provider abstraction**: `y-websocket` for real-time multiplayer, `y-indexeddb` for offline persistence, `y-webrtc` for peer-to-peer
- **Editor bindings**: Yjs provides bindings for ProseMirror, TipTap, Quill, Monaco, CodeMirror, and Slate
- **Awareness protocol**: Cursor positions, selections, and user presence sent via separate WebSocket channel (not CRDT state)
- **Document persistence**: Server stores snapshots + update log; cold-start loads latest snapshot and replays unapplied updates

## Architectural Decisions
- **y-websocket relay as sync server**: A Node.js WebSocket server (not PHP/Laravel) handles Yjs synchronization
- **Laravel as API/persistence layer**: Laravel manages document metadata, permissions, and history API; Yjs handles real-time sync
- **Binary encoding**: Yjs uses efficient binary encoding for CRDT updates (smaller than JSON-based approaches)
- **Periodic garbage collection**: Yjs GC compacts tombstones when all peers have acknowledged the deletion

## Tradeoffs
- **CRDT memory overhead**: Tombstones accumulate; a 100KB visible document may use 3MB in memory (Yjs). GC mitigates but adds complexity
- **Specialized sync server required**: y-websocket is a separate Node.js server—Laravel broadcasting alone cannot handle CRDT sync
- **Rich-text formatting conflicts**: Plain-text CRDTs don't handle overlapping bold/italic ranges correctly; Peritext-style approaches needed
- **Library lock-in**: Yjs has a specific data model and sync protocol; switching to Automerge requires rewrite
- **Offline sync complexity**: Long offline periods may require full document re-sync if server GC removes tombstones the client depends on

## Performance Considerations
- Yjs processes 26K-156K ops/sec for text; Automerge 2.0 processes 260K keystrokes in 600ms
- CRDT state grows with tombstones; enable Yjs GC and run compaction during low activity
- Update batching: buffer client operations for 50-100ms before sending (reduces WebSocket message count)
- Snapshot compression: periodic snapshots reduce cold-start time from replaying all history
- Awareness data (cursor positions) is ephemeral; no persistence needed

## Production Considerations
- Deploy y-websocket as a separate service (Node.js) alongside Laravel
- Configure sticky sessions on the y-websocket load balancer (each connection sticks to one relay instance)
- Implement document persistence: store snapshots in database/S3, incremental updates in Redis/DB
- Set up garbage collection schedule: low-traffic windows for compaction
- Monitor tombstone ratio: >10x visible characters indicates GC should run
- Handle stale clients: force full snapshot re-sync if client version is too far behind
- Implement presence awareness via y-websocket's awareness protocol (cursors, selections, online status)
- Test with realistic concurrent editing scenarios (2+ users editing same region)

## Common Mistakes
- Expecting Laravel broadcasting to handle CRDT sync (it's only the transport layer; CRDT requires Yjs/Automerge logic)
- Not implementing garbage collection (document state grows unbounded, memory exhaustion)
- Using index-based cursor positions (indices change as other users edit; use character IDs)
- Sending individual keystrokes as separate WebSocket messages (batch with debounce)
- Assuming rich-text CRDT is solved (overlapping formatting marks are still an active research area)
- Not testing with three or more simultaneous editors (most bugs appear at >2 concurrent users)

## Failure Modes
- **Document state divergence**: Undetected CRDT merge bug causes different clients to see different state
- **GC horizon violation**: Client offline too long; GC removes tombstones the client references; merge fails
- **Relay server crash**: y-websocket instance dies; all connected editors desync until reconnect
- **Memory exhaustion**: Large document with many tombstones exceeds browser memory limit
- **Binding synchronization error**: Editor binding loses sync with Yjs document; UI shows different state than CRDT

## Ecosystem Usage
- TipTap + Yjs: rich-text collaborative editing in Laravel projects
- Liveblocks: managed Yjs backend as a service
- Hocuspocus: self-hosted Yjs server with persistence API
- AppFlowy: open-source Notion alternative using CRDTs
- Linear, Notion, Figma all use CRDT variants for real-time collaboration

## Related Knowledge Units
- K23: Operational Transform Theory
- K18: WebSocket vs SSE vs Polling Decision Framework
- K31: Client Events (Whisper, Typing Indicators)
- K33: Dedicated Reverb Fleet Architecture

## Research Notes
The CRDT field has matured significantly since 2020. Yjs (13.6.x current) is the de facto standard for web-based CRDT collaboration. Automerge 2.0's Rust core (via WASM) provides performance for JSON-shaped data. Diamond Types (2025-2026) claims to be "the world's fastest CRDT" with Rust implementation. The Fugue CRDT algorithm minimizes interleaving anomalies (e.g., "ab" + "cd" merging to "acbd" instead of expected "abcd"). Zylos Research (January 2026) notes that CRDTs are foundational to the local-first software movement. The consensus in 2026: use CRDTs (specifically Yjs) for new collaborative projects; OT remains viable for centralized server-authoritative architectures with simpler operation types.
