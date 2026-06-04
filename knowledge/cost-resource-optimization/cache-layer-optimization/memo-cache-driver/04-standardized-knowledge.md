# Memo Cache Driver

## Metadata
- **ID**: KU-49-MEMO-CACHE
- **Subdomain**: cache-layer-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Laravel Memo Cache Driver
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Laravel 13.x's memo cache driver stores cached values in memory within a single request, reducing Redis calls by 50-80% for repeated cache lookups. When the same cached value is accessed multiple times during a request (e.g., config, settings, user permissions), memo serves it from local memory instead of querying Redis. This is a zero-configuration optimization that reduces Redis load and network overhead.

## Core Concepts
- **In-memory cache**: Stores values in PHP array for duration of request
- **Redis call reduction**: 50-80% fewer Redis GET commands for repeated lookups
- **Zero config**: Works automatically when configured as cache driver
- **Request-scoped**: Cleared at end of each request (safe for Octane with proper sandboxing)

## When To Use
- Any Laravel app with repeated cache lookups within same request
- Apps using config caching, settings, permissions, or feature flags
- Octane applications (memo is sandboxed per-request)
- Reducing Redis connection pressure on Fargate/Lambda workers

## Best Practices
- **Use memo as a wrapper around Redis driver**: Configure cache driver as 'memo' with Redis store (WHY: memo adds in-memory layer on top of Redis; repeated lookups hit local memory — 0ns latency; first lookup queries Redis per usual; reduces Redis GET commands by 50-80%; no data staleness since it's request-scoped)
- **Enable for Octane with sandboxing**: Laravel 13.x handles this automatically (WHY: Octane shares state across requests if not sandboxed; memo driver in 13.x clears per-request; verify memo state is not persisted across Octane worker requests)
- **Combine with cache tags for efficient invalidation**: Memo works with Redis tags for grouped invalidation (WHY: memo caches the Redis response, including tagged cache results; invalidation of a tag on next request triggers fresh Redis lookup)
- **Monitor Redis command count before and after**: Track Redis INFO commandstats reduction (WHY: memo's benefit is visible as reduced GET command count; benchmark shows 50-80% reduction; if reduction is <30%, your app may not have many repeated cache lookups)

## Related Topics
- Redis Memory Optimization (ku-15)
- Cache Hit Ratio Optimization (ku-11)
- Laravel Octane Throughput (ku-38)

## AI Agent Notes
- Default: use memo cache driver wrapping Redis in Laravel 13+
- Reduces Redis GET commands by 50-80% with zero config
- Request-scoped; safe for Octane
- Combine with cache tags for grouped invalidation
