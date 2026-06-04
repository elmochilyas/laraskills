# ECC Anti-Patterns — Client Events (Whisper, Typing Indicators)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Client Events (Whisper, Typing Indicators) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Client Events on Public Channels
2. No Throttling on Typing Indicators (Per-Keystroke Events)
3. Sensitive Data in Client Event Payloads
4. No Validation of Client Event Payloads on Receiving Side
5. Manual `client-` Prefix Causing Double Prefixing

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Client Events on Public Channels

### Category
Security

### Description
Sending client events (whispers) on public channels instead of private or presence channels, allowing any connected client to send and receive events — enabling impersonation and unauthorized data access.

### Warning Signs
- `Echo.channel('chat.1').whisper('typing', data)` used
- Public channels used for client events
- Any user can listen to typing indicators of other users
- No authentication at the event level
- Unauthenticated users can send client events to authenticated users

### Why It Is Harmful
Public channels require no authentication. Any client can subscribe and send client events. This means an attacker can impersonate any user by sending whispers with arbitrary user IDs. They can also listen to all client events on the channel, revealing typing patterns, cursor positions, and other potentially privacy-sensitive information.

### Real-World Consequences
An application uses a public channel for a chat room's typing indicators. An attacker connects to the public channel without authentication and listens for typing events. They learn which users are active, when they're typing, and for how long. They also send fake typing events impersonating other users, causing confusion and distrust in the chat.

### Preferred Alternative
Always use private or presence channels for client events. Private channels require authentication, ensuring only authorized users can participate.

### Refactoring Strategy
1. Change `Echo.channel('chat.1')` to `Echo.private('chat.1')`
2. Register auth callback in `routes/channels.php`
3. Update server-side broadcast event to target the private channel
4. Verify unauthenticated client event attempts are rejected

### Detection Checklist
- [ ] Client events on public channels
- [ ] No authentication check for event participation
- [ ] Unauthenticated users can send/receive whispers

### Related Rules
- (Rule: Never send client events on public channels)

---

## Anti-Pattern 2: No Throttling on Typing Indicators (Per-Keystroke Events)

### Category
Performance

### Description
Sending a typing indicator whisper on every keystroke without throttling, generating dozens of WebSocket messages per second per user and flooding the server and all channel subscribers.

### Warning Signs
- `whisper('typing', ...)` called on every `keypress` event
- High WebSocket message rate during typing
- No debounce or throttle in the typing indicator implementation
- Channel subscribers receive 50+ events/second per typing user

### Why It Is Harmful
Each client event generates a WebSocket message that fans out to all other channel subscribers (O(n) fan-out cost). A user typing at 50 characters per minute generates 50 messages per minute. With 100 concurrent typists, that's 5000 messages per minute — just for typing indicators. Most of these events convey the same information ("user is still typing") and provide no additional value over a throttled rate of 1 event per 2-3 seconds.

### Real-World Consequences
A team chat application has 500 active users. During peak hours, 100 users type simultaneously. Each generates 50 typing events/second. Total: 5000 typing events/second. The WebSocket server processes 5000 messages/second just for typing indicators. CPU usage spikes. Other real-time features (message delivery, notifications) are delayed by the typing indicator flood.

### Preferred Alternative
Throttle typing indicators to at most 1 event per 2-3 seconds using a debounce pattern.

### Refactoring Strategy
1. Implement a timer: send "typing: true" on first keystroke, then debounce
2. Set a 3-second timer that sends "typing: false" when typing stops
3. Clear the timer on each new keystroke (restart the countdown)
4. Verify message rate drops from 50/sec to 0.3/sec per user

### Detection Checklist
- [ ] Per-keystroke typing indicator events
- [ ] No throttling or debouncing
- [ ] High message rate from typing activity

### Related Rules
- (Rule: Always implement client-side throttling for high-frequency events)

---

## Anti-Pattern 3: Sensitive Data in Client Event Payloads

### Category
Security

### Description
Transmitting confidential, financial, or personally identifiable information through client events, which have no server-side validation, logging, or access control — allowing any channel subscriber to intercept sensitive data.

### Warning Signs
- Credit card numbers, passwords, or personal data in whisper payloads
- No server-side logging of client event traffic
- Sensitive application data sent via `whisper()` method
- All channel subscribers can see the event payload

### Why It Is Harmful
Client events bypass the Laravel server entirely. There is no server-side access control per message, no audit trail, and no encryption beyond the WebSocket transport. Any user subscribed to the channel can listen to all client events. Sensitive data transmitted via client events is visible to all channel members. There is no record of who accessed the data, making compliance violations undetectable.

