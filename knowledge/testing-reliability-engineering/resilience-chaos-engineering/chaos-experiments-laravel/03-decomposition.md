# Decomposition: Chaos Experiments with Laravel Bazooka

## Topic Overview
Laravel Bazooka provides probability-based chaos injection into Laravel applications. It discovers unknown failure modes by introducing controlled disruptions with configurable probability.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) Bazooka configuration (chaos points, probabilities, disruption types), (2) experiment design (hypothesis documentation, blast radius, seed management), and (3) CI integration and safety practices.

## Proposed Folder Structure
```
ku-02-chaos-experiments-laravel/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Chaos point configuration | concept | Class, method, disruption, probability |
| Disruption types | concept | Exception, Latency, Random, Null, Empty |
| Probability management | practice | 1-5% for CI, higher for local |
| Seed-based reproducibility | practice | Fixed seed for deterministic chaos |
| Discovery mode | practice | Identifying injectable services |
| Experiment documentation | practice | Hypothesis documentation per experiment |

## Dependency Graph
```
Chaos Experiments (Laravel Bazooka)
├── Requires: Understanding of chaos engineering concepts
├── Related: Laravel Resilience fault injection
├── Related: Circuit breaker patterns
├── Related: Degraded mode patterns
└── Related: Retry and backoff strategies
```

## Boundary Analysis
This KU focuses specifically on the Bazooka package. Deterministic fault injection via Laravel Resilience is covered in ku-03-fault-injection-testing.

## Future Expansion Opportunities
- Chaos experiment orchestration for multi-service applications
- Automated chaos experiment generation from service discovery
- Chaos experiment results analysis and reporting
- Integration with observability platforms
