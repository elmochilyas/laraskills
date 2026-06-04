# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Onboarding documentation for architecture
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Onboarding documentation for architecture is a structured introduction to the codebase's architectural decisions and conventions. It is the first document new developers read. It covers: bounded contexts map, dependency direction, contract system, common patterns, and reference material. The onboarding doc accelerates a new developer's ability to contribute without introducing architectural violations.

---

# Core Concepts

**Architecture onboarding doc:** A concise document (5-10 pages) that gives a new developer the mental model of the system. It covers what exists, why it exists, and how to work within it.

**Bounded context map:** A visual or textual diagram showing each context, its responsibilities, and its allowed dependencies. The most critical artifact for onboarding.

**Pattern reference:** An annotated list of the most common patterns in the codebase (service, action, event, command) with a link to an example implementation.

---

# Internal Mechanics

```markdown
# Architecture Onboarding

## 2. Bounded Contexts
Our application has 6 bounded contexts:

| Context | Responsibility | Depends on |
|---|---|---|
| Checkout | Cart, order placement | Shared, Billing |
| Billing | Payments, invoices | Shared |
| Inventory | Stock, warehouses | Shared |
| Catalog | Products, categories | Shared, Inventory |
| Notifications | Email, push, SMS | Shared |
| Shared | Value objects, contracts | (none) |

## 3. Cross-Context Communication
- All cross-context calls use Bridge contracts.
- Do NOT import classes from another context directly.
- See `docs/examples/cross-context-call.md`.

## 4. First Steps
1. Run `php artisan pest --testsuite=Architecture` to verify your setup.
2. Read the convention doc at `docs/conventions.md`.
3. Read ADR-001 through ADR-005 for key decisions.
4. Make a small change in your assigned context.
```

---

# Patterns

**Onboarding checklist:** A step-by-step checklist the new developer follows. Each step maps to a document to read or a task to perform.

**Example-first documentation:** Each pattern is demonstrated with before/after examples. Developers learn patterns by seeing real code transformations.

**Gated by architecture tests:** The onboarding process ends when the developer can make a change that passes architecture tests without violating rules.

---

# Architectural Decisions

**Onboarding doc is living:** Updated when new contexts are added or conventions change. An outdated onboarding doc is worse than none.

**Small doc is better:** 5-10 pages. If longer, split into reference docs and keep the onboarding doc as a guided tour.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Faster time-to-contribution | Initial writing effort |
| Fewer architecture violations by new devs | Must be kept current |
| Consistent mental model across team | Requires domain expert input |

---

# Common Mistakes

**No onboarding doc:** New developers learn by asking questions. Senior developers become bottlenecks. Knowledge is uneven.

**Outdated onboarding doc:** The doc describes the old architecture. New developers learn incorrect patterns and must relearn.

**Onboarding doc as fire hose:** All information dumped at once. The developer is overwhelmed. Structure the doc as progressive learning, not a reference manual.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-06 ADRs | AEG-07 Team convention docs | COS-09 Developer experience |
| AEG-01 Architecture testing | AEG-04 Code review guardrails | DBC-01 Bounded context basics |

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
