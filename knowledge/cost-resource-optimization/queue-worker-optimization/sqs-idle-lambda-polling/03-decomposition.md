# Decomposition: SQS Idle Lambda Polling Cost

## Topic Overview
An idle SQS queue with Lambda event source mapping generates approximately 1.7 million ReceiveMessage requests per month simply from polling. This is because Lambda polls 5 SQS partitions concurrently with short polling, generating constant requests even when no messages exist. For an idle queue, this costs ~$0.68/month in SQS requests alone, plus Lambda invocation costs for empty responses.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k13-sqs-idle-lambda-polling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SQS Idle Lambda Polling Cost
- **Purpose:** An idle SQS queue with Lambda event source mapping generates approximately 1.7 million ReceiveMessage requests per month simply from polling.
- **Difficulty:** Intermediate
- **Dependencies:** K10: SQS Pricing Model, K11: SQS Batching Savings, K12: SQS Long Polling, K45: KEDA Scale-to-Zero Workers

## Dependency Graph
**Depends on:**
- K10: SQS Pricing Model
- K11: SQS Batching Savings
- K12: SQS Long Polling
- K45: KEDA Scale-to-Zero Workers

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Polling rate
- Cost at idle
- Above free tier
- Multiple queues
- Lambda side
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K10: SQS Pricing Model, K11: SQS Batching Savings, K12: SQS Long Polling, K45: KEDA Scale-to-Zero Workers

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