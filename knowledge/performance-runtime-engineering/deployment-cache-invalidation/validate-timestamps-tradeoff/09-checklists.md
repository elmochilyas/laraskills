# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** validate_timestamps=0 Tradeoff ? Eliminates stat() Syscalls at Cost of Manual Invalidation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always set validate_timestamps=0 in production**: The performance gain (1-2.5ms per request) is immediate and code-free. This is the single highest-ROI OpCache tuning.
- [ ] **Keep validate_timestamps=1 in development**: Code changes must appear without manual intervention. Use revalidate_freq=0 for immediate detection.
- [ ] **Automate cache invalidation**: Integrate opcache_reset() or cachetool into deployment pipeline. Never rely on manual invalidation.
- [ ] **Combine with preloading for maximum gain**: validate_timestamps=0 + preloading eliminates stat() for both cold and warm requests.
- [ ] **Document the tradeoff**: Ensure all developers understand that code changes require explicit invalidation in production.
- [ ] Production php.ini has opcache.validate_timestamps=0
- [ ] Development php.ini has opcache.validate_timestamps=1
- [ ] Deployment pipeline includes explicit OpCache invalidation step
- [ ] All team members understand the invalidation requirement
- [ ] Emergency hotfix procedure accounts for cache invalidation
- [ ] validate_timestamps=0 in all production environments (stat() overhead eliminated)
- [ ] validate_timestamps=1 in all development environments (immediate code visibility)
- [ ] Deployment pipeline invalidates OpCache explicitly on every deploy
- [ ] Environment-specific php.ini prevents cross-environment misconfiguration
- [ ] Team understands and documents the invalidation requirement
- [ ] 0.5-1% CPU saved from eliminated stat() syscalls
- [ ] Production php.ini has `opcache.validate_timestamps=0`
- [ ] Development php.ini has `opcache.validate_timestamps=1`
- [ ] Invalidation verified (hit rate confirmed 0 after reset, >99% after warm-up)
- [ ] Environment-specific php.ini files separated by deployment

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Per-Request Savings Breakdown**: 500 files Ã— 2Âµs per stat() = 1ms saved per request. At 1000 RPS: 1 second of CPU saved per second. This scales linearly with file count and request rate.
- [ ] **stat() Cache Interaction**: Even with stat() caching in the OS (dentries), validate_timestamps=1 calls stat() because OpCache checks the PHP stat cache, not the OS cache. validate_timestamps=0 bypasses both.
- [ ] **Development vs Production Split**: Configure validate_timestamps via environment-specific php.ini files or conditional configuration. Development: `validate_timestamps=1, revalidate_freq=0`. Production: `validate_timestamps=0`.
- [ ] Document and follow through on architectural decision: opcache.validate_timestamps = on/off
- [ ] Ensure architecture aligns with core concept: **With validate_timestamps=1 (default)**: Every request, PHP calls stat() on every cached file to check modification time. A 500-file request = 500 stat() syscalls. Each stat() costs ~2-5Âµs = 1-2.5ms per request. At 500 RPS: 250,000 stat() calls/second.
- [ ] Ensure architecture aligns with core concept: **With validate_timestamps=0**: Zero stat() calls for cached files. The 1-2.5ms per request overhead is eliminated. Must explicitly invalidate OpCache after deployment.
- [ ] Ensure architecture aligns with core concept: **revalidate_freq Interaction**: Controls how often timestamps are checked when validate_timestamps=1. Ignored when validate_timestamps=0. Even with revalidate_freq=60, stat() overhead is significant for large file sets.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always set validate_timestamps=0 in production**: The performance gain (1-2.5ms per request) is immediate and code-free. This is the single highest-ROI OpCache tuning.
- [ ] **Keep validate_timestamps=1 in development**: Code changes must appear without manual intervention. Use revalidate_freq=0 for immediate detection.
- [ ] **Automate cache invalidation**: Integrate opcache_reset() or cachetool into deployment pipeline. Never rely on manual invalidation.
- [ ] **Combine with preloading for maximum gain**: validate_timestamps=0 + preloading eliminates stat() for both cold and warm requests.
- [ ] **Document the tradeoff**: Ensure all developers understand that code changes require explicit invalidation in production.

