# Skill: Configure PHP Memory Limits for Different Workloads

## Purpose

Set `memory_limit` appropriately for web requests, CLI scripts, queue workers, and long-running processes based on workload requirements.

## When To Use

- Initial PHP server configuration
- Tuning memory for specific workloads (API, batch processing, web)
- Debugging out-of-memory errors
- Capacity planning for Octane/Swoole worker memory

## When NOT To Use

- When OOM errors are from external processes (database, web server), not PHP
- For development environments where limits can be generous
- Without understanding the workload's peak memory requirement

## Prerequisites

- Profiling data showing peak memory usage per request
- Understanding of the workload type (web, CLI, queue, daemon)
- Access to php.ini or runtime configuration

## Inputs

- Current memory_limit value
- Peak memory usage from `memory_get_usage(true)` across endpoints/scripts
- Number of PHP-FPM workers or Octane workers
- Total server RAM and other process requirements

## Workflow (numbered steps)

1. Profile all critical endpoints/scripts: capture `memory_get_usage(true)` at peak usage
2. Identify the highest-memory endpoint and note its peak usage
3. For web requests: set `memory_limit = peak_usage * 1.5` (50% headroom)
4. For API endpoints (typically lower memory): use the same calculation but expect lower values
5. For CLI scripts: set individually per script or use a higher global value
6. For queue workers: set to handle the largest job + 50% headroom
7. For Octane/Swoole workers: calculate per-worker limit = total_RAM / worker_count — they are persistent across requests
8. Set the limit in php.ini or via `ini_set('memory_limit', '256M')` in specific scripts
9. Monitor OOM errors after configuration change — adjust if errors persist
10. Document the memory limit configuration per SAPI (web, CLI, phpdbg)

## Validation Checklist

- [ ] Peak memory usage measured for all critical endpoints
- [ ] memory_limit calculated with 50% headroom
- [ ] memory_limit configured per SAPI (web, CLI) if they differ
- [ ] Octane worker memory calculated from total RAM / worker count
- [ ] OOM errors eliminated after configuration
- [ ] Configuration documented

## Common Failures

- **Setting memory_limit too low**: 128M is insufficient for framework applications — causes random OOM errors
- **Using the same limit for web and CLI**: CLI scripts (migrations, imports) often need more memory than web requests
- **Not accounting for Octane persistence**: Workers accumulate memory across requests — limit must account for peak accumulated usage
- **Setting unlimited (-1)**: Risks server OOM if a script has a memory leak — always set a finite limit

## Decision Points

- Web request (Laravel/Symfony): 256MB
- Web request (WordPress): 128MB
- API endpoint: 128-256MB
- CLI script (migration/import): 512MB-1GB
- Queue worker: 512MB (or per largest job)
- Octane worker: total_RAM / worker_count - overhead_for_OS_and_services

## Performance Considerations

- memory_limit is a hard cap — hitting it causes a fatal error
- memory_get_usage(true) reports the actual allocated memory (may be higher than used)
- Octane workers with 500MB+ per worker may require 16GB+ server RAM for reasonable worker counts
- Setting memory too high risks OOM kills — setting too low causes random failures

## Security Considerations

- memory_limit prevents runaway scripts from exhausting server resources
- Octane workers with high limits can cause OOM in other containers/services
- CLI scripts with unlimited memory (-1) are a security risk — always set a finite limit
- OOM errors can be exploited for denial of service — ensure limits are appropriate

## Related Rules (from 05-rules.md)

- Set memory_limit Per SAPI, Not Globally
- Calculate Octane Worker Memory From Total RAM
- Never Set memory_limit to -1 in Production

## Related Skills

- PHP Memory Model
- Memory Leak Detection Patterns
- Octane Worker Configuration

## Success Criteria

- memory_limit configured per workload type
- No OOM errors in production
- Octane worker memory calculated correctly
- Headroom maintained for peak usage
- Configuration documented per SAPI
