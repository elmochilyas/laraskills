# 04-Standardized Knowledge: PHPStan Baseline Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | phpstan-baseline-patterns |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | phpstan-config-for-laravel, phpstan-neon-configuration, static-analysis-ci-integration |
| **Framework/Language** | PHPStan, Larastan, PHP |

## Overview

PHPStan's baseline records current errors as a "known issues" file, enabling strict analysis on existing codebases. `--generate-baseline` creates `phpstan-baseline.neon`. Subsequent runs ignore baseline errors, allowing teams to work at strict levels (6-9) while fixing pre-existing issues incrementally. Baseline includes error counts per file for trend tracking. Effective management: periodic regeneration, CI comparison, and reduction targets.

## Core Concepts

- **Baseline File**: NEON file listing all known errors with file/line/message
- **Error Grouping**: grouped by file and error type for matching
- **Baseline Scope**: captures errors at current analysis level only
- **Freshness**: PHPStan warns when baseline is stale (fixed errors still listed)
- **Count Tracking**: each entry includes error count; excess over baseline is reported

## When to Use

- Adopting strict PHPStan on existing codebases with many errors
- Teams wanting to prevent new errors while fixing existing ones gradually
- CI pipelines enforcing no new static analysis debt
- Large-scale Laravel applications where fixing everything at once is infeasible

## When NOT to Use

- New projects with no existing errors (no baseline needed)
- Teams not using PHPStan
- Projects where all errors can be fixed immediately

## Best Practices (WHY)

- **Start comprehensive, reduce aggressively**: capture all errors, then fix methodically
- **Set reduction targets**: quarterly 10-15% reduction in baseline size
- **Regenerate regularly**: monthly cleanup removes stale entries and tracks progress
- **Fail CI on new errors**: compare regenerated baseline against committed version
- **Baseline at strict level**: generate at target level, not lowest (capture full debt)
- **Track baseline size**: monitor `wc -l` on baseline file in team dashboards

## Architecture Guidelines

- Commit baseline to version control (visible debt tracker)
- Use separate file: `phpstan-baseline.neon` included from main config
- Level graduation: level 2 → fix → level 4 → fix → level 6 → fix → level 9
- Assign baseline ownership to specific team members
- Dedicated cleanup PRs (not mixed with feature work)

## Performance Considerations

- 10,000 baseline entries: ~100ms loading time (negligible)
- Baseline file: 500KB-1MB for 10K entries — fast parsing
- CI comparison: <1s overhead

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Never regenerating | Stale errors stay in baseline | Lost debt tracking | Regenerate monthly |
| Baseline at level 1 | Low-level baseline misses most issues | False sense of security | Generate at target strict level |
| Ignoring staleness warnings | PHPStan warns of stale entries | Missed cleanup | Heed warnings and regenerate |
| No size tracking | Baseline grows unnoticed | Debt accumulates | Track baseline size in CI |
| Baseline as permanent exemption | Errors never fixed | Technical debt | Set reduction targets |

## Examples

```bash
# Generate baseline at level 6
vendor/bin/phpstan analyse --level=6 --generate-baseline

# CI: check for new errors
vendor/bin/phpstan analyse --memory-limit=1G

# Regenerate baseline (monthly cleanup)
vendor/bin/phpstan analyse --memory-limit=1G --generate-baseline
```

## Related Topics

- phpstan-config-for-laravel — Laravel configuration
- phpstan-neon-configuration — NEON format syntax
- static-analysis-ci-integration — CI pipeline setup

## Verification

- [ ] Baseline generated at target strict level
- [ ] Committed to version control
- [ ] Monthly regeneration scheduled
- [ ] CI fails on new baseline errors
- [ ] Baseline size tracked over time
- [ ] Reduction targets established and reviewed
- [ ] Baseline is a separate file, not inline
