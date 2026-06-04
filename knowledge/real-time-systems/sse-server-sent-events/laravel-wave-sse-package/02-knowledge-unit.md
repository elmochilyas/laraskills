# Metadata
Domain: Real-Time Systems
Subdomain: SSE (Server-Sent Events)
Knowledge Unit: Laravel Wave SSE Package
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
`qruto/laravel-wave` is a community package that bridges Server-Sent Events with Laravel's broadcasting API, enabling Echo-compatible SSE without a WebSocket server. Wave implements the Echo server protocol over SSE, allowing developers to use `Echo.channel()`, `Echo.private()`, and `.listen()` with SSE as the transport instead of WebSocket. This provides real-time server-to-client events with standard HTTP infrastructure (no WebSocket ports, no sticky sessions, no WebSocket-specific scaling). Wave handles channel authorization, event serialization, and SSE connection management. It is particularly suited for applications that need unidirectional real-time updates without the operational complexity of WebSocket servers.

## Core Concepts
Wave acts as a translation layer: it presents an Echo-compatible API on the server side (broadcast events with channel names) and uses SSE as the underlying transport instead of WebSocket. The client uses standard Laravel Echo configured with a Wave-specific connector or a custom broadcaster. Channels work as expected: public, private (with authorization), and listening for events. The difference is the transport mechanism—standard HTTP streaming rather than persistent WebSocket connections.

## Mental Models
Wave is an adapter that makes SSE look like WebSocket broadcasting to your Laravel application. Your server code stays the same (events implementing ShouldBroadcast), but the transport between server and client uses SSE instead of WebSocket.

## Internal Mechanics
Wave registers a route that clients connect to via EventSource. When a Laravel event is broadcast (via ShouldBroadcast), Wave's event handler receives it, determines which SSE connections are subscribed to the relevant channel, and writes the event data to those SSE streams. Wave manages a registry of connected clients and their channel subscriptions. Channel authorization is handled through the standard Laravel auth system. Wave stores pending events in a buffer (Redis/database) so that reconnecting clients receive missed events via `Last-Event-ID`.

## Patterns
- **Echo-compatible SSE**: Use standard Echo API with SSE transport
- **Channel subscription via SSE**: Echo methods map to SSE channel filters
- **Authorization via standard Laravel auth**: No custom auth handling needed
- **Event replay on reconnect**: Buffered events redelivered via Last-Event-ID
- **No WebSocket infrastructure**: Single HTTP port, standard Nginx config, no sticky sessions

## Architectural Decisions
- **Echo protocol compatibility**: Enables migration between WebSocket and SSE without frontend code changes
- **SSE as transport**: Leverages HTTP streaming instead of WebSocket for server-to-client events
- **Event buffer for reliability**: Reconnection with missed event replay via SSE's built-in `id` field

## Tradeoffs
- **Unidirectional only**: Echo client events (whisper, typing indicators) do not work over SSE
- **Community package**: Not first-party Laravel; maintenance and compatibility depend on the package author
- **Lower browser support than WebSocket**: SSE not supported in IE; 96% support in modern browsers
- **Horizontal scaling complexity**: SSE connections are tied to specific servers; Redis pub/sub needed for cross-server event fan-out
- **Limited ecosystem**: Fewer deployment examples and community knowledge compared to Reverb

## Performance Considerations
- SSE connections via Wave consume PHP-FPM workers (same as native SSE)
- Event buffer in Redis adds memory overhead proportional to buffer duration and event volume
- Channel subscription registry is in-memory per server; horizontal scaling requires shared state
- Event fan-out to SSE connections is O(n) in connected client count; large audiences require Redis pub/sub
- No per-connection WebSocket overhead (no upgrade handshake, no frame parsing)

## Production Considerations
- Configure event buffer with appropriate TTL to limit memory usage
- Set up Redis for cross-server event distribution if running multiple application servers
- Monitor PHP-FPM worker pool utilization—each SSE connection holds a worker
- Configure Nginx with `X-Accel-Buffering: no` for SSE endpoint
- Test Echo integration thoroughly—Wave aims for compatibility but may have edge cases with complex event patterns
- Have a fallback plan if the package becomes unmaintained (migrate to native SSE or Reverb)

## Common Mistakes
- Expecting client events (whispers) to work over SSE (they require bidirectional WebSocket)
- Not configuring the event buffer, losing events during reconnection windows
- Using Wave for bidirectional use cases where WebSocket is the correct choice
- Assuming Wave provides the same throughput/scaling characteristics as Reverb
- Not testing with the specific Echo version used in the project

## Failure Modes
- **Package incompatibility**: Laravel version update breaks Wave's Echo compatibility
- **Event buffer overflow**: High event volume fills buffer; events are dropped
- **Worker exhaustion**: Many concurrent SSE connections exhaust PHP-FPM worker pool
- **Cross-server event leak**: Multiple application servers without Redis pub/sub; events only reach clients on the originating server
- **Authorization bypass**: Channel authorization misconfiguration allows unauthorized SSE stream access

## Ecosystem Usage
- Applications wanting real-time updates without WebSocket infrastructure
- Shared hosting environments where WebSocket ports are blocked
- Projects with simple server-to-client event needs that find Reverb over-engineered
- Laravel applications already on HTTP/2 infrastructure wanting to avoid SSE connection limits
- Prototypes and MVPs needing quick real-time features without WebSocket setup

## Related Knowledge Units
- K16: SSE Implementation in Laravel
- K18: WebSocket vs SSE vs Polling Decision Framework
- K01: Laravel Broadcasting Architecture
- K09: Laravel Echo Core API

## Research Notes
`qruto/laravel-wave` is the most popular SSE package in the Laravel ecosystem as of 2026. It is not a first-party package but is widely adopted. The package name "Wave" references the Laravel Wave concept from earlier Laravel versions. The package has evolved to support Laravel 11 and 12's broadcasting features. Its primary value proposition is eliminating WebSocket infrastructure complexity for teams that only need server-to-client events. The package is less suitable for bidirectional real-time features like chat or collaborative editing. The package repository and documentation are on GitHub under `qruto/laravel-wave`.
