# ECC Anti-Patterns — Operational Transform Theory

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Collaborative Editing |
| **Knowledge Unit** | Operational Transform Theory |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Custom OT Implementation Without Property-Based Testing
2. Peer-to-Peer OT (No Central Ordering Server)
3. Adding Operation Types Without Corresponding Transforms
4. No Periodic Snapshots for Document Recovery
5. Selecting OT for New Collaborative Editing Projects

---

## Repository-Wide Anti-Patterns

- Overengineering
- God Services

---

## Anti-Pattern 1: Custom OT Implementation Without Property-Based Testing

### Category
Testing

### Description
Writing Operational Transform functions from scratch without property-based testing, relying only on unit tests to verify convergence behavior.

### Warning Signs
- OT transform functions written manually
- Only unit tests exist for transform functions
- No property-based testing (QuickCheck, Hypothesis)
- Document divergence bugs appear sporadically in production
- No automated convergence verification

### Why It Is Harmful
OT transform functions have complex edge cases that unit tests systematically miss. The transform composition property (`T(T(op1, op2), op3) == T(T(op1, op3), op2)`) must hold for all operation sequences. Unit tests for specific scenarios cannot cover the combinatorial explosion of concurrent operation interleavings. A single missing edge case causes divergent document states that are catastrophic — users see different content with no automatic recovery.

### Real-World Consequences
A custom OT implementation passes 50 unit tests but has one subtle bug: transforming an insert-after-delete at the same position. After 2 weeks of production use, two users editing the same paragraph see different document states. The document is unrecoverable — the divergence cannot be reconciled automatically. Users must manually merge their versions.

### Preferred Alternative
Use proven OT libraries (ShareDB, Google Docs OT) or implement custom transforms only with property-based testing using QuickCheck or Hypothesis.

### Refactoring Strategy
1. Evaluate replacing custom OT with ShareDB or Yjs
2. If custom OT must be kept, add property-based tests covering all transform pairs
3. Verify convergence: `apply(T(op1, op2), apply(op2, state)) == apply(T(op2, op1), apply(op1, state))`
4. Run property tests with random operation sequences of varying length

### Detection Checklist
- [ ] Custom OT implementation without property-based tests
- [ ] Sporadic document divergence in production
- [ ] No automated convergence verification

### Related Rules
- (Rule: Never implement custom OT without property-based testing)

---

## Anti-Pattern 2: Peer-to-Peer OT (No Central Ordering Server)

### Category
Architecture

### Description
Attempting to run Operational Transformation without a central ordering server, expecting clients to converge through peer-to-peer communication.

### Warning Signs
- OT system designed without a central server
- Clients communicate directly for operation sharing
- Document state diverges between clients
- No total ordering mechanism for concurrent operations

### Why It Is Harmful
OT fundamentally requires a central server to establish a total ordering of concurrent operations. Without this ordering, the transform functions cannot determine which operations are concurrent and which are sequential. Operations applied in different orders on different clients produce different final states. Documents permanently diverge with no reconciliation mechanism.

### Real-World Consequences
A team implements OT with WebRTC peer-to-peer communication. Two users make concurrent edits. Client A processes edit 1 then edit 2. Client B processes edit 2 then edit 1. The transform functions produce different results because the perceived ordering differs. The documents diverge and never converge again.

### Preferred Alternative
Always deploy a central ordering server for OT. For peer-to-peer or offline-first scenarios, use CRDTs (Yjs/Automerge) instead.

### Refactoring Strategy
1. Deploy a central OT server (ShareDB or custom)
2. Route all operations through the server for ordering
3. Clients send operations to server, receive transformed ops from server
4. Remove peer-to-peer communication for document operations
5. Verify convergence by testing concurrent edits

### Detection Checklist
- [ ] No central ordering server
- [ ] Peer-to-peer OT communication
- [ ] Document divergence across clients

### Related Rules
- (Rule: Never assume OT works without a central server)

---

## Anti-Pattern 3: Adding Operation Types Without Corresponding Transforms

### Category
Architecture

### Description
Adding a new operation type (e.g., merge cells, format bold) without implementing transform functions against all existing operation types, causing document corruption when the new operation interacts with concurrent edits.

### Warning Signs
- New operation type added but no transform functions written
- Document corruption occurs when new operation is used concurrently
- Missing transform pairs for new type against existing types
- Errors surface only when new operation is edited simultaneously

