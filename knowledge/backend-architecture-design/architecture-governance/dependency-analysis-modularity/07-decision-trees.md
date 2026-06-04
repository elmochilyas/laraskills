# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Architecture Governance
**Knowledge Unit:** Dependency analysis and modularity metrics
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Module-level vs class-level dependency analysis
* Decision 2: Which coupling thresholds trigger investigation vs action
* Decision 3: Which modules to refactor first based on distance from main sequence

---

# Architecture-Level Decision Trees

---

## Decision: Module-Level vs Class-Level Dependency Analysis

---

## Decision Context

Choose the granularity of dependency analysis — analyzing at the module/package level or the individual class level.

---

## Decision Criteria

* performance considerations: module-level analysis is faster (fewer nodes)
* architectural considerations: module-level catches macro-structural problems; class-level catches micro-violations
* security considerations: module-level reveals overall system security boundaries
* maintainability considerations: class-level analysis can overwhelm with noise; module-level signals actionable issues

---

## Decision Tree

Is the goal to detect circular dependencies between system components?
↓
YES → Module-level analysis (class-level cycles are expected; module-level cycles are the real problem)
NO → Is the goal to enforce layer dependency direction (Domain → Application → Infrastructure)?
    YES → Module-level analysis (layers are modules)
    NO → Is the goal to measure overall system health and detect architectural decay?
        YES → Module-level analysis (macro metrics: instability, abstractness, distance from main sequence)
        NO → Is the goal to identify specific class-level violations (e.g., "class X imports Eloquent")?
            YES → Class-level analysis (targeted violation detection)
            NO → Does the team have capacity to act on class-level findings?
                YES → Class-level analysis for detailed refactoring guidance
                NO → Module-level analysis for manageable action items

---

## Rationale

Module-level analysis provides the highest ROI for detecting architectural decay. It reveals the macro-structural problems (circular dependencies, unstable modules) that cause the biggest maintenance pain. Class-level analysis is reserved for targeted violation detection.

---

## Recommended Default

**Default:** Module-level analysis as the primary approach; class-level analysis for specific violation detection.

**Reason:** Module-level metrics (instability, abstractness, distance) provide actionable signals about architectural health. Class-level analysis adds noise that often overwhelms teams without proportional benefit.

---

## Risks Of Wrong Choice

Class-level only: misses module-level problems (cycles, unstable modules), overwhelming volume of findings. Module-level only: misses specific import violations, less actionable for individual developers.

---

## Related Rules

- Rule 4: Analyze at the module/package level, not only at the class level
- Rule 1: Track dependency metrics quarterly and act on negative trends

---

## Related Skills

- Perform Dependency Analysis on a Codebase
- Implement Architecture Fitness Functions

---

## Decision: Which Coupling Thresholds Trigger Investigation vs Action

---

## Decision Context

Define coupling metric thresholds that separate "needs monitoring" from "needs immediate action."

---

## Decision Criteria

* performance considerations: aggressive thresholds cause excessive alerting; loose thresholds miss decay
* architectural considerations: thresholds should match module type (domain modules should be tighter)
* security considerations: security-critical modules may need stricter thresholds
* maintainability considerations: thresholds must be realistic to maintain credibility

---

## Decision Tree

What is the module's distance from main sequence (D = |A + I - 1|)?
↓
D < 0.3 → Healthy: monitor quarterly (no action needed)
D 0.3-0.5 → Warning: investigate cause, document in tech debt backlog
D > 0.5 → Alert: create refactoring task with deadline
    ↓
    Is the module intentionally excluded (shared kernel, framework glue)?
    YES → Document exemption with explicit rationale
    NO → Schedule refactoring in next sprint
What is the module's efferent coupling (Ce)?
Ce < 10 → Healthy
Ce 10-20 → Warning: review outgoing dependencies, document
Ce > 20 → Alert: extract interface, apply DIP

---

## Rationale

Thresholds must be calibrated to the specific codebase and updated as architecture evolves. The recommended starting thresholds (D < 0.3 healthy, Ce < 10 healthy) are based on industry standards. Adjust based on your team's experience and codebase maturity.

---

## Recommended Default

**Default:** Alert at D > 0.5 and Ce > 20; investigate at D > 0.3 and Ce > 10.

**Reason:** These thresholds catch the most problematic modules without overwhelming the team. They align with industry-standard main sequence distance values.

---

## Risks Of Wrong Choice

Thresholds too strict: constant alerts ignored, loss of trust in metrics. Thresholds too loose: architectural decay goes undetected until unmanageable. No threshold variation by module type: penalizing intentionally unstable modules (controllers, facades).

---

## Related Rules

- Rule 3: Set explicit coupling thresholds per module and fail CI when exceeded
- Rule 5: Do not use metrics as rigid gates without contextual review

---

## Related Skills

- Perform Dependency Analysis on a Codebase
- Detect and Remediate Big Ball of Mud

---

## Decision: Which Modules to Refactor First Based on Distance from Main Sequence

---

## Decision Context

Prioritize modules for architectural refactoring based on their main sequence distance and coupling metrics.

---

## Decision Criteria

* performance considerations: refactor high-impact modules first (highest business value)
* architectural considerations: modules with highest distance need the most attention
* security considerations: security-critical modules with poor metrics are top priority
* maintainability considerations: consider refactoring effort vs benefit ratio

---

## Decision Tree

Which module has the highest distance from main sequence?
↓
Is the module in the top 20% by change frequency (most actively developed)?
↓
YES → Refactor first (high distance + high change frequency = growing problem)
NO → Is the module in the top 20% by business criticality?
    YES → Refactor first (high distance + critical = unacceptable risk)
    NO → Is the module blocking extraction or decomposition?
        YES → Refactor before extraction (must clean boundaries first)
        NO → Does the module have low change frequency?
            YES → Lower priority (still important but less urgent)
            NO → Moderate priority

---

## Rationale

Prioritize modules that are both architecturally unhealthy (high distance) and actively developed. These modules' problems compound over time as new code follows the existing (bad) patterns. Business-critical modules with high distance are risk amplifiers.

---

## Recommended Default

**Default:** Refactor modules with highest main sequence distance AND highest change frequency first.

**Reason:** These modules represent the fastest-growing architectural debt. Every change to a high-distance module without refactoring makes the problem worse.

---

## Risks Of Wrong Choice

Refactoring low-change modules first: high effort, low impact, team questions value of metrics program. Ignoring high-change modules: architectural decay accelerates in most active code areas, making future refactoring harder.

---

## Related Rules

- Rule 1: Track dependency metrics quarterly and act on negative trends
- Rule 2: Break dependency cycles immediately on detection

---

## Related Skills

- Perform Dependency Analysis on a Codebase
- Implement Architecture Fitness Functions
- Detect and Remediate Big Ball of Mud
