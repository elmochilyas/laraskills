# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: CI enforcement of architecture rules
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

CI enforcement runs architecture tests, static analysis, and linters on every push. Rules are checked before a PR is merged. If a rule is violated, CI fails and the PR is blocked. The goal is to make architecture violations visible immediately, not during a quarterly review. CI enforcement also monitors trends: number of violations over time, test coverage for architecture rules, and drift metrics.

---

# Core Concepts

**Pre-merge gate:** Architecture tests run in CI and must pass before a PR merges. No manual override. Violations must be fixed (or the rule must be changed).

**Fail fast:** Architecture tests run early in the CI pipeline. The developer knows within minutes, not hours, that a rule has been violated.

**Baseline for existing violations:** When introducing new rules, existing violations are baselined. New code must not introduce new violations. The baseline is tracked and reduced over time.

---

# Internal Mechanics

```yaml
# .github/workflows/architecture.yml
name: Architecture Enforcement
on: [pull_request]
jobs:
  arch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: composer install
      - run: |
          echo "Running architecture tests..."
          php artisan pest --testsuite=Architecture --fail-on-warning
      - run: |
          echo "Running PHPStan with custom rules..."
          php vendor/bin/phpstan analyse --configuration=phpstan.architecture.neon
```

---

# Patterns

**Parallel CI jobs:** Architecture tests run in a separate CI job from unit/feature tests. The architecture job completes faster and fails independently.

**PR comment on failure:** CI posts a comment on the PR with a list of violated rules, the file and line, and the expected fix.

**Baseline degradation detection:** If the number of violations increases (beyond the baseline), CI fails. Prevents gradual erosion of architecture rules.

---

# Architectural Decisions

**Fail CI on architecture violations:** Soft warnings are ignored. The only way to merge a violation is to change the rule. This forces conscious decisions.

**Document exemptions explicitly:** When a legitimate violation exists (e.g., a shared utility), add it to an exemptions file. Exemptions are reviewed and approved.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Immediate violation feedback | CI pipeline complexity |
| No manual enforcement overhead | Must keep rules up to date |
| Measurable architecture quality | False positives block merges |

---

# Common Mistakes

**Architecture tests not in CI:** Tests exist locally but are not run in CI. Developers forget to run them. Violations are never caught.

**Ignoring CI failures:** Architecture tests fail but the PR is merged anyway. The tests become noise.

**No baseline for legacy code:** Introducing strict rules in a codebase with existing violations. All PRs fail until the legacy code is fixed. Developers become frustrated and disable the rules.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| AEG-01 Architecture testing | AEG-03 Static analysis rules | AEG-08 Drift detection |
| COS-12 CI/CD integration | AEG-05 Import violation detection | AEG-09 Refactoring remediation |

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
