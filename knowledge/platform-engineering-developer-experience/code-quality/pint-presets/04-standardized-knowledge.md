# 04-Standardized Knowledge: Pint Presets

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pint-presets |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-pint, pint-configuration, custom-pint-rules |
| **Framework/Language** | Laravel Pint, PHP-CS-Fixer, PHP |

## Overview

Pint provides four built-in presets defining baseline code style: `laravel` (Laravel conventions), `psr12` (PHP-FIG PSR-12), `per` (PER coding style), and `symfony` (Symfony conventions). Selected via `"preset"` in `pint.json`. Each preset enables comprehensive PHP-CS-Fixer rules for braces, imports, spacing, trailing commas, quotes, and naming. Custom rules override preset defaults. The `laravel` preset is default and includes Laravel-specific ordering and helper conventions.

## Core Concepts

- **Laravel Preset**: default — ordered imports (facades first), Laravel helper spacing, PSR-12 compliance
- **PSR-12 Preset**: strict PHP-FIG PSR-12 compliance
- **PER Preset**: PHP Extended Rules — evolution of PSR-12 with modern patterns
- **Symfony Preset**: Symfony framework coding standards
- **Preset Inheritance**: custom rules merge with preset; overrides win
- **Rule Defaults**: `true` (enabled), `false` (disabled), or absent (inherit parent)

## When to Use

- **Laravel preset**: Laravel apps and packages (matches ecosystem standards)
- **PSR-12 preset**: framework-agnostic PHP libraries
- **PER preset**: modern PHP projects wanting latest conventions
- **Symfony preset**: Symfony framework projects

## When NOT to Use

- Using a preset without understanding its enabled rules
- Switching presets mid-project without a formatting commit
- Defining a comprehensive custom ruleset (use preset + minimal overrides)
- Expecting presets to cover every style decision (they don't)

## Best Practices (WHY)

- **Use `laravel` for Laravel projects**: code looks like it belongs in the ecosystem
- **Minimal override**: start with preset, add 3-5 overrides for strong team preferences
- **Document choice**: explain preset selection in CONTRIBUTING.md
- **Full format on preset change**: run `pint` on whole codebase after changing preset
- **Cross-project consistency**: use same preset across all organization Laravel projects

## Architecture Guidelines

- Preset selected in `pint.json` — committed for team-wide consistency
- For monorepos, use nested `pint.json` per package with appropriate presets
- Review preset content when upgrading Pint (rules may be added/removed)
- Use `pint -v` to see effective rules being applied

## Performance Considerations

- Laravel preset: ~80 rules; PSR-12: ~60; PER: ~70; Symfony: ~90
- Rule count has negligible impact on formatting speed
- Preset loading is compiled; switching preset has zero performance cost

## Security Considerations

- Presets are formatting rules only — no security implications
- Custom rules could theoretically introduce formatting that hides code issues

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No preset specified | Defaults to `laravel` silently | Not knowing | Unexpected for non-Laravel | Always set preset explicitly |
| Mid-project preset switch | Thousands of style diffs | Not planning | Massive formatting commit | Full-format commit after switch |
| Assuming complete coverage | Missing edge cases | Overconfidence | Inconsistent spots | Complement with manual style guide |
| 30+ custom rules on preset | Defeats preset purpose | Strong opinions | Hard to maintain | Use preset + minimal overrides |
| Not verifying effective rules | Surprise formatting | Not checking | Unexpected changes | Run pint -v to verify |

## Anti-Patterns

- **Full Custom Ruleset**: defining all rules from scratch instead of using preset + overrides
- **Frequent Preset Switching**: changing presets with each project creates inconsistency
- **Ignoring Preset Changes**: not reviewing preset updates when Pint version changes
- **Forcing Non-Laravel Preset on Laravel**: using PSR-12 on Laravel projects misses ecosystem conventions

## Examples

```json
{
    "preset": "laravel",
    "rules": {
        "single_quote": true,
        "no_unused_imports": true,
        "trailing_comma_in_multiline": true
    }
}
```

## Related Topics

- laravel-pint — Pint overview and installation
- pint-configuration — pint.json configuration reference
- custom-pint-rules — rule customization beyond presets

## AI Agent Notes

- Laravel preset was developed by analyzing Laravel's own codebase formatting
- `per` preset represents PER coding style (PHP-FIG evolution of PSR-2)
- Presets are not extensible — custom "presets" created by starting with preset + overrides
- For non-Laravel codebases, recommend `psr12` or `per` preset

## Verification

- [ ] Correct preset selected for project type
- [ ] Custom rules documented with rationale
- [ ] Full formatting commit made when preset was established
- [ ] Team understands what conventions the preset enforces
- [ ] Same preset used across all organization Laravel projects
- [ ] Preset rules reviewed after Pint version upgrades
