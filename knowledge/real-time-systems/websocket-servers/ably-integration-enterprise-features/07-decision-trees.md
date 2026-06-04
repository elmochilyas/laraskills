# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Ably Integration & Enterprise Features
**Generated:** 2026-06-03

---

# Decision Inventory

* Broadcast Platform Selection: Ably vs Pusher vs Reverb
* Authentication Strategy: Token Auth vs API Key Exposure
* Message Retention Strategy: TTL-Based vs Unlimited
* Client Connection Protocol: Pusher Protocol vs Ably SDK

---

# Architecture-Level Decision Trees

---

## Broadcast Platform Selection: Ably vs Pusher vs Reverb

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel supports multiple broadcasting backends: self-hosted Reverb, managed Pusher, and managed Ably. Each has different pricing, features, and operational profiles. The engineer must choose the platform that matches their requirements.

---

## Decision Criteria

* performance considerations — edge network coverage; guaranteed delivery overhead
* architectural considerations — self-hosted vs managed; deployment model
* security considerations — compliance certifications (SOC 2, HIPAA)
* maintainability considerations — operational burden vs vendor lock-in

---

## Decision Tree

Which broadcasting platform should be used?
↓
Is guaranteed delivery (at-least-once) required for compliance or reliability?
YES → [Ably — only first-party driver with at-least-once delivery]
NO → Is global edge distribution needed with minimal latency?
    YES → [Ably (205+ PoPs) or Pusher (edge network)]
    NO → Is self-hosting preferred for cost control or data sovereignty?
        YES → [Reverb — self-hosted; compatible with Pusher protocol]
        NO → [Pusher — managed; simplest setup; generous free tier]

---

## Rationale

Ably is the right choice when delivery guarantees, global edge distribution, or enterprise compliance (SOC 2, HIPAA, GDPR) are required. Pusher is the simplest managed option with the best Laravel-native integration and a generous free tier (200K messages/day). Reverb is the best choice for cost-conscious self-hosted deployments where operational expertise is available. The Pusher protocol compatibility across all three means migration is a configuration change, reducing lock-in risk.

---

## Recommended Default

**Default:** Reverb for self-hosted/cost-sensitive; Pusher for simple managed; Ably for enterprise/global/guaranteed delivery
**Reason:** Match the platform to the primary requirement; protocol compatibility preserves migration options

---

## Risks Of Wrong Choice

Ably overkill for simple broadcasting (higher cost at scale). Reverb without operational expertise leads to outages. Pusher at extreme scale costs more than self-hosting.

---

## Related Rules

Never Use Laravel's Generic Broadcast Interface for Advanced Ably Features (05-rules.md)

---

## Related Skills

Integrate Ably for Enterprise Real-Time Features (06-skills.md)

---

## Authentication Strategy: Token Auth vs API Key Exposure

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

The Ably API key provides full access to the Ably application. If exposed in client-side code, anyone can publish, subscribe, and manage channels. Token authentication generates ephemeral, scoped tokens for client connections.

---

## Decision Criteria

* performance considerations — token generation overhead per connection
* architectural considerations — token renewal and refresh flow
* security considerations — API key exposure is a critical risk
* maintainability considerations — token lifecycle management

---

## Decision Tree

How should Ably client connections authenticate?
↓
Is this a client-side connection (browser, mobile app)?
YES → [Token authentication: server generates ephemeral token with scoped capabilities]
NO → Is this a server-to-server integration?
    YES → [API key acceptable — never leaves server infrastructure]
    NO → [Token authentication — any client-facing connection]
↓
Does the token need fine-grained channel permissions?
YES → [Scope token capabilities per channel: chat.* subscribe, publish]
NO → [Single capability for all channels — simpler, less granular]

---

## Rationale

The Ably API key (`ABLY_KEY`) must never be exposed in client-side code. Token authentication generates ephemeral `TokenRequest` objects server-side with specific capabilities per channel (e.g., `chat.*: subscribe, publish, presence`). These tokens are short-lived and can be revoked without rotating the API key. The capability scope should follow the principle of least privilege: a chat client only needs `subscribe` and `publish` on `chat:*`, not admin capabilities.

---

## Recommended Default

**Default:** Server-generated Ably token requests with scoped capabilities for all client connections
**Reason:** Prevents API key exposure; enables fine-grained channel-level permissions; tokens are revocable

