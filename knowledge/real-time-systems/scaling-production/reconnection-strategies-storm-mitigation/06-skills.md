# Skill: Mitigate Reconnection Storms with Jitter, Rate Limiting, and Rolling Deployments

## Purpose
Prevent reconnection storms from overwhelming servers during deployments, network partitions, or Redis failovers by implementing client-side jitter, server-side rate limiting, circuit breakers, and rolling deployments.

## When To Use
- Applications with more than a few hundred concurrent WebSocket connections
- Mobile applications with unreliable network connectivity
- Live event platforms anticipating mass join/leave patterns
- Deployment pipelines that restart Reverb instances
- Chat applications with high user churn

## When NOT To Use
- Applications with fewer than 50 concurrent connections (storm unlikely)
- Managed WebSocket services (Pusher, Ably) that handle this server-side
- Local development environments

## Prerequisites
- Echo configured with explicit reconnection options
- Auth endpoint with throttle middleware
- Reverb configured with `max_connections_per_ip`
- Rolling deployment pipeline (if multi-instance)

## Inputs
- Echo client configuration with reconnection options
- Auth endpoint route with throttle middleware
- Reverb `max_connections_per_ip` setting
- Supervisor `stopwaitsecs` configuration

## Workflow
1. Configure Echo with `activityTimeout`, `pongTimeout`, `unavailableTimeout`
2. Implement full jitter on client reconnect: `Math.random() * Math.min(cap, base * 2^n)`
3. Apply `throttle` middleware to `/broadcasting/auth` (e.g., 100 requests per minute)
4. Set `max_connections_per_ip` in Reverb config (e.g., 100)
5. Configure rolling deployments: restart Reverb instances one at a time
6. Set Supervisor `stopwaitsecs` to match or exceed `activity_timeout`
7. Pre-warm authorization caches before planned deployments
8. Implement circuit breaker: increase backoff multiplier on 429/503
9. Monitor auth endpoint response times and error rates
10. Test storm scenario: stop Redis and verify recovery after restart

## Validation Checklist
- [ ] Echo configured with `activityTimeout`, `pongTimeout`, `unavailableTimeout`
- [ ] Full jitter implemented: `Math.random() * backoffValue`
- [ ] `/broadcasting/auth` rate limited (throttle middleware)
- [ ] `max_connections_per_ip` set in Reverb config
- [ ] Rolling deployments configured with connection draining
- [ ] Supervisor `stopwaitsecs` matches `activity_timeout`
- [ ] Auth caches pre-warmed before planned deployments
- [ ] Circuit breaker implemented for 429/503 responses

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Clients reconnect in synchronized waves | Exponential backoff without jitter | Add `Math.random() * backoffValue` |
| Auth endpoint collapses under reconnect | No rate limiting on `/broadcasting/auth` | Apply `throttle:100,1` middleware |
| Connection storm on every deployment | Restarting all instances simultaneously | Use rolling deployments |
| Connections killed without graceful drain | `stopwaitsecs` too low | Set to at least 2x `activity_timeout` |
| Auth database overload during reconnection | No cache pre-warming | Pre-populate auth caches before deployment |

## Decision Points
- **Jitter strategy**: Full jitter `random(0, backoff)` prevents synchronization; use `random(0, 2^n * base)` for intervals up to 30s cap
- **Circuit breaker threshold**: 2 consecutive 429/503 → double backoff multiplier; reset after successful auth
- **Stopwaitsecs**: Minimum `activity_timeout + 10s`; longer is safer for graceful drain

## Performance/Security Considerations
- Auth endpoint throughput determines max sustainable reconnect rate
- PHP-FPM must handle auth storm + normal HTTP traffic concurrently
- Queue workers must process broadcast event backlog accumulated during outage
- `max_connections_per_ip` prevents individual IP abuse and limits storm impact from single source

## Related Rules (from 05-rules.md)
- Always Implement Jitter with Exponential Backoff
- Always Apply `throttle` Middleware to the Auth Endpoint
- Always Use Rolling Deployments with Connection Draining
- Always Pre-Warm Authorization Caches Before Planned Deployments
- Always Implement a Circuit Breaker for Auth Endpoint Errors
- Always Configure `max_connections_per_ip` in Reverb

## Related Skills
- Configure and Operate Laravel Broadcasting Architecture
- Set Up Sticky Sessions for Multi-Server Reverb Deployments

## Success Criteria
- Reconnection after outage spreads across 30-60s window (not simultaneous)
- Auth endpoint stays responsive during reconnection storm
- Rolling deployments cause no full-service disruption
- Server recovers after outage without manual intervention
