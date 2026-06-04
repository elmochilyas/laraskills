# Skill: Configure Laravel Pint for Code Style

## Purpose
Install and configure Laravel Pint to enforce consistent code style across a Laravel project with zero-configuration defaults, custom presets, and CI integration.

## When To Use
- Every Laravel project for consistent code style
- CI pipeline as a fast pre-check before slower static analysis
- Pre-commit formatting to catch style issues before code review
- Mass codebase formatting when adopting style standards

## When NOT To Use
- Projects using non-PHP-CS-Fixer tools for formatting
- Non-Laravel PHP projects (use PHP-CS-Fixer directly for more flexibility)
- When zero formatting changes are desired (Pint always changes some style)

## Prerequisites
- `laravel/pint` installed as a dev dependency
- PHP 8.1+

## Inputs
- `pint.json` — optional configuration (preset, rules, exclusions)
- Application source code (`app/`, `tests/`, etc.)

## Workflow

1. **Install Pint:** Run `composer require --dev laravel/pint`. Pint works with zero configuration using the `laravel` preset.

2. **Create Initial Config (Optional):** For custom configuration, create `pint.json` at project root specifying `preset` (e.g., `{"preset": "laravel"}`). Commit to version control.

3. **Run Initial Formatting:** Execute `./vendor/bin/pint` to format the entire codebase. Make this an isolated commit with message like "Apply Laravel Pint formatting".

4. **Use --dirty for Local Work:** Run `pint --dirty` to format only Git-tracked uncommitted changes. This speeds up local usage and avoids changing unrelated files.

5. **Exclude Generated Code:** In `pint.json`, use `notPath`/`notName` to exclude `bootstrap/cache`, `storage/framework/views`, and other generated files.

6. **Configure CI Check:** Add `pint --test` to CI pipeline as a fast pre-check. Exit code 0 (clean) or 1 (issues found). For GitHub Actions, use `--format=github` for inline PR annotations.

7. **Lock Pint Version:** Pin `"laravel/pint": "1.18.*"` in `composer.json` to prevent unexpected rule behavior changes.

8. **Set Up Nested Config for Monorepos:** Use per-package `pint.json` files for subdirectories needing different style standards.

## Validation Checklist

- [ ] Pint installed and runs without errors
- [ ] Codebase formatted with `pint` in initial commit
- [ ] `pint.json` committed (if using custom config)
- [ ] `pint --test` passes with exit code 0
- [ ] Generated code excluded from formatting
- [ ] Pint version pinned in `composer.json`
- [ ] CI pipeline includes `pint --test`

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Pint not installed | `./vendor/bin/pint` not found |
| Inconsistent team formatting | `pint.json` not committed; CI not enforcing |
| Generated files reformatted | Always excluded via `notPath`/`notName` |
| Style changes in CI | Use `--test` for gating; auto-fix only if intentional |

## Decision Points

- **Use Pint for every Laravel project** for consistent code style
- **Use PHP-CS-Fixer directly** for non-Laravel PHP projects (more flexible)
- **Gate vs auto-fix mode:** `--test` (gate) for strict teams; auto-fix for flexible teams

## Performance/Security Considerations

- **Speed:** Full codebase format: 5-30 seconds. Dirty-only format: < 2 seconds.
- **Cache:** PHP-CS-Fixer cache (`vendor/bin/.php-cs-fixer.cache`) speeds subsequent runs 50-80%
- **CI cost:** Pint runs in < 10 seconds, significantly faster than PHPStan

## Related Rules

- PINT-RULE-001: Use --test in CI
- PINT-RULE-002: Use --dirty locally
- PINT-RULE-003: Keep config minimal
- PINT-RULE-004: Commit pint.json
- PINT-RULE-005: Initial formatting commit

## Related Skills

- Configure Custom Pint Rules
- Select Appropriate Pint Preset
- Integrate Pint into CI

## Success Criteria

- All team members and CI use identical formatting rules
- `pint --test` passes consistently with zero style issues
- Code style is consistent across the entire codebase
- Formatting is fast (< 10s in CI) and doesn't block the pipeline
