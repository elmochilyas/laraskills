# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Client Events (Whisper, Typing Indicators)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Client events (also called "whispers" or "client events") enable direct peer-to-peer communication between WebSocket-connected clients without involving the Laravel server. Events are sent from the client via Echo's `whisper()` method and received by other clients subscribed to the same channel. The Laravel server never processes these events—they flow directly through the WebSocket server (Reverb/Pusher). Client events are commonly used for typing indicators, cursor position sharing, and other ephemeral, high-frequency signaling. The Pusher protocol requires client events to be prefixed with `client-`. Echo's `listenForWhisper()` and `whisper()` methods handle this prefix automatically. Client events must be explicitly enabled in Pusher Channels dashboard; Reverb enables them by default.

## Core Concepts
A client event originates from a browser, travels to the WebSocket server, and is broadcast to all other subscribers on the same channel (excluding the sender). The server validates the event prefix (`client-`) and channel authorization but does not inspect or persist the event payload. This makes client events ideal for high-frequency, low-latency signaling where server-side processing would add unacceptable delay or overhead.

## Mental Models
Client events are "backchannel" messages between browsers. The WebSocket server is a passive switchboard—it receives a message from one client and relays it to others without looking at the content. The Laravel application is completely bypassed.

## Internal Mechanics
Echo exposes `whisper(eventName, data)` on channel instances. This calls the underlying connector's `whisper` method, which sends a Pusher protocol `client-{eventName}` event. The WebSocket server receives the event, validates that the channel supports client events (for Pusher, must be enabled in dashboard), prepends `client-` to the event name (if not already present), and broadcasts to all other subscribed connections on that channel. The sender is excluded automatically. Receiving clients use `listenForWhisper(eventName, callback)` to listen for these events.

## Patterns
- **Typing indicators**: `.whisper('typing', { isTyping: true })` and `listenForWhisper('typing', callback)`
- **Cursor sharing**: Broadcast cursor position changes for collaborative editing
- **Ephemeral notifications**: Transient status updates that don't need server persistence
- **High-frequency events**: Any rapid-fire signaling that would overwhelm the server queue
- **`ShouldBroadcastNow` equivalent**: Client events bypass the queue inherently (no queue involvement)

## Architectural Decisions
- **No server processing**: Client events never hit Laravel—zero server-side processing cost
- **Prefix convention**: `client-` prefix prevents collisions with server-emitted events and makes event origins explicit
- **Sender exclusion**: Automatic `toOthers()` behavior—the whisper originator never receives their own event

## Tradeoffs
- **No server-side validation**: Malformed or malicious payloads reach other clients unchecked
- **No persistence**: Client events are never stored; offline clients miss them
- **No reliability guarantees**: Fire-and-forget delivery; lost messages are not retried
- **Bandwidth consumption**: High-frequency client events (mouse moves, every keystroke) consume WebSocket bandwidth
- **No authentication at event level**: Any client on the channel can send and receive client events

## Performance Considerations
- Client events bypass the queue entirely—no queue worker overhead
- High-frequency events (cursor tracking, typing indicators) should be throttled client-side (e.g., debounce 50-100ms)
- Each client event generates a WebSocket message to all other channel subscribers; O(n) fan-out cost
- Payload size directly impacts WebSocket bandwidth—keep payloads minimal
- For presence channels, client events fan out to all members; channel size directly impacts traffic

## Production Considerations
- Implement client-side throttling for typing indicators (send at most once per 2-3 seconds, not on every keystroke)
- For cursor tracking, batch position updates and send at fixed intervals (30-60ms)
- Validate or sanitize client event payloads at the receiving client side
- Monitor client event volume via Reverb/WSS metrics to detect abuse
- Consider rate limiting client events per connection in Reverb config (`max_messages_per_second`)
- Never trust client event data; always validate on the receiving client

## Common Mistakes
- Sending client events on public channels (any client can impersonate any user)
- Not throttling typing indicators, flooding the WebSocket with per-character events
- Assuming client events are secure because they bypass the server (they are not authenticated per-message)
- Using client events for data that needs persistence or reliability guarantees
- Forgetting to prefix event names with `client-` when using raw WebSocket API (Echo handles this)

## Failure Modes
- **Client event flood**: Malicious or buggy client sends thousands of events per second, choking the WebSocket connection
- **Event interception**: Any subscriber can listen to all client events on a channel (confidential data in client events is visible)
- **Sender exclusion failure**: Race condition causes sender to receive their own event under rare timing conditions
- **Pusher config issue**: Client events not enabled in Pusher Channels dashboard; events silently dropped

## Ecosystem Usage
- Chat applications: "User is typing..." indicators
- Collaborative editing: Shared cursor positions, selections
- Whiteboard applications: Real-time drawing strokes
- Form collaboration: "User is filling this field"
- Social features: Reactions, emoji bursts, ephemeral animations

## Related Knowledge Units
- K11: Public/Private/Presence Channel Patterns
- K09: Laravel Echo Core API
- K13: Presence Channels & Online User Tracking
- K22: Collaborative Editing with Yjs/CRDT

## Research Notes
Client events are part of the Pusher protocol specification and are supported by Reverb, Soketi, and Pusher Channels. For Reverb, client events are enabled by default. For Pusher Channels, they must be explicitly enabled in the app settings dashboard. The `whisper()` method is the preferred Echo API; developers should not manually prefix event names with `client-`. Client events are not a substitute for server-side validation—malicious clients can send arbitrary payloads.
