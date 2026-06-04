# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Pusher Channels Integration
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Pusher Channels is a managed WebSocket service that was the default broadcasting backend for Laravel before Reverb. Integration uses the Pusher PHP SDK (`pusher/pusher-php-server`) via Laravel's broadcasting driver. Configuration involves setting `BROADCAST_CONNECTION=pusher` and providing Pusher app credentials (key, secret, app_id, cluster) in `config/broadcasting.php`. Pusher handles all WebSocket infrastructure, scaling, and global edge delivery. The free tier supports 200 concurrent connections and 200K messages/day. Beyond free tier, pricing is usage-based per connection and message. Pusher webhooks provide server-side notifications for presence events, channel lifecycle, and client events.

## Core Concepts
Pusher acts as a managed relay: Laravel sends events to Pusher's HTTP API, and Pusher's edge network pushes them to connected clients. The Pusher PHP SDK (`pusher/pusher-php-server`) provides the server-side integration. On the client side, Laravel Echo connects to Pusher Channels via `pusher-js`. Pusher uses the Pusher protocol (which Reverb and Soketi also implement), making the client code identical regardless of backend. Key differences from Reverb: Pusher is managed (no server maintenance), globally distributed (edge network reduces latency), and usage-based pricing (can become expensive at scale).

## Mental Models
Pusher is a third-party WebSocket hosting service. Your Laravel app talks to Pusher via API calls; Pusher talks to your users' browsers via WebSocket. You never manage WebSocket connections directly—Pusher handles the infrastructure, and you pay for the convenience.

## Internal Mechanics
When Laravel broadcasts an event, the Pusher driver calls Pusher's REST API (`POST /apps/{app_id}/events`) with the channel name, event name, and payload. Pusher's servers then push the event to all connected clients subscribed to that channel. Client events (whispers) are sent directly from the browser to Pusher without hitting the Laravel server. Channel authorization is handled by Laravel via `/broadcasting/auth`. Pusher validates the auth signature to ensure the request came from the authorized server.

## Patterns
- **Managed service**: Zero infrastructure management for WebSocket servers
- **HTTP API broadcasting**: Laravel communicates with Pusher via REST, not persistent connections
- **Edge delivery**: Pusher's global network of Points of Presence reduces latency for geographically distributed users
- **Webhook-based integration**: Pusher notifies your server of events (presence joins/leaves, channel occupancy) via webhooks

## Architectural Decisions
- **External dependency**: Pusher is a third-party service; if Pusher is down, broadcasting is down
- **Usage-based cost scaling**: Pay-per-connection and pay-per-message; costs grow linearly with usage
- **Protocol lock-in**: The Pusher protocol is standard (implemented by Reverb and Soketi), but migration requires credential changes

## Tradeoffs
- **Cost at scale**: High-volume applications can experience significant monthly costs ($500+/month at 10k concurrent connections)
- **Data sovereignty**: Event data passes through Pusher's infrastructure; compliance requirements may restrict this
- **Latency overhead**: Each broadcast involves an HTTP round-trip from Laravel to Pusher (typically 10-50ms)
- **Connection limits on free tier**: 200 concurrent connections cap limits testing and small-scale deployments
- **No custom server configuration**: Limited control over WebSocket settings, timeouts, and protocols

## Performance Considerations
- Pusher's edge network reduces global latency compared to a single-region self-hosted Reverb
- HTTP API broadcasting adds latency vs Reverb's direct protocol publishing
- Pusher has per-app message rate limits (varies by plan); bursts may be throttled
- Connection limits per plan cap concurrent users; plan upgrades needed for growth

## Production Considerations
- Set `BROADCAST_CONNECTION=pusher` and configure credentials per environment
- Configure Pusher webhooks for presence event tracking and channel monitoring
- Implement webhook signature verification (`/pusher/webhook` endpoint) to prevent fake webhook calls
- Monitor Pusher usage dashboard for approaching connection/message limits
- Consider cost projections before committing to Pusher at scale; compare with Reverb or Ably
- Use `config/broadcasting.php` to set `curl_options` for custom timeout and connection settings

## Common Mistakes
- Leaving Pusher debug mode enabled in production (logs all API calls)
- Not setting up webhook verification, allowing forged webhook calls
- Exceeding message rate limits without handling the 420 (Rate Limit) error response
- Not monitoring connection limits, causing new users to fail to connect
- Using Pusher for internal-only applications where a self-hosted Reverb would be simpler and cheaper

## Failure Modes
- **Pusher service outage**: Broadcaster-side failure stops all event delivery (rare but historically occurred)
- **Rate limit hit**: Application exceeds Pusher API rate limits; events are queued or dropped
- **Connection limit reached**: New clients cannot connect until existing connections disconnect
- **Webhook delivery failure**: Pusher cannot reach your webhook endpoint; presence state becomes stale
- **Auth signature mismatch**: Misconfigured app secret causes all broadcasts to be rejected

## Ecosystem Usage
- Historically the default broadcasting driver before Reverb (Laravel 5.x through early Laravel 11.x)
- Still used by teams preferring managed infrastructure over self-hosted
- Popular for prototypes and MVPs due to free tier and zero-ops setup
- Used in enterprise environments where outsourcing WebSocket infrastructure is preferred
- Pusher Channels alternative to self-hosted Reverb and Soketi

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K07: Ably Integration & Enterprise Features
- K08: Soketi Self-Hosted Setup
- K01: Laravel Broadcasting Architecture

## Research Notes
Since Reverb's release (2024), Pusher usage in the Laravel ecosystem has declined for new projects. The `install:broadcasting` command defaults to Reverb unless the `--pusher` flag is used. Pusher Channels remains a solid choice for teams that want zero WebSocket infrastructure management and have budget for usage-based pricing. The Pusher protocol has become the de facto standard for Laravel broadcasting (implemented by Reverb, Soketi, and Pusher Channels), making migration between them a configuration change.
