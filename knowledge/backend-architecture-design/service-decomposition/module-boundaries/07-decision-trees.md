# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Module boundaries in monoliths
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Boundary definition — event storming vs code analysis vs business capability mapping
* Decision 2: Module communication pattern — sync vs async within monolith
* Decision 3: Boundary enforcement — manual discipline vs automated checks

---

# Architecture-Level Decision Trees

---

## Decision: Boundary Definition — Event Storming vs Code Analysis vs Business Capability Mapping

---

## Decision Context

Choose the method for identifying where module boundaries should be drawn in the monolith.

---

## Decision Criteria

* performance considerations: boundary definition method doesn't affect performance directly
* architectural considerations: event storming produces domain-aligned boundaries; code analysis reveals current structure
* security considerations: event storming identifies actors and commands that help define access boundaries
* maintainability considerations: event storming requires domain expert time; code analysis is fully technical

---

## Decision Tree

Does the team include domain experts who can participate in workshops?
↓
YES → Use Event Storming (best outcome — boundaries align with business domain)
    ↓
    Is this a greenfield project (no existing codebase)?
    YES → Event Storming first, validate boundaries after initial development
    NO → Event Storming + validate boundaries against code analysis of existing system
    ↓
    Are domain experts available for 2-3 full-day workshops?
    YES → Full Event Storming process (recommended)
    NO → Lightweight Event Storming (focus on core subdomain, skip generic)
NO → Does an existing codebase need boundary identification?
    YES → Use code analysis (Deptrac, PHPStan, static analysis)
    ↓
    Can you identify natural groups by namespace usage and dependency patterns?
    YES → Define module boundaries by dependency clusters (groups of classes with high internal coupling)
    ↓
    Validate: do these clusters align with business concepts?
    YES → Boundaries are validated
    NO → Refine boundaries: combine clusters that serve the same business concept
    NO → Use business capability mapping (interview stakeholders, map processes)
NO → Use business capability mapping (identify business processes and group by function)

---

## Rationale

Event Storming produces the most domain-aligned boundaries but requires domain expert participation. Code analysis reveals the current structure (which may or may not align with domain concepts). Business capability mapping is a middle ground that requires stakeholder interviews but no domain modelers. For existing codebases, start with code analysis and validate against business concepts.

---

## Recommended Default

**Default:** Event Storming for greenfield projects with domain expert access. Code analysis for existing codebases, validated against business capability mapping.

**Reason:** Domain-aligned boundaries are more stable than technically-derived ones. Event Storming produces the best alignment but requires expert investment. Code analysis is pragmatic for existing systems.

---

## Risks Of Wrong Choice

Pure code analysis without domain validation: boundaries reflect past accidents rather than intentional design. Event Storming without technical validation: boundaries may not match framework constraints. No clear boundary method: arbitrary module splitting that creates more coupling than it solves.

---

## Related Rules

- Rule 1: Module boundaries should align with domain business concepts and enable future extraction

---

## Related Skills

- Facilitate Event Storming Workshop
- Map Business Capabilities
- Analyze Code Dependencies with Deptrac

---

## Decision: Module Communication Pattern — Sync vs Async Within Monolith

---

## Decision Context

Choose whether modules communicate synchronously (direct method call) or asynchronously (events/queue) within the same monolith.

---

## Decision Criteria

* performance considerations: sync is faster (no serialization/queue overhead); async adds latency but improves resilience
* architectural considerations: sync is simpler; async provides temporal decoupling and prepares for future extraction
* security considerations: async messages can be validated and authorized at the queue consumer boundary
* maintainability considerations: async requires more infrastructure (queue, failed job handling); sync is direct and debuggable

---

## Decision Tree

Is transactional consistency required across both modules?
↓
YES → Use sync communication (same DB transaction)
    ↓
    Are these truly separate modules if they share a transaction?
    YES → Accept sync for this operation, but keep it rare (<10% of cross-module calls)
    NO → Consider merging modules (shared transactions suggest coupled modules)
