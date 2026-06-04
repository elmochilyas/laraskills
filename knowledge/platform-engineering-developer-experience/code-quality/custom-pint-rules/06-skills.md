# Skill: Configure Custom Pint Rules

## Purpose
Extend Laravel Pint's built-in presets with custom PHP-CS-Fixer rules for team-specific formatting conventions beyond what presets provide.

## When To Use
- Team-specific formatting conventions not covered by presets
- Forbidden functions/patterns (`dd()`, `dump()` in committed code)
- Custom import ordering for project architecture
- Type declaration preferences (nullable syntax, trailing commas)

## When NOT To Use
- When preset defaults are acceptable (don't add unnecessary rules)
- For style decisions that have no consensus (causes team friction)
- When custom fixers require heavy maintenance for marginal formatting benefit

## Prerequisites
- Laravel Pint installed and configured
- `pint.json` at project root
- Understanding of PHP-CS-Fixer rule names and syntax

## Inputs
- `pint.json` — preset selection and custom rules
- Custom fixer classes (for complex transformations)

## Workflow

1. **Start with Preset:** Select a preset (`laravel`, `psr12`, `per`, `symfony`) in `pint.json`. Presets provide a baseline of 80+ rules.

2. **Add Minimal Overrides:** Add 3-5 custom rules under the `rules` section for strong team opinions. Example: `"no_unused_imports": true`, `"ordered_imports": true`, `"no_trailing_whitespace": true`.

3. **Document Rule Rationale:** For each custom rule, document why it exists in `CONTRIBUTING.md`. This prevents future debates about removing/adjusting the rule.

4. **Test on Codebase:** Run `pint --test` to verify all custom rules apply correctly without conflicts.

5. **Avoid Conflicting Rules:** Ensure no two rules modify the same aspect (e.g., spaces vs tabs). Test after adding new rules.

6. **Lock Pint Version:** In `composer.json`, pin the Pint version (e.g., `"laravel/pint": "1.18.*"`) to prevent unexpected rule behavior changes.

7. **Create Custom Fixers (When Needed):** For domain-specific transformations, create classes implementing `FixerInterface`, PSR-4 autoloadable, and register via Pint extensions.

## Validation Checklist

- [ ] `pint.json` has preset and minimal custom rules (3-5)
- [ ] All custom rules have documented rationale in CONTRIBUTING.md
- [ ] `pint --test` passes with zero style issues
- [ ] No conflicting rules in the ruleset
- [ ] Pint version locked in `composer.json`
- [ ] Generated files excluded via `notPath`/`notName`

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Conflicting rules | PHP-CS-Fixer returns error; test after adding rules |
| Too many custom rules | Maintenance burden; revert to preset + minimal overrides |
| Breaking Pint updates | Pin version to prevent unexpected changes |
| Generated files formatted | Use `notPath`/`notName` exclusions |

## Decision Points

- **Custom rules vs preset defaults:** Skip custom rules when preset defaults are acceptable
- **Custom fixers vs existing rules:** Skip custom fixers when heavy maintenance outweighs marginal formatting benefit
- **Per-directory rules:** Use nested `pint.json` files for subdirectories needing different standards

## Performance/Security Considerations

- **Rule count impact:** 3-5 custom rules add negligible time; 20+ rules slow analysis noticeably
- **Generated files:** Always exclude via `notPath`/`notName` to avoid modifying auto-generated code

## Related Rules

- CUSTPIN-RULE-001: Start with preset, add minimal overrides
- CUSTPIN-RULE-002: Document each rule's rationale
- CUSTPIN-RULE-003: Avoid conflicting rules
- CUSTPIN-RULE-004: Test rules on codebase
- CUSTPIN-RULE-005: Lock Pint version

## Related Skills

- Configure Laravel Pint
- Select Appropriate Pint Preset
- Integrate Pint into CI

## Success Criteria

- Custom Pint rules enforce team-specific formatting conventions consistently
- `pint --test` passes across the entire codebase
- All team members use identical formatting rules
- Generated code is excluded from formatting
