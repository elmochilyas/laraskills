| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Thin Controller Enforcement |
| **Metadata** | Difficulty | Advanced |
| **Metadata** | Dependencies | Controller Code Limits, Controller Action Delegation, Controller Dependency Injection |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Thin controller enforcement is the practice of using automated tooling — PHPStan custom rules, Deptrac layer boundaries, CI pipeline checks — to ensure controllers remain thin according to team architectural standards. Unlike manual code review, which relies on human vigilance, automated enforcement provides immediate, objective feedback when a controller violates team rules: direct Eloquent calls, business logic in method bodies, excessive line counts, missing delegation. Rules are encoded in machine-checkable configuration and fail the build on violation, preserving architectural integrity over time as team members and priorities change.

## Core Concepts

- **Automated Architecture Rules**: Encoding architectural decisions (thin controllers, delegation, layer isolation) into machine-checkable rules.
- **PHPStan Custom Rules**: PHPStan's AST-based rule system allows detecting specific code patterns (Eloquent calls, excessive method length, repository bypasses) and reporting violations.
- **Deptrac Layer Boundaries**: Deptrac enforces dependency direction — controllers may depend on services, services may depend on repositories, but repositories must not depend on controllers.
- **CI Pipeline Enforcement**: Pre-merge checks run static analysis and reject PRs with thick controller violations.
- **Graduated Enforcement**: Start with warnings, then errors, then CI failures as the team adopts the discipline over a phased rollout.
- **Exemption Mechanism**: `@phpstan-ignore-next-line` with mandatory documented reason for legitimate exceptions.

## When To Use

- Any project with more than 5 controllers (the threshold where manual oversight becomes unreliable).
- Teams practicing collective code ownership where multiple developers modify controllers.
- Codebases where controller bloat has been identified as a recurring maintenance issue.
- Projects with CI pipelines and a commitment to architectural quality.
- Teams transitioning from fat controllers to thin controllers who need guardrails during the migration.

## When NOT To Use

- Solo developer projects where the developer self-enforces thin controller discipline.
- Early prototypes where architectural rules would slow iteration (add enforcement when stabilizing).
- Projects that intentionally use fat controllers for simplicity (e.g., single-page admin panels).
- Before basic thin controller practices (delegation, form requests, API resources) are established — enforce the foundation first.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Start with 2-3 rules, add one per sprint | Deploying 15 rules on day one causes team revolt; gradual adoption builds buy-in |
| Provide `@phpstan-ignore-next-line` with mandatory reason | Strict enforcement without escape hatch leads to rule disabling or workarounds |
| Fix false positives promptly (within one sprint) | Unfixed false positives erode trust — "the linter is wrong" becomes excuse to ignore all violations |
| Pair PHPStan rules with Deptrac for directionality | PHPStan detects pattern violations; Deptrac enforces layer dependency direction |
| Document each rule with rationale and examples | Developers comply better when they understand why a rule exists |
| Review enforcement failures weekly during first month | Tune rules based on real violations; remove rules with >10% false positive rate |

## Architecture Guidelines

- Start with these 5 rules: (1) no Eloquent static calls in controllers, (2) max 200 lines per controller, (3) controller methods must not call `Model::query()`, (4) form request must be type-hinted for store/update, (5) no `DB::` facade in controllers.
- Run PHPStan at max level in CI; use baseline for existing violations with a plan to reduce them.
- Deptrac layers: `Controllers → Services → Repositories` — enforce one direction only.
- CI pipeline order: lint → PHPStan (thin controller rules) → Deptrac → Tests.
- Never use enforcement as a replacement for code review — enforcement catches objective violations; review catches design problems.
- Provide a pre-commit hook for instant feedback in addition to CI checks.

## Performance Considerations

- 10-20 custom PHPStan rules add ~5-15 seconds to analysis time.
- Deptrac analysis runs in ~1-2 seconds for most project sizes.
- CI enforcement adds 30-60 seconds total — negligible compared to test suites (5-15 minutes).
- Use PHPStan's `--memory-limit` to prevent memory exhaustion on large projects.
- Run enforcement rules separately from main analysis in CI to pinpoint violations faster.

## Security Considerations

