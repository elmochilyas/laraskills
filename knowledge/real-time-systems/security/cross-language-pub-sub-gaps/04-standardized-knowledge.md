# Standardized Knowledge: Cross-Language Pub/Sub Gaps

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Security |
| Knowledge Unit ID | K39 |
| Title | Cross-Language Pub/Sub Gaps |
| Difficulty | Advanced |
| Dependencies | K01, K04, K06, K07 |

## Overview
Laravel's broadcasting system assumes a PHP-centric architecture where both the event dispatcher and WebSocket server understand Laravel's event serialization format. When non-Laravel (or non-PHP) services need to publish broadcast events, they must bridge the gap in serialization, authentication, and protocol. The most portable bridge is the broadcast driver's HTTP API (Pusher, Ably), directly consumable from any language.

## Core Concepts
- Laravel's broadcast pipeline uses PHP event objects serialized via `BroadcastEvent` jobs
- The cross-language gap involves serialization, authentication, and protocol differences
- Pusher HTTP API is the most portable bridge—any language can make HMAC-SHA256 signed HTTP requests
- Ably REST API uses Basic or Token authentication, simpler for cross-language use
- For Reverb's Redis scaling channel (v1.7+), the message format is JSON with specific structure

## When To Use
- Microservice architectures where non-Laravel services need to push real-time events to Laravel-connected clients
- Polyglot environments where PHP handles web serving but other languages handle async processing
- Integration with external event sources (third-party webhooks, IoT device data)
- Event-driven architectures where domain events from multiple services centralize through Laravel broadcasting

## When NOT To Use
- Monolithic Laravel applications (no cross-language need)
- All-PHP microservice architectures
- Applications already using a single managed WebSocket service end-to-end

## Best Practices (Why)
- **Create a dedicated Laravel broadcast gateway endpoint**: External services publish to a Laravel API route; Laravel dispatches through the standard pipeline—provides a stable contract and handles auth, validation, and error handling
- **Use Pusher/Ably HTTP API as the universal bridge**: These have official SDKs in most languages and well-documented REST APIs
- **Validate external event payloads**: Before dispatching, check channel authorization and payload constraints to prevent unauthorized broadcasts
- **Version the external broadcast API**: Allow message format evolution independent of internal broadcast changes

## Architecture Guidelines
- Exposing the Reverb Redis scaling channel as a cross-language publishing interface is brittle—it's an internal communication channel not a public API
- A Laravel gateway endpoint adds latency but provides stability and security
- Direct Redis publishing to Reverb's channel requires matching the internal JSON schema (v1.7+)
- Log all cross-language broadcast events for audit and debugging

## Performance Considerations
- Laravel gateway adds HTTP request + queue processing overhead (50-200ms) vs direct Redis pub/sub (1-5ms)
- Pusher/Ably HTTP API adds network round-trip latency (10-50ms depending on region)
- Direct Redis publishing is fastest but tightly couples the publisher to Reverb's internal format
- Batch publishing: send multiple events in a single API call to reduce HTTP overhead

## Security Considerations
- The broadcast gateway endpoint must authenticate external services (API keys, tokens)
- Never expose Laravel broadcast driver credentials (REVERB_KEY, REVERB_SECRET) to external services
- Direct Redis publishing requires Redis authentication and network isolation
- Validate and sanitize all payloads from external services before broadcasting

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming Redis scaling channel is public API | Treating internal communication channel as external interface | Misunderstanding architecture | Brittle integration, breaks on version updates | Use Laravel gateway or managed service HTTP API |
| Sending PHP-serialized events to non-PHP services | Non-PHP services cannot unserialize PHP format | Serialization assumption | Failed deserialization, broken integration | Always use JSON format |
| Not authenticating external broadcast endpoint | Unauthorized event publishing | Missing auth middleware | Anyone can broadcast to your users | Implement API key or token auth on gateway |
| Exposing broadcast credentials externally | Shared REVERB_KEY/REVERB_SECRET with external services | Convenience over security | Broadcast system compromise | Use gateway endpoint with scoped API tokens |

## Anti-Patterns
- **Publishing directly to Reverb's Redis channel from external services**: The schema is internal and may change between versions; use Laravel gateway or managed service API
- **No payload validation for external events**: Malformed payloads can crash Echo clients or expose data
- **Exposing the Laravel app key/secret to external systems for direct Pusher API calls**: Use a gateway endpoint with scoped credentials instead

## Examples

### Laravel broadcast gateway endpoint
```php
// routes/api.php
Route::post('/broadcast', function (Request $request) {
    $request->validate([
        'channel' => 'required|string',
        'event' => 'required|string',
        'payload' => 'required|array',
    ]);

    // Verify external service API key
    $request->validate(['api_key' => 'required|string|in:' . config('services.broadcast_gateway_key')]);

    broadcast(new ExternalBroadcastEvent(
        $request->input('channel'),
        $request->input('event'),
        $request->input('payload')
    ));

    return response()->json(['status' => 'ok']);
})->middleware('throttle:100,1');
```

### Node.js publishing to Laravel gateway
```javascript
// External Node.js service
await fetch('https://api.example.com/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        api_key: process.env.BROADCAST_GATEWAY_KEY,
        channel: 'orders',
        event: 'OrderShipped',
        payload: { orderId: '123', status: 'shipped' }
    })
});
```

## Related Topics
- K01: Laravel Broadcasting Architecture
- K04: Reverb Horizontal Scaling via Redis
- K06: Pusher Channels Integration
- K07: Ably Integration & Enterprise Features

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- The recommended approach is a Laravel broadcast gateway endpoint, not direct Redis publishing
- Reverb v1.7+ switched to JSON for internal Redis messages, which is more cross-language friendly
- Pusher HTTP API is the most mature cross-language broadcast interface with SDKs in PHP, Node.js, Python, Ruby, Go, and Java

## Verification
- [ ] Broadcast gateway endpoint created for external services
- [ ] External service authentication implemented (API key/token)
- [ ] Payload validation before dispatching
- [ ] Cross-language events logged for audit
- [ ] Broadcast driver credentials not exposed to external services
- [ ] External broadcast API versioned
- [ ] Failure handling with retry and dead-letter queue implemented
