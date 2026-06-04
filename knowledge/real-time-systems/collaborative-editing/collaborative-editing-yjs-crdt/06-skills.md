# Skill: Integrate Yjs/CRDT for Collaborative Editing with Laravel

## Purpose
Integrate Yjs CRDT-based collaborative editing alongside Laravel, using a dedicated y-websocket relay for synchronization and Laravel for persistence/API.

## When To Use
- Real-time collaborative text editing (documents, notes, code)
- Collaborative whiteboard applications
- Offline-first applications requiring sync on reconnect
- Multi-user form/data entry with conflict resolution

## When NOT To Use
- Simple real-time features (use standard Laravel broadcasting)
- Server-authoritative editing where OT may be simpler
- Applications with simple, infrequent edits
- Server-side PHP-only environments (Yjs is a JavaScript library)

## Prerequisites
- Node.js environment for y-websocket relay
- JavaScript frontend application
- Laravel API for document persistence

## Inputs
- Yjs library (`yjs`)
- Network provider (`y-websocket`)
- Editor binding (Y-prose, Y-quill, Y-monaco)
- Laravel API endpoints for persistence

## Workflow
1. Deploy y-websocket relay as a separate Node.js service
2. Integrate Yjs on the frontend: create `Y.Doc` per editing session
3. Connect to relay via `WebsocketProvider` with document ID
4. Attach editor binding (ProseMirror, Monaco, Quill, TipTap)
5. Enable Yjs garbage collection on the document
6. Implement periodic snapshot persistence to Laravel API (`Y.encodeStateAsUpdate`)
7. Buffer client operations 50-100ms before sending (batch updates)
8. Use awareness protocol for cursor/selection syncing
9. Sanitize CRDT content on output (DOMPurify)
10. Restore document state from last snapshot on load

## Validation Checklist
- [ ] Yjs/Automerge library correctly integrated
- [ ] y-websocket relay deployed as separate service
- [ ] Document persistence (snapshots + update log) implemented
- [ ] Garbage collection enabled for tombstone compaction
- [ ] Awareness protocol handles cursor/selection syncing
- [ ] Editor bindings correctly synchronize with Yjs
- [ ] Concurrent editing with 3+ users works correctly
- [ ] Offline edits sync on reconnection

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Document state diverges | Missing GC or incorrect merge logic | Enable `doc.gc = true` |
| Data loss on server restart | No snapshot persistence | Implement periodic `Y.encodeStateAsUpdate` |
| High WebSocket message count | Unbatched keystroke messages | Buffer operations 50-100ms |
| State leakage between sessions | Sharing one Y.Doc across sessions | Create per-session Y.Doc instances |

## Decision Points
- **Yjs vs Automerge**: Yjs is the de facto standard for web-based CRDT; Automerge 2.0 has a Rust core for higher throughput
- **Network provider**: `y-websocket` for real-time collaboration; `y-indexeddb` for offline persistence
- **Editor binding**: Choose based on editor library (ProseMirror, Quill, Monaco, CodeMirror, Slate)

## Performance/Security Considerations
- Yjs processes 26K-156K ops/sec for text editing
- CRDT state grows with tombstones—enable GC and compact during low activity
- y-websocket relay is CPU-intensive—run as separate Node.js service
- Sanitize all CRDT content on output to prevent XSS
- Document permissions must be enforced at the Laravel API layer

## Related Rules (from 05-rules.md)
- Never Use Laravel Broadcasting for CRDT Synchronization
- Always Use Yjs Document Per Editing Session
- Always Enable Periodic Garbage Collection
- Always Batch Client Operations Before Sending
- Always Use y-weBSocket Relay as a Separate Service
- Always Persist Document Snapshots for Recovery
- Always Sanitize CRDT Content on Output

## Related Skills
- Understand Operational Transform Theory for Collaborative Editing
- Use Client Events for Whisper and Typing Indicators

## Success Criteria
- Multiple users can edit the same document simultaneously
- All users converge to the same document state
- Offline edits sync correctly on reconnection
- Document state persists across server restarts
- Cursor/selection awareness works in real-time
