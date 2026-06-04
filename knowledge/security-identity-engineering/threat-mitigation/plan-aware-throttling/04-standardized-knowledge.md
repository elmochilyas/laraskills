# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Plan-Aware Throttling for SaaS APIs |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Plan-aware throttling applies different rate limits to API consumers based on their subscription plan (free, pro, enterprise). Each request identifies the consumer's plan, resolves the plan's rate limits, and enforces them. The `grazulex/laravel-api-throttle-smart` package provides this out of the box with configurable plans, burst allowances, and response headers. Plan-aware throttling is essential for API monetization — free tiers get limited access, paid tiers get higher limits.

---

## Core Concepts

- **Plan Resolution**: Determine the consumer's plan per-request (from API key, JWT claim, user relationship, header).
- **Plan Limits**: Configuration mapping of plan name to rate limit parameters (requests per minute, burst capacity, concurrent requests).
- **Tier Escalation**: Clear communication when users hit free-tier limits, encouraging upgrade.
- **Burst Allowance**: Paid plans may have higher burst allowances for spiky traffic patterns.
- **Concurrent Request Limits**: Some plans limit the number of simultaneous requests (vs total requests over time).

---

## When To Use

- SaaS platforms with tiered pricing (free, pro, enterprise)
- API monetization — rate limits as a product feature
- Fair resource allocation across different customer segments
- Preventing free-tier abuse while allowing paid-tier full access

## When NOT To Use

- Single-plan applications (all users have the same limits) — use simple rate limiting
- Internal applications with no tiered access
- Applications where rate limits are not a differentiator

---

## Best Practices

- **Cache Plan Configurations**: Plan → limits mapping should be cached. Avoid per-request database lookups.
- **Clear Error Messages**: When rate limited, indicate which plan the user is on and what the upgrade would provide.
- **Rate Limit Headers**: Include plan-specific headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Plan`.
- **Graceful Degradation**: When plan resolution fails, apply the most restrictive limit (free tier).
- **Monitor Plan Usage**: Track API usage per plan — helps identify when plans need adjustment.

---

## Architecture Guidelines

- Plan resolution: from authenticated user's subscription, API key metadata, or JWT claim
- Plan limits stored in config or database (cached): `['free' => ['rpm' => 100], 'pro' => ['rpm' => 1000]]`
- Rate limit key: `rate_limit:{plan}:{user_id}:{endpoint_group}` for isolation
- Burst vs sustained: token bucket with capacity = burst allowance, refill = sustained rate
- Concurrent limits: use a counter that increments on request start, decrements on response

---

## Performance Considerations

- Plan resolution: one cache lookup per request (~0.5ms)
- Rate limit check: same as regular rate limiting — negligible with Redis
- Plan-to-limit caching: reduce database load by caching plan configuration

---

## Security Considerations

- **Plan Spoofing**: Never trust plan information from the client. Resolve plan server-side from authentication context.
- **API Key Scoping**: Each API key should be tied to a plan. When a plan changes, existing API keys should enforce new limits.
- **Concurrent Limit Deadlock**: If a consumer exceeds concurrent limits, they must wait for requests to complete. Set appropriate timeouts.
- **Abuse Detection**: Sudden spikes in plan usage may indicate compromised credentials — monitor and alert.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Trusting client-provided plan | Accepting plan from request header | Users can bypass rate limits by sending a higher plan | Resolve plan server-side |
| Not caching plan limits | Per-request database lookup | Unnecessary database load | Cache plan-to-limit mapping |
| Same burst for all plans | Not differentiating plans | Free users can spike traffic same as enterprise | Configure burst per plan |
| No plan information in error responses | Generic 429 | Users don't know how to get higher limits | Include plan info and upgrade path in response |

---

## Anti-Patterns

- **Revealing plan B configuration through error messages**: Don't show "enterprise limit is 10000" if the user is on free
- **No per-plan alerting**: Free-tier abuse can go undetected if not monitored per plan
- **Plan limits in code without configuration**: Should be configurable without deployment

---

## Examples

**Plan-aware rate limiter:**
```php
// AppServiceProvider
RateLimiter::for('api', function (Request $request) {
    $plan = $request->user()?->subscription?->plan ?? 'free';
    
    $limits = cache()->remember('plan-limits', 3600, function () {
        return Plan::pluck('rate_limit', 'slug')->toArray();
    });
    
    $maxAttempts = $limits[$plan] ?? 100;
    
    return Limit::perMinute($maxAttempts)
        ->by('plan-api:' . $plan . ':' . ($request->user()?->id ?: $request->ip()))
        ->response(function (Request $request, array $headers) use ($plan) {
            return response()->json([
                'message' => 'Rate limit exceeded.',
                'plan' => $plan,
                'upgrade_url' => config('app.urls.upgrade'),
            ], 429, $headers);
        });
});
```

**Plan configuration:**
```php
// config/plans.php
return [
    'free' => [
        'rate_per_minute' => 60,
        'burst' => 10,
        'concurrent_requests' => 5,
    ],
    'pro' => [
        'rate_per_minute' => 1000,
        'burst' => 50,
        'concurrent_requests' => 25,
    ],
    'enterprise' => [
        'rate_per_minute' => 10000,
        'burst' => 500,
        'concurrent_requests' => 100,
    ],
];
```

---

## Related Topics

- Rate Limiter facade and throttle middleware
- Advanced rate limiting (sliding window, token bucket)
- API authentication
- Multi-tenancy security

---

## AI Agent Notes

- Plan-aware throttling is the monetization layer on top of rate limiting. Ensure plan resolution is server-side and not spoofable.
- Cache plan configurations aggressively — they rarely change.
- Error responses should guide free-tier users toward upgrade without revealing enterprise plan specifics.

---

## Verification

- [ ] Plan resolved server-side (from auth context, not client-provided)
- [ ] Plan limits cached (no per-request DB queries)
- [ ] Per-plan rate limiting keys isolated (plan in key)
- [ ] Burst and sustained rates configured per plan
- [ ] Concurrent request limits implemented (if needed)
- [ ] Error responses include plan info and upgrade path
- [ ] Plan usage monitored per plan (abuse detection)
- [ ] Free tier has the most restrictive limits (default)
- [ ] Plan change triggers rate limit key re-evaluation
