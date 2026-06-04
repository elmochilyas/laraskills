# 04-Standardized Knowledge: Pint CI Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pint-ci-integration |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-pint, pint-configuration, pint-presets |
| **Framework/Language** | Laravel Pint, GitHub Actions, GitLab CI, PHP |

## Overview

Integrating Pint into CI automates code style enforcement. Primary pattern: `pint --test` as a CI step — exits 0 (clean) or 1 (issues found), failing the build. Advanced patterns: auto-fix with commit back to PR, GitHub Actions annotations for inline error display, cached runs for speed, and gating other steps on style compliance. Version pinning prevents unexpected rule changes from breaking pipelines.

## Core Concepts

- **--test Flag**: dry-run mode for CI gates — exit 0 (clean) or 1 (changes needed)
- **GitHub Actions Annotations**: `pint --test --format=github` outputs inline PR annotations
- **Caching**: PHP-CS-Fixer token cache speeds subsequent runs 50-80%
- **Auto-Fixing in CI**: running `pint` (no --test) fixes style, then commits changes

## When to Use

- CI pipelines for every Laravel project
- PR checks that fail fast on style issues before running tests
- Automated style cleanup PRs on a schedule (weekly/monthly)
- Pre-merge quality gates enforcing formatting standards

## When NOT to Use

- Projects without a committed pint.json (style standards not defined)
- CI environments with very tight time budgets (< 30s total)
- When formatting changes in CI create workflow complexity

## Best Practices (WHY)

- **Run Pint early**: place as first CI step after dependency install for fast feedback
- **Pin Pint version**: `"laravel/pint": "1.18.*"` prevents unexpected rule changes
- **Use --format=github**: provides inline annotations on PR diffs for developer visibility
- **Cache tokens**: restore `.php-cs-fixer.cache` from CI cache for 50-80% speed improvement
- **Auto-fix then test**: run `pint` (fix) then `pint --test` (verify) for clean CI
- **Exclude vendor/generated**: ensure CI config excludes non-source directories

## Architecture Guidelines

- Gate mode (--test) for strict teams; auto-fix mode for flexible teams
- Early timing (before tests) provides fast feedback
- Separate CI config vs local config not needed if pint.json is committed
- For monorepos, run Pint per module with separate configs

## Performance Considerations

- Full project scan: 3-8 seconds (500 files); dirty scan: 1-2 seconds
- Caching reduces subsequent runs 50-80%; cache key should include OS/PHP/Pint version
- `--format=github` adds ~0.5s for annotation processing
- Auto-fix commits double CI time (commit triggers re-run)

## Security Considerations

- Pint only modifies PHP files — no security implications
- Ensure CI has proper Git configuration if using auto-fix + commit

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Not using --test in CI | Auto-fix without failing on issues | Style issues pass CI | Always use pint --test for gate |
| Missing cache config | Each CI run from scratch | 5-10s wasted | Cache .php-cs-fixer.cache |
| Inconsistent Pint versions | CI vs local differ | Different results | Pin version in composer.json |
| Not excluding vendor | Formatting third-party code | Wasted time, wrong changes | Exclude vendor, storage |
| Auto-fix without Git config | Commit fails | No authorship | Set CI git user/email |

## Examples

```yaml
# GitHub Actions step
- name: Check code style
  run: vendor/bin/pint --test --format=github
```

## Related Topics

- laravel-pint — Pint overview and installation
- pint-configuration — pint.json configuration reference
- pre-commit-hooks-code-quality — local pre-commit integration

## Verification

- [ ] CI runs `pint --test` as a step
- [ ] Version pinned in composer.json
- [ ] Token cache configured in CI
- [ ] Vendor/storage excluded
- [ ] Formatting failures block PR merge
