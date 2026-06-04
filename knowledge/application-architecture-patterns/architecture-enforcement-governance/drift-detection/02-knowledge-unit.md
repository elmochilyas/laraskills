# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Drift detection and architecture health
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Drift detection monitors how much the actual codebase deviates from the intended architecture. It produces a health metric—a percentage or score—that tracks drift over time. Drift sources: unauthorized imports, missing contracts, bypassed layers, and undocumented dependencies. Drift detection runs on every CI build and reports the health score. A declining score triggers an architecture review. Positive drift (code getting closer to the architecture) is rewarded.

---

# Core Concepts

**Architecture drift:** The gap between the intended architecture (documented rules) and the actual codebase. Measured as a drift score.

**Baseline:** The initial drift score when monitoring started. New code must not increase the drift. Existing drift is tracked and reduced over time.

**Drift budget:** An acceptable amount of drift that the team tolerates. Code that increases drift beyond the budget is flagged.

---

# Internal Mechanics

```php
class DriftDetector {
    public function calculateDrift(): DriftReport {
        $violations = $this->findImportViolations();
        $missingContracts = $this->findMissingContracts();
        $layerBypassing = $this->findLayerBypassing();

        $total = count($violations) + count($missingContracts)
            + count($layerBypassing);

        $score = max(0, 100 - ($total * 5));

        return new DriftReport(
            score: $score,
            importViolations: $violations,
            missingContracts: $missingContracts,
            layerBypassing: $layerBypassing,
        );
    }
}

// Output
// Architecture Health: 87/100
// - Import violations: 2
// - Missing contracts: 1
// - Layer bypassing: 0
```

---

# Patterns

**Drift dashboard:** A simple dashboard (or CI output) shows the health score over time. A graph of score per commit gives immediate feedback on whether the architecture is improving or degrading.

**Threshold alerts:** When drift exceeds a configurable threshold, CI fails. The team must address the drift before further work.

**Drift reduction as backlog items:** Track drift reduction as technical debt items in the backlog. Allocate time per sprint to reduce drift.

---

# Architectural Decisions

**Track drift automatically:** Manual assessments are inconsistent. Automated drift detection runs on every commit and provides consistent metrics.

**Health score over exact count:** A normalized score (0-100) is easier to track over time than absolute violation counts. Scores account for codebase size.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Quantitative architecture health | False positives in scoring |
| Early warning of degradation | Tooling to build and maintain |
| Visible to entire team | Score can be gamed |

---

# Common Mistakes

**No drift monitoring:** Architecture degrades incrementally. Each violation seems small. Over a year, the architecture is unrecognizable.

**Perfect score obsession:** Chasing a 100/100 score. Not all violations are equal. Some are low-risk and acceptable. Focus on reducing high-impact violations.

**Drift score without context:** A score of 75 is meaningless without knowing what caused it. Attach specific violation details to the score.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-05 Import violation detection | AEG-02 CI enforcement | AEG-09 Refactoring remediation |
| AEG-01 Architecture testing | AEG-03 Static analysis rules | AEG-10 Onboarding docs |

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
