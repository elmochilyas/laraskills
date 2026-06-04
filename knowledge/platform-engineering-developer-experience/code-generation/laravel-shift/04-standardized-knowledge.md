# 04-Standardized Knowledge: Laravel Shift

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-shift |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | blueprint-code-generation, rector-rules-laravel-upgrades, stub-customization-laravel |
| **Framework/Language** | Laravel Shift, Rector, PHP, Laravel |

## Overview

Laravel Shift is a commercial automated upgrade service that analyzes Laravel applications and applies version-to-version upgrade changes. It handles composer dependency bumps, config file migrations, code transformations (deprecated method replacements, API changes), facade-to-helper conversions, and structural changes (directory layout, service provider registration). Each Shift uses static analysis and codemod transformations, creating a temporary Git branch with atomic commits for developer review. Over 1 million shifts processed.

## Core Concepts

- **Shift Scripts**: PHP scripts performing codemod transformations for each version upgrade
- **Git-Based Workflow**: creates branch with atomic commits; original branch untouched for diff review
- **Automated Code Analysis**: PHP-Parser AST analysis identifies patterns needing updating
- **Human Review Layer**: all changes intended for review before merging
- **Shift Blueprint**: underlying engine also powers the open-source Blueprint tool
- **Shift Workbench**: service for testing packages against multiple Laravel versions

## When to Use

- Laravel version upgrades (every major version requires an upgrade)
- Teams wanting to reduce manual upgrade effort (Shift handles 80-95% of changes)
- Applications with complex codebases where manual upgrade would be error-prone
- Compliance requirements where you need documented upgrade paths

## When NOT to Use

- Teams preferring open-source tools (use Rector with Laravel rules)
- Applications with very simple codebases (manual upgrade may be faster)
- Projects with highly customized Laravel core modifications
- When budget constraints don't justify a commercial service

## Best Practices (WHY)

- **Upgrade incrementally**: go through each major version sequentially, not multi-version jumps
- **Run tests after Shift**: Shift generates correct syntax but can't verify business logic
- **Review config diffs carefully**: config structural changes often contain important new settings
- **Check third-party packages**: Shift updates Laravel but not all third-party packages — verify compatibility manually
- **Use Shift + manual polish model**: Shift handles mechanical 80%, you handle semantic 20%
- **Test on staging first**: never merge and deploy to production without staging verification

## Architecture Guidelines

- Upgrade PHP version in a separate step before Laravel version upgrade
- Keep a clean Git history — Shift's atomic commits document every upgrade change
- Plan review time: 2-8 hours for medium-sized application per major version upgrade
- Run Shift as scheduled CI task to detect deprecated usage proactively
- Maintain upgrade compatibility matrix for third-party packages

## Performance Considerations

- Shift analysis: 1-10 minutes depending on codebase size
- Test suite execution after Shift is the main time cost
- Reviewing a Shift PR for major version: 2-8 hours
- Complex apps (500+ files) may require multiple Shift passes

## Security Considerations

- Shift requires repository access — use GitHub OAuth for convenience, self-hosted for compliance
- Review all config changes for security implications
- Check for removed or deprecated security features in the new version
- Validate that authentication and authorization still work after upgrade
- Ensure encryption, hashing, and security-related configuration migrated correctly

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Skipping intermediate versions | Direct jump across major versions | Impatience | Compound issues | Upgrade one version at a time |
| Not running tests | Assuming Shift is perfect | Trusting automation | Missed bugs | Always run full test suite |
| Not reviewing config changes | Missing new config options | Ignoring diffs | Missing features | Review every config diff |
| No team review | Knowledge gaps | Solo merge | Team doesn't understand changes | PR review with team |
| Over-customizing output | Modifying Shift-generated code | Perfectionism | Future upgrade complications | Accept standard upgrade path |

## Anti-Patterns

- **Shift as Black Box**: applying Shift and merging without understanding what changed
- **No Staging Test**: deploying upgraded app directly to production without staging verification
- **Ignoring Deprecation Warnings**: not fixing deprecation notices that Shift doesn't address
- **Skipping Dependency Audit**: not verifying every third-party package works with new version
- **Shift for Non-Laravel Code**: using Shift for application logic changes that Shift can't handle

## Examples

```bash
# Upgrade workflow
1. Ensure PHP version meets new Laravel requirements
2. Run Shift (via GitHub or manual upload)
3. Review Shift branch: git diff main...shift-branch
4. Run full test suite: php artisan test
5. Fix any failing tests (Shift may miss edge cases)
6. Check third-party package compatibility
7. Deploy to staging and verify
8. Merge and deploy to production

# Check Laravel version support
# Laravel provides 18 months bug fixes, 24 months security fixes per major version
```

## Related Topics

- blueprint-code-generation — YAML-based code generation
- rector-rules-laravel-upgrades — open-source alternative
- stub-customization-laravel — customizing scaffolding templates
- automated-deployment-pipelines — deployment workflow automation

## AI Agent Notes

- Shift was created by Jason McCreary (also created Blueprint) — both share transformation engine
- Over 1 million shifts processed; it's the standard Laravel upgrade tool
- Rector with Laravel rules can replicate some Shift transformations for open-source preference
- Shift v2+ supports Laravel 11's new directory structure changes

## Verification

- [ ] Sequentially upgraded through each major version (not skipping)
- [ ] Full test suite passes after Shift application
- [ ] All config diffs reviewed and understood
- [ ] Third-party packages verified for new Laravel version compatibility
- [ ] PHP version meets new Laravel requirements
- [ ] Staging environment tested before production
- [ ] Rollback plan documented
- [ ] Team has reviewed Shift PR
- [ ] No deprecated method calls remain (post-Shift static analysis)
- [ ] Email, queue, cache, session configurations migrated correctly
