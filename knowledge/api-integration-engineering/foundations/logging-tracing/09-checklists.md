# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** logging-tracing
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All outbound HTTP calls logged with duration and status
- [ ] Correlation IDs across integration request chains
- [ ] Log pruning configured and operational
- [ ] Enable Telescope with Sampling in Production
- [ ] Implement Log Pruning with Retention Policy
- [ ] Log All Outbound API Calls with Duration and Status
- [ ] Redact Sensitive Data Before Logging
- [ ] Use Correlation IDs Across Request Chains
- [ ] Correlation ID on every logged API call
- [ ] Error logs include full request/response context
- [ ] Request logs include method, URL, correlation ID
- [ ] Add correlation ID to every outgoing request (UUID per request lifecycle)
- [ ] Configure log sampling for high-volume endpoints
- [ ] For SaloonPHP: use global middleware for request/response logging

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add correlation ID to every outgoing request (UUID per request lifecycle)
- [ ] Configure log sampling for high-volume endpoints
- [ ] For SaloonPHP: use global middleware for request/response logging
- [ ] Include correlation ID in Guzzle middleware or Http facade macro
- [ ] Log errors with full context: exception, request, response
- [ ] Log request start: method, URL, headers (excluding auth), correlation ID
- [ ] Log response: status code, duration, response summary, correlation ID
- [ ] Use structured logging (JSON format) for log aggregation
- [ ] Enable Telescope with Sampling in Production
- [ ] Implement Log Pruning with Retention Policy
- [ ] Log All Outbound API Calls with Duration and Status
- [ ] Redact Sensitive Data Before Logging

---

# Performance Checklist

- [ ] Production sampling reduces overhead proportionally
- [ ] Storage grows proportionally to request volume; implement pruning
- [ ] Structured logging adds <1ms per entry
- [ ] Telescope adds ~5-15ms per HTTP request (middleware + storage write)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Leaving full Telescope capture in production (storage overflow)
- [ ] Logging full response bodies without size limits
- [ ] Not implementing pruning, causing unbounded storage growth
- [ ] Not redacting sensitive data (API keys visible in Telescope dashboard)

---

# Testing Checklist

- [ ] All outbound HTTP calls logged with duration and status
- [ ] Correlation ID on every logged API call
- [ ] Correlation IDs across integration request chains
- [ ] Error logs include full request/response context
- [ ] Log pruning configured and operational
- [ ] Request logs include method, URL, correlation ID
- [ ] Response logs include status, duration, correlation ID
- [ ] Sampling configured for high-volume endpoints
- [ ] Sensitive data redacted from logs
- [ ] Structured logging format (JSON)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Logging on Outbound API Calls]
- [ ] [Sensitive Data Exposure in Logs]
- [ ] [Full Telescope Capture in Production Without Sampling]
- [ ] [Missing Correlation IDs Across Request Chains]
- [ ] [Unbounded Log/Telescope Storage Growth]

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


