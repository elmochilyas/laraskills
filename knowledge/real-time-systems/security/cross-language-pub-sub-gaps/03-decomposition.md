# Decomposition: Cross Language Pub Sub Gaps

## Topic Overview
Laravel's broadcasting system assumes a PHP-centric architecture where both the event dispatcher and the WebSocket server understand Laravel's event serialization format. When non-Laravel (or non-PHP) services need to publish broadcast events, they must bridge the gap in serialization, authentication, and protocol. The standard broadcast driver (Pusher, Reverb, Ably) expects events formatted with specific fields (channel, event name, payload) and authenticated with the app key/secret. Cross-l...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security/K39-cross-language-pub-sub-gaps/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cross Language Pub Sub Gaps
- **Purpose:** Laravel's broadcasting system assumes a PHP-centric architecture where both the event dispatcher and the WebSocket server understand Laravel's event serialization format. When non-Laravel (or non-PHP) services need to publish broadcast events, they must bridge the gap in serialization, authentication, and protocol. The standard broadcast driver (Pusher, Reverb, Ably) expects events formatted with specific fields (channel, event name, payload) and authenticated with the app key/secret. Cross-l...
- **Difficulty:** Advanced
- **Dependencies:
  - K01: Laravel Broadcasting Architecture
  - K04: Reverb Horizontal Scaling via Redis
  - K06: Pusher Channels Integration
  - K07: Ably Integration & Enterprise Features

## Dependency Graph
**Depends on:**
  - K01: Laravel Broadcasting Architecture
  - K04: Reverb Horizontal Scaling via Redis
  - K06: Pusher Channels Integration
  - K07: Ably Integration & Enterprise Features

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Pusher/Ably HTTP API bridge**: Use the broadcast driver's external API as the cross-language interface**Redis pub/sub with agreed JSON format**: Publish to Reverb's scaling channel in the expected JSON schema**Custom HTTP broadcast endpoint**: Create a Laravel API route that accepts external events and dispatches them through the standard broadcasting pipeline**Message queue bridge**: Use a shared message queue (RabbitMQ, Kafka) to relay events between services; a Laravel consumer picks them up and broadcasts**Laravel as broadcast gateway**: All external services publish to a Laravel API endpoint; Laravel broadcasts via standard pipeline**Pusher/Ably as universal bridge**: These managed services have HTTP APIs consumable from any language**Shared Redis format for Reverb (advanced)**: Direct Redis publishing requires matching Reverb's internal message schema and handling authentication manually**Laravel gateway adds latency**: External service → Laravel HTTP → queue → Reverb adds hops vs. direct Redis publishing**Direct Redis publishing is brittle**: Depends on Reverb's internal message format, which could change between versions**Pusher/Ably cost**: Using managed services for cross-language bridging adds connection/message costs**Custom broadcast endpoint requires auth**: The Laravel gateway endpoint must authenticate external services (API keys, tokens)**Serialization mismatch**: PHP objects serialized to JSON may not match expectations of non-PHP publishers (type hints, empty arrays vs objects)Laravel gateway adds HTTP request + queue processing overhead (50-200ms) vs direct Redis pub/sub (1-5ms)Pusher/Ably HTTP API adds network round-trip latency (10-50ms depending on region)Direct Redis publishing is fastest but tightly couples the publisher to Reverb's internal formatBatch publishing: send multiple events in a single API call to reduce HTTP overheadCreate a dedicated API endpoint in Laravel for external service event publishing with authenticationValidate external event payloads before dispatching (channel authorization, payload constraints)Log all cross-language broadcast events for audit and debuggingDocument the expected event format for external servicesMonitor the bridge for failures (external service connectivity, auth failures, format errors)Version the external broadcast API to allow evolution of the message format independent of internal broadcast changesAssuming Reverb's Redis scaling channel is a public API for cross-language publishing (it's an internal communication channel)Sending PHP-serialized events to non-PHP services (use JSON)Not authenticating the external broadcast endpoint, allowing unauthorized event publishingExposing the Laravel broadcast driver credentials (REVERB_KEY, REVERB_SECRET) to external servicesNot handling broadcast failures gracefully in external services (retry, dead-letter queue)**Message format mismatch**: Reverb update changes internal JSON schema; external publishers send invalid messages**Auth bypass**: External service accesses the Redis scaling channel without proper authentication; publishes unauthorized events**Event flooding**: External service publishes events at a rate that overwhelms the broadcast system**Payload validation failure**: External service sends payload with data types incompatible with Echo client expectations**Serialization boundary error**: PHP-specific data types (DateTime, Carbon, collections) not properly serialized when published from non-PHP servicesMicroservice architectures where non-Laravel services need to push real-time events to Laravel-connected clientsNode.js microservices (real-time analytics, AI streaming) broadcasting to Laravel Echo subscribersEvent-driven architectures where domain events from multiple services are centralized through Laravel broadcastingPolyglot environments where PHP handles web serving but other languages handle async processingIntegration with external event sources (third-party webhooks, IoT device data)K01: Laravel Broadcasting ArchitectureK04: Reverb Horizontal Scaling via RedisK06: Pusher Channels IntegrationK07: Ably Integration & Enterprise Features

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