# Metadata

**Domain:** real-time-systems
**Subdomain:** websocket-servers
**Knowledge Unit:** ably-integration-enterprise-features
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `ABLY_LOG_LEVEL=error` in production
- [ ] `BROADCAST_CONNECTION=ably` configured
- [ ] Channel encryption rules configured for sensitive data
- [ ] Always Configure Message Retention Limits
- [ ] Always Set ABLY_LOG_LEVEL=error in Production
- [ ] Always Use Ably Webhooks for Presence and Error Monitoring
- [ ] Never Expose the Ably API Key in Client-Side Code
- [ ] Never Use Laravel's Generic Broadcast Interface for Advanced Ably Features
- [ ] `ABLY_LOG_LEVEL=error` in production
- [ ] `BROADCAST_CONNECTION=ably` configured
- [ ] Channel encryption rules configured for sensitive data
- [ ] Configure message retention limits on channels (cost control)
- [ ] For advanced features (Spaces, history), use Ably SDK directly (not Laravel broadcast interface)
- [ ] Implement rate limit handling with retry/backoff
- [ ] Advanced Ably features (Spaces, history) accessible via SDK
- [ ] Client connections use ephemeral tokens (no API key exposed)
- [ ] Laravel broadcasts events through Ably with guaranteed at-least-once delivery

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure message retention limits on channels (cost control)
- [ ] For advanced features (Spaces, history), use Ably SDK directly (not Laravel broadcast interface)
- [ ] Implement rate limit handling with retry/backoff
- [ ] Implement token authentication: generate ephemeral tokens server-side for client connections
- [ ] Install Ably: `composer require ably/ably-php` or `php artisan install:broadcasting --ably`
- [ ] Model cost projections for expected scale
- [ ] Set `ABLY_LOG_LEVEL=error` in production to prevent verbose logging
- [ ] Set `BROADCAST_CONNECTION=ably` and `ABLY_KEY` in `.env`
- [ ] Set up webhooks for presence events, channel lifecycle, and error monitoring
- [ ] Always Configure Message Retention Limits
- [ ] Always Set ABLY_LOG_LEVEL=error in Production
- [ ] Always Use Ably Webhooks for Presence and Error Monitoring

---

# Performance Checklist

- [ ] Ably claims <20ms global publish latency from any edge location
- [ ] Channel occupancy tracking adds minimal overhead
- [ ] Global edge network reduces latency for geographically distributed users
- [ ] Guaranteed delivery adds acknowledgment overhead vs fire-and-forget
- [ ] Message history consumes storage; retention policy controls costs
- [ ] Global edge network (205+ PoPs) reduces latency for distributed users
- [ ] Guaranteed delivery adds acknowledgment overhead vs fire-and-forget

---

# Security Checklist

- [ ] Ably provides SOC 2, HIPAA, and GDPR compliance certifications
- [ ] Channel rules support encryption at rest and in transit
- [ ] Never expose `ABLY_KEY` in client-side codeâ€”use token authentication
- [ ] Token-based authentication ensures clients have scoped access
- [ ] Ably provides SOC 2, HIPAA, GDPR compliance
- [ ] Never expose `ABLY_KEY` in client-side code
- [ ] Token authentication ensures clients have scoped access

---

# Reliability Checklist

- [ ] Ably API key leaked to client
- [ ] Ably Spaces not working through Echo
- [ ] Performance slow in production
- [ ] Storage costs growing unbounded
- [ ] Tokens expire, connections drop
- [ ] Always Configure Message Retention Limits
- [ ] Always Set ABLY_LOG_LEVEL=error in Production
- [ ] Always Use Ably Webhooks for Presence and Error Monitoring
- [ ] Never Expose the Ably API Key in Client-Side Code
- [ ] Never Use Laravel's Generic Broadcast Interface for Advanced Ably Features

---

# Testing Checklist

- [ ] `ABLY_LOG_LEVEL=error` in production
- [ ] `BROADCAST_CONNECTION=ably` configured
- [ ] Advanced Ably features (Spaces, history) accessible via SDK
- [ ] Channel encryption rules configured for sensitive data
- [ ] Client connections use ephemeral tokens (no API key exposed)
- [ ] Cost projections modeled for expected scale
- [ ] Laravel broadcasts events through Ably with guaranteed at-least-once delivery
- [ ] Message retention limits configured
- [ ] Message retention limits control storage costs
- [ ] Rate limit handling implemented

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Assuming Ably pricing matches Pusher
- [ ] Not testing token expiry behavior
- [ ] Using Ably's Pusher protocol mode when the Ably SDK is available

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


