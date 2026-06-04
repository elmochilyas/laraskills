# Thin Controller Enforcement

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Thin Controller Enforcement
- **Difficulty Level:** Enterprise
- **Last Updated:** 2026-06-02

---

## Executive Summary

Thin controller enforcement is the practice of using automated tooling—PHPStan, Deptrac, custom linters, CI scripts—to ensure controllers remain thin as defined by team standards. Unlike manual code review, which relies on human vigilance, automated enforcement provides immediate, objective feedback when a controller violates the team's architectural rules.

Common enforcement rules include: controllers must not directly call Eloquent queries (must delegate to repositories/services), controllers must not contain business logic in method bodies (only delegation), controllers must not exceed a maximum line count, and controllers must type-hint form requests for store/update actions. These rules are encoded in PHPStan custom rules, Deptrac layer boundaries, and CI pipeline checks that fail the build when violations are detected.

---

## Core Concepts

- **Automated Architecture Rules**: Encoding architectural decisions (thin controller, delegation) into machine-checkable rules.
- **PHPStan Custom Rules**: PHPStan's rule system allows writing custom rules that analyze controller code and report violations.
- **Deptrac Layer Boundaries**: Deptrac enforces dependency direction: controllers may depend on services, but services may not depend on controllers.
- **CI Pipeline Enforcement**: Pre-merge checks that run static analysis and reject PRs with thick controller violations.
- **Graduated Enforcement**: Start with warnings, then errors, then CI failures as the team adopts the discipline.

---

## Mental Models

- **Guard at the Gate**: Enforcement tooling is a guard that checks every controller change before it enters the codebase.
- **Architecture as Code**: The team's architectural decisions are encoded in configuration files, not human memory.
- **Fail Fast, Fail Early**: A CI failure during PR review is cheaper than a production incident from a thick controller.

---

## Internal Mechanics

**PHPStan Custom Rule Example** (detecting Eloquent calls in controllers):

```php
class NoEloquentInControllersRule implements Rule
{
    public function getNodeType(): string
    {
        return Node\Expr\StaticCall::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        if (!$this->isInController($scope)) {
            return [];
        }

        if ($node->class instanceof Node\Name && in_array((string) $node->class, ['Model', 'DB', 'Photo'])) {
            if (in_array($node->name->toString(), ['query', 'where', 'create', 'update', 'delete'])) {
                return [RuleErrorBuilder::message('Eloquent calls are not allowed in controllers. Use a repository or action class.')->build()];
            }
        }

        return [];
    }
}
```

**Deptrac Configuration** (enforcing controller → service direction):

```yaml
# deptrac.yaml
layers:
  - name: Controllers
    collectors:
      - type: directory
        value: app/Http/Controllers/.*
  - name: Services
    collectors:
      - type: directory
        value: app/Services/.*
  - name: Repositories
    collectors:
      - type: directory
        value: app/Repositories/.*

ruleset:
  Controllers:
    - Services
    - Repositories
  Services:
    - Repositories
  Repositories: ~
```

**CI Script** (line count enforcement):

```powershell
$violations = Get-ChildItem -Path "app/Http/Controllers" -Recurse -Filter "*.php" | Where-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    $lines -gt 200
}
if ($violations) { exit 1 }
```

---

## Patterns

- **PHPStan + Custom Lint Rules**:
  ```php
  // phpstan.neon
  rules:
      - App\Linting\Rules\NoEloquentInControllersRule
      - App\Linting\Rules\ControllerMaxLinesRule
      - App\Linting\Rules\ControllerMustDelegateRule
  ```
- **Deptrac Layer Diagram**: Controller → Service → Repository direction enforcement.
- **CI Multi-Stage Check**: Lint → PHPStan → Deptrac → Tests, with thin controller checks in the first stage.
- **Graduated Rollout Phase Plan**:
  1. Week 1: Warnings only (CI informational).
  2. Week 2: Warnings in CI, errors if manually run.
  3. Week 3: CI errors, PRs blocked.
  4. Week 4: Block merge without exemption.

---

## Architectural Decisions

