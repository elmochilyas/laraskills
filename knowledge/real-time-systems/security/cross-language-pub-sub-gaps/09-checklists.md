# Metadata

**Domain:** real-time-systems
**Subdomain:** security
**Knowledge Unit:** cross-language-pub-sub-gaps
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Broadcast driver credentials not exposed to external services
- [ ] Broadcast gateway endpoint created for external services
- [ ] Cross-language events logged for audit
- [ ] Always Log Cross-Language Broadcast Events for Audit
- [ ] Always Use a Laravel Broadcast Gateway for External Services
- [ ] Always Validate External Event Payloads
- [ ] Always Version the External Broadcast API
- [ ] Never Expose Laravel Broadcast Credentials to External Services
- [ ] Broadcast driver credentials not exposed to external services
- [ ] Broadcast gateway endpoint created for external services
- [ ] Cross-language events logged for audit
- [ ] Create a POST route for the broadcast gateway (e.g., `/api/v1/broadcast`)
- [ ] Dispatch a Laravel event that triggers broadcasting
- [ ] Document the external API contract with example payloads
- [ ] All cross-language events are logged for audit and debugging
- [ ] Breaking changes to the API do not break existing external consumers
- [ ] External services authenticated and authorized correctly

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Create a POST route for the broadcast gateway (e.g., `/api/v1/broadcast`)
- [ ] Dispatch a Laravel event that triggers broadcasting
- [ ] Document the external API contract with example payloads
- [ ] Handle failures with retry and dead-letter queue
- [ ] Implement authentication: validate API key from external services
- [ ] Implement rate limiting on the gateway endpoint
- [ ] Log all cross-language broadcast events for audit
- [ ] Validate incoming payload: channel name, event name, payload structure and size
- [ ] Version the API endpoint (`/api/v1/`, `/api/v2/`) for future evolution
- [ ] Always Log Cross-Language Broadcast Events for Audit
- [ ] Always Use a Laravel Broadcast Gateway for External Services
- [ ] Always Validate External Event Payloads

---

# Performance Checklist

- [ ] Batch publishing: send multiple events in a single API call to reduce HTTP overhead
- [ ] Direct Redis publishing is fastest but tightly couples the publisher to Reverb's internal format
- [ ] Laravel gateway adds HTTP request + queue processing overhead (50-200ms) vs direct Redis pub/sub (1-5ms)
- [ ] Pusher/Ably HTTP API adds network round-trip latency (10-50ms depending on region)
- [ ] Laravel gateway adds 50-200ms overhead vs direct Redis pub/sub (1-5ms)
- [ ] Validate and sanitize all payloads from external services before broadcasting

---

# Security Checklist

- [ ] Direct Redis publishing requires Redis authentication and network isolation
- [ ] Never expose Laravel broadcast driver credentials (REVERB_KEY, REVERB_SECRET) to external services
- [ ] The broadcast gateway endpoint must authenticate external services (API keys, tokens)
- [ ] Validate and sanitize all payloads from external services before broadcasting
- [ ] Never expose `REVERB_KEY`, `REVERB_SECRET`, or `PUSHER_APP_SECRET` externally
- [ ] Rate limit the gateway to prevent external service abuse
- [ ] Validate and sanitize all payloads from external services before broadcasting

---

# Reliability Checklist

- [ ] Breaking changes break all external consumers
- [ ] External service compromise leaks broadcast access
- [ ] Malformed payload crashes Echo clients
- [ ] Non-PHP service cannot unserialize payload
- [ ] Always Log Cross-Language Broadcast Events for Audit
- [ ] Always Use a Laravel Broadcast Gateway for External Services
- [ ] Always Validate External Event Payloads
- [ ] Always Version the External Broadcast API
- [ ] Never Expose Laravel Broadcast Credentials to External Services

---

# Testing Checklist

- [ ] All cross-language events are logged for audit and debugging
- [ ] Breaking changes to the API do not break existing external consumers
- [ ] Broadcast driver credentials not exposed to external services
- [ ] Broadcast gateway endpoint created for external services
- [ ] Cross-language events logged for audit
- [ ] External broadcast API versioned
- [ ] External service authentication implemented (API key/token)
- [ ] External services authenticated and authorized correctly
- [ ] Failure handling with retry and dead-letter queue
- [ ] Failure handling with retry and dead-letter queue implemented

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Publishing Directly to Reverb's Redis Channel from External Services]
- [ ] [Exposing Broadcast Credentials to External Services]
- [ ] [No Payload Validation for External Events]
- [ ] [No Versioning on External Broadcast API]
- [ ] [Sending PHP-Serialized Events to Non-PHP Services]
- [ ] Exposing the Laravel app key/secret to external systems for direct Pusher API calls
- [ ] No payload validation for external events
- [ ] Publishing directly to Reverb's Redis channel from external services

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log all cross-language events for audit and debugging

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


