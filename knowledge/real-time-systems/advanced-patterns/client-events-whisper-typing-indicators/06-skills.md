# Skill: Use Client Events for Whisper and Typing Indicators

## Purpose
Implement client-to-client events (whispers) using Echo's `whisper()` for ephemeral, high-frequency signaling like typing indicators and cursor sharing without server-side processing.

## When To Use
- Typing indicators in chat applications
- Cursor position sharing in collaborative editing
- Ephemeral notifications that don't need persistence
- High-frequency signaling that would overwhelm the server queue
- Features where `ShouldBroadcastNow` is too slow

## When NOT To Use
- Data that needs persistence or reliability guarantees
- Events requiring server-side validation or transformation
- Confidential data (any channel subscriber can listen)
- Public channels (any client can impersonate any user)

## Prerequisites
- Echo configured on the frontend
- Private or presence channel subscription
- Reverb or Pusher with client events enabled

## Inputs
- Echo `whisper()` method with event name and payload
- Echo `listenForWhisper()` listener on receiving clients
- Client-side throttling logic (debounce/timer)

## Workflow
1. Subscribe to a private or presence channel via Echo
2. Send client events with `whisper('eventName', payload)` — Echo auto-prefixes `client-`
3. Receive client events with `listenForWhisper('eventName', callback)`
4. Implement client-side throttling: typing indicators max 1 per 2-3 seconds
5. Batch cursor updates at 30-60ms intervals instead of per-mousemove
6. Validate payloads on the receiving client before using data
7. Configure `REVERB_MAX_MESSAGES_PER_SECOND` in Reverb for server-side rate limit
8. Monitor client event volume via Reverb metrics

## Validation Checklist
- [ ] Client events used on private or presence channels only
- [ ] Sender does not receive their own client events
- [ ] Event names use Echo's `whisper()` (not manual `client-` prefix)
- [ ] Client-side throttling implemented for typing indicators
- [ ] Cursor position updates batched at 30-60ms intervals
- [ ] Receiving clients validate event payloads
- [ ] `REVERB_MAX_MESSAGES_PER_SECOND` configured in Reverb
- [ ] Client event volume monitored for abuse detection

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Client events never received | Using public channel | Switch to private or presence channel |
| Sender receives own events | Misunderstanding sender exclusion | Sender is automatically excluded — verify sender logic |
| Event name doubled (`client-client-`) | Manual `client-` prefix with Echo wrapper | Use `whisper('typing', data)` not `whisper('client-typing', data)` |
| WebSocket flooded with events | No client-side throttling | Debounce typing to max 1 per 2-3s, batch cursor at 30-60ms |
| Malformed payload causes client crash | No validation on receiving end | Validate payload before use |
| Client event abuse degrades channel | No rate limiting or monitoring | Set `REVERB_MAX_MESSAGES_PER_SECOND`, monitor volume |

## Decision Points
- **Typing throttle interval**: 2-3s is standard; shorter for real-time chat, longer for less interactive features
- **Cursor batch interval**: 30ms for smooth updates; 60ms for reduced message count on slower connections
- **Public vs private channels**: Always use private or presence — never public for client events

## Performance/Security Considerations
- Client events bypass the queue entirely — zero server-side processing cost
- Each client event fans out to all other subscribers (O(n) per event)
- No server-side validation — validate payloads on receiving client
- Never send sensitive data via client events
- `REVERB_MAX_MESSAGES_PER_SECOND` prevents per-connection abuse

## Related Rules (from 05-rules.md)
- Never Send Client Events on Public Channels
- Always Implement Client-Side Throttling for High-Frequency Events
- Never Send Sensitive Data Via Client Events
- Always Validate Client Event Payloads on the Receiving Client
- Always Use Echo's `whisper()` Method, Not Manual `client-` Prefix
- Always Monitor Client Event Volume for Abuse Detection

## Related Skills
- Integrate Yjs/CRDT for Collaborative Editing with Laravel
- Track Online Users with Presence Channels

## Success Criteria
- Typing indicators and cursor positions flow between clients without server-side processing
- Client events fire at throttled rates (typing ≤1/3s, cursor batched 30-60ms)
- Receiving clients validate payloads before rendering
- Client event volume stays within acceptable limits (Reverb metrics)
- No sensitive data transmitted through client events
