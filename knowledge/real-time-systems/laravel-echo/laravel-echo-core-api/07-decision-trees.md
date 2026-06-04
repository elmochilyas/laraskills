# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Client-Side Subscriptions (Echo)
**Knowledge Unit:** Laravel Echo Core API
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Echo broadcaster: reverb vs pusher vs ably | architectural |
| 2 | Echo instance: singleton vs per-component | architectural |
| 3 | Channel cleanup strategy | performance |

---

# Architecture-Level Decision Trees

---

## Echo Broadcaster Selection

---

## Decision Context

Which broadcaster connector to configure Echo with based on the WebSocket backend.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Backend is self-hosted Reverb?
↓
YES → **broadcaster: 'reverb'** (uses pusher-js, Pusher protocol)
NO → Backend is managed Pusher?
    ↓
    YES → **broadcaster: 'pusher'** (uses pusher-js)
    NO → Backend is managed Ably?
        ↓
        YES → **broadcaster: 'ably'** (uses ably-js SDK or pusher-js)
        NO → Backend is Soketi?
            ↓
            YES → **broadcaster: 'pusher'** (Pusher protocol compatible)

---

## Rationale

Echo's broadcaster setting must match the WebSocket backend's protocol. Reverb, Pusher, and Soketi all use the Pusher protocol and require `pusher-js`. Ably can use either its own SDK or the Pusher protocol compatibility layer.

---

## Recommended Default

**Default:** `broadcaster: 'reverb'`
**Reason:** Since Reverb became the default Laravel broadcasting backend, this is the correct setting for most new Laravel applications.

---

## Risks Of Wrong Choice

Mismatched broadcaster causes silent connection failures. Using 'pusher' for Reverb works (same protocol) but 'reverb' is more explicit.

---

## Related Rules

Configure authEndpoint for Private Channel Support, Set forceTLS: true in Production

---

## Related Skills

Configure Echo for Frontend Subscriptions

---

---

## Singleton vs Per-Component Echo Instance

---

## Decision Context

Whether to create one global Echo instance or instantiate Echo per component.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Multiple components on the same page need real-time subscriptions?
↓
YES → **Singleton** — single WebSocket connection shared across all subscriptions
NO → Single-page component with isolated concern?
    ↓
    YES → Could still use singleton; dependency-inject or global
    NO → **Singleton always**

---

## Rationale

Echo creates a single WebSocket connection shared across all channels and subscriptions. Creating multiple Echo instances opens multiple WebSocket connections to the same server, wasting resources and potentially exceeding connection limits.

---

## Recommended Default

**Default:** Global singleton Echo instance
**Reason:** Single WebSocket connection per page; efficient resource usage; automatic socket ID propagation for `toOthers()`.

---

## Risks Of Wrong Choice

Multiple Echo instances waste connections, duplicate auth requests, and defeat automatic socket ID header propagation.

---

## Related Rules

Never Create Multiple Echo Instances

---

## Related Skills

Configure Echo for Frontend Subscriptions

---

---

## Channel Cleanup Strategy

---

## Decision Context

How and when to unsubscribe from Echo channels to prevent memory leaks.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Component using Echo subscriptions will unmount during navigation?
↓
YES → Using framework hooks (React/Vue/Svelte)?
    ↓
    YES → **Use `leave()` or `leaveChannel()` in cleanup hook**
    NO → Vanilla JS or jQuery?
        ↓
        YES → **Track subscriptions; call `leave()` on route change or destroy**
NO → Subscription is global/permanent (layout-level)?
    ↓
    YES → No cleanup needed on navigation; cleanup on full page unload

---

## Rationale

Each `.listen()` callback is registered in memory. If components mount/unmount without calling `leave()`, callbacks accumulate, consuming memory and potentially processing events for unmounted components.

---

## Recommended Default

**Default:** Call `Echo.leave(channelName)` in component unmount lifecycle
**Reason:** Prevents callback accumulation; framework hooks should handle this automatically.

---

## Risks Of Wrong Choice

Memory leaks from accumulated callbacks; stale event handlers processing events for unmounted components.

---

## Related Rules

Always Call leave() on Component Unmount

---

## Related Skills

Configure Echo for Frontend Subscriptions
