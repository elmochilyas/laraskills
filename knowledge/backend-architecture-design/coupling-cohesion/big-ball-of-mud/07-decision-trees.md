# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Big Ball of Mud detection and remediation
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Big Bang rewrite vs incremental extraction remediation strategy
* Decision 2: Which module to extract first from a Big Ball of Mud
* Decision 3: Facade wrapping vs full extraction for first remediation step

---

# Architecture-Level Decision Trees

---

## Decision: Big Bang Rewrite vs Incremental Extraction Remediation Strategy

---

## Decision Context

Choose the remediation strategy for a Big Ball of Mud codebase: rewrite from scratch or incrementally extract modules.

---

## Decision Criteria

* performance considerations: incremental extraction delivers value faster; rewrite delays everything
* architectural considerations: incremental extraction preserves business knowledge; rewrite risks losing it
* security considerations: rewrite may introduce new vulnerabilities; extraction maintains tested paths
* maintainability considerations: incremental extraction builds team confidence; rewrites often fail

---

## Decision Tree

Is the codebase smaller than 20K LOC and well-understood by the entire team?
↓
YES → Consider rewrite (manageable scope, clear understanding)
NO → Is the business still actively adding features to the codebase?
    YES → Incremental extraction (rewrite would block feature delivery for months)
    NO → Can the system be frozen for 6+ months for a rewrite?
        YES → Consider rewrite if business can absorb the risk
        NO → Incremental extraction (only viable option)
            ↓
            Has the team attempted a rewrite before and seen it fail?
            YES → Incremental extraction (proven approach)
            NO → Incremental extraction (lower risk, early wins)

---

## Rationale

Big Bang rewrites fail at an alarming rate (industry data suggests 70%+ fail or are abandoned). Incremental extraction via the Strangler Fig pattern delivers continuous improvement while keeping the system operational. Only very small, well-understood codebases should consider rewrite.

---

## Recommended Default

**Default:** Incremental extraction using the Strangler Fig pattern, extracting one module at a time.

**Reason:** Delivers continuous value, preserves business knowledge, keeps the system running, and builds team confidence. Rewrites almost always fail for non-trivial systems.

---

## Risks Of Wrong Choice

Big Bang rewrite: very high failure rate, months without delivery, business loses confidence. No remediation at all: continued architectural decay, ever-increasing maintenance costs.

---

## Related Rules

- Rule 3: Extract one module at a time — never attempt a big-bang rewrite
- Rule 1: Break the monolith at stable domain boundaries, not randomly

---

## Related Skills

- Detect and Remediate a Big Ball of Mud
- Implement Strangler Fig Pattern
- Perform Dependency Analysis

---

## Decision: Which Module to Extract First from a Big Ball of Mud

---

## Decision Context

Prioritize which module to extract first when remediating a Big Ball of Mud.

---

## Decision Criteria

* performance considerations: extract high-value modules that deliver visible improvement
* architectural considerations: most-constrained modules are easiest to extract
* security considerations: security-critical modules may need early extraction
* maintainability considerations: first extraction must succeed to build confidence

---

## Decision Tree

Which module has the lowest coupling to the rest of the system?
↓
Select that module (easiest to extract, highest success probability)
    ↓
    Is the selected module also high business value?
    YES → Extract first (best combination of ease + value)
    NO → Consider: Is there a module that is both high value AND moderately decoupled?
        YES → Extract that module instead (value justifies slightly harder extraction)
        NO → Extract the easiest module first (build pattern, then tackle harder ones)
    ↓
    Does the module have clear domain boundaries?
    YES → Proceed with extraction
    NO → Define boundaries via Event Storming or domain analysis first

---

## Rationale

The first extraction must succeed to build team confidence and establish the pattern. Choose the module that is most constrained (lowest coupling) and has clear domain boundaries. If a high-value module is only moderately coupled, it may be worth starting there for business impact.

---

## Recommended Default

**Default:** Extract the most-constrained, lowest-coupling module with clear domain boundaries first.

**Reason:** First extraction success is critical for team morale and pattern validation. Choose the easiest win to prove the approach works.

---

## Risks Of Wrong Choice

Hardest module first: extraction stalls, team loses confidence in the approach. Highest coupling module first: entangled dependencies make extraction nearly impossible. Module without clear boundaries: extraction creates more problems than it solves.

---

## Related Rules

- Rule 1: Break the monolith at stable domain boundaries, not randomly
- Rule 3: Extract one module at a time

---

## Related Skills

- Detect and Remediate a Big Ball of Mud
- Perform Dependency Analysis
- Identify Bounded Contexts

---

## Decision: Facade Wrapping vs Full Extraction for First Remediation Step

---

## Decision Context

Choose between wrapping a module behind a facade (minimal change) or fully extracting it into a separate module with its own structure.

---

## Decision Criteria

* performance considerations: facade adds indirection but is faster to implement
* architectural considerations: facade stops new coupling; full extraction reorganizes existing code
* security considerations: facade maintains existing security boundaries; extraction may create gaps
* maintainability considerations: facade is faster; extraction is more thorough

---

## Decision Tree

Is the module actively accumulating new cross-module dependencies?
↓
YES → Facade wrapping first ("capstone the mess" to stop the bleeding)
    ↓
    After wrapping, do you have capacity for full extraction now?
    YES → Proceed with full extraction (domain models, tests, CI boundaries)
    NO → Leave facade in place; plan extraction for next quarter
NO → Is the module well-understood with clear boundaries?
    YES → Full extraction (the module is ready, no need for intermediate facade)
    NO → Facade wrapping (define the boundary before reorganizing internals)

---

## Rationale

"Capstone the mess" — first prevent new violations by wrapping the tangled code behind a facade. Then extract incrementally. Facade wrapping is a quick win that stops the bleeding; full extraction is the thorough solution that follows.

---

## Recommended Default

**Default:** Facade wrapping first to stop new violations; full extraction in the next development cycle.

**Reason:** Stopping the inflow of new coupling is the highest priority. The facade provides an immediate boundary that new code must respect. Full extraction can follow at a sustainable pace.

---

## Risks Of Wrong Choice

Full extraction without facade first: new code continues to couple to the tangled module during extraction. Facade without extraction: temporary boundary becomes permanent, internal mess never cleaned.

---

## Related Rules

- Rule 4: First, stop the bleeding — capstone the mess before cleaning it
- Rule 2: Add a dependency analysis CI gate to prevent further mud growth

---

## Related Skills

- Detect and Remediate a Big Ball of Mud
- Implement Strangler Fig Pattern
- Implement Architecture Fitness Functions
