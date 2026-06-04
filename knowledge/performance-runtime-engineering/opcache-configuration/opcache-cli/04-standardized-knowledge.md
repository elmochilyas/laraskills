# OpCache CLI — opcache.enable_cli, CLI Script Performance, Best Practices

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache CLI — opcache.enable_cli, CLI Script Performance, Best Practices |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

`opcache.enable_cli` controls whether OpCache is enabled for PHP CLI scripts. By default, OpCache is disabled for CLI because CLI scripts are typically short-lived and OpCache's shared memory provides no benefit for single-execution scripts. However, for long-running CLI daemons (queue workers, Octane workers, Swoole servers), enabling OpCache for CLI can significantly improve performance. Additionally, CLI is the primary interface for OpCache management commands (`opcache_reset()`, `opcache_compile_file()`, `opcache_get_status()`) used in deployment scripts and monitoring.

## Core Concepts

- **opcache.enable_cli=0 (default)**: OpCache is disabled for CLI SAPI. Each CLI execution compiles files from scratch. Appropriate for short-lived scripts (cron jobs, one-off commands).
- **opcache.enable_cli=1**: OpCache is enabled for CLI scripts. Files are cached in shared memory, benefiting long-running processes. The OpCache persists across requests within the same process lifetime.
- **CLI script lifetime**: Most CLI scripts are short-lived (seconds to minutes). OpCache overhead (shared memory allocation) exceeds the benefit for scripts that run once and exit.
- **Long-running CLI processes**: Queue workers, Octane workers, Swoole servers, FrankenPHP workers — these processes run for hours or days. OpCache dramatically improves their performance by eliminating recompilation.
- **OpCache management via CLI**: `php -r 'opcache_reset();'` is the standard way to clear the cache from deployment scripts. `opcache_get_status()` and `opcache_get_configuration()` are also accessed via CLI.
- **CLI preloading**: `opcache.preload` works with CLI when `opcache.enable_cli=1`. Preloading at PHP startup (for long-running daemons) gives them the same cold-start benefit as PHP-FPM workers.

## When To Use

- You are running long-lived PHP CLI processes (queue workers, Octane, Swoole, FrankenPHP).
- You need to call `opcache_reset()` or `opcache_get_status()` from CLI deployment scripts.
- You are running PHP-PM or other persistent PHP process managers.
- You are benchmarking PHP CLI performance and want accurate measurements.
- You are running continuous integration tests that benefit from faster execution.

## When NOT To Use

- You run standard cron jobs or one-off CLI scripts — the overhead of shared memory setup exceeds the benefit.
- Your CLI scripts run for <1 second — OpCache provides no meaningful gain.
- You are running in development — OpCache's caching behavior can mask code changes.
- You are running CLI scripts that modify source files and expect changes to take effect immediately.
- You don't have persistent or frequently-executed CLI processes.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Enable OpCache for long-running CLI daemons | Queue workers and Octane servers benefit from OpCache just like web workers. Saves 50–75% CPU on file compilation. |
| Keep OpCache disabled for short-lived CLI scripts | The shared memory setup cost (or lack thereof) is negligible. Single-execution scripts don't benefit from caching. |
| Use `php -r 'opcache_reset();'` in deployment scripts | CLI `opcache_reset()` clears the shared memory cache that web workers use. Must run on the same server as PHP-FPM. |
| Use `opcache_compile_file()` in CLI preloading scripts | Compile files without executing them. Essential for building preload scripts. |
| Disable OpCache for CI scripts that test code changes | If CI modifies files and then tests them, OpCache may serve stale opcodes. Disable or call `opcache_reset()` between steps. |
| Combine with JIT for CPU-intensive CLI tasks | JIT provides significant speedup for CPU-bound CLI scripts (data processing, report generation). Requires OpCache. |
| Monitor OpCache CLI process memory | Long-running CLI processes with OpCache enabled may accumulate memory. Monitor RSS and restart periodically. |

## Architecture Guidelines

- **CLI shared memory access**: When `opcache.enable_cli=1`, CLI scripts access the same shared memory segment as PHP-FPM workers. `opcache_reset()` from CLI clears the cache for ALL processes.
- **CLI preloading**: Preloading works the same as for PHP-FPM — a preload script is executed at PHP startup, caching files in shared memory. The preloaded files benefit all subsequent CLI and FPM executions.
- **Memory persistence**: OpCache shared memory persists across separate CLI invocations. When the first CLI script enables OpCache, the shared memory segment is created. Subsequent CLI scripts reuse it. The segment persists after CLI scripts exit (until PHP-FPM restart).
- **Process isolation**: Each CLI process has its own execution context. OpCache caches compiled opcodes in shared memory, but each process has its own variable scope, heap, and state. OpCache only caches the compiled code, not execution state.
- **CLI file cache**: When `opcache.file_cache` is enabled, CLI scripts can also benefit from file-backed caching. This is especially useful for frequently-executed CLI commands in containerized environments.

## Performance Considerations

