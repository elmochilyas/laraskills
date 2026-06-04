# Decomposition: SQS to RabbitMQ Migration

## Topic Overview
A real-world case study documented ~50% cost reduction migrating from SQS to self-hosted RabbitMQ ($6K to $2.8K/month). At high message volumes (>100M messages/day), SQS's per-request pricing becomes uneconomical compared to RabbitMQ's flat infrastructure cost. The breakeven for self-hosted RabbitMQ vs SQS is approximately 50M messages/day.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k14-sqs-rabbitmq-migration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SQS to RabbitMQ Migration
- **Purpose:** A real-world case study documented ~50% cost reduction migrating from SQS to self-hosted RabbitMQ ($6K to $2.8K/month).
- **Difficulty:** Advanced
- **Dependencies:** K10: SQS Pricing Model, K45: KEDA Scale-to-Zero Workers

## Dependency Graph
**Depends on:**
- K10: SQS Pricing Model
- K45: KEDA Scale-to-Zero Workers

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- SQS bill
- RabbitMQ cost
- Savings
- Volume
- Breakeven
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K10: SQS Pricing Model, K45: KEDA Scale-to-Zero Workers

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization