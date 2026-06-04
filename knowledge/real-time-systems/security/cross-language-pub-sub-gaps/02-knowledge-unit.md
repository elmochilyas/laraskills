# Metadata
Domain: Real-Time Systems
Subdomain: Security
Knowledge Unit: Cross-Language Pub/Sub Gaps
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Laravel's broadcasting system assumes a PHP-centric architecture where both the event dispatcher and the WebSocket server understand Laravel's event serialization format. When non-Laravel (or non-PHP) services need to publish broadcast events, they must bridge the gap in serialization, authentication, and protocol. The standard broadcast driver (Pusher, Reverb, Ably) expects events formatted with specific fields (channel, event name, payload) and authenticated with the app key/secret. Cross-language services (Node.js, Python, Go, Ruby) cannot directly use Laravel's PHP broadcast classes and serialization. The bridge is typically the broadcast driver's HTTP API or the shared Redis pub/sub channel. Using Redis pub/sub, a non-PHP service can publish JSON-formatted messages to the same Redis channel that Reverb listens on, but must format them correctly for Reverb to deserialize.

## Core Concepts
Laravel's broadcast pipeline uses PHP event objects, serializes them via Laravel's `BroadcastEvent` job, and publishes them through the configured driver. For Reverb with Redis scaling, the serialization format was PHP serialization (pre-v1.7) and is now JSON (v1.7+). A non-PHP service that wants to broadcast events must publish messages to Reverb's Redis channel in the correct JSON format, or use the broadcast driver's external API (Pusher HTTP API, Ably REST API). The Pusher HTTP API is the most portable bridge—any language can make HTTP POST requests to Pusher's API endpoints with the correct authentication headers (HMAC-SHA256 signature).

## Mental Models
Cross-language pub/sub is like having a party where PHP speaks French and Node.js speaks German. The Redis channel is a shared whiteboard—everyone can read and write, but they must agree on the format (lingua franca). The Pusher HTTP API is the universal translator—any language can use it to broadcast events without understanding Laravel's internals.

## Internal Mechanics
For Reverb's Redis scaling channel (v1.7+), the message format is JSON with structure: `{ "event": "broadcasting:event", "data": { "channel": "...", "event": "...", "payload": {...} } }`. Non-PHP services can publish to the Redis channel if they have network access and authentication. For Pusher/Ably drivers, the external HTTP API is the bridge. Pusher requires HMAC-SHA256 signed requests with the app key and secret. The `pusher-http-php` package can be replaced by any HTTP client in any language that implements the same signing algorithm. Ably provides REST API with Basic or Token authentication, simpler to use cross-language. The gap is widest with Reverb's Redis scaling channel, which was designed for Reverb-to-Reverb communication, not cross-language publishing.

## Patterns
- **Pusher/Ably HTTP API bridge**: Use the broadcast driver's external API as the cross-language interface
- **Redis pub/sub with agreed JSON format**: Publish to Reverb's scaling channel in the expected JSON schema
- **Custom HTTP broadcast endpoint**: Create a Laravel API route that accepts external events and dispatches them through the standard broadcasting pipeline
- **Message queue bridge**: Use a shared message queue (RabbitMQ, Kafka) to relay events between services; a Laravel consumer picks them up and broadcasts

## Architectural Decisions
- **Laravel as broadcast gateway**: All external services publish to a Laravel API endpoint; Laravel broadcasts via standard pipeline
- **Pusher/Ably as universal bridge**: These managed services have HTTP APIs consumable from any language
- **Shared Redis format for Reverb (advanced)**: Direct Redis publishing requires matching Reverb's internal message schema and handling authentication manually

## Tradeoffs
- **Laravel gateway adds latency**: External service → Laravel HTTP → queue → Reverb adds hops vs. direct Redis publishing
- **Direct Redis publishing is brittle**: Depends on Reverb's internal message format, which could change between versions
- **Pusher/Ably cost**: Using managed services for cross-language bridging adds connection/message costs
- **Custom broadcast endpoint requires auth**: The Laravel gateway endpoint must authenticate external services (API keys, tokens)
- **Serialization mismatch**: PHP objects serialized to JSON may not match expectations of non-PHP publishers (type hints, empty arrays vs objects)

## Performance Considerations
- Laravel gateway adds HTTP request + queue processing overhead (50-200ms) vs direct Redis pub/sub (1-5ms)
- Pusher/Ably HTTP API adds network round-trip latency (10-50ms depending on region)
- Direct Redis publishing is fastest but tightly couples the publisher to Reverb's internal format
- Batch publishing: send multiple events in a single API call to reduce HTTP overhead

## Production Considerations
- Create a dedicated API endpoint in Laravel for external service event publishing with authentication
- Validate external event payloads before dispatching (channel authorization, payload constraints)
- Log all cross-language broadcast events for audit and debugging
- Document the expected event format for external services
- Monitor the bridge for failures (external service connectivity, auth failures, format errors)
- Version the external broadcast API to allow evolution of the message format independent of internal broadcast changes

## Common Mistakes
- Assuming Reverb's Redis scaling channel is a public API for cross-language publishing (it's an internal communication channel)
- Sending PHP-serialized events to non-PHP services (use JSON)
- Not authenticating the external broadcast endpoint, allowing unauthorized event publishing
- Exposing the Laravel broadcast driver credentials (REVERB_KEY, REVERB_SECRET) to external services
- Not handling broadcast failures gracefully in external services (retry, dead-letter queue)

## Failure Modes
- **Message format mismatch**: Reverb update changes internal JSON schema; external publishers send invalid messages
- **Auth bypass**: External service accesses the Redis scaling channel without proper authentication; publishes unauthorized events
- **Event flooding**: External service publishes events at a rate that overwhelms the broadcast system
- **Payload validation failure**: External service sends payload with data types incompatible with Echo client expectations
- **Serialization boundary error**: PHP-specific data types (DateTime, Carbon, collections) not properly serialized when published from non-PHP services

## Ecosystem Usage
- Microservice architectures where non-Laravel services need to push real-time events to Laravel-connected clients
- Node.js microservices (real-time analytics, AI streaming) broadcasting to Laravel Echo subscribers
- Event-driven architectures where domain events from multiple services are centralized through Laravel broadcasting
- Polyglot environments where PHP handles web serving but other languages handle async processing
- Integration with external event sources (third-party webhooks, IoT device data)

## Related Knowledge Units
- K01: Laravel Broadcasting Architecture
- K04: Reverb Horizontal Scaling via Redis
- K06: Pusher Channels Integration
- K07: Ably Integration & Enterprise Features

## Research Notes
Cross-language pub/sub bridging is an architectural concern that arises in polyglot microservice environments. The recommended approach is to create a Laravel broadcast gateway endpoint rather than publishing directly to Reverb's Redis channel. This provides a stable contract (HTTP API) and handles authentication, validation, and error handling. Reverb v1.7+ switched to JSON for internal Redis messages, which is more cross-language friendly but still not a documented public API. Pusher's HTTP API is the most mature cross-language broadcast interface, with official SDKs in PHP, Node.js, Python, Ruby, Go, and Java. Ably's REST API is similarly well-documented. For new polyglot architectures, using Pusher or Ably as the broadcast backend is simpler than building a custom bridge around Reverb's Redis channel.
