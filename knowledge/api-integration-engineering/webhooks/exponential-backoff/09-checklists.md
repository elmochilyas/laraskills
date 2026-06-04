# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** exponential-backoff
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Backoff reset on successful delivery
- [ ] Dead-letter queue for final failures
- [ ] Jitter implemented (full jitter recommended)
- [ ] Always Add Jitter to Backoff Delays
- [ ] Cap Maximum Backoff Delay
- [ ] Log Backoff State for Each Retry Sequence
- [ ] Reasoning
- [ ] Reset Backoff Count on First Successful Delivery
- [ ] Dead-letter handling after max retries
- [ ] Jitter added to prevent thundering herd
- [ ] Maximum delay configured and applied
- [ ] Add jitter: `delay += random(0, delay * 0.1)` to prevent thundering herd
- [ ] Cap maximum delay (e.g., 24 hours)
- [ ] Configure retry in Spatie Webhook Server or custom job

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add jitter: `delay += random(0, delay * 0.1)` to prevent thundering herd
- [ ] Cap maximum delay (e.g., 24 hours)
- [ ] Configure retry in Spatie Webhook Server or custom job
- [ ] Define retry schedule: 1min, 5min, 15min, 1hr, 6hr, 24hr
- [ ] Implement dead-letter after max retries
- [ ] Implement exponential backoff: `delay = base * (2 ^ attempt)`
- [ ] Log retry attempts and delays for monitoring
- [ ] Set maximum retry attempts (e.g., 6-10)
- [ ] Always Add Jitter to Backoff Delays
- [ ] Cap Maximum Backoff Delay
- [ ] Log Backoff State for Each Retry Sequence
- [ ] Reasoning

---

# Performance Checklist

- [ ] Backoff computation is sub-millisecond
- [ ] Full jitter causes ~50% expected delay vs pure exponential
- [ ] No additional resource consumption during backoff delay
- [ ] Queue-based retry uses available_at column for efficient polling

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Implementing backoff in database (expensive) instead of queue
- [ ] No maximum delay cap (retries after days for transient issue)
- [ ] Not adding jitter (thundering herd on recovery)
- [ ] Not resetting backoff count on first successful delivery
- [ ] Starting with too-small initial delay (<1s)
- [ ] Always Add Jitter to Backoff Delays
- [ ] Cap Maximum Backoff Delay
- [ ] Log Backoff State for Each Retry Sequence
- [ ] Reset Backoff Count on First Successful Delivery

---

# Testing Checklist

- [ ] Backoff reset on successful delivery
- [ ] Dead-letter handling after max retries
- [ ] Dead-letter queue for final failures
- [ ] Jitter added to prevent thundering herd
- [ ] Jitter implemented (full jitter recommended)
- [ ] Maximum attempts configured based on SLA
- [ ] Maximum delay cap configured
- [ ] Maximum delay configured and applied
- [ ] Maximum retry count configured
- [ ] Retry delays logged for monitoring

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Pure Exponential Backoff Without Jitter (Thundering Herd)]
- [ ] [No Maximum Delay Cap (Infinite Retry Horizon)]
- [ ] [Ignoring Retry-After Header on 429 Responses]
- [ ] [Sub-Second Initial Delay (Wasted Attempt Budget)]
- [ ] [No Attempt Counter Reset on Success (Inherited Inflated Delay)]
- [ ] [Maximum Attempts Set Arbitrarily (SLA Mismatch)]

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


