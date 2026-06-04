# Decomposition — Controller Action Delegation

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Single-line controller methods delegating to action/service classes, action class conventions, response construction in controllers only |
| **Boundaries** | Ends where inline business logic begins (non-delegated controllers); distinct from invokable controllers (which are the action, not a delegator); separate from command bus patterns |
| **Interfaces** | Action class interface pattern: `class XxxAction { public function execute(...): DomainObject }` |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | The delegation pattern is a single architectural strategy |
| Minimal overlap | ⚠️ Partial | Overlaps with thin-controller-enforcement (same goal), but delegation is the *mechanism* while enforcement is the *policy* |
| Testable independently | ✅ Atomic | Can test that a controller method delegates without testing the action itself |
| Splittable? | ❌ No | Delegation encompasses action class design, injection, and response construction — one concept |

## Dependency Graph

```
Controller Dependency Injection ──► Controller Action Delegation ──► Thin Controller Enforcement
                                            │
                                            ├──► Controller Response Selection
                                            └──► Controller Testing Strategies
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a decision tree: "Should I delegate to an action class or keep it in the controller?" | Practical guidance for junior developers |
| Document the "One-Line Rule" as a team standard | Simple, memorable enforcement heuristic |
| Add a PHPStan rule that flags controller methods over 5 lines for review | Automated delegation enforcement |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization