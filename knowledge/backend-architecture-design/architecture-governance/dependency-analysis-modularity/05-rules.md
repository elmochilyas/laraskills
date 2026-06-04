## Rule 1: Track dependency metrics quarterly and act on negative trends
---
## Category
Maintainability
---
## Rule
Measure afferent/efferent coupling, instability, and abstractness per module at least quarterly; investigate any module whose main sequence distance exceeds 0.3.
---
## Reason
Metrics without action are noise; trending reveals architectural decay before it becomes unmanageable.
---
## Bad Example
```
"Our User module has distance 0.7 from main sequence."
"OK, let's note it." — No action taken.
```
---
## Good Example
```
Distance 0.7: too concrete for its instability.
Action: extract interface, reduce efferent coupling.
Next quarter: distance 0.2 ✓
```
---
## Exceptions
Modules that are inherently stable (shared kernels) or intentionally abstract (contract projects).
---
## Consequences Of Violation
Undetected architectural decay, hard-to-reverse coupling, painful refactoring later.
---
## Rule 2: Break dependency cycles immediately on detection
---
## Category
Architecture
---
## Rule
Use dependency analysis tools (e.g., Deptrac, PhpMetrics) to detect cycles; resolve them before merging new code.
---
## Reason
Dependency cycles make modules impossible to extract, test independently, or reason about—they are the primary symptom of a big ball of mud.
---
## Bad Example
```
Module A depends on B, B depends on C, C depends on A.
All three must be deployed together.
```
---
## Good Example
```
Module A depends on B (via interface), B depends on C (via interface).
C has no inbound dependencies from A or B. Clean DAG.
```
---
## Exceptions
When cycles are intentional and documented, e.g., bidirectional context mapping with Partnership (rare).
---
## Consequences Of Violation
Distributed monolith, impossible to extract modules, fragile code.
---
## Rule 3: Set explicit coupling thresholds per module and fail CI when exceeded
---
## Category
Architecture
---
## Rule
Define max efferent coupling (Ce) per module; enforce with automated metrics tooling in CI.
---
## Reason
Without thresholds, "low coupling" is subjective; explicit targets provide objective decision gates.
---
## Bad Example
```
"We should keep coupling low." — No one knows what "low" means.
```
---
## Good Example
```
Thresholds:
- Module Ce ≤ 10
- Module instability I ≤ 0.5
Violation → CI fail → refactor
```
---
## Exceptions
Infrastructure modules (e.g., service providers) that naturally have higher outbound dependencies.
---
## Consequences Of Violation
Subjective standards, inconsistent enforcement, gradual coupling increase.
---
## Rule 4: Analyze at the module/package level, not only at the class level
---
## Category
Architecture
---
## Rule
Run dependency analysis at namespace or module granularity (e.g., `App\Modules\Billing`) to catch cross-module coupling.
---
## Reason
Class-level metrics miss the macro-structural problems that cause the biggest maintenance pain.
---
## Bad Example
```
Each class in isolation has Ce ≤ 5.
But 20 classes in Module A each depend on Module B → module-level coupling is severe.
```
---
## Good Example
```
Module-level metric: Ce from ModuleA to ModuleB = 20 (exceeds threshold).
Action: introduce interface or event for cross-module communication.
```
---
## Exceptions
Trivial applications with only one logical module (no module boundaries exist).
---
## Consequences Of Violation
Hidden cross-module coupling, extraction difficulty, distributed monolith.
---
## Rule 5: Do not use metrics as rigid gates without contextual review
---
## Category
Architecture
---
## Rule
Alert on metric violations but allow manual override with documented justification; metrics inform decisions, they don't make them.
---
## Reason
Metrics gamed or enforced blindly lead to counterproductive "improvements" that worsen the actual design.
---
## Bad Example
```
Warning: High cohesion violation. Developer splits a cohesive class into five classes.
Coupling increases dramatically, but "cohesion score improved."
```
---
## Good Example
```
Metric alert. Review: "This module has high Ce because it's an orchestrator. Documented in ADR-015."
Override with review.
```
---
## Exceptions
When metrics measure a critical compliance constraint (e.g., "no OSGi imports").
---
## Consequences Of Violation
Metric gaming, wrong refactoring priorities, team distrust of metrics.
