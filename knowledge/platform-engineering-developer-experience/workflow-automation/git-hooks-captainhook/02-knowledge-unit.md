# Knowledge Unit: Git Hooks (CaptainHook)

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/git-hooks-captainhook
- **Maturity:** Mature
- **Related Technologies:** CaptainHook, Git Hooks, Composer, Laravel, Pint, PHPStan, Commmit Message Validation

## Executive Summary

Git hooks are scripts that run automatically at specific points in the Git lifecycle (pre-commit, commit-msg, pre-push). CaptainHook is a PHP-based Git hook manager that allows Laravel teams to define, install, and manage Git hooks using Composer, eliminating the need for shell scripts or external dependencies like Husky (Node.js). Common hooks for Laravel projects include: pre-commit hooks that run Pint --test and PHPStan to catch issues before they're committed, commit-msg hooks that enforce Conventional Commits format, and pre-push hooks that run the test suite before pushing. CaptainHook manages hook configuration in a `captain-hook.json` or `captainhook.json` file that is committed to the repository, ensuring all team members have identical hooks. The hooks are installed automatically via Composer's post-install script, making them part of the standard `composer install` workflow.

## Core Concepts

- **Git Hook Events:** pre-commit (runs before commit is created), commit-msg (validates commit message format), pre-push (runs before push to remote), post-checkout (runs after branch switch), post-merge (runs after merge)
- **CaptainHook:** A PHP Git hook manager installed via Composer; provides a clean configuration format, pre-built actions (PHP execution, shell commands, file validation), and auto-installation via Composer scripts
- **Hook as Quality Gate:** Each hook is a lightweight quality gate that prevents bad code from entering the commit history; pre-commit catches style issues, pre-push catches test failures
- **Composer Script Integration:** CaptainHook's hooks are installed automatically by the `vendor/bin/captainhook install --force` command, typically triggered by a Composer post-install or post-update script

## Mental Models

- **Hook as Safety Net at the Developer's Desk:** Git hooks are the first safety net, catching issues before they leave the developer's machine—before commit, before push. CI is the second safety net (server-side).
- **CaptainHook as Orchestrator:** CaptainHook doesn't execute the checks itself; it orchestrates when and how to run existing tools (Pint, PHPStan, PHPUnit) based on configuration, like a conductor directing musicians
- **Hook as Team Policy Enforcement:** Hooks encode team policies (commit message format, code style, test requirements) as executable rules that run automatically, eliminating the need for manual policy reminders

## Internal Mechanics

1. **Installation:** `composer require captainhook/captainhook` installs the package and registers a Composer plugin that auto-installs hooks after composer install/update
2. **Configuration:** captainhook.json defines hooks by Git event (pre-commit, commit-msg, pre-push); each hook can run multiple actions (commands) with specific conditions
3. **Hook Execution:** When a Git event triggers (e.g., git commit), Git executes the corresponding hook script in .git/hooks/, which calls CaptainHook's PHP runner
4. **Action Execution:** CaptainHook runs the configured actions sequentially; if any action exits with a non-zero code, the hook fails and Git aborts the commit/push
5. **Output Display:** Action output (Pint violations, PHPStan errors, test results) is shown to the developer in the terminal with the hook, providing immediate feedback
6. **Skip Mechanism:** Developers can skip hooks with `--no-verify` flag (git commit --no-verify, git push --no-verify) for emergency situations where hooks are blocking

## Patterns

- **Pre-Commit Pint + PHPStan Pattern:**
  ```json
  {
    "pre-commit": {
      "actions": [
        {
          "action": "./vendor/bin/pint --test",
          "options": {
            "name": "Laravel Pint",
            "allowedExits": [0]
          }
        },
        {
          "action": "./vendor/bin/phpstan analyse --no-progress",
          "options": {
            "name": "PHPStan",
            "allowedExits": [0]
          }
        }
      ]
    }
  }
  ```
  Runs Pint and PHPStan before every commit; commit is blocked if either fails.
- **Commit-Msg Conventional Commits Pattern:**
  ```json
  {
    "commit-msg": {
      "actions": [
        {
          "action": "php -r 'if(!preg_match(\"/^(feat|fix|chore|docs|refactor|test)\\(.+\\):.+/\", file_get_contents(\"$0\"))) exit(1);' \"$1\"",
          "options": {
            "name": "Conventional Commit",
            "allowedExits": [0]
          }
        }
      ]
    }
  }
  ```
  Validates that the commit message follows the Conventional Commits format (feat:, fix:, chore:, etc.).
- **Pre-Push Test Suite Pattern:**
  ```json
  {
    "pre-push": {
      "actions": [
        {
          "action": "./vendor/bin/pest --parallel --order-by=defects",
          "options": {
            "name": "Pest Tests",
            "allowedExits": [0]
          }
        }
      ]
    }
  }
  ```
  Runs the full test suite before every git push; catches broken tests before they reach CI.
- **Changed-Files Only Pattern:**
  ```json
  {
    "pre-commit": {
      "actions": [
        {
          "action": "./vendor/bin/pint --test",
          "options": {
            "name": "Pint (staged files only)",
            "files": "git-dirty",
            "allowedExits": [0]
          }
        }
      ]
    }
  }
  ```
  Runs Pint only on staged (dirty) files, reducing execution time for large projects.
- **Auto-Install via Composer Pattern:**
  ```json
  {
    "scripts": {
      "post-install-cmd": [
        "vendor/bin/captainhook install --force"
      ],
      "post-update-cmd": [
        "vendor/bin/captainhook install --force"
      ]
    }
  }
  ```
  Automatically installs or updates CaptainHook hooks on every composer install or update.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Hook manager | CaptainHook vs Husky vs shell scripts | CaptainHook (PHP-native, no Node dependency, Composer-integrated) |
