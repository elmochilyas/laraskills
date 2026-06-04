# Skill: Rate-Limit Incoming Webhooks Per Source

## Purpose
Apply per-source rate limiting to incoming webhook endpoints to prevent abuse, misconfigured senders, or traffic spikes from overwhelming downstream processing.

## When To Use
- Webhook endpoints exposed to the internet
- Preventing a single misconfigured sender from flooding processing
- Multi-tenant applications with per-tenant rate limits
- Throttling processing costs per source

## When NOT To Use
- Internal-only webhook endpoints
- Low-volume, trusted webhook sources
- When rate limiting at the infrastructure layer (Cloudflare, Nginx) suffices

## Prerequisites
- Laravel rate limiter or throttle middleware
- Source identification (IP, header, API key)

## Workflow
1. Identify webhook source (IP address, `X-Source-ID` header, API key)
2. Configure Laravel rate limiter: `RateLimiter::for('webhooks', fn => Limit::perMinute(60))`
3. Apply `throttle` middleware to webhook routes with per-source key
4. Use Redis-based rate limiting for distributed applications
5. Return 429 with `Retry-After` header on rate limit hit
6. Log rate limit hits for capacity monitoring
7. Alert on sustained rate limit violations
8. Test rate limiting behavior with concurrent webhook requests

## Validation Checklist
- [ ] Source identified from request (IP, header, key)
- [ ] Rate limiter configured with per-source key
- [ ] Throttle middleware applied to webhook routes
- [ ] 429 with `Retry-After` returned on limit hit
- [ ] Rate limit hits logged
- [ ] Alerts configured for sustained violations
