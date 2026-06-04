# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Collaborative Editing
**Knowledge Unit:** Collaborative Editing with Yjs/CRDT
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | CRDT sync transport: y-websocket vs y-webrtc | architectural |
| 2 | Persistence strategy for CRDT documents | architectural |
| 3 | Yjs garbage collection strategy | performance |

---

# Architecture-Level Decision Trees

---

## CRDT Sync Transport

---

## Decision Context

Choosing the network provider for Yjs document synchronization.

---

## Decision Criteria

* performance
* architectural
* security

---

## Decision Tree

Need centralized server for document persistence/history?
↓
YES → Need peer-to-peer connections for low latency?
    ↓
    YES → **y-websocket for persistence + y-webrtc for P2P** — hybrid
    NO → **y-websocket relay** — Node.js server, centralized sync
NO → All users on same local network?
    ↓
    YES → **y-webrtc** — P2P, no server needed
    NO → Need offline support?
        ↓
        YES → **y-indexeddb** (local) + sync on reconnect
        NO → **y-webrtc** with signaling server

---

## Rationale

y-websocket provides a central relay for synchronization, persistence, and access control. y-webrtc enables direct P2P connections for lower latency but requires a signaling server for initial connection setup and doesn't provide built-in persistence.

---

## Recommended Default

**Default:** y-websocket relay for production applications
**Reason:** Centralized sync, persistence via snapshots, access control, and awareness (cursor) protocol built-in.

---

## Risks Of Wrong Choice

y-webrtc without signaling server fails to establish connections in NAT environments. y-websocket without persistence loses document state on relay restart.

---

## Related Rules

Deploy y-websocket as a Separate Service, Use Laravel for API/Persistence Layer

---

## Related Skills

Implement Collaborative Editing with Yjs/CRDT

---

---

## Persistence Strategy

---

## Decision Context

How and when to persist CRDT document state.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Document state must survive server restart?
↓
YES → Expected document size > 100KB of CRDT data?
    ↓
    YES → **Snapshot + incremental update log** — periodic full snapshots + delta log
    NO → **Full state snapshots** — Y.encodeStateAsUpdate on each save
NO → Only in-memory editing?
    ↓
    YES → No persistence needed; document lost on restart
    NO → Need offline persistence for clients?
        ↓
        YES → **y-indexeddb** — browser-side persistence

---

## Rationale

CRDT state grows with edits and tombstones. Full snapshots are fast to serialize/deserialize but can be large. Snapshot + update log balances storage size with recovery speed.

---

## Recommended Default

**Default:** Periodic Yjs snapshots persisted by Laravel API (every N edits or timer-based)
**Reason:** Bounds recovery time; works with Laravel's existing storage infrastructure (database, S3).

---

## Risks Of Wrong Choice

No persistence loses all document state on server restart. Full snapshots only creates large storage for long-lived documents. Update-only persistence (no snapshots) makes cold-start recovery slow.

---

## Related Rules

Implement Periodic Snapshots for Bounded Recovery Time

---

## Related Skills

Implement Collaborative Editing with Yjs/CRDT

---

---

## Yjs Garbage Collection Strategy

---

## Decision Context

When and how to run Yjs garbage collection to compact tombstones.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Document experiences frequent edits (1+ per second)?
↓
YES → Session expected to last hours?
    ↓
    YES → **Periodic GC during low activity** — prevent unbounded tombstone growth
    NO → **GC after session ends** — compact when document is idle
NO → Document is short-lived (minutes)?
    ↓
    YES → **No GC needed** — session ends before tombstones accumulate
    NO → **Periodic GC** — balance performance with memory usage

---

## Rationale

CRDT tombstones (deleted characters) accumulate over time, growing the document state. Without GC, memory usage grows linearly with total edits, not current document size. GC compacts tombstones but is CPU-intensive.

---

## Recommended Default

**Default:** Enable Yjs GC with periodic compaction during low-activity periods
**Reason:** Prevents unbounded memory growth; scheduling during low activity avoids impacting user editing experience.

---

## Risks Of Wrong Choice

No GC causes unbounded memory growth in long-lived documents. GC during high-activity periods causes editing latency spikes.

---

## Related Rules

Enable Yjs Garbage Collection for Long-Lived Documents

---

## Related Skills

Implement Collaborative Editing with Yjs/CRDT
