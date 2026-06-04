# Amazon SQS — Decomposition

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Amazon SQS
- **Last Updated:** 2026-06-04

---

## Topic Overview
Amazon SQS as a message queuing service for Laravel distributed systems, covering Standard/FIFO queue types, visibility timeout mechanics, Laravel driver configuration, and production operational patterns.

---

## Decomposition Strategy
The topic splits by (1) SQS architecture — Standard vs FIFO queue types, visibility timeout, DLQ, long polling; (2) Laravel SQS driver configuration — connection setup, retry_after alignment, IAM permissions; (3) production operations — monitoring (CloudWatch), IaC provisioning, cost optimization, failure handling; (4) SQS vs alternatives — comparison with Redis, Kafka to guide queue driver selection. This avoids overlapping with generic queue fundamentals by focusing on SQS-specific mechanics and Laravel integration.

---

## Proposed Folder Structure
```
06-message-distribution-systems/amazon-sqs/
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
| Amazon SQS | Managed message queuing for Laravel | Advanced | Queue Driver Architecture |
| Standard Queue | At-least-once, high throughput, unordered | Advanced | Amazon SQS |
| FIFO Queue | Ordered, exactly-once, 300 TPS | Advanced | Standard Queue |
| Visibility Timeout | Message lock and retry mechanics | Advanced | Amazon SQS |
| Dead-Letter Queue | Poison message handling | Advanced | Amazon SQS |
| Long Polling | Cost reduction via WaitTimeSeconds | Intermediate | Amazon SQS |
| Laravel SQS Driver | Connection configuration and dispatch | Intermediate | Amazon SQS |

---

## Dependency Graph
```
Queue Driver Architecture → Amazon SQS
                            ├── Standard Queue → Idempotent workloads
                            ├── FIFO Queue → Ordered processing
                            ├── Visibility Timeout → retry_after alignment
                            ├── Dead-Letter Queue → maxReceiveCount
                            ├── Long Polling → WaitTimeSeconds
                            └── Laravel SQS Driver → config/queue.php
```

---

## Boundary Analysis
**In scope**: SQS Standard/FIFO queue types, visibility timeout mechanics, dead-letter queue configuration, long polling, Laravel SQS connection configuration, retry_after alignment, IAM least-privilege policies, batch operations, message size limits, CloudWatch monitoring, IaC provisioning (Terraform/CloudFormation), cost optimization, FIFO MessageGroupId scoping.

**Out of scope**: Generic queue fundamentals, Redis queue driver, Kafka architecture, Horizon configuration, SQS Extended Client internals (S3 integration), Lambda triggers, SNS integration, Step Functions orchestration.

---

## Future Expansion Opportunities
- SQS FIFO deep dive with throughput optimization
- SQS + SNS fan-out patterns for event broadcasting
- SQS Lambda serverless processing
- Extended Client for large messages
- Cross-region SQS replication patterns
