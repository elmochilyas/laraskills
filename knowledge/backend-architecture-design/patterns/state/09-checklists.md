# State pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Behavioral Patterns
- **Knowledge Unit:** State
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand polymorphism and PHP 8.1 Enums
- [ ] Know state machine concepts (transitions, guards, actions)
- [ ] Familiar with Strategy pattern for comparison

## Implementation Checklist
- [ ] State objects implement common interface
- [ ] Each state encapsulates behavior specific to that state
- [ ] State transitions are explicit and validated (invalid transitions handled)
- [ ] State objects are stateless singletons (no mutable state in state objects)
- [ ] Context delegates state-dependent behavior to current state object
- [ ] Transition map centralized (not spread across state objects)

## Verification Checklist
- [ ] Simple boolean flags don't use State pattern (if/else is clearer)
- [ ] States that don't affect behavior are just status labels (not state objects)
- [ ] Invalid transitions don't silently no-op (they throw or return error)
- [ ] State objects don't hold context references (tight coupling, GC issues)
- [ ] State objects are immutable (no shared state contamination)

## Security Checklist
- [ ] State transitions respect authorization rules
- [ ] Invalid transitions rejected with appropriate error
- [ ] State-changing operations logged for audit

## Performance Checklist
- [ ] State object overhead: one instance per state (singleton if stateless)
- [ ] Method dispatch through state object: one extra indirection
- [ ] State transition: create new state object (cheap)
- [ ] Memory: state objects typically lightweight

## Production Readiness Checklist
- [ ] State machine diagram documented
- [ ] Invalid transition handling tested
- [ ] State libraries (like spatie/state) considered for complex workflows
- [ ] State persisted correctly between requests

## Common Mistakes to Avoid
- [ ] State object holding context reference (tight coupling, GC issues)
- [ ] Transitions spread across state objects (transition map hard to maintain)
- [ ] Forgetting to handle invalid transitions (silent no-op)
- [ ] State pattern used for simple boolean switches (overengineering)
- [ ] State objects with mutable state (shared state contamination across contexts)
