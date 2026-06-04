# Skill: Diagnose and Resolve OpCache Errors

## Purpose

Identify common OpCache errors (cache full, memory allocation failures, blacklist issues) and resolve them systematically.

## When To Use

- Error logs show OpCache-related errors or warnings
- OpCache hit rate suddenly drops or cache_full becomes true
- Application behaves differently after OpCache configuration changes
- After a PHP-FPM restart, errors appear related to shared memory

## When NOT To Use

- When errors are unrelated to OpCache (check error message source first)
- For routine OpCache monitoring without errors present
- When the error is from a PHP extension, not OpCache

## Prerequisites

- PHP error logging enabled
- Access to `opcache_get_status()` and `opcache_get_configuration()`
- PHP-FPM error log access

## Inputs

- PHP error log entries containing "opcache" or "Opcache"
- Current OpCache configuration
- OpCache status metrics (hit rate, cache_full, memory usage)

## Workflow (numbered steps)

1. Check PHP-FPM error log for OpCache errors: grep for "opcache" or "Opcache" keywords
2. If error is "Unable to allocate shared memory segment": increase `opcache.memory_consumption` or reduce other shared memory usage
3. If error is "cache_full" or "Cache is full": increase `opcache.memory_consumption` by 50%
4. If error mentions "file_cache": check that the file cache directory exists and is writeable by PHP-FPM
5. If error is "blacklist file not found": verify `opcache.blacklist_filename` path exists and is readable
6. If error is "Interned strings buffer overflow": increase `opcache.interned_strings_buffer`
7. If error occurs only on CLI: ensure `opcache.enable_cli=1` if CLI caching is intended, or disable it if not needed
8. After fixing the configuration, restart PHP-FPM and verify the error is resolved
9. Monitor for 24 hours to ensure the fix is stable
10. Document the error, root cause, and resolution

## Validation Checklist

- [ ] Error identified from logs
- [ ] Root cause determined
- [ ] Configuration fix applied
- [ ] PHP-FPM restarted
- [ ] Error no longer present in logs
- [ ] Hit rate and cache_full monitored for 24 hours
- [ ] Resolution documented

## Common Failures

- **Ignoring cache_full warnings**: cache_full=true means eviction is happening — CPU increases as files are recompiled
- **Restarting without fixing configuration**: Error returns after next cache population
- **Misattributing shared memory errors**: "Unable to allocate" may be from Apache/PostgreSQL, not OpCache — check the source
- **Not checking file cache permissions**: File cache errors often caused by write permission issues

## Decision Points

- Shared memory allocation failure: increase `kernel.shmmax` and `kernel.shmall` sysctl values, or increase OpCache memory
- Cache full indicator: increase memory_consumption (likely cause) or max_accelerated_files
- File cache error: check directory exists, permissions, and disk space
- Interned strings buffer overflow: increase interned_strings_buffer

## Performance Considerations

- OpCache errors usually manifest as performance degradation (recompilation, missed cache hits)
- A single error (cache full) can reduce throughput by 50%+ due to continuous eviction/recompilation
- File cache errors cause the file cache to be non-functional — no cold-start benefit
- Most OpCache errors are non-fatal — the application continues running with degraded performance

## Security Considerations

- OpCache errors do not typically cause security vulnerabilities
- Shared memory allocation failures are resource issues, not security issues
- File cache permission errors may expose opcode data if permissions are too loose
- Document all errors and resolutions for future troubleshooting

## Related Rules (from 05-rules.md)

- Monitor cache_full and Hit Rate Metrics
- Automate opcache_reset() in Every Deployment Pipeline
- Size memory_consumption to Your Application

## Related Skills

- OpCache Monitoring and Hit Rate Analysis
- OpCache Memory Sizing
- OpCache Overview and Configuration

## Success Criteria

- Error resolved with no recurrence for 24 hours
- Root cause documented
- Configuration fix applied and verified
- Monitoring in place to detect future errors
