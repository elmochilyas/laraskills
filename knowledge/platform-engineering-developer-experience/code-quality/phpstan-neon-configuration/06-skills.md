# Skill: Configure PHPStan NEON Files

## Purpose
Create and manage PHPStan's NEON configuration files with includes hierarchy, parameters, services, and ignored errors for Laravel static analysis.

## When To Use
- Configuring PHPStan analysis scope and rules
- Registering custom PHPStan extensions and rules
- Setting up baseline integration
- Environment-specific config composition

## When NOT To Use
- Basic setups where YAML suffices (no services or entities needed)
- Projects not using PHPStan

## Prerequisites
- PHPStan (Larastan) installed
- Basic understanding of NEON format

## Inputs
- `phpstan.neon` — base configuration
- `phpstan.ci.neon` — CI-specific overrides
- `phpstan.local.neon` — developer-specific overrides (gitignored)

## Workflow

1. **Create Base Config:** Define `phpstan.neon` with `includes:`, `parameters:`, and `services:` sections. Use separate files for baseline (`phpstan-baseline.neon`).

2. **Set Portable Paths:** Use `%rootDir%` and `%currentWorkingDirectory%` constants for paths. Portable paths work across developer machines and CI runners.

3. **Configure Parameters:** Set `level`, `paths`, `excludedPaths`, `memoryLimit`, `bootstrap` files, and `tmpDir` for caching.

4. **Register Services:** Add custom rules and extensions under `services:`. Tag custom rules with `tags: [phpstan.rules.rule]` for proper registration.

5. **Handle Ignored Errors:** Use `parameters.ignoreErrors:` with message pattern + path pattern. Constrain by error count to detect when suppressed errors should be re-examined.

6. **Create Layered Config:** Structure as base + CI + local:
   - `phpstan.neon` — common settings committed to VCS
   - `phpstan.ci.neon` — stricter CI rules, includes base
   - `phpstan.local.neon` — developer overrides, in `.gitignore`

## Validation Checklist

- [ ] Base config includes Larastan extension
- [ ] Baseline is a separate file included via `includes`
- [ ] Paths use `%rootDir%` or `%currentWorkingDirectory%` for portability
- [ ] Custom rules tagged with `phpstan.rules.rule`
- [ ] CI config includes same rules as local
- [ ] Local overrides file is in `.gitignore`
- [ ] Ignored errors have path constraints

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Baseline inline in main config | Can't regenerate cleanly with `--generate-baseline` |
| Hardcoded paths | Config fails on different machines |
| Missing tag on custom rule | Rule not registered; analysis misses checks |
| CI config diverges from local | Different analysis results between environments |

## Decision Points

- **Use NEON over YAML** when registering services, extensions, or using PHP constant resolution
- **Use separate baseline file always** — never inline baseline in main config
- **Single file for simple projects;** includes hierarchy for complex ones

## Performance/Security Considerations

- **Config validation:** PHPStan validates NEON on load; malformed config fails immediately
- **Local overrides:** Keep in `.gitignore` to avoid accidentally committing developer-specific settings
- **Layered config:** Reduces duplication; base config can be shared across projects

## Related Rules

- NEON-RULE-001: Use separate baseline file
- NEON-RULE-002: Layered config
- NEON-RULE-003: Portable paths
- NEON-RULE-004: Tag custom rules properly
- NEON-RULE-005: Separate baseline file

## Related Skills

- Configure PHPStan for Laravel
- Generate and Manage PHPStan Baseline
- Set Up Laravel PHPStan with Larastan

## Success Criteria

- NEON configuration is portable across all developer machines and CI
- Layered config provides environment-specific flexibility
- Custom rules and extensions are registered correctly
- Baseline is managed as a separate file cleanly
