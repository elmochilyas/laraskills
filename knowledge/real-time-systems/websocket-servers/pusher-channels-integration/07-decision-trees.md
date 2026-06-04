# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Pusher Channels Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* Broadcast Platform Selection: Pusher vs Reverb vs Ably
* Environment Isolation Strategy: Separate Apps vs Shared
* Webhook Configuration and Security

---

# Architecture-Level Decision Trees

---

## Broadcast Platform Selection: Pusher vs Reverb vs Ably

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel supports Pusher, Reverb, and Ably as broadcasting backends. Each has different pricing models, operational requirements, and feature sets. The engineer must choose the platform for their specific needs.

---

## Decision Criteria

* performance considerations — managed edge network vs self-hosted latency
* architectural considerations — infrastructure requirements; deployment model
* security considerations — data sovereignty; compliance certifications
* maintainability considerations — operational burden vs vendor dependency

---

## Decision Tree

Which broadcasting platform should be selected?
↓
Is the application a prototype/MVP with low traffic?
YES → [Pusher Channels — free tier: 200 connections, 200K messages/day]
NO → Is cost control at scale the primary concern?
    YES → [Reverb — self-hosted; fixed server costs]
    NO → Is guaranteed delivery or enterprise compliance required?
        YES → [Ably — at-least-once delivery; SOC 2, HIPAA]
        NO → [Pusher — managed; Laravel-native; good balance]
↓
Does the team have DevOps expertise for self-hosting?
YES → [Reverb viable — operational capability exists]
NO → [Use managed service: Pusher or Ably]

---

## Rationale

Pusher is the most straightforward managed option with a generous free tier and native Laravel integration. Reverb is the most cost-effective at scale but requires operational expertise for self-hosting. Ably is the enterprise choice with delivery guarantees and compliance certifications. The decision should consider both current needs and projected scale. The Pusher protocol compatibility across all three provides a safety net—switching between them is primarily a configuration change.

---

## Recommended Default

**Default:** Pusher for managed simplicity; Reverb for self-hosted cost control at scale
**Reason:** Pusher is the simplest path to real-time features; Reverb is the most common self-hosted alternative

---

## Risks Of Wrong Choice

Pusher at 10k+ connections costs $500+/month—self-hosting is cheaper. Ably for simple broadcasting is over-engineered and expensive. Reverb without operational expertise causes reliability issues.

---

## Related Rules

Always Consider Reverb as a Cost-Effective Alternative at Scale (05-rules.md)

---

## Related Skills

Integrate Pusher Channels for Managed WebSocket Service (06-skills.md)

---

## Environment Isolation Strategy: Separate Apps vs Shared

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Using the same Pusher app credentials across development, staging, and production causes cross-environment message leakage—staging events reach production clients and vice versa. Each environment should have isolated credentials.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — number of Pusher apps to manage
* security considerations — compromised dev credentials cannot affect production
* maintainability considerations — per-environment config management

---

## Decision Tree

How should Pusher environments be isolated?
↓
Are there distinct development, staging, and production environments?
YES → [Separate Pusher apps per environment with unique credentials]
NO → Is there only a production environment?
    YES → [Single Pusher app — no isolation needed]
    NO → Are there multiple branches sharing a single environment?
        YES → [Separate Pusher apps or use channel prefixes]
        NO → [Separate Pusher apps per environment]

---

## Rationale

Each deployment environment must have its own Pusher app with unique credentials. This prevents cross-environment message leakage (staging events appearing in production) and ensures that a compromised development credential cannot access the production broadcast system. The cost is minimal—Pusher allows multiple apps per account. Environment-specific `.env` files (`BROADCAST_CONNECTION=pusher`, `PUSHER_APP_ID=...`) keep configuration clean and auditable.

---

## Recommended Default

**Default:** Separate Pusher apps per environment (dev, staging, production) with unique credentials in each `.env`
**Reason:** Prevents cross-environment message leakage; limits blast radius of credential compromise

---

## Risks Of Wrong Choice

Shared credentials cause staging events to leak to production users. Compromised development credentials grant access to the production broadcasting system.

---

## Related Rules

Always Set `BROADCAST_CONNECTION=pusher` Per Environment (05-rules.md)

---

## Related Skills

Integrate Pusher Channels for Managed WebSocket Service (06-skills.md)

---

## Webhook Configuration and Security

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Pusher webhooks notify the application of presence events, channel lifecycle, and client events. Without signature verification, an attacker can POST fake webhook events, triggering incorrect business logic.

---

## Decision Criteria

* performance considerations — webhook processing overhead
* architectural considerations — webhook endpoint availability and reliability
* security considerations — HMAC signature verification is critical
* maintainability considerations — webhook event type handling

---

## Decision Tree

How should Pusher webhooks be configured and secured?
↓
Are presence events or channel lifecycle events needed?
YES → Are webhooks configured with HMAC signature verification?
    YES → [Valid configuration — process verified webhook events]
    NO → [Add HMAC signature verification: use PusherWebhook class]
NO → Are client event webhooks needed?
    YES → [Configure client event webhooks with signature verification]
    NO → [No webhooks needed — disable in Pusher dashboard]
↓
Which event types should be processed?
Presence → [channel_occupied, channel_vacated, member_added, member_removed]
Client events → [client_event with specific event names]
Channel lifecycle → [channel_exists, channel_removed]

---

## Rationale

HMAC signature verification is mandatory for all Pusher webhook endpoints. Without it, anyone who knows the webhook URL can POST fake events. The `PusherWebhook` class handles verification automatically. Only enable the webhook event types that the application actually uses—enabling all types creates unnecessary processing load and security surface area. For most applications, presence webhooks (`member_added`, `member_removed`) and channel occupancy events (`channel_occupied`, `channel_vacated`) are sufficient.

---

## Recommended Default

**Default:** Enable presence and channel lifecycle webhooks with HMAC verification; disable client event webhooks unless needed
**Reason:** Presence webhooks support common features; client event webhooks are rarely needed server-side

---

## Risks Of Wrong Choice

No signature verification allows forged webhook events to trigger incorrect business logic. Missing presence webhooks forces polling for user state changes.

---

## Related Rules

Always Configure Pusher Webhooks with Signature Verification (05-rules.md)

---

## Related Skills

Integrate Pusher Channels for Managed WebSocket Service (06-skills.md)