- CLI OpCache benefit: For a queue worker processing 10,000 jobs, OpCache saves ~50–75% CPU time that would otherwise be spent recompiling PHP files for each job.
- CLI OpCache overhead: ~1–5ms for initial shared memory attachment (one-time cost per CLI invocation).
- Preloading benefit for CLI: Preloaded CLI daemons start faster (no cold-start compilation). Reduces startup time by 500ms–5s.
- Memory cost: OpCache shared memory is allocated regardless of whether CLI or FPM uses it. If only CLI uses OpCache, the memory is dedicated to CLI.
- `opcache_reset()` in deployment: The reset call takes <1ms. The cost is the subsequent recompilation of files on next access (paid by the first process that accesses each file).

## Security Considerations

- CLI reset access: Any user who can execute PHP CLI can call `opcache_reset()`. In shared hosting environments, ensure that only authorized users have CLI PHP access.
- Shared memory access across users: All PHP processes (CLI and FPM) share the same OpCache memory. A CLI script running as one user can affect the FPM cache used by another user. This is a security and isolation concern on multi-tenant systems.
- Preloading from CLI: Preloading scripts execute with the privileges of the user running the CLI command. Ensure the preload script and its files are properly permissioned.
- Just-in-time compilation exposure: OpCache debug information can reveal filesystem paths. Control access to CLI output.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Enabling OpCache for all CLI scripts | Applies caching overhead to scripts that run once. | Not thinking about script lifetime. | Slightly slower one-off scripts, wasted shared memory. | Only enable for long-running daemons, not one-off commands. |
| Not enabling OpCache for long-running CLI daemons | Queue workers recompile files for every job. | Leaving `opcache.enable_cli=0` by default. | 50–75% CPU wasted on recompilation in queue workers. | Enable for long-running processes. |
| Running `opcache_reset()` from CLI on a different server | `opcache_reset()` only clears the cache on the server where it runs. | Assuming CLI reset is global. | Cache is not cleared on the web server. Remotely-deployed clear has no effect. | Run reset on each web server individually. |
| Using CLI OpCache in development | Code changes don't take effect because old opcodes are cached. | Forgetting to call `opcache_reset()` after changes. | Mysterious "code not working" bugs. | Disable OpCache for CLI in development, or always call `opcache_reset()`. |
| Not considering CLI OpCache memory in capacity planning | 256MB shared memory for OpCache is consumed even if only CLI uses it. | Only accounting for FPM memory needs. | RAM unexpectedly consumed by CLI OpCache. | Include OpCache shared memory in total memory calculations. |

## Anti-Patterns

- **Calling `opcache_reset()` on every CLI invocation**: Reset is destructive — it clears the cache for all processes. Calling it frequently defeats the purpose of caching. Only reset during deployments.
- **Running deployment scripts that call `opcache_reset()` without verifying**: If the reset call fails silently (e.g., PHP not found, script error), the cache is not cleared. Always verify.
- **Enabling preloading for CLI on shared hosting**: Preloading can conflict with FPM preloading. Use separate configurations.
- **Using OpCache to "speed up" `composer install`**: Composer operations are disk/network bound, not CPU bound. OpCache provides no meaningful benefit.

## Examples

```bash
# Enable OpCache for CLI daemons
php -d opcache.enable_cli=1 artisan queue:work

# Call opcache_reset() from deployment script
php -r 'opcache_reset(); echo "OpCache cleared\n";'

# Check OpCache status from CLI
php -r 'print_r(opcache_get_status(false));'

# Preload for CLI daemon
php -d opcache.preload=/var/www/html/preload.php artisan queue:work
```

```ini
; php.ini — CLI-specific configuration (separate php-cli.ini or -d flags)
; For long-running queue workers
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0

; For standard CLI scripts (default — disabled)
; opcache.enable_cli=0
```

## Related Topics

- OpCache Overview — Purpose and Mechanics
- OpCache Preloading and Warmup
- OpCache File Cache Secondary Storage
- Octane Architecture and Execution Model
- Queue Worker Configuration

## AI Agent Notes

- The default `opcache.enable_cli=0` is correct for 90% of CLI usage. Only enable for long-running daemons that will process thousands of requests (queue workers, Octane).
- The most impactful CLI OpCache configuration is enabling it for Laravel Horizon/queue workers. A queue worker processing 10K jobs with OpCache uses ~50% less CPU.
- `opcache_reset()` from CLI is the standard deployment tool. Always include it in deployment scripts. Test that it works from your deployment environment.
- In containerized environments, CLI OpCache is less relevant because containers are ephemeral. Focus on OpCache for the main FPM process.

## Verification

- [ ] Verify `opcache.enable_cli` is enabled for long-running daemons.
- [ ] Benchmark queue worker CPU usage with and without OpCache.
- [ ] Test `php -r 'opcache_reset();'` works in the deployment environment.
- [ ] Verify CLI `opcache_reset()` affects web workers (same server).
- [ ] Test `php -r 'print_r(opcache_get_status(false));'` for monitoring scripts.
- [ ] Document the CLI OpCache configuration and usage patterns.
