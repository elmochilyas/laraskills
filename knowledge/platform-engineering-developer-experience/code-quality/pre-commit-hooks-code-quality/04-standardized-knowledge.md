# 04-Standardized Knowledge: Pre-commit Hooks Code Quality

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pre-commit-hooks-code-quality |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-pint, laravel-phpstan, laravel-rector, pint-ci-integration |
| **Framework/Language** | PHP, pre-commit, Git, Laravel Pint, PHPStan |

## Overview

Pre-commit hooks catch code quality issues before they reach CI. For Laravel: `pre-commit` framework configured via `.pre-commit-config.yaml` running Pint (style), PHPStan (analysis), and Rector (upgrades) on staged files. Zero-config hooks target only staged changes (`git diff --cached`). Skip patterns allow bypassing hooks for WIP commits. Fast execution by filtering to changed files only.

## Core Concepts

- **pre-commit Framework**: language-agnostic hook manager using `.pre-commit-config.yaml`
- **Staged Files Only**: hooks run on `git diff --cached` files for speed
- **repo/local**: hooks from remote repos or local scripts
- **Hook Entry Points**: format → lint → analyze — early hooks fail fast before expensive analysis
- **Skip Patterns**: `SKIP=hook_name git commit` for urgent WIP bypass

## When to Use

- All Laravel projects with more than one developer
- Projects enforcing code style and static analysis
- Teams wanting instant feedback before CI

## When NOT to Use

- Solo projects where developer discipline suffices
- CI-only enforcement model with fast pipeline (< 2 min)

## Best Practices (WHY)

- **Order hooks wisely**: fast hooks first (Pint 2s), then PHPStan (30s), then Rector (60s)
- **Run on staged files only**: `pint --test --dirty` targets only changed files for <1s
- **Use repo hooks**: install via `pre-commit install` (not manually symlinked)
- **Skip for WIP**: `SKIP=pint-format git commit` for drafts; bypass tracked in commit msg
- **Version lock hooks**: pin hook `rev:` to prevent unexpected updates
- **Install globally**: `pip install pre-commit` in developer setup script

## Architecture Guidelines

- One `.pre-commit-config.yaml` at repo root
- Separate CI from pre-commit — CI runs full analysis, hooks run incremental
- Staged-only PHPStan: `phpstan analyse --memory-limit=1G app/` (not full codebase)
- Allow `--no-verify` for emergency commits (document in team norms)

## Performance Considerations

- Pint on staged files: <1s
- PHPStan on staged files: 5-30s (vs 2-5min full)
- Rector on staged files: 10-60s (vs 5-10min full)
- pre-commit framework overhead: 200ms per hook

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Full scan instead of staged | Hooks take 5+ minutes | Developers disable hooks | Always run on staged files |
| Not pinning hook versions | New release breaks config | All developers blocked | Pin rev: for every hook |
| No skip mechanism | Urgent commits blocked | --no-verify habit | Documented SKIP env usage |
| Wrong hook order | Slow hooks block fast ones | User waits unnecessarily | Fast hooks first |
| Not in developer setup | New devs missing hooks | Quality gaps | Add to onboarding script |

## Examples

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/laravel/pint
    rev: 1.18.0
    hooks:
      - id: pint
        args: ['--test', '--dirty']
  - repo: https://github.com/phpstan/phpstan
    rev: 1.12.0
    hooks:
      - id: phpstan
        args: ['analyse', '--memory-limit=1G']
```

## Related Topics

- pint-ci-integration — CI-level Pint integration
- static-analysis-ci-integration — CI-level static analysis
- coding-standards-documentation — documenting team standards

## Verification

- [ ] pre-commit installed globally (`pip install pre-commit`)
- [ ] pre-commit install run in repo
- [ ] hooks target staged files only
- [ ] Hook versions pinned
- [ ] Fast hooks before slow ones
- [ ] Skip mechanism documented
