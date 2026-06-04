# Skill: Integrate Pusher Channels for Managed WebSocket Service

## Purpose
Configure Pusher Channels as a managed broadcasting backend for Laravel, handling WebSocket infrastructure, global delivery, and edge scaling while maintaining compatibility with Laravel's broadcasting API.

## When To Use
- Teams preferring managed infrastructure over self-hosted WebSocket servers
- Prototypes and MVPs needing quick real-time features (free tier available)
- Applications with geographically distributed user bases (Pusher edge network)
- Enterprise environments where outsourcing WebSocket infrastructure is preferred

## When NOT To Use
- Cost-sensitive high-volume applications (Pusher costs scale with connections)
- Applications with data sovereignty requirements (data passes through Pusher)
- Internal-only applications where self-hosted Reverb is simpler and cheaper
- Applications requiring custom WebSocket server configuration

## Prerequisites
- Pusher Channels account and app credentials
- `pusher/pusher-php-server` package installed
- Echo configured on frontend with `broadcaster: 'pusher'`

## Inputs
- `BROADCAST_CONNECTION=pusher` environment configuration
- Pusher app ID, key, secret, cluster
- Pusher webhook endpoint configuration
- Channel authorization in `routes/channels.php`

## Workflow
1. Set `BROADCAST_CONNECTION=pusher` with environment-specific Pusher credentials
2. Configure `config/broadcasting.php` with Pusher options
3. Set Echo broadcaster to `'pusher'` on the frontend
4. Disable debug mode in production
5. Configure Pusher webhooks with HMAC signature verification
6. Monitor Pusher usage dashboard for approaching connection/message limits
7. Implement handling for HTTP 429 rate limit responses
8. Model cost projections vs self-hosted Reverb at scale
9. Document migration path to Reverb (protocol compatible, config change only)

## Validation Checklist
- [ ] `BROADCAST_CONNECTION=pusher` configured per environment
- [ ] Pusher credentials set (app ID, key, secret, cluster)
- [ ] Webhook endpoint configured with signature verification
- [ ] Debug mode disabled in production
- [ ] Usage dashboard monitored for approaching limits
- [ ] Cost projections modeled for expected scale
- [ ] Rate limit handling implemented (HTTP 429)
- [ ] Migration path to Reverb documented

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Cross-environment message leakage | Same Pusher credentials used everywhere | Use separate apps per environment |
| Forged webhook events accepted | No HMAC signature verification | Verify webhook signature on each request |
| Performance slow in production | Debug mode enabled in production | Set `debug => env('PUSHER_DEBUG', false)` |
| New users can't connect | Plan connection limit reached | Monitor usage and upgrade proactively |
| Pusher secret exposed in client | Secret included in frontend bundle | Keep secret server-side only |
| Broadcasting breaks when Pusher is down | Single external dependency | Have fallback plan or use Reverb |

## Decision Points
- **Pusher vs Reverb vs Ably**: Pusher for managed simplicity (200K msgs/day free); Reverb for self-hosted cost control; Ably for guaranteed delivery
- **Environment isolation**: Separate Pusher apps per environment prevents cross-environment message leakage
- **Webhook verification**: Always verify HMAC signatures — Pusher webhook endpoint is public

## Performance/Security Considerations
- Pusher edge network reduces global latency compared to single-region self-hosted
- HTTP API broadcasting adds 10-50ms round trip vs direct protocol publishing
- Never expose Pusher app secret in client-side code
- Webhook endpoint must verify HMAC signatures to prevent forged events
- Pusher is an external dependency — if it's down, broadcasting is down

## Related Rules (from 05-rules.md)
- Always Set `BROADCAST_CONNECTION=pusher` Per Environment
- Always Configure Pusher Webhooks with Signature Verification
- Always Disable Debug Mode in Production
- Always Monitor Pusher Usage Against Plan Limits
- Always Consider Reverb as a Cost-Effective Alternative at Scale
- Never Expose Pusher Secret in Client-Side Code

## Related Skills
- Configure and Operate Laravel Broadcasting Architecture
- Integrate Ably for Enterprise Real-Time Features
- Deploy Soketi for Self-Hosted WebSocket Server

## Success Criteria
- Laravel broadcasts events through Pusher to connected clients
- Environment-specific Pusher credentials prevent cross-environment leakage
- Webhook endpoint verifies HMAC signatures (forged events rejected)
- Usage is monitored and within plan limits
- Migration path to Reverb is documented (protocol compatible)
