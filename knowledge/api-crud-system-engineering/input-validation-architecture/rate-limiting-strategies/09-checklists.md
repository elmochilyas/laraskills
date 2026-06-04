# Rate Limiting Strategies — Checklists

## Configuration
- [ ] Named rate limiters defined in `AppServiceProvider::boot()` for dynamic limits
- [ ] Redis cache driver configured for production rate limit storage
- [ ] Separate limiters defined for different endpoint cost categories
- [ ] Per-user key used for authenticated endpoints
- [ ] Per-IP key used for public/guest endpoints

## Implementation
- [ ] Auth middleware runs before throttle middleware for user-dependent limits
- [ ] Tiered limits applied: premium users get higher limits than free users
- [ ] Guest limits are lower than authenticated user limits
- [ ] `Retry-After` header included in all 429 responses
- [ ] Custom 429 response provides actionable information

## Testing
- [ ] Test that limit is enforced after N requests within the time window
- [ ] Test that limit resets after the decay period
- [ ] Test that authenticated users have independent limits per user
- [ ] Test that guests have separate limits from authenticated users
- [ ] Test that 429 response includes `Retry-After` header
- [ ] Test that different endpoints respect their respective limiters
