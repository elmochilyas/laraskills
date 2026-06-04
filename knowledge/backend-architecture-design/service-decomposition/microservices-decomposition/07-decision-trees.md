# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Architectural Styles
**Knowledge Unit:** Microservices decomposition threshold assessment
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Monolith first vs start with microservices
* Decision 2: Extraction candidate — which module to extract first
* Decision 3: Extraction order — business value vs technical dependency

---

# Architecture-Level Decision Trees

---

## Decision: Monolith First vs Start With Microservices

---

## Decision Context

Choose whether to start with a modular monolith and extract later or begin with microservices from day one.

---

## Decision Criteria

* performance considerations: monolith first avoids network overhead; microservices add latency on every call
* architectural considerations: monolith first defers distribution complexity; microservices distribute from day one
* security considerations: monolith has a smaller attack surface; microservices need service mesh security
* maintainability considerations: monolith first is simpler to develop and debug; microservices require observability investment

---

## Decision Tree

Is the team smaller than 10 developers?
↓
YES → Start with modular monolith (premature microservices are a leading cause of architectural failure)
    ↓
    Is the team experienced with distributed systems?
    YES → Still start with modular monolith unless specific pain points exist
    NO → Definitely start with modular monolith (learning curve is already steep)
NO → Are there 3+ independent teams working on the same codebase?
    YES → Is the deployment frequency bottlenecked by team coordination (8+ deploys/week)?
        YES → Evaluate: would microservices reduce coordination?
            ↓
            Are the boundaries between team responsibilities clear?
            YES → Consider microservices (start with 2-4 coarse-grained services)
            NO → Modular monolith first: establish boundaries, then extract
        NO → Modular monolith (deployment coordination is not yet a problem)
    NO → Modular monolith (single team doesn't need distribution)
↓
Are any of these true?
* Different parts of the system need different databases (SQL vs NoSQL)
* Different parts need to scale independently (10x difference in throughput)
* Different parts have conflicting technology requirements (not just preference)
| YES → Consider microservices for those specific parts only
| NO → Start with modular monolith
↓
Is there regulatory or compliance pressure for data isolation?
YES → Evaluate: microservices for data-isolated parts only
NO → Modular monolith is the default

---

## Rationale

Industry consensus (2024-2026) strongly favors "monolith first, extract later." Premature microservices are a leading source of architectural failure. Most applications never need microservices; those that do should extract incrementally. The modular monolith preserves extraction options without introducing distribution complexity.

---

## Recommended Default

**Default:** Start with a modular monolith with clear module boundaries. Extract into services only when team coordination, deployment frequency, or scaling requirements justify the cost.

**Reason:** Distribution adds significant complexity (networking, observability, deployment). You cannot undo premature distribution without a rewrite. Starting modular preserves the option to extract without paying the distributed cost upfront.

---

## Risks Of Wrong Choice

Starting with microservices: premature complexity, distributed monolith, overhead without benefit, exhausted team. Never extracting from a monolith that needs it: team coordination overhead, deployment bottlenecks, scaling limits.

---

## Related Rules

- Rule 1: Start with a modular monolith; extract services only when threshold criteria are met
- Rule 2: Decomposition threshold is reached when 2+ of these apply: team size >10, deployment coordination bottleneck, independent scaling needs

---

## Related Skills

- Build Modular Monolith
- Assess Decomposition Threshold
- Apply Strangler Fig Pattern

---

## Decision: Extraction Candidate — Which Module to Extract First

---

## Decision Context

Choose which module to extract from the monolith as the first service.

---

## Decision Criteria

* performance considerations: extract modules with different scaling requirements first
* architectural considerations: extract loosely coupled modules first (low risk)
* security considerations: extract modules with sensitive data isolation requirements first
* maintainability considerations: extract modules that change at different rates first

---

## Decision Tree

Does this module have clear, well-defined interfaces?
↓
YES → Extract candidate is viable
    ↓
    Does this module depend on many other modules?
    FEW (0-2) → Good extraction candidate (low external coupling)
    MANY (3+) → Consider: can dependencies be inverted?
        YES → Extract with interface for dependencies (module calls its own interfaces)
        ↓
        Are the dependent modules also candidates for extraction?
        YES → Extract as a group or migrate dependencies first
        NO → Not a good first candidate — too coupled
NO → Strengthen module boundaries first, then extract

Which modules have differences that make extraction valuable?
* Different scaling profile (10x different throughput) → Strong extraction candidate
* Different deployment frequency (weekly vs monthly) → Strong extraction candidate
* Different team ownership (separate teams) → Strong extraction candidate
* Different data store requirements (SQL vs NoSQL) → Strong extraction candidate

Combine evaluation:
Low coupling + high value = Extract next (highest priority)
Low coupling + low value = Extract when convenient (lowest priority)
High coupling + high value = Decouple first, then extract
    ↓
    Can interfaces be added to decouple this module without changing business logic?
    YES → Add interfaces, then extract
    NO → Extraction cost is high — evaluate if value justifies it

---

## Rationale

The best first extraction candidate has (1) clear interfaces, (2) few external dependencies, and (3) a clear reason to be separate (different scaling, deployment frequency, or team ownership). Extracting tightly coupled modules first creates additional work to refactor dependencies. Pick the low-risk, high-value extraction first as the pilot.

---

## Recommended Default

**Default:** Extract a loosely coupled, low-risk module first (e.g., notifications, reports) as a pilot. Extract tightly coupled modules only after adding interfaces and reducing coupling.

**Reason:** A successful pilot builds team confidence in the extraction process. Start with the module that offers the most extraction benefit at the lowest cost.

---

## Risks Of Wrong Choice

Extracting tightly coupled module first: forced to refactor many dependencies simultaneously, high risk of breaking changes, team loses confidence. Extracting low-value module first: no meaningful benefit, team questions whether extraction is worth the effort.

---

## Related Rules

- Rule 3: Extract modules with the least coupling first; strengthen boundaries before extracting coupled modules

---

## Related Skills

- Apply Strangler Fig Pattern
- Assess Module Coupling
- Design Module Interfaces

---

## Decision: Extraction Order — Business Value vs Technical Dependency

---

## Decision Context

Choose whether to prioritize extraction order by business value or by technical dependency constraints.

---

## Decision Criteria

* performance considerations: dependency-led order avoids rework; value-led order may require backtracking
* architectural considerations: dependency-led follows the natural dependency graph; value-led may violate it
* security considerations: security-critical modules should be extracted early regardless of dependencies
* maintainability considerations: dependency-led order is safer; value-led order may create temporary technical debt

---

## Decision Tree

Does module A depend on module B (A calls B)?
↓
YES → B must be extracted before or alongside A (dependency constraint)
    ↓
    Is A higher business value than B?
    YES → Extract B first (needed as foundation), then extract A
    NO → Extract B first (already aligned with both value and dependency ordering)
NO → No dependency constraint — extract by business value
    ↓
    What's the business value of extracting this module?
    HIGH (core differentiator, frequent changes, team growth) → Extract early
    LOW (stable, generic, rarely changes) → Extract later or leave in monolith

---

## Rationale

Extraction order must respect the dependency graph: if A depends on B, extract B first (or at least before A). Within dependency constraints, prioritize by business value. Modules that change faster, are owned by growing teams, or are core differentiators should be extracted earlier.

---

## Recommended Default

**Default:** Respect the dependency graph first, then extract by business value. Extract foundational modules (B before A if A depends on B) even if they have lower business value.

**Reason:** Violating the dependency graph creates temporary coupling that must be refactored later — costing more than extracting in dependency order. Business value prioritization only applies when no dependency constraints exist.

---

## Risks Of Wrong Choice

Value-led without dependency check: extracting A before B forces backward-engineering interfaces for B or maintaining parallel implementations. Dependency-led without business consideration: extracting low-value foundational modules first delays ROI and may complete before proving the pattern works.

---

## Related Rules

- Rule 4: Extract downstream modules before upstream modules (dependency order)

---

## Related Skills

- Apply Strangler Fig Pattern
- Map Module Dependency Graph
- Design Module Interfaces for Extraction
