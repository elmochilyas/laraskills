# Skill: Leverage PHP 8.1+ Inheritance Cache for Framework Applications

## Purpose

Configure and verify PHP 8.1+'s inheritance cache to reduce class hierarchy resolution overhead in framework-heavy PHP applications.

## When To Use

- Running PHP 8.1+ with OpCache enabled
- Application uses inheritance-heavy frameworks (Laravel, Symfony, Magento)
- Profiling shows class resolution time as a significant portion of bootstrap

## When NOT To Use

- For PHP versions below 8.1 (inheritance cache not available)
- For applications with minimal class inheritance
- When OpCache hit rate is not yet optimized (fix hit rate first)

## Prerequisites

- PHP 8.1+ runtime
- OpCache enabled with hit rate >99%
- Understanding that inheritance cache is automatically enabled in PHP 8.1+

## Inputs

- PHP version (must be 8.1+)
- Current OpCache configuration
- Profiling data showing class resolution time

## Workflow (numbered steps)

1. Verify PHP version >= 8.1: `php -v | grep "^PHP"`
2. Confirm inheritance cache is active (automatic in PHP 8.1+, no configuration needed) — check via `opcache_get_status()`
3. Profile a request and measure time spent in autoloading/class resolution before and after inheritance cache benefit
4. Compare class resolution overhead between PHP 8.0 (no inheritance cache) and PHP 8.1+ (with inheritance cache)
5. The inheritance cache reduces class hierarchy resolution by ~80% in framework applications
6. Ensure OpCache memory_consumption is adequate — inheritance cache uses additional shared memory
7. If memory usage increased after PHP 8.1+ upgrade, the inheritance cache is one cause — size memory accordingly
8. Document that inheritance cache is enabled and its expected benefit

## Validation Checklist

- [ ] PHP version >= 8.1 confirmed
- [ ] Inheritance cache active (automatic check)
- [ ] Class resolution overhead measured (if profiling available)
- [ ] OpCache memory sized to accommodate inheritance cache overhead
- [ ] Benefit documented for the team

## Common Failures

- **Not accounting for increased memory usage**: Inheritance cache adds to OpCache shared memory consumption
- **Expecting configuration toggle**: Inheritance cache is automatic in PHP 8.1+ — no php.ini setting
- **Assuming benefit is negligible**: For framework apps with deep inheritance trees, 80% reduction in class resolution is significant
- **Forgetting to test after upgrade**: Verify inheritance cache is working after PHP version upgrade

## Decision Points

- PHP 8.1+: inheritance cache is automatic, no action needed
- PHP 8.0 or earlier: plan PHP upgrade to benefit from inheritance cache
- Framework app with deep inheritance (Laravel, Symfony): significant benefit expected
- Custom app with flat class hierarchy: minimal benefit

## Performance Considerations

- Inheritance cache reduces class resolution overhead by ~80% in framework applications
- Class resolution overhead is typically 1-5ms of bootstrap time — saving 0.8-4ms per request
- The cache uses OpCache shared memory — typical overhead is 5-15% of the OpCache memory allocation
- Benefit scales with class hierarchy depth and number of parent/interface relationships

## Security Considerations

- Inheritance cache is an internal OpCache optimization — no security implications
- No configuration or access control considerations

## Related Rules (from 05-rules.md)

- Enable OpCache First, Tune Later
- Size memory_consumption to Your Application

## Related Skills

- OpCache Memory Sizing
- PHP Version Upgrade Planning
- OpCache Overview and Configuration

## Success Criteria

- PHP 8.1+ confirmed with inheritance cache active
- OpCache memory sized to accommodate inheritance cache overhead
- Class resolution benefit documented
- No regressions from increased memory usage