NO → Is this communication latency-sensitive (<200ms response expected)?
    YES → Sync communication (async adds queue and processing delay)
    NO → Prefer async (event-driven) for true module decoupling
    ↓
    Could this module be extracted into a separate service in the future?
    YES → Definitely use async (events translate naturally to network calls)
    NO → Sync is acceptable (no extraction plans)

---

## Rationale

Sync communication within a monolith is simpler and faster but creates temporal coupling. Async communication prepares modules for future extraction and improves resilience — the consumer doesn't need to be available for the producer to succeed. Use sync only when transactional consistency demands it or when latency requirements preclude queue processing.

---

## Recommended Default

**Default:** Async communication (events) for module interactions. Sync only when transactional consistency is required or latency is critical.

**Reason:** Async decouples modules temporally, prepares for future extraction, and improves system resilience. Sync is simpler but couples module lifecycles.

---

## Risks Of Wrong Choice

Sync for all: modules become temporally coupled, extraction requires rewriting communication, cascading failures. Async for everything: unnecessary queue infrastructure for simple CRUD operations, debugging difficulty, eventual consistency surprise.

---

## Related Rules

- Rule 3: Favor async communication across module boundaries; use sync only for transactional consistency

---

## Related Skills

- Implement Laravel Events for Cross-Module Communication
- Design Monolith Event Flow

---

## Decision: Boundary Enforcement — Manual Discipline vs Automated Checks

---

## Decision Context

Choose how to ensure module boundaries are respected — through team discipline or automated tooling.

---

## Decision Criteria

* performance considerations: automated checks add CI time but no runtime overhead
* architectural considerations: automated checks encode architecture as executable rules
* security considerations: automated checks prevent accidental boundary violations that could expose data
* maintainability considerations: automated checks are consistent; manual discipline degrades over time

---

## Decision Tree

Is the team larger than 5 developers?
↓
YES → Automated enforcement is strongly recommended (manual discipline doesn't scale)
    ↓
    Does the build/deploy pipeline allow for static analysis CI steps?
    YES → Use automated enforcement
    ↓
    Choose enforcement tool:
    Laravel framework → Use PHPStan custom rules or PHPArkitect
    General PHP → Use Deptrac for module-level dependency analysis
    Both available → PHPStan for import rules + Deptrac for layer rules
    NO → Manual discipline + ADRs (but these fade as team grows)
NO → Is boundary violation detection done in code review?
    YES → Manual code review + ADR documentation (acceptable for small teams)
    ↓
    Would one undetected boundary violation cause a production incident?
    YES → Add automated checks anyway (cost of violation is too high)
    NO → Manual review is acceptable, but add automated checks when team grows
    NO → No enforcement yet — define boundaries first

---

## Rationale

Manual discipline degrades over time, especially as teams grow and turnover occurs. Automated checks (PHPStan rules, Deptrac, PHPArkitect) encode architecture into executable tests that run in CI, catching violations before they merge. For small teams (<5), manual review may be sufficient, but automated checks should be added as the team grows.

---

## Recommended Default

**Default:** Automated enforcement with PHPArkitect or Deptrac from day one. Manual code review as a secondary check.

**Reason:** Manual discipline is unreliable at scale. Automated checks catch boundary violations before they merge, enforce architecture without human oversight, and serve as living documentation.

---

## Risks Of Wrong Choice

Manual only: violations accumulate unnoticed, modules become coupled, extraction becomes impossible. Overly strict automation: legitimate cross-boundary communication requires rule exceptions, fighting the tool. No enforcement: boundaries exist only on paper, code inevitably drifts into a big ball of mud.

---

## Related Rules

- Rule 4: Enforce module boundaries with automated tooling (PHPStan, Deptrac, PHPArkitect)

---

## Related Skills

- Configure PHPStan for Module Boundary Enforcement
- Configure Deptrac for Dependency Analysis
- Configure PHPArkitect for Architecture Rules
- Design Architecture Fitness Functions
