# Skill: Configure Pint via pint.json

## Purpose
Create and manage `pint.json` configuration for Laravel Pint, including preset selection, custom rule overrides, and file exclusions.

## When To Use
- Customizing code style beyond preset defaults
- Excluding legacy code or generated files from formatting
- Per-directory configuration in monorepos or multi-standard projects
- Team-wide enforcement of specific formatting conventions

## When NOT To Use
- Default Laravel projects (no config needed)
- Teams happy with preset defaults
- Projects using Pint only in CI (config not committed)

## Prerequisites
- `laravel/pint` installed
- Basic understanding of PHP-CS-Fixer rules

## Inputs
- `pint.json` — configuration file at project root
- Nested `pint.json` files (for per-directory config)

## Workflow

1. **Create pint.json:** Create `{"preset": "laravel"}` at project root. This is the minimal configuration that works for most Laravel projects.

2. **Select Preset:** Choose from `laravel` (default, Laravel conventions), `psr12` (PHP-FIG PSR-12), `per` (Extended Rules), or `symfony` (Symfony standards). Always set preset explicitly.

3. **Add Custom Rules:** Under the `rules` key, add overrides for specific PHP-CS-Fixer rules. Use `true` to enable, `false` to disable, or arrays for complex options (e.g., `"concat_space": {"spacing": "one"}`).

4. **Exclude Files:** Use `notPath` for directory patterns (`["bootstrap/cache/*"]`) and `notName` for file patterns (`["*.blade.php"]`). Exclude generated code and legacy directories.

5. **Commit pint.json:** Commit to version control so all team members and CI use identical configuration.

6. **Validate JSON:** Ensure no trailing commas in `pint.json`. Trailing commas cause silent failures in Pint.

7. **Lock Pint Version:** Pin `"laravel/pint": "1.18.*"` in `composer.json` to prevent unexpected rule behavior changes.

## Validation Checklist

- [ ] `pint.json` at project root with explicit preset
- [ ] Custom rules (if any) tested and documented
- [ ] Generated files excluded via `notPath`/`notName`
- [ ] JSON format valid (no trailing commas)
- [ ] `pint.json` committed to version control
- [ ] Pint version pinned in `composer.json`
- [ ] `pint --test` passes on full codebase

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Trailing comma in JSON | Pint silently skips invalid JSON; uses defaults |
| Config not committed | Different formatting across machines |
| Generated files formatted | Large diffs from bootstrap/cache changes |
| Conflicting rules | Two rules modifying the same aspect |

## Decision Points

- **No config needed** for default Laravel projects where preset defaults are acceptable
- **Use config** for team-specific conventions, legacy code exclusion, or monorepo subdirectory standards
- **Nested pint.json** for subdirectories needing different standards (monorepos)

## Performance/Security Considerations

- **Rule count:** Minimal config is fastest; 3-5 custom rules add negligible time
- **Exclusions critical:** Failing to exclude generated files produces unusable diffs
- **CI compatibility:** Committed config ensures identical behavior across environments

## Related Rules

- PINT-CONF-RULE-001: Start minimal
- PINT-CONF-RULE-002: Exclude generated code
- PINT-CONF-RULE-003: Commit pint.json
- PINT-CONF-RULE-004: Review config in PRs
- PINT-CONF-RULE-005: Use glob patterns for exclusions

## Related Skills

- Configure Custom Pint Rules
- Select Appropriate Pint Preset
- Integrate Pint into CI

## Success Criteria

- `pint.json` configuration is consistent across all team members and CI
- Generated and legacy code is excluded from formatting
- Custom rules enforce team-specific conventions without conflicts
- `pint --test` passes on the entire codebase
