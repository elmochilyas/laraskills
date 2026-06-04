# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Redis Streams
**Generated:** 2026-06-04
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md
**Note:** Complete — all phase files present (04, 05, 06, 07, 08, 09)

---

# Quick Checklist

- [ ] Always configure read_timeout when consuming Redis streams with blocking reads. followed
- [ ] Always monitor consumer group PEL (Pending Entry List) length and lag. followed
- [ ] Always implement pending message claiming when consumers are known to fail. followed
- [ ] Always call XACK after successful message processing. followed
- [ ] No Read Timeout â€” Worker Hangs Indefinitely prevented
- [ ] Ignoring Consumer Group Lag â€” Silent Message Accumulation prevented

---

# Architecture Checklist

- [ ] One stream per message type or logical queue
- [ ] One consumer group per stream per processing purpose
- [ ] Unique consumer name per process instance (hostname:pid or pod name)
- [ ] Separate Redis connection for streams if throughput is high
- [ ] Stream naming convention established (entity:purpose — e.g., orders:queue, orders:dlt)
- [ ] Stream message handlers designed to be idempotent
- [ ] Workers co-located with Redis for sub-millisecond latency
- [ ] Stream trimming configured to bound memory usage

---

# Implementation Checklist

- [ ] read_timeout configured when consuming Redis streams with blocking reads
- [ ] Consumer group PEL (Pending Entry List) length and lag monitored
- [ ] Pending message claiming implemented (XAUTOCLAIM or periodic XCLAIM)
- [ ] XACK called after successful message processing
- [ ] Consumer group created for each stream (XGROUP CREATE)
- [ ] Stream trimming active (XADD MAXLEN ~ N or periodic XTRIM)
- [ ] Dead-letter stream configured for persistently failing messages
- [ ] Unique consumer names per process instance
- [ ] Error handling distinguishes retryable vs permanent failures
- [ ] Blocking read configured (BLOCK timeout) for worker efficiency

---

# Performance Checklist

- [ ] Blocking reads used instead of busy-polling (near-zero CPU when idle)
- [ ] Approximate trimming used (MAXLEN ~ N) instead of exact trimming
- [ ] PEL size monitored and kept within reasonable bounds
- [ ] Stream operations not competing excessively with cache operations on same Redis
- [ ] read_timeout balanced between reconnection frequency and latency (2s recommended)
- [ ] XAUTOCLAIM used instead of XCLAIM (Redis 6.2+) for efficient PEL scanning
- [ ] Message field count kept small to minimize memory per entry

---

# Security Checklist

- [ ] Redis ACLs configured (Redis 6+) restricting stream commands per user
- [ ] Redis not exposed to public internet (private network, VPC, Unix socket)
- [ ] TLS/SSL enabled for Redis connections in production
- [ ] Sensitive data encrypted at application level before adding to stream
- [ ] Maxmemory and eviction policy configured to prevent OOM crashes
- [ ] Dangerous Redis commands disabled or renamed (FLUSHALL, CONFIG, etc.)
- [ ] AOF persistence enabled with appendfsync everysec for production

---

# Reliability Checklist

- [ ] No Read Timeout — Worker Hangs Indefinitely prevented (read_timeout set)
- [ ] Ignoring Consumer Group Lag — Silent Message Accumulation prevented (XPENDING monitored)
- [ ] No Pending Message Claiming — Lost Messages on Consumer Failure prevented (XCLAIM/XAUTOCLAIM)
- [ ] Missing Acknowledgment — Duplicate Processing on Idle Timeout prevented (XACK called)
- [ ] No Dead-Letter Handling — Permanently Unprocessable Messages prevented (DL stream)
- [ ] Using Single Consumer Without Consumer Group — No Load Balancing prevented (XREADGROUP)
- [ ] Worker reconnection tested: simulate Redis disconnect, verify recovery
- [ ] PEL growth trend monitored and alerted

---

# Testing Checklist

- [ ] read_timeout tested: simulate network hiccup, verify worker reconnection
- [ ] Acknowledgment tested: verify XACK removes message from PEL
- [ ] Pending claiming tested: simulate consumer crash, verify XAUTOCLAIM recovers messages
- [ ] Dead-letter tested: simulate permanent failure, verify message routed to DL stream
- [ ] Consumer group tested: add multiple consumers, verify load-balanced delivery
- [ ] Idempotency tested: deliver same message twice, verify no duplicate side effects
- [ ] Stream trimming tested: verify MAXLEN ~ N keeps stream bounded

---

# Maintainability Checklist

- [ ] Stream naming conventions documented
- [ ] Consumer group mapping documented (which group processes which stream)
- [ ] Dead-letter reprocessing procedure documented
- [ ] read_timeout rationale documented per stream connection
- [ ] Redis memory budget documented with stream data growth projections
- [ ] Runbook includes stream recovery, PEL inspection, consumer re-creation procedures
- [ ] XPENDING baseline documented for normal operation

---

# Anti-Pattern Prevention Checklist

- [ ] No Read Timeout — Worker Hangs Indefinitely — set read_timeout (2s recommended)
- [ ] Ignoring Consumer Group Lag — Silent Message Accumulation — monitor XPENDING
- [ ] No Pending Message Claiming — Lost Messages on Consumer Failure — implement XAUTOCLAIM
- [ ] Missing Acknowledgment — Duplicate Processing on Idle Timeout — call XACK after processing
- [ ] No Dead-Letter Handling — Permanently Unprocessable Messages — route to DL stream
- [ ] Using Single Consumer Without Consumer Group — use XREADGROUP for load balancing
- [ ] Treating Redis Streams Like a Simple Queue — use consumer groups + PEL + claiming
- [ ] No Stream Trimming — Unbounded Memory Growth — set MAXLEN ~ N on all streams

---

# Production Readiness Checklist

- [ ] read_timeout set in queue configuration (2-5 seconds)
- [ ] Consumer groups created for all production streams
- [ ] PEL and lag monitoring operational with alerts
- [ ] XAUTOCLAIM/XCLAIM implemented for failure recovery
- [ ] XACK called after successful processing (try/finally pattern)
- [ ] Dead-letter stream configured with alerting on entries
- [ ] Stream trimming active (MAXLEN ~ N)
- [ ] Redis memory monitored with alerting at 70% and 85% thresholds
- [ ] AOF persistence enabled with appendfsync everysec
- [ ] Runbook includes DL reprocessing, consumer re-creation, PEL cleanup procedures

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] read_timeout configured (worker will not hang on network blip)
- [ ] XACK implemented (messages will not be reprocessed on idle timeout)
- [ ] Pending claiming configured (dead consumer messages will be recovered)
- [ ] Stream trimming active (memory will not grow unbounded)
- [ ] Dead-letter handling configured (poison messages will not loop forever)
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- K040 Redis Streams via laravel-common (04-standardized-knowledge.md)
- Redis Streams Rules (05-rules.md)
- Configure and Manage Redis Streams (06-skills.md)
- Redis Streams Decision Trees (07-decision-trees.md)
- Redis Streams Anti-Patterns (08-anti-patterns.md)

---


