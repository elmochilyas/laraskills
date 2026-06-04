# Skill: Configure PHPStan for Laravel

## Purpose
Create a production-grade `phpstan.neon` configuration for Laravel applications using Larastan extensions, with appropriate level selection, path exclusions, memory limits, and baseline integration.

## When To Use
- Every Laravel project for static analysis configuration
- Setting up Larastan for the first time on a project
- Configuring CI-specific analysis settings

## When NOT To Use
- Simple projects not using PHPStan yet
- Projects using alternative static analysis tools (Psalm)

## Prerequisites
- `phpstan/phpstan` and `larastan/larastan` installed as dev dependencies
- Basic familiarity with NEON configuration format

## Inputs
- `phpstan.neon` — main configuration file
- `phpstan.ci.neon` — CI-specific configuration (optional)
- `phpstan-baseline.neon` — baseline file for existing errors

## Workflow

1. **Create Base Config:** Create `phpstan.neon` with `includes: [vendor/larastan/larastan/extension.neon]`, `level: 6`, scan paths (`app/`), and excluded paths (`vendor/`, `storage/`, `bootstrap/cache/`).

2. **Set Memory and Parallelism:** Configure `parameters.memoryLimit: 1024M` and `parameters.parallel.maxNumberOfProcesses: 4` for reliable execution on CI runners.

3. **Add Baseline Include:** Add `includes: [phpstan-baseline.neon]` to integrate the baseline. Use a separate baseline file for clean management and regeneration.

4. **Create Bootstrap File (Legacy Code):** Create `phpstan-bootstrap.php` that defines constants and global functions that predate autoloading in legacy codebases.

5. **Create CI Config (Optional):** For stricter CI enforcement, create `phpstan.ci.neon` that includes the base config and adds stricter rules or higher level.

6. **Add Stub Files:** For facades or macros PHPStan can't analyze, create stub files with `@method` annotations and include them in config under `stubFiles:`.

7. **Configure Ignored Errors:** Use `parameters.ignoreErrors:` for specific false positives that can't be fixed differently. Use regex patterns with file path constraints.

## Validation Checklist

- [ ] `phpstan.neon` includes Larastan extension
- [ ] Level set to 6 (or appropriate for project maturity)
- [ ] Vendor, storage, bootstrap/cache excluded
- [ ] Memory limit configured (1024M)
- [ ] Baseline file included as separate file
- [ ] CI config includes same rules as local
- [ ] Scan paths cover app/ and tests/ directories

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Missing Larastan extension | Facade calls flagged as errors |
| Level too strict for legacy code | Generation overwhelming baseline; start lower |
| No memory limit | OOM on large codebases |
| Missing path exclusion | Analyzing vendor files slows everything down |

## Decision Points

- **Level 6 for new projects;** level 9 for critical modules (payment, auth, compliance)
- **Separate CI config:** `phpstan.ci.neon` with stricter settings for pipeline
- **Exclude test files from strict rules** or use per-directory level configs
- **Local overrides** in `.gitignore`d `phpstan.local.neon`

## Performance/Security Considerations

- **Memory:** 1G minimum for medium projects; 2G+ for large codebases
- **Parallel processing:** Enable with `-j 4` or `--no-progress` for CI
- **Result caching:** Configure `tmpDir: /tmp/phpstan` for persistent caching between runs

## Related Rules

- PSCONF-RULE-001: Minimum level 6
- PSCONF-RULE-002: Exclude vendor and storage
- PSCONF-RULE-003: Set explicit memory limit
- PSCONF-RULE-004: Use separate baseline file
- PSCONF-RULE-006: Separate CI config

## Related Skills

- Set Up Laravel PHPStan with Larastan
- Generate and Manage PHPStan Baseline
- Configure PHPStan NEON Files

## Success Criteria

- PHPStan runs reliably on every developer machine and CI
- Facade calls, Eloquent models, and service container are all analyzed correctly
- Baseline enables incremental adoption on existing code
- CI and local configurations are consistent
