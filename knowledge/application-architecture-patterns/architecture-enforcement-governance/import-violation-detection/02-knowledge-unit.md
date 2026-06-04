# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Import violation detection
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Import violation detection prevents code in one bounded context from importing classes in another context that it should not depend on. The detection layer scans all PHP `use` statements and matches them against a dependency map. If an import is not in the allowed list, it is flagged. Detection runs in CI and can be surfaced in the IDE.

---

# Core Concepts

**Dependency map:** A matrix of allowed imports between contexts. Context A can import from Context B and C, but not from Context D. The map is documented in the architecture guide and encoded in tests.

**Explicit allowlist:** Each context has a list of contexts it is allowed to import from. Imports from any other context are violations.

**Transitive dependency:** If Context A imports from Context B, and Context B imports from Context C, Context A effectively depends on Context C. Good detection catches this.

---

# Internal Mechanics

```php
// Dependency map
$dependencyMap = [
    'Checkout' => [
        'allow' => ['Shared', 'Billing'],
        'forbid' => ['Inventory', 'Notifications'],
    ],
    'Billing' => [
        'allow' => ['Shared'],
        'forbid' => ['Checkout', 'Inventory'],
    ],
];

function checkImports(string $filePath, string $context): array {
    $violations = [];
    $content = file_get_contents($filePath);
    preg_match_all('/^use\s+App\\\\Modules\\\\(\\w+)\\\\/m', $content, $matches);

    foreach ($matches[1] as $importedContext) {
        if (!in_array($importedContext, $dependencyMap[$context]['allow'])) {
            $violations[] = "$context imports $importedContext in $filePath";
        }
    }

    return $violations;
}
```

---

# Patterns

**Namespace-based detection:** All classes within a bounded context share a namespace (`App\Modules\Checkout`). Detection checks the namespace of every import.

**Pest architecture tests for import rules:** Clean and readable:
```php
test('Checkout may only import from Shared and Billing')
    ->expect('App\Modules\Checkout')
    ->toOnlyBeUsedIn('App\Modules\Checkout', 'App\Modules\Shared', 'App\Modules\Billing');
```

**IDE integration:** Use a PHPStan rule or PhpStorm inspection to surface import violations during development, before CI.

---

# Architectural Decisions

**Default to strict:** Every context starts with an empty allowlist. Imports are added explicitly as needed. Prevents accidental coupling from the start.

**Shared kernel as exception:** All contexts may import from the `Shared` kernel. The shared kernel is gated—only common types and contracts live there.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Prevents unauthorized coupling | Dependency map maintenance |
| Clear visibility of all cross-context deps | Legitimate imports require explicit approval |
| IDE feedback during development | Detection tooling setup |

---

# Common Mistakes

**No detection:** Unauthorized cross-context imports accumulate silently. The core coupling becomes untangled and undocumented.

**Transitive dependency blind spot:** Detection only checks direct imports, not transitive ones. Context A imports Context B, which imports Context C, effectively coupling A to C. Detection must catch transitive dependencies.

**Detection without enforcement:** Violations are reported but not enforced. Imports bypass the detection system (e.g., using fully qualified class names instead of `use` statements).

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Bounded context basics | AEG-01 Architecture testing | AEG-03 Static analysis rules |
| DBC-05 Context mapping | AEG-02 CI enforcement | AEG-08 Drift detection |

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
