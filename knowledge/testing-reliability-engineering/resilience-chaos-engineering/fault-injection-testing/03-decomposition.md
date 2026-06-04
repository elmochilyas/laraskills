# Decomposition: Fault Injection Testing with Laravel Resilience

## Topic Overview
Laravel Resilience enables deterministic fault injection into container-managed services. It provides a discovery-scaffold-test workflow for building resilience tests that verify fallback behavior.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) fault injection concepts (fault types, decorator pattern, container awareness), (2) the discovery-scaffold-test workflow, and (3) fallback assertions and test organization.

## Proposed Folder Structure
```
ku-03-fault-injection-testing/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Fault injection | concept | Controlled exception, timeout, latency |
| Service decorator | concept | Container-aware service wrapping |
| Fault types | concept | ExceptionFault, TimeoutFault, LatencyFault |
| Discovery mode | practice | `php artisan resilience:discover` |
| Scaffold command | practice | `php artisan resilience:scaffold` |
| Fallback assertions | practice | `assertFallbackUsed()`, `assertDegradedButSuccessful()` |
| One fault per test | practice | Single fault type per test for clarity |

## Dependency Graph
```
Fault Injection Testing (Laravel Resilience)
├── Requires: Understanding of service container and dependency injection
├── Depends on: Fallback code implementation
├── Related: Chaos engineering with Bazooka
├── Related: Circuit breaker patterns
└── Related: Service container decoration patterns
```

## Boundary Analysis
This KU focuses specifically on the Laravel Resilience package. It does not cover probabilistic chaos engineering (Bazooka) or general resilience patterns like circuit breakers and bulkheads.

## Future Expansion Opportunities
- Fault injection patterns for specific service types (HTTP, database, cache)
- Automated fallback detection and test generation
- Resilience test coverage metrics
- Production readiness assessment from resilience test results
