# Decomposition: SQS 64KB Chunking

## Topic Overview
SQS messages are billed in 64KB chunks. A 65KB message counts as 2 requests (one for each 64KB chunk). This effectively doubles the cost of messages that exceed 64KB.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k46-sqs-chunking-64kb/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SQS 64KB Chunking
- **Purpose:** SQS messages are billed in 64KB chunks.
- **Difficulty:** Advanced
- **Dependencies:** K10: SQS Pricing Model, K11: SQS Batching Savings

## Dependency Graph
**Depends on:**
- K10: SQS Pricing Model
- K11: SQS Batching Savings

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- 64KB chunk
- 65KB message
- 256KB maximum
- Batching + chunks
- Solution
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K10: SQS Pricing Model, K11: SQS Batching Savings

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