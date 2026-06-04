# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Public/Private/Presence Channel Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Channel type selection (public vs private vs presence) | security |
| 2 | Presence vs private + status API | performance |

---

# Architecture-Level Decision Trees

---

## Channel Type Selection

---

## Decision Context

Which channel type to use for a given broadcast event based on data sensitivity and feature requirements.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Does the broadcast data contain user-specific or sensitive information?
↓
YES → Need real-time awareness of who else is subscribed?
    ↓
    YES → **Presence channel** — join/leave events, member list
    NO → **Private channel** — authorization required, no member tracking
NO → Is the data intentionally public (announcements, sports scores, public dashboards)?
    ↓
    YES → **Public channel** — no authorization needed
    NO → Default to **private channel**

---

## Rationale

Channel type is a security-first decision. Private channels enforce server-side authorization before allowing subscription. Public channels expose data to any connected WebSocket client, including those not authenticated.

---

## Recommended Default

**Default:** Private channel (`new PrivateChannel(...)`)
**Reason:** Applies least privilege; enforces authorization at subscription time; downgrade to public only when no authorization is needed.

---

## Risks Of Wrong Choice

Using public channels for user-specific data leaks information to unauthorized clients. Using private channels for truly public data adds unnecessary auth overhead.

---

## Related Rules

Always Apply Least Privilege When Choosing Channel Types, Never Broadcast Sensitive Data on Public Channels

---

## Related Skills

Select and Implement Channel Types, Authorize Private and Presence Channels in routes/channels.php

---

---

## Presence vs Private + Status API

---

## Decision Context

Whether to use presence channels or private channels with a separate online-status endpoint.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Need real-time join/leave notifications per-channel?
↓
YES → Channel has > 1,000 simultaneous members?
    ↓
    YES → **Private + status API** — presence fan-out is O(n) at scale
    NO → **Presence channel** — built-in join/leave awareness
NO → Only need to know if a specific user is online?
    ↓
    YES → **Private + status API** — simpler, less overhead
    NO → Need member list updated in real-time?
        ↓
        YES → **Presence channel**
        NO → **Private + status API**

---

## Rationale

Presence channels generate join/leave events to all members on every subscription change. At scale (10k+ members), this O(n) fan-out creates significant Redis write pressure and network traffic. Private channels combined with a REST endpoint for online status avoid this overhead.

---

## Recommended Default

**Default:** Private channel — upgrade to presence only when real-time member awareness is required
**Reason:** Presence channels add Redis writes and event fan-out overhead; most applications only need user-specific private subscriptions.

---

## Risks Of Wrong Choice

Using presence channels just for online status tracking wastes infrastructure resources. Using private channels when real-time collaboration features need member awareness requires building custom member tracking.

---

## Related Rules

Never Use Presence Channels When Private + API Status Suffices

---

## Related Skills

Track Online Users with Presence Channels
