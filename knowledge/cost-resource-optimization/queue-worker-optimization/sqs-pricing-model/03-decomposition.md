# Decomposition: SQS Pricing Model

## Topic Overview
SQS charges per request ($0.40/M Standard, $0.50/M FIFO) with first 1M requests/month free. Each API call (SendMessage, ReceiveMessage, DeleteMessage, etc.) counts as one request. The critical distinction: SQS charges per request, not per message.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k10-sqs-pricing-model/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SQS Pricing Model
- **Purpose:** SQS charges per request ($0.40/M Standard, $0.50/M FIFO) with first 1M requests/month free.
- **Difficulty:** Foundation
- **Dependencies:** K11: SQS Batching Savings, K12: SQS Long Polling, K13: SQS Idle Lambda Polling, K46: SQS 64KB Chunking

## Dependency Graph
**Depends on:**
- K11: SQS Batching Savings
- K12: SQS Long Polling
- K13: SQS Idle Lambda Polling
- K46: SQS 64KB Chunking

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Standard queue
- FIFO queue
- Free tier
- What counts
- Batch API
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K11: SQS Batching Savings, K12: SQS Long Polling, K13: SQS Idle Lambda Polling, K46: SQS 64KB Chunking

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