# Skill: Upgrade Laravel Versions with Shift

## Purpose
Use Laravel Shift (commercial service) to automate 80-95% of changes required for major Laravel version upgrades, with a git-based workflow for review.

## When To Use
- Every major Laravel version upgrade
- Codebases with deprecated method usage needing modernization
- Teams wanting automated upgrade processing before manual verification

## When NOT To Use
- Very simple codebases where manual upgrade may be faster
- Budget constraints (use Rector with Laravel rules as open-source alternative)
- Patch version upgrades (no API changes)

## Prerequisites
- Laravel Shift subscription
- Git repository with clean main branch
- Comprehensive test suite covering the application
- Staging environment for pre-production verification

## Inputs
- Laravel Shift service (web-based or CLI)
- Git repository URL or code upload

## Workflow

1. **Upgrade PHP First:** In a separate step from the Laravel upgrade, ensure PHP version meets the target Laravel's requirements (e.g., PHP 8.2+ for Laravel 11).

2. **Run Shift for One Version:** Process each major version sequentially (10→11, not 10→12 directly). Shift creates a temporary Git branch with atomic commits.

3. **Review Git Diff:** Inspect Shift's atomic commits. Pay special attention to config diffs — config structural changes often contain important new settings.

4. **Run Tests:** Execute the full test suite. Shift generates correct syntax but can't verify business logic. Fix any test failures.

5. **Check Third-Party Packages:** Shift updates Laravel but not all packages. Verify third-party package compatibility manually. Check each package's upgrade guides.

6. **Test on Staging:** Deploy to staging environment and verify all critical user flows. Not just automated tests — manual smoke testing.

7. **Merge and Deploy:** After verification, merge the upgrade branch and deploy to production. Monitor error rates and performance post-deployment.

8. **Plan Review Time:** Allocate 2-8 hours for medium-sized application review per major version upgrade.

## Validation Checklist

- [ ] PHP upgraded to compatible version before Laravel Shift
- [ ] Shift run for one version at a time (incremental)
- [ ] Git diff reviewed: composer.json, config files, code changes
- [ ] Full test suite passes after Shift
- [ ] Third-party packages verified for compatibility
- [ ] Staging deployment tested with manual smoke tests
- [ ] Production deployment monitored (errors, performance)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Multi-version jump | More breakage at once; always upgrade incrementally |
| Not testing third-party packages | Package incompatibility breaks production |
| Config diff skipped | Missing important new config settings |
| No staging test | Edge cases found in production first |

## Decision Points

- **Use for every major Laravel version upgrade** — Handles 80-95% of changes
- **Use Rector with Laravel rules** as open-source alternative if budget doesn't justify commercial service
- **Skip for very simple codebases** where manual upgrade may be faster
- **Upgrade incrementally** — Go through each major version sequentially

## Performance/Security Considerations

- **Review time:** 2-8 hours for medium-sized application per major version
- **Shift + manual polish:** Shift handles mechanical 80%; you handle semantic 20%
- **Keep clean Git history:** Shift's atomic commits document every upgrade change
- **Test on staging first:** Never merge and deploy without staging verification

## Related Rules

- SHIFT-RULE-001: Upgrade incrementally
- SHIFT-RULE-002: Run tests after Shift
- SHIFT-RULE-003: Review config diffs carefully
- SHIFT-RULE-004: Check third-party packages
- SHIFT-RULE-006: Test on staging first

## Related Skills

- Apply Rector Rules for Laravel Upgrades
- Configure Rector for Automated Laravel Refactoring
- Set Up Laravel PHPStan with Larastan

## Success Criteria

- 80-95% of upgrade changes automated by Shift
- Test suite passes with zero regressions
- Third-party packages all compatible with new Laravel version
- Production deployment succeeds with no critical issues
