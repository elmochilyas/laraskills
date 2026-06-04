# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Real-Time Notifications
**Knowledge Unit:** Real-Time Notifications (Broadcast + Database)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Dual-channel (database + broadcast) vs single channel | architectural |
| 2 | Broadcast vs database payload strategy | performance |

---

# Architecture-Level Decision Trees

---

## Dual-Channel vs Single Channel

---

## Decision Context

Whether to deliver notifications via broadcast only, database only, or both.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

User needs instant notification delivery when online?
↓
YES → User also needs to see past notifications when offline?
    ↓
    YES → **Dual-channel** — Return `['database', 'broadcast']` in `via()`
    NO → **Broadcast-only** — instant but fire-and-forget
NO → Notification is critical and must survive connectivity gaps?
    ↓
    YES → **Database-only** or **dual-channel** — persistent storage
    NO → **Database-only** — persistent, fetched on page load

---

## Rationale

Combining database + broadcast channels provides both instant delivery (broadcast) and persistent history (database). Broadcast-only notifications are lost if the user is offline. Database-only requires page refresh or polling for delivery.

---

## Recommended Default

**Default:** Dual-channel (`['database', 'broadcast']`)
**Reason:** Best of both worlds — instant delivery when online, persistent history when offline.

---

## Risks Of Wrong Choice

Broadcast-only loses notifications for offline users. Database-only defeats the real-time purpose.

---

## Related Rules

Combine Broadcast and Database Channels for Critical Notifications

---

## Related Skills

Implement Real-Time Notifications with Broadcast + Database

---

---

## Broadcast vs Database Payload Strategy

---

## Decision Context

How to structure notification data for broadcast vs database delivery.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Broadcast payload contains full notification content?
↓
YES → Content exceeds 1KB?
    ↓
    YES → **Minimize broadcast payload** — send ID + type + summary only
    NO → Content has sensitive details (PII, financial data)?
        ↓
        YES → **Minimize broadcast payload** — sensitive fields in database only
        NO → Full content in broadcast acceptable
NO → Database stores different data than broadcast?
    ↓
    YES → **Use separate methods** — `toBroadcast()` + `toDatabase()` independently
    NO → **Use `toArray()`** — same data for both channels

---

## Rationale

Broadcast payloads travel over WebSocket to every connected client. Keeping them minimal reduces bandwidth and serialization overhead. Database notifications can store full content since they're fetched on demand.

---

## Recommended Default

**Default:** Minimal broadcast payload (ID, type, summary) + full database payload
**Reason:** Broadcast travels over real-time channel to every client; database is fetched on demand.

---

## Risks Of Wrong Choice

Large broadcast payloads increase WebSocket bandwidth and slow delivery. Sensitive data in broadcast payloads exposes it to any client on the channel.

---

## Related Rules

Use Separate Formatting Methods for Broadcast and Database

---

## Related Skills

Implement Real-Time Notifications with Broadcast + Database
