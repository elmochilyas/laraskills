# Standardized Knowledge: validate_timestamps=0 Tradeoff

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | validate_timestamps=0 Tradeoff |
| Difficulty | Foundation |
| Lifecycle | Configure, Deploy |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

opcache.validate_timestamps=0 is the highest-ROI production OpCache setting. It eliminates the stat() syscall per cached file per request — thousands of syscalls saved per request. The tradeoff: code changes only take effect after explicit cache invalidation (PHP-FPM restart or opcache_reset()). For production deployments with controlled rollouts, this tradeoff is overwhelmingly positive.

## Core Concepts

- **With validate_timestamps=1 (default)**: Every request, PHP calls stat() on every cached file to check modification time. A 500-file request = 500 stat() syscalls. Each stat() costs ~2-5µs = 1-2.5ms per request. At 500 RPS: 250,000 stat() calls/second.
- **With validate_timestamps=0**: Zero stat() calls for cached files. The 1-2.5ms per request overhead is eliminated. Must explicitly invalidate OpCache after deployment.
- **revalidate_freq Interaction**: Controls how often timestamps are checked when validate_timestamps=1. Ignored when validate_timestamps=0. Even with revalidate_freq=60, stat() overhead is significant for large file sets.

## When To Use

- All production environments (highest ROI single performance setting)
- Deployments with automated cache invalidation in CI/CD pipeline
- Systems with controlled deployment processes (staged rollouts, blue-green)

## When NOT To Use

- Development environments (code changes must appear immediately)
- Shared hosting without control over deployment automation
- Systems where file modification times are the only cache invalidation mechanism
- Applications under active development without deployment pipelines

## Best Practices

- **Always set validate_timestamps=0 in production**: The performance gain (1-2.5ms per request) is immediate and code-free. This is the single highest-ROI OpCache tuning.
- **Keep validate_timestamps=1 in development**: Code changes must appear without manual intervention. Use revalidate_freq=0 for immediate detection.
- **Automate cache invalidation**: Integrate opcache_reset() or cachetool into deployment pipeline. Never rely on manual invalidation.
- **Combine with preloading for maximum gain**: validate_timestamps=0 + preloading eliminates stat() for both cold and warm requests.
- **Document the tradeoff**: Ensure all developers understand that code changes require explicit invalidation in production.

## Architecture Guidelines

- **Per-Request Savings Breakdown**: 500 files × 2µs per stat() = 1ms saved per request. At 1000 RPS: 1 second of CPU saved per second. This scales linearly with file count and request rate.
- **stat() Cache Interaction**: Even with stat() caching in the OS (dentries), validate_timestamps=1 calls stat() because OpCache checks the PHP stat cache, not the OS cache. validate_timestamps=0 bypasses both.
- **Development vs Production Split**: Configure validate_timestamps via environment-specific php.ini files or conditional configuration. Development: `validate_timestamps=1, revalidate_freq=0`. Production: `validate_timestamps=0`.

## Performance Considerations

- 500-file request: 500 stat() syscalls saved = 1-2.5ms per request eliminated
- At 500 RPS: 250,000 stat() calls/second eliminated
- CPU savings: ~0.5-1% overall CPU reduction for typical PHP applications
- Larger applications with more files benefit proportionally more

## Security Considerations

- validate_timestamps=0 means PHP won't detect file tampering. Ensure filesystem permissions prevent unauthorized modifications.
- Deployment integrity must be ensured through CI/CD pipeline security, not runtime file monitoring.
- If an attacker modifies a PHP file, the old code continues serving until cache invalidation. This can be either a security feature (prevents exploit of injected code) or risk (stale exploit remains).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| validate_timestamps=0 in development | Copying production config | Code changes invisible, developers confused | Keep validate_timestamps=1 in dev |
| No automated invalidation after deployment | Human forgetfulness | Stale code served until next restart | Integrate cachetool in CI/CD pipeline |
| Confusing with opcache.revalidate_freq | Thinking revalidate_freq still works | Wrong expectation about code update timing | validate_timestamps=0 makes revalidate_freq irrelevant |
| validate_timestamps=0 without deployment automation | Manual deployment process | Stale code incidents increase | Implement at least basic deployment automation |

## Anti-Patterns

- **validate_timestamps=1 in production**: Wastes CPU on stat() calls. The only reason to keep it is shared hosting without deployment automation.
- **Toggling validate_timestamps for individual deployments**: This should be a permanent production setting. Invalidation is handled by deployment pipeline, not runtime toggling.
- **Assuming validate_timestamps=0 means OpCache never updates**: OpCache updates with explicit invalidation (opcache_reset, restart). The setting controls automatic detection, not ability to update.

## Examples

```ini
; Production php.ini
opcache.validate_timestamps=0
opcache.revalidate_freq=0

; Development php.ini
opcache.validate_timestamps=1
opcache.revalidate_freq=0
```

## Related Topics

- OpCache Production Hardening
- Deployment Cache Invalidation
- OpCache Reset Strategies
- OpCache Configuration Overview

## AI Agent Notes

- validate_timestamps=0 is the single highest-ROI OpCache setting. Enable in all production environments.
- The tradeoff is simple: performance gain vs manual invalidation requirement. In production with automated deployments, the tradeoff is overwhelmingly positive.
- validate_timestamps=0 disables all automatic file change detection. revalidate_freq and revalidate_path are irrelevant when it's 0.
- This setting must be different in development vs production. Use environment-specific configuration.

## Verification

- [ ] Production php.ini has opcache.validate_timestamps=0
- [ ] Development php.ini has opcache.validate_timestamps=1
- [ ] Deployment pipeline includes explicit OpCache invalidation step
- [ ] All team members understand the invalidation requirement
- [ ] Emergency hotfix procedure accounts for cache invalidation
