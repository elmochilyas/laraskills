# Skill: Cache SaloonPHP Requests with the Cache Plugin

## Purpose
Use SaloonPHP's `CachingPlugin` to automatically cache GET responses with configurable TTL and invalidation strategies.

## When To Use
- GET requests to external APIs with stable responses
- Reducing API call volume and rate limit usage
- Improving response times for cached endpoints

## When NOT To Use
- Mutating requests (POST, PUT, DELETE) — caching is irrelevant
- Real-time data requiring fresh responses
- Session-specific or user-specific responses

## Prerequisites
- SaloonPHP installed
- Cache driver configured (Redis recommended)

## Workflow
1. Install cache plugin: `composer require saloonphp/cache-plugin`
2. Add `CachingPlugin` to Connector: `protected ?string $cachePlugin = CachingPlugin::class`
3. Configure TTL on the plugin: `->setTtl(300)`
4. Configure cache key strategy (query params, headers)
5. Configure invalidation: manual clear or webhook-triggered
6. Test cached vs non-cached response times
7. Log cache hit/miss for monitoring

## Validation Checklist
- [ ] `CachingPlugin` added to Saloon Connector
- [ ] TTL configured appropriately
- [ ] Cache key strategy handles different query params
- [ ] Cache invalidation on relevant data changes
- [ ] Cache hit/miss metrics logged
- [ ] Response time improvement measured
