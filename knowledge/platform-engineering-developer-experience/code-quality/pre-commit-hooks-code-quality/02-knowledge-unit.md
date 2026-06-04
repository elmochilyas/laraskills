# Knowledge Unit: Pre-Commit Hooks for Code Quality

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/pre-commit-hooks-code-quality
- **Maturity:** Mature
- **Related Technologies:** CaptainHook, Git Hooks, Laravel Pint, PHPStan, PHP, Pre-commit

## Executive Summary

Pre-commit hooks automate code quality checks before each commit, preventing style issues, static analysis errors, and testing failures from entering the repository. For Laravel projects, pre-commit hooks typically run: Pint (code style check/fix), PHPStan (static analysis on changed files), and PHPUnit/Pest (relevant tests). The two main approaches in the Laravel ecosystem are CaptainHook (PHP-based hook manager with Laravel integration) and the language-agnostic `pre-commit` framework (YAML-configured). Hooks can run on staged files only (fast, incremental) or on the full project (thorough). Pre-commit hooks enforce quality at the earliest possible point—before the commit is created—providing faster feedback than CI and preventing bad commits from reaching the remote repository.

## Core Concepts

- **Git Hooks:** Scripts in `.git/hooks/` that Git executes at specific points in the workflow: `pre-commit` (before commit), `prepare-commit-msg` (edit message), `post-commit` (after commit)
- **Staged Files Only:** Hooks typically check only files in the Git staging area (`git diff --cached --name-only`) for fast feedback
- **Hook Failure:** If a pre-commit hook exits with non-zero, the commit is aborted. No commit is created until the hook passes.
- **Hook Bypass:** `git commit --no-verify` or `-n` bypasses pre-commit hooks for emergencies (should be rare)
- **CaptainHook:** PHP-based hook manager that integrates with Laravel projects; hooks configured in `captainhook.json` with pre-built actions for Pint, PHPStan, and PHPUnit
- **pre-commit Framework:** Language-agnostic framework using `.pre-commit-config.yaml`; supports hooks in any language with a large ecosystem of pre-built hooks

## Mental Models

- **Pre-Commit as Quality Gate:** The last gate before code enters the repository—like airport security before boarding
- **Pre-Commit as Instant CI:** While CI runs in minutes (after push), pre-commit runs in seconds (before commit)—faster feedback loop
- **Pre-Commit as Team Convention Enforcer:** Hooks encode team agreements ("we always run Pint before committing") into executable, automated checks

## Internal Mechanics

1. **Git Trigger:** `git commit` triggers the `pre-commit` hook script (in `.git/hooks/pre-commit`)
2. **Staged File Detection:** CaptainHook or the custom script reads staged files via `git diff --cached --name-only`
3. **Tool Execution:** Quality tools (Pint, PHPStan) are executed against the staged files or project
4. **Staging Modified Files:** If Pint fixes style issues, the hook may re-stage the modified files (add to index)
5. **Exit Code Evaluation:** If any tool returns non-zero, the hook outputs the error and exits non-zero, aborting the commit
6. **Commit Creation:** If all hooks pass, Git creates the commit normally

## Patterns

