# 04-Standardized Knowledge: PHPStan NEON Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | phpstan-neon-configuration |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | phpstan-config-for-laravel, phpstan-baseline-patterns, laravel-phpstan |
| **Framework/Language** | PHPStan, NEON, PHP |

## Overview

NEON is PHPStan's native config format, extending YAML with PHP-specific features: PHP constant resolution, entity constructors, autowired service registration, and hierarchical includes. NEON files define analysis scope, rules, extensions, parameters, and baseline. Includes merge multiple config files. Parameters set application/extension settings. Services register extensions with autowired DI. IgnoredErrors suppress specific errors.

## Core Concepts

- **NEON Format**: YAML-like with entities, PHP constant resolution, inline expressions
- **Parameters Section**: level, paths, excludedPaths, bootstrap, customRules
- **Services Section**: registers extensions, rules, type mappings with autowired DI
- **Includes**: merges external config files (vendor configs, baseline, custom rulesets)
- **Ignored Errors**: regex suppression with file path and error count constraints

## When to Use

- Configuring PHPStan analysis scope and rules
- Registering custom PHPStan extensions and rules
- Setting up baseline integration
- Environment-specific config composition

## When NOT to Use

- Basic setups where YAML suffices (no services or entities needed)
- Projects not using PHPStan

## Best Practices (WHY)

- **Use separate baseline file**: `includes: [phpstan-baseline.neon]` avoids inline mess
- **Layered config**: base + CI + local (gitignored) for environment flexibility
- **Portable paths**: use `%rootDir%`, `%currentWorkingDirectory%` constants
- **Tag custom rules properly**: `tags: [phpstan.rules.rule]` for proper registration
- **Use separate baseline file**: enables clean regeneration with `--generate-baseline`

## Architecture Guidelines

- Single file for simple projects; includes hierarchy for complex ones
- Baseline as separate file managed by `--generate-baseline`
- Local overrides in `.gitignore`d `phpstan.local.neon`
- CI config should include the same rules as local

## Performance Considerations

- Config parsing: <10ms for typical configs
- Baseline file: 5000+ entries add 50-100ms parsing (one-time cost)
- Service registration: 1ms per extension; fine up to ~100

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| YAML-style comments in arrays | `#` inside inline values | Parse error | Place comments at line start |
| Incorrect include paths | Absolute paths that don't work on other machines | Config fails | Use relative paths or NEON constants |
| Missing service tags | Extension loaded but not registered | Silent failure | Add `tags` array to service registration |
| Baseline in main config | Hard to regenerate | Stale baseline | Use separate baseline file |
| Circular includes | A → B → A | Infinite recursion | Check include graph |

## Examples

```neon
includes:
    - vendor/larastan/larastan/extension.neon
    - phpstan-baseline.neon

parameters:
    level: 6
    paths:
        - app/
    excludedPaths:
        - vendor/
    memoryLimit: 1G

services:
    -
        class: App\Phpstan\MyCustomRule
        tags:
            - phpstan.rules.rule
```

## Related Topics

- phpstan-config-for-laravel — Laravel-specific configuration
- phpstan-baseline-patterns — baseline management
- laravel-phpstan — Larastan overview

## Verification

- [ ] NEON syntax validates with `phpstan --configuration`
- [ ] Includes reference correct vendor paths
- [ ] Services tagged correctly for extension registration
- [ ] Baseline in separate file, not inline
- [ ] No circular includes
- [ ] Portable paths (no absolute machine-specific paths)
