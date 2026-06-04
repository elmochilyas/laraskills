# ECC Anti-Patterns — Cross-Language Pub/Sub Gaps

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Security |
| **Knowledge Unit** | Cross-Language Pub/Sub Gaps |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Publishing Directly to Reverb's Redis Channel from External Services
2. Exposing Broadcast Credentials to External Services
3. No Payload Validation for External Events
4. No Versioning on External Broadcast API
5. Sending PHP-Serialized Events to Non-PHP Services

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Publishing Directly to Reverb's Redis Channel from External Services

### Category
Architecture

### Description
External (non-Laravel) services publishing broadcast events directly to Reverb's Redis scaling channel instead of using a Laravel gateway endpoint, creating brittle integration coupled to internal infrastructure.

### Warning Signs
- Python, Node.js, or other services connect directly to Reverb's Redis
- External code publishes to `reverb-production` Redis channel
- Integration breaks after Reverb version updates
- No Laravel application involvement in external event publishing

### Why It Is Harmful
Reverb's Redis scaling channel is an internal communication bus with a specific JSON schema that may change between versions. Publishing directly couples external services to internal infrastructure details. The schema, channel name, and serialization format are not public APIs. A Reverb update can silently break all external integrations. There is no authentication, validation, or rate limiting on direct Redis publishing.

### Real-World Consequences
A Node.js microservice publishes events directly to Reverb's Redis channel using JSON. Reverb v2.0 changes the internal message schema. The microservice continues publishing the old format. Events are silently dropped. The team discovers the issue 3 days later when users report missing real-time updates.

### Preferred Alternative
Create a dedicated Laravel API gateway endpoint for external services to publish broadcast events.

### Refactoring Strategy
1. Create a POST route in Laravel for external broadcasts
2. Implement API key authentication for external services
3. Add payload validation before broadcasting
4. Have external services call the gateway instead of publishing to Redis directly

### Detection Checklist
- [ ] External services publish directly to Redis
- [ ] No Laravel gateway endpoint for external broadcasts
- [ ] Integration breaks after Reverb version updates

### Related Rules
- (Rule: Always use a Laravel broadcast gateway for external services)

---

## Anti-Pattern 2: Exposing Broadcast Credentials to External Services

### Category
Security

### Description
Sharing `REVERB_KEY`, `REVERB_SECRET`, or `PUSHER_APP_SECRET` with non-Laravel services, granting full broadcast system access and creating a security risk if those services are compromised.

### Warning Signs
- External services have access to `REVERB_SECRET` or `PUSHER_APP_SECRET`
- Broadcast credentials stored in external service config files
- No scoped API keys for external broadcast access
- External services can broadcast to any channel

### Why It Is Harmful
Broadcast credentials provide full access to the WebSocket broadcasting system — the ability to publish events to any channel, manage channels, and access app settings. If an external service is compromised, the attacker gains unrestricted broadcast access. They can inject arbitrary events into any channel, impersonate any user, or flood the system.

### Real-World Consequences
A Python analytics service has `PUSHER_APP_SECRET` in its config to publish events. The Python service is compromised via a dependency vulnerability. The attacker uses the secret to publish fake "payment received" events to all users' notification channels. Thousands of users see fraudulent payment notifications before the issue is contained.

### Preferred Alternative
Use a Laravel gateway endpoint with scoped API keys that limit what channels and events each external service can publish.

### Refactoring Strategy
1. Remove broadcast credentials from all external services
2. Create a gateway endpoint with scoped API keys
3. Implement channel-level authorization for external broadcasts
4. Rotate compromised broadcast credentials

### Detection Checklist
- [ ] Broadcast credentials shared with external services
- [ ] No scoped API key for external integrations
- [ ] External services can publish to any channel

### Related Rules
- (Rule: Never expose Laravel broadcast credentials to external services)

---

## Anti-Pattern 3: No Payload Validation for External Events

### Category
Security

### Description
Broadcasting events from external services without validating the payload, allowing malformed or malicious data to reach all connected clients.

### Warning Signs
- External events broadcast with no server-side validation
- Raw request data passed directly to broadcast
- No schema or type checking on external payloads
- Oversized payloads accepted without truncation

