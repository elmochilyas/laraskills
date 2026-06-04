# ECC Anti-Patterns — WebSocket vs SSE vs Polling Decision Framework

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Transport Comparison |
| **Knowledge Unit** | WebSocket vs SSE vs Polling Decision Framework |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. WebSocket as Default Transport for All Real-Time Features
2. Short Polling at Sub-10 Second Intervals
3. Long Polling as Primary Transport
4. WebSocket on Infrastructure Without Sticky Session Support
5. No Transport Fallback (Progressive Enhancement)

---

## Repository-Wide Anti-Patterns

- Overengineering
- Hidden Database Queries

---

## Anti-Pattern 1: WebSocket as Default Transport for All Real-Time Features

### Category
Architecture

### Description
Defaulting to WebSocket for every real-time feature regardless of directionality requirements, when SSE would suffice for the majority (80%) of use cases.

### Warning Signs
- All real-time features use Reverb or Pusher
- Simple notification feeds implemented with WebSocket
- No evaluation of whether SSE + POST pattern would work
- Infrastructure configured for WebSocket sticky sessions unnecessarily

### Why It Is Harmful
WebSocket requires infrastructure complexity that SSE avoids: sticky sessions for load balancing, WebSocket-aware proxies, protocol upgrade handling, and connection management. Approximately 80% of real-time use cases are server-to-client only (notifications, dashboards, status updates), which SSE handles with standard HTTP infrastructure at lower operational cost.

### Real-World Consequences
A team deploys Reverb for a notification feed that pushes unread counts to users. They configure sticky sessions, WebSocket ports, and a queue worker. The same feature could be implemented with SSE in 50 lines of PHP — no sticky sessions, no queue worker, no WebSocket configuration.

### Preferred Alternative
Default to SSE for server-to-client use cases. Reserve WebSocket for features requiring bidirectional communication (<50ms latency).

### Refactoring Strategy
1. Evaluate each real-time feature for directionality requirements
2. Replace WebSocket with SSE for server-to-client-only features
3. Keep WebSocket only for chat, collaborative editing, gaming
4. Document transport choice per feature in architecture docs

### Detection Checklist
- [ ] WebSocket used for server-to-client-only features
- [ ] No SSE evaluation before WebSocket adoption
- [ ] Infrastructure complexity from unnecessary WebSocket support

### Related Rules
- (Rule: Always default to SSE for server-to-client real-time)

---

## Anti-Pattern 2: Short Polling at Sub-10 Second Intervals

### Category
Performance

### Description
Using `setInterval` or `setTimeout` to poll the server at intervals below 10 seconds, generating massive redundant HTTP traffic when push-based alternatives would be more efficient.

### Warning Signs
- `setInterval(fetchUpdates, 3000)` in frontend code
- HTTP requests returning "no new data" 90%+ of the time
- Server CPU spikes from polling traffic
- Frontend makes more HTTP requests than user interactions

### Why It Is Harmful
Short polling at 3-second intervals creates 20 HTTP requests per minute per client. Most requests return no new data. At 1000 concurrent users, this is 20,000 requests per minute — almost all wasted. Server resources are consumed parsing HTTP headers, authenticating, and returning empty responses. Mobile battery life degrades from constant network activity.

### Real-World Consequences
A dashboard polls every 3 seconds. With 500 concurrent users, the server handles 10,000 requests per minute for polling alone. 95% return `{"updated": false}`. A simple SSE endpoint would reduce this to 500 persistent connections with near-zero idle resource usage.

### Preferred Alternative
Use SSE or long polling for sub-10 second update requirements. Reserve short polling for low-frequency updates (>30s intervals) where polling overhead is negligible.

### Refactoring Strategy
1. Identify all polling intervals below 10 seconds
2. Replace with SSE endpoint for push-based delivery
3. Keep short polling only for low-frequency updates (>30s)
4. Remove `setInterval` patterns from frontend code

### Detection Checklist
- [ ] Polling interval below 10 seconds
- [ ] Most poll responses indicate no new data
- [ ] SSE or long polling not considered as alternative

### Related Rules
- (Rule: Never use short polling for sub-10 second intervals)

---

## Anti-Pattern 3: Long Polling as Primary Transport

### Category
Performance

### Description
Using long polling as the primary real-time transport instead of as a legacy browser fallback, causing orders of magnitude worse resource usage and latency.

### Warning Signs
- Long polling used as the default real-time transport
- No SSE or WebSocket implementation
- Target browsers support EventSource (96%+)
- High memory and CPU usage at scale

