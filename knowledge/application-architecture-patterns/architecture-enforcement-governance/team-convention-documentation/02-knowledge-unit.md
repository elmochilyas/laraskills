# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Team convention documentation
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Team convention documentation captures the team's agreed-upon coding and architecture standards in a living document. Unlike ADRs which capture individual decisions, conventions capture ongoing practices: naming, file layout, test structure, dependency rules, and review expectations. The convention doc is the single source of truth for how the team builds software. It is referenced during reviews, onboarding, and discussions.

---

# Core Concepts

**Convention doc:** A living document in the repository (`docs/conventions.md`) that records the team's agreements. Updated by PR. Referenced in code review.

**Living document:** The convention doc evolves with the team. Outdated conventions are removed. New conventions are added as they are agreed upon.

**Referenced in reviews:** Code review comments link to specific convention sections. "See [Conventions §3.2](/docs/conventions.md#32-service-patterns)."

---

# Internal Mechanics

```markdown
# Architecture Conventions

## 3. Bounded Context Communication
### 3.1 Cross-Context Calls
- All cross-context calls must use a Bridge contract.
- The contract is defined in the consuming context.
- The adapter lives in the producing context.

### 3.2 Domain Events
- Events are named in past tense (`OrderPlaced`).
- Events carry fat payloads (all data the consumer needs).
- Internal and integration events use separate classes.

### 3.3 Repository Pattern
- Every aggregate has a repository interface.
- Repositories return domain objects, not Eloquent models.
- Queries that return read models use dedicated query classes.
```

---

# Patterns

**Conventions as code:** Use architecture tests to enforce the conventions. Each convention section maps to one or more architecture tests. If the test passes, the convention is followed.

**PR for convention changes:** Changing a convention requires a PR. The PR includes the convention update and (optionally) a mass update of existing code.

**Periodic convention review:** Every quarter, the team reviews the convention doc. Remove outdated entries. Add new patterns that emerged.

---

# Architectural Decisions

**Conventions over automation when:** The rule is hard to automate or requires human judgment. Automate when possible, document when not.

**One convention doc per project:** Avoid multiple documents (one for code style, one for architecture, one for testing). A single document is easier to find and maintain.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Single source of truth | Must be maintained |
| Faster onboarding | Can become outdated |
| Consistent reviews | Initial writing effort |

---

# Common Mistakes

**No convention doc:** Conventions exist only in senior developers' heads. New developers learn by osmosis.

**Convention doc that is too long:** A 50-page document that no one reads. Keep it concise—one convention per section, no fluff.

**Outdated conventions:** The doc says one thing, the codebase does another. Developers stop trusting the doc.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-06 ADRs | AEG-04 Code review guardrails | AEG-10 Onboarding docs |
| COS-01 Dependency direction | AEG-01 Architecture testing | AEG-08 Drift detection |

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
