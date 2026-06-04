# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Architecture Decision Records (ADRs)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Architecture Decision Records (ADRs) document significant architecture decisions with their context, options considered, and rationale. ADRs are lightweight documents stored in the repository. They provide a permanent record of why a decision was made, preventing repeated debates. Each ADR follows a template: Title, Status, Context, Decision, Consequences.

---

# Core Concepts

**ADR:** A short document (1-2 pages) capturing a single architecture decision. Stored in `docs/adr/` and numbered sequentially.

**Decision:** The chosen option. Stated clearly with justification.

**Consequences:** The tradeoffs accepted by the decision. Not just benefits—explicit tradeoffs and future implications.

---

# Internal Mechanics

```markdown
# ADR-001: Use Modular Monolith over Microservices

## Status
Accepted

## Context
We need to choose an architecture for the new e-commerce platform.
Microservices were considered but the team is small (5 engineers)
and the domain is well-understood with clear boundaries.

## Decision
We will build a modular monolith with bounded contexts.
Each context has its own database schema and communicates
via events. The monolith will be deployed as a single unit.

## Consequences
- Positive: Lower operational complexity, faster feature delivery
- Negative: Cannot scale contexts independently
- Tradeoff: If the monolith grows beyond team capacity,
  extraction of contexts to microservices is possible
```

---

# Patterns

**ADR per significant decision:** Every decision with lasting impact gets an ADR. Not for routine choices or implementation details.

**ADR review as part of PR:** When a PR introduces an architectural decision, it includes a new ADR. The ADR is reviewed alongside the code.

**ADR supersession:** An ADR can supersede a previous ADR. The superseded ADR is updated to `Superseded by ADR-NNN`. Provides a clear history of evolving decisions.

---

# Architectural Decisions

**Write ADRs early:** Before implementing the decision, write the ADR. If the ADR is clear, the implementation follows. If the rationale is weak, rethink before coding.

**Include rejected options:** Documenting why an option was rejected is as valuable as documenting why one was chosen. Future readers need to know options were considered.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Permanent decision record | Writing discipline required |
| Prevents repeated debates | ADRs can become outdated |
| Onboarding context | Must remember to create them |

---

# Common Mistakes

**No ADRs:** Decisions are made in conversations or Slack. Months later, no one remembers why. The decision is revisited indefinitely.

**ADRs as documentation for documentation's sake:** Writing ADRs that no one reads. Store them in the repository, link them in PRs, and reference them in discussions.

**ADRs that are too long:** An ADR should be 1-2 pages. If it is longer, the decision is too broad and should be split.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-04 Code review guardrails | AEG-07 Team convention docs | AEG-10 Onboarding docs |
| COS-01 Dependency direction | AEG-08 Drift detection | AEG-09 Refactoring remediation |

---

## Mental Models

**The "Automated Guardrails" model:** Architecture tests are guardrails, not gates. They prevent known violations automatically while allowing legitimate exceptions. Like highway guardrails, they should be placed where violations are likely, not everywhere.

**The "Executable Documentation" model:** Architecture tests are documentation that runs. A test like "Services may not call Controllers" documents the dependency rule AND enforces it. Reading the architecture tests should tell you how the system is structured.

**The "Shift Left" model:** Catching architectural violations early (at commit/PR time) is dramatically cheaper than fixing them in production. CI enforcement moves architecture validation to the left in the development lifecycle.

---

## Performance Considerations

Architecture tests run during CI, not at runtime, so they have zero production performance impact. The cost is CI pipeline time. A test suite of 50-100 architecture tests takes 1-5 seconds. This is negligible in a typical CI pipeline (5-15 minutes). Static analysis tools (PHPStan, Psalm) also run in CI and add similar overhead. The cost is far outweighed by the cost of finding architectural violations in production.

---

## Production Considerations

Architecture enforcement must be a non-negotiable part of the CI pipeline. Run architecture tests on every PR, not just on main branch merges. Configure the CI to block merges on architecture test failures. Maintain an allowed violations list for legitimate exceptions that are reviewed periodically. Integrate architecture tests with code review: automatically flag PRs that modify files they should not. Rotate responsibility for maintaining architecture tests among team members to prevent knowledge silos.

---

## Failure Modes

**False sense of security:** Architecture tests exist but do not cover the most important rules. Teams assume the architecture is enforced but critical violations go undetected.

**Outdated tests:** Architecture tests that were written once and never updated. The architecture has evolved but the tests still enforce old rules. Tests start failing or are disabled.

**Too many exceptions:** The exception list grows to 30+ entries. Every violation is excused. The architecture tests are no longer meaningful. Reset and re-evaluate which rules truly matter.

---

## Ecosystem Usage

pestphp/pest-plugin-arch is the most popular architecture testing tool for Laravel (2025-2026). dshafik/phpunit-arch provides PHPUnit-based architecture testing. arquitetura/php-arch-test is an alternative for teams not using Pest. PHPStan at level 6+ catches import violations and type errors. Laravel IDE Helper prevents Facade/Helper misuse. deptrac provides static analysis for dependency rules. GitHub Actions and GitLab CI are the most common CI platforms for running architecture tests.

---

## Research Notes

Research in 2025-2026 shows architecture testing becoming standard practice in Laravel teams. The Pest architecture plugin adoption has accelerated this trend by making architecture rules as easy to write as feature tests. The industry trend toward shift left security and quality practices supports architecture testing adoption. Javas ArchUnit and Pythons import-linter demonstrate that architecture enforcement is a cross-language best practice. The key insight: architecture tests are most effective when they encode rules that are frequently violated, not every possible rule.