| Hook scope | Pre-commit only vs pre-commit + pre-push | Pre-commit for fast checks (Pint, PHPStan); pre-push for full test suite (slower) |
| Skip mechanism | --no-verify vs conditional skip | --no-verify for emergencies; document the policy for when skipping is acceptable (see below) |
| Staged vs all files | Staged only (git-dirty) vs all files | Staged only for pre-commit (faster, focused on the change); all files for pre-push (comprehensive) |

## Tradeoffs

- **CaptainHook vs Husky:** CaptainHook is PHP-native and integrates with Composer; Husky is Node-native and integrates with NPM. For Laravel projects (which already have Composer), CaptainHook avoids pulling in Node/NPM just for hooks. Use CaptainHook unless the project already uses Node for frontend build tooling.
- **Pre-Commit vs CI-Only Quality Gates:** Pre-commit hooks catch issues before they're committed, reducing CI pipeline failures and the resulting wasted CI time. However, they slow down the commit process (5-30 seconds per commit). CI-only gates are faster for the developer but result in more failed CI runs. Use pre-commit for fast checks (<10 seconds) and CI for comprehensive validation.
- **Strict vs Permissive Hooks:** Strict hooks (block on any failure) enforce quality consistently but cause frustration when they block legitimate commits (WIP commits, experimental code). Permissive hooks (advisory, non-blocking) are less intrusive but less effective. Use strict hooks for pre-push (tests must pass); use advisory hooks for pre-commit (or allow --no-verify with a documented policy).

## Performance Considerations

- **Hook Execution Time:** Pint on staged files: 1-3 seconds. PHPStan on staged files: 5-15 seconds. Full test suite: 1-10 minutes. Pre-commit hooks should complete in under 30 seconds; longer hooks should be in pre-push.
- **Staged Files Optimization:** Running tools only on staged files (git-dirty option in CaptainHook) reduces execution time by 90%+ for large projects; only the changed files are checked, not the entire codebase.
- **PHPStan Cache:** PHPStan's result cache speeds up repeated runs; hooks that run PHPStan on every commit benefit significantly from the cache (2-5 seconds vs 30-60 seconds for an uncached run).

## Production Considerations

- **--no-verify Policy:** Document the team's policy for when --no-verify is acceptable: CI will catch the issue anyway, the hook is blocking a legitimate workflow (e.g., git stash, WIP commit), or the developer is in an emergency situation and will fix later.
- **Hook Versioning:** CaptainHook configuration is committed to the repository; hook changes are reviewed via PR like any other code change. All team members get updated hooks on the next composer install.
- **CI Should Not Have Hooks:** Git hooks should not run in CI; CI runs its own validation. Exclude hook installation from CI composer install (use --no-scripts or environment detection).

## Common Mistakes

- **Hooks too slow:** Pre-commit hooks that run the full test suite (5+ minutes) frustrate developers and encourage --no-verify abuse. Keep pre-commit hooks under 30 seconds.
- **Hooks not installed:** New team members clone the repo but hooks aren't installed because the post-install script wasn't run. Document that `composer install` is required; add a setup step in the README.
- **Hooks block WIP commits:** Developers can't make WIP commits because Pint/PHPStan fails on incomplete code. Use staged-files-only checks or allow --no-verify with a tracking policy.
- **External tool dependency:** A hook runs a PHP package that isn't installed (e.g., pint not in require-dev). Hooks should only use tools that are guaranteed available via composer install.
- **No skip policy:** Developers don't know when it's acceptable to use --no-verify; they either never use it (frustrated) or always use it (defeats the purpose). Document the policy.

## Failure Modes

- **Hook Blocks Urgent Fix:** A critical production hotfix is blocked by a PHPStan error on unrelated code. Mitigate: use --no-verify for emergencies; document the "bypass hook" policy.
- **Hook Incompatible with Git Workflow:** A post-merge hook causes issues during rebase or merge operations. Mitigate: use pre-commit and pre-push hooks primarily; avoid hooks that run during merge/rebase.
- **Hooks Slow Down All Operations:** Pre-commit hook runs on every commit, including git stash, git commit --amend, and cherry-pick operations. Mitigate: use CaptainHook's conditions to skip on non-standard Git operations.
- **Team Member Removes Hooks:** A developer manually removes or modifies .git/hooks/; their hooks stop running. Mitigate: CaptainHook's Composer plugin re-installs hooks on every composer install; document the setup process.

## Ecosystem Usage

- **Laravel Pint:** The most common pre-commit hook for Laravel projects; CaptainHook runs pint --test on staged files before every commit
- **Laravel PHPStan:** The second most common pre-commit hook; CaptainHook runs phpstan analyse against staged files
- **Laravel Pest/PHPUnit:** The pre-push hook standard; CaptainHook runs the full test suite before allowing pushes to remote
- **Laravel Sail:** CaptainHook hooks run inside the Sail container; the hook commands must use ./vendor/bin/sail artisan or ./vendor/bin/sail as prefix

## Related Knowledge Units

- pint-ci-integration
- phpstan-in-ci
- pre-commit-hooks-code-quality
- automated-testing-in-ci
- contributing-dot-md-patterns

## Research Notes

- CaptainHook is the most popular PHP-native Git hook manager for Laravel projects; it was created by Sebastian Feldmann and has been actively maintained since 2018
- The `--no-verify` bypass is a Git feature, not a CaptainHook feature; it's available for any Git hook system
- Staged-file-only execution (using git diff --cached) is the recommended approach for pre-commit hooks to minimize execution time
- The Laravel ecosystem has shifted from Husky (Node-based) to CaptainHook (PHP-based) as the default Git hook manager, aligning with Laravel's PHP-native preference