### Why It Is Harmful
External services may send malformed, oversized, or malicious payloads that crash Echo clients, expose data, or inject XSS. Without validation, the Laravel gateway passes the raw payload through the broadcast pipeline. All connected clients receive the unchecked data. A single malicious broadcast can affect every user simultaneously.

### Real-World Consequences
An external integration service sends a broadcast with a 1MB payload containing malicious JavaScript. The payload is broadcast to all 5000 connected clients. The frontend notification component renders the payload unsanitized. XSS executes in all 5000 browsers. User session cookies are exfiltrated.

### Preferred Alternative
Validate and sanitize all external event payloads before broadcasting. Enforce payload size limits, schema validation, and type checking.

### Refactoring Strategy
1. Implement request validation on the broadcast gateway endpoint
2. Validate channel names, event names, and payload structure
3. Enforce maximum payload size
4. Sanitize string fields in the payload
5. Log rejected payloads for debugging

### Detection Checklist
- [ ] No validation on external broadcast payloads
- [ ] Raw external data passed to broadcast
- [ ] Payload size limits not enforced

### Related Rules
- (Rule: Always validate external event payloads)

---

## Anti-Pattern 4: No Versioning on External Broadcast API

### Category
Maintainability

### Description
Exposing an unversioned broadcast gateway endpoint, causing any schema change to break all external consumers simultaneously.

### Warning Signs
- Broadcast gateway endpoint at `/broadcast` (no version prefix)
- No API versioning strategy documented
- Schema changes require simultaneous updates across all services
- External consumers break on deployment

### Why It Is Harmful
Without versioning, any change to the broadcast payload format, authentication mechanism, or endpoint behavior breaks all external consumers simultaneously. Teams must coordinate updates across all services at the same time. Legacy consumers cannot continue using the old format during migration.

### Real-World Consequences
A team changes the broadcast payload format to include a new required field. External services from 5 different teams all break simultaneously. Each team must update their service during the same deployment window. The migration takes 3 weeks because of scheduling conflicts. Broadcasting from external services is broken for 3 weeks.

### Preferred Alternative
Version the broadcast gateway endpoint (e.g., `/api/v1/broadcast`) to allow gradual migration.

### Refactoring Strategy
1. Add version prefix to the broadcast gateway route
2. Maintain the existing endpoint as deprecated for legacy consumers
3. Announce migration timeline for v2
4. Remove deprecated endpoint after all consumers migrate

### Detection Checklist
- [ ] No version prefix on broadcast gateway
- [ ] Schema changes break all consumers simultaneously
- [ ] No deprecation strategy for old formats

### Related Rules
- (Rule: Always version the external broadcast API)

---

## Anti-Pattern 5: Sending PHP-Serialized Events to Non-PHP Services

### Category
Architecture

### Description
Assuming PHP-serialized event data can be consumed by non-PHP services in a cross-language broadcasting architecture, causing deserialization failures.

### Warning Signs
- Non-PHP services try to read PHP-serialized broadcast data
- External services receive unparseable data from broadcasting
- PHP serialize format used in cross-language API contracts
- No JSON serialization step for cross-language events

### Why It Is Harmful
PHP's `serialize()` format is specific to PHP and cannot be deserialized by Python, Node.js, Java, or other languages. Broadcasting PHP serialized data to non-PHP services results in complete parse failures. The data is silently dropped or causes errors in the consumer service.

### Real-World Consequences
A Laravel event broadcasts to a Node.js microservice that processes order updates. The event payload uses PHP serialization. The Node.js service receives unparseable binary data and throws an error. The error is caught silently and the event is lost. Order updates from Laravel never reach the Node.js service.

### Preferred Alternative
Always use JSON format for cross-language broadcast event data. Laravel events should return data as arrays (which serialize to JSON), not as serialized PHP objects.

### Refactoring Strategy
1. Ensure all broadcast event `broadcastWith()` methods return plain arrays
2. Remove PHP object references from broadcast payloads
3. Test cross-language deserialization with actual consumers
4. Add schema documentation for each cross-language event

### Detection Checklist
- [ ] PHP serialization used in cross-language events
- [ ] Non-PHP services receive unparseable data
- [ ] `broadcastWith()` returns objects instead of arrays

### Related Rules
- (Rule: Always use JSON for cross-language broadcast events)
