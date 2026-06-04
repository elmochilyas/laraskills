# Production Hardening - validate_timestamps=0, revalidate_freq, Time Validation Interaction

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | Production Hardening - validate_timestamps=0, revalidate_freq, Time Validation Interaction |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

The single most impactful production OpCache setting is opcache.validate_timestamps=0. This eliminates the stat() syscall per file per request - potentially thousands of syscalls per request. Combined with conservative revalidate_freq (or 0 when timestamps are disabled), this yields 1-3% additional throughput and significantly reduces CPU syscall overhead.

## Core Concepts

- validate_timestamps=0: Never check file modification times. Code changes only take effect after PHP-FPM restart or opcache_reset(). Required for maximum production performance.
- validate_timestamps=1 (default): Check file mtime on every request (or every revalidate_freq seconds). Adds stat() syscall per file.
- revalidate_freq: Ignored when validate_timestamps=0. When enabled, controls how often (seconds) timestamps are checked.
- revalidate_path: Check file path changes. Usually disabled (0) in production.

## When To Use

- All production environments.
- When maximum performance is required.

## When NOT To Use

- Development environments where file changes need immediate visibility.
- Deployments without automated OpCache reset in the deployment pipeline.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Set validate_timestamps=0 in production | Eliminates 200-2000 stat() syscalls per request. |
| Implement opcache_reset() in deployment script | Required when validate_timestamps=0 - code changes need explicit cache reset. |
| Keep revalidate_freq=0 when validate_timestamps=0 | Setting is ignored but documents intent. |

## Architecture Guidelines

- validate_timestamps=0 saves ~200-2000 stat() syscalls per request depending on file count.
- Syscall overhead varies by OS/filesystem: Linux ext4 ~2-5us per stat().
- For busy servers (500 req/s, 500 files each): 250,000 stat() calls per second eliminated.

## Performance Considerations

- On a busy server: 250,000 stat() calls per second eliminated.
- Per-request savings: 0.5-2.5ms per request.
- 1-3% total throughput improvement typical.

## Security Considerations

- No direct security implications.
- With validate_timestamps=0, ensure deployment pipeline includes OpCache reset.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| validate_timestamps=1 in production | Every request incurs stat() overhead for cached files. | 1-3% throughput loss, wasted CPU. | Set validate_timestamps=0. |

## Anti-Patterns

- Using validate_timestamps=1 with revalidate_freq=0: Checks every time, maximum overhead.
- Setting validate_timestamps=0 without deployment automation: Code changes don't take effect.

## Examples

```ini
# Production hardened php.ini
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=32
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.revalidate_freq=0
opcache.revalidate_path=0
opcache.save_comments=1
opcache.fast_shutdown=1
```

## Related Topics

- OpCache Purpose and Mechanics
- OpCache Lifecycle and Invalidation
- Deployment Cache Invalidation Strategies

## AI Agent Notes

- validate_timestamps=0 is the single most impactful production setting after enabling OpCache itself.
- It requires a deployment pipeline that calls opcache_reset(). Without this, code changes are invisible.
- The 1-3% throughput gain is the floor - at scale, eliminating 250K stat() calls/second adds up.
- For PaaS environments (Forge, Vapor, Cloud), validate_timestamps=0 may be pre-configured.

## Verification

- [ ] Set opcache.validate_timestamps=0 in production php.ini.
- [ ] Implement opcache_reset() in deployment script.
- [ ] Verify code changes take effect only after deployment (not on file edit).
- [ ] Monitor no increase in 500 errors after deployments.
- [ ] Benchmark CPU syscall overhead before/after.