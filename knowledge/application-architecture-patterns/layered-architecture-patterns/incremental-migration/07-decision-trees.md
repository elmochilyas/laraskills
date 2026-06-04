# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Incremental migration from MVC to layered architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Strangler Fig migration vs big-bang rewrite
* Migration stopping point: which phase is enough
* Feature-by-feature migration vs layer-by-layer migration

---

# Architecture-Level Decision Trees

---

## Strangler Fig Migration vs Big-Bang Rewrite

---

## Decision Context

The Strangler Fig pattern gradually replaces old code with new code while both coexist. Big-bang rewrite replaces everything at once. The choice determines risk profile and delivery timeline.

---

## Decision Criteria

* performance considerations — two structures coexist during strangler; big-bang has one structure after downtime
* architectural considerations — strangler allows incremental value delivery; big-bang has all-or-nothing risk
* security considerations — strangler requires careful boundary management between old and new
* maintainability considerations — strangler requires adapter glue; big-bang requires extended development without deployment

---

## Decision Tree

Migration approach?
↓
Can the application tolerate a period of downtime for rewrite?
YES → Big-bang rewrite possible — but high risk
NO → Must maintain ongoing feature delivery during migration?
    YES → Strangler Fig — always preferred
    NO → Is the codebase small enough (<50 files) to rewrite in <2 weeks?
        YES → Big-bang may be acceptable — low risk
        NO → Strangler Fig — incremental

---

## Rationale

The Strangler Fig pattern is strongly preferred for production applications. It allows new features to be delivered during migration and provides a rollback path at any point. Big-bang rewrites carry enormous risk — months of development without any deployment, followed by a high-risk cutover.

---

## Recommended Default

**Default:** Strangler Fig pattern — never big-bang rewrite
**Reason:** Big-bang rewrites block feature delivery for weeks or months and carry enormous regression risk. Strangler Fig allows incremental value delivery, rollback at any phase, and stops when cost exceeds benefit.

---

## Risks Of Wrong Choice

Big-bang rewrite risks months of development without deployment, followed by a high-risk cutover. Strangler Fig without clear boundaries creates architectural confusion with two coexisting structures.

---

## Related Rules

- Rule: Use the Strangler Fig Pattern — New Code in New Structure, Old Code Stays (LAP-12/05-rules.md)
- Rule: Stop at Any Phase When Cost Exceeds Benefit (LAP-12/05-rules.md)

---

## Related Skills

- Migrate Incrementally from MVC to Layered Architecture (LAP-12/06-skills.md)
- Plan Module Extraction Path from Monolith (MMD-11/06-skills.md)

---

## Migration Stopping Point: Which Phase Is Enough

---

## Decision Context

The migration has four phases: controller thinning → action isolation → interface introduction → full restructuring. Each phase provides standalone value. The decision is when to stop based on cost-benefit analysis.

---

## Decision Criteria

* performance considerations — earlier phases have lower overhead
* architectural considerations — each phase adds more abstraction and flexibility
* security considerations — later phases provide better test isolation
* maintainability considerations — each phase adds complexity that must be maintained

---

## Decision Tree

Migration stopping point?
↓
Are controllers still fat and untestable?
YES → Continue to Phase 1 (Controller thinning) — highest value
NO → Are services becoming god objects (10+ unrelated methods)?
    YES → Continue to Phase 2 (Action isolation)
    NO → Is testing still requiring Laravel bootstrap?
        YES → Continue to Phase 3 (Interface introduction)
        NO → Is framework migration or multi-delivery mechanism needed?
            YES → Continue to Phase 4 (Full restructuring)
            NO → STOP — current phase is sufficient

---

## Rationale

Each migration phase provides independent value. Phase 1 (controller thinning) solves fat controllers — the most common problem. Phase 2 (action isolation) prevents god services. Phase 3 (interface introduction) enables mocking. Phase 4 (full restructuring) provides framework independence. Stop when the current phase solves your problem.

---

## Recommended Default

**Default:** Stop at Phase 1 (controller thinning) unless Phase 2+ pain is demonstrated
**Reason:** Controller thinning provides the highest value-to-cost ratio. Only proceed to deeper phases when specific pain (god services, testing difficulty, framework coupling) is demonstrated.

---

## Risks Of Wrong Choice

Stopping too early leaves architectural problems unsolved. Proceeding too far adds costs (2-4x files, slower development) without proportional benefit.

---

## Related Rules

- Rule: Stop at Any Phase When Cost Exceeds Benefit (LAP-12/05-rules.md)
- Rule: Document Current Migration Phase (LAP-12/05-rules.md)

---

## Related Skills

- Migrate Incrementally from MVC to Layered Architecture (LAP-12/06-skills.md)
- Implement Controller Thinning (SLP-03/06-skills.md)

---

## Feature-by-Feature Migration vs Layer-by-Layer Migration

---

## Decision Context

Migration can proceed feature-by-feature (migrate complete features one at a time) or layer-by-layer (migrate all models first, then all services, then all controllers). The choice affects consistency and delivery risk.

---

## Decision Criteria

* performance considerations — no significant difference
* architectural considerations — feature-by-feature enables incremental value; layer-by-layer causes half-migration
* security considerations — feature-by-feature allows focused security review
* maintainability considerations — feature-by-feature keeps each feature internally consistent

---

## Decision Tree

Migration sequence?
↓
Can features be identified as independent business capabilities?
YES → Feature-by-feature — migrate one feature completely
NO → Is the codebase tightly coupled (no clear feature boundaries)?
    YES → Layer-by-layer with adapter glue — but risk of half-migration
    NO → Feature-by-feature — preferred for clean architecture migration

---

## Rationale

Feature-by-feature migration ensures each feature is internally consistent — all its code follows the same architecture. Layer-by-layer migration creates a long period where some layers are "new" and others "old," causing confusion about which architecture to follow.

---

## Recommended Default

**Default:** Feature-by-feature migration
**Reason:** Each migrated feature is internally consistent. Developers working on a feature know which architecture to follow. Layer-by-layer creates a messy intermediate state where developers must work across both architectures.

---

## Risks Of Wrong Choice

Layer-by-layer migration creates a half-migration state where models are in new architecture but controllers are in old — every feature touches both architectures. Feature-by-feature without clear feature boundaries may miss cross-cutting architectural changes.

---

## Related Rules

- Rule: Use the Strangler Fig Pattern (LAP-12/05-rules.md)
- Rule: Stop at Any Phase When Cost Exceeds Benefit (LAP-12/05-rules.md)

---

## Related Skills

- Migrate Incrementally from MVC to Layered Architecture (LAP-12/06-skills.md)
- Apply the Boy Scout Rule During Migration (LAP-12/06-skills.md)
