# Metadata

**Domain:** real-time-systems
**Subdomain:** advanced-patterns
**Knowledge Unit:** client-events-whisper-typing-indicators
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `max_messages_per_second` is configured in Reverb
- [ ] Client event volume is monitored for abuse detection
- [ ] Client events work on private/presence channels (not public)
- [ ] Always Implement Client-Side Throttling for High-Frequency Events
- [ ] Always Monitor Client Event Volume for Abuse Detection
- [ ] Always Use Echo's whisper() Method, Not Manual client- Prefix
- [ ] Always Validate Client Event Payloads on the Receiving Client
- [ ] Never Send Client Events on Public Channels
- [ ] `REVERB_MAX_MESSAGES_PER_SECOND` configured in Reverb
- [ ] Client event volume monitored for abuse detection
- [ ] Client events used on private or presence channels only
- [ ] Batch cursor updates at 30-60ms intervals instead of per-mousemove
- [ ] Configure `REVERB_MAX_MESSAGES_PER_SECOND` in Reverb for server-side rate limit
- [ ] Implement client-side throttling: typing indicators max 1 per 2-3 seconds
- [ ] Client event volume stays within acceptable limits (Reverb metrics)
- [ ] Client events fire at throttled rates (typing â‰¤1/3s, cursor batched 30-60ms)
- [ ] No sensitive data transmitted through client events

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Batch cursor updates at 30-60ms intervals instead of per-mousemove
- [ ] Configure `REVERB_MAX_MESSAGES_PER_SECOND` in Reverb for server-side rate limit
- [ ] Implement client-side throttling: typing indicators max 1 per 2-3 seconds
- [ ] Monitor client event volume via Reverb metrics
- [ ] Receive client events with `listenForWhisper('eventName', callback)`
- [ ] Send client events with `whisper('eventName', payload)` â€” Echo auto-prefixes `client-`
- [ ] Subscribe to a private or presence channel via Echo
- [ ] Validate payloads on the receiving client before using data
- [ ] Always Implement Client-Side Throttling for High-Frequency Events
- [ ] Always Monitor Client Event Volume for Abuse Detection
- [ ] Always Use Echo's whisper() Method, Not Manual client- Prefix
- [ ] Always Validate Client Event Payloads on the Receiving Client

---

# Performance Checklist

- [ ] Client events bypass the queue entirelyâ€”no queue worker overhead
- [ ] Each client event generates a WebSocket message to all other subscribers; O(n) fan-out cost
- [ ] For presence channels, client events fan out to all members; channel size directly impacts traffic
- [ ] High-frequency events should be throttled client-side (debounce 50-100ms)
- [ ] Payload size directly impacts WebSocket bandwidthâ€”keep payloads minimal
- [ ] `REVERB_MAX_MESSAGES_PER_SECOND` prevents per-connection abuse
- [ ] Client events bypass the queue entirely â€” zero server-side processing cost
- [ ] No server-side validation â€” validate payloads on receiving client

---

# Security Checklist

- [ ] Any client on the channel can send and receive client events
- [ ] Client events on public channels allow any connected client to impersonate any user
- [ ] Consider rate limiting client events per connection in Reverb config (`max_messages_per_second`)
- [ ] Never trust client event data; always validate on the receiving client
- [ ] No server-side validation: malformed or malicious payloads reach other clients unchecked
- [ ] No server-side validation â€” validate payloads on receiving client

---

# Reliability Checklist

- [ ] Client event abuse degrades channel
- [ ] Client events never received
- [ ] Event name doubled (`client-client-`)
- [ ] Sender receives own events
- [ ] WebSocket flooded with events
- [ ] Always Implement Client-Side Throttling for High-Frequency Events
- [ ] Always Monitor Client Event Volume for Abuse Detection
- [ ] Always Use Echo's whisper() Method, Not Manual client- Prefix
- [ ] Always Validate Client Event Payloads on the Receiving Client
- [ ] Never Send Client Events on Public Channels

---

# Testing Checklist

- [ ] `max_messages_per_second` is configured in Reverb
- [ ] `REVERB_MAX_MESSAGES_PER_SECOND` configured in Reverb
- [ ] Client event volume is monitored for abuse detection
- [ ] Client event volume monitored for abuse detection
- [ ] Client event volume stays within acceptable limits (Reverb metrics)
- [ ] Client events fire at throttled rates (typing â‰¤1/3s, cursor batched 30-60ms)
- [ ] Client events used on private or presence channels only
- [ ] Client events work on private/presence channels (not public)
- [ ] Client-side throttling implemented for typing indicators
- [ ] Client-side throttling is implemented for high-frequency events

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Client Events on Public Channels]
- [ ] [No Throttling on Typing Indicators (Per-Keystroke Events)]
- [ ] [Sensitive Data in Client Event Payloads]
- [ ] [No Validation of Client Event Payloads on Receiving Side]
- [ ] [Manual client- Prefix Causing Double Prefixing]
- [ ] Client events on public channels
- [ ] Server replacement
- [ ] Unthrottled high-frequency events

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


