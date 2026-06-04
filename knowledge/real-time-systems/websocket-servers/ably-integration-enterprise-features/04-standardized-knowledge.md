# Standardized Knowledge: Ably Integration & Enterprise Features

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K07 |
| Title | Ably Integration & Enterprise Features |
| Difficulty | Intermediate |
| Dependencies | K03, K06, K18, K38 |

## Overview
Ably is an enterprise-grade managed real-time platform that integrates with Laravel broadcasting as a first-party driver. Installation via `php artisan install:broadcasting --ably` scaffolds the Ably PHP SDK configuration. Ably differentiates through guaranteed message delivery (at-least-once, exactly-once), a global edge network across 205+ PoPs, multi-protocol support (WebSocket, SSE, MQTT, HTTP streaming), and built-in features like message history, presence, and Spaces (multi-user cursor/selection sync).

## Core Concepts
- Ably's architecture is channel-based (similar to Pusher) but with fundamentally different delivery guarantees
- Where Pusher and Reverb use fire-and-forget, Ably uses a global distributed queue with acknowledged delivery
- Ably channels support message history (configurable retention), presence (user state), and occupancy
- Token-based authentication: server generates ephemeral tokens for client connections
- The free tier provides 6M messages/month and 200 concurrent connections

## When To Use
- Enterprise applications requiring guaranteed message delivery and compliance certifications
- Multi-region applications needing global WebSocket edge distribution
- Applications requiring exactly-once delivery for financial or audit data
- Real-time collaboration features requiring Ably Spaces (shared cursors, selections)
- IoT applications using MQTT protocol alongside WebSocket broadcasting

## When NOT To Use
- Simple server-to-client broadcasting where Reverb suffices (Ably is overkill)
- Applications needing self-hosted control (Ably is exclusively managed)
- Cost-sensitive applications at extreme scale (enterprise pricing is premium)
- Teams that don't need guaranteed delivery or global edge distribution

## Best Practices (Why)
- **Use token authentication for client connections**: Never expose the `ABLY_KEY` in client code; generate ephemeral tokens server-side
- **Set `ABLY_LOG_LEVEL=error` in production**: Debug logging is extremely verbose and impacts performance
- **Configure message retention based on requirements**: Retention policy controls storage costs; balance compliance needs with budget
- **Implement Ably webhooks**: Monitor presence events, channel lifecycle, and error states
- **Use channel rules for encryption**: Encrypt messages at rest and in transit for sensitive data

## Architecture Guidelines
- Ably uses a custom broadcast driver (`Ably\Laravel\Broadcaster`), not the generic Pusher driver
- The `--ably` flag in `install:broadcasting` was added in Laravel 11
- Some Ably features (history, Spaces, exactly-once) are not exposed through Laravel's generic broadcasting interface
- Client-side Echo connects to Ably via the Pusher protocol or the Ably SDK directly

## Performance Considerations
- Global edge network reduces latency for geographically distributed users
- Guaranteed delivery adds acknowledgment overhead vs fire-and-forget
- Ably claims <20ms global publish latency from any edge location
- Message history consumes storage; retention policy controls costs
- Channel occupancy tracking adds minimal overhead

## Security Considerations
- Never expose `ABLY_KEY` in client-side code—use token authentication
- Ably provides SOC 2, HIPAA, and GDPR compliance certifications
- Channel rules support encryption at rest and in transit
- Token-based authentication ensures clients have scoped access

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Exposing Ably API key in client | Full API access leaked | Not using token auth | Unauthorized access | Always use server-generated tokens |
| No message retention limits | Unbounded storage growth | Not configuring retention | Rising costs, performance issues | Set retention based on needs |
| Ably for simple broadcasting | Over-engineered for basic needs | Not evaluating alternatives | Higher cost, complexity | Use Reverb for simple server-to-client |
| Not handling rate limits | HTTP 429 not handled gracefully | Missing error handling | Events dropped | Implement retry with backoff |
| Assuming full feature exposure | Laravel broadcast interface doesn't expose Ably's enterprise features | Expecting feature parity | Missing history, Spaces | Use Ably SDK directly for advanced features |

## Anti-Patterns
- **Using Ably's Pusher protocol mode when the Ably SDK is available**: The Ably SDK provides access to enterprise features not available through the Pusher protocol compatibility layer
- **Not testing token expiry behavior**: Client tokens expire; if renewal isn't implemented, connections drop
- **Assuming Ably pricing matches Pusher**: Ably's free tier (6M messages/month) is more generous, but enterprise pricing is premium

## Examples

### Ably environment configuration
```env
BROADCAST_CONNECTION=ably
ABLY_KEY=your-ably-api-key
ABLY_LOG_LEVEL=error
```

### Token authentication (server-side)
```php
// Generate a token for client connection
$ably = new Ably\AblyRest(env('ABLY_KEY'));
$token = $ably->auth->createTokenRequest([
    'clientId' => $user->id,
    'capability' => [
        'chat:*' => ['subscribe', 'publish', 'presence'],
    ],
]);

return response()->json($token);
```

## Related Topics
- K03: Reverb Installation & Configuration
- K06: Pusher Channels Integration
- K18: WebSocket vs SSE vs Polling Decision Framework
- K38: Serverless WebSocket Limitations

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Ably's Spaces feature (multi-user cursor sync) is a unique differentiator for collaborative applications
- The 6M messages/month free tier is significantly more generous than Pusher's 200K/day
- As of 2026, Ably has 205+ edge PoPs globally and supports multi-protocol connections including MQTT

## Verification
- [ ] `BROADCAST_CONNECTION=ably` configured
- [ ] Token authentication implemented for client connections
- [ ] `ABLY_LOG_LEVEL=error` in production
- [ ] Message retention limits configured
- [ ] Webhooks set up for presence and error monitoring
- [ ] Channel encryption rules configured for sensitive data
- [ ] Rate limit handling implemented
- [ ] Cost projections modeled for expected scale
