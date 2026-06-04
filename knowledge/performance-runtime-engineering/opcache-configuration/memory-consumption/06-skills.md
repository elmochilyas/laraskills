# Skill: Size OpCache Memory Consumption for an Application

## Purpose

Calculate and configure `opcache.memory_consumption` to prevent cache eviction and maintain >99% hit rate.

## When To Use

- Initial OpCache tuning after enabling
- Hit rate is below 99% or cache_full is true
- After adding significant new code (package upgrades, new features)

## When NOT To Use

- When OpCache is not enabled (enable first)
- When hit rate is >99% and free memory >20% (adequate sizing)
- For development environments where OpCache may be disabled

## Prerequisites

- OpCache enabled and hit rate <99% or cache_full=true
- PHP file count and average compiled file size data
- Access to `opcache_get_status()` metrics

## Inputs

- Current memory_consumption value
- Application PHP file count
- OpCache memory usage from `opcache_get_status()['memory_usage']`
- cache_full indicator status

## Workflow (numbered steps)

1. Count PHP files in the application: `Get-ChildItem -Recurse -Filter *.php | Measure-Object | Select-Object Count`
2. Estimate average compiled opcode size: 8-15KB per file for framework applications, 4-8KB for simpler applications
3. Calculate initial sizing: file_count × avg_compiled_size / 0.8 (20% headroom)
4. For Laravel/Symfony (15K-30K files): start at 256MB
5. For WordPress/Magento (5K-15K files): start at 128MB
6. For small applications (<5K files): 64-128MB is sufficient
7. Set `opcache.memory_consumption=<value>` in php.ini and restart PHP-FPM
8. After cache warms, check `opcache_get_status()['memory_usage']['free_memory']` — should be >20% of total
9. If free <20%, increase memory_consumption by 50% and repeat
10. Set up monthly monitoring of memory usage to catch growth over time

## Validation Checklist

- [ ] PHP file count documented
- [ ] Initial memory_consumption calculated using formula
- [ ] Value set in php.ini and PHP-FPM restarted
- [ ] Free memory verified >20% of total after warm-up
- [ ] cache_full = false confirmed
- [ ] Hit rate >99% confirmed
- [ ] Monthly monitoring configured

## Common Failures

- **Using default 128MB for framework apps**: Laravel/Symfony typically need 256MB+ — default causes cache_full
- **Over-allocating memory**: Setting 4GB for a small WordPress site wastes RAM that could be used by PHP workers
- **Not monitoring growth**: Application file count increases over time — a correct size today may be undersized in 6 months
- **Forgetting interned_strings_buffer**: String deduplication uses separate memory — size alongside memory_consumption

## Decision Points

- If file count >20000: start at 512MB
- If file count 10000-20000: start at 256MB
- If file count 5000-10000: start at 128MB
- If file count <5000: start at 64-128MB
- If cache_full = true after warm-up: increase by 50%

## Performance Considerations

- Undersized memory causes cache eviction and recompilation, increasing CPU by 50%+
- OpCache memory is pre-allocated at PHP-FPM startup and never released
- Shared memory is not duplicated across workers — one pool for all workers
- Setting memory too high wastes virtual memory but does not hurt performance (unused pages are not resident)

## Security Considerations

- OpCache shared memory is potentially readable by other processes on multi-tenant servers
- No direct security impact from memory sizing decisions

## Related Rules (from 05-rules.md)

- Size memory_consumption to Your Application, Never Use Defaults
- Monitor free_memory Weekly — Never Set-and-Forget
- Never Set memory_consumption to Max Available RAM

## Related Skills

- OpCache Max Accelerated Files Calculation
- OpCache Interned Strings Configuration
- OpCache Monitoring and Hit Rate Analysis

## Success Criteria

- memory_consumption sized to application: free memory >20% after warm-up
- cache_full = false
- Hit rate >99%
- Monthly monitoring in place to detect growth
