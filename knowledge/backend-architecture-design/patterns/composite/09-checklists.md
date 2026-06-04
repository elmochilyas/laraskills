# Composite pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Structural Patterns
- **Knowledge Unit:** Composite
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand recursive algorithms
- [ ] Know the difference between leaf and composite nodes
- [ ] Familiar with tree data structures

## Implementation Checklist
- [ ] Component interface defines common operations for leaf and composite
- [ ] Leaf implements Component (single item behavior)
- [ ] Composite implements Component and manages children
- [ ] Composite forwards operations to all children
- [ ] Parent references updated correctly when adding/removing children
- [ ] Client code treats leaf and composite uniformly (no type checks)

## Verification Checklist
- [ ] Composite works as single node (usable without children)
- [ ] Children not modified while iterating (concurrent modification handled)
- [ ] Parent references consistent after add/remove operations
- [ ] Recursive depth doesn't hit PHP stack limit (default 256 in PHP 8)
- [ ] Leaf and composite interchangeable in client code

## Security Checklist
- [ ] Tree operations respect authorization (user can see subset of tree)
- [ ] Composite doesn't expose internal child management to unauthorized callers
- [ ] Flattened tree doesn't leak sensitive relationships

## Performance Checklist
- [ ] Tree traversal: O(n) for all nodes
- [ ] Deep recursion may hit PHP call stack limit (iterative for >1000 levels)
- [ ] Leaf operations: O(1), Composite operations aggregate children costs
- [ ] Memory: entire tree may be loaded in memory

## Production Readiness Checklist
- [ ] Composite used for tree structures, not flat data
- [ ] Recursion depth limits documented
- [ ] Iterative traversal considered for deep trees
- [ ] Tree serialization/deserialization tested

## Common Mistakes to Avoid
- [ ] Composite that isn't usable without children (should work as single node)
- [ ] Modifying children while iterating (concurrent modification issues)
- [ ] Parent references not updated when removing/adding children (stale parent pointers)
- [ ] Deep recursion without depth limit (stack overflow)
