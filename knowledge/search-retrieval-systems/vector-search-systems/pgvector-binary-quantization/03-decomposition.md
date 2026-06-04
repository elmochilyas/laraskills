# Decomposition: pgvector binary quantization

## Topic Overview

pgvector's binary quantization converts full-precision vectors to binary (sign-bit) representations, enabling extremely fast Hamming distance search. The two-phase approach — binary ANN search followed by full-precision re-ranking of top candidates — achieves 10-150x build time speedups and ~30x QPS improvements over IVFFlat, with only marginal recall loss.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pgvector-binary-quantization/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pgvector binary quantization
- **Purpose:** pgvector's binary quantization converts full-precision vectors to binary (sign-bit) representations, enabling extremely fast Hamming distance search. The two-phase approach — binary ANN search followed by full-precision re-ranking of top candidates — achieves 10-150x build time speedups and ~30x QPS improvements over IVFFlat, with only marginal recall loss.
- **Difficulty:** Foundation
- **Dependencies:** K041 (pgvector extension), and K044 (pgvector half-precision / binary)

## Dependency Graph
**Depends on:** K041 (pgvector extension), and K044 (pgvector half-precision / binary)
**Depended on by:** Knowledge units that leverage or extend pgvector binary quantization patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pgvector binary quantization.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization