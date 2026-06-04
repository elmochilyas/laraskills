# Metadata

**Domain:** real-time-systems
**Subdomain:** collaborative-editing
**Knowledge Unit:** collaborative-editing-yjs-crdt
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Awareness protocol handles cursor/selection syncing
- [ ] Concurrent editing with 3+ users works correctly
- [ ] Document persistence (snapshots + update log) is implemented
- [ ] Always Batch Client Operations Before Sending
- [ ] Always Enable Periodic Garbage Collection
- [ ] Always Persist Document Snapshots for Recovery
- [ ] Always Sanitize CRDT Content on Output
- [ ] Always Use Yjs Document Per Editing Session
- [ ] Awareness protocol handles cursor/selection syncing
- [ ] Concurrent editing with 3+ users works correctly
- [ ] Document persistence (snapshots + update log) implemented
- [ ] Attach editor binding (ProseMirror, Monaco, Quill, TipTap)
- [ ] Buffer client operations 50-100ms before sending (batch updates)
- [ ] Connect to relay via `WebsocketProvider` with document ID
- [ ] All users converge to the same document state
- [ ] Cursor/selection awareness works in real-time
- [ ] Document state persists across server restarts

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Attach editor binding (ProseMirror, Monaco, Quill, TipTap)
- [ ] Buffer client operations 50-100ms before sending (batch updates)
- [ ] Connect to relay via `WebsocketProvider` with document ID
- [ ] Deploy y-websocket relay as a separate Node.js service
- [ ] Enable Yjs garbage collection on the document
- [ ] Implement periodic snapshot persistence to Laravel API (`Y.encodeStateAsUpdate`)
- [ ] Integrate Yjs on the frontend: create `Y.Doc` per editing session
- [ ] Restore document state from last snapshot on load
- [ ] Sanitize CRDT content on output (DOMPurify)
- [ ] Use awareness protocol for cursor/selection syncing
- [ ] Always Batch Client Operations Before Sending
- [ ] Always Enable Periodic Garbage Collection

---

# Performance Checklist

- [ ] Awareness data is ephemeral; no persistence needed
- [ ] Binary encoding reduces bandwidth vs JSON
- [ ] CRDT state grows with tombstones; enable GC and compact during low activity
- [ ] Snapshot compression reduces cold-start time from replaying all history
- [ ] Yjs processes 26K-156K ops/sec for text; Automerge 2.0 processes 260K keystrokes in 600ms

---

# Security Checklist

- [ ] CRDT documents can contain arbitrary user data; sanitize on output
- [ ] CRDT update stream can be used for data exfiltration if not properly secured
- [ ] Document permissions should be enforced at the Laravel API layer, not the sync server
- [ ] y-websocket relay needs authentication to prevent unauthorized document access
- [ ] Sanitize all CRDT content on output to prevent XSS

---

# Reliability Checklist

- [ ] Data loss on server restart
- [ ] Document state diverges
- [ ] High WebSocket message count
- [ ] State leakage between sessions
- [ ] Always Batch Client Operations Before Sending
- [ ] Always Enable Periodic Garbage Collection
- [ ] Always Persist Document Snapshots for Recovery
- [ ] Always Sanitize CRDT Content on Output
- [ ] Always Use Yjs Document Per Editing Session
- [ ] Always Use y-WeBSocket Relay as a Separate Service

---

# Testing Checklist

- [ ] All users converge to the same document state
- [ ] Awareness protocol handles cursor/selection syncing
- [ ] Concurrent editing with 3+ users works correctly
- [ ] Cursor/selection awareness works in real-time
- [ ] Document persistence (snapshots + update log) implemented
- [ ] Document persistence (snapshots + update log) is implemented
- [ ] Document state persists across server restarts
- [ ] Editor bindings correctly synchronize with Yjs
- [ ] Editor bindings correctly synchronize with Yjs document state
- [ ] Garbage collection enabled for tombstone compaction

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using Laravel Broadcasting for CRDT Synchronization]
- [ ] [No Yjs Garbage Collection (Unbounded Tombstone Growth)]
- [ ] [Unbatched Keystroke Messages (WebSocket Flood)]
- [ ] [No Document Snapshots (State Lost on Restart)]
- [ ] [No CRDT Content Sanitization (XSS Risk)]
- [ ] CRDT as a general broadcast system
- [ ] Laravel as sync server
- [ ] No garbage collection
- [ ] No persistence

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