### Why It Is Harmful
Each new operation type requires O(n) transform functions against all existing types — `T(newOp, insert)`, `T(newOp, delete)`, `T(newOp, format)`, etc. Without these transforms, the server cannot correctly order concurrent operations involving the new type. When a user applies a merge-cells operation while another user inserts a character in the merged area, the system corrupts the document state.

### Real-World Consequences
A spreadsheet OT system adds a "merge cells" operation without implementing transforms against existing insert/delete operations. Two users work on the same sheet — one merges cells, the other inserts text. The system applies the operations without correct transformation. Cell data is corrupted, and the merge is irreversibly broken.

### Preferred Alternative
Implement transform functions against ALL existing operation types when adding a new operation type.

### Refactoring Strategy
1. List all existing operation types
2. For the new type, implement transform functions against each existing type
3. Add property-based tests for each new transform pair
4. Never deploy a new operation type without complete transform coverage

### Detection Checklist
- [ ] New operation type added without transforms
- [ ] Missing transform pairs for existing types
- [ ] Document corruption with concurrent operations of different types

### Related Rules
- (Rule: Never add new operation types without corresponding transforms)

---

## Anti-Pattern 4: No Periodic Snapshots for Document Recovery

### Category
Reliability

### Description
Storing only the operation log for OT-based collaborative documents without periodic snapshots, requiring replay of all operations from the beginning for recovery — making recovery prohibitively slow for long-lived documents.

### Warning Signs
- Only operation log stored, no snapshots
- Document recovery time grows with document age
- New clients must replay all history to see current state
- Recovery times measured in minutes for active documents

### Why It Is Harmful
Without snapshots, recovering a document's state requires replaying every operation since creation. A document with 1 million operations (typical for an active document over weeks) takes minutes to replay. Server restart, new client joining, or crash recovery all suffer from this linear replay cost.

### Real-World Consequences
A collaborative document has been edited for 3 months, accumulating 2 million operations. The server restarts for maintenance. Recovery takes 4 minutes — 2 million operations must be replayed. During this time, no one can edit the document. Users see "document loading" for 4 minutes.

### Preferred Alternative
Store periodic document snapshots and prune operations since the last snapshot to bound recovery time.

### Refactoring Strategy
1. Implement periodic snapshot storage (every 60 seconds or every N operations)
2. Store full document state at each snapshot
3. Prune operations that are included in the snapshot
4. On recovery, load the latest snapshot then replay remaining operations
5. Verify recovery time is bounded (seconds, not minutes)

### Detection Checklist
- [ ] Only operation log persisted
- [ ] Recovery time grows with document lifetime
- [ ] No snapshot mechanism implemented

### Related Rules
- (Rule: Always implement periodic snapshots)

---

## Anti-Pattern 5: Selecting OT for New Collaborative Editing Projects

### Category
Architecture

### Description
Choosing Operational Transformation for a new collaborative editing project when CRDTs (Yjs/Automerge) would be simpler, more capable, and better supported.

### Warning Signs
- New project starts with OT architecture
- No evaluation of CRDT alternatives
- OT chosen "because it's well-established" without considering CRDT maturity
- Project needs rich text, offline support, or peer-to-peer capabilities

### Why It Is Harmful
OT requires a central server, complex transform functions, and property-based testing. CRDTs (Yjs) converge without a central server, support offline editing, handle rich text via ProseMirror/Monaco bindings, and have a larger ecosystem with 26K-156K ops/sec throughput. OT's only remaining advantage is for server-authoritative systems with massive existing OT infrastructure (Google Docs). For new projects, OT adds unnecessary complexity and limitations.

### Real-World Consequences
A team starts a collaborative note-taking app using OT. They spend 3 months implementing transform functions, debugging divergence bugs, and setting up the central server. After 3 months, they discover Yjs could have been implemented in 2 days. They rewrite the entire sync layer.

### Preferred Alternative
Use CRDTs (Yjs/Automerge) for all new collaborative editing projects. Reserve OT only for maintaining existing OT-based infrastructure.

### Refactoring Strategy
1. Evaluate Yjs/Automerge for the use case
2. If new project, start with Yjs
3. For existing OT systems, evaluate migration cost vs remaining OT maintenance burden
4. Document the CRDT preference in architecture decisions

### Detection Checklist
- [ ] New project using OT instead of CRDTs
- [ ] Offline or peer-to-peer features needed but not supported by OT
- [ ] No CRDT evaluation before OT decision

### Related Rules
- (Rule: Prefer CRDTs over OT for new collaborative editing projects)
