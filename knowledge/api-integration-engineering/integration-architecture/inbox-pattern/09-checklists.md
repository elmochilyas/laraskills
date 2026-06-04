# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** inbox-pattern
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Duplicate webhook ID from same provider is rejected
- [ ] Inbox table has unique constraint on (provider, webhook_id)
- [ ] Processed records cleaned up after retention period
- [ ] Clean Up Processed Records on Schedule
- [ ] Create Inbox Record Before Dispatching Job
- [ ] Implement Dead Letter Queue After Max Retries
- [ ] Monitor Stuck Unprocessed Records
- [ ] Process Inbox Records in FIFO Order Per Provider
- [ ] `inbox_messages` table with idempotency key
- [ ] Dead-letter handling for failed messages
- [ ] Inbox depth and lag monitored
- [ ] Create `inbox_messages` table: id, message_type, payload, idempotency_key, status, created_at
- [ ] Dispatch processing job after transaction commit
- [ ] Handle failed messages with retry and dead-letter

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Create `inbox_messages` table: id, message_type, payload, idempotency_key, status, created_at
- [ ] Dispatch processing job after transaction commit
- [ ] Handle failed messages with retry and dead-letter
- [ ] Implement message pruning for retention
- [ ] Monitor inbox queue depth and processing lag
- [ ] Process message, update status to `completed`
- [ ] Store incoming message in database transaction
- [ ] Use unique constraint on idempotency key for deduplication
- [ ] Clean Up Processed Records on Schedule
- [ ] Create Inbox Record Before Dispatching Job
- [ ] Implement Dead Letter Queue After Max Retries
- [ ] Monitor Stuck Unprocessed Records

---

# Performance Checklist

- [ ] Async processing removes processing time from HTTP response path
- [ ] Inbox INSERT with unique constraint: ~5-10ms for first insert, <1ms for duplicate detection
- [ ] Inbox table pruning for processed records prevents growth
- [ ] Index on `(provider, webhook_id)` ensures fast duplicate detection

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Reliability measures implemented

---

# Testing Checklist

- [ ] `inbox_messages` table with idempotency key
- [ ] Dead-letter handling for failed messages
- [ ] Duplicate webhook ID from same provider is rejected
- [ ] Inbox depth and lag monitored
- [ ] Inbox table has unique constraint on (provider, webhook_id)
- [ ] Messages stored in database transaction
- [ ] Processed records cleaned up after retention period
- [ ] Processing job dispatched after transaction commit
- [ ] Processing job reads inbox record and marks as processed
- [ ] Status tracking: received â†’ processing â†’ completed/failed

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Processing Webhooks Synchronously Without Inbox]
- [ ] [Single-Column Unique Constraint Without Provider Namespace]
- [ ] [Dispatching Queue Job Before Inbox Write]
- [ ] [No Dead Letter Handling for Stuck Inbox Records]
- [ ] [Never Pruning Processed Inbox Records]

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


