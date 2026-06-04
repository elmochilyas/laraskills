# Experience Curation: Git Hooks (CaptainHook)

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/git-hooks-captainhook
- **Maturity:** Mature
- **Related Technologies:** CaptainHook, Git Hooks, Composer, Laravel, Pint, PHPStan, Commit Message Validation
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Git hooks are scripts that run automatically at specific points in the Git lifecycle (pre-commit, commit-msg, pre-push). CaptainHook is a PHP-based Git hook manager that allows Laravel teams to define, install, and manage Git hooks using Composer, eliminating the need for shell scripts or external dependencies like Husky (Node.js). Common hooks for Laravel projects include: pre-commit hooks that run Pint and PHPStan to catch issues before they're committed, commit-msg hooks that enforce Conventional Commits format, and pre-push hooks that run the test suite before pushing. CaptainHook manages hook configuration in a `captainhook.json` file committed to the repository, ensuring all team members have identical hooks.

## Core Concepts
- **Git Hook Events:** pre-commit (before commit), commit-msg (validates message), pre-push (before push), post-checkout, post-merge
- **CaptainHook:** A PHP Git hook manager installed via Composer; provides configuration format, pre-built actions, and auto-installation via Composer scripts
- **Hook as Quality Gate:** Each hook is a lightweight quality gate that prevents bad code from entering the commit history
- **Composer Script Integration:** CaptainHook hooks are installed automatically by `vendor/bin/captainhook install --force`, typically triggered by Composer's post-install script
- **Hook as Safety Net:** The first safety net, catching issues before they leave the developer's machine; CI is the second safety net (server-side)

## When To Use
- Laravel teams that want to catch code style and type errors before they reach CI
- Projects enforcing Conventional Commits format for commit messages
- Teams that want to reduce CI pipeline failures by catching issues locally first
- Projects where all developers use Composer (no need for Node/Husky dependency)
- Teams establishing consistent quality practices across all developers

## When NOT To Use
- Solo projects where the single developer controls quality without hooks
- Projects already using a different Git hook manager (Husky, pre-commit framework) successfully
- CI-only quality enforcement is sufficient (hooks add developer friction)
- Projects where PHP is not the primary language (use the ecosystem-appropriate tool)

## Best Practices
- **WHY:** Use pre-commit hooks for fast checks only (<30 seconds): Pint on staged files, PHPStan on staged files. Reserve full test suite for pre-push or CI.
- **WHY:** Use staged-files-only execution (git-dirty option in CaptainHook) for pre-commit hooks; this reduces execution time by 90%+ for large projects
- **WHY:** Add auto-installation via Composer scripts (`post-install-cmd`, `post-update-cmd`); hooks are installed automatically on `composer install`, requiring no manual setup
- **WHY:** Use CaptainHook over Husky for Laravel projects; CaptainHook is PHP-native, integrates with Composer, and avoids pulling Node/NPM
- **WHY:** Document the `--no-verify` skip policy; developers should know when it's acceptable to bypass hooks (emergency hotfixes, WIP commits)

## Architecture Guidelines
- **Pre-Commit Pint + PHPStan Pattern:** Run Pint and PHPStan on staged files before every commit; blocks commit if violations exist
- **Commit-Msg Conventional Commits Pattern:** Validate commit message format (feat:, fix:, chore:, etc.) before commit is created
- **Pre-Push Test Suite Pattern:** Run full test suite before every git push; catches broken tests before they reach CI
- **Changed-Files Only Pattern:** Use staged-files-only execution for pre-commit to minimize execution time
- **Auto-Install via Composer Pattern:** Register post-install-cmd and post-update-cmd scripts for automatic hook installation
- **Hook Manager:** CaptainHook (PHP-native, Composer-integrated) over Husky (Node-dependent)
- **Hook Scope:** Pre-commit for fast checks (<30s); pre-push for full test suite (slower)
- **Skip Mechanism:** `--no-verify` for emergencies with documented policy

## Performance
- Pint on staged files: 1-3 seconds. PHPStan on staged files: 5-15 seconds. Full test suite: 1-10 minutes
- Pre-commit hooks should complete in under 30 seconds; longer hooks should be in pre-push
- Staged-files-only execution reduces time by 90%+ for large projects; only changed files are checked
- PHPStan's result cache speeds up repeated runs (2-5 seconds vs 30-60 seconds for uncached)

