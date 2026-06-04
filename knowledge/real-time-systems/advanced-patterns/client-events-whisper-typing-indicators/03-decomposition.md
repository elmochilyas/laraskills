# Decomposition: Client Events Whisper Typing Indicators

## Topic Overview
Client events (also called "whispers" or "client events") enable direct peer-to-peer communication between WebSocket-connected clients without involving the Laravel server. Events are sent from the client via Echo's `whisper()` method and received by other clients subscribed to the same channel. The Laravel server never processes these events—they flow directly through the WebSocket server (Reverb/Pusher). Client events are commonly used for typing indicators, cursor position sharing, and o...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K31-client-events-whisper-typing-indicators/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Client Events Whisper Typing Indicators
- **Purpose:** Client events (also called "whispers" or "client events") enable direct peer-to-peer communication between WebSocket-connected clients without involving the Laravel server. Events are sent from the client via Echo's `whisper()` method and received by other clients subscribed to the same channel. The Laravel server never processes these events—they flow directly through the WebSocket server (Reverb/Pusher). Client events are commonly used for typing indicators, cursor position sharing, and o...
- **Difficulty:** Intermediate
- **Dependencies:
  - K11: Public/Private/Presence Channel Patterns
  - K09: Laravel Echo Core API
  - K13: Presence Channels & Online User Tracking
  - K22: Collaborative Editing with Yjs/CRDT

## Dependency Graph
**Depends on:**
  - K11: Public/Private/Presence Channel Patterns
  - K09: Laravel Echo Core API
  - K13: Presence Channels & Online User Tracking
  - K22: Collaborative Editing with Yjs/CRDT

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Typing indicators**: `.whisper('typing', { isTyping: true })` and `listenForWhisper('typing', callback)`**Cursor sharing**: Broadcast cursor position changes for collaborative editing**Ephemeral notifications**: Transient status updates that don't need server persistence**High-frequency events**: Any rapid-fire signaling that would overwhelm the server queue**`ShouldBroadcastNow` equivalent**: Client events bypass the queue inherently (no queue involvement)**No server processing**: Client events never hit Laravel—zero server-side processing cost**Prefix convention**: `client-` prefix prevents collisions with server-emitted events and makes event origins explicit**Sender exclusion**: Automatic `toOthers()` behavior—the whisper originator never receives their own event**No server-side validation**: Malformed or malicious payloads reach other clients unchecked**No persistence**: Client events are never stored; offline clients miss them**No reliability guarantees**: Fire-and-forget delivery; lost messages are not retried**Bandwidth consumption**: High-frequency client events (mouse moves, every keystroke) consume WebSocket bandwidth**No authentication at event level**: Any client on the channel can send and receive client eventsClient events bypass the queue entirely—no queue worker overheadHigh-frequency events (cursor tracking, typing indicators) should be throttled client-side (e.g., debounce 50-100ms)Each client event generates a WebSocket message to all other channel subscribers; O(n) fan-out costPayload size directly impacts WebSocket bandwidth—keep payloads minimalFor presence channels, client events fan out to all members; channel size directly impacts trafficImplement client-side throttling for typing indicators (send at most once per 2-3 seconds, not on every keystroke)For cursor tracking, batch position updates and send at fixed intervals (30-60ms)Validate or sanitize client event payloads at the receiving client sideMonitor client event volume via Reverb/WSS metrics to detect abuseConsider rate limiting client events per connection in Reverb config (`max_messages_per_second`)Never trust client event data; always validate on the receiving clientSending client events on public channels (any client can impersonate any user)Not throttling typing indicators, flooding the WebSocket with per-character eventsAssuming client events are secure because they bypass the server (they are not authenticated per-message)Using client events for data that needs persistence or reliability guaranteesForgetting to prefix event names with `client-` when using raw WebSocket API (Echo handles this)**Client event flood**: Malicious or buggy client sends thousands of events per second, choking the WebSocket connection**Event interception**: Any subscriber can listen to all client events on a channel (confidential data in client events is visible)**Sender exclusion failure**: Race condition causes sender to receive their own event under rare timing conditions**Pusher config issue**: Client events not enabled in Pusher Channels dashboard; events silently droppedChat applications: "User is typing..." indicatorsCollaborative editing: Shared cursor positions, selectionsWhiteboard applications: Real-time drawing strokesForm collaboration: "User is filling this field"Social features: Reactions, emoji bursts, ephemeral animationsK11: Public/Private/Presence Channel PatternsK09: Laravel Echo Core APIK13: Presence Channels & Online User TrackingK22: Collaborative Editing with Yjs/CRDT

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization