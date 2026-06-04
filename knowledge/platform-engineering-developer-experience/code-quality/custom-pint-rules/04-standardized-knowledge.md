# 04-Standardized Knowledge: Custom Pint Rules

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | custom-pint-rules |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | pint-configuration, pint-presets, pint-ci-integration |
| **Framework/Language** | Laravel Pint, PHP-CS-Fixer, PHP |

## Overview

Custom Pint rules extend code style enforcement beyond built-in presets by configuring PHP-CS-Fixer rules in `pint.json` under `rules`. Supports custom import ordering, forbidden functions, type declaration preferences, spacing conventions, and complex rule options. Custom fixer classes can be created for project-specific transformations. Rules merge with preset defaults; overrides win.

## Core Concepts

- **Rule Definition**: PHP-CS-Fixer rule name + value in `pint.json` rules key
- **Rule Configurability**: complex rules accept arrays: `'concat_space': { 'spacing': 'one' }`
- **Custom Fixers**: classes implementing `FixerInterface` for domain-specific transformations
- **Preset Overrides**: custom rules merge with preset; explicit values override preset defaults

## When to Use

- Team-specific formatting conventions not covered by presets
- Forbidden functions/patterns (`dd()`, `dump()` in committed code)
- Custom import ordering for project architecture
- Type declaration preferences (nullable syntax, trailing commas)

## When NOT to Use

- When preset defaults are acceptable (don't add unnecessary rules)
- For style decisions that have no consensus (causes team friction)
- When custom fixers require heavy maintenance for marginal formatting benefit

## Best Practices (WHY)

- **Start with preset, add minimal overrides**: 3-5 custom rules for strong opinions
- **Document each rule's rationale**: explain why a rule exists in CONTRIBUTING.md
- **Avoid conflicting rules**: two rules that modify the same aspect produce unexpected results
- **Test rules on codebase**: run `pint --test` after adding rules to verify behavior
- **Lock Pint version**: custom rules depend on specific PHP-CS-Fixer behavior

## Architecture Guidelines

- Define custom rules in `pint.json` `rules` section
- Custom fixers should be PSR-4 autoloadable and registered via Pint extensions
- Use `notPath`/`notName` to exclude generated files from custom rule application
- For per-directory rules, use nested `pint.json` files

## Performance Considerations

- Simple custom rules: <1ms per file
- Complex AST-based rules: 5-10ms per file — negligible for CI
- Exclusion patterns add marginal overhead per file

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Conflicting rules | Two rules modify same aspect | Unexpected formatting | Test rules together |
| Setting false vs null | false enforces opposite; null = not set | Wrong behavior | Understand true/false/null semantics |
| No generated file exclusion | Rules applied to compiled code | Large diffs | Add notPath patterns |
| Missing rule dependencies | Prerequisite rule not enabled | Rule silently disabled | Check PHP-CS-Fixer docs |
| Too many custom rules | 30+ rules on top of preset | Hard to maintain | Limit to strong opinions |

## Examples

```json
{
    "preset": "laravel",
    "rules": {
        "single_quote": true,
        "no_unused_imports": true,
        "ordered_imports": {
            "sort_algorithm": "alpha"
        },
        "concat_space": {
            "spacing": "one"
        },
        "blank_line_before_statement": {
            "statements": ["return", "throw", "continue"]
        }
    }
}
```

## Related Topics

- pint-configuration — pint.json configuration reference
- pint-presets — preset selection and comparison
- coding-standards-documentation — documenting team conventions

## Verification

- [ ] Custom rules produce expected formatting
- [ ] No conflicting rules in configuration
- [ ] Rules documented with rationale
- [ ] Generated files excluded from custom rules
- [ ] All rules valid for installed PHP-CS-Fixer version