- **Pint Auto-Fix + Re-Stage Pattern:** Run `pint` on staged files, then `git add` the modified files back to staging. This auto-fixes style without developer intervention.
- **PHPStan Changed-Only Pattern:** Run `phpstan analyse --paths=<staged-files> --level=6` on only the files being committed. Fast feedback without full project analysis.
- **Selective Test Run Pattern:** Run tests related to the changed files (not the full test suite) for fast pre-commit feedback. Use `phpunit --filter=<changed-class>` or path-based test selection.
- **Gradual Adoption Pattern:** Start with Pint only (fast, low-friction), add PHPStan after a week, add test runner after a month. Let the team adapt gradually.
- **CI vs Hook Split Pattern:** Pre-commit checks fast, incremental checks (Pint, PHPStan on changed files); CI runs thorough checks (full PHPStan, full test suite). Both gates exist but serve different purposes.
- **Hook Bypass Documentation Pattern:** Document the `--no-verify` escape hatch but require justification in commit message (e.g., `[skip hooks] Urgent hotfix`). Track bypass frequency as a team metric.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Hook manager | CaptainHook vs pre-commit framework vs custom bash | CaptainHook for Laravel-native; pre-commit for language-agnostic teams |
| Hook scope | Staged files only vs full project | Staged files for speed; full project for thoroughness (but slow) |
| Auto-fix behavior | Fix and re-stage vs report and abort | Fix and re-stage for Pint; report and abort for PHPStan (can't auto-fix) |
| Enforcement | Block commit vs warn only | Block for Pint/PHPStan; warn for long-running checks |

## Tradeoffs

- **Speed vs Thoroughness:** Pre-commit hooks should be fast (under 10 seconds) to avoid disrupting developer flow. This means checking only staged/changed files. CI catches what pre-commit misses (full scope). Finding the right balance is critical—hooks that take too long get bypassed.
- **Auto-Fix vs Developer Control:** Auto-fixing Pint issues is convenient but modifies the staging area, which can confuse developers who carefully staged specific changes. Some teams prefer to report issues and let developers fix manually.
- **CaptainHook vs pre-commit:** CaptainHook is PHP-based (no extra runtime dependencies for PHP projects) but has a smaller hook ecosystem. pre-commit is more powerful (larger hook ecosystem, Python-based) but adds a runtime dependency.

## Performance Considerations

- **Pint on Staged Files:** Pint on staged files (5-20 files) takes 1-3 seconds. Auto-fix + re-stage adds another 1-2 seconds.
- **PHPStan on Staged Files:** PHPStan analysis of a small set of changed files takes 5-15 seconds with Larastan (warm cache). Cold cache takes 15-30 seconds.
- **Test Runner on Changed Files:** Running tests for changed classes takes 10-30 seconds (including PHPUnit bootstrap). Full test suite takes 1-10 minutes.
- **Hook Total Time:** Pre-commit hooks should target <30 seconds total. Longer hooks encourage `--no-verify` bypass.
- **PHP Process Spawning:** Each tool (Pint, PHPStan, PHPUnit) spawns a separate PHP process. Sequential execution adds 1-2 seconds of overhead per tool.

## Production Considerations

- **Team Adoption:** Pre-commit hooks are only effective if the team uses them. Install hooks via `captainhook install` (Composer hook) or `composer install` events. Provide documentation on hook behavior.
- **CI Consistency:** Pre-commit checks may differ from CI checks (scope, level). Ensure CI still runs the full enforcement. Pre-commit is a convenience, not a replacement for CI.
- **Hook Installation:** Hooks must be installed per developer machine (`.git/hooks/` is not tracked). Use CaptainHook's Composer integration to automate installation on `composer install`.
- **Large File Handling:** Very large files (5000+ lines) slow down pre-commit analysis. Exclude generated files and configuration files from pre-commit checks.
- **Cross-Platform Compatibility:** Pre-commit hooks must work on all developer machines (Windows, macOS, Linux). Use PHP-based tools (CaptainHook) for cross-platform compatibility; avoid bash-specific features.

## Common Mistakes

- **Running full CI in pre-commit:** Running the entire test suite, full PHPStan analysis, and all linting in pre-commit; takes 5+ minutes, developers bypass hooks with --no-verify
- **Not auto-installing hooks**: Adding hook configuration but not automating installation via Composer; new developers don't have hooks active
- **Blocking on preventable issues:** Failing pre-commit for warnings or informational messages that don't affect code quality; every failure must be actionable
- **Ignoring Windows compatibility:** hooks that use bash scripts, Unix paths, or Linux-specific commands; break on Windows developer machines
- **Not handling Pint re-stage correctly:** Auto-fixing Pint issues but not re-adding the fixed files to staging; the original (unfixed) version is committed
- **Overly aggressive hooks:** Blocking commits for trailing whitespace in third-party bundle files or generated code; use exclusion patterns

## Failure Modes

- **Hook Hangs:** A quality tool hangs (PHPStan memory exhaustion, Pint on very large file) and the hook never completes. Mitigate: set timeout limits on hook execution.
- **False Positive Blocks:** A hook fails on a legitimate code pattern (PHPStan false positive). Mitigate: allow `--no-verify` with required justification; fix false positives in configuration.
- **Hook Bypass Abuse:** Developers regularly use `--no-verify` for all commits. Mitigate: track bypass frequency; reduce hook friction; educate on hook purpose.
- **Staged File Corruption:** An auto-fix hook incorrectly modifies staged files, introducing errors. Mitigate: use version control (staged changes can be restored from `git stash`).
- **Environment Mismatch:** The hook runs a tool that's not installed or a different version. Mitigate: use `composer install` as hook prerequisite; lock tool versions in composer.json.

## Ecosystem Usage

- **CaptainHook:** The most popular PHP hook manager, with pre-built actions for Laravel Pint, PHPStan, and PHPUnit
- **pre-commit Framework:** Language-agnostic alternative with hooks for PHP-CS-Fixer, PHPStan, and shellcheck
- **Laravel Forge:** Forge's deployment scripts can include pre-deployment quality checks (similar to hooks but at deployment time)
- **GitHub Actions:** Pre-commit hooks serve as local gates; GitHub Actions serve as remote gates. Both are used together in mature workflows.
- **Husky (Node.js):** JavaScript teams use Husky for pre-commit hooks; in Laravel projects with significant frontend, Husky may be used alongside CaptainHook

## Related Knowledge Units

- pint-ci-integration
- phpstan-in-ci
- git-hooks-captainhook
- static-analysis-ci-integration

## Research Notes

- CaptainHook was created by Sebastian Feldmann and is the most widely adopted PHP hook manager, with built-in support for Pint, PHPStan, and Composer script execution
- The `pre-commit` framework (Python-based) was created by Anthony Sottile and has hooks for over 1000 tools across all languages
- Git hooks are not pushed with the repository; they must be installed per-clone. CaptainHook automates this via its `composer install` hook integration.
- PHPStan's result cache significantly speeds up incremental analysis; pre-commit hooks benefit greatly from warm result caches in CI
