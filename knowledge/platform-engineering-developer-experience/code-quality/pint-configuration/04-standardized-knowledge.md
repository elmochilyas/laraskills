# 04-Standardized Knowledge: Pint Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pint-configuration |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-pint, pint-presets, pint-ci-integration |
| **Framework/Language** | Laravel Pint, PHP-CS-Fixer, JSON |

## Overview

Pint configuration via `pint.json` at project root controls the preset, custom rule overrides, and file exclusions. Supports preset selection, rule enable/disable, complex rule sub-options, path exclusions (`notPath`, `notName`), and per-directory configuration via nested `pint.json`. Minimal config: `{"preset": "laravel"}`. Committed to VCS for team-wide consistency.

## Core Concepts

- **pint.json**: JSON config at project root — optional, Pint works with zero config using `laravel` preset
- **Preset**: predefined rule sets — `laravel`, `psr12`, `per`, `symfony`
- **Rules**: PHP-CS-Fixer rules enabled/disabled beyond preset defaults
- **Exclude**: directories/files to skip — relative paths and gitignore patterns
- **NotPath/NotName**: string/regex patterns excluding specific paths or filenames
- **Preset Override**: `rules` section overrides preset defaults with `true`/`false`/arrays

## When to Use

- Customizing code style beyond preset defaults
- Excluding legacy code or generated files from formatting
- Per-directory configuration in monorepos or multi-standard projects
- Team-wide enforcement of specific formatting conventions

## When NOT to Use

- Default Laravel projects (no config needed)
- Teams happy with preset defaults
- Projects using Pint only in CI (config not committed)

## Best Practices (WHY)

- **Start minimal**: preset-only config; add rules only when team disagrees with a specific convention
- **Exclude generated code**: `bootstrap/cache`, `storage/framework/views` prevent large diffs
- **Commit pint.json**: ensures all team members and CI use same configuration
- **Review config in PRs**: rule changes affect entire codebase formatting
- **Use glog patterns for exclusions**: `notPath: ["app/Legacy/*"]` for broad directory exclusion

## Architecture Guidelines

- Place `pint.json` in project root with explicit preset
- Use nested `pint.json` for subdirectories needing different standards
- Document custom rules in CONTRIBUTING.md with rationale
- Validate `pint.json` with JSON linter — trailing commas cause silent failures
- Lock Pint version in `composer.json` to prevent rule behavior changes

## Performance Considerations

- Config parsing: <1ms for typical ~5KB file
- Exclusion pattern evaluation: simple globs are fast; complex regex adds marginal overhead
- Nested config scanning: minimal overhead for subtree discovery

## Security Considerations

- JSON config only — no code execution risk
- Config changes affect all files — review to ensure exclusions are correct

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Invalid JSON | Trailing commas, missing quotes | Syntax error | Silent defaults | Use JSON linter |
| Missing explicit preset | Defaults to `laravel` silently | Not specifying | Unexpected for non-Laravel | Always set preset |
| Wrong rule enable/disable | `false` disables vs null inherits | Confusing semantics | Preset rules disabled | Understand true/false/null |
| Not excluding generated code | Formats cached views/complied configs | Forgetting | Large diffs, CI fails | Exclude generated paths |
| Config not in VCS | Team inconsistency | Not committing | Different formatting | Always commit pint.json |

## Anti-Patterns

- **Over-Configuration**: 50+ custom rules defeats Pint's simplicity
- **No Exclusions**: formatting vendor or generated files unnecessarily
- **Blind Rule Changes**: adding rules without understanding what they do
- **Floating Config**: pint.json not version-controlled

## Examples

```json
{
    "preset": "laravel",
    "rules": {
        "single_quote": true,
        "trailing_comma_in_multiline": true,
        "no_unused_imports": true,
        "concat_space": {
            "spacing": "one"
        }
    },
    "exclude": [
        "app/Legacy",
        "app/ThirdParty"
    ],
    "notPath": [
        "bootstrap/cache/*",
        "storage/framework/views/*"
    ]
}
```

## Related Topics

- laravel-pint — Pint overview and usage
- pint-presets — preset selection and comparison
- pint-ci-integration — CI pipeline integration
- custom-pint-rules — rule customization

## AI Agent Notes

- pint.json uses JSON over PHP-CS-Fixer's PHP config for language-agnostic parsing
- `.pint.json` works as alternative filename
- Nested pint.json overrides parent config for subtree files
- Default exclusions include vendor, node_modules, storage

## Verification

- [ ] pint.json committed to version control
- [ ] Preset explicitly specified
- [ ] Custom rules documented with rationale
- [ ] Generated code excluded from formatting
- [ ] No invalid JSON syntax
- [ ] Pint version locked in composer.json
- [ ] Nested configs consistent with project structure
