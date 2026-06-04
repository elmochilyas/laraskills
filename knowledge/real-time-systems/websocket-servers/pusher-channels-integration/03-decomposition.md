# Decomposition: Pusher Channels Integration

## Topic Overview
Pusher Channels is a managed WebSocket service that was the default broadcasting backend for Laravel before Reverb. Integration uses the Pusher PHP SDK (`pusher/pusher-php-server`) via Laravel's broadcasting driver. Configuration involves setting `BROADCAST_CONNECTION=pusher` and providing Pusher app credentials (key, secret, app_id, cluster) in `config/broadcasting.php`. Pusher handles all WebSocket infrastructure, scaling, and global edge delivery. The free tier supports 200 concurrent conn...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K06-pusher-channels-integration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Pusher Channels Integration
- **Purpose:** Pusher Channels is a managed WebSocket service that was the default broadcasting backend for Laravel before Reverb. Integration uses the Pusher PHP SDK (`pusher/pusher-php-server`) via Laravel's broadcasting driver. Configuration involves setting `BROADCAST_CONNECTION=pusher` and providing Pusher app credentials (key, secret, app_id, cluster) in `config/broadcasting.php`. Pusher handles all WebSocket infrastructure, scaling, and global edge delivery. The free tier supports 200 concurrent conn...
- **Difficulty:** Foundation
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K07: Ably Integration & Enterprise Features
  - K08: Soketi Self-Hosted Setup
  - K01: Laravel Broadcasting Architecture

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K07: Ably Integration & Enterprise Features
  - K08: Soketi Self-Hosted Setup
  - K01: Laravel Broadcasting Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Managed service**: Zero infrastructure management for WebSocket servers**HTTP API broadcasting**: Laravel communicates with Pusher via REST, not persistent connections**Edge delivery**: Pusher's global network of Points of Presence reduces latency for geographically distributed users**Webhook-based integration**: Pusher notifies your server of events (presence joins/leaves, channel occupancy) via webhooks**External dependency**: Pusher is a third-party service; if Pusher is down, broadcasting is down**Usage-based cost scaling**: Pay-per-connection and pay-per-message; costs grow linearly with usage**Protocol lock-in**: The Pusher protocol is standard (implemented by Reverb and Soketi), but migration requires credential changes**Cost at scale**: High-volume applications can experience significant monthly costs ($500+/month at 10k concurrent connections)**Data sovereignty**: Event data passes through Pusher's infrastructure; compliance requirements may restrict this**Latency overhead**: Each broadcast involves an HTTP round-trip from Laravel to Pusher (typically 10-50ms)**Connection limits on free tier**: 200 concurrent connections cap limits testing and small-scale deployments**No custom server configuration**: Limited control over WebSocket settings, timeouts, and protocolsPusher's edge network reduces global latency compared to a single-region self-hosted ReverbHTTP API broadcasting adds latency vs Reverb's direct protocol publishingPusher has per-app message rate limits (varies by plan); bursts may be throttledConnection limits per plan cap concurrent users; plan upgrades needed for growthSet `BROADCAST_CONNECTION=pusher` and configure credentials per environmentConfigure Pusher webhooks for presence event tracking and channel monitoringImplement webhook signature verification (`/pusher/webhook` endpoint) to prevent fake webhook callsMonitor Pusher usage dashboard for approaching connection/message limitsConsider cost projections before committing to Pusher at scale; compare with Reverb or AblyUse `config/broadcasting.php` to set `curl_options` for custom timeout and connection settingsLeaving Pusher debug mode enabled in production (logs all API calls)Not setting up webhook verification, allowing forged webhook callsExceeding message rate limits without handling the 420 (Rate Limit) error responseNot monitoring connection limits, causing new users to fail to connectUsing Pusher for internal-only applications where a self-hosted Reverb would be simpler and cheaper**Pusher service outage**: Broadcaster-side failure stops all event delivery (rare but historically occurred)**Rate limit hit**: Application exceeds Pusher API rate limits; events are queued or dropped**Connection limit reached**: New clients cannot connect until existing connections disconnect**Webhook delivery failure**: Pusher cannot reach your webhook endpoint; presence state becomes stale**Auth signature mismatch**: Misconfigured app secret causes all broadcasts to be rejectedHistorically the default broadcasting driver before Reverb (Laravel 5.x through early Laravel 11.x)Still used by teams preferring managed infrastructure over self-hostedPopular for prototypes and MVPs due to free tier and zero-ops setupUsed in enterprise environments where outsourcing WebSocket infrastructure is preferredPusher Channels alternative to self-hosted Reverb and SoketiK03: Reverb Installation & ConfigurationK07: Ably Integration & Enterprise FeaturesK08: Soketi Self-Hosted SetupK01: Laravel Broadcasting Architecture

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization