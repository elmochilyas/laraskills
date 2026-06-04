# Decomposition: SQS Long Polling

## Topic Overview
SQS long polling (ReceiveMessageWaitTimeSeconds up to 20s) reduces empty receive costs by eliminating unnecessary polling cycles. Without long polling (short polling), the ReceiveMessage call returns immediately, even if the queue is empty, incurring a billable request. Long polling waits up to 20 seconds for a message to arrive, dramatically reducing the number of empty ReceiveMessage calls.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k12-sqs-long-polling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SQS Long Polling
- **Purpose:** SQS long polling (ReceiveMessageWaitTimeSeconds up to 20s) reduces empty receive costs by eliminating unnecessary polling cycles.
- **Difficulty:** Foundation
- **Dependencies:** K10: SQS Pricing Model, K11: SQS Batching Savings, K13: SQS Idle Lambda Polling

## Dependency Graph
**Depends on:**
- K10: SQS Pricing Model
- K11: SQS Batching Savings
- K13: SQS Idle Lambda Polling

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Long polling
- Short polling
- Default
- Savings
- Setting
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K10: SQS Pricing Model, K11: SQS Batching Savings, K13: SQS Idle Lambda Polling

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