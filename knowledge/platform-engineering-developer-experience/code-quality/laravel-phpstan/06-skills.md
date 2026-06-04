# Skill: Set Up Laravel PHPStan with Larastan

## Purpose
Install and configure Larastan for static analysis of Laravel applications, detecting type errors, undefined methods, missing return types, and incorrect facade calls.

## When To Use
- Every Laravel project for catching type errors before runtime
- CI pipeline as a quality gate before deployment
- Incremental adoption on legacy codebases via baseline
- Critical systems where type safety is paramount

## When NOT To Use
- Prototypes or throwaway code
- Codebases with extensive dynamic/magic behavior that can't be annotated
- Projects not yet ready to invest in type annotations

## Prerequisites
- `phpstan/phpstan` and `larastan/larastan` installed as dev dependencies
- `phpstan.neon` or `phpstan.neon.dist` configuration file
- Model PHPDoc annotations (for accurate Eloquent analysis)

## Inputs
- `phpstan.neon` — main configuration
- Application source code and tests
- Baseline file (for incremental adoption)

## Workflow

1. **Install Dependencies:** Run `composer require --dev phpstan/phpstan larastan/larastan`.

2. **Create Configuration:** Create `phpstan.neon` with `includes: [vendor/larastan/larastan/extension.neon]`, `level: 6`, scan paths (`app/`), and excluded paths (`vendor/`, `storage/`, `bootstrap/cache/`).

3. **Set Memory Limit:** Configure `memoryLimit: 1024M` in the NEON config to prevent out-of-memory crashes on large codebases.

4. **Add Model PHPDoc:** Run `ide-helper:models` to generate `@property` and `@method` annotations. This enables Larastan to understand Eloquent model properties and relationships.

5. **Use Generic Collections:** Replace `@return Collection` with `@return Collection<User>` for accurate type inference on collection operations (`filter()`, `map()`, `first()`).

6. **Generate Baseline (Legacy Projects):** Run `phpstan analyse --generate-baseline` to capture current errors. This enables strict analysis on new code while acknowledging existing issues.

7. **Run in CI:** Execute `phpstan analyse --memory-limit=1G`. Fail CI on new errors by comparing regenerated baseline against committed version.

8. **Lock Larastan Version:** Pin version in `composer.json` to prevent analysis changes from breaking CI unexpectedly.

## Validation Checklist

- [ ] PHPStan (Larastan) runs with level 6 without errors
- [ ] Facade calls (`Cache::get()`, `DB::table()`) analyzed correctly
- [ ] Eloquent model properties and relationships type-checked
- [ ] Generic collections used for type inference
- [ ] Baseline file committed for existing errors
- [ ] CI pipeline runs PHPStan and fails on new errors
- [ ] Memory limit configured (1024M)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| OOM during analysis | Set explicit `--memory-limit=1G` |
| Facade calls flagged as errors | Ensure Larastan extension is included |
| Model properties unknown | Run `ide-helper:models` for PHPDoc annotations |
| Analysis too slow | Enable parallel processing; use result cache |

## Decision Points

- **Level selection:** Level 6 for new projects (catches mixed types); level 9 for critical modules (payment, auth, compliance)
- **Baseline strategy:** Use baseline for existing codebases; no baseline needed for new projects
- **Run order:** After Pint (style), before PHPUnit (tests) — style → analysis → tests

## Performance/Security Considerations

- **Memory:** Allocate 1G minimum for medium Laravel projects; 2G+ for large ones
- **Cache result:** Configure `tmpDir` in config for persistent caching between runs
- **Parallel processing:** Use `phpstan analyse -j 4` on multi-core CI runners

## Related Rules

- PSR-RULE-001: Start at level 6
- PSR-RULE-002: Use baseline for existing code
- PSR-RULE-003: Add PHPDoc to models
- PSR-RULE-004: Use generic collections
- PSR-RULE-005: Run in CI with memory limit

## Related Skills

- Configure PHPStan for Laravel
- Generate PHPStan Baseline
- Integrate Static Analysis in CI

## Success Criteria

- PHPStan runs at level 6 with zero errors on new code
- Facade calls, Eloquent models, and service container resolution are all type-checked
- Legacy code errors are captured in baseline and reduced over time
- CI pipeline catches type errors before deployment
