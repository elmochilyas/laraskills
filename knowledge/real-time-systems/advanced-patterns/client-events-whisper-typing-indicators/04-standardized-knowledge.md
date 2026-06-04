# Standardized Knowledge: Client Events (Whisper, Typing Indicators)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K31 |
| Knowledge Unit | Client Events (Whisper, Typing Indicators) |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Client events (also called "whispers") enable direct peer-to-peer communication between WebSocket-connected clients without involving the Laravel server. Events are sent via Echo's `whisper()` method and received by other clients subscribed to the same channel. The Laravel server never processes these events—they flow directly through the WebSocket server (Reverb/Pusher). Common uses include typing indicators, cursor position sharing, and other ephemeral, high-frequency signaling. The Pusher protocol requires client events to be prefixed with `client-`. Echo's `listenForWhisper()` and `whisper()` methods handle this prefix automatically.

## Core Concepts

A client event originates from a browser, travels to the WebSocket server, and is broadcast to all other subscribers on the same channel (excluding the sender). The server validates the event prefix and channel authorization but does not inspect or persist the event payload. This makes client events ideal for high-frequency, low-latency signaling where server-side processing would add unacceptable delay.

## When To Use

- Typing indicators in chat applications
- Cursor position sharing in collaborative editing
- Ephemeral notifications that don't need persistence
- High-frequency any signaling that would overwhelm the server queue
- Scenarios where `ShouldBroadcastNow` would be used but even queue bypass is too slow

## When NOT To Use

- Data that needs persistence or reliability guarantees
- Events requiring server-side validation or transformation
- Confidential data (any channel subscriber can listen to client events)
- Public channels (any client can impersonate any user)

## Best Practices (WHY)

- **Client-side throttling**: Typing indicators should send at most once per 2-3 seconds, not on every keystroke
- **Batch position updates**: For cursor tracking, send batched updates at fixed intervals (30-60ms)
- **Validate on receiving client**: Never trust client event payloads; validate on the receiving side
- **Monitor event volume**: Track client event throughput via Reverb metrics to detect abuse
- **Use private/presence channels**: Never send client events on public channels—no authentication at event level

## Architecture Guidelines

- Client events never hit the Laravel server—zero server-side processing cost
- The `client-` prefix prevents collisions with server-emitted events
- Automatic sender exclusion (equivalent to `toOthers()`) is built-in
- Fire-and-forget delivery: lost messages are not retried
- No authentication per-message—any subscriber on the channel can send and receive client events

## Performance Considerations

- Client events bypass the queue entirely—no queue worker overhead
- High-frequency events should be throttled client-side (debounce 50-100ms)
- Each client event generates a WebSocket message to all other subscribers; O(n) fan-out cost
- Payload size directly impacts WebSocket bandwidth—keep payloads minimal
- For presence channels, client events fan out to all members; channel size directly impacts traffic

## Security Considerations

- No server-side validation: malformed or malicious payloads reach other clients unchecked
- Any client on the channel can send and receive client events
- Client events on public channels allow any connected client to impersonate any user
- Consider rate limiting client events per connection in Reverb config (`max_messages_per_second`)
- Never trust client event data; always validate on the receiving client

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Sending client events on public channels | Convenience | Any client can impersonate users | Always use private or presence channels |
| No throttling on typing indicators | Per-character event emission | Floods WebSocket with thousands of messages | Debounce to max 1 event per 2-3 seconds |
| Assuming client events are secure | "Bypasses server" misconception | Confidential data in client events visible to all subscribers | Never send sensitive data via client events |
| Using client events for persistent data | Fire-and-forget nature | Data lost on disconnection | Use server events for persistence, client events for ephemeral |
| Manual `client-` prefix when using Echo | Raw WebSocket API usage | Double prefixing or missing prefix | Let Echo's `whisper()` handle the prefix |

## Anti-Patterns

- **Server replacement**: Using client events for all communication because it's faster—misses persistence, validation, and security
- **Unthrottled high-frequency events**: Sending cursor position on every mousemove event without debouncing
- **Client events on public channels**: No authentication means any connected client can listen and send

## Examples

```javascript
// Sending a typing indicator
Echo.private('chat.' + roomId)
    .whisper('typing', { isTyping: true })
    .listenForWhisper('typing', (e) => {
        if (e.isTyping) {
            showTypingIndicator(e.userId);
        } else {
            hideTypingIndicator(e.userId);
        }
    });

// With client-side throttling
let typingTimer;
function onTyping() {
    clearTimeout(typingTimer);
    Echo.private('chat.' + roomId).whisper('typing', { isTyping: true });
    typingTimer = setTimeout(() => {
        Echo.private('chat.' + roomId).whisper('typing', { isTyping: false });
    }, 3000);
}
```

## Related Topics

- K11: Public/Private/Presence Channel Patterns
- K09: Laravel Echo Core API
- K13: Presence Channels & Online User Tracking
- K22: Collaborative Editing with Yjs/CRDT

## AI Agent Notes

- The `whisper()` method automatically prepends `client-` to event names
- Sender exclusion is automatic—the sender never receives their own whisper
- Client events are not a substitute for server-side event broadcasting for critical data
- Reverb enables client events by default; Pusher requires enabling in dashboard settings

## Verification

- [ ] Client events work on private/presence channels (not public)
- [ ] Sender does not receive their own client events
- [ ] Event names are correctly prefixed with `client-`
- [ ] Client-side throttling is implemented for high-frequency events
- [ ] Receiving clients validate event payloads
- [ ] Client event volume is monitored for abuse detection
- [ ] `max_messages_per_second` is configured in Reverb
