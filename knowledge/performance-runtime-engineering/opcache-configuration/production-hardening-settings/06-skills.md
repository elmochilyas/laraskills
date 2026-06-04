# Skill: Apply Production-Hardened OpCache Settings

## Purpose

Configure a comprehensive set of OpCache directives for maximum production performance and reliability, including security hardening, memory management, and deployment integration.

## When To Use

- Setting up a new production PHP server
- Auditing and improving an existing production configuration
- Creating a standardized OpCache configuration template for the organization

## When NOT To Use

- For development or staging environments (use relaxed settings for file change visibility)
- When the server has specific constraints (low memory, shared hosting with limited configuration)
- Without understanding each directive's purpose

## Prerequisites

- OpCache enabled and basic configuration understood
- Application file count and memory requirements known
- Deployment pipeline with post-deploy script capability
- PHP-FPM restart capability

## Inputs

- Application file count and type (framework, custom, CMS)
- PHP version
- Server memory and CPU resources
- Deployment frequency and pattern
- Preloading requirements

## Workflow (numbered steps)

1. Set `opcache.enable=1` (foundational — must be On)
2. Set `opcache.memory_consumption=256` (or calculated value for application)
3. Set `opcache.interned_strings_buffer=32` (or calculated value for application)
4. Set `opcache.max_accelerated_files=40000` (or calculated value)
5. Set `opcache.validate_timestamps=0` (eliminate stat() syscalls)
6. Set `opcache.revalidate_freq=0` (no periodic revalidation)
7. Set `opcache.fast_shutdown=1` (cleanup optimization)
8. Set `opcache.enable_cli=0` (disable CLI caching unless specifically needed)
9. If preloading is used: configure `opcache.preload` and `opcache.preload_user`
10. Set `opcache.error_log=<path>` for OpCache-specific error logging
11. Configure `opcache.file_cache=<path>` for containers (optional, see file cache skill)
12. Restart PHP-FPM and verify all settings are applied via `opcache_get_configuration()`
13. Document the complete configuration with rationale for each setting

## Validation Checklist

- [ ] All recommended directives set (enable, memory, interned strings, max files, validate_timestamps, fast_shutdown)
- [ ] Values calculated for application size and type
- [ ] Deployment pipeline includes opcache_reset()
- [ ] Preloading configured (if applicable)
- [ ] File cache configured for containers (if applicable)
- [ ] PHP-FPM restarted and configuration verified
- [ ] Hit rate >99% after warm-up
- [ ] Complete configuration documented

## Common Failures

- **Copying settings without understanding**: Each directive has a trade-off — understand before applying
- **Forgetting deployment automation**: validate_timestamps=0 without opcache_reset() in deploy pipeline
- **Not separating CLI configuration**: CLI scripts may need different settings (enable_cli)
- **Missing error_log configuration**: OpCache errors go to PHP-FPM error log by default — separate logging aids troubleshooting

## Decision Points

- Framework app: 256MB+ memory, 40000+ max files, preloading recommended
- CMS (WordPress): 128MB memory, 10000 max files, preloading optional
- Custom app: calculate based on file count
- Container: add file_cache with persistent volume
- Single-server: validate_timestamps=0 with opcache_reset() in deploy script

## Performance Considerations

- Each directive contributes to overall OpCache performance:
  - memory_consumption: prevents eviction
  - validate_timestamps=0: saves 1-3% CPU
  - fast_shutdown: reduces request cleanup time by 5-15%
  - preloading: reduces autoloading by 1-3ms per request
  - file_cache: reduces cold-start latency by 50-70% in containers

## Security Considerations

- validate_timestamps=0: stale code serves until manual reset — ensure deployment automation
- file_cache directory: must not be publicly accessible
- preload_user: restrict to PHP-FPM user
- error_log: protect from public access
- enable_cli: only enable if needed — unnecessary exposure in CLI

## Related Rules (from 05-rules.md)

- Enable OpCache First, Tune Later
- Never Use validate_timestamps=1 in Production
- Automate opcache_reset() in Every Deployment Pipeline
- Set opcache.preload_user for Security
- Enable File Cache for Container Deployments

## Related Skills

- OpCache Memory Sizing
- OpCache Max Accelerated Files Calculation
- Preloading Script Design Patterns
- OpCache Monitoring and Hit Rate Analysis

## Success Criteria

- Complete production OpCache configuration applied and documented
- All values calculated for the specific application
- Deployment automation includes cache invalidation
- Hit rate >99% after warm-up
- No errors in OpCache error log
- Configuration template created for future deployments