### Why It Is Harmful
Long polling consumes 1.8 GB memory vs 0.4 GB for WebSocket at 10k connections, 45% CPU vs 5% at idle, and delivers p50 latency of 15,000ms vs 8ms for WebSocket. It keeps HTTP connections open for the duration of the poll, consuming connection slots and memory. Every poll cycle requires a new TLS handshake, HTTP request parsing, and authentication.

### Real-World Consequences
An enterprise application uses long polling as its only real-time transport. At 5000 concurrent users, the server memory reaches 90%. CPU is at 60% during idle periods. Dashboard updates have a 15-second delay. Users complain the application feels sluggish.

### Preferred Alternative
Use SSE as the primary transport (96% browser support). Fall back to long polling only for legacy browsers (IE11) that don't support EventSource.

### Refactoring Strategy
1. Implement SSE as the primary transport
2. Implement long polling only as a fallback for legacy browsers
3. Use feature detection: `try { new EventSource('/stream'); } catch { startLongPolling(); }`
4. Remove long polling as default

### Detection Checklist
- [ ] Long polling configured as default transport
- [ ] No SSE or WebSocket implementation
- [ ] High resource usage correlated with connection count

### Related Rules
- (Rule: Always use long polling as fallback only)

---

## Anti-Pattern 4: WebSocket on Infrastructure Without Sticky Session Support

### Category
Reliability

### Description
Deploying WebSocket infrastructure without sticky sessions (session affinity) configured on the load balancer, causing connections to break when requests are routed to different servers.

### Warning Signs
- Load balancer uses round-robin without sticky sessions
- WebSocket connections randomly disconnect
- Reverb/Soketi clients reconnect frequently
- No `ip_hash` or cookie-based affinity configured

### Why It Is Harmful
WebSocket connections are stateful — after the HTTP upgrade handshake, all subsequent frames must go to the same server. Without sticky sessions, the load balancer may route a WebSocket message to a different server that has no knowledge of the connection, causing an immediate disconnect or protocol error.

### Real-World Consequences
A Reverb deployment behind an AWS ALB without sticky sessions works initially. As traffic increases, the load balancer distributes WebSocket frames across servers. Connections drop randomly every few minutes. Clients reconnect continuously, creating a "connection storm" that worsens the problem.

### Preferred Alternative
Configure sticky sessions (ip_hash or cookie-based affinity) on the load balancer for WebSocket connections. Consider SSE for environments where sticky sessions are not available.

### Refactoring Strategy
1. Configure load balancer with sticky session cookie or source-IP affinity
2. Set session stickiness TTL appropriate for expected connection duration
3. Test by simulating server failover and verifying connections survive
4. Document sticky session requirement in infrastructure config

### Detection Checklist
- [ ] No sticky sessions configured for WebSocket
- [ ] Connections drop unpredictably
- [ ] Load balancer distributes WebSocket requests across servers

### Related Rules
- (Rule: Always configure sticky sessions for WebSocket infrastructure)

---

## Anti-Pattern 5: No Transport Fallback (Progressive Enhancement)

### Category
Reliability

### Description
Using a single real-time transport with no fallback mechanism, causing real-time features to break entirely for users on restrictive networks, corporate proxies, or legacy browsers.

### Warning Signs
- Single transport hardcoded with no fallback
- Users on corporate VPNs report no real-time updates
- No error handling when transport fails to connect
- Echo configured with `broadcaster: 'reverb'` only

### Why It Is Harmful
Corporate proxies often block WebSocket connections. Some enterprise environments still use IE11 without EventSource support. Mobile networks may intermittently block non-standard ports. Without progressive enhancement, entire user segments cannot use real-time features. The application fails silently — no error message, just stale data.

### Real-World Consequences
A SaaS application uses Reverb with no fallback. A large enterprise customer blocks WebSocket ports on their corporate network. All 500 of their users see no real-time updates. They assume the application is broken and submit support tickets. The issue resolves only when the IT department opens WebSocket ports — a process that takes 2 weeks.

### Preferred Alternative
Implement progressive transport selection: attempt WebSocket, fall back to SSE, then to long polling based on browser capabilities and connection success.

### Refactoring Strategy
1. Implement a transport detection function that tests browser capabilities
2. Fall back: WebSocket -> SSE -> Long Polling
3. Handle transport failure with a clear user message (not silence)
4. Test on restrictive networks (corporate proxy, VPN)
5. Document supported transports for enterprise customers

### Detection Checklist
- [ ] Single transport with no fallback
- [ ] Real-time features broken for some network environments
- [ ] No transport failure handling or user feedback

### Related Rules
- (Rule: Always implement progressive enhancement for transport selection)
