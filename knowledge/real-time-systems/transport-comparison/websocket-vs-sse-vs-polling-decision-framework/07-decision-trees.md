# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Transport Comparison
**Knowledge Unit:** WebSocket vs SSE vs Polling Decision Framework
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Primary transport selection | architectural |
| 2 | Fallback strategy | architectural |

---

# Architecture-Level Decision Trees

---

## Primary Transport Selection

---

## Decision Context

Choosing the real-time transport protocol for an application feature.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is bidirectional communication needed (client can send to server)?
↓
YES → Need <50ms end-to-end latency for client messages?
    ↓
    YES → **WebSocket** — full-duplex, ~20ms latency
    NO → Can use SSE + POST combination?
        ↓
        YES → **SSE + POST** — simpler than WebSocket
        NO → **WebSocket**
NO → Need binary data streaming?
    ↓
    YES → **WebSocket** — binary frames
    NO → Target browsers support EventSource (96%+)?
        ↓
        YES → **SSE** — auto-reconnect, HTTP simple
        NO → Latency requirement < 2 seconds?
            ↓
            YES → **Long Polling**
            NO → **Short Polling**

---

## Rationale

The 2026 consensus is SSE for unidirectional server-to-client, WebSocket for bidirectional. SSE avoids WebSocket infrastructure complexity (sticky sessions, upgrade handshake, special ports). HTTP/2 adoption (70%+) removes SSE's 6-connection-per-domain limitation.

---

## Recommended Default

**Default:** SSE for server-to-client, WebSocket for bidirectional
**Reason:** SSE uses standard HTTP, auto-reconnects, works through any proxy. WebSocket only when bidirectional <50ms latency is required.

---

## Risks Of Wrong Choice

WebSocket everywhere adds unnecessary infrastructure complexity and cost. SSE for bidirectional requires workarounds. Long polling as default wastes resources.

---

## Related Rules

Default to SSE Unless Bidirectional is Required

---

## Related Skills

Implement SSE in Laravel, Integrate Laravel Wave SSE Package

---

---

## Fallback Strategy

---

## Decision Context

How to handle clients that don't support the primary transport.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Primary transport is WebSocket?
↓
YES → Target browsers include legacy (IE11, old mobile)?
    ↓
    YES → Need progressive enhancement?
        ↓
        YES → WebSocket → SSE → Long Polling fallback chain
        NO → **Long Polling fallback** for legacy
    NO → Modern browsers only?
        ↓
        YES → No fallback needed; WebSocket supports 98%+
        NO → **SSE fallback**
NO → Primary transport is SSE?
    ↓
    YES → Need IE11 support?
        ↓
        YES → **Long Polling fallback**
        NO → No fallback needed; EventSource 96%+ support

---

## Rationale

Progressive enhancement starts with WebSocket, falls back to SSE for environments without WebSocket support (corporate proxies), then Long Polling for legacy browsers. Most modern applications only need WebSocket + SSE fallback.

---

## Recommended Default

**Default:** WebSocket with SSE fallback for modern applications
**Reason:** 98%+ browser support for WebSocket; SSE fallback covers proxy-blocked environments; no legacy browser support maintenance.

---

## Risks Of Wrong Choice

No fallback strategy blocks users behind restrictive corporate proxies. Implementing all three transports adds maintenance burden for diminishing returns.

---

## Related Rules

Implement Progressive Enhancement for Transport Selection

---

## Related Skills

Implement SSE in Laravel
