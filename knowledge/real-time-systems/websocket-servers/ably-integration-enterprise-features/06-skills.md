# Skill: Integrate Ably for Enterprise Real-Time Features

## Purpose
Configure Ably as a managed broadcasting driver for Laravel, leveraging guaranteed delivery, global edge network, token authentication, and enterprise features like Spaces and message history.

## When To Use
- Enterprise applications requiring guaranteed message delivery
- Multi-region applications needing global WebSocket edge distribution
- Applications requiring exactly-once delivery for financial/audit data
- Real-time collaboration features using Ably Spaces
- IoT applications using MQTT alongside WebSocket broadcasting

## When NOT To Use
- Simple server-to-client broadcasting where Reverb suffices
- Applications needing self-hosted control
- Cost-sensitive applications at extreme scale
- Teams not needing guaranteed delivery or global edge distribution

## Prerequisites
- Ably account (free tier available)
- Laravel 11+ with `php artisan install:broadcasting --ably`
- `ably/ably-php` SDK installed
- Echo configured on frontend (Pusher protocol or Ably SDK)

## Inputs
- `ABLY_KEY` (server-side only, never exposed to client)
- Token authentication endpoint for client connections
- Ably channel rules for retention and encryption
- Webhook endpoint for presence/error monitoring

## Workflow
1. Install Ably: `composer require ably/ably-php` or `php artisan install:broadcasting --ably`
2. Set `BROADCAST_CONNECTION=ably` and `ABLY_KEY` in `.env`
3. Implement token authentication: generate ephemeral tokens server-side for client connections
4. Set `ABLY_LOG_LEVEL=error` in production to prevent verbose logging
5. Configure message retention limits on channels (cost control)
6. Set up webhooks for presence events, channel lifecycle, and error monitoring
7. For advanced features (Spaces, history), use Ably SDK directly (not Laravel broadcast interface)
8. Implement rate limit handling with retry/backoff
9. Model cost projections for expected scale

## Validation Checklist
- [ ] `BROADCAST_CONNECTION=ably` configured
- [ ] Token authentication implemented for client connections
- [ ] `ABLY_LOG_LEVEL=error` in production
- [ ] Message retention limits configured
- [ ] Webhooks set up for presence and error monitoring
- [ ] Channel encryption rules configured for sensitive data
- [ ] Rate limit handling implemented
- [ ] Cost projections modeled for expected scale

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Ably API key leaked to client | No token authentication | Generate ephemeral tokens server-side |
| Storage costs growing unbounded | No message retention limits | Set retention policies on channels |
| Performance slow in production | `ABLY_LOG_LEVEL=debug` in production | Set to `error` |
| Ably Spaces not working through Echo | Using Laravel broadcast interface | Use Ably SDK directly for advanced features |
| Tokens expire, connections drop | Token renewal not implemented | Implement token refresh in client |

## Decision Points
- **Ably vs Pusher vs Reverb**: Ably for enterprise/global/guaranteed delivery; Pusher for simple managed; Reverb for self-hosted
- **Pusher protocol vs Ably SDK**: Use Pusher protocol for Echo compatibility; Ably SDK for enterprise features
- **Message retention**: Based on compliance needs (hours for audit, none for ephemeral)

## Performance/Security Considerations
- Global edge network (205+ PoPs) reduces latency for distributed users
- Guaranteed delivery adds acknowledgment overhead vs fire-and-forget
- Never expose `ABLY_KEY` in client-side code
- Ably provides SOC 2, HIPAA, GDPR compliance
- Token authentication ensures clients have scoped access

## Related Rules (from 05-rules.md)
- Never Expose the Ably API Key in Client-Side Code
- Always Configure Message Retention Limits
- Always Set `ABLY_LOG_LEVEL=error` in Production
- Always Use Ably Webhooks for Presence and Error Monitoring
- Never Use Laravel's Generic Broadcast Interface for Advanced Ably Features

## Related Skills
- Integrate Pusher Channels for Managed WebSocket Service
- Configure and Operate Laravel Broadcasting Architecture

## Success Criteria
- Laravel broadcasts events through Ably with guaranteed at-least-once delivery
- Client connections use ephemeral tokens (no API key exposed)
- Message retention limits control storage costs
- Webhooks provide visibility into presence and error conditions
- Advanced Ably features (Spaces, history) accessible via SDK