- **Why enforce thin controllers at all?** Without enforcement, controllers gradually accumulate business logic. Automated enforcement is the only way to maintain architectural standards over time as team members and priorities change.
- **Why PHPStan rules over custom scripts?** PHPStan understands PHP syntax and can detect specific patterns (method calls, instantiations, type references). Custom scripts can only count lines.
- **Why Deptrac over manual directory structure?** Deptrac enforces directionality: controllers can depend on services, but services cannot depend on controllers. Manual directory structure cannot enforce direction.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consistent architecture over time | Initial setup cost (writing rules) | ~1–2 days to set up full enforcement pipeline |
| Objective, automated feedback | False positives requiring rule tuning | Budget 2 weeks of tuning per major Laravel version |
| CI prevents regressions | Learning curve for tooling | Train team on PHPStan and Deptrac basics |

---

## Performance Considerations

- PHPStan analysis time increases with the number of custom rules. 10–20 custom rules add approximately 5–15 seconds to analysis time.
- Deptrac analysis is fast (~1–2 seconds) for most project sizes.
- CI enforcement adds 30–60 seconds to the pipeline. This is negligible compared to test suite times (5–15 minutes).
- Use PHPStan's `--memory-limit` to prevent memory exhaustion on large projects.

---

## Production Considerations

- Start with one rule (e.g., "no Eloquent in controllers") and add more over time.
- Document each rule in the team wiki with the rationale and examples of violations.
- Provide an exemption mechanism: `// @phpstan-ignore-next-line` with a documented reason.
- Run enforcement in CI but also provide a pre-commit hook for instant feedback.
- Review enforcement failures weekly in the first month to tune rules and reduce false positives.
- Pair thin-controller enforcement with controller code limits for maximum effect.

---

## Common Mistakes

- **Too many rules at once**: Deploying 15 PHPStan rules + Deptrac configuration on day one.
  - *Why it happens:* Enthusiasm for architectural enforcement.
  - *Why it's harmful:* Team revolt against excessive restrictions; rules are disabled entirely.
  - *Better approach:* Start with 2–3 rules and add one per sprint based on team feedback.

- **No exemption mechanism**: Strict enforcement with no way to bypass for legitimate cases.
  - *Why it happens:* All-or-nothing mindset.
  - *Why it's harmful:* Developers disable enforcement entirely or find workarounds.
  - *Better approach:* Provide `@phpstan-ignore-next-line` with mandatory reason comment.

- **Ignoring false positives**: Developers encounter a false positive and stop taking enforcement seriously.
  - *Why it happens:* No process for addressing rule bugs.
  - *Why it's harmful:* "The linter is wrong" becomes an excuse to ignore all violations.
  - *Better approach:* Have a Slack channel or issue tracker for false positive reports; fix rules promptly.

---

## Failure Modes

- **Rule becomes obsolete after upgrade**: A PHPStan rule checks for a pattern that no longer applies after a Laravel upgrade. *Detection:* CI fails on valid code. *Mitigation:* Review all custom rules after each Laravel major upgrade.

- **False positive rate over 10%**: Too many false positives erode trust in enforcement. *Detection:* Developers routinely use ignore annotations. *Mitigation:* Tune rules quarterly; remove rules with >10% false positive rate.

- **Deptrac circular dependency discovered in production**: Deptrac found no issues, but a circular dependency exists at runtime. *Detection:* Production error. *Mitigation:* Deptrac cannot detect runtime circular dependencies; complement with runtime analysis or service container checks.

---

## Ecosystem Usage

- **Laravel Shift (Automated Upgrades)**: Includes architecture checks as part of its upgrade reports, including controller thickness inspections.
- **Laravel SaaS Boilerplate (open-source)**: Ships with PHPStan rules and Deptrac configuration for thin controller enforcement as a project template.
- **Spatie Laravel Rules**: Spatie's open-source Laravel projects use PHPStan custom rules to enforce controller discipline across their package suite.

---

## Related Knowledge Units

### Prerequisites
- Controller Code Limits
- Controller Action Delegation
- Controller Dependency Injection

### Related Topics
- Controller Organization by Domain
- Controller Organization by Version

### Advanced Follow-up Topics
- Static Analysis Best Practices
- Architecture Testing (Deptrac/PHPMD)

---

## Research Notes

### Source Analysis
- PHPStan custom rule documentation
- Deptrac configuration reference
- Laravel community standards (no official source)

### Key Insight
The value of thin controller enforcement is not in the rules themselves but in the consistency it provides. A team that enforces thin controllers will produce consistently maintainable code over years, while a team without enforcement will see gradual architectural decay.

### Version-Specific Notes
- PHPStan rules are Laravel-version-agnostic.
- Deptrac configuration is framework-agnostic; no Laravel version dependency.
- PHPStan 1.0+ supports php-parser 4.x for accurate AST analysis.