## Security
- CaptainHook configuration (captainhook.json) is committed to the repository; all team members see and review it via PRs
- Hook commands run with the developer's local permissions; no special security considerations
- Git hooks should not run in CI; CI runs its own validation. Exclude hook installation from CI composer install
- The `--no-verify` bypass is a Git feature; document the policy for appropriate use
- Review hook configuration changes as part of normal PR process

## Common Mistakes

### Hooks too slow
- **Description:** Pre-commit hooks that run the full test suite (5+ minutes)
- **Consequence:** Developers are frustrated and abuse `--no-verify`
- **Better Approach:** Keep pre-commit hooks under 30 seconds; move full test suite to pre-push or CI

### Hooks not installed
- **Description:** New team members clone the repo but hooks aren't installed
- **Consequence:** Quality checks are skipped; team assumes hooks are running
- **Better Approach:** Auto-install via Composer scripts; document in README that `composer install` is required

### Hooks block WIP commits
- **Description:** Developers can't make WIP commits because Pint/PHPStan fails on incomplete code
- **Consequence:** Developers use `--no-verify` habitually
- **Better Approach:** Use staged-files-only checks; allow `--no-verify` with documented policy for WIP

### External tool dependency
- **Description:** A hook runs a tool that isn't installed (e.g., pint not in require-dev)
- **Consequence:** Hook fails or is skipped silently
- **Better Approach:** Only run hooks for tools guaranteed available via composer install

### No skip policy
- **Description:** Developers don't know when it's acceptable to use `--no-verify`
- **Consequence:** They either never use it (frustrated) or always use it (defeats purpose)
- **Better Approach:** Document the `--no-verify` policy; clearly state acceptable use cases

## Anti-Patterns
- **Husky in Laravel projects:** Using Node-based Husky for PHP projects; adds unnecessary Node/NPM dependency
- **Full test suite in pre-commit:** Running 10-minute test suite on every commit; encourages `--no-verify` abuse
- **No auto-installation:** Requiring developers to manually install hooks; frequently forgotten
- **Hooks without CI fallback:** Relying solely on hooks for quality enforcement; CI still needs its own checks
- **All-files check in pre-commit:** Running Pint/PHPStan on all project files instead of staged files; 10x slower

## Examples
- **Laravel Pint:** Most common pre-commit hook; CaptainHook runs pint --test on staged files
- **Laravel PHPStan:** Second most common pre-commit hook; CaptainHook runs phpstan on staged files
- **Laravel Pest/PHPUnit:** Pre-push hook standard; runs full test suite before allowing push
- **Laravel Sail:** CaptainHook hooks run inside the Sail container; commands use ./vendor/bin/sail prefix

## Related Topics
- pint-ci-integration (complementary CI enforcement of Pint)
- phpstan-in-ci (complementary CI enforcement of PHPStan)
- pre-commit-hooks-code-quality (broader pre-commit hook patterns)
- automated-testing-in-ci (CI testing complements pre-push hooks)
- git-conventional-commits (commit message convention enforced by commit-msg hook)

## AI Agent Notes
- CaptainHook is the most popular PHP-native Git hook manager for Laravel projects; created by Sebastian Feldmann, maintained since 2018
- The Laravel ecosystem has shifted from Husky (Node-based) to CaptainHook (PHP-based) as the default
- Staged-file-only execution is the recommended approach for pre-commit hooks to minimize execution time
- Start with pre-commit hooks for fast checks; add pre-push hooks for test suite when CI feedback needs to be faster
- Always document the `--no-verify` policy; lack of guidelines leads to inconsistent hook usage

## Verification
- [ ] CaptainHook is installed via Composer (captainhook/captainhook)
- [ ] captainhook.json is committed to the repository with hook configuration
- [ ] Pre-commit hooks run Pint and PHPStan on staged files
- [ ] Commit-msg hook enforces Conventional Commits format (if applicable)
- [ ] Pre-push hook runs the test suite (optional, based on team preference)
- [ ] Auto-installation is configured via Composer post-install-cmd and post-update-cmd
- [ ] Hook installation is excluded from CI (CI runs its own validation)
- [ ] Pre-commit hooks complete in under 30 seconds
- [ ] `--no-verify` policy is documented and communicated to the team
- [ ] Hooks use only tools available via composer install (no external dependencies)