### Real-World Consequences
A financial dashboard uses client events to broadcast portfolio changes in real-time. The payload includes account balances and transaction details. An intern subscribed to the channel writes a simple script that logs all client events. They exfiltrate the data to a personal device. No server-side logs exist because the events bypassed the server entirely. The data breach is discovered 6 months later during an audit.

### Preferred Alternative
Never send sensitive data through client events. Use server-side broadcast events for any data that requires security, persistence, or auditing.

### Refactoring Strategy
1. Audit all client event payloads for sensitive data
2. Replace client events for sensitive data with server-side broadcast events
3. Implement server-side validation and logging for all sensitive data transmissions
4. Verify no PII, financial data, or credentials are transmitted via client events

### Detection Checklist
- [ ] Sensitive data in client event payloads
- [ ] No server-side audit trail for client events
- [ ] All channel subscribers can access the data

### Related Rules
- (Rule: Never send sensitive data via client events)

---

## Anti-Pattern 4: No Validation of Client Event Payloads on Receiving Side

### Category
Security

### Description
Using client event payloads directly on the receiving client without validation, allowing malicious or malformed payloads from compromised clients to execute XSS or cause rendering errors.

### Warning Signs
- Client event data used directly in `innerHTML` or `v-html`
- No type checking on received payload fields
- No sanitization of text content from client events
- Payload fields assumed to have correct types

### Why It Is Harmful
Client events have no server-side validation. A compromised or malicious client can inject arbitrary payloads into client events. Without validation on the receiving side, these payloads can execute XSS attacks (if rendered unsanitized), crash the client app (if types don't match expectations), or display offensive content.

### Real-World Consequences
A chat application's typing indicator shows the username of the person typing. An attacker sends a whisper with `{ userId: 1, isTyping: true, username: '<script>stealCookies()</script>' }`. The receiving client renders the username without sanitization, executing the script. All viewers' cookies are exfiltrated.

### Preferred Alternative
Validate all client event payloads on the receiving client before using them — type-check fields, sanitize strings, reject unexpected data.

### Refactoring Strategy
1. Add validation for each expected payload field
2. Type-check booleans, strings, and numbers
3. Sanitize string content with DOMPurify
4. Use `try/catch` around payload parsing
5. Reject events with missing or invalid fields

### Detection Checklist
- [ ] Client event payloads used without validation
- [ ] No type checking on received data
- [ ] String content rendered without sanitization

### Related Rules
- (Rule: Always validate client event payloads on the receiving client)

---

## Anti-Pattern 5: Manual `client-` Prefix Causing Double Prefixing

### Category
Framework Usage

### Description
Manually prepending `client-` to event names when using Echo's `whisper()` method, which already auto-prefixes, resulting in `client-client-eventName` and broken event delivery.

### Warning Signs
- `whisper('client-typing', data)` in code
- Client events never received by other clients
- Event name appears as `client-client-typing` in WebSocket inspector
- No understanding that Echo auto-prefixes

### Why It Is Harmful
Echo's `whisper()` method automatically prepends the `client-` prefix required by the Pusher protocol. Adding the prefix manually causes `client-client-eventname`. The receiving client listens for `client-eventname` (as auto-prefixed by `listenForWhisper()`), but the actual event name is `client-client-eventname`. The event is never received. Debugging is confusing because the WebSocket inspector shows a different event name than expected.

### Real-World Consequences
A developer reads the Pusher documentation about the `client-` prefix requirement and adds the prefix manually: `Echo.private('chat').whisper('client-typing', data)`. Echo sends `client-client-typing`. The listener `listenForWhisper('typing')` expects `client-typing`. No matching events arrive. The developer spends 2 hours debugging before discovering the double prefix.

### Preferred Alternative
Use Echo's `whisper()` without the `client-` prefix — Echo handles it automatically.

### Refactoring Strategy
1. Search for `whisper('client-` patterns
2. Replace with `whisper('typing')` etc. (no manual prefix)
3. Verify event names in WebSocket inspector show single `client-` prefix
4. Update all listeners to match: `listenForWhisper('typing')` (also auto-prefixed)

### Detection Checklist
- [ ] Manual `client-` prefix in `whisper()` calls
- [ ] Event names doubled in WebSocket traffic
- [ ] Client events not received by other clients

### Related Rules
- (Rule: Always use Echo's `whisper()` method, not manual `client-` prefix)
