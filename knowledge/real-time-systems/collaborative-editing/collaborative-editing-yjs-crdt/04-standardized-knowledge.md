# Standardized Knowledge: Collaborative Editing with Yjs/CRDT

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Collaborative Editing |
| Knowledge Unit ID | K22 |
| Knowledge Unit | Collaborative Editing with Yjs/CRDT |
| Difficulty | Advanced |
| Maturity | Emerging |
| Confidence | Medium |
| Last Updated | 2026-06-02 |

## Overview

Conflict-free Replicated Data Types (CRDTs) enable real-time collaborative editing without a central authority for conflict resolution. Yjs is the leading JavaScript CRDT library, processing 26K-156K operations per second for text editing. Automerge 2.0 (with Rust core) handles 260K keystrokes in ~600ms. CRDTs work by giving every character a unique ID and structuring operations so that concurrent edits converge deterministically regardless of application order. For Laravel applications, CRDT integration requires a dedicated sync server (y-websocket relay) separate from the broadcasting system. Laravel serves as the persistence/API layer while Yjs handles real-time sync.

## Core Concepts

CRDTs replace Operational Transformation's central coordination with mathematical convergence. Each insert operation carries a unique ID (client + clock) and a reference to the character it was inserted after. Delete operations mark characters as tombstones. The merge rule: apply every operation exactly once, in any order, and all replicas converge to the same state. Yjs implements this with the YATA algorithm. The `Y.Doc` is the in-memory state; network providers (`y-websocket`, `y-webrtc`) synchronize it across clients.

## When To Use

- Real-time collaborative text editing (documents, notes, code)
- Collaborative whiteboard applications
- Offline-first applications requiring sync on reconnect
- Peer-to-peer collaboration scenarios
- Multi-user form/data entry with conflict resolution

## When NOT To Use

- Simple real-time features (use standard Laravel broadcasting)
- Centralized, server-authoritative editing (OT may be simpler)
- Applications with simple, infrequent edits (overkill)
- Scenarios requiring strong consistency guarantees (OT may be preferred)
- Server-side PHP-only environments (Yjs is a JavaScript library)

## Best Practices (WHY)

- **Yjs document per resource**: One `Y.Doc` per editing session for clean separation of state
- **Network provider abstraction**: Use `y-websocket` for real-time multiplayer, `y-indexeddb` for offline persistence
- **Editor bindings**: Yjs provides bindings for ProseMirror, TipTap, Quill, Monaco, CodeMirror, and Slate
- **Periodic garbage collection**: Enable Yjs GC to compact tombstones; run during low activity
- **Update batching**: Buffer client operations 50-100ms before sending to reduce WebSocket message count

## Architecture Guidelines

- y-websocket relay is a Node.js WebSocket server (not PHP/Laravel) handling Yjs synchronization
- Laravel serves as the API/persistence layer for document metadata, permissions, history
- Yjs uses efficient binary encoding for CRDT updates (smaller than JSON)
- Awareness protocol (cursors, selections) sent via separate WebSocket channel, not CRDT state
- Snapshots (`Y.encodeStateAsUpdate`) serialize current state for persistence

## Performance Considerations

- Yjs processes 26K-156K ops/sec for text; Automerge 2.0 processes 260K keystrokes in 600ms
- CRDT state grows with tombstones; enable GC and compact during low activity
- Snapshot compression reduces cold-start time from replaying all history
- Awareness data is ephemeral; no persistence needed
- Binary encoding reduces bandwidth vs JSON

## Security Considerations

- CRDT documents can contain arbitrary user data; sanitize on output
- y-websocket relay needs authentication to prevent unauthorized document access
- Document permissions should be enforced at the Laravel API layer, not the sync server
- CRDT update stream can be used for data exfiltration if not properly secured

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Expecting Laravel broadcasting to handle CRDT sync | Misunderstanding CRDT requirements | Neither system works | Use Yjs/Automerge for CRDT logic; Laravel for persistence |
| No garbage collection | Ignoring tombstone accumulation | Document state grows unbounded; memory exhaustion | Schedule Yjs GC during low activity |
| Index-based cursor positions | Using positional indices | Misalignment as other users edit | Use character IDs (Yjs relative positions) |
| Unbatched keystroke messages | Sending every keystroke as WS message | WebSocket message flood | Debounce/batch updates 50-100ms |
| Not testing 3+ concurrent editors | Insufficient testing scope | Divergence bugs at 3+ users | Test with realistic multi-user scenarios |

## Anti-Patterns

- **CRDT as a general broadcast system**: Using CRDT infrastructure for simple server-to-client events
- **No persistence**: Relying solely on in-memory Yjs without snapshots; document state lost on restart
- **No garbage collection**: Tombstones accumulate, eventually causing memory exhaustion
- **Laravel as sync server**: Attempting to run Yjs synchronization logic inside Laravel/PHP

## Examples

```javascript
// Yjs client setup
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:1234', 'document-1', doc);

const ytext = doc.getText('content');
ytext.observe(() => {
    // Update editor UI
});

// Listen for awareness (cursors)
provider.awareness.on('change', () => {
    const states = provider.awareness.getStates();
    // Update cursor positions
});
```

## Related Topics

- K23: Operational Transform Theory
- K18: WebSocket vs SSE vs Polling Decision Framework
- K31: Client Events (Whisper, Typing Indicators)
- K33: Dedicated Reverb Fleet Architecture

## AI Agent Notes

- CRDTs have largely superseded OT for new collaborative editing projects (2026 consensus)
- y-websocket is a separate Node.js server—Laravel broadcasting alone cannot handle CRDT sync
- Yjs 13.6.x is the de facto standard for web-based CRDT collaboration
- For Laravel integration, use Laravel for persistence/API and Yjs for real-time sync

## Verification

- [ ] Yjs/Automerge library is correctly integrated for CRDT synchronization
- [ ] y-websocket relay is deployed as a separate service
- [ ] Document persistence (snapshots + update log) is implemented
- [ ] Garbage collection is configured for tombstone compaction
- [ ] Awareness protocol handles cursor/selection syncing
- [ ] Editor bindings correctly synchronize with Yjs document state
- [ ] Concurrent editing with 3+ users works correctly
- [ ] Offline edits are synced on reconnection
