## Never Send Client Events on Public Channels
---
## Security
---
Always use private or presence channels for client events (whispers); never use public channels.
---
Public channels require no authentication. Any connected client can send and receive client events on public channels, enabling user impersonation and unauthorized data access.
---
```javascript
Echo.channel('chat.1').whisper('typing', { userId: 1 }); // Any client can listen
```
---
```javascript
Echo.private('chat.1').whisper('typing', { userId: 1 }); // Authenticated only
```
---
No common exceptions; client events must never be on public channels.
---
User impersonation; unauthorized event interception; spam.

## Always Implement Client-Side Throttling for High-Frequency Events
---
## Performance
---
Always throttle typing indicators to at most one event per 2-3 seconds, and batch cursor updates at 30-60ms intervals.
---
Without throttling, a single user's typing can generate dozens of WebSocket messages per second. At scale, this floods the WebSocket server and all channel subscribers.
---
```javascript
// Every keystroke — 50+ messages/second
onkeypress: () => Echo.private('chat.1').whisper('typing', { isTyping: true });
```
---
```javascript
// Throttled to 1 event per 3 seconds
let typingTimer;
onkeypress: () => {
    clearTimeout(typingTimer);
    Echo.private('chat.1').whisper('typing', { isTyping: true });
    typingTimer = setTimeout(() => Echo.private('chat.1').whisper('typing', { isTyping: false }), 3000);
};
```
---
Low-traffic applications with few concurrent users. No common exceptions.
---
WebSocket message flood; O(n) fan-out overload; degraded performance.

## Never Send Sensitive Data Via Client Events
---
## Security
---
Never transmit confidential, financial, or PII data through client events.
---
Client events bypass the Laravel server entirely — there is no server-side validation, logging, or access control. Any subscriber on the channel can read all client event payloads.
---
```javascript
// Sensitive data broadcast to all channel members
Echo.private('chat.1').whisper('payment', { cardNumber: '4111...' });
```
---
```javascript
// Use server events for any data requiring security
broadcast(new PaymentReceived($payment));
```
---
No common exceptions; client events are inherently insecure.
---
Data leakage; compliance violations; no audit trail.

## Always Validate Client Event Payloads on the Receiving Client
---
## Security
---
Always validate and sanitize client event payloads on the receiving end before using them.
---
Client events have no server-side validation. Malicious or malformed payloads from compromised clients reach all subscribers unchecked.
---
```javascript
// Trusts payload directly — XSS/injection risk
Echo.private('chat.1').listenForWhisper('message', (e) => {
    chat.innerHTML += e.text; // Unsanitized
});
```
---
```javascript
// Validate on receiving end
Echo.private('chat.1').listenForWhisper('typing', (e) => {
    if (typeof e.isTyping !== 'boolean') return; // Reject invalid
    showIndicator(e.userId, e.isTyping);
});
```
---
Trusted-environment applications. No common exceptions for user-generated content.
---
XSS; injection attacks; malicious data display.

## Always Use Echo's `whisper()` Method, Not Manual `client-` Prefix
---
## Framework Usage
---
Always use Echo's `whisper()` and `listenForWhisper()` methods instead of manually prefixing event names with `client-`.
---
Echo automatically prepends the `client-` prefix required by the Pusher protocol. Manual prefixing causes double prefixing (`client-client-eventName`) or missing prefixes.
---
```javascript
// Manual prefix — risk of double prefix
Echo.private('chat.1').whisper('client-typing', data);
// Actually sends: client-client-typing
```
---
```javascript
// Echo handles prefix automatically
Echo.private('chat.1').whisper('typing', data);
// Sends: client-typing
```
---
Raw WebSocket API usage. No common exceptions when using Echo.
---
Double-prefixed event names; client events not received.

## Always Monitor Client Event Volume for Abuse Detection
---
## Maintainability
---
Always monitor per-connection client event throughput via Reverb metrics to detect abuse.
---
Without monitoring, a compromised or misbehaving client can flood the channel with client events, degrading performance for all subscribers. The abuse goes undetected until users report issues.
---
```javascript
// No monitoring — abuse undetected
```
```env
REVERB_MAX_MESSAGES_PER_SECOND=50  // Reverb-side rate limiting
```
---
No common exceptions; client event monitoring is essential for production channels.
---
Undetected abuse; degraded channel performance; DoS via client events.