---

## Risks Of Wrong Choice

API key exposure in client code gives attackers full Ably API access. No token scoping allows clients to access channels they shouldn't.

---

## Related Rules

Never Expose the Ably API Key in Client-Side Code (05-rules.md)

---

## Related Skills

Integrate Ably for Enterprise Real-Time Features (06-skills.md)

---

## Message Retention Strategy: TTL-Based vs Unlimited

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Ably stores messages on channels for history/replay. Without retention limits, storage grows unbounded, causing escalating costs and performance degradation.

---

## Decision Criteria

* performance considerations — storage I/O for message persistence
* architectural considerations — retention requirements per channel
* security considerations — compliance-mandated retention periods
* maintainability considerations — storage growth management

---

## Decision Tree

How long should messages be retained?
↓
Does the channel require message history for audit or compliance?
YES → [Set retention per channel: persist for compliance-required duration]
NO → Does the channel require last-message replay for UX?
    YES → [Persist last N messages only: e.g., persistLast 10]
    NO → [No retention — messages are ephemeral; no storage cost]
↓
Is the retention setting applied per channel pattern?
YES → [Configure channel rules: chat.* persist 3600, orders.* persist 86400]
NO → [Apply default retention globally — less granular, simpler]

---

## Rationale

Ably's `persistLast` (keep last N messages) is ideal for UX features like "show last 10 chat messages on join." `persist` (time-based retention) is for compliance or long-term history. Per-channel rules provide fine-grained control: ephemeral channels get no retention, UX channels get `persistLast`, compliance channels get time-based `persist`. Default retention should be `none` to avoid surprise costs, with explicit retention configured only where needed.

---

## Recommended Default

**Default:** No retention by default; `persistLast: 10` for chat/UX channels; time-based `persist` only where compliance requires
**Reason:** Zero storage cost by default; targeted retention only where needed

---

## Risks Of Wrong Choice

Unlimited retention causes unbounded storage costs. No retention on channels needing history breaks UX features on reconnection.

---

## Related Rules

Always Configure Message Retention Limits (05-rules.md)

---

## Related Skills

Integrate Ably for Enterprise Real-Time Features (06-skills.md)

---

## Client Connection Protocol: Pusher Protocol vs Ably SDK

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Ably supports both the Pusher protocol (compatible with Laravel Echo) and its native SDK with access to enterprise features (Spaces, history, exactly-once). The engineer must choose the protocol that matches their feature requirements.

---

## Decision Criteria

* performance considerations — protocol overhead differences
* architectural considerations — Laravel Echo compatibility
* security considerations — feature availability impact on architecture
* maintainability considerations — SDK vs protocol abstraction

---

## Decision Tree

Which protocol should client connections use?
↓
Are Ably enterprise features needed (Spaces, history, exactly-once)?
YES → [Ably SDK — only the SDK exposes enterprise features]
NO → Is Laravel Echo used on the frontend?
    YES → [Pusher protocol mode — Echo compatibility with pusher-js]
    NO → [Ably SDK — direct access to all Ably features]
↓
Is this a new project or migration from Pusher/Reverb?
New project → [Ably SDK — more features; avoid Echo if possible]
Migration → [Pusher protocol — no client-side changes needed]

---

## Rationale

The Pusher protocol provides Echo compatibility, meaning the frontend code (Echo + pusher-js) works unchanged whether the backend is Reverb, Pusher, or Soketi. Ably supports this mode for backward compatibility. However, Ably's enterprise features (Spaces for multi-user cursor sync, exactly-once delivery, message history) are only available through the native Ably SDK. New projects targeting Ably should use the SDK directly for maximum feature access. Migrations from Pusher/Reverb should use the Pusher protocol to minimize client-side changes.

---

## Recommended Default

**Default:** Pusher protocol for Echo-based frontends; Ably SDK for new projects using enterprise features
**Reason:** Echo compatibility simplifies migration; SDK access unlocks Ably's unique differentiators

---

## Risks Of Wrong Choice

Pusher protocol mode misses Ably's enterprise features. Ably SDK requires more code than Echo's simple API for basic broadcasting.

---

## Related Rules

Never Use Laravel's Generic Broadcast Interface for Advanced Ably Features (05-rules.md)

---

## Related Skills

Integrate Ably for Enterprise Real-Time Features (06-skills.md)
