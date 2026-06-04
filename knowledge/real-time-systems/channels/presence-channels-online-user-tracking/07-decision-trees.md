# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Presence Channels & Online User Tracking
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Presence data exposure | security |
| 2 | Presence channel monitoring approach | performance |

---

# Architecture-Level Decision Trees

---

## Presence Data Exposure

---

## Decision Context

What user data to return from the presence channel auth callback.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Presence callback returns data visible to all channel members?
↓
YES → Data includes email, phone, role, or other PII?
    ↓
    YES → **Remove sensitive fields** — return only `id`, `name`, `avatar_url`
    NO → Data includes internal user IDs or system identifiers?
        ↓
        YES → **Evaluate if these should be exposed** — prefer opaque identifiers
        NO → Current payload minimal?
            ↓
            YES → Acceptable
            NO → **Trim to minimum**
NO → Callback returns `true` instead of array?
    ↓
    YES → **BUG** — must return array with at least `id` field

---

## Rationale

All presence channel subscribers can see every member's returned user data. This is a fundamental protocol behavior. Including PII (email, phone) in presence data exposes it to every other subscriber.

---

## Recommended Default

**Default:** Return only `['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url]`
**Reason:** Provides sufficient identity for social features without exposing sensitive personal information.

---

## Risks Of Wrong Choice

Returning the entire User model exposes PII to all channel members. Insufficient data (no `id` field) breaks the presence protocol.

---

## Related Rules

Always Return Minimal User Data from Presence Callbacks

---

## Related Skills

Track Online Users with Presence Channels

---

---

## Presence Channel Monitoring

---

## Decision Context

How to monitor presence channel health and ghost member accumulation.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Presence channels in use for more than 1,000 members?
↓
YES → Ghost member ratio > 5% of total members?
    ↓
    YES → **Investigate cleanup tuning** — reduce pulse interval, verify TTL
    NO → Monitor member count trends for abnormal growth
NO → Ghost member cleanup mechanism configured?
    ↓
    YES → Monitor ghost ratio as dashboard metric
    NO → **Configure TTL and pulse/prune** — critical for production

---

## Rationale

Ghost members — stale presence entries from abrupt disconnections — accumulate over time and inflate member counts. Monitoring the ghost ratio (ghost members / total members) detects cleanup issues and connection reliability problems.

---

## Recommended Default

**Default:** Monitor presence channel member count + ghost ratio via Laravel Pulse
**Reason:** Detects cleanup failures and connection anomalies before they affect user experience.

---

## Risks Of Wrong Choice

Ignoring ghost accumulation leads to inflated user counts, degraded UX ("X users online" is wrong), and unbounded Redis memory growth.

---

## Related Rules

Always Configure Ghost Member Cleanup, Monitor Ghost Member Ratio

---

## Related Skills

Clean Up Ghost Members in Presence Channels
