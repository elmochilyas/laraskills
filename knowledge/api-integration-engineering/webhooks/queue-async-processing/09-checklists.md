# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** queue-async-processing
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `dispatchIfCommitted()` used after DB writes
- [ ] Job dispatched from webhook controller, no sync processing
- [ ] Job failure handling (failed_jobs table, alerts)
- [ ] Dispatch After Database Commit with dispatchIfCommitted
- [ ] Dispatch Job from Controller, Return 200 Immediately
- [ ] Implement Job Middleware for Rate Limiting
- [ ] Isolate Queue Connection Per Service When Needed
- [ ] Use ShouldBeEncrypted for Jobs Containing Sensitive Data
- [ ] End-to-end test: webhook received, job processed
- [ ] Job class handles business logic
- [ ] Job failures handled with release or fail
- [ ] Configure retry count and backoff for job retries
- [ ] Create a job class for each webhook event type
- [ ] Handle job failures: `$this->release($delay)` for transient failures

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure retry count and backoff for job retries
- [ ] Create a job class for each webhook event type
- [ ] Handle job failures: `$this->release($delay)` for transient failures
- [ ] In controller: validate signature, dispatch job, return 200
- [ ] Log job dispatch and completion for monitoring
- [ ] Pass webhook payload as event or data DTO (not request instance)
- [ ] Set unique job keys to prevent duplicate processing
- [ ] Test webhook receipt and async processing end-to-end
- [ ] Dispatch After Database Commit with dispatchIfCommitted
- [ ] Dispatch Job from Controller, Return 200 Immediately
- [ ] Implement Job Middleware for Rate Limiting
- [ ] Isolate Queue Connection Per Service When Needed

---

# Performance Checklist

- [ ] Database writes from jobs extend response time from user perspective
- [ ] Job dispatch adds ~1ms to response time
- [ ] Job serialization time for large payloads (compress large payloads before dispatch)
- [ ] Queue worker processing overhead negligible

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Dispatching job before DB commit (processing uncommitted data)
- [ ] Missing unique job implementation (duplicate processing on retries)
- [ ] Not handling job failures (silent data loss)
- [ ] Processing webhook synchronously in controller (upstream timeout)
- [ ] Sending large payloads directly as job data (use storage reference)

---

# Testing Checklist

- [ ] `dispatchIfCommitted()` used after DB writes
- [ ] End-to-end test: webhook received, job processed
- [ ] Job class handles business logic
- [ ] Job dispatched from webhook controller, no sync processing
- [ ] Job failure handling (failed_jobs table, alerts)
- [ ] Job failures handled with release or fail
- [ ] Payload passed as data, not request instance
- [ ] Queue connection isolated per service when needed
- [ ] Rate limiting on job consumption as needed
- [ ] Retry/backoff configured for transient failures

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Synchronous Processing in Webhook Controller]
- [ ] [Dispatching Jobs Before Database Transaction Commit]
- [ ] [No Job Deduplication for Provider Retries]
- [ ] [No Rate Limiting on Jobs Making Downstream Calls]
- [ ] [Sensitive Payload in Plain Text Queue Data]
- [ ] [Shared Queue for All Providers (No Isolation)]

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


