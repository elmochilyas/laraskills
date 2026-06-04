# Standardized Knowledge: Pusher Channels Integration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K06 |
| Title | Pusher Channels Integration |
| Difficulty | Foundation |
| Dependencies | K03, K07, K08, K01 |

## Overview
Pusher Channels is a managed WebSocket service that was the default broadcasting backend for Laravel before Reverb. Integration uses the Pusher PHP SDK via Laravel's broadcasting driver. Configuration involves setting `BROADCAST_CONNECTION=pusher` and providing Pusher app credentials in `config/broadcasting.php`. Pusher handles all WebSocket infrastructure, scaling, and global edge delivery.

## Core Concepts
- Pusher acts as a managed relay: Laravel sends events to Pusher's HTTP API, and Pusher's edge network pushes them to connected clients
- The Pusher PHP SDK (`pusher/pusher-php-server`) provides server-side integration
- On the client side, Echo connects to Pusher Channels via `pusher-js`
- Pusher uses the Pusher protocol (implemented by Reverb and Soketi), making client code identical regardless of backend
- Webhooks provide server-side notifications for presence events, channel lifecycle, and client events

## When To Use
- Teams preferring managed infrastructure over self-hosted WebSocket servers
- Prototypes and MVPs needing quick real-time features (free tier: 200 concurrent connections, 200K messages/day)
- Applications with geographically distributed user bases (Pusher's edge network)
- Enterprise environments where outsourcing WebSocket infrastructure is preferred

## When NOT To Use
- Cost-sensitive high-volume applications (Pusher costs $500+/month at 10k concurrent connections)
- Applications with data sovereignty requirements (event data passes through Pusher infrastructure)
- Internal-only applications where self-hosted Reverb is simpler and cheaper
- Applications requiring custom WebSocket server configuration

## Best Practices (Why)
- **Set `BROADCAST_CONNECTION=pusher` per environment**: Different credentials for development, staging, and production
- **Configure Pusher webhooks**: Enable presence event tracking and channel monitoring; implement signature verification to prevent forged webhook calls
- **Monitor Pusher usage dashboard**: Track approaching connection/message limits to plan upgrades before hitting caps
- **Consider cost projections before committing**: At scale, compare with Reverb (self-hosted) or Ably (managed) for cost-effectiveness
- **Use `curl_options` in broadcast config**: Set custom timeout and connection settings for Pusher HTTP API calls

## Architecture Guidelines
- Pusher is an external dependency—if Pusher is down, broadcasting is down
- HTTP API broadcasting adds latency vs Reverb's direct protocol publishing (10-50ms round trip)
- Pusher protocol is standard; migration between Pusher, Reverb, and Soketi is a configuration change
- Channel authorization is handled by Laravel via `/broadcasting/auth` regardless of the broadcast driver

## Performance Considerations
- Pusher edge network reduces global latency compared to single-region self-hosted Reverb
- HTTP API broadcasting adds latency vs Reverb's direct protocol publishing
- Pusher has per-app message rate limits (varies by plan); bursts may be throttled
- Connection limits per plan cap concurrent users

## Security Considerations
- Pusher webhook endpoint must verify HMAC signatures to prevent forged webhook calls
- App key/secret must be kept confidential—never exposed in client-side code
- Pusher supports private and presence channel authorization via Laravel's auth endpoint
- Debug mode should be disabled in production (logs all API calls)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Debug mode in production | Logs all Pusher API calls | Dev config left in production | Performance impact, log noise | Disable debug in production |
| No webhook verification | Forged webhook calls accepted | Missing signature check | Fake presence events | Verify HMAC signature on webhook endpoint |
| No monitoring of limits | New users fail to connect at limit | Not tracking usage | Connection failures | Monitor dashboard; upgrade plan proactively |
| Pusher for internal apps | Self-hosted would be simpler/cheaper | Not evaluating alternatives | Unnecessary cost | Use Reverb for self-hosted internal apps |

## Anti-Patterns
- **Not handling HTTP 429 rate limit errors**: Pusher enforces API rate limits; handle 429 responses with backoff
- **Exposing Pusher key/secret in client code**: The app key is public (used by Echo), but the secret must never leave the server
- **Assuming Pusher pricing is linear**: High-volume applications can experience significant monthly costs; model costs before scaling

## Examples

### Pusher configuration
```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=mt1
```

### Pusher webhook verification
```php
// routes/web.php
Route::post('/pusher/webhook', function (Request $request) {
    $webhook = new PusherWebhook($request);
    if (!$webhook->isValid()) {
        abort(401, 'Invalid webhook signature');
    }
    // Process webhook events
    foreach ($webhook->getEvents() as $event) {
        Log::info('Pusher event:', $event);
    }
});
```

## Related Topics
- K03: Reverb Installation & Configuration
- K07: Ably Integration & Enterprise Features
- K08: Soketi Self-Hosted Setup
- K01: Laravel Broadcasting Architecture

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Since Reverb's release (2024), Pusher usage in the Laravel ecosystem has declined for new projects
- The `install:broadcasting` command defaults to Reverb unless `--pusher` flag is used
- Pusher protocol has become the de facto standard for Laravel broadcasting, making migration a configuration change

## Verification
- [ ] `BROADCAST_CONNECTION=pusher` configured
- [ ] Pusher credentials set per environment
- [ ] Webhook endpoint configured with signature verification
- [ ] Debug mode disabled in production
- [ ] Usage dashboard monitored for approaching limits
- [ ] Cost projections modeled for expected scale
- [ ] Rate limit handling implemented (HTTP 429)
- [ ] Migration path to Reverb understood (protocol compatible)
