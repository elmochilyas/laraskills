# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Refactoring and remediation workflows
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Refactoring and remediation workflows fix architectural violations systematically. The workflow: detect violation, assess impact, plan remediation, execute, verify. Refactoring is not free—each remediation has a cost-benefit calculation. Critical violations (broken context isolation, circular dependencies) are fixed immediately. Low-risk violations (naming inconsistencies) are grouped into periodic cleanup sprints.

---

# Core Concepts

**Remediation priority:** Violations are classified by severity—critical (broken isolation), high (unauthorized import), medium (missing contract), low (naming). Priority determines when the remediation is scheduled.

**Strangler remediation:** For large-scale refactoring (extracting a context, fixing a circular dependency), use the strangler approach: work around the violation while building the correct structure, then remove the violation in a final pass.

**Verification:** After remediation, architecture tests must pass. The drift score must not increase. CI blocks the remediation if it introduces new violations.

---

# Internal Mechanics

```php
// Step 1: Detect
$violations = $detector->findImportViolations();

// Step 2: Classify
foreach ($violations as $violation) {
    $severity = $classifier->classify($violation);
    // critical: broken context isolation
    // high: unauthorized import into a core context
    // medium: missing contract
    // low: naming convention violation
    $backlog->add(new RemediationItem(
        file: $violation->file,
        description: $violation->description,
        severity: $severity,
    ));
}

// Step 3: Remediate (example: fix import violation)
// Before:
use App\Modules\Inventory\Models\Product;

// After: Use bridge/adapter
use App\Modules\Checkout\Contracts\ProductLookup;
```

---

# Patterns

**Fix critical violations immediately:** Critical violations block the CI pipeline or cause production issues. Allocated time is taken from the current sprint.

**Group low-severity violations:** Low-severity violations are collected in a backlog. A dedicated refactoring sprint (every 4-6 weeks) addresses them in bulk.

**Strangler for large refactoring:** When fixing a deep violation (e.g., removing an entire dependency), build the alternative path first, then remove the old path. Never remove while the old path is still needed.

---

# Architectural Decisions

**Remediate vs. tolerate:** Not every violation needs immediate remediation. If the violation is in a module that will be rewritten next quarter, tolerate it. If the violation is in a core module, fix it.

**Small, frequent refactoring:** Small violations fixed as they are introduced (boy scout rule) is cheaper than large remediation projects.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| Immediate fix | No drift accumulation | Context switching |
| Backlogged | Focused effort | Drift accumulates |
| Strangler | Safe, incremental | Longer timeline |

---

# Common Mistakes

**Ignoring violations:** "We will fix it later." Later never comes. The violation becomes part of the norm.

**Big-bang refactoring:** Stopping all feature work to fix all architectural violations. High risk, long period without value delivery.

**No verification:** Refactoring is done but not verified by architecture tests. The violation may not be fully fixed.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-08 Drift detection | AEG-01 Architecture testing | MMD-11 Module extraction |
| AEG-05 Import violation detection | AEG-02 CI enforcement | DBC-10 Legacy integration |

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
