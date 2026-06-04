# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Architecture testing (Pest tests for architecture rules)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Architecture testing encodes architectural rules as automated tests. Instead of relying on code reviews to catch violations, tests verify that code structure conforms to the architecture. Rules include: "Services may not call Controllers," "Bounded Context A may not import from Bounded Context B," "All repositories must implement RepositoryInterface." Pest architecture testing (using `pestphp/pest-plugin-arch` or `dshafik/phpunit-arch` or `arquitetura/php-arch-test`) executes these rules on every CI run.

---

# Core Concepts

**Architecture test:** An automated assertion about code structure. Tests check import direction, class inheritance, naming conventions, method signatures, and namespace placement.

**Import direction rule:** "Classes in `App\Modules\Checkout` may not import from `App\Modules\Inventory`." Prevents unauthorized cross-context dependencies.

**Layer rule:** "Controllers may only call Services. Services may only call Repositories."

---

# Internal Mechanics

```php
// Pest architecture test
test('Controllers cannot import from Services')
    ->expect('App\Controllers')
    ->not->toImport('App\Services');

test('Billing context cannot import from Inventory context')
    ->expect('App\Modules\Billing')
    ->not->toImport('App\Modules\Inventory');

test('All repositories implement RepositoryInterface')
    ->expect('App\Repositories')
    ->toImplement('App\Contracts\RepositoryInterface');

test('Services must be final')
    ->expect('App\Services')
    ->toBeFinal();
```

---

# Patterns

**Layer dependency rules:** Enforce the dependency direction: Controllers → Services → Repositories. Test that no layer depends on higher layers.

**Context isolation rules:** For each bounded context, test that it only imports from allowed contexts. The test defines allowed import paths.

**Naming convention rules:** "All services must be in the `Services` namespace." "All controllers must end with `Controller`."

---

# Architectural Decisions

**Run architecture tests on every PR:** Architecture tests are part of the CI pipeline. A PR that violates the rules is blocked. Catches violations before they reach production.

**Define rules in a single file:** All architecture tests live in `tests/Architecture/`. Makes rules visible to the entire team.

**Start with strict rules:** Begin with strict rules and loosen if they cause friction. It is easier to relax a rule than to add one later.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Automated enforcement | Test maintenance as architecture evolves |
| Violation prevention, not detection | False positives for legitimate cases |
| Visible architecture rules | Learning curve for architecture test syntax |

---

# Common Mistakes

**No architecture tests:** Architecture rules are in documentation only. No one reads them. Violations accumulate silently.

**Rules that are too strict:** Enforcing rules that prevent legitimate patterns (e.g., test helpers importing from multiple contexts). Use `->ignoring()` for legitimate exceptions.

**Rules not run in CI:** Architecture tests exist but are only run locally. Violations are never automatically caught.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 dependency direction | AEG-02 CI enforcement | AEG-05 Import violation detection |
| DBC-01 Bounded context basics | AEG-03 Static analysis rules | AEG-08 Drift detection |

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
