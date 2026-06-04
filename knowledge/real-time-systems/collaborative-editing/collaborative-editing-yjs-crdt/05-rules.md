## Never Use Laravel Broadcasting for CRDT Synchronization
---
## Architecture
---
Never attempt to handle Yjs CRDT synchronization through Laravel's broadcasting system.
---
Laravel broadcasting is designed for server-to-client event push, not for the low-latency, high-frequency binary operations required by CRDT synchronization. Yjs requires a dedicated WebSocket relay (y-websocket) running in Node.js.
---
```php
// Attempting CRDT sync via Laravel broadcast — wrong tool
broadcast(new YjsUpdate($documentId, $update));
```
---
```javascript
// Dedicated y-websocket relay for CRDT sync
const provider = new WebsocketProvider('ws://yjs-relay:1234', 'doc-1', doc);
```
---
Simple collaborative features using only awareness (cursors) via Laravel client events. No common exceptions for CRDT data sync.
---
Unusable latency; data corruption; overwhelmed broadcast queue.

## Always Use Yjs Document Per Editing Session
---
## Architecture
---
Always create one `Y.Doc` instance per editing session to maintain clean state separation.
---
Sharing a single `Y.Doc` across multiple editing sessions causes state leakage — edits from one session appear in another, and cleanup becomes impossible.
---
```javascript
const globalDoc = new Y.Doc(); // Shared across sessions — state leaks
```
---
```javascript
// One document per session
class EditorSession {
    constructor(id) {
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider('ws://...', id, this.doc);
    }
}
```
---
Single-document applications. No common exceptions for multi-document apps.
---
State leakage between sessions; impossible cleanup.

## Always Enable Periodic Garbage Collection
---
## Performance
---
Always enable Yjs garbage collection to compact tombstones and prevent unbounded document growth.
---
CRDT tombstones (deleted characters) accumulate in the document state. Without GC, the document grows linearly with edit history, eventually causing memory exhaustion.
---
```javascript
const doc = new Y.Doc();
doc.gc = true; // Enable automatic garbage collection
```
---
```javascript
// No GC — tombstones accumulate indefinitely
const doc = new Y.Doc();
```
---
No common exceptions; GC should always be enabled for production collaborative editing.
---
Unbounded document growth; memory exhaustion; degraded performance.

## Always Batch Client Operations Before Sending
---
## Performance
---
Always buffer client-side operations for 50-100ms before sending to reduce WebSocket message count.
---
Sending every keystroke as an individual WebSocket message floods the network with tiny frames and increases overhead per operation. Batching groups operations into efficient updates.
---
```javascript
// Every keystroke = 1 WebSocket message — excessive overhead
ytext.insert(pos, char);
```
---
```javascript
// Batched updates — send accumulated changes periodically
let buffer = [];
const flush = () => { if(buffer.length) { provider.send(buffer); buffer = []; } };
setInterval(flush, 50);
```
---
Low-frequency edits where every keystroke must appear instantly on other clients. No common exceptions.
---
WebSocket message flood; reduced throughput; higher latency per operation.

## Always Use y-WeBSocket Relay as a Separate Service
---
## Architecture
---
Always deploy the y-websocket relay as a separate Node.js service, independent from the Laravel application.
---
Yjs synchronization is CPU-intensive and uses binary protocols incompatible with Laravel's PHP runtime. Running it within the Laravel process would block HTTP requests and require non-standard PHP extensions.
---
```yaml
# Docker Compose — separate services
services:
  laravel:
    build: .
  yjs-relay:
    image: node:18
    command: node y-websocket-server.js
```
---
```yaml
# Running Yjs inside Laravel — unsupported and unreliable
```
---
Prototypes where all services run on a single server. No common exceptions for production.
---
Blocked HTTP requests; synchronization failures; scaling limitations.

## Always Persist Document Snapshots for Recovery
---
## Reliability
---
Always persist Yjs document snapshots (`Y.encodeStateAsUpdate`) to the database at regular intervals for crash recovery.
---
Without persistence, document state exists only in memory. A server restart or crash permanently loses all document content.
---
```javascript
// No persistence — state lost on restart
const provider = new WebsocketProvider('ws://...', 'doc-1', doc);
```
---
```javascript
// Periodic snapshots to Laravel API
setInterval(async () => {
    const update = Y.encodeStateAsUpdate(doc);
    await fetch('/api/documents/1/sync', { method: 'POST', body: update });
}, 30000);
```
---
Ephemeral documents that don't need persistence. No common exceptions for production documents.
---
Data loss on server restart; no crash recovery.

## Always Sanitize CRDT Content on Output
---
## Security
---
Always sanitize CRDT document content before rendering in the browser, as it can contain arbitrary user data.
---
CRDT documents store user-generated content without server-side inspection. Malicious content embedded in shared documents executes in all viewers' browsers.
---
```javascript
// Unsafe rendering — XSS vulnerability
element.innerHTML = ytext.toString();
```
---
```javascript
// Sanitize before rendering
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(ytext.toString());
```
---
Trusted-environment applications. No common exceptions for user-generated content.
---
XSS vulnerabilities; arbitrary code execution in viewers' browsers.