# Performance Checklist (from 04/06)
- [ ] 500-file request: 500 stat() syscalls saved = 1-2.5ms per request eliminated
- [ ] At 500 RPS: 250,000 stat() calls/second eliminated
- [ ] CPU savings: ~0.5-1% overall CPU reduction for typical PHP applications
- [ ] Larger applications with more files benefit proportionally more
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] validate_timestamps=0 means PHP won't detect file tampering. Ensure filesystem permissions prevent unauthorized modifications.
- [ ] Deployment integrity must be ensured through CI/CD pipeline security, not runtime file monitoring.
- [ ] If an attacker modifies a PHP file, the old code continues serving until cache invalidation. This can be either a security feature (prevents exploit of injected code) or risk (stale exploit remains).

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Production php.ini has opcache.validate_timestamps=0
- [ ] Development php.ini has opcache.validate_timestamps=1
- [ ] Deployment pipeline includes explicit OpCache invalidation step
- [ ] All team members understand the invalidation requirement
- [ ] Emergency hotfix procedure accounts for cache invalidation
- [ ] validate_timestamps=0 in all production environments (stat() overhead eliminated)
- [ ] validate_timestamps=1 in all development environments (immediate code visibility)
- [ ] Deployment pipeline invalidates OpCache explicitly on every deploy
- [ ] Environment-specific php.ini prevents cross-environment misconfiguration
- [ ] Team understands and documents the invalidation requirement
- [ ] 0.5-1% CPU saved from eliminated stat() syscalls
- [ ] Production php.ini has `opcache.validate_timestamps=0`
- [ ] Development php.ini has `opcache.validate_timestamps=1`
- [ ] Invalidation verified (hit rate confirmed 0 after reset, >99% after warm-up)
- [ ] Environment-specific php.ini files separated by deployment
- [ ] Team understands the invalidation requirement (documentation exists)

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always set validate_timestamps=0 in production**: The performance gain (1-2.5ms per request) is immediate and code-free. This is the single highest-ROI OpCache tuning.
- [ ] **Keep validate_timestamps=1 in development**: Code changes must appear without manual intervention. Use revalidate_freq=0 for immediate detection.
- [ ] **Automate cache invalidation**: Integrate opcache_reset() or cachetool into deployment pipeline. Never rely on manual invalidation.
- [ ] **Combine with preloading for maximum gain**: validate_timestamps=0 + preloading eliminates stat() for both cold and warm requests.
- [ ] **Document the tradeoff**: Ensure all developers understand that code changes require explicit invalidation in production.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: validate_timestamps=0 in development
- [ ] Avoid: No automated invalidation after deployment
- [ ] Avoid: Confusing with opcache.revalidate_freq
- [ ] Avoid: validate_timestamps=0 without deployment automation
- [ ] Avoid anti-pattern: **validate_timestamps=1 in production**: Wastes CPU on stat() calls. The only reason to keep it is shared hosting without deployment automation.
- [ ] Avoid anti-pattern: **Toggling validate_timestamps for individual deployments**: This should be a permanent production setting. Invalidation is handled by deployment pipeline, not runtime toggling.
- [ ] Avoid anti-pattern: **Assuming validate_timestamps=0 means OpCache never updates**: OpCache updates with explicit invalidation (opcache_reset, restart). The setting controls automatic detection, not ability to update.
- [ ] Guard against anti-pattern: No Post-Deployment Cache Reset
- [ ] Guard against anti-pattern: OpCache validate_timestamps = 1 in Production
- [ ] Guard against anti-pattern: Cold-Start Cache Building on First Request
- [ ] Guard against anti-pattern: Invalidating Too Much Cache on Every Deploy
- [ ] Guard against anti-pattern: Deploying During Peak Traffic Without Blue-Green
- [ ] Cache reset automated
- [ ] OpCache reset executed

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **With validate_timestamps=1 (default)**: Every request, PHP calls stat() on every cached file to check modification time. A 500-file request = 500 stat() syscalls. Each stat() costs ~2-5Âµs = 1-2.5ms per request. At 500 RPS: 250,000 stat() calls/second., **With validate_timestamps=0**: Zero stat() calls for cached files. The 1-2.5ms per request overhead is eliminated. Must explicitly invalidate OpCache after deployment., **revalidate_freq Interaction**: Controls how often timestamps are checked when validate_timestamps=1. Ignored when validate_timestamps=0. Even with revalidate_freq=60, stat() overhead is significant for large file sets.
**Skills:** OpCache Reset Strategies, Deployment Cache Invalidation, CI/CD Cache Invalidation Steps, OpCache Production Hardening
**Decision Trees:** opcache.validate_timestamps = on/off
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** OpCache Production Hardening, Deployment Cache Invalidation, OpCache Reset Strategies, OpCache Configuration Overview

