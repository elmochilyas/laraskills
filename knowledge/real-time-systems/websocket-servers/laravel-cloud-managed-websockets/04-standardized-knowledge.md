# Standardized Knowledge: Laravel Cloud Managed WebSockets

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K28 |
| Title | Laravel Cloud Managed WebSockets |
| Difficulty | Foundation |
| Dependencies | K03, K27, K04, K33 |

## Overview
Laravel Cloud is Laravel's official platform-as-a-service offering that includes fully managed WebSocket infrastructure powered by Laravel Reverb clusters. It eliminates the operational overhead of running Reverb—no need to configure Supervisor, Nginx, or process management. Connection scaling is handled automatically. Pricing is based on connections and bandwidth rather than server instances.

## Core Concepts
- Laravel Cloud abstracts the entire WebSocket infrastructure layer
- Developers write standard Laravel broadcasting code (events, channels, Echo) and Laravel Cloud provides the Reverb backend automatically
- The platform scales Reverb instances up/down based on connection demand without manual intervention
- No need to configure `REVERB_SERVER_HOST`, `REVERB_SERVER_PORT`, or Supervisor configuration files
- Laravel Cloud provides a dashboard for monitoring WebSocket connection counts, message throughput, and error rates

## When To Use
- New Laravel applications wanting zero-infrastructure WebSocket deployment
- Teams already using Laravel Cloud for hosting, wanting unified platform management
- Prototypes and MVPs that need real-time features without operational overhead
- Applications expecting variable traffic patterns that benefit from auto-scaling
- Organizations without dedicated DevOps resources for WebSocket infrastructure management

## When NOT To Use
- Teams needing full control over Reverb configuration and tuning
- High-volume applications where usage-based pricing may be less cost-effective than self-hosting
- Applications requiring custom Reverb server configurations not exposed by the platform
- Teams already invested in self-hosted Reverb infrastructure with operational expertise

## Best Practices (Why)
- **Use standard Reverb environment variables**: Laravel Cloud reads these to configure the managed backend—no custom config needed
- **Monitor connection pricing**: Usage-based costs can scale with traffic; track to avoid unexpected charges
- **Test geographic latency**: If user base is global, verify that the platform's edge distribution meets latency requirements
- **Configure proper channel authorization**: Laravel Cloud handles WebSocket infrastructure, but auth logic remains application responsibility
- **Have a migration fallback plan**: If migrating off Laravel Cloud, document the steps to self-hosted Reverb

## Architecture Guidelines
- Laravel Cloud runs Reverb internally, abstracting version management, patching, and updates
- The platform handles TLS termination at the edge and sticky session routing
- Standard broadcasting code does not change—events, channels, and Echo work identically
- Auth logic remains the application's responsibility regardless of the hosting platform

## Performance Considerations
- Edge delivery via Laravel Cloud's global network (lower latency than single-region self-hosted)
- Auto-scaling handles traffic spikes without manual capacity planning
- Bandwidth costs for high-volume applications may exceed self-hosted alternatives
- Connection limits per plan tier require monitoring and upgrades as usage grows

## Security Considerations
- Laravel Cloud manages TLS termination and WSS transport security automatically
- Channel authorization remains the application's responsibility
- Allowed origins and other security policies should still be configured in the application
- Platform security patches are applied automatically by Laravel Cloud

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming no config needed | Auth, channels, Echo still require setup | Misunderstanding managed vs. application responsibility | Missing auth, no events delivered | Configure broadcasting code as normal |
| Not monitoring connection limits | Throttled or blocked at plan cap | Ignoring plan limits | Users cannot connect | Monitor usage against plan limits |
| Overlooking geographic latency | Global users may have high latency | Not testing from different regions | Poor user experience | Test latency from target regions |
| Not understanding pricing model | Surprise charges from scaling events | Not reading pricing docs | Budget overrun | Understand connection vs message vs bandwidth costs |
| Expecting full Reverb control | Platform doesn't expose advanced settings | Assuming self-hosted parity | Cannot tune specific behaviors | Use self-hosted Reverb for advanced config needs |

## Anti-Patterns
- **Assuming managed WebSockets means no broadcasting knowledge needed**: You still need to understand channels, auth, Echo, and events—only the infrastructure is managed
- **Not planning for migration off Laravel Cloud**: If requirements outgrow the platform, having a documented migration path prevents lock-in
- **Ignoring pricing model differences from self-hosted**: Usage-based pricing behaves differently from fixed-cost self-hosting; model both scenarios

## Examples

### Laravel Cloud broadcasting setup
```env
# Standard Reverb env vars—Laravel Cloud reads these
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=app-id
REVERB_APP_KEY=app-key
REVERB_APP_SECRET=app-secret
```

### Echo configuration for Laravel Cloud
```javascript
// Standard Echo config—no Laravel Cloud-specific changes
const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: true,
});
```

## Related Topics
- K03: Reverb Installation & Configuration
- K27: Supervisor & Production Process Management
- K04: Reverb Horizontal Scaling via Redis
- K33: Dedicated Reverb Fleet Architecture

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Laravel Cloud's managed WebSocket offering was launched late 2024/early 2025
- As of 2026, it is still emerging with maturing best practices
- The key differentiator from Forge deployments: no server-level configuration needed
- Makes Laravel competitive with platforms like Vercel (for SSE) and Railway (for basic WebSocket)

## Verification
- [ ] Standard Reverb env vars configured for Laravel Cloud
- [ ] Broadcasting code (events, channels, Echo) written as normal
- [ ] Channel authorization implemented
- [ ] Connection usage monitored against plan limits
- [ ] Geographic latency tested for target user regions
- [ ] Pricing model understood (connections, messages, bandwidth)
- [ ] Migration plan documented (Laravel Cloud -> self-hosted Reverb)
