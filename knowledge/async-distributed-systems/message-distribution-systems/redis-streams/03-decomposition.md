# Redis Streams — Decomposition

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Redis Streams
- **Last Updated:** 2026-06-04

---

## Topic Overview
Redis Streams as an append-only log data type for queue processing in Laravel, covering consumer groups, PEL tracking, message claiming, and the `laravel-common` package integration.

---

## Decomposition Strategy
The topic splits by (1) Redis Streams fundamentals — stream structure, entry IDs, consumer groups, PEL; (2) stream operations — XREADGROUP, XACK, XCLAIM/XAUTOCLAIM, XTRIM; (3) Laravel integration — `redis` queue driver, `laravel-common` package, configuration; (4) production operations — monitoring, trimming, dead-letter handling, failure recovery. This avoids overlapping with general Redis topics by focusing on stream-specific data structures and consumer group mechanics.

---

## Proposed Folder Structure
```
06-message-distribution-systems/redis-streams/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── 05-rules.md
├── 06-skills.md
├── 07-decision-trees.md
├── 08-anti-patterns.md
└── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|--------------|
| Redis Streams | Append-only log queue processing | Advanced | Queue Driver Architecture, Redis Fundamentals |
| Stream Structure | Entry IDs, field-value pairs, stream trimming | Advanced | Redis Streams |
| Consumer Groups | XREADGROUP, XACK, PEL, load balancing | Advanced | Stream Structure |
| Message Claiming | XCLAIM/XAUTOCLAIM for failure recovery | Advanced | Consumer Groups |
| Laravel Stream Integration | redis queue driver, laravel-common | Advanced | Consumer Groups |
| Dead-Letter Handling | Persistent failure management | Advanced | Message Claiming |

---

## Dependency Graph
```
Redis Fundamentals → Queue Driver Architecture → Redis Streams
                                                  ├── Stream Structure → XADD, XTRIM, MAXLEN
                                                  ├── Consumer Groups → XREADGROUP, XACK, PEL
                                                  ├── Message Claiming → XCLAIM, XAUTOCLAIM
                                                  └── Laravel Integration → redis driver, laravel-common
```

---

## Boundary Analysis
**In scope**: Redis stream data type fundamentals, consumer group creation and management, XREADGROUP blocking reads, XACK acknowledgment, PEL monitoring (XPENDING), XCLAIM/XAUTOCLAIM for failure recovery, stream trimming (XTRIM, XADD MAXLEN ~), Laravel redis queue driver configuration (read_timeout, block_for), laravel-common package features, dead-letter stream pattern, consumer health monitoring.

**Out of scope**: Redis installation and configuration, Redis persistence (RDB/AOF), Redis Cluster setup, Redis ACLs, generic Redis data types (lists, sets, sorted sets), Laravel Horizon internals, other Redis queue implementations (lists-based).

---

## Future Expansion Opportunities
- Redis Streams with Redis Cluster for horizontal scaling
- Consumer group scaling strategy and partition-like patterns
- Automated dead-letter reprocessing workflows
- Stream monitoring dashboard (PEL, lag, consumer health)
- Redis Streams vs Kafka comparison for event streaming
