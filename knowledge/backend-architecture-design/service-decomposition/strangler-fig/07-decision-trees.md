# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Strangler fig pattern for incremental decomposition
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Extraction candidate selection — which feature to strangle first
* Decision 2: Extraction order — business value vs technical readiness
* Decision 3: Routing strategy — proxy routing vs feature flags

---

# Architecture-Level Decision Trees

---

## Decision: Extraction Candidate Selection — Which Feature to Strangle First

---

## Decision Context

Choose which feature or module to extract from the legacy system first when applying the strangler fig pattern.

---

## Decision Criteria

* performance considerations: extract features with clear performance issues first for measurable improvement
* architectural considerations: extract features with loose coupling first (lowest risk)
* security considerations: extract security-critical features early for better isolation
* maintainability considerations: extract features that change most frequently for immediate benefit

---

## Decision Tree

Does the candidate feature have a well-defined interface to the rest of the system?
↓
YES → Is the feature tightly coupled to the legacy system?
    NO (few dependencies) → Good extraction candidate
    ↓
    Can the feature be tested independently in the new service?
    YES → Strong candidate (independent testability = low risk)
    NO → Refactor interface to enable independent testing before extraction
    YES (many dependencies) → Can the interface be created/exposed first?
        YES → Create interface, then extract (decouple before extraction)
        NO → Not suitable as first candidate — choose a less coupled feature
NO → Define the interface first before considering extraction

Evaluate the business case:
Is this feature causing pain (slow releases, scaling issues, performance problems)?
YES → Extract next (pain-driven prioritization is valid)
NO → Is this a core business differentiator that changes frequently?
    YES → Extract early (maximizes ROI of the new service)
    NO → Extract later or leave in legacy (not worth the extraction cost)

---

## Rationale

The best first strangler fig candidate has three properties: (1) a well-defined interface, (2) loose coupling to the legacy system, and (3) a clear business case for extraction (pain, differentiation, or change frequency). Start with the feature that provides the highest return for the lowest extraction risk. Successful early candidates build team confidence and organizational momentum.

---

## Recommended Default

**Default:** Extract a loosely coupled, low-risk feature first (e.g., reporting, notifications) as a pilot. Extract tightly coupled features only after interfaces are established.

**Reason:** A successful pilot proves the pattern, builds team confidence, and establishes the infrastructure and patterns for subsequent extractions.

---

## Risks Of Wrong Choice

Extracting tightly coupled feature first: high risk, slow progress, team loses confidence. Extracting low-value feature first: no meaningful benefit, stakeholders question the value of strangling. Extracting without interface: new service contract doesn't match legacy, integration failures.

---

## Related Rules

- Rule 2: Extract features with the most independence first
- Rule 3: Before extracting a coupled feature, decouple it first

---

## Related Skills

- Assess Feature Coupling
- Apply Strangler Fig Pattern
- Design Feature Interfaces for Extraction

---

## Decision: Extraction Order — Business Value vs Technical Readiness

---

## Decision Context

Choose whether to prioritize extraction by business value or by technical readiness (coupling level, interface quality).

---

## Decision Criteria

* performance considerations: technically ready features are faster to extract; value-driven may require unplanned refactoring
* architectural considerations: dependency order must be respected (downstream before upstream)
* security considerations: security-critical features should be extracted early regardless of readiness
* maintainability considerations: value-driven extraction may leave technical debt; readiness-driven is safer

---

## Decision Tree

