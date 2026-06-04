# Decomposition: Inertia Lazy Data Evaluation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Lazy Data Evaluation
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Lazy Prop Concept
- **Topics:** Closure-wrapped props, deferred computation, partial reload triggers
- **Key Content:** Wrapping expensive prop computation in closures, when evaluation is deferered
- **Learning Objectives:** Use closures to mark expensive prop computations as lazy

### Chunk 2: Deferred vs Eager Props
- **Topics:** Which props should be lazy, which should be eager, performance analysis
- **Key Content:** Identifying expensive computations, benchmarking, lazy/eager decision criteria
- **Learning Objectives:** Distinguish between props that benefit from lazy evaluation and those that should be eager

### Chunk 3: Interaction with Partial Reloads
- **Topics:** How lazy props resolve during partial reload, caching lazy results
- **Key Content:** Lazy props computed only when requested via partial reload, result caching per request
- **Learning Objectives:** Combine lazy data evaluation with partial reloads for fine-grained performance control

### Chunk 4: Lazy Evaluation Patterns and Tradeoffs
- **Topics:** Lazy vs always-eager, lazy with TTL, stale-while-revalidate patterns
- **Key Content:** Avoiding over-lazification (too many network round-trips), defense against N+1 lazy props
- **Learning Objectives:** Apply appropriate lazy evaluation patterns and avoid common pitfalls that degrade user experience
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization