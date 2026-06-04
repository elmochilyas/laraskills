# Skill: Configure OpCache for CLI and Queue Workers

## Purpose

Enable OpCache (`opcache.enable_cli=1`) for long-running CLI scripts, queue workers, and cron jobs that execute the same PHP code repeatedly.

## When To Use

- Queue workers that process thousands of jobs
- Long-running CLI daemons or watchers
- Cron jobs that execute the same script multiple times per day
- Batch processing scripts that iterate over large datasets

## When NOT To Use

- For single-execution CLI scripts (composer commands, artisan make:*, deployment scripts)
- When the CLI script modifies PHP files (code generators, scaffolding tools)
- For development CLI commands where immediate file changes must be visible
- For scripts that run once and exit (compilation overhead never amortizes)

## Prerequisites

- PHP CLI binary access
- Understanding that OpCache on CLI uses process-local memory (not shared across CLI processes)
- Ability to modify CLI php.ini configuration

## Inputs

- CLI php.ini path (usually /etc/php/X.Y/cli/php.ini)
- List of CLI scripts that would benefit from caching
- Current OpCache configuration for CLI

## Workflow (numbered steps)

1. Locate the CLI php.ini: `php -i | grep "Loaded Configuration File"` for the CLI SAPI
2. Enable OpCache for CLI: `opcache.enable=1` and `opcache.enable_cli=1` in the CLI php.ini
3. For long-running workers: also configure JIT with `opcache.jit=1254` and `opcache.jit_buffer_size=128M`
4. Verify OpCache is enabled for CLI: `php -i | grep "opcache.enable"` should show "On"
5. Test a worker or CLI script: execute it and check that OpCache is caching files
6. For queue workers: restart the worker process so it picks up the new configuration
7. Monitor performance: compare job processing time before and after enabling CLI OpCache
8. If CLI scripts modify files (code generation): use `opcache_reset()` or disable OpCache for those specific scripts
9. Document the CLI OpCache configuration

## Validation Checklist

- [ ] CLI php.ini located and modified
- [ ] opcache.enable=1 and opcache.enable_cli=1 set
- [ ] JIT configured for CLI (if applicable)
- [ ] OpCache verified active for CLI
- [ ] Worker/script restart completed
- [ ] Job processing time compared before/after
- [ ] File-modifying scripts handled (reset or excluded)
- [ ] Configuration documented

## Common Failures

- **Enabling CLI OpCache for single-run scripts**: Scripts that run once never benefit — compilation overhead adds to runtime
- **No JIT for CLI workers**: Queue workers are often CPU-bound — JIT provides 61-95% gain that is missed
- **Not restarting workers**: OpCache configuration changes require process restart — running workers continue with old config
- **Stale code in long-running workers**: If worker runs for days without restart, old code serves even after deployment

## Decision Points

- Queue worker (processes 1000+ jobs): enable OpCache + JIT for 2-5x throughput improvement
- Cron job (runs once per hour): moderate benefit — enable OpCache but JIT may not amortize
- CLI script (runs once): skip OpCache — overhead exceeds benefit
- Code generation script: disable OpCache or call opcache_reset() after generation

## Performance Considerations

- CLI OpCache provides the same 2-4x throughput improvement as web OpCache for repeated script execution
- JIT on CLI workers can provide 61-95% improvement for CPU-bound job processing
- Each CLI process has its own OpCache — no cross-process caching like PHP-FPM
- For workers processing 10K+ jobs, OpCache + JIT reduces total CPU time by 50-70%

## Security Considerations

- CLI OpCache caches files in process memory — no shared memory exposure
- Code generation scripts with OpCache enabled may serve stale generated files
- opcache_reset() can be called from CLI to clear the cache if needed

## Related Rules (from 05-rules.md)

- Keep JIT Enabled on Queue and Cron Workers
- Enable OpCache First, Tune Later
- Configure OpCache Before JIT

## Related Skills

- JIT Configuration for Production
- OpCache Overview and Configuration
- OpCache Reset Strategies

## Success Criteria

- CLI OpCache enabled for workers and long-running scripts
- Worker processing throughput improved (measurable)
- File-modifying scripts handled appropriately
- Configuration documented for the team
