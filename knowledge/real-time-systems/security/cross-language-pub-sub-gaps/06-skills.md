# Skill: Bridge Cross-Language Pub/Sub Gaps for Broadcasting

## Purpose
Enable non-Laravel services to publish broadcast events to Laravel-connected clients by creating a secure, versioned broadcast gateway API.

## When To Use
- Microservice architectures where non-Laravel services need to push real-time events
- Polyglot environments where PHP handles web serving, other languages handle async processing
- Integration with external event sources (third-party webhooks, IoT device data)
- Event-driven architectures with domain events from multiple services

## When NOT To Use
- Monolithic Laravel applications (no cross-language need)
- All-PHP microservice architectures
- Applications already using a single managed WebSocket service end-to-end

## Prerequisites
- Laravel application with broadcasting configured
- API route for broadcast gateway
- External service with HTTP client capability

## Inputs
- Broadcast gateway API route definition
- External service authentication (API key/token)
- Events to be broadcast (channel, event name, payload)

## Workflow
1. Create a POST route for the broadcast gateway (e.g., `/api/v1/broadcast`)
2. Implement authentication: validate API key from external services
3. Validate incoming payload: channel name, event name, payload structure and size
4. Dispatch a Laravel event that triggers broadcasting
5. Log all cross-language broadcast events for audit
6. Version the API endpoint (`/api/v1/`, `/api/v2/`) for future evolution
7. Implement rate limiting on the gateway endpoint
8. Handle failures with retry and dead-letter queue
9. Document the external API contract with example payloads

## Validation Checklist
- [ ] Broadcast gateway endpoint created for external services
- [ ] External service authentication implemented (API key/token)
- [ ] Payload validation before dispatching (channel, event name, structure)
- [ ] Cross-language events logged for audit
- [ ] Broadcast driver credentials not exposed to external services
- [ ] External broadcast API versioned
- [ ] Failure handling with retry and dead-letter queue
- [ ] Rate limiting on gateway endpoint

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Non-PHP service cannot unserialize payload | Sending PHP-serialized data | Use JSON format for all cross-language payloads |
| External service compromise leaks broadcast access | Broadcast credentials exposed externally | Use gateway endpoint with scoped API tokens |
| Malformed payload crashes Echo clients | No payload validation | Validate payload structure before broadcast |
| Breaking changes break all external consumers | Unversioned API | Add version prefix (`/api/v1/broadcast`) |

## Decision Points
- **Direct Redis vs Gateway**: Always use a Laravel gateway — direct Redis publishing couples external services to internal schema
- **Authentication method**: API key for service-to-service; OAuth2 for user-scoped publishing
- **Versioning strategy**: URL prefix (`/api/v1/`) is simplest; header-based for more flexibility

## Performance/Security Considerations
- Laravel gateway adds 50-200ms overhead vs direct Redis pub/sub (1-5ms)
- Never expose `REVERB_KEY`, `REVERB_SECRET`, or `PUSHER_APP_SECRET` externally
- Validate and sanitize all payloads from external services before broadcasting
- Rate limit the gateway to prevent external service abuse
- Log all cross-language events for audit and debugging

## Related Rules (from 05-rules.md)
- Always Use a Laravel Broadcast Gateway for External Services
- Never Expose Laravel Broadcast Credentials to External Services
- Always Validate External Event Payloads
- Always Version the External Broadcast API
- Always Log Cross-Language Broadcast Events for Audit

## Related Skills
- Configure and Operate Laravel Broadcasting Architecture
- Integrate Pusher Channels for Managed WebSocket Service

## Success Criteria
- Non-Laravel services can publish broadcast events via the gateway API
- External services authenticated and authorized correctly
- Malformed payloads are rejected before broadcasting
- Breaking changes to the API do not break existing external consumers
- All cross-language events are logged for audit and debugging
