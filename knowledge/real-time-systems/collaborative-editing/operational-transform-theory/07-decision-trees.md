# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Collaborative Editing
**Knowledge Unit:** Operational Transform Theory
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | OT vs CRDT for collaborative editing | architectural |
| 2 | Custom OT implementation vs proven library | maintainability |

---

# Architecture-Level Decision Trees

---

## OT vs CRDT

---

## Decision Context

Choosing between Operational Transformation and CRDTs for real-time collaborative editing.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Starting a new collaborative editing project?
↓
YES → Need offline-first or peer-to-peer editing?
    ↓
    YES → **CRDT (Yjs/Automerge)** — works offline, converges without central server
    NO → Need strong consistency guarantees?
        ↓
        YES → Need central server for other reasons anyway?
            ↓
            YES → **OT** possible; still prefer CRDT for new projects
            NO → **CRDT** — simpler, more mature ecosystem
NO → Existing OT infrastructure (ShareDB, Google Docs derivatives)?
    ↓
    YES → **Stick with OT** — migration cost likely exceeds benefits
    NO → Need rich text with complex formatting?
        ↓
        YES → **CRDT** — OT transform functions for rich text are intractable
        NO → Plain text editing only?
            ↓
            YES → **OT** viable but **CRDT still preferred**

---

## Rationale

The 2026 consensus is that CRDTs have largely superseded OT for new projects. Yjs processes 26K-156K ops/sec, supports rich text via ProseMirror/Monaco bindings, and works offline and peer-to-peer. OT remains valid for server-authoritative architectures with existing infrastructure.

---

## Recommended Default

**Default:** CRDTs (Yjs) for all new collaborative editing projects
**Reason:** Simpler deployment (no central transform server), offline support, rich text capable, larger ecosystem.

---

## Risks Of Wrong Choice

OT for new projects adds central server dependency and transform complexity. CRDTs for plain-text-only server-authoritative systems may add unnecessary complexity.

---

## Related Rules

Use Proven Libraries, Not Custom Implementations

---

## Related Skills

Implement Collaborative Editing with Yjs/CRDT, Understand Operational Transform Theory

---

---

## Custom OT vs Proven Library

---

## Decision Context

Whether to implement OT transforms from scratch or use an existing library.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Need custom operation types beyond insert/delete?
↓
YES → Have resources for property-based testing (QuickCheck)?
    ↓
    YES → Consider custom implementation, but prefer extending a library
    NO → **Use proven library** — ShareDB, Google Docs OT
NO → Plain text editing?
    ↓
    YES → **Use proven library** — simpler than custom
    NO → **Use proven library**

---

## Rationale

OT transform functions are notoriously difficult to implement correctly. Bugs in transform functions cause document divergence — all users see different states. Property-based testing is required to verify convergence, and even then edge cases exist.

---

## Recommended Default

**Default:** Use proven library (ShareDB, Yjs, or Automerge)
**Reason:** Transform function bugs are catastrophic and hard to detect; established libraries have been battle-tested at scale.

---

## Risks Of Wrong Choice

Custom OT implementation without property-based testing almost guarantees undetected divergence bugs.

---

## Related Rules

Never Implement Custom OT Without Property-Based Testing

---

## Related Skills

Implement Collaborative Editing with Yjs/CRDT
