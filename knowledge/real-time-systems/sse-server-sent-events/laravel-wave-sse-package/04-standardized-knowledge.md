# Standardized Knowledge: Laravel Wave SSE Package

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | SSE (Server-Sent Events) |
| Knowledge Unit ID | K17 |
| Title | Laravel Wave SSE Package |
| Difficulty | Intermediate |
| Dependencies | K16, K18, K01, K09 |

## Overview
`qruto/laravel-wave` is a community package that bridges Server-Sent Events with Laravel's broadcasting API, enabling Echo-compatible SSE without a WebSocket server. Wave implements the Echo server protocol over SSE, allowing developers to use `Echo.channel()`, `Echo.private()`, and `.listen()` with SSE as the transport. This provides real-time server-to-client events with standard HTTP infrastructure—no WebSocket ports, sticky sessions, or WebSocket-specific scaling.

## Core Concepts
- Wave acts as a translation layer: presents an Echo-compatible API on the server side (broadcast events with channel names) and uses SSE as the transport instead of WebSocket
- Channels work as expected: public, private (with authorization), and listening for events
- The difference is the transport mechanism—standard HTTP streaming rather than persistent WebSocket connections
- Wave manages a registry of connected clients and their channel subscriptions

## When To Use
- Applications wanting real-time updates without WebSocket infrastructure
- Shared hosting environments where WebSocket ports are blocked
- Projects with simple server-to-client event needs where Reverb seems over-engineered
- Laravel applications on HTTP/2 infrastructure wanting to avoid SSE connection limits
- Prototypes and MVPs needing quick real-time features without WebSocket setup

## When NOT To Use
- Bidirectional features requiring client events (whispers, typing indicators)—Wave is unidirectional
- High-traffic applications requiring horizontal WebSocket scaling (Reverb is more appropriate)
- Applications needing guaranteed delivery or message persistence
- Production-critical systems where first-party support is required (Wave is a community package)

## Best Practices (Why)
- **Configure event buffer with appropriate TTL**: Wave stores pending events for replay on reconnect; set TTL to limit memory usage
- **Set up Redis for cross-server event distribution**: Multiple application servers without Redis pub/sub only reach clients on the originating server
- **Monitor PHP-FPM worker pool**: Each SSE connection holds a PHP-FPM worker for its duration
- **Configure Nginx with `X-Accel-Buffering: no`**: Required for SSE streaming through Nginx
- **Test Echo integration thoroughly**: Wave aims for Echo compatibility but may have edge cases with complex event patterns

## Architecture Guidelines
- Wave enables migration between WebSocket and SSE without frontend code changes
- Echo client events (whisper, typing indicators) do not work over SSE—they require bidirectional WebSocket
- Have a fallback plan if the package becomes unmaintained (migrate to native SSE or Reverb)
- Horizontal scaling requires Redis pub/sub for cross-server event fan-out

## Performance Considerations
- SSE connections via Wave consume PHP-FPM workers (same as native SSE)
- Event buffer in Redis adds memory overhead proportional to buffer duration and event volume
- Channel subscription registry is in-memory per server; horizontal scaling requires shared state
- Event fan-out to SSE connections is O(n) in connected client count
- No per-connection WebSocket overhead (no upgrade handshake, no frame parsing)

## Security Considerations
- Wave uses standard Laravel auth for channel authorization
- Event buffer should be protected—buffered events may contain sensitive data
- SSE endpoints should be rate limited to prevent abuse
- Allowed origins should be configured to prevent unauthorized connections

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Expecting client events over SSE | Whispers and typing indicators don't work | Not understanding SSE is unidirectional | Silent failure of client features | Use WebSocket for bidirectional needs |
| Not configuring event buffer | Events lost during reconnection windows | Missing buffer configuration | Users miss events after reconnect | Configure event buffer with appropriate TTL |
| Wave for bidirectional use cases | Trying to build chat with SSE-only transport | Misunderstanding Wave's capabilities | Incomplete implementation | Use Reverb or Soketi for bidirectional |
| Assuming Reverb throughput/scaling | Wave has different performance characteristics | Comparing to first-party solutions | Performance issues at scale | Benchmark and capacity plan appropriately |

## Anti-Patterns
- **Not testing with the specific Echo version**: Echo API changes may break Wave compatibility
- **Using Wave in horizontally scaled app servers without Redis**: Events only reach clients on the originating server
- **Relying on Wave for production-critical broadcasting**: As a community package, maintenance and compatibility depend on the author

## Examples

### Wave installation and setup
```bash
composer require qruto/laravel-wave
php artisan wave:install
```

### Wave broadcast event (same as standard Laravel)
```php
class OrderShipped implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('orders.' . $this->order->id),
        ];
    }
}
```

### Echo client with Wave (same API as Reverb/Pusher)
```javascript
import Echo from 'laravel-echo';

const echo = new Echo({
    broadcaster: 'wave',
});
```

## Related Topics
- K16: SSE Implementation in Laravel
- K18: WebSocket vs SSE vs Polling Decision Framework
- K01: Laravel Broadcasting Architecture
- K09: Laravel Echo Core API

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- `qruto/laravel-wave` is the most popular SSE package in the Laravel ecosystem as of 2026
- Not a first-party package but widely adopted
- Primary value: eliminates WebSocket infrastructure complexity for server-to-client-only use cases
- Less suitable for bidirectional real-time features like chat or collaborative editing

## Verification
- [ ] Wave package installed and configured
- [ ] Event buffer configured with TTL
- [ ] Redis set up for cross-server distribution (if multiple app servers)
- [ ] Nginx configured with `X-Accel-Buffering: no` for SSE
- [ ] PHP-FPM worker pool sized for expected SSE connections
- [ ] Echo integration tested with the project's Echo version
- [ ] Fallback plan documented (migration to Reverb or native SSE)
- [ ] Rate limiting configured on SSE endpoints
