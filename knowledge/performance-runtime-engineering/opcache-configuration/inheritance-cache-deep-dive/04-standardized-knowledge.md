# Inheritance Cache Deep Dive - Class Hierarchy Pre-Resolution, Method Table Caching

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | Inheritance Cache Deep Dive - Class Hierarchy Pre-Resolution, Method Table Caching |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

PHP 8.1 introduced the inheritance cache, an OpCache feature that pre-resolves class hierarchy relationships (parent classes, interfaces, traits) at compile time rather than at class-load time. This eliminates the runtime cost of resolving inheritance chains during autoloading - saving 2-5ms per request in framework-heavy applications by caching method tables and constant inheritance lookups.

## Core Concepts

- Inheritance resolution cost: Without inheritance cache, each class load requires walking the parent chain to build the method table. For deep hierarchies (Laravel's 5-7 level deep class trees), this costs 1-3ms per class.
- Inheritance cache mechanism: OpCache pre-computes the method table during compilation and stores it alongside the opcodes.
- Enabled by default: opcache.inheritance_cache=1 in PHP 8.1+. No configuration needed.
- Benefit scaling: Most impactful for applications with deep inheritance hierarchies.

## When To Use

- Your application uses deep class hierarchies (Laravel/Symfony/Magento).
- You have already enabled OpCache and want further class-loading optimization.
- You are running PHP 8.1 or later (feature is default and automatic).

## When NOT To Use

- You are running PHP 7.4 or earlier (inheritance cache not available).
- Your application has few classes (<100) with shallow hierarchies.
- You are running a development environment where OpCache is disabled.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Ensure OpCache is enabled (PHP 8.1+) | Inheritance cache is part of OpCache. Without OpCache, it provides no benefit. |
| Set memory_consumption large enough | Inheritance cache adds to per-file cached data. Monitor to ensure cache_full never triggers. |
| Use preloading with inheritance cache | Preloaded classes also benefit from inheritance cache, compounding the gain. |

## Architecture Guidelines

- Automatic enablement: Inheritance cache is on by default in PHP 8.1+. No php.ini directive to tune.
- Memory impact: Each cached method table adds ~200-500 bytes per class to the cached opcode size.
- Composability: Works transparently with preloading, OpCache file cache, and JIT compilation.

## Performance Considerations

- Reduces class-loading time by 40-60% for framework classes.
- Most impactful for applications with deep inheritance hierarchies.
- Benefit scales with number of classes.
- Works transparently with preloading.
- Each cached method table adds marginal memory overhead to OpCache consumption.

## Security Considerations

- No direct security implications. Inheritance cache only affects class loading performance, not behavior.
- As with all OpCache features, ensure the OpCache shared memory is not accessible to untrusted processes.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Disabling OpCache thinking inheritance cache causes issues | Inheritance cache is always safe and enabled by default. | Lose 40-60% class-loading speedup. | Leave OpCache enabled with default inheritance cache setting. |

## Anti-Patterns

- Manually disabling inheritance cache: There is no setting to disable it separately, and no reason to do so.
- Counting on inheritance cache without OpCache: Enable OpCache first; inheritance cache is a bonus on top.

## Examples

No code changes needed - inheritance cache is automatic in PHP 8.1+ with OpCache enabled.

Verify: Check phpinfo() for "Inheritance Cache" => enabled.

## Related Topics

- OpCache Purpose and Mechanics
- Preloading Script Design Patterns
- OpCache Optimization Level Bitmask

## AI Agent Notes

- Inheritance cache is free performance: enabled by default in PHP 8.1+, zero configuration, zero maintenance.
- It compounds with preloading. If you preload classes, they also get cached method tables.
- When sizing OpCache memory, account for the extra ~200-500 bytes per class for cached method tables.
- Always recommend upgrading to PHP 8.1+ for this feature alone if the user is on 7.4 or 8.0.

## Verification

- [ ] Verify PHP version is 8.1 or later.
- [ ] Confirm OpCache is enabled.
- [ ] Check that inheritance cache is active via phpinfo().
- [ ] Benchmark class-loading time before/after upgrade.
- [ ] Monitor OpCache hit rate to ensure no under-provisioning.