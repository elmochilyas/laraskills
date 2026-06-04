# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Static analysis rules for architecture
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Static analysis rules enforce architecture constraints at the code level without running tests. PHPStan (with custom rules) and Larastan can detect import violations, forbidden method calls, incorrect type usage, and missing contracts. Custom PHPStan rules extend the analysis to domain-specific constraints. Rules run on every save (IDE) and in CI.

---

# Core Concepts

**PHPStan rule:** A class implementing `PHPStan\Rules\Rule`. Inspects AST nodes and reports errors when a violation is detected.

**Custom architecture rule:** A PHPStan rule that checks project-specific constraints: "Repositories may not use the Auth facade." "Services must not return Eloquent models."

**Collector:** Gathers information across multiple files. For example, collect all repository classes, then check they implement the correct interface.

---

# Internal Mechanics

```php
class NoEloquentInServiceRule implements Rule
{
    public function getNodeType(): string
    {
        return Node\Expr\MethodCall::class;
    }

    public function processNode(
        Node $node,
        Scope $scope,
    ): array {
        if (! $scope->isInClass()) {
            return [];
        }

        $classReflection = $scope->getClassReflection();
        if (! str_contains($classReflection->getName(), 'Service')) {
            return [];
        }

        if ($node->name->toString() === 'save') {
            return [
                RuleErrorBuilder::message(
                    'Services should not call save() directly. ' .
                    'Use a repository.'
                )->build(),
            ];
        }

        return [];
    }
}
```

---

# Patterns

**Custom PHPStan rules:** Custom rules for project-specific constraints. Best for constraints that cannot be expressed with Pest architecture tests.

**Larastan for framework rules:** Checks Eloquent model properties, route names, and other Laravel-specific patterns. Run alongside custom rules.

**Disallowed classes and calls:** Use `spaze/phpstan-disallowed-calls` or custom lists to forbid dangerous patterns:
```neon
parameters:
    disallowedClasses:
        - Facade\Ignition\*
```

---

# Architectural Decisions

**Use static analysis for:** Constraints that require understanding the code's AST—type checks, method calls, class inheritance. Use architecture tests for structural constraints (namespace imports).

**Default to Pest architecture tests:** They are simpler, more readable, and sufficient for most import rules. Only use custom PHPStan rules for constraints that the test framework cannot express.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Catches violations at compile time | Custom rules require PHP development |
| Deep analysis (type system) | Slower than simple import checks |
| IDE integration | Rule maintenance |

---

# Common Mistakes

**Redundant rules:** Writing PHPStan rules that duplicate existing Pest architecture tests. Adds maintenance without value.

**Rules that are too specific:** Rules that check specific class names or method calls that change frequently.

**No CI integration:** Custom PHPStan rules exist but are not included in CI. Developers run them locally but they are not enforced.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-07 Static analysis | AEG-01 Architecture testing | AEG-05 Import violation detection |
| AEG-02 CI enforcement | COS-12 CI/CD integration | AEG-08 Drift detection |

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
