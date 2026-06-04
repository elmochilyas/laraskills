# Skill: Configure Git Hooks with CaptainHook for Laravel

## Purpose
Set up CaptainHook-based Git hooks for Laravel projects that run Pint, PHPStan, and commit message validation on staged files before commits, catching issues before they reach CI.

## When To Use
- Laravel teams wanting to catch style/type errors before they reach CI
- Projects enforcing Conventional Commits format for commit messages
- Teams wanting to reduce CI pipeline failures

## When NOT To Use
- Solo projects where single developer controls quality without hooks
- When CI-only enforcement is sufficient (hooks add developer friction)

## Prerequisites
- `captainhook/captainhook` installed via Composer
- Pint and PHPStan configured in the project

## Inputs
- `captainhook.json` — hook configuration file
- `.git/hooks/` — installed hook scripts

## Workflow

1. **Install CaptainHook:** Run `composer require --dev captainhook/captainhook`. Add to `composer.json` scripts: `"post-install-cmd": ["vendor/bin/captainhook install --force"]`, `"post-update-cmd": ["vendor/bin/captainhook install --force"]`.

2. **Configure Pre-Commit Hook:** Create `captainhook.json` with a pre-commit hook running `pint --test --dirty` (staged files only, under 2s) and `phpstan analyse` (on changed files, under 30s). Keep pre-commit under 30 seconds total.

3. **Configure Commit-Msg Hook:** Add a commit-msg hook validating Conventional Commits format: `feat:`, `fix:`, `chore:`, `BREAKING CHANGE:`. Rejects commits with non-conforming messages.

4. **Configure Pre-Push Hook (Optional):** Add a pre-push hook running the full test suite. This catches failures before pushing, but adds friction — use for critical projects.

5. **Test Hook Installation:** Run `vendor/bin/captainhook install --force` to install hooks. Make a test commit to verify hooks trigger correctly.

6. **Document Skip Policy:** Document the `--no-verify` skip policy for urgent hotfixes. Developers must know when bypassing hooks is acceptable.

7. **Exclude Hook Installation from CI:** Hook installation should be local only. CI runs its own validation without hooks.

## Validation Checklist

- [ ] CaptainHook installed via Composer
- [ ] Pre-commit hook runs Pint + PHPStan on staged files
- [ ] Commit-msg hook enforces Conventional Commits
- [ ] Pre-push hook runs full test suite (if configured)
- [ ] Auto-installation via Composer scripts
- [ ] Skip policy documented (`--no-verify`)
- [ ] Hook installation excluded from CI

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Hooks not installed after clone | Run `composer install` triggers auto-install |
| Hooks too slow pre-commit | Keep under 30s; staged-files-only execution |
| Hooks blocking legitimate commits | Document `SKIP=hook-name git commit` or `--no-verify` |
| CI installing hooks | Exclude from CI scripts; CI runs own validation |

## Decision Points

- **Use for Laravel teams** wanting to catch style/type errors before they reach CI
- **Skip for solo projects** where single developer controls quality without hooks
- **Skip when CI-only enforcement is sufficient** — Hooks add developer friction
- **Pre-commit for fast checks** (< 30s); pre-push for full test suite

## Performance/Security Considerations

- **Staged-files-only:** Reduces pre-commit execution time by 90%+ for large projects
- **Auto-installation:** Essential for team consistency; add to Composer scripts
- **No hooks in CI:** CI runs its own validation in a clean environment

## Related Rules

- CH-RULE-001: Use pre-commit hooks for fast checks only
- CH-RULE-002: Use staged-files-only execution
- CH-RULE-003: Add auto-installation via Composer scripts
- CH-RULE-004: Use CaptainHook over Husky for Laravel
- CH-RULE-005: Document the `--no-verify` skip policy

## Related Skills

- Establish Code Review Standards
- Set Up Automated Testing in CI
- Run Pint in CI

## Success Criteria

- Pre-commit hooks catch style and type errors in under 30 seconds
- Commit messages follow Conventional Commits format
- Team has documented bypass policy for emergencies
- CI failures reduced because issues are caught locally first