- Enforcement rules can detect security-relevant violations: raw SQL in controllers (bypassing Eloquent), missing authorization in store/update methods, missing type hints on form requests.
- Deptrac can enforce that controllers only use authorized dependencies (no direct repository access bypassing service layer).
- Ensure enforcement rules don't create false sense of security — automated rules complement, not replace, security review.
- Exemption annotations should be reviewed in security-sensitive contexts.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Too many rules at once | Enthusiasm for architectural enforcement | Team revolt; rules disabled entirely | Start with 2-3 rules, add one per sprint based on team feedback |
| No exemption mechanism | All-or-nothing enforcement mindset | Developers disable enforcement or find workarounds | Provide `@phpstan-ignore-next-line` with mandatory reason comment |
| Ignoring false positives | No process for addressing rule bugs | "The linter is wrong" becomes excuse to ignore all violations | Slack channel or issue tracker for false positives; fix rules within one sprint |
| Rule becomes obsolete after upgrade | Laravel/PHPStan version change | CI fails on valid code | Review all custom rules after each major upgrade |
| Deptrac cannot detect runtime circular dependencies | Deptrac checks source code structure, not runtime behavior | Circular dependency surfaces in production | Complement with runtime analysis or service container checks |

## Anti-Patterns

- **Enforcement without education**: Deploying rules without explaining why they exist. Developers see enforcement as bureaucracy, not architecture.
- **100% exemption rate**: Every rule violation has an ignore annotation. Either the rules are wrong or the culture needs correction.
- **Enforcement on legacy codebase without baseline**: Failing CI on 500 pre-existing violations. Use PHPStan baseline to track existing violations and only block new ones.
- **Rules that check formatting, not architecture**: Enforcing PSR-12 via PHPStan custom rules duplicates what PHP-CS-Fixer already does. Focus on architectural rules.
- **No graduated rollout**: Going from zero enforcement to blocking PRs in one day. Teams need time to adapt.

## Examples

- **PHPStan rule — no Eloquent in controllers**: Custom rule checking `Node\Expr\StaticCall` with class names `Model`, `DB`, or specific model class names, flagging calls to `query`, `where`, `create`, `update`, `delete`.
- **PHPStan rule — max controller lines**: Custom rule using `scope->getFile()` and counting file lines; errors if count exceeds 200.
- **PHPStan rule — form request type hint**: Custom rule checking that `store` and `update` method parameters type-hint a class extending `FormRequest`.
- **Deptrac config**: Layers: `Controllers` (directory `app/Http/Controllers/.*`), `Services` (directory `app/Services/.*`), `Repositories` (directory `app/Repositories/.*`). Ruleset: `Controllers → [Services, Repositories]`, `Services → [Repositories]`, `Repositories: ~`.
- **CI script (line count enforcement)**: `Get-ChildItem app/Http/Controllers -Recurse -Filter *.php | Where-Object { (Get-Content $_.FullName | Measure-Object -Line).Lines -gt 200 }` — exits 1 on violation.

## Related Topics

- Controller Code Limits — Manual line/method limits that enforcement rules check
- Controller Action Delegation — The delegation pattern that enforcement rules require
- Controller Dependency Injection — Constructor DI that enforcement rules can verify
- Controller Organization by Domain — Directory structure that Deptrac layers reference
- Controller Testing Strategies — Testing that enforcement rules correctly identify violations

## AI Agent Notes

- Generate PHPStan custom rule stubs for common thin-controller checks.
- Start with 3 rules: no Eloquent in controllers, max lines per controller, form request type hint requirement.
- Include Deptrac configuration with `Controllers → Services → Repositories` layer ruleset.
- Add graduated rollout plan in comments: warnings → errors → CI failure.
- Always include `@phpstan-ignore-next-line` exemption mechanism with mandatory reason.

## Verification

- [ ] At least 2-3 PHPStan custom rules implemented for thin controller checks
- [ ] Deptrac configuration with Controller → Service → Repository layer rules
- [ ] Rules run in CI pipeline (pre-merge check)
- [ ] Exemption mechanism with mandatory reason annotation
- [ ] Graduated rollout plan documented (warnings → errors → CI failure phases)
- [ ] False positive rate <10% (tracked and tuned quarterly)
- [ ] Existing violations captured in PHPStan baseline (not blocking CI)
