# Skill: Implement Rate Limiting and Abuse Prevention

## Purpose
Apply layered rate limiting (request-count, token-based, cost-based) using Redis-backed sliding window counters at infrastructure and application levels, with per-user and per-session limits, abuse pattern detection, and meaningful 429 responses — preventing budget exhaustion, DoS, and abusive usage patterns.

## When To Use
- Any public-facing AI API or application — rate limiting is mandatory
- Applications with free tiers — prevent one user from exhausting budget
- Multi-tenant SaaS — ensure fair resource allocation across tenants
- Systems with expensive LLM calls — cap daily/weekly spend per user

## When NOT To Use
- Internal tools with a small, trusted user base
- Batch processing systems where queuing is handled by the job system
- Single-user applications (the user is the only consumer)

## Prerequisites
- KU-05 (Rate Limiting & Abuse Prevention) — understanding of rate limiting algorithms
- Redis for distributed rate limit counters
- Rate limit policy definitions (tiers, limits per user/session/endpoint)
- Monitoring for rate limit events (429s, limit approaching warnings)

## Inputs
- Rate limit policies per tier (free: 10 req/min, pro: 100 req/min, enterprise: 1000 req/min)
- Token and cost limits per user per time window
- Model pricing list (for cost-based limits)
- Abuse pattern definitions (rapid-fire, multiple accounts from same IP, known attack patterns)

## Workflow
1. **Define rate limit tiers**: Create limit configurations per user tier (free, pro, enterprise), per endpoint (chat vs. embed vs. batch), and per model (cheap models vs. expensive models). Store in config with hot-reload capability.
2. **Implement infrastructure-level limits**: Configure nginx/Cloudflare rate limiting for baseline protection (requests per IP per second). This catches distributed attacks before they reach the application.
3. **Implement application-level request limits**: Add middleware that checks per-user request count using Redis sliding window counter. Return 429 with Retry-After header when exceeded. Track by user ID for authenticated, IP for anonymous.
4. **Implement token-based limits**: After each LLM call, read actual token usage and decrement from the user's token budget. Check budget before processing new requests. Alert users at 80%/90%/95% usage.
5. **Implement cost-based limits**: Compute cost from token usage × model pricing. Enforce daily/weekly/monthly spend caps. Critical for preventing budget overruns from runaway agents or abuse.
6. **Implement concurrency limits**: Use Redis INCR/DECR to track simultaneous requests per user. Reject if concurrency exceeds limit. Prevents a single user from consuming all workers.
7. **Detect abuse patterns**: Monitor for: multiple accounts from same IP, rapid-fire requests without pauses, repeated injection attempts, unusual request size patterns. Flag and escalate.
8. **Implement graduated responses**: At 80% usage: warning notification. At 90%: warning + reduced priority. At 100%: hard block with clear message and time-to-reset. After repeated violations: permanent block (requires manual review).
9. **Rate limit streaming differently**: Streaming connections are long-lived. Rate limit by connection establishment (not throughput). Set per-user concurrent stream limits.
10. **Monitor and tune**: Track rate limit hit rates per tier. Adjust limits based on actual usage patterns. Review abuse detection logs for false positives. Tune thresholds quarterly.

## Validation Checklist
- [ ] Rate limits are implemented at infrastructure (CDN/nginx) and application levels
- [ ] Rate limiting accounts for token/cost consumption, not just request count
- [ ] Rate limiter uses sliding window (not fixed window) for accurate counting
- [ ] 429 responses include Retry-After header and a clear error message
- [ ] Rate limit policies are configurable per environment, plan, and endpoint
- [ ] Rate limit state is stored in Redis (distributed, shared across instances)
- [ ] Rate limit service failure results in graceful degradation (fail-open logged)

## Common Failures
- **Request-only rate limiting ignoring tokens**: User sends one request with 50K tokens, exhausting budget. Fix: always rate limit by token/cost consumption, not just request count.
- **Fixed window boundary spikes**: All users hit the limit at the start of each window, then idle. Fix: use sliding window algorithm for smooth distribution.
- **No infrastructure-level limits**: Application-level limits bypassed by direct network access or distributed attacks. Fix: always layer infrastructure limits (nginx, Cloudflare).
- **429 without Retry-After**: Client doesn't know when to retry, keeps hammering. Fix: always include Retry-After header with meaningful value.
- **Inconsistent state across instances**: Rate limit counters in local memory on multi-server deployment. Fix: use Redis for all counters.

## Decision Points
- **Fixed window vs. sliding window**: Fixed window is simpler but allows boundary spikes. Sliding window is more accurate but slightly more complex. Use sliding window for production.
- **Request vs. token vs. cost limiting**: Request limits are simplest (catch broad abuse). Token limits are more accurate (account for actual usage). Cost limits are most accurate for budget control (account for model pricing). Use all three.
- **Fail-open vs. fail-closed on rate limit service failure**: Fail-open (allow requests, log warning) for availability. Fail-closed (deny all requests) for safety. Choose fail-open with logging for rate limiting; fail-closed for abuse detection.

## Performance Considerations
- Redis rate limit check: <1ms per request (use pipelining for batch checks)
- Token counting: <0.1ms (pre-computed estimates)
- Cost computation: <0.1ms (cached pricing table lookup)
- Concurrency tracking: 2 Redis round trips per request (INCR on start, DECR on end)
- Cache policy definitions locally with 60s TTL
- For high throughput (>1000 req/s), use local counters with periodic Redis sync

## Security Considerations
- Attackers may use distributed attacks (many IPs, many API keys) — implement behavioral analysis alongside rate limits
- Don't expose detailed rate limit state (remaining budget) to unauthenticated users (helps attackers optimize)
- Cost-based attacks: attacker triggers expensive model calls — always rate limit by cost, not just requests
- If rate limit service fails, allow requests with warning log (fail-open for rate limiting)
- Rate limit bypass via API key rotation: if using API keys, ensure limits apply across all keys for the same user

## Related Rules
- Address all OWASP LLM Top 10 categories in the application's threat model before production
- Never give LLM agents access to tools that can modify or delete production data
- Implement per-session and per-user rate limiting on LLM calls to prevent DoS and budget exhaustion

## Related Skills
- Skill: Prevent Prompt Injection Attacks (ku-01)
- Skill: Secure Output Handling and Safe Rendering (ku-06)
- Skill: Track AI Usage Costs (cost-ku-01)

## Success Criteria
- Rate limits enforced at infrastructure and application levels with consistent Redis-backed state
- Token/cost-based limits prevent budget exhaustion more effectively than request-only limits
- Sliding window algorithm prevents boundary spike abuse
- 429 responses include Retry-After header and clear messages in all cases
- Users receive usage warnings at 80%/90%/95% of limit
- Concurrency limits prevent any single user from consuming all workers
- Rate limit service failure results in graceful degradation (requests allowed, logged)