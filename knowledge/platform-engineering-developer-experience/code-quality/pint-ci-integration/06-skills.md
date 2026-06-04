# Skill: Integrate Pint into CI Pipeline

## Purpose
Add Laravel Pint as a CI pipeline gate that enforces code style standards on every push, with fast failure feedback and optional auto-fix with commit back to PR.

## When To Use
- CI pipelines for every Laravel project
- PR checks that fail fast on style issues before running tests
- Automated style cleanup PRs on a schedule (weekly/monthly)
- Pre-merge quality gates enforcing formatting standards

## When NOT To Use
- Projects without a committed pint.json (style standards not defined)
- CI environments with very tight time budgets (< 30s total)
- When formatting changes in CI create workflow complexity

## Prerequisites
- `laravel/pint` installed as a dev dependency
- `pint.json` committed to version control
- CI platform (GitHub Actions, GitLab CI, etc.)

## Inputs
- `.github/workflows/style.yml` or equivalent CI configuration
- `pint.json` — style configuration
- `.php-cs-fixer.cache` — token cache for speed

## Workflow

1. **Create Style Check Workflow:** Create a CI workflow that runs `pint --test` as a step after dependency installation. This is the fastest code quality check (under 10 seconds).

2. **Pin Pint Version:** Lock `"laravel/pint": "1.18.*"` in `composer.json` to prevent unexpected rule behavior changes from breaking CI.

3. **Run Pint Early in CI:** Place Pint as the first check after `composer install`. Fail fast on style issues before running slower PHPStan or PHPUnit steps.

4. **Use GitHub Annotations (GitHub Actions):** Add `--format=github` to `pint --test` for inline PR annotations showing exactly which lines need fixing.

5. **Cache Token Cache:** Restore `.php-cs-fixer.cache` from previous runs for 50-80% speed improvement. Invalidate cache when `composer.lock` or `pint.json` changes.

6. **Choose Gate vs Auto-Fix Mode:**
   - Gate mode: `pint --test` — fails the build, developer fixes locally
   - Auto-fix mode: Run `pint` then `--test` — auto-fixes style and commits back to PR

7. **Set Up Scheduled Style PR (Optional):** Create a weekly/monthly scheduled workflow that runs `pint` on the full codebase and opens a style cleanup PR.

## Validation Checklist

- [ ] CI workflow runs `pint --test` after dependency install
- [ ] Pint version pinned in `composer.json`
- [ ] Pint runs early — before PHPStan and PHPUnit
- [ ] Token cache configured for speed
- [ ] PR annotations visible (GitHub Actions format)
- [ ] CI exits with 0 on clean style, 1 on issues
- [ ] Auto-fix mode (if used) commits changes correctly

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Version not pinned | Unexpected rule changes break CI |
| Cache not configured | Slower runs; skip cache for simplicity |
| Pint runs late | Style issues found after tests already ran |
| Auto-fix commits without review | Style changes merged without developer awareness |

## Decision Points

- **Gate mode vs auto-fix mode:** Gate mode (`--test`) for strict teams; auto-fix for flexible teams
- **Pre-commit hooks complement CI:** Use pre-commit hooks locally for instant feedback; CI as safety net
- **Scheduled style PRs:** Weekly automated cleanup reduces style debt accumulation

## Performance/Security Considerations

- **Speed:** Pint runs in < 10 seconds for most projects; fastest quality check
- **Cache:** Token cache speeds subsequent runs 50-80%; important for fast CI feedback
- **CI cost:** Minimal — Pint is lightweight and fast compared to PHPStan or test suites

## Related Rules

- PINT-CI-RULE-001: Run Pint early in CI
- PINT-CI-RULE-002: Pin Pint version
- PINT-CI-RULE-003: Use --format=github
- PINT-CI-RULE-004: Cache tokens
- PINT-CI-RULE-005: Auto-fix then test

## Related Skills

- Configure Laravel Pint for Code Style
- Configure Custom Pint Rules
- Set Up Pre-commit Hooks for Code Quality
- Integrate Static Analysis in CI

## Success Criteria

- CI fails immediately when code style doesn't match standards
- PRs show inline annotations for style issues
- Pint check completes in under 10 seconds
- Style enforcement is consistent across all contributors and CI
