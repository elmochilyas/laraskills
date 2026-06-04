# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** timeout-handling
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connect timeout configured (2-5s)
- [ ] Queue job timeout exceeds expected API call time
- [ ] Request timeout configured (15-30s)
- [ ] Always Configure Both Connect and Request Timeouts
- [ ] Combine Timeout with Retry
- [ ] Configure Queue Job Timeout to Exceed Max API Time
- [ ] Log Timeout Exceptions with Context
- [ ] Set Timeout Configuration in Service Class, Not Per Call
- [ ] Connection timeout set (default 10s)
- [ ] Repeated timeout alerts configured
- [ ] Request timeout set (default 30s)
- [ ] Alert on repeated timeouts to the same endpoint
- [ ] Configure timeouts per external service based on SLA
- [ ] For Saloon: configure timeout in Connector's `defaultHeaders()` or `defaultConfig()`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Alert on repeated timeouts to the same endpoint
- [ ] Configure timeouts per external service based on SLA
- [ ] For Saloon: configure timeout in Connector's `defaultHeaders()` or `defaultConfig()`
- [ ] Handle timeout exceptions (`ConnectionException`, `TimeoutException`)
- [ ] Log timeout events with duration and request details
- [ ] Set connection timeout (default: 10 seconds) for TCP handshake
- [ ] Set request timeout (default: 30 seconds) for full request/response
- [ ] Use `$client->timeout(30)->connectTimeout(10)` for Http facade
- [ ] Always Configure Both Connect and Request Timeouts
- [ ] Combine Timeout with Retry
- [ ] Configure Queue Job Timeout to Exceed Max API Time
- [ ] Log Timeout Exceptions with Context

---

# Performance Checklist

- [ ] Connection timeout at 2s handles transient network issues without blocking workers
- [ ] Longer timeouts reduce false failures but risk cascading resource exhaustion
- [ ] Queue job timeout must account for retry delay between attempts
- [ ] Shorter timeouts free resources faster but increase failure rate for slow services

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] No timeout configured (defaults to 0 = infinite, worker hangs forever)
- [ ] Queue job timeout shorter than API call + retry delays (job forced-failed before retry completes)
- [ ] Same timeout for connect and request (should be different: connect 5s, request 30s)
- [ ] Timeout without retry (single timeout failure = permanent failure for transient blips)
- [ ] Always Configure Both Connect and Request Timeouts
- [ ] Combine Timeout with Retry
- [ ] Configure Queue Job Timeout to Exceed Max API Time
- [ ] Log Timeout Exceptions with Context
- [ ] Set Timeout Configuration in Service Class, Not Per Call

---

# Testing Checklist

- [ ] Connect timeout configured (2-5s)
- [ ] Connection timeout set (default 10s)
- [ ] Queue job timeout exceeds expected API call time
- [ ] Repeated timeout alerts configured
- [ ] Request timeout configured (15-30s)
- [ ] Request timeout set (default 30s)
- [ ] Timeout + retry combination handles transient failures
- [ ] Timeout events logged with details
- [ ] Timeout exceptions handled gracefully
- [ ] Timeout exceptions logged with context

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Timeout Configured (Infinite Wait, Worker Hangs)]
- [ ] [Only Request Timeout Without Connect Timeout]
- [ ] [Queue Job Timeout Shorter Than API Call Time]
- [ ] [Same Timeout for All Retry Attempts]
- [ ] [Timeout Exceptions Not Logged]
- [ ] [Timeout Without Retry (Transient Becomes Permanent)]

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


