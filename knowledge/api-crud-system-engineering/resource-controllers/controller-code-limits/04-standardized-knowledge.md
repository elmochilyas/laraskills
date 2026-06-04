| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Code Limits |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Resource Controller Pattern |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Controllers that grow beyond reasonable size become maintenance liabilities. Code limits — maximum lines per file, maximum methods per controller, maximum lines per method — impose a structural discipline that forces decomposition. Common thresholds are 100-200 lines per controller, 10-15 lines per method, and at most 7 methods (matching the resource pattern). These limits are a forcing function for decomposition, not a quality metric.

## Core Concepts

- **Line Limit**: Maximum physical lines per controller file (100-200).
- **Method Limit**: Maximum public methods per controller (7-10).
- **Method Length Limit**: Maximum lines per method (10-15).
- **Complexity Limit**: Maximum cyclomatic complexity per method (5-7).
- **Extraction Trigger**: Hitting a limit is a signal to extract a service, action, or form request.

## When To Use

- All projects with more than 5 resource controllers.
- Teams practicing collective code ownership.
- Any codebase where controller bloat has been identified as a maintenance issue.
- Projects with automated CI enforcement.

## When NOT To Use

- Single-developer projects or prototypes where overhead isn't justified.
- Projects that already enforce decomposition through other means (e.g., strict service layer).
- Legacy codebases where wholesale refactoring would be too costly.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Start with generous limits (200 lines) and tighten over time | Prevents team resistance; gradual adoption |
| Count logical lines (excluding comments and blanks) | Docblock-heavy controllers shouldn't trigger false positives |
| Enforce both file-level and method-level limits | A controller can be 150 lines but have one 120-line method |
| Add `// @no-limit` annotation for documented exceptions | Provides escape valve for legitimate edge cases |
| Run limit checks in CI, not just code review | Automated enforcement is objective and consistent |

## Architecture Guidelines

- Configure limits in PHPStan rules, PhpMetrics, or CI scripts.
- Document the limit policy in `CONTRIBUTING.md`.
- Review limits quarterly: if every controller is under 80 lines, tighten to 80.
- Pair with thin controller enforcement rules (no Eloquent in controllers, must delegate).
- Use `php artisan make:controller` with extraction patterns from day one.

## Performance Considerations

- Line count has zero runtime impact.
- Extracted classes add one extra method call per request (negligible).
- Opcode cache handles additional files without significant impact.

## Security Considerations

- Code limits are a maintenance concern, not a security concern. However, thick controllers are harder to audit for security issues.
- Security-critical code should be in visible, well-organized locations — limits help enforce this.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Increasing limits instead of extracting | Perceived time pressure | Enables bloat; limits lose their forcing function | Hold the line; force extraction |
| Counting only file LOC, ignoring method length | File-level check passes | Single 120-line method remains a liability | Enforce both file and method limits |
| Enforcing limits only on constructor | Focus on DI declaration | Business logic grows unchecked | Measure all methods, not just constructor |

## Anti-Patterns

- **Raising limits without justification**: "This controller needs to be 400 lines" — extract instead.
- **No method-length limit**: File-level limits alone miss the most egregious violations.
- **Counting comment lines as code**: Penalizes well-documented controllers.
- **No exemption mechanism**: Leads to developers gaming the system or disabling enforcement.

## Examples

- **PHPStan rule concept**: `if (count(file($controllerFile)) > 200) { $errors[] = "Controller exceeds 200 lines"; }`
- **CI script (PowerShell)**: `Get-ChildItem -Path "app/Http/Controllers" -Recurse -Filter "*.php" | Where-Object { (Get-Content $_ | Measure-Object -Line).Lines -gt 200 }`
- **Extraction trigger**: A 30-line `store()` method → extract `CreatePhotoAction`.
- **Limit policy**: "Controllers must be ≤200 lines. Methods must be ≤15 lines. Exceptions require a `// @no-limit` comment with rationale."

## Related Topics

- Thin Controller Enforcement — Automated enforcement via PHPStan/Deptrac
- Controller Action Delegation — The primary extraction strategy
- Controller Form Request Integration — Extracting validation from methods

## AI Agent Notes

- Always generate controllers with extraction patterns ready (form requests, action classes).
- Never increase the limit to accommodate a large controller — extract logic instead.
- Include both file-level (200 lines) and method-level (15 lines) limits in generated CI templates.

## Verification

- [ ] Controller file limit is defined and enforced (e.g., 200 lines)
- [ ] Method length limit is defined and enforced (e.g., 15 lines)
- [ ] Method count limit is defined (e.g., 7-10 methods)
- [ ] Logical lines (excluding comments/blanks) are used for counting
- [ ] Exemption mechanism exists with documented justification
- [ ] Limits are checked in CI
- [ ] Limits are reviewed quarterly for tuning
