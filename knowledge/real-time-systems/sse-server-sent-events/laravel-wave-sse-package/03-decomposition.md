# Decomposition: Laravel Wave Sse Package

## Topic Overview
`qruto/laravel-wave` is a community package that bridges Server-Sent Events with Laravel's broadcasting API, enabling Echo-compatible SSE without a WebSocket server. Wave implements the Echo server protocol over SSE, allowing developers to use `Echo.channel()`, `Echo.private()`, and `.listen()` with SSE as the transport instead of WebSocket. This provides real-time server-to-client events with standard HTTP infrastructure (no WebSocket ports, no sticky sessions, no WebSocket-specific scaling)...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
sse-server-sent-events/K17-laravel-wave-sse-package/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Wave Sse Package
- **Purpose:** `qruto/laravel-wave` is a community package that bridges Server-Sent Events with Laravel's broadcasting API, enabling Echo-compatible SSE without a WebSocket server. Wave implements the Echo server protocol over SSE, allowing developers to use `Echo.channel()`, `Echo.private()`, and `.listen()` with SSE as the transport instead of WebSocket. This provides real-time server-to-client events with standard HTTP infrastructure (no WebSocket ports, no sticky sessions, no WebSocket-specific scaling)...
- **Difficulty:** Intermediate
- **Dependencies:
  - K16: SSE Implementation in Laravel
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K01: Laravel Broadcasting Architecture
  - K09: Laravel Echo Core API

## Dependency Graph
**Depends on:**
  - K16: SSE Implementation in Laravel
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K01: Laravel Broadcasting Architecture
  - K09: Laravel Echo Core API

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Echo-compatible SSE**: Use standard Echo API with SSE transport**Channel subscription via SSE**: Echo methods map to SSE channel filters**Authorization via standard Laravel auth**: No custom auth handling needed**Event replay on reconnect**: Buffered events redelivered via Last-Event-ID**No WebSocket infrastructure**: Single HTTP port, standard Nginx config, no sticky sessions**Echo protocol compatibility**: Enables migration between WebSocket and SSE without frontend code changes**SSE as transport**: Leverages HTTP streaming instead of WebSocket for server-to-client events**Event buffer for reliability**: Reconnection with missed event replay via SSE's built-in `id` field**Unidirectional only**: Echo client events (whisper, typing indicators) do not work over SSE**Community package**: Not first-party Laravel; maintenance and compatibility depend on the package author**Lower browser support than WebSocket**: SSE not supported in IE; 96% support in modern browsers**Horizontal scaling complexity**: SSE connections are tied to specific servers; Redis pub/sub needed for cross-server event fan-out**Limited ecosystem**: Fewer deployment examples and community knowledge compared to ReverbSSE connections via Wave consume PHP-FPM workers (same as native SSE)Event buffer in Redis adds memory overhead proportional to buffer duration and event volumeChannel subscription registry is in-memory per server; horizontal scaling requires shared stateEvent fan-out to SSE connections is O(n) in connected client count; large audiences require Redis pub/subNo per-connection WebSocket overhead (no upgrade handshake, no frame parsing)Configure event buffer with appropriate TTL to limit memory usageSet up Redis for cross-server event distribution if running multiple application serversMonitor PHP-FPM worker pool utilization—each SSE connection holds a workerConfigure Nginx with `X-Accel-Buffering: no` for SSE endpointTest Echo integration thoroughly—Wave aims for compatibility but may have edge cases with complex event patternsHave a fallback plan if the package becomes unmaintained (migrate to native SSE or Reverb)Expecting client events (whispers) to work over SSE (they require bidirectional WebSocket)Not configuring the event buffer, losing events during reconnection windowsUsing Wave for bidirectional use cases where WebSocket is the correct choiceAssuming Wave provides the same throughput/scaling characteristics as ReverbNot testing with the specific Echo version used in the project**Package incompatibility**: Laravel version update breaks Wave's Echo compatibility**Event buffer overflow**: High event volume fills buffer; events are dropped**Worker exhaustion**: Many concurrent SSE connections exhaust PHP-FPM worker pool**Cross-server event leak**: Multiple application servers without Redis pub/sub; events only reach clients on the originating server**Authorization bypass**: Channel authorization misconfiguration allows unauthorized SSE stream accessApplications wanting real-time updates without WebSocket infrastructureShared hosting environments where WebSocket ports are blockedProjects with simple server-to-client event needs that find Reverb over-engineeredLaravel applications already on HTTP/2 infrastructure wanting to avoid SSE connection limitsPrototypes and MVPs needing quick real-time features without WebSocket setupK16: SSE Implementation in LaravelK18: WebSocket vs SSE vs Polling Decision FrameworkK01: Laravel Broadcasting ArchitectureK09: Laravel Echo Core API

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