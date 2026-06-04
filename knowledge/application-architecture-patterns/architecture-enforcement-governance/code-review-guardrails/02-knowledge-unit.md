# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Code review guardrails for architecture
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Code review guardrails are architectural checks enforced during code review. Not everything can be automated. Code review catches architectural violations that static analysis and tests miss: wrong abstraction level, misplaced responsibility, premature optimization, and design inconsistencies. Guardrails are documented checklists that reviewers apply. The goal is to shift architecture review left—reviewers check architecture before they check code style.

---

# Core Concepts

**Review checklist:** A list of architectural concerns to check during review. One checklist per change type (new module, cross-context change, refactoring).

**Architecture-first review:** The reviewer evaluates the architectural impact before reading implementation details. If the architecture is wrong, the implementation is irrelevant.

**Escalation path:** When a reviewer identifies a potential architectural violation but is not certain, they escalate to a senior developer or architect.

---

# Internal Mechanics

```
# Architecture Review Checklist for Cross-Context Changes

## Context Boundaries
- [ ] Does this change cross a bounded context?
- [ ] Does the consuming context use a contract (interface)?
- [ ] Is the contract versioned?
- [ ] Are the events idempotent?

## Dependency Direction
- [ ] Does any new import violate the dependency direction?
- [ ] Is the dependency direction explicitly documented?
- [ ] Could this be inverted using events?

## Model Integrity
- [ ] Does this change break another context's model?
- [ ] Are the DTOs immutable?
- [ ] Are Eloquent models exposed across contexts?
```

---

# Patterns

**Checklist per PR template:** PR templates include architecture checklist sections that the author fills in. The reviewer verifies.

**Architecture review label:** PRs with significant architecture impact are labeled `needs-architecture-review`. A senior developer reviews those PRs specifically.

**Review timebox for architecture:** The reviewer spends the first 5-10 minutes on architecture alone. If the architecture is wrong, they stop and reject the PR early rather than consuming time on implementation details.

---

# Architectural Decisions

**Default to automated enforcement:** If a rule can be automated (test, static analysis), automate it. Reserve code review for non-automatable concerns: design quality, abstraction level, consistency.

**Document architecture decisions in ADRs:** When a reviewer requests an architectural change, the outcome is documented as an ADR. Prevents recurring discussions.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Catches non-automatable violations | Human effort per PR |
| Design quality conversations | Review velocity slows down |
| Knowledge sharing | Reviewer training required |

---

# Common Mistakes

**No architecture checklist:** Reviewers review architecture without guidance. Consistent concerns are missed.

**Architecture review after implementation:** The reviewer reads the implementation and then considers architecture. They are less likely to suggest fundamental changes after seeing code.

**Relying solely on automated enforcement:** Automated tools catch import violations but not design quality violations. Code review is needed for the human element.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-01 Architecture testing | AEG-02 CI enforcement | AEG-06 ADRs |
| DBC-01 Bounded context basics | AEG-07 Team convention docs | AEG-10 Onboarding docs |

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
