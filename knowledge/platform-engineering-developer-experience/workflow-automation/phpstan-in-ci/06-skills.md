# Skill: Run PHPStan in CI

## Purpose
Configure PHPStan (Larastan) to run in CI with baseline support for legacy code, result caching, and inline PR annotations, ensuring no new static analysis errors are introduced.

## When To Use
- Every Laravel project with multiple contributors
- Projects migrating to newer PHP versions (PHPStan catches incompatibilities)
- Teams wanting to enforce type safety

## When NOT To Use
- Prototypes where analysis overhead isn't justified
- Projects without type annotations

## Prerequisites
- PHPStan (Larastan) installed and configured
- `phpstan.neon` configuration file
- CI platform (GitHub Actions, GitLab CI)

## Inputs
- CI workflow file (`.github/workflows/phpstan.yml`)
- `phpstan.neon` — PHPStan configuration
- `phpstan-baseline.neon` — baseline for legacy errors

## Workflow

1. **Generate Baseline for Legacy Code:** Run `phpstan analyse --generate-baseline` before enabling PHPStan in CI. This captures all existing errors and allows the team to enforce "no new errors" on every PR.

2. **Cache Result Cache:** Configure `.phpstan.result.cache` caching between CI runs. Without caching, full analysis takes 2-5 minutes instead of 5-10 seconds. Cache key should include `composer.lock` hash.

3. **Configure Level and Format:** Use level 6 for Laravel projects. Use `--error-format=github` for GitHub Actions — errors appear inline on PR diffs.

4. **Set Explicit Memory Limit:** Run `php -d memory_limit=2G vendor/bin/phpstan analyse` to prevent OOM on large projects. CI runners often have limited memory.

5. **Make PHPStan a Required Check:** In branch protection settings, require PHPStan to pass before merging. Create a dedicated PHPStan job in CI.

6. **Regenerate Baseline in Dedicated PRs:** Create dedicated cleanup PRs that regenerate the baseline. Never use `--generate-baseline` to hide newly introduced errors.

7. **Level Increment Pattern:** For teams increasing strictness, generate baseline at the new level, then fix errors incrementally in dedicated cleanup PRs.

## Validation Checklist

- [ ] Baseline generated and committed before enabling in CI
- [ ] `.phpstan.result.cache` cached between CI runs
- [ ] Level 6 configured for Laravel
- [ ] `--error-format=github` for inline annotations
- [ ] Memory limit set (2G)
- [ ] PHPStan job is required status check
- [ ] Baseline regenerated in dedicated PRs only

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| No baseline for legacy code | All existing errors block CI; generate baseline first |
| No result caching | Full analysis each run (2-5 min instead of 5-10 sec) |
| OOM during analysis | Set explicit `memory_limit=2G` in CI command |
| Baseline used to hide new errors | Never re-generate baseline to hide new issues |

## Decision Points

- **Use for every Laravel project with multiple contributors**
- **Skip for prototypes** where analysis overhead isn't justified
- **Level 5** starting point for teams new to static analysis; **level 6+** for mature teams

## Performance/Security Considerations

- **Result caching:** Most important optimization for CI speed (5-10 sec vs 2-5 min)
- **Memory:** PHPStan can consume 512MB-2GB; allocate 2G for CI runners
- **Baseline:** Essential for legacy codebases; prevents new errors while acknowledging existing ones

## Related Rules

- PSICI-RULE-001: Use baseline for legacy codebases
- PSICI-RULE-002: Cache .phpstan.result.cache
- PSICI-RULE-003: Use level 6 for Laravel projects
- PSICI-RULE-004: Use `--error-format=github`
- PSICI-RULE-005: Set explicit memory limit

## Related Skills

- Set Up Automated Testing in CI
- Run Pint in CI
- Generate and Manage PHPStan Baseline

## Success Criteria

- PHPStan passes in CI with no new errors (baseline-accepted legacy errors allowed)
- Result caching keeps analysis under 10 seconds
- Errors appear inline on PR diffs for developer visibility
- PHPStan is a required status check that blocks merging on failure
