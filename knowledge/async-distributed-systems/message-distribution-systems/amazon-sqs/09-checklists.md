# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Amazon Sqs
**Generated:** 2026-06-04
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md
**Note:** Complete — all phase files present (04, 05, 06, 07, 08, 09)

---

# Quick Checklist

- [ ] Always set SQS visibility timeout equal to your longest job's timeout at 3Ã—. followed
- [ ] Never create SQS queues dynamically at runtime. followed
- [ ] Always use the same MessageGroupId for messages that must be ordered within a FIFO queue. followed
- [ ] Always enable SQS long polling (WaitTimeSeconds = 20). followed
- [ ] Visibility Timeout Shorter Than Job Duration â€” Duplicate Processing prevented
- [ ] Creating Queues Dynamically at Runtime prevented

---

# Architecture Checklist

- [ ] SQS used as boundary decoupling mechanism, not a data store
- [ ] One queue per message type or processing group defined
- [ ] DLQ configured per source queue (or shared per service)
- [ ] SQS placed as integration point between bounded contexts in microservice architecture
- [ ] IAM least-privilege for queue operations — app role limited to ReceiveMessage, DeleteMessage, ChangeMessageVisibility, SendMessage
- [ ] Separate queue connections for different latency/service-level requirements
- [ ] SQS used as buffer between sync and async boundaries
- [ ] FIFO queue considered for event sourcing and CQRS event stores
- [ ] Queue provisioning done via Infrastructure as Code (Terraform, CloudFormation), not runtime

---

# Implementation Checklist

- [ ] retry_after set 5-10 seconds less than SQS visibility timeout
- [ ] SQS queues pre-provisioned via IaC, not created dynamically at runtime
- [ ] MessageGroupId used correctly for FIFO queue ordering (entity-scoped, not static)
- [ ] SQS long polling enabled (WaitTimeSeconds=20)
- [ ] FIFO queue name ends with .fifo suffix
- [ ] FIFO deduplication configured (ContentBasedDeduplication or explicit MessageDeduplicationId)
- [ ] DLQ configured with RedrivePolicy and maxReceiveCount=3
- [ ] CloudWatch alarms set up for ApproximateNumberOfMessagesVisible, DLQ depth
- [ ] IAM policies follow least privilege — no CreateQueue for application role
- [ ] Double-processing test passes with crash-at-retry_after-boundary scenario

---

# Performance Checklist

- [ ] Standard queue used for throughput > 300 TPS
- [ ] Long polling enabled to reduce empty API calls by ~95%
- [ ] WaitTimeSeconds=20 configured for maximum polling efficiency
- [ ] Batch operations used where applicable (SendMessageBatch, DeleteMessageBatch)
- [ ] Message size ≤ 256KB (or Extended Client Library configured for larger payloads)
- [ ] Worker count aligned with SQS API rate limits (3000 req/s per account)
- [ ] Queue latency measured and monitored (20-100ms baseline per API call)
- [ ] Content-based deduplication considered for FIFO to avoid explicit dedup IDs

---

# Security Checklist

- [ ] IAM least-privilege enforced — app roles have only required SQS actions
- [ ] SSE with KMS enabled for queues handling sensitive data
- [ ] HTTPS endpoints used (Laravel SQS driver default)
- [ ] Sensitive payloads encrypted at application level before dispatch
- [ ] sqs:CreateQueue restricted to infrastructure roles only
- [ ] sqs:ChangeMessageVisibility restricted to controlled roles
- [ ] DLQ monitored for sensitive data accumulation
- [ ] Queue policies restrict cross-account access to authorized principals only

---

# Reliability Checklist

- [ ] Visibility timeout longer than job execution time (double processing prevented)
- [ ] DLQ configured with maxReceiveCount=3 for poison message handling
- [ ] Long polling prevents wasted API calls and empty response loops
- [ ] Correct MessageGroupId prevents serial processing bottlenecks
- [ ] Queue retention period matches maximum acceptable consumer lag
- [ ] No infinite retention configured
- [ ] retry_after < visibility timeout verified in config
- [ ] CloudWatch alarms configured for queue depth, DLQ depth, age of oldest message
- [ ] Consumer crash-at-boundary tested and no double processing observed

---

# Testing Checklist

- [ ] Visibility timeout misconfiguration tested (simulate crash at retry_after boundary)
- [ ] FIFO queue ordering validated with multi-entity concurrent dispatch
- [ ] DLQ flow tested: dispatch poison message, verify DLQ receipt
- [ ] Long polling verified with empty queue (reduced API calls)
- [ ] IAM policy tested with least-privilege permissions (no excessive grants)
- [ ] Cross-application job deserialization tested (same class maps across apps)
- [ ] High-throughput scenario load-tested against FIFO rate limits

---

# Maintainability Checklist

- [ ] Queue names documented in runbook with purpose and retention policy
- [ ] IaC (Terraform/CloudFormation) as single source of truth for queue configuration
- [ ] Queue naming convention established and followed (service-purpose-env)
- [ ] DLQ reprocessing procedure documented
- [ ] retry_after rationale documented per queue connection
- [ ] SQS cost budget and monitoring configured

---

# Anti-Pattern Prevention Checklist

- [ ] Visibility Timeout Shorter Than Job Duration — set retry_after < visibility_timeout
- [ ] Creating Queues Dynamically at Runtime — pre-provision via IaC
- [ ] Short Polling — Wasted API Calls and CPU — enable WaitTimeSeconds=20
- [ ] Wrong MessageGroupId — use entity-scoped, not static group IDs
- [ ] Infinite Retention — configure MessageRetentionPeriod
- [ ] No Dead-Letter Queue Configuration — add DLQ with RedrivePolicy
- [ ] Defaulting to Standard Queue When FIFO Required — validate ordering requirements
- [ ] Ignoring SQS Extended Client for Large Payloads — configure for >256KB messages

---

# Production Readiness Checklist

- [ ] All queues provisioned via IaC with proper naming and retention
- [ ] retry_after < visibility timeout confirmed in all queue connections
- [ ] DLQ configured on all queues with monitoring and alerting
- [ ] IAM policies audited for least privilege
- [ ] CloudWatch dashboards created for queue health metrics
- [ ] Cost budget set for SQS API usage
- [ ] Runbook includes DLQ reprocessing and queue recovery procedures
- [ ] FIFO queue throughput load-tested against 300 TPS (3000 batched) limits

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] retry_after vs visibility timeout alignment verified in config
- [ ] DLQ configured on all production queues
- [ ] FIFO throughput confirmed within limits
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- K039 Amazon SQS Visibility Timeout and Queue Types (04-standardized-knowledge.md)
- Amazon SQS Rules (05-rules.md)
- Configure and Manage Amazon SQS Queues (06-skills.md)
- Amazon SQS Decision Trees (07-decision-trees.md)
- Amazon SQS Anti-Patterns (08-anti-patterns.md)

---


