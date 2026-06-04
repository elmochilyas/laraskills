# Skill: Set Up Pre-commit Hooks for Code Quality

## Purpose
Configure `pre-commit` hooks for Laravel projects that run Pint, PHPStan, and Rector on staged files to catch code quality issues before they reach CI.

## When To Use
- All Laravel projects with more than one developer
- Projects enforcing code style and static analysis
- Teams wanting instant feedback before CI

## When NOT To Use
- Solo projects where developer discipline suffices
- CI-only enforcement model with fast pipeline (< 2 min)

## Prerequisites
- `pre-commit` framework installed (`pip install pre-commit` or system package)
- Git repository initialized
- Pint, PHPStan, Rector configured in project

## Inputs
- `.pre-commit-config.yaml` — hook configuration at repo root
- Local hook scripts (for custom hooks)

## Workflow

1. **Install pre-commit Framework:** Run `pip install pre-commit` or install via system package manager. Add to developer setup script.

2. **Create .pre-commit-config.yaml:** Define hooks at repo root. Order hooks wisely: fast hooks first (Pint 2s), then PHPStan (30s), then Rector (60s if enabled).

3. **Configure Staged-Files-Only Hooks:** Use `pint --test --dirty` for Pint (staged files only). Use `phpstan analyse` (runs on all files but faster than full CI). Target only changed files for speed.

4. **Install Hooks:** Run `pre-commit install` from repo root. Verify hooks run on `git commit`.

5. **Lock Hook Versions:** Pin hook `rev:` values in `.pre-commit-config.yaml` to prevent unexpected hook updates from breaking commits.

6. **Document Skip Patterns:** Teach team to use `SKIP=hook_name git commit` for urgent WIP commits. This provides a tracked bypass mechanism.

7. **Allow --no-verify for Emergencies:** Document in team norms that `git commit --no-verify` is allowed for emergency hotfixes, with the understanding that CI will still catch issues.

## Validation Checklist

- [ ] `pre-commit` framework installed globally
- [ ] `.pre-commit-config.yaml` at repo root with ordered hooks
- [ ] Hooks run on staged files only for speed
- [ ] `pre-commit install` completes successfully
- [ ] `git commit` triggers hooks and fails on issues
- [ ] Hook versions pinned
- [ ] `--no-verify` documented for emergencies

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Hooks not installed | `pre-commit install` not run after clone |
| Hooks running on all files | Slow; configure staged-files-only |
| Version not pinned | Unexpected hook updates break workflow |
| Team bypasses hooks | CI catches issues but cycle is longer |

## Decision Points

- **Use for all projects with >1 developer** for instant feedback before CI
- **Separate CI from pre-commit:** CI runs full analysis; hooks run incremental on staged files
- **Order hooks wisely:** Fast hooks first (Pint 2s), then PHPStan (30s), then Rector (60s)

## Performance/Security Considerations

- **Speed:** Staged-files-only hooks complete in 2-10 seconds (vs 2-10 minutes for full CI)
- **SKIP mechanism:** Documented bypass for WIP commits ensures hooks don't block creativity
- **Global install:** Add `pip install pre-commit` to developer setup script for consistency

## Related Rules

- PRECOMMIT-RULE-001: Order hooks wisely
- PRECOMMIT-RULE-002: Run on staged files only
- PRECOMMIT-RULE-003: Use repo hooks
- PRECOMMIT-RULE-004: Skip for WIP
- PRECOMMIT-RULE-005: Version lock hooks

## Related Skills

- Integrate Pint into CI
- Integrate Static Analysis in CI
- Configure Laravel Pint for Code Style
- Set Up Laravel PHPStan with Larastan

## Success Criteria

- Pre-commit hooks catch style and analysis issues before CI
- Hooks complete in under 10 seconds on staged files
- Team has documented bypass mechanisms for WIP and emergencies
- CI serves as safety net; most issues caught locally
