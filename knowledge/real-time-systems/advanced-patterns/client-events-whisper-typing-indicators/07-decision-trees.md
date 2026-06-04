# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Client Events (Whisper, Typing Indicators)
**Generated:** 2026-06-03

---

# Decision Inventory

* Channel Type Selection for Client Events
* Client-Side Throttling Strategy
* Event Data Handling: Ephemeral vs Persistent

---

# Architecture-Level Decision Trees

---

## Channel Type Selection for Client Events

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Client events (whispers) can be sent on public, private, or presence channels. The channel type determines authentication requirements, who can listen, and the security model. Choosing incorrectly exposes the application to impersonation or data leakage.

---

## Decision Criteria

* performance considerations — auth overhead per channel type
* architectural considerations — presence channel member tracking requirements
* security considerations — public channels have no authentication for client events
* maintainability considerations — channel complexity and debugging

---

## Decision Tree

Which channel type should client events use?
↓
Is the event data non-sensitive and public by nature?
YES → Only if the application has no authenticated users?
    YES → [Public channel — but understand the risks]
    NO → [Private or Presence channel — never public for authenticated apps]
NO → Is the feature a typing indicator or ephemeral signal?
    YES → [Private channel — sufficient for typing indicators]
    NO → Does the feature need user awareness (who is connected)?
        YES → [Presence channel — enables user state tracking]
        NO → [Private channel — authenticated, no presence overhead]

---

## Rationale

Client events must never be sent on public channels in authenticated applications because any connected client can listen to and send client events on public channels—there is no authentication at the event level. Private channels provide authentication for channel membership but do not expose member lists. Presence channels add the `here` and `joining`/`leaving` events that enable features like "X is typing" with user identity. The choice between private and presence depends on whether the feature requires awareness of other members.

---

## Recommended Default

**Default:** Private channels for client events (typing indicators, basic signaling)
**Reason:** Authenticated but no presence overhead; sufficient for most client event use cases

---

## Risks Of Wrong Choice

Public channels allow any client to impersonate any user. Presence channels expose member lists, which may be undesirable for privacy-sensitive features.

---

## Related Rules

Never Send Client Events on Public Channels (05-rules.md)

---

## Related Skills

Use Client Events for Whisper and Typing Indicators (06-skills.md)

---

## Client-Side Throttling Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Without throttling, typing indicators fire on every keystroke (50+ messages/second from a single user). This floods the WebSocket server and fans out to all channel subscribers. The engineer must choose a throttling strategy that balances responsiveness with message volume.

---

## Decision Criteria

* performance considerations — O(n) fan-out cost per client event; total message volume
* architectural considerations — debounce vs throttle patterns
* security considerations — preventing client-side abuse
* maintainability considerations — throttle interval tuning

---

## Decision Tree

How should client events be throttled?
↓
Is the event a typing indicator or similar binary state?
YES → [Debounce with trailing edge: send on start, send stop after idle 3s]
NO → Is the event continuous (cursor position, scroll position)?
    YES → [Fixed-interval batching: collect and send every 30-60ms]
    NO → Is the event an explicit user action (click, reaction)?
        YES → [No throttling needed — user actions are self-limiting]
        NO → [Evaluate event frequency; apply debounce if > 1 event/s]

---

## Rationale

Different event types need different throttling strategies. Typing indicators are binary (typing/not typing) and benefit from a debounce pattern: send "typing: true" immediately, then send "typing: false" after a 3-second idle timeout. This keeps the server informed with minimal messages. Continuous events like cursor position should use fixed-interval batching (30-60ms) to avoid per-mousemove messages. The batching interval is a tradeoff: 30ms feels smooth, 60ms reduces total messages by half.

---

## Recommended Default

**Default:** Debounce typing indicators to 1 event per 3 seconds; batch cursor updates at 30ms intervals
**Reason:** Balances real-time feel with message volume reduction of 50-100x

---

## Risks Of Wrong Choice

No throttling generates thousands of messages per second, degrading server performance and consuming client bandwidth. Too-aggressive throttling makes the feature feel unresponsive.

---

## Related Rules

Always Implement Client-Side Throttling for High-Frequency Events (05-rules.md)

---

## Related Skills

Use Client Events for Whisper and Typing Indicators (06-skills.md)

---

## Event Data Handling: Ephemeral vs Persistent

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Client events are fire-and-forget: lost messages are never retried, and the server never stores them. Some use cases benefit from persistence (message history) while others are purely ephemeral. The engineer must decide whether client events are appropriate or if server-side events are needed.

---

## Decision Criteria

* performance considerations — zero server processing vs storage overhead
* architectural considerations — client events bypass the queue entirely
* security considerations — no server-side validation or access control
* maintainability considerations — debugging ephemeral events is harder

---

## Decision Tree

Should this data use client events or server-side events?
↓
Does the data need to survive a client disconnection?
YES → [Server-side events with broadcast — client events are fire-and-forget]
NO → Does the data need server-side validation or transformation?
    YES → [Server-side events — client events have no server processing]
    NO → Does the data need to be audited or logged on the server?
        YES → [Server-side events — client events have no server audit trail]
        NO → [Client events are appropriate — ephemeral, high-frequency signaling]

---

## Rationale

Client events are specifically designed for ephemeral, high-frequency signaling where delivery is best-effort and data loss is acceptable. Typing indicators and cursor positions are perfect fits: if a message is lost, the next one will arrive milliseconds later. Data that needs persistence (chat messages), validation (form submissions), or auditing (financial signals) must use server-side events that go through the broadcast pipeline with queue persistence and retry logic.

---

## Recommended Default

**Default:** Client events for ephemeral signaling only; server-side events for any data that matters
**Reason:** Client events have zero server overhead but zero delivery guarantees

---

## Risks Of Wrong Choice

Using client events for important data leads to silent data loss on disconnection. Using server-side events for ephemeral data wastes queue resources and adds unnecessary latency.

---

## Related Rules

Never Send Sensitive Data Via Client Events (05-rules.md)

---

## Related Skills

Use Client Events for Whisper and Typing Indicators (06-skills.md)
