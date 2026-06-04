# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** webhook-gateways
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Circuit breaker implemented for gateway API calls
- [ ] Events stored locally before gateway dispatch
- [ ] Gateway delivery latency and failure rates monitored
- [ ] Design Events as Standard Webhooks Compliant
- [ ] Implement Circuit Breaker for Gateway API Calls
- [ ] Monitor Gateway Delivery Latency and Failure Rates
- [ ] Store Events Locally Before Sending to Gateway
- [ ] Use Gateway for 50+ Subscribers; Self-Hosted for <20
- [ ] Delivery monitoring via gateway dashboard
- [ ] Gateway SDK/API integrated
- [ ] Retry policies configured in gateway
- [ ] Choose webhook gateway provider
- [ ] Configure gateway: endpoints, signing secrets, retry policies
- [ ] Dispatch webhooks via gateway API

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Choose webhook gateway provider
- [ ] Configure gateway: endpoints, signing secrets, retry policies
- [ ] Dispatch webhooks via gateway API
- [ ] Handle gateway webhook status callbacks
- [ ] Integrate gateway SDK or API into Laravel
- [ ] Register subscriber endpoints in gateway
- [ ] Test delivery with gateway's sandbox environment
- [ ] Use gateway's dashboard for delivery monitoring
- [ ] Design Events as Standard Webhooks Compliant
- [ ] Implement Circuit Breaker for Gateway API Calls
- [ ] Monitor Gateway Delivery Latency and Failure Rates
- [ ] Store Events Locally Before Sending to Gateway

---

# Performance Checklist

- [ ] Gateway adds 10-50ms latency per event (app â†’ gateway â†’ subscriber)
- [ ] Gateway auto-scales delivery infrastructure; self-hosted requires manual scaling
- [ ] Gateway fan-out: total time = slowest subscriber response
- [ ] Self-hosted: depends on queue worker throughput and connection pool capacity

---

# Security Checklist

- [ ] Data processing agreements (DPA) required with gateway provider for compliance
- [ ] Gateway handles signing; use Standard Webhooks so receivers verify independently
- [ ] Never send sensitive data through gateway without encryption
- [ ] Rotate gateway API keys and webhook secrets regularly
- [ ] Test gateway failover and recovery before production

---

# Reliability Checklist

- [ ] Assuming gateway eliminates need for receiver-side idempotency
- [ ] Gateway as event source of truth (gateway is delivery mechanism, not event store)
- [ ] Ignoring data residency (gateway may process in non-compliant regions)
- [ ] Not storing events locally before sending to gateway (losing events if gateway is down)
- [ ] Sending all events through gateway including low-value internal ones (unnecessary cost)
- [ ] Implement Circuit Breaker for Gateway API Calls

---

# Testing Checklist

- [ ] Circuit breaker implemented for gateway API calls
- [ ] Delivery monitoring via gateway dashboard
- [ ] Events stored locally before gateway dispatch
- [ ] Gateway delivery latency and failure rates monitored
- [ ] Gateway outage recovery procedures documented
- [ ] Gateway SDK/API integrated
- [ ] Gateway vs self-hosted decision documented with rationale
- [ ] Retry policies configured in gateway
- [ ] Sandbox testing completed
- [ ] Standard Webhooks format used for portability

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Gateway Dependency Without Local Event Backup]
- [ ] [Sending All Events Through Gateway Including Low-Value Internal Ones]
- [ ] [Gateway as Event Source of Truth]
- [ ] [Single Gateway Provider Without Fallback Plan]
- [ ] [No Monitoring of Gateway Delivery Performance]

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