Does feature A depend on feature B (A uses B's data or services)?
↓
YES → B must be extracted before or with A (dependency constraint)
    ↓
    Is A higher business value than B?
    YES → Extract B first (dependency requirement), then A (higher value)
    ↓
    While extracting B, design interface with A's future needs in mind
    NO → Extract B first (aligned with both value and dependency)
NO → No dependency constraint — prioritize by business value
    ↓
    What is the feature's extraction readiness score?
    Interface defined? (+2 points)
    Tested independently from legacy? (+2 points)
    No shared database tables? (+2 points)
    Feature-flagged in production? (+1 point)
    Team familiar with the domain? (+1 point)
    Score 0-4 → Improve readiness first (coupling reduction, interface definition)
    Score 5-8 → Extract now (ready for extraction)

---

## Rationale

Extraction order must respect the dependency graph: downstream modules before upstream. Within those constraints, prioritize by business value. If a high-value feature has low technical readiness, invest in decoupling it first rather than extracting a feature that's technically ready but provides no business benefit.

---

## Recommended Default

**Default:** Respect dependency order (extract foundational features first), then prioritize by business value. For high-value but coupled features, decouple first then extract.

**Reason:** Violating dependency order creates temporary coupling or parallel implementations. Business value maximizes ROI. Combine both: extract in dependency order but invest more decoupling effort in high-value features.

---

## Risks Of Wrong Choice

Pure value-driven: extracting A before B if A depends on B forces maintaining two implementations. Pure readiness-driven: extracting low-value features first delays ROI and may exhaust budget before the high-value features are reached.

---

## Related Rules

- Rule 4: Extract downstream features before upstream features (dependency order)

---

## Related Skills

- Map Feature Dependencies
- Apply Value vs Effort Prioritization
- Design Modular Interfaces for Extraction

---

## Decision: Routing Strategy — Proxy Routing vs Feature Flags

---

## Decision Context

Choose how to route requests to the new service vs the legacy system during strangler fig migration.

---

## Decision Criteria

* performance considerations: proxy adds a network hop; feature flags are evaluated in-process
* architectural considerations: proxy works at the infrastructure level; feature flags work in application code
* security considerations: proxy can enforce auth at the routing layer; feature flags need application-level checks
* maintainability considerations: proxy is transparent to application code; feature flags require code changes

---

## Decision Tree

Is there an existing reverse proxy or API gateway in the infrastructure?
↓
YES → Proxy routing is feasible
    ↓
    Can the proxy route based on URL path or headers to distinguish extracted vs legacy features?
    YES → Use proxy routing (transparent to application code)
    ↓
    Is the feature identifiable by a unique URL pattern (e.g., /api/v2/orders)?
    YES → Proxy routing is clean and simple (v2 routes → new service, v1 → legacy)
    NO → Proxy routing is possible but may require header inspection or custom logic
    NO → Proxy routing may still be feasible but requires infrastructure setup
NO → Use feature flags in the application code
    ↓
    Is this a user-facing feature that should be tested with a subset of users?
    YES → Feature flags (can enable for specific users/groups for A/B testing)
    ↓
    Can the flag be removed easily after full migration?
    YES → Feature flags are appropriate
    NO → Design the flag for easy removal (one centralized check, not scattered conditionals)
    NO → Is the routing decision based on request properties (URL, headers, params)?
        YES → Proxy routing is still possible — can the proxy identify the feature by request properties?
            YES → Use proxy routing despite no existing proxy
            NO → Feature flags with URL/header matching in application code

Consider hybrid approach:
Can some features be proxy-routed (clear URL boundaries) while others use feature flags (complex logic)?
YES → Hybrid: use proxy for path-based routing, feature flags for user-based gradual rollout
NO → Choose the simpler option that fits the infrastructure

---

## Rationale

Proxy routing is transparent to application code, requires no code changes in existing features, and operates at the infrastructure level. Feature flags provide fine-grained control (per-user, A/B testing) but require code changes and ongoing maintenance. The choice depends on existing infrastructure, feature identification capability, and whether gradual per-user rollout is needed.

---

## Recommended Default

**Default:** Start with feature flags for user-facing features (A/B testing, gradual rollout). Use proxy routing when the infrastructure supports it and the feature is clearly path-identifiable.

**Reason:** Feature flags provide the most control and safety for gradual migrations. Proxy routing is cleaner but requires matching infrastructure and clear feature identification.

---

## Risks Of Wrong Choice

Proxy only without gradual rollout: cannot test with limited audience, big-bang switchover risk. Feature flags without cleanup plan: accumulating flag conditionals, technical debt, difficult code maintenance. No routing strategy: cannot safely test new service alongside legacy, all-or-nothing migration.

---

## Related Rules

- Rule 5: Always maintain the ability to rollback — use feature flags or proxy routing
- Rule 1: Each replacement must be independently testable and rollbackable

---

## Related Skills

- Implement Feature Flags for Migration
- Configure Proxy/Gateway for Strangler Fig
- Design Rollback Strategy
