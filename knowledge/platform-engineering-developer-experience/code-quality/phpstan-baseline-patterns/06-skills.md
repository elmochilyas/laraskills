# Skill: Generate and Manage PHPStan Baseline

## Purpose
Use PHPStan's baseline feature to adopt strict static analysis levels on existing codebases with many pre-existing errors, enabling incremental cleanup without blocking new development.

## When To Use
- Adopting strict PHPStan on existing codebases with many errors
- Teams wanting to prevent new errors while fixing existing ones gradually
- CI pipelines enforcing no new static analysis debt
- Large-scale Laravel applications where fixing everything at once is infeasible

## When NOT To Use
- New projects with no existing errors (no baseline needed)
- Teams not using PHPStan
- Projects where all errors can be fixed immediately

## Prerequisites
- PHPStan (Larastan) installed and configured
- `phpstan.neon` configuration file
- Existing codebase with type errors at target analysis level

## Inputs
- `phpstan.neon` — main configuration
- `phpstan-baseline.neon` — generated baseline file
- Application source code

## Workflow

1. **Choose Target Level:** Select the strictness level you want to reach (recommended: level 6). Generate the baseline at this target level, not at a lower level, to capture the full picture of existing debt.

2. **Generate Baseline:** Run `phpstan analyse --generate-baseline` to create `phpstan-baseline.neon`. This captures all current errors grouped by file and error type.

3. **Include Baseline in Config:** Add `includes: [phpstan-baseline.neon]` to `phpstan.neon`. Separate file enables clean regeneration.

4. **Commit Baseline:** Commit `phpstan-baseline.neon` to version control. It serves as a visible debt tracker showing the team's current static analysis backlog.

5. **Fail CI on New Errors:** In CI, run `phpstan analyse` with the baseline. PHPStan exits with an error if new errors exist beyond the baseline. This prevents new static analysis debt.

6. **Set Reduction Targets:** Set quarterly 10-15% reduction targets for baseline size. Assign ownership to specific team members for baseline cleanup.

7. **Regenerate Monthly:** Re-run `--generate-baseline` monthly to remove stale entries (fixed errors still listed). This keeps the baseline accurate and tracks progress.

8. **Gradually Increase Level:** Follow a level graduation path: Level 2 → fix → Level 4 → fix → Level 6 → fix → Level 9. Each level increase generates a new baseline capturing the additional checks.

## Validation Checklist

- [ ] Baseline generated at target analysis level
- [ ] Baseline included as separate file in `phpstan.neon`
- [ ] Baseline committed to version control
- [ ] CI fails when new errors exist beyond baseline
- [ ] Reduction targets set (10-15% per quarter)
- [ ] Baseline regenerated monthly to remove stale entries
- [ ] Level graduation plan documented

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Baseline at low level | Captures only subset of debt; regenerate at target level |
| Baseline not regenerated | Stale entries accumulate; progress not tracked |
| Baseline ignored in CI | New errors merged without detection |
| Level increased without baseline | Cascade of new errors blocks CI |

## Decision Points

- **Use baseline** for existing codebases adopting strict PHPStan
- **No baseline needed** for new projects with zero existing errors
- **Separate file always** — never inline baseline in main config
- **Level graduation:** Level 2 → fix → Level 4 → fix → Level 6 → fix → Level 9

## Performance/Security Considerations

- **Baseline file size:** Can be 1000+ lines for large codebases; this is normal and expected
- **Regeneration time:** 2-5 minutes for medium projects; schedule weekly for large ones
- **CI overhead:** Baseline comparison adds minimal time to PHPStan analysis

## Related Rules

- BASELINE-RULE-001: Start comprehensive, reduce aggressively
- BASELINE-RULE-002: Set reduction targets
- BASELINE-RULE-003: Regenerate regularly
- BASELINE-RULE-004: Fail CI on new errors
- BASELINE-RULE-005: Baseline at strict level

## Related Skills

- Set Up Laravel PHPStan with Larastan
- Configure PHPStan for Laravel
- Integrate Static Analysis in CI

## Success Criteria

- PHPStan runs at strict level (6+) on existing codebase without blocking development
- No new static analysis errors are introduced (CI fails on baseline increase)
- Baseline size reduces by 10-15% per quarter
- Team has clear visibility into static analysis debt via committed baseline
