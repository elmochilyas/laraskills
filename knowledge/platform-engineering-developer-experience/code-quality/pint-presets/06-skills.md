# Skill: Select Appropriate Pint Preset

## Purpose
Choose the correct Pint preset (`laravel`, `psr12`, `per`, `symfony`) for a project and configure it in `pint.json`, understanding which code style conventions each preset enforces.

## When To Use
- Starting a new Laravel project or PHP library
- Setting up code style standards for a team
- Switching code style conventions to match ecosystem norms

## When NOT To Use
- Using a preset without understanding its enabled rules
- Switching presets mid-project without a formatting commit
- Defining a comprehensive custom ruleset (use preset + minimal overrides)
- Expecting presets to cover every style decision (they don't)

## Prerequisites
- `laravel/pint` installed
- Understanding of code style conventions (PSR-12, Laravel conventions)

## Inputs
- `pint.json` — preset selection

## Workflow

1. **Determine Project Type:**
   - Laravel application/package → `laravel` preset
   - Framework-agnostic PHP library → `psr12` preset
   - Modern PHP project wanting latest conventions → `per` preset
   - Symfony framework project → `symfony` preset

2. **Set Preset in pint.json:** Create `{"preset": "laravel"}` for Laravel projects. Always set the preset explicitly rather than relying on the implicit `laravel` default.

3. **Add Minimal Overrides:** After preset selection, add 3-5 custom rules only for strong team preferences that differ from the preset. Don't define rules from scratch.

4. **Format Codebase on Preset Change:** When switching presets mid-project, run `pint` on the entire codebase in one isolated commit. Never switch presets without a full format.

5. **Ensure Cross-Project Consistency:** Use the same preset across all organization Laravel projects for consistent code style across the codebase.

## Validation Checklist

- [ ] Preset explicitly set in `pint.json`
- [ ] Preset matches project type (Laravel → `laravel`, library → `psr12`)
- [ ] Full codebase formatted after preset change (isolated commit)
- [ ] All projects in organization use same preset
- [ ] Custom rules minimal (3-5 max beyond preset)
- [ ] `pint --test` passes with selected preset

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Preset not set explicitly | Relies on implicit `laravel` default |
| Preset mismatch | Library using `laravel` preset; ecosystem reads differently |
| Mid-project switch without full format | Stale formatting on unchanged files |
| Too many custom rules | Maintenance burden; revert to preset + minimal |

## Decision Points

- **Use `laravel` preset for Laravel projects** — Code looks like it belongs in the ecosystem
- **Use `psr12` for framework-agnostic libraries** — Strict PHP-FIG compliance
- **Use `per` for modern PHP projects** — Evolution of PSR-12 with latest conventions
- **Use `symfony` for Symfony projects** — Symfony framework coding standards

## Performance/Security Considerations

- **Preset change impact:** Affects all files; run as isolated commit
- **Organization consistency:** Uniform preset across projects reduces cognitive load when switching contexts

## Related Rules

- PPRES-RULE-001: Use laravel preset for Laravel projects
- PPRES-RULE-002: Use PSR-12 for framework-agnostic libraries
- PPRES-RULE-005: Start with preset, add minimal overrides
- PPRES-RULE-006: Full format on preset change

## Related Skills

- Configure Pint via pint.json
- Configure Custom Pint Rules
- Configure Laravel Pint for Code Style

## Success Criteria

- Project uses the most appropriate preset for its ecosystem
- Code formatted consistently across all organization projects
- Custom rules are minimal and justified
- Preset changes are clean, isolated commits
