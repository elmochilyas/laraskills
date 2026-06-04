# Skill: Integrate Static Analysis in CI

## Purpose
Configure a multi-stage static analysis pipeline in CI running Pint (style), PHPStan (analysis), and Rector (quality) with independent stages, parallel execution, caching, and PR annotations.

## When To Use
- Every Laravel project in production
- Teams enforcing code quality gates before deployment
- Multi-developer projects needing consistent quality enforcement
- CI pipelines that need fast feedback with comprehensive analysis

## When NOT To Use
- Prototypes or throwaway code
- Solo projects where developer discipline suffices
- Projects not yet ready to invest in type annotations

## Prerequisites
- Laravel Pint, PHPStan (Larastan), and Rector installed and configured
- CI platform (GitHub Actions, GitLab CI)
- Baseline file for PHPStan (if applicable)

## Inputs
- CI workflow configuration (`.github/workflows/quality.yml`)
- `phpstan.neon` — PHPStan configuration
- `pint.json` — Pint configuration
- `rector.php` — Rector configuration (optional)

## Workflow

1. **Design Pipeline Order:** Configure pipeline as: Composer install → Pint (style, 10s) → PHPStan (analysis, 2-5min) → Rector `--dry-run` (optional, 2-5min) → PHPUnit (1-3min). Place Pint first for fastest feedback.

2. **Implement Stage Independence:** Configure stages as separate jobs or use `continue-on-error` so that if Pint fails, PHPStan still runs. This provides full feedback in one CI run instead of fix→push→wait cycles.

3. **Set Up Parallel Execution:** Run static analysis stages in parallel with the test suite. This reduces total CI wall-clock time.

4. **Configure Caching:** Restore `.php-cs-fixer.cache` for Pint and `tmpDir` for PHPStan from previous runs. Cache keys should include `composer.lock` and config file hashes.

5. **Enable PR Annotations:** Use `--format=github` for both Pint and PHPStan to get inline annotations on PR diffs. Developers see exactly which lines have issues.

6. **Configure PHP Matrix (Optional):** For multi-version compatibility, add `strategy.matrix.php: [8.2, 8.3]`. Narrow to LTS versions to limit job count explosion.

7. **Enforce Baseline:** Use PHPStan baseline to fail CI only on new errors. Fail CI if regenerated baseline differs from committed version.

8. **Set Memory and Parallelism:** Configure `--memory-limit=1G` and `phpstan analyse -j 4` for reliable execution on CI runners.

## Validation Checklist

- [ ] Pipeline runs Pint, PHPStan, and optionally Rector
- [ ] Stages are independent (one failure doesn't block others)
- [ ] Caching configured for both Pint and PHPStan caches
- [ ] PR annotations visible for style and analysis issues
- [ ] PHPStan baseline enforced (no new errors)
- [ ] Pipeline completes under 10 minutes total
- [ ] Memory limit configured (1G)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Stage dependency chain | Second stage doesn't run if first fails; use `continue-on-error` |
| No caching | Full analysis each time; 2-5 min wasted |
| Baseline not enforced | New errors introduced without detection |
| OOM during PHPStan | Set explicit `--memory-limit=1G` |

## Decision Points

- **Static analysis CI gate** for every Laravel project in production
- **Skip Rector in CI** if automated refactoring isn't part of the team workflow
- **PHP matrix:** LTS versions only; avoid full matrix explosion

## Performance/Security Considerations

- **Pipeline order:** Style (10s) → Static analysis (2-5min) → Tests (1-3min)
- **Parallelism:** Run static analysis alongside tests; total wall time = max(analysis, tests)
- **Memory:** 1G minimum for PHPStan; 2G+ for large projects with parallel processing

## Related Rules

- SACIR-RULE-001: Separate stages
- SACIR-RULE-002: Parallel execution
- SACIR-RULE-004: Cache strategy
- SACIR-RULE-005: PR annotations
- SACIR-RULE-006: Baseline enforcement

## Related Skills

- Integrate Pint into CI
- Set Up Laravel PHPStan with Larastan
- Configure Rector for Automated Laravel Refactoring
- Generate and Manage PHPStan Baseline

## Success Criteria

- CI pipeline provides comprehensive quality feedback in under 10 minutes
- Style, analysis, and quality checks run independently for full feedback
- Baseline enforcement prevents new static analysis debt
- PR annotations give developers inline visibility into issues
