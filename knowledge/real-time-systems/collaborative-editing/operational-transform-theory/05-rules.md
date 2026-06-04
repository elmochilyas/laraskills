## Never Implement Custom OT Transform Functions Without Property-Based Testing
---
## Testing
---
Never deploy custom Operational Transform functions without property-based testing using QuickCheck or Hypothesis.
---
OT transform functions have complex edge cases that unit tests miss. Bugs cause divergent document states that are catastrophic — users see different content with no automatic recovery.
---
```php
// Unit tests only — misses subtle divergence bugs
public function testInsertInsertTransform() { /* one case */ }
```
---
```php
// Property-based testing via QuickCheck
// Verify: apply(T(op1, op2), apply(op2, state)) == apply(T(op2, op1), apply(op1, state))
```
---
No common exceptions; OT transform correctness requires property-based verification.
---
Document divergence; unrecoverable data inconsistency.

## Always Use Proven OT Libraries Instead of Custom Implementations
---
## Architecture
---
Never write OT transform functions from scratch; use proven libraries like ShareDB or Google Docs OT.
---
OT transform function bugs are catastrophic and notoriously difficult to debug. Even small errors cause divergent document states that cannot be reconciled automatically.
---
```php
// Custom OT implementation — high risk of divergence bugs
function transform($op1, $op2) { /* hand-written logic */ }
```
---
```javascript
// ShareDB — battle-tested OT transforms
const share = require('sharedb');
share.use(require('rich-text'));
```
---
No common exceptions; OT is too complex for custom implementation.
---
Document divergence; data corruption; unrecoverable state.

## Never Assume OT Works Without a Central Server
---
## Architecture
---
Always deploy a central ordering server for OT; do not attempt peer-to-peer OT.
---
OT requires a server to establish a total ordering of concurrent operations. Without a central ordering authority, operations cannot be correctly transformed and documents will diverge.
---
```javascript
// Peer-to-peer OT — no central ordering, guaranteed divergence
```
---
```javascript
// ShareDB server for operation ordering
const backend = new ShareDB();
backend.use(require('rich-text'));
backend.listen(8000);
```
---
Offline-first applications (use CRDTs instead). No common exceptions.
---
Document divergence; inconsistent state across clients.

## Always Implement Periodic Snapshots
---
## Performance
---
Always store periodic document snapshots in addition to operation logs to bound recovery time.
---
Without snapshots, recovering a document requires replaying every operation since the beginning. For long-lived documents with millions of operations, this recovery process is prohibitively slow.
---
```javascript
// No snapshots — replay all operations on recovery
```
```javascript
// Periodic snapshots — fast recovery
setInterval(() => {
    const snapshot = getDocumentState();
    storeSnapshot(docId, snapshot);
    clearOperations(); // Prune old ops
}, 60000);
```
---
Transient documents with short lifetimes. No common exceptions.
---
Slow document recovery; resource-intensive replay.

## Always Monitor OT Operation Queue Depth
---
## Maintainability
---
Always monitor the OT server's operation queue depth as a key health metric.
---
Growing queue depth indicates the server cannot process operations as fast as clients produce them. Without monitoring, this silently degrades to unusable latency.
---
```javascript
// No queue monitoring — latency grows undetected
```
```javascript
setInterval(() => {
    const depth = otServer.getQueueDepth();
    if (depth > 1000) alert('OT queue depth critical');
}, 5000);
```
---
Low-traffic editing applications. No common exceptions.
---
Degraded latency; user frustration; untracked performance issues.

## Never Add New Operation Types Without Corresponding Transforms
---
## Architecture
---
Always implement transform functions against all existing operation types when adding a new operation type.
---
Each new operation type requires O(n) transform functions against all existing types. Missing transforms cause operations to be applied incorrectly, leading to document divergence.
---
```javascript
// New "merge cells" operation — no transforms for existing types
operations: ['insert', 'delete', 'format', 'mergeCells'] // Missing T(merge, insert), etc.
```
---
```javascript
// All transform pairs implemented
const TRANSFORMS = {
    'insert:insert': TI,
    'insert:delete': TD,
    'delete:insert': DI,
    'delete:delete': DD,
    'mergeCells:insert': MI, // Added for new type
    'mergeCells:delete': MD,
};
```
---
No common exceptions; new types require transforms against all existing types.
---
Document divergence; data corruption for specific operation sequences.
