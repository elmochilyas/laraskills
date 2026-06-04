# Skill: Apply Rector Rules for Laravel Upgrades

## Purpose
Use Rector's preset rule sets to automate 80%+ of the changes required for Laravel version upgrades (10→11→12), including deprecated method replacements, facade-to-injection conversions, and configuration changes.

## When To Use
- Major Laravel version upgrades (10→11, 11→12)
- Codebases with deprecated method usage
- Automated upgrade processing before manual verification
- Team alignment on current Laravel version best practices

## When NOT To Use
- Patch version upgrades (no API changes)
- Third-party package upgrades (use package-specific rectors)
- Projects already on latest version without deprecated usage

## Prerequisites
- `rector/rector` and `rectorphp/rector-laravel` installed
- `rector.php` configuration file
- Comprehensive test suite to verify changes
- Git feature branch for upgrade work

## Inputs
- `rector.php` — configuration with upgrade rule sets
- Application source code
- Upgrade documentation for the target Laravel version

## Workflow

1. **Create Upgrade Config:** Create a dedicated `rector-laravel-upgrade.php` config for the upgrade. Include the appropriate level set (e.g., `LaravelLevelSetList::UP_TO_LARAVEL_110`).

2. **Apply to app/ Only Initially:** Configure paths to only scan `app/` directory first. Test files can be processed later once application code is verified.

3. **Dry-Run First:** Run `vendor/bin/rector process --dry-run` to preview all changes. Review the diff carefully — 5-10% of automated changes need manual adjustments.

4. **Apply Incrementally:** For multi-version upgrades, apply one version set at a time (L10→L11 first, verify, then L11→L12). Incremental diffs are reviewable.

5. **Run Tests After Each Set:** Run the full test suite after applying Rector changes. Fix any test failures before proceeding to the next set.

6. **Combine with Style Rules:** Run Pint or Rector's coding-style rules as a separate step after all upgrade changes are applied. This keeps upgrade diffs clean.

7. **Work in Feature Branch:** All upgrade Rector runs happen in a feature branch, never directly on main. Create a PR for review.

## Validation Checklist

- [ ] Upgrade config created for specific target version
- [ ] `--dry-run` executed and reviewed before application
- [ ] Rules applied to `app/` only first
- [ ] Full test suite passes after upgrade changes
- [ ] One version set applied at a time (10→11, then 11→12)
- [ ] Upgrade config removed from project after completion
- [ ] Changes in feature branch, not main

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Applying all version sets at once | Overwhelming diff; high manual review burden |
| Not running tests after Rector | Semantic errors introduced; 5-10% need manual fix |
| Running upgrade rules on test files first | Test failures before app code is verified |
| Upgrade config not removed after completion | Stale config confuses future Rector runs |

## Decision Points

- **Use for major Laravel version upgrades** (10→11, 11→12)
- **Not needed for patch version upgrades** (no API changes)
- **Not for third-party package upgrades** — Use package-specific rectors

## Performance/Security Considerations

- **Analysis time:** 2-5 minutes for upgrade rules on medium projects
- **Process order:** Dry-run → review → apply → commit → manual verification
- **Never run on production:** Upgrade changes must go through PR review and CI pipeline

## Related Rules

- UPGRADE-RULE-001: Run sets incrementally
- UPGRADE-RULE-002: Review every change
- UPGRADE-RULE-003: Version-specific config
- UPGRADE-RULE-004: Use --dry-run first
- UPGRADE-RULE-005: Apply to app/ only

## Related Skills

- Configure Rector for Automated Laravel Refactoring
- Set Up Laravel PHPStan with Larastan
- Configure Laravel Pint for Code Style

## Success Criteria

- 80%+ of Laravel upgrade changes automated by Rector
- Remaining 20% manually adjusted and verified by tests
- Upgrade process completed in feature branch with PR review
- No regressions from automated refactoring
